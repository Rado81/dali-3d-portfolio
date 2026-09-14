/**
 * Dither of about half an output level breaks the banding a slow dark gradient would otherwise show.
 * Straight to the screen that is half of 1/255; through the composer the frame is still linear when it is
 * drawn and is encoded later, where one output level in the darks is roughly a tenth of that.
 */
export function outputDither(composer: boolean): number {
  return composer ? 1 / 2550 : 1 / 255;
}
