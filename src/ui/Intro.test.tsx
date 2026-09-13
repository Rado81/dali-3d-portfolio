import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Intro } from "./Intro";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("shows name and tagline, Enter moves to browse, the play circle plays the showreel", async () => {
  render(<Intro />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
  expect(screen.getByText(/cinematographer & visual storyteller/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /watch reel/i })).toBeNull(); // the play circle is the only way in
  await userEvent.click(screen.getByRole("button", { name: /play showreel/i }));
  expect(useStore.getState().mode).toBe("watching");
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
  useStore.getState().stopPlaying();
  await userEvent.click(screen.getByRole("button", { name: /enter the work/i }));
  expect(useStore.getState().mode).toBe("browse");
});

test("the play circle crowns the name rather than sitting under it", () => {
  render(<Intro />);
  const name = screen.getByRole("heading", { name: /dali sandic/i });
  const circle = screen.getByRole("button", { name: /play showreel/i });
  expect(name.compareDocumentPosition(circle) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
});
