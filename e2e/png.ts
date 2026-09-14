import { inflateSync } from "node:zlib";

/** A decoded 8-bit, non-interlaced PNG, as Playwright screenshots are: rows of RGB or RGBA bytes. */
export interface Png {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
}

/** A rectangle in fractions of the image, so the same probe works at any viewport size. */
export interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

export function decodePng(buf: Buffer): Png {
  if (buf.toString("ascii", 1, 4) !== "PNG") throw new Error("not a PNG");
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat: Buffer[] = [];
  for (let off = 8; off < buf.length; ) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const chunk = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") idat.push(chunk);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const channels = CHANNELS[colorType];
  if (bitDepth !== 8 || interlace !== 0 || !channels) throw new Error(`unsupported PNG: depth ${bitDepth}, colour type ${colorType}, interlace ${interlace}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const data = new Uint8Array(stride * height);
  let inPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[inPos++];
    const row = y * stride;
    const prev = row - stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[inPos++];
      const a = x >= channels ? data[row + x - channels] : 0;
      const b = y > 0 ? data[prev + x] : 0;
      const c = x >= channels && y > 0 ? data[prev + x - channels] : 0;
      let predicted: number;
      switch (filter) {
        case 0: predicted = 0; break;
        case 1: predicted = a; break;
        case 2: predicted = b; break;
        case 3: predicted = (a + b) >> 1; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          predicted = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default: throw new Error(`bad PNG filter ${filter} on row ${y}`);
      }
      data[row + x] = (v + predicted) & 0xff;
    }
  }
  return { width, height, channels, data };
}

function* pixels(png: Png, r: Region): Generator<number> {
  const x0 = Math.floor(r.x0 * png.width), x1 = Math.floor(r.x1 * png.width);
  const y0 = Math.floor(r.y0 * png.height), y1 = Math.floor(r.y1 * png.height);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) yield (y * png.width + x) * png.channels;
}

/** Average of the red, green and blue values over the region, 0 to 255. */
export function meanLuma(png: Png, r: Region): number {
  let sum = 0, n = 0;
  for (const i of pixels(png, r)) {
    sum += png.data[i] + png.data[i + 1] + png.data[i + 2];
    n += 3;
  }
  return n ? sum / n : 0;
}

/** Average absolute difference of the red, green and blue values between two same-sized shots over the region. */
export function meanAbsDiff(a: Png, b: Png, r: Region): number {
  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) throw new Error("screenshots differ in size");
  let sum = 0, n = 0;
  for (const i of pixels(a, r)) {
    for (let c = 0; c < 3; c++) sum += Math.abs(a.data[i + c] - b.data[i + c]);
    n += 3;
  }
  return n ? sum / n : 0;
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance over the region at a percentile from 0 to 1; a high one ignores grain and dither specks. */
export function luminanceAt(png: Png, r: Region, percentile: number): number {
  const values: number[] = [];
  for (const i of pixels(png, r)) values.push(0.2126 * channel(png.data[i]) + 0.7152 * channel(png.data[i + 1]) + 0.0722 * channel(png.data[i + 2]));
  values.sort((a, b) => a - b);
  return values[Math.min(values.length - 1, Math.floor(percentile * values.length))];
}
