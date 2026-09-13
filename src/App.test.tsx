import { render, screen } from "@testing-library/react";
import App from "./App";
import { resetStore, useStore } from "./store";

vi.mock("./scene/Stage", () => ({ Stage: () => <div data-testid="stage" /> }));

beforeEach(() => {
  resetStore();
  window.history.replaceState(null, "", "#/");
});

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

test("keyboard focus starts on visible controls, not the hidden project index", () => {
  const intro = render(<App />);
  expect(document.querySelector("a[href], button")).toHaveAccessibleName(/play showreel/i);
  intro.unmount();

  window.history.replaceState(null, "", "#/work"); // mounting the app applies the hash
  render(<App />);
  expect(useStore.getState().mode).toBe("browse");
  expect(document.querySelector("a[href], button")).toHaveAccessibleName(/sandic/i);
});

test("every mode has exactly one top-level heading, the site name", () => {
  const intro = render(<App />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  intro.unmount();

  window.history.replaceState(null, "", "#/work");
  const browse = render(<App />);
  expect(useStore.getState().mode).toBe("browse");
  const h1s = screen.getAllByRole("heading", { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent(/dali sandic/i);
  browse.unmount();

  window.history.replaceState(null, "", "#/about");
  render(<App />);
  expect(useStore.getState().mode).toBe("panel");
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
