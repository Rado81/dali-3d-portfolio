import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Grid2D } from "./Grid2D";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().setWebgl(false);
  useStore.getState().enter();
});

test("lists filtered projects as buttons with hqdefault thumbnails and plays on click", async () => {
  useStore.getState().setFilter("Aerial");
  const { container } = render(<Grid2D />);
  const buttons = screen.getAllByRole("button", { name: /dji phantom 3/i });
  expect(buttons).toHaveLength(1);
  // the button already names the card, so the thumbnail is decorative (alt="")
  expect(container.querySelector("img")).toHaveAttribute("src", "https://img.youtube.com/vi/ZrbmiU2OCr0/hqdefault.jpg");
  expect(container.querySelector("img")).toHaveAttribute("alt", "");
  await userEvent.click(buttons[0]);
  expect(useStore.getState().playingId).toBe("ZrbmiU2OCr0");
});
