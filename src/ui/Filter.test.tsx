import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Filter } from "./Filter";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("renders All plus the four categories and sets the filter", async () => {
  render(<Filter />);
  expect(screen.getAllByRole("button")).toHaveLength(5);
  expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: /narrative/i }));
  expect(useStore.getState().filter).toBe("Narrative");
  expect(screen.getByRole("button", { name: /narrative/i })).toHaveAttribute("aria-pressed", "true");
});
