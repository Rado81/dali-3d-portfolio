import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Nav } from "./Nav";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("links point at hash routes and the open panel is marked current", () => {
  useStore.getState().enter();
  useStore.getState().openPanel("services");
  render(<Nav />);
  expect(screen.getByRole("link", { name: /^work$/i })).toHaveAttribute("href", "#/work");
  expect(screen.getByRole("link", { name: /services/i })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "#/contact");
  expect(screen.getByRole("link", { name: /sandic/i })).toHaveAttribute("href", "#/work");
});

test("mobile sheet closes when a link inside it is tapped, even for the current section", async () => {
  useStore.getState().enter();
  render(<Nav />);
  await userEvent.click(screen.getByRole("button", { name: /open menu/i }));
  expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute("aria-expanded", "true");
  const sheetWork = screen.getAllByRole("link", { name: /^work$/i })[1];
  sheetWork.addEventListener("click", (e) => e.preventDefault());
  await userEvent.click(sheetWork);
  expect(screen.getByRole("button", { name: /open menu/i })).toHaveAttribute("aria-expanded", "false");
});
