import { render, screen } from "@testing-library/react";
import App from "./App";
import { resetStore, useStore } from "./store";

vi.mock("./scene/Stage", () => ({ Stage: () => <div data-testid="stage" /> }));

beforeEach(() => resetStore());

test("renders the site name", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
});

test("without WebGL the grid replaces the stage", () => {
  useStore.getState().setWebgl(false);
  useStore.getState().startBrowsing();
  render(<App />);
  expect(screen.queryByTestId("stage")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /dali showreel/i }).length).toBeGreaterThan(0);
});

test("the 2D fallback keeps the filter chips but drops the ring caption", () => {
  useStore.getState().setWebgl(false);
  useStore.getState().startBrowsing();
  render(<App />);
  expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /^aerial$/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
});
