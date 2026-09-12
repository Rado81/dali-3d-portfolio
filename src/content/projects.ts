export type Category = "Showreel" | "Commercial" | "Narrative" | "Aerial";
export const CATEGORIES: Category[] = ["Showreel", "Commercial", "Narrative", "Aerial"];
export type FilterId = Category | "all";

export interface Project {
  slug: string;
  title: string;
  category: Category;
  youtubeId: string;
}

const REMOVE_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "a")
    .normalize("NFD").replace(REMOVE_DIACRITICS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const raw: Omit<Project, "slug">[] = [
  { title: "Dali Showreel", category: "Showreel", youtubeId: "5RXfPmbynlk" },
  { title: "Lifestyle Mix Commercials", category: "Commercial", youtubeId: "EoXWVt3NjNI" },
  { title: "Carlsberg Vuvuzela", category: "Commercial", youtubeId: "CLyKZZy71r4" },
  { title: "Ørsted Geo", category: "Commercial", youtubeId: "LFkhBvrvgCU" },
  { title: "Dyrenes Beskyttelse", category: "Commercial", youtubeId: "AkDsDuWbSdw" },
  { title: "Dyrenes Beskyttelse Original", category: "Commercial", youtubeId: "ERrPsSIHpJw" },
  { title: "Movenorth — Lars", category: "Narrative", youtubeId: "FqKLK7deiz0" },
  { title: "Movenorth — Lene Original", category: "Narrative", youtubeId: "GE47eALvz_U" },
  { title: "Vlaska Teaser", category: "Narrative", youtubeId: "KduVhrnIQI4" },
  { title: "Living With Humans", category: "Narrative", youtubeId: "OuPfCU0NKLo" },
  { title: "The Drama of the Drama", category: "Narrative", youtubeId: "UBm5xIfvasM" },
  { title: "DJI Phantom 3", category: "Aerial", youtubeId: "ZrbmiU2OCr0" },
];

export const projects: Project[] = raw.map((p) => ({ ...p, slug: slugify(p.title) }));
export const SHOWREEL: Project = projects.find((p) => p.category === "Showreel") ?? projects[0];

export function filterProjects(filter: FilterId): Project[] {
  return filter === "all" ? projects : projects.filter((p) => p.category === filter);
}

export function projectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function projectByYoutubeId(id: string): Project | undefined {
  return projects.find((p) => p.youtubeId === id);
}

export function thumbnailChain(youtubeId: string, mobile: boolean): string[] {
  const base = `https://img.youtube.com/vi/${youtubeId}/`;
  return [base + (mobile ? "sddefault.jpg" : "maxresdefault.jpg"), base + "hqdefault.jpg"];
}
