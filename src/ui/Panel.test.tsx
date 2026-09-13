import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Panel } from "./Panel";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("About shows bio, timeline, equipment, awards and testimonials", () => {
  useStore.getState().openPanel("about");
  render(<Panel />);
  const dialog = screen.getByRole("dialog", { name: /about/i });
  expect(dialog).toHaveTextContent(/based in Copenhagen/);
  expect(dialog).toHaveTextContent(/2018/);
  expect(dialog).toHaveTextContent(/ARRI Alexa Mini LF/);
  expect(dialog).toHaveTextContent(/Nordic Short Film Festival/);
  expect(dialog).toHaveTextContent(/Anna Jensen/);
  expect(screen.getByRole("img", { name: /dali sandic/i })).toBeInTheDocument();
});

test("Services shows four services and the four phases", () => {
  useStore.getState().openPanel("services");
  render(<Panel />);
  expect(screen.getByRole("heading", { name: /color grading/i })).toBeInTheDocument();
  expect(screen.getByText("Pre-production", { selector: "strong" })).toBeInTheDocument();
});

test("Escape and the close button return to browse and restore focus", async () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  useStore.getState().openPanel("contact");
  render(<Panel />);
  expect(screen.getByRole("button", { name: /close/i })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(useStore.getState().mode).toBe("browse");
  expect(trigger).toHaveFocus();
  trigger.remove();
});

test("clicking the scrim closes", async () => {
  useStore.getState().openPanel("about");
  render(<Panel />);
  await userEvent.click(screen.getByTestId("scrim"));
  expect(useStore.getState().mode).toBe("browse");
});
