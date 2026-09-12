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
