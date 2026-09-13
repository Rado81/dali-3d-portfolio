import html from "../index.html?raw";

const meta = (attr: "property" | "name", key: string): string | undefined =>
  html.match(new RegExp(String.raw`<meta\s+${attr}="${key}"\s+content="([^"]*)"`))?.[1];

test("shared links get a title, description and a large preview image", () => {
  expect(meta("property", "og:title")).toBe("Dali Sandic — Cinematographer &amp; Visual Storyteller");
  expect(meta("property", "og:description")).toBe(meta("name", "description"));
  expect(meta("property", "og:image")).toMatch(/^https:\/\/.+\.jpg$/); // scrapers need an absolute url
  expect(meta("property", "og:image:width")).toBe("1280");
  expect(meta("property", "og:image:height")).toBe("720");
  expect(meta("name", "twitter:card")).toBe("summary_large_image");
});
