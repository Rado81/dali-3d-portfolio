import { useStore, resetStore, selectFocusedProject } from "./store";

beforeEach(() => resetStore());

test("starts in intro with the showreel focused and no filter", () => {
  const s = useStore.getState();
  expect(s.mode).toBe("intro");
  expect(s.filter).toBe("all");
  expect(selectFocusedProject(s)?.slug).toBe("dali-showreel");
});

test("enter moves to browse; startBrowsing is a no-op outside intro", () => {
  useStore.getState().enter();
  expect(useStore.getState().mode).toBe("browse");
  useStore.getState().openPanel("about");
  useStore.getState().startBrowsing();
  expect(useStore.getState().mode).toBe("panel");
});

test("focus wraps around the filtered list and step moves by one", () => {
  const s = useStore.getState();
  s.focus(12);
  expect(useStore.getState().focusedIndex).toBe(0);
  s.focus(-1);
  expect(useStore.getState().focusedIndex).toBe(11);
  s.step(1);
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("setFilter keeps the focused project when it is in the subset, else resets to 0", () => {
  const s = useStore.getState();
  s.focus(8); // vlaska-teaser, Narrative
  s.setFilter("Narrative");
  expect(selectFocusedProject(useStore.getState())?.slug).toBe("vlaska-teaser");
  useStore.getState().setFilter("Commercial");
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("play from intro returns to intro; play from browse returns to browse", () => {
  useStore.getState().play("5RXfPmbynlk");
  expect(useStore.getState().mode).toBe("watching");
  useStore.getState().stopPlaying();
  expect(useStore.getState().mode).toBe("intro");
  expect(useStore.getState().playingId).toBeNull();

  useStore.getState().enter();
  useStore.getState().play("KduVhrnIQI4");
  useStore.getState().stopPlaying();
  expect(useStore.getState().mode).toBe("browse");
});

test("panels open and close back to browse", () => {
  useStore.getState().enter();
  useStore.getState().openPanel("journal", "behind-the-scenes-the-last-horizon");
  let s = useStore.getState();
  expect(s.mode).toBe("panel");
  expect(s.panel).toBe("journal");
  expect(s.journalSlug).toBe("behind-the-scenes-the-last-horizon");
  s.closePanel();
  s = useStore.getState();
  expect(s.mode).toBe("browse");
  expect(s.panel).toBeNull();
  expect(s.journalSlug).toBeNull();
});
