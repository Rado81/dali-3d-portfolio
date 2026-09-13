import { useEffect } from "react";
import { selectFocusedProject, useStore } from "../store";

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useGlobalKeys(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return;
      const s = useStore.getState();
      if (s.mode !== "browse") return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          s.step(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          s.step(-1);
          break;
        case "Home":
          e.preventDefault();
          s.focus(0);
          break;
        case "Enter": {
          const p = selectFocusedProject(s);
          if (p && !(target instanceof HTMLButtonElement) && !(target instanceof HTMLAnchorElement)) {
            e.preventDefault();
            s.play(p.youtubeId);
          }
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
