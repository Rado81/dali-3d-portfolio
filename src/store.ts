import { create } from "zustand";
import { filterProjects, type FilterId, type Project } from "./content/projects";

export type Mode = "intro" | "browse" | "watching" | "panel";
export type PanelId = "about" | "services" | "journal" | "contact";
export const PANEL_IDS: PanelId[] = ["about", "services", "journal", "contact"];

export interface AppState {
  mode: Mode;
  returnMode: "intro" | "browse";
  focusedIndex: number;
  filter: FilterId;
  panel: PanelId | null;
  journalSlug: string | null;
  playingId: string | null;
  webgl: boolean;
  reducedMotion: boolean;
  isMobile: boolean;

  enter(): void;
  startBrowsing(): void;
  focus(i: number): void;
  step(delta: 1 | -1): void;
  setFilter(f: FilterId): void;
  play(youtubeId: string): void;
  stopPlaying(): void;
  openPanel(p: PanelId, journalSlug?: string | null): void;
  closePanel(): void;
  setWebgl(b: boolean): void;
  setReducedMotion(b: boolean): void;
  setIsMobile(b: boolean): void;
}

const initialState = {
  mode: "intro" as Mode,
  returnMode: "intro" as const,
  focusedIndex: 0,
  filter: "all" as FilterId,
  panel: null,
  journalSlug: null,
  playingId: null,
  webgl: true,
  reducedMotion: false,
  isMobile: false,
};

export const useStore = create<AppState>()((set, get) => ({
  ...initialState,

  enter: () => set({ mode: "browse", returnMode: "browse" }),
  startBrowsing: () => {
    if (get().mode === "intro") set({ mode: "browse", returnMode: "browse" });
  },
  focus: (i) => {
    const n = filterProjects(get().filter).length;
    if (n === 0) return;
    set({ focusedIndex: ((i % n) + n) % n });
  },
  step: (delta) => get().focus(get().focusedIndex + delta),
  setFilter: (filter) => {
    const current = filterProjects(get().filter)[get().focusedIndex];
    const next = filterProjects(filter);
    const idx = current ? next.findIndex((p) => p.slug === current.slug) : -1;
    set({ filter, focusedIndex: idx === -1 ? 0 : idx });
  },
  play: (youtubeId) =>
    set((s) => ({
      mode: "watching",
      playingId: youtubeId,
      returnMode: s.mode === "intro" ? "intro" : "browse",
      panel: null,
      journalSlug: null,
    })),
  stopPlaying: () => set((s) => ({ mode: s.returnMode, playingId: null })),
  openPanel: (panel, journalSlug = null) =>
    set({ mode: "panel", panel, journalSlug, returnMode: "browse", playingId: null }),
  closePanel: () => set({ mode: "browse", panel: null, journalSlug: null }),
  setWebgl: (webgl) => set({ webgl }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setIsMobile: (isMobile) => set({ isMobile }),
}));

export function resetStore(): void {
  useStore.setState(initialState);
}

export const selectFilteredProjects = (s: AppState): Project[] => filterProjects(s.filter);
export const selectFocusedProject = (s: AppState): Project | undefined =>
  filterProjects(s.filter)[s.focusedIndex];
