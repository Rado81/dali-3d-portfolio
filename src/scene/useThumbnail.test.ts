import { loadThumbnail } from "./useThumbnail";

const HEIGHT_FOR_WIDTH: Record<number, number> = { 1280: 720, 640: 480, 480: 360, 120: 90 };

function fakeLoader(sizes: Record<string, number | "error">) {
  return {
    loadAsync: async (url: string) => {
      const size = sizes[url];
      if (size === "error" || size === undefined) throw new Error("404");
      return {
        image: { width: size, height: HEIGHT_FOR_WIDTH[size] },
        colorSpace: "",
        repeat: { set: vi.fn() },
        offset: { set: vi.fn() },
        dispose: vi.fn(),
      };
    },
  };
}

test("uses the first url when it is a real image", async () => {
  const t = await loadThumbnail(["a", "b"], fakeLoader({ a: 1280, b: 480 }) as never);
  expect((t?.image as { width?: number } | undefined)?.width).toBe(1280);
});

test("falls through when YouTube returns its 120px stand-in or an error", async () => {
  const t = await loadThumbnail(["a", "b"], fakeLoader({ a: 120, b: 480 }) as never);
  expect((t?.image as { width?: number } | undefined)?.width).toBe(480);
  const u = await loadThumbnail(["a", "b"], fakeLoader({ a: "error", b: 480 }) as never);
  expect((u?.image as { width?: number } | undefined)?.width).toBe(480);
});

test("returns null when every url fails", async () => {
  expect(await loadThumbnail(["a"], fakeLoader({}) as never)).toBeNull();
});

test("crops a 4:3 image (480x360) to 16:9 regardless of url", async () => {
  const t = await loadThumbnail(["x/sddefault.jpg"], fakeLoader({ "x/sddefault.jpg": 480 }) as never);
  expect(t?.repeat.set).toHaveBeenCalledWith(1, 0.75);
  expect(t?.offset.set).toHaveBeenCalledWith(0, 0.125);
});

test("does not crop a native 16:9 image (1280x720)", async () => {
  const t = await loadThumbnail(["x/maxresdefault.jpg"], fakeLoader({ "x/maxresdefault.jpg": 1280 }) as never);
  expect(t?.repeat.set).not.toHaveBeenCalled();
});
