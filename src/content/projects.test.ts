import { projects, slugify, filterProjects, projectBySlug, thumbnailChain, SHOWREEL, projectByYoutubeId } from "./projects";

test("has 12 projects in ring order starting with the showreel", () => {
  expect(projects).toHaveLength(12);
  expect(projects[0].title).toBe("Dali Showreel");
  expect(projects[11].title).toBe("DJI Phantom 3");
  expect(SHOWREEL.youtubeId).toBe("5RXfPmbynlk");
});

test("slugs are unique and ascii", () => {
  const slugs = projects.map((p) => p.slug);
  expect(new Set(slugs).size).toBe(12);
  for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("slugify handles dashes and Danish letters", () => {
  expect(slugify("Movenorth — Lars")).toBe("movenorth-lars");
  expect(slugify("Ørsted Geo")).toBe("orsted-geo");
  expect(slugify("DJI Phantom 3")).toBe("dji-phantom-3");
});

test("filters by category", () => {
  expect(filterProjects("all")).toHaveLength(12);
  expect(filterProjects("Commercial")).toHaveLength(5);
  expect(filterProjects("Narrative")).toHaveLength(5);
  expect(filterProjects("Showreel")).toHaveLength(1);
  expect(filterProjects("Aerial")).toHaveLength(1);
});

test("looks up by slug and youtube id", () => {
  expect(projectBySlug("vlaska-teaser")?.youtubeId).toBe("KduVhrnIQI4");
  expect(projectBySlug("nope")).toBeUndefined();
  expect(projectByYoutubeId("KduVhrnIQI4")?.slug).toBe("vlaska-teaser");
});

test("thumbnail chain picks size by device and always ends with hqdefault", () => {
  expect(thumbnailChain("abc", false)).toEqual([
    "https://img.youtube.com/vi/abc/maxresdefault.jpg",
    "https://img.youtube.com/vi/abc/hqdefault.jpg",
  ]);
  expect(thumbnailChain("abc", true)[0]).toBe("https://img.youtube.com/vi/abc/sddefault.jpg");
});

test("a preview is the small 16:9 mqdefault image on any device", () => {
  expect(thumbnailChain("abc", false, "preview")).toEqual(["https://img.youtube.com/vi/abc/mqdefault.jpg"]);
  expect(thumbnailChain("abc", true, "preview")).toEqual(["https://img.youtube.com/vi/abc/mqdefault.jpg"]);
});
