import { detectWebGL, isMobileViewport, fpsForMode } from "./device";

test("detectWebGL is false when no context can be created", () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = () => null;
  expect(detectWebGL()).toBe(false);
  HTMLCanvasElement.prototype.getContext = original;
});

test("detectWebGL is true when a webgl context exists", () => {
  const original = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error minimal stub
  HTMLCanvasElement.prototype.getContext = (kind: string) => (kind.startsWith("webgl") ? {} : null);
  expect(detectWebGL()).toBe(true);
  HTMLCanvasElement.prototype.getContext = original;
});

test("mobile breakpoint is 768", () => {
  expect(isMobileViewport(767)).toBe(true);
  expect(isMobileViewport(768)).toBe(false);
});

test("frame rate per mode", () => {
  expect(fpsForMode("intro")).toBe("always");
  expect(fpsForMode("browse")).toBe("always");
  expect(fpsForMode("panel")).toBe(30);
  expect(fpsForMode("watching")).toBe(10);
});
