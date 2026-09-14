import { outputDither } from "./dither";

test("dither is half an output level: 1/255 straight to the canvas, a tenth of that in the composer's linear buffer", () => {
  expect(outputDither(false)).toBeCloseTo(1 / 255, 9);
  expect(outputDither(true)).toBeCloseTo(1 / 2550, 9);
});
