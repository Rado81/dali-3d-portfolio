import { render, screen } from "@testing-library/react";
import { Contact } from "./Contact";

test("email, phone, availability and socials", () => {
  render(<Contact />);
  expect(screen.getByRole("link", { name: /dali@sandicfilm\.com/i })).toHaveAttribute("href", "mailto:Dali@sandicfilm.com");
  expect(screen.getByRole("link", { name: /\+45 23 66 37 48/ })).toHaveAttribute("href", "tel:+4523663748");
  expect(screen.getByText(/currently booking q3 2026/i)).toBeInTheDocument();
  const ig = screen.getByRole("link", { name: /instagram/i });
  expect(ig).toHaveAttribute("target", "_blank");
  expect(ig).toHaveAttribute("rel", expect.stringContaining("noopener"));
  expect(screen.getByText(/copenhagen, denmark/i)).toBeInTheDocument();
});
