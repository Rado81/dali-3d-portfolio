import { render, screen } from "@testing-library/react";
import { Caption } from "./Caption";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("names the focused piece and carries no controls of its own", () => {
  render(<Caption />);
  expect(screen.getByRole("heading", { name: /dali showreel/i })).toBeInTheDocument();
  expect(screen.getByText(/showreel/i, { selector: "p" })).toBeInTheDocument();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
});
