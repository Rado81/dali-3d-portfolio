import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pager } from "./Pager";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("steps with the arrows and marks the current dot", async () => {
  render(<Pager />);
  expect(screen.getByText("Piece 1 of 12")).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /^go to/i })).toHaveLength(12);
  expect(screen.getByRole("button", { name: /go to dali showreel/i })).toHaveAttribute("aria-current", "true");

  await userEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(useStore.getState().focusedIndex).toBe(1);
  expect(screen.getByText("Piece 2 of 12")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /go to lifestyle mix commercials/i })).toHaveAttribute("aria-current", "true");
  expect(screen.getByRole("button", { name: /go to dali showreel/i })).not.toHaveAttribute("aria-current", "true");

  await userEvent.click(screen.getByRole("button", { name: /previous/i }));
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("a dot jumps straight to its piece", async () => {
  render(<Pager />);
  await userEvent.click(screen.getByRole("button", { name: /go to vlaska teaser/i }));
  expect(useStore.getState().focusedIndex).toBe(8);
});

test("the dots follow the filter", () => {
  useStore.getState().setFilter("Narrative");
  render(<Pager />);
  expect(screen.getAllByRole("button", { name: /^go to/i })).toHaveLength(5);
  expect(screen.getByText("Piece 1 of 5")).toBeInTheDocument();
});

test("a play control stays reachable by keyboard now that the title is plain text", async () => {
  render(<Pager />);
  await userEvent.click(screen.getByRole("button", { name: /play dali showreel/i }));
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
});
