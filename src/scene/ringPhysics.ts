export interface RingMotion {
  rotation: number;
  velocity: number; // radians per 60 fps frame
  target: number | null;
}

export const DRAG_GAIN_DESKTOP = 0.006;
export const DRAG_GAIN_TOUCH = 0.012;
export const WHEEL_GAIN = 0.0015;
export const DECAY = 0.92;
export const SNAP_VELOCITY = 0.002;
export const SNAP_TAU_MS = 80;
export const CLICK_MAX_PX = 6;
export const CLICK_MAX_MS = 200;
export const FRAME_MS = 1000 / 60;
const SETTLE_EPS = 0.0005;

export function idle(): RingMotion {
  return { rotation: 0, velocity: 0, target: null };
}

export function dragBy(m: RingMotion, deltaPx: number, gain: number): RingMotion {
  const d = -deltaPx * gain;
  return { rotation: m.rotation + d, velocity: d, target: null };
}

export function release(m: RingMotion): RingMotion {
  return { ...m, target: null };
}

export function addWheel(m: RingMotion, deltaX: number, deltaY: number): RingMotion {
  return { ...m, velocity: m.velocity + (deltaX + deltaY) * WHEEL_GAIN, target: null };
}

export function integrate(m: RingMotion, dtMs: number, snapTargetFor: (rotation: number) => number): RingMotion {
  const frames = dtMs / FRAME_MS;
  if (m.target === null) {
    let rotation = m.rotation + m.velocity * frames;
    let velocity = m.velocity * Math.pow(DECAY, frames);
    let target: number | null = null;
    if (Math.abs(velocity) < SNAP_VELOCITY) {
      velocity = 0;
      target = snapTargetFor(rotation);
    }
    return { rotation, velocity, target };
  }
  const k = 1 - Math.exp(-dtMs / SNAP_TAU_MS);
  let rotation = m.rotation + (m.target - m.rotation) * k;
  if (Math.abs(m.target - rotation) < SETTLE_EPS) rotation = m.target;
  return { rotation, velocity: 0, target: m.target };
}

export function isSettled(m: RingMotion): boolean {
  return m.target !== null && m.rotation === m.target;
}

export function isClick(distancePx: number, durationMs: number): boolean {
  return distancePx <= CLICK_MAX_PX && durationMs <= CLICK_MAX_MS;
}
