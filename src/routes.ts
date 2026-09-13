import { filterProjects, projectBySlug, projectByYoutubeId } from "./content/projects";
import { postBySlug } from "./content/journal";
import { site } from "./content/site";
import { PANEL_IDS, useStore, type AppState, type PanelId } from "./store";

export function stateToHash(s: AppState): string {
  switch (s.mode) {
    case "intro":
      return "#/";
    case "browse": {
      const p = filterProjects(s.filter)[s.focusedIndex];
      return p ? `#/work/${p.slug}` : "#/work";
    }
    case "watching": {
      const p = s.playingId ? projectByYoutubeId(s.playingId) : undefined;
      return p ? `#/play/${p.slug}` : "#/work";
    }
    case "panel": {
      if (s.panel === "journal") return s.journalSlug ? `#/journal/${s.journalSlug}` : "#/journal";
      return `#/${s.panel}`;
    }
  }
}

/** The browser tab title for a view, so tabs, history and bookmarks name what they point at. */
export function titleFor(s: AppState): string {
  const named = (name: string) => `${name} — ${site.name}`;
  switch (s.mode) {
    case "intro":
      return `${site.name} — ${site.title}`;
    case "browse":
      return named(filterProjects(s.filter)[s.focusedIndex]?.title ?? "Work");
    case "watching":
      return named((s.playingId ? projectByYoutubeId(s.playingId)?.title : undefined) ?? "Work");
    case "panel": {
      const post = s.panel === "journal" && s.journalSlug ? postBySlug(s.journalSlug) : undefined;
      if (post) return named(post.title);
      const panel = s.panel ?? "work";
      return named(panel.charAt(0).toUpperCase() + panel.slice(1));
    }
  }
}

function redirect(hash: string): void {
  window.history.replaceState(null, "", hash);
  applyHash(hash);
}

function focusSlug(slug: string): boolean {
  const project = projectBySlug(slug);
  if (!project) return false;
  const store = useStore.getState();
  let index = filterProjects(store.filter).findIndex((p) => p.slug === slug);
  if (index === -1) {
    store.setFilter("all");
    index = filterProjects("all").findIndex((p) => p.slug === slug);
  }
  useStore.getState().focus(index);
  return true;
}

export function applyHash(hash: string): void {
  const parts = hash.replace(/^#/, "").split("/").filter(Boolean);
  const store = useStore.getState();

  if (parts.length === 0) {
    store.showIntro();
    return;
  }

  const [head, tail] = parts;

  if (head === "work") {
    store.startBrowsing();
    useStore.setState({ mode: "browse", panel: null, journalSlug: null, playingId: null });
    if (tail && !focusSlug(tail)) redirect("#/work");
    return;
  }

  if (head === "play" && tail) {
    const project = projectBySlug(tail);
    if (!project) return redirect("#/work");
    store.startBrowsing();
    focusSlug(tail);
    useStore.getState().play(project.youtubeId);
    return;
  }

  if (head === "journal") {
    store.startBrowsing();
    if (tail && !postBySlug(tail)) return redirect("#/journal");
    useStore.getState().openPanel("journal", tail ?? null);
    return;
  }

  if ((PANEL_IDS as string[]).includes(head) && !tail) {
    store.startBrowsing();
    useStore.getState().openPanel(head as PanelId);
    return;
  }

  redirect("#/work");
}

export function initRouting(): () => void {
  let applying = false;

  const onHashChange = () => {
    // A hash we just wrote from the store echoes back asynchronously; re-applying it
    // would re-run actions like play() against state they already produced.
    if (window.location.hash === stateToHash(useStore.getState())) return;
    applying = true;
    try {
      applyHash(window.location.hash);
    } finally {
      applying = false;
    }
  };

  onHashChange();
  window.addEventListener("hashchange", onHashChange);
  document.title = titleFor(useStore.getState());

  let prev = useStore.getState();
  const unsubscribe = useStore.subscribe((s) => {
    document.title = titleFor(s);
    if (applying) {
      prev = s;
      return;
    }
    const hash = stateToHash(s);
    const structural =
      s.mode !== prev.mode || s.panel !== prev.panel || s.journalSlug !== prev.journalSlug || s.playingId !== prev.playingId;
    prev = s;
    if (window.location.hash === hash) return;
    if (structural) {
      applying = true;
      window.location.hash = hash;
      applying = false;
    } else {
      window.history.replaceState(null, "", hash);
    }
  });

  return () => {
    window.removeEventListener("hashchange", onHashChange);
    unsubscribe();
  };
}
