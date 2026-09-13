import { DataTexture, LinearFilter, RGBAFormat } from "three";

/** One warm tone for every screen's light: the gold with most of its saturation taken out. */
export const SPILL_COLOR = "#d9c9a3";
/** Opacity of the halo behind a focused tile. It is additive, so this is the light added at the halo's centre. */
export const SPILL_MAX_OPACITY = 0.12;
/** The halo as multiples of the tile: wider than the tile and much taller, reaching into the bands above and below. */
export const SPILL_W = 2.4;
export const SPILL_H = 3.2;
export const SPILL_TEXTURE_SIZE = 128;

/** Light at a normalised distance from the tile's centre: full at 0, gone at 1, no step at either end. */
export function spillFalloff(d: number): number {
  if (d >= 1) return 0;
  const k = 1 - d * d;
  return k * k;
}

/** How much light a tile spills for its tint (0.45 dimmed, 0.75 idle, 1 focused): squared, so a dimmed room goes quiet. */
export function spillOpacity(tint: number): number {
  return SPILL_MAX_OPACITY * tint * tint;
}

/** RGBA pixels of a white square whose alpha is spillFalloff of the distance from the centre. */
export function spillAlpha(size: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot((x - c) / c, (y - c) / c);
      data.set([255, 255, 255, Math.round(spillFalloff(d) * 255)], (y * size + x) * 4);
    }
  }
  return data;
}

let texture: DataTexture | null = null;

/** The halo texture, built once and shared by every tile. */
export function spillTexture(): DataTexture {
  if (!texture) {
    texture = new DataTexture(spillAlpha(SPILL_TEXTURE_SIZE), SPILL_TEXTURE_SIZE, SPILL_TEXTURE_SIZE, RGBAFormat);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
  }
  return texture;
}
