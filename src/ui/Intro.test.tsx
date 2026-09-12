import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Intro } from "./Intro";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("shows name and tagline, Enter moves to browse, Watch Reel plays the showreel", async () => {
  render(<Intro />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
  expect(screen.getByText(/cinematographer & visual storyteller/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /watch reel/i }));
  expect(useStore.getState().mode).toBe("watching");
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
  useStore.getState().stopPlaying();
  await userEvent.click(screen.getByRole("button", { name: /enter the work/i }));
  expect(useStore.getState().mode).toBe("browse");
});
