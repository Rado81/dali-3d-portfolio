import { render, screen } from "@testing-library/react";
import { ProjectList } from "./ProjectList";

test("exposes every project as a link for assistive tech and crawlers", () => {
  render(<ProjectList />);
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(12);
  expect(links[8]).toHaveAttribute("href", "#/work/vlaska-teaser");
});
