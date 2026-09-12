import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { useStore } from "../store";
import { nearestIndex, type TileSlot } from "./layout";
import {
  addWheel, dragBy, idle, isClick, release, type RingMotion,
  DRAG_GAIN_DESKTOP, DRAG_GAIN_TOUCH,
} from "./ringPhysics";
import { stepRing } from "./ringStep";

const ROW_SWITCH_PX = 40;

/**
 * Drives `group.rotation.y` from pointer, wheel and keyboard state.
 * Writes `focusedIndex` to the store when the ring settles on a tile,
 * and follows `focusedIndex` when something else changes it.
 * The per-frame decisions live in `stepRing`; this owns the refs and listeners.
 */
export function useRingDrag(group: RefObject<Group | null>, slots: TileSlot[]): void {
  const gl = useThree((s) => s.gl);
  const motion = useRef<RingMotion>(idle());
  const lastFocused = useRef<number>(-1);
  const slotsRef = useRef(slots);
  const lastSlots = useRef<TileSlot[]>(slots);
  const dragging = useRef<boolean>(false);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    const el = gl.domElement;
    let startX = 0, startY = 0, lastX = 0, startT = 0, rowSwitched = false;

    const gain = () => (useStore.getState().isMobile ? DRAG_GAIN_TOUCH : DRAG_GAIN_DESKTOP);
    const canDrag = () => useStore.getState().mode === "browse";

    const onDown = (e: PointerEvent) => {
      if (!canDrag()) return;
      dragging.current = true;
      rowSwitched = false;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (useStore.getState().reducedMotion) return;
      motion.current = dragBy(motion.current, dx, gain());
      const dy = e.clientY - startY;
      if (!rowSwitched && Math.abs(dy) > ROW_SWITCH_PX && Math.abs(dy) > Math.abs(e.clientX - startX)) {
        rowSwitched = true;
        switchRow(dy > 0 ? 1 : 0);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const dur = performance.now() - startT;
      if (isClick(dist, dur)) {
        motion.current = { ...motion.current, velocity: 0, target: null };
        return; // Tile onClick handles selection
      }
      if (useStore.getState().reducedMotion) {
        const dir = e.clientX < startX ? 1 : -1;
        useStore.getState().step(dir);
        return;
      }
      motion.current = release(motion.current);
    };
    const onWheel = (e: WheelEvent) => {
      if (!canDrag()) return;
      e.preventDefault();
      if (e.shiftKey) {
        switchRow((e.deltaY || e.deltaX) > 0 ? 1 : 0);
        return;
      }
      if (useStore.getState().reducedMotion) {
        useStore.getState().step(e.deltaY + e.deltaX > 0 ? 1 : -1);
        return;
      }
      motion.current = addWheel(motion.current, e.deltaX, e.deltaY);
    };
    const switchRow = (row: number) => {
      const s = useStore.getState();
      const current = slotsRef.current[s.focusedIndex];
      if (!current || current.row === row) return;
      const idx = nearestIndex(motion.current.rotation, slotsRef.current, row);
      if (idx !== -1) s.focus(idx);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.style.touchAction = "none";
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

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
      dragging: dragging.current,
      reducedMotion: s.reducedMotion,
      dtMs: Math.min(delta * 1000, 100),
    });

    motion.current = out.motion;
    lastFocused.current = out.lastFocused;
    if (out.focusToWrite !== null) s.focus(out.focusToWrite);

    if (group.current) group.current.rotation.y = motion.current.rotation;
  });
}
