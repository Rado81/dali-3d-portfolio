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
