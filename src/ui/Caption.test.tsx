import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Caption } from "./Caption";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("shows the focused piece, steps with the arrows, and plays", async () => {
  render(<Caption />);
  expect(screen.getByRole("heading", { name: /dali showreel/i })).toBeInTheDocument();
  expect(screen.getByText(/showreel/i, { selector: "p" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByRole("heading", { name: /lifestyle mix commercials/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /previous/i }));
  await userEvent.click(screen.getByRole("button", { name: /^play$/i }));
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
});
