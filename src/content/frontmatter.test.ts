import { parseFrontmatter } from "./frontmatter";

test("parses quoted and unquoted values and returns the body", () => {
  const raw = `---\ntitle: "Hello: World"\ndate: 2024-12-15\ncategory: 'bts'\n---\n\n## Body\n\ntext`;
  const { data, body } = parseFrontmatter(raw);
  expect(data).toEqual({ title: "Hello: World", date: "2024-12-15", category: "bts" });
  expect(body.trim()).toBe("## Body\n\ntext");
});

test("accepts CRLF line endings", () => {
  const { data, body } = parseFrontmatter("---\r\na: 1\r\n---\r\nbody");
  expect(data).toEqual({ a: "1" });
  expect(body).toBe("body");
});

test("throws when the block is missing or a line has no colon", () => {
  expect(() => parseFrontmatter("no frontmatter")).toThrow(/frontmatter/);
  expect(() => parseFrontmatter("---\nbad line\n---\n")).toThrow(/bad line/);
});
