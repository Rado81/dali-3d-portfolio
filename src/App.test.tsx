import { render, screen } from "@testing-library/react";
import App from "./App";
import { resetStore } from "./store";

vi.mock("./scene/Stage", () => ({ Stage: () => <div data-testid="stage" /> }));

beforeEach(() => resetStore());

test("renders the site name", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
});
