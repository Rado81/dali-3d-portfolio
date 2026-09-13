export interface RingMotion {
  rotation: number;
  velocity: number; // radians per second
  /** Slot angle the spring is heading for; null right after a drag, until the fling is projected. */
  target: number | null;
}

export const FRAME_MS = 1000 / 60;
export const CLICK_MAX_PX = 6;
export const CLICK_MAX_MS = 200;

/** Scroll-style deceleration per millisecond (UIScrollView "normal"). */
export const DECELERATION = 0.998;
/** A fling never travels further than about three tiles, so nothing spins past unseen. */
export const MAX_FLING_RAD = 1.6;
/** Blend factor for the pointer velocity estimate; higher trusts the latest move more. */
const VELOCITY_SMOOTHING = 0.5;

/** Critically damped spring: no overshoot from rest, a small natural one after a fling. Response 0.6 s. */
const SPRING_RESPONSE_S = 0.6;
const OMEGA = (2 * Math.PI) / SPRING_RESPONSE_S;
const DAMPING_RATIO = 1;
const SUBSTEP_MS = 2;
const MAX_DT_MS = 100;
const SETTLE_EPS = 0.0005;
const SETTLE_VEL = 0.01;

/** A single wheel event at least this large is a mouse notch; smaller ones are trackpad scrolling. */
export const WHEEL_NOTCH_PX = 80;
/** Trackpad scrolling counts as over once no wheel event has arrived for this long. */
export const WHEEL_SCROLL_END_MS = 100;

export function idle(): RingMotion {
  return { rotation: 0, velocity: 0, target: null };
}

/** Horizontal field of view in radians for a vertical fov in degrees at the given aspect ratio. */
export function horizontalFov(verticalFovDeg: number, aspect: number): number {
  return 2 * Math.atan(Math.tan((verticalFovDeg * Math.PI) / 360) * aspect);
}

/** Radians of ring rotation per pointer pixel, so the tile in front of the camera follows the pointer 1:1. */
export function dragGain(widthPx: number, hfovRad: number): number {
  if (widthPx <= 0) return 0;
  return (2 * Math.tan(hfovRad / 2)) / widthPx;
}

export function dragBy(m: RingMotion, deltaPx: number, gain: number, dtMs: number): RingMotion {
  const d = -deltaPx * gain;
  const velocity =
    dtMs > 0 ? m.velocity + ((d / dtMs) * 1000 - m.velocity) * VELOCITY_SMOOTHING : m.velocity;
  return { rotation: m.rotation + d, velocity, target: null };
}

export function release(m: RingMotion): RingMotion {
  return { ...m, target: null };
}

/** Where a fling would come to rest, using exponential scroll decay, clamped to a few tiles. */
export function project(velocityRadPerSec: number): number {
  const travel = (velocityRadPerSec / 1000) * (DECELERATION / (1 - DECELERATION));
  return Math.max(-MAX_FLING_RAD, Math.min(MAX_FLING_RAD, travel));
}

/**
 * One frame. Without a target, the landing tile is chosen from the projected momentum and the
 * spring inherits the current velocity, so drag hands off into the settle without a seam.
 */
export function integrate(m: RingMotion, dtMs: number, snapTargetFor: (rotation: number) => number): RingMotion {
  const target = m.target ?? snapTargetFor(m.rotation + project(m.velocity));
  let x = m.rotation;
  let v = m.velocity;
  const total = Math.min(dtMs, MAX_DT_MS);
  const steps = Math.max(1, Math.ceil(total / SUBSTEP_MS));
  const dt = total / steps / 1000;
  for (let i = 0; i < steps; i++) {
    const a = -OMEGA * OMEGA * (x - target) - 2 * DAMPING_RATIO * OMEGA * v;
    v += a * dt;
    x += v * dt;
  }
  if (Math.abs(target - x) < SETTLE_EPS && Math.abs(v) < SETTLE_VEL) {
    x = target;
    v = 0;
  }
  return { rotation: x, velocity: v, target };
}

export function isSettled(m: RingMotion): boolean {
  return m.target !== null && m.rotation === m.target;
}

export function isClick(distancePx: number, durationMs: number): boolean {
  return distancePx <= CLICK_MAX_PX && durationMs <= CLICK_MAX_MS;
}

/**
 * A mouse wheel notch steps one tile through the spring; a trackpad scrolls the ring
 * continuously like a drag and settles once the events stop.
 */
export function wheelKind(deltaPx: number): "notch" | "scroll" {
  return Math.abs(deltaPx) >= WHEEL_NOTCH_PX ? "notch" : "scroll";
}
