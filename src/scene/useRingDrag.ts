import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, PerspectiveCamera } from "three";
import { useStore } from "../store";
import type { TileSlot } from "./layout";
import {
  dragBy, dragGain, horizontalFov, idle, isClick, release, wheelKind, type RingMotion,
  WHEEL_SCROLL_END_MS,
} from "./ringPhysics";
import { stepRing } from "./ringStep";

/** Normalises WheelEvent deltas to pixels (deltaMode 1 is lines, 2 is pages). */
const WHEEL_UNITS = [1, 40, 800];
/** A pointer that has been still this long before lifting carries no momentum. */
const STILL_BEFORE_UP_MS = 80;

/**
 * Drives `group.rotation.y` from pointer, wheel and keyboard state.
 * Writes `focusedIndex` to the store when the ring settles on a tile,
 * and follows `focusedIndex` when something else changes it.
 * The per-frame decisions live in `stepRing`; this owns the refs and listeners.
 */
export function useRingDrag(group: RefObject<Group | null>, slots: TileSlot[]): void {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const motion = useRef<RingMotion>(idle());
  const lastFocused = useRef<number>(-1);
  const slotsRef = useRef(slots);
  const lastSlots = useRef<TileSlot[]>(slots);
  const dragging = useRef<boolean>(false);
  const scrolling = useRef<boolean>(false);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    const el = gl.domElement;
    let startX = 0, startY = 0, lastX = 0, lastT = 0, startT = 0;
    let lastWheelT = 0, scrollEnd = 0;

    // the tile in front of the camera follows the pointer 1:1 for the current viewport and fov
    const gain = () => {
      const cam = camera as PerspectiveCamera;
      return dragGain(el.clientWidth, horizontalFov(cam.fov ?? 60, cam.aspect ?? 1));
    };
    const canDrag = () => useStore.getState().mode === "browse";

    const onDown = (e: PointerEvent) => {
      if (!canDrag()) return;
      dragging.current = true;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startT = lastT = performance.now();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // a pointer that is already gone (or a synthetic one) cannot be captured; the drag still works
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dt = now - lastT;
      lastX = e.clientX;
      lastT = now;
      if (useStore.getState().reducedMotion) return;
      motion.current = dragBy(motion.current, dx, gain(), dt);
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      const now = performance.now();
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const dur = now - startT;
      if (isClick(dist, dur)) {
        motion.current = { ...motion.current, velocity: 0, target: null };
        return; // Tile onClick handles selection
      }
      if (useStore.getState().reducedMotion) {
        const dir = e.clientX < startX ? 1 : -1;
        useStore.getState().step(dir);
        return;
      }
      if (now - lastT > STILL_BEFORE_UP_MS) motion.current = { ...motion.current, velocity: 0 };
      motion.current = release(motion.current);
    };
    const endScroll = () => {
      scrolling.current = false;
      motion.current = release(motion.current); // glide to the projected tile like a lifted finger
    };
    const onWheel = (e: WheelEvent) => {
      if (!canDrag()) return;
      e.preventDefault();
      const unit = WHEEL_UNITS[e.deltaMode] ?? 1;
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
      if (useStore.getState().reducedMotion || (wheelKind(delta) === "notch" && !scrolling.current)) {
        useStore.getState().step(delta > 0 ? 1 : -1); // the spring retargets, so fast wheeling flows across tiles
        return;
      }
      // trackpad: the ring follows the scroll 1:1 and settles once the events stop
      const now = performance.now();
      const dt = scrolling.current ? now - lastWheelT : 0;
      lastWheelT = now;
      scrolling.current = true;
      motion.current = dragBy(motion.current, -delta, gain(), dt);
      window.clearTimeout(scrollEnd);
      scrollEnd = window.setTimeout(endScroll, WHEEL_SCROLL_END_MS);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.style.touchAction = "none";
    el.dataset.ringReady = ""; // lets tests wait for the listeners rather than guess at frames
    return () => {
      delete el.dataset.ringReady;
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(scrollEnd);
      scrolling.current = false;
    };
  }, [gl, camera]);

  useFrame((_, delta) => {
    const s = useStore.getState();
    const current = slotsRef.current;
    if (current.length === 0) return;

    const slotsChanged = current !== lastSlots.current;
    if (slotsChanged) lastSlots.current = current;

    const out = stepRing({
      mode: s.mode,
      focusedIndex: s.focusedIndex,
      lastFocused: lastFocused.current,
      slots: current,
      slotsChanged,
      motion: motion.current,
      dragging: dragging.current || scrolling.current,
      reducedMotion: s.reducedMotion,
      dtMs: Math.min(delta * 1000, 100),
    });

    motion.current = out.motion;
    lastFocused.current = out.lastFocused;
    if (out.focusToWrite !== null) s.focus(out.focusToWrite);

    if (group.current) group.current.rotation.y = motion.current.rotation;
  });
}
