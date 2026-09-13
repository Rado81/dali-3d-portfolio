import { render, screen } from "@testing-library/react";
import { Journal } from "./Journal";
import { useStore, resetStore } from "../../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("lists posts with links, and renders a post with a back link", () => {
  useStore.getState().openPanel("journal");
  const { rerender } = render(<Journal />);
  expect(screen.getByRole("link", { name: /behind the scenes: the last horizon/i })).toHaveAttribute(
    "href",
    "#/journal/behind-the-scenes-the-last-horizon",
  );
  expect(screen.getByText(/5 min read/)).toBeInTheDocument();

  useStore.getState().openPanel("journal", "behind-the-scenes-the-last-horizon");
  rerender(<Journal />);
  expect(screen.getByRole("heading", { level: 2, name: /the last horizon/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: /the challenge/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /all posts/i })).toHaveAttribute("href", "#/journal");
});
