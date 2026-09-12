import { marked } from "marked";
import { parseFrontmatter } from "./frontmatter";

export type JournalCategory = "bts" | "gear" | "industry" | "tutorial";

export interface JournalPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // yyyy-mm-dd
  readingTime: string;
  category: JournalCategory;
  html: string;
}

const REQUIRED = ["slug", "title", "excerpt", "date", "readingTime", "category"] as const;

export function postFromRaw(filename: string, raw: string): JournalPost {
  const { data, body } = parseFrontmatter(raw);
  for (const key of REQUIRED) {
    if (!data[key]) throw new Error(`${filename}: missing frontmatter field "${key}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error(`${filename}: date must be yyyy-mm-dd`);
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    date: data.date,
    readingTime: data.readingTime,
    category: data.category as JournalCategory,
    html: marked.parse(body, { async: false }) as string,
  };
}

export function sortPosts(posts: JournalPost[]): JournalPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

const files = import.meta.glob("./journal/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

export const journalPosts: JournalPost[] = sortPosts(
  Object.entries(files).map(([file, raw]) => postFromRaw(file, raw)),
);

export function postBySlug(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}
