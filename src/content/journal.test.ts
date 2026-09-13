import { journalPosts, postBySlug, postFromRaw, sortPosts } from "./journal";

test("loads the seeded post with rendered html", () => {
  expect(journalPosts).toHaveLength(1);
  const post = postBySlug("behind-the-scenes-the-last-horizon");
  expect(post?.title).toBe("Behind the Scenes: The Last Horizon");
  expect(post?.html).toContain("<h2>The Challenge</h2>");
  expect(post?.category).toBe("bts");
});

test("sorts by date descending", () => {
  const a = postFromRaw("a.md", `---\nslug: a\ntitle: A\nexcerpt: x\ndate: 2024-01-01\nreadingTime: 1 min\ncategory: gear\n---\nA`);
  const b = postFromRaw("b.md", `---\nslug: b\ntitle: B\nexcerpt: x\ndate: 2025-01-01\nreadingTime: 1 min\ncategory: gear\n---\nB`);
  expect(sortPosts([a, b]).map((p) => p.slug)).toEqual(["b", "a"]);
});

test("names the file when a required field is missing or the date is malformed", () => {
  expect(() => postFromRaw("broken.md", `---\ntitle: T\n---\nbody`)).toThrow(/broken\.md.*slug/);
  expect(() =>
    postFromRaw("d.md", `---\nslug: d\ntitle: T\nexcerpt: x\ndate: 15/12/2024\nreadingTime: 1\ncategory: bts\n---\n`),
  ).toThrow(/d\.md.*yyyy-mm-dd/);
});
