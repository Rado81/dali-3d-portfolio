import { useStore, resetStore } from "./store";
import { stateToHash, applyHash, initRouting } from "./routes";

beforeEach(() => {
  resetStore();
  window.history.replaceState(null, "", "#/");
});

test("stateToHash covers every mode", () => {
  const s = useStore.getState;
  expect(stateToHash(s())).toBe("#/");
  s().enter();
  expect(stateToHash(s())).toBe("#/work/dali-showreel");
  s().focus(8);
  expect(stateToHash(s())).toBe("#/work/vlaska-teaser");
  s().play("KduVhrnIQI4");
  expect(stateToHash(s())).toBe("#/play/vlaska-teaser");
  s().stopPlaying();
  s().openPanel("about");
  expect(stateToHash(s())).toBe("#/about");
  s().openPanel("journal");
  expect(stateToHash(s())).toBe("#/journal");
  s().openPanel("journal", "behind-the-scenes-the-last-horizon");
  expect(stateToHash(s())).toBe("#/journal/behind-the-scenes-the-last-horizon");
});

test("applyHash opens work, project, play, panels, and journal posts", () => {
  applyHash("#/work");
  expect(useStore.getState().mode).toBe("browse");

  applyHash("#/work/orsted-geo");
  expect(useStore.getState().focusedIndex).toBe(3);

  applyHash("#/play/carlsberg-vuvuzela");
  expect(useStore.getState().mode).toBe("watching");
  expect(useStore.getState().playingId).toBe("CLyKZZy71r4");

  applyHash("#/services");
  expect(useStore.getState().panel).toBe("services");

  applyHash("#/journal/behind-the-scenes-the-last-horizon");
  expect(useStore.getState().panel).toBe("journal");
  expect(useStore.getState().journalSlug).toBe("behind-the-scenes-the-last-horizon");
});

test("a project outside the current filter resets the filter to all", () => {
  useStore.getState().enter();
  useStore.getState().setFilter("Commercial");
  applyHash("#/work/vlaska-teaser");
  expect(useStore.getState().filter).toBe("all");
  expect(useStore.getState().focusedIndex).toBe(8);
});

test("unknown routes redirect to #/work", () => {
  applyHash("#/nope");
  expect(window.location.hash).toBe("#/work");
  expect(useStore.getState().mode).toBe("browse");
  applyHash("#/work/does-not-exist");
  expect(window.location.hash).toBe("#/work");
  applyHash("#/journal/missing");
  expect(window.location.hash).toBe("#/journal");
});

test("empty hash keeps intro on a fresh load", () => {
  applyHash("");
  expect(useStore.getState().mode).toBe("intro");
});

test("the root hash returns to the title card from browse and from a panel", () => {
  useStore.getState().enter();
  applyHash("#/");
  expect(useStore.getState().mode).toBe("intro");

  useStore.getState().openPanel("about");
  applyHash("#/");
  expect(useStore.getState().mode).toBe("intro");
  expect(useStore.getState().panel).toBeNull();
});

test("the root hash browses instead when there is no WebGL", () => {
  useStore.getState().setWebgl(false);
  useStore.getState().openPanel("about");
  applyHash("#/");
  expect(useStore.getState().mode).toBe("browse");
});

test("initRouting mirrors store changes into the hash and back", async () => {
  const stop = initRouting();
  useStore.getState().enter();
  expect(window.location.hash).toBe("#/work/dali-showreel");
  useStore.getState().openPanel("contact");
  expect(window.location.hash).toBe("#/contact");

  window.location.hash = "#/about";
  await new Promise((r) => setTimeout(r, 0));
  expect(useStore.getState().panel).toBe("about");
  stop();
});

test("ring stepping replaces the hash without a history entry; structural changes push", async () => {
  const stop = initRouting();
  useStore.getState().enter();
  await new Promise((r) => setTimeout(r, 0));
  const replaceSpy = vi.spyOn(window.history, "replaceState");
  const lengthBefore = window.history.length;

  useStore.getState().step(1);
  expect(window.location.hash).toBe("#/work/lifestyle-mix-commercials");
  expect(replaceSpy).toHaveBeenCalledTimes(1);
  expect(window.history.length).toBe(lengthBefore);

  replaceSpy.mockClear();
  useStore.getState().openPanel("about");
  expect(window.location.hash).toBe("#/about");
  expect(replaceSpy).not.toHaveBeenCalled();
  expect(window.history.length).toBe(lengthBefore + 1);

  replaceSpy.mockRestore();
  stop();
});

test("the showreel played from the intro survives the hash echo and closes back to the intro", async () => {
  const stop = initRouting();
  useStore.getState().play("5RXfPmbynlk");
  expect(window.location.hash).toBe("#/play/dali-showreel");

  await new Promise((r) => setTimeout(r, 10)); // let the hashchange echo land
  expect(useStore.getState().returnMode).toBe("intro");

  useStore.getState().stopPlaying();
  expect(useStore.getState().mode).toBe("intro");
  expect(window.location.hash).toBe("#/");
  stop();
});
