import { render, fireEvent } from "@testing-library/react";
import { useGlobalKeys } from "./useGlobalKeys";
import { useStore, resetStore } from "../store";

function Host() {
  useGlobalKeys();
  return <input aria-label="field" />;
}

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("arrows step, Home resets, Enter plays, only in browse", () => {
  render(<Host />);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(1);
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(useStore.getState().focusedIndex).toBe(11);
  fireEvent.keyDown(window, { key: "Home" });
  expect(useStore.getState().focusedIndex).toBe(0);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(useStore.getState().mode).toBe("watching");
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("ignores keys typed into form fields", () => {
  const { getByLabelText } = render(<Host />);
  fireEvent.keyDown(getByLabelText("field"), { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(0);
});
