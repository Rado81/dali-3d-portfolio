import type { Mode } from "../store";

type Vec3 = [number, number, number];

/** The projector: behind and above the browse camera, which sits at the origin looking down -z. */
export const BEAM_APEX: Vec3 = [-0.9, 4.6, 10.5];
/** Where it is aimed: the middle of the focused tile, which is always the one in front of the camera. */
export const BEAM_TARGET: Vec3 = [0, 0.1, -6];
/** Tangent of the cone's half-angle. The light is full out to 0.7 of the cone's radius and gone at 1.05. */
export const BEAM_TAN = 0.11;
/** Linear light added per unit of dust-weighted density along a view ray. */
export const BEAM_INTENSITY = 0.015;
/** A warm projector white, and the motes that catch it. */
export const BEAM_COLOR = "#fff0d2";
export const MOTE_COLOR = "#fff2dc";
export const MOTE_COUNT = 320;
/** The air the motes drift in: between the camera and the front of the ring, a little above and below the tiles. */
export const MOTE_BOX_MIN: Vec3 = [-4.5, -2.2, -5.6];
export const MOTE_BOX_MAX: Vec3 = [4.5, 3.6, 1.0];
/** Size of the repeating dust volume the beam's texture and light rays are sampled from. */
export const DUST_SIZE = 32;
/** The camera's spring, so the beam arrives with the camera and leaves with it. */
export const BEAM_FADE = { tension: 120, friction: 30 };

/** The projector runs for the ring only; the title card, the panels and the player keep what they have. */
export function beamVisible(mode: Mode): boolean {
  return mode === "browse";
}

export function beamAxis(): Vec3 {
  const d = BEAM_TARGET.map((v, i) => v - BEAM_APEX[i]);
  const length = Math.hypot(d[0], d[1], d[2]);
  return [d[0] / length, d[1] / length, d[2] / length];
}

/** Ray-march steps through the beam; phones take fewer. The jitter and the soft upscale hide the steps. */
export function beamSteps(isMobile: boolean): number {
  return isMobile ? 12 : 16;
}

/** The beam is marched at this fraction of the canvas's CSS size and scaled up; it has no edge sharp enough to lose. */
export const BEAM_RESOLUTION = 0.25;

/** A projector's flicker: within 1.25% either way, holding each level for one film frame at 24 fps. */
export function beamFlicker(timeS: number): number {
  const x = Math.sin(Math.floor(timeS * 24) * 12.9898) * 43758.5453;
  return 1 + 0.025 * (x - Math.floor(x) - 0.5);
}

/** Random bytes for a small repeating volume; with trilinear filtering the GPU turns them into smooth value noise. */
export function dustVolume(size: number): Uint8Array {
  const data = new Uint8Array(size * size * size);
  let seed = 20260913;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed >> 7) & 255;
  }
  return data;
}
