import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Player } from "./Player";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
  useStore.getState().play("KduVhrnIQI4");
});

test("embeds the video with autoplay and offers a YouTube link", () => {
  render(<Player />);
  const frame = screen.getByTitle(/vlaska teaser/i);
  // the privacy-enhanced domain sets no tracking cookies until the viewer presses play
  expect(frame).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/KduVhrnIQI4?autoplay=1&rel=0&modestbranding=1&color=white");
  expect(frame).toHaveAttribute("allow", expect.stringContaining("autoplay"));
  expect(screen.getByRole("link", { name: /open on youtube/i })).toHaveAttribute("href", "https://www.youtube.com/watch?v=KduVhrnIQI4");
});

test("close button, Escape and scrim click stop playing", async () => {
  const { unmount } = render(<Player />);
  await userEvent.click(screen.getByRole("button", { name: /close video/i }));
  expect(useStore.getState().mode).toBe("browse");
  unmount();

  useStore.getState().play("KduVhrnIQI4");
  const second = render(<Player />);
  await userEvent.keyboard("{Escape}");
  expect(useStore.getState().mode).toBe("browse");
  second.unmount();

  useStore.getState().play("KduVhrnIQI4");
  render(<Player />);
  await userEvent.click(screen.getByTestId("player-scrim"));
  expect(useStore.getState().mode).toBe("browse");
});
