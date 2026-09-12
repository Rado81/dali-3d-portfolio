import { render, screen } from "@testing-library/react";
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
