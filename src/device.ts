import type { Mode } from "./store";
import { useStore } from "./store";

export function detectWebGL(): boolean {
  // the inline script in the page head has already created a context to decide on preloading the scene
  if (typeof window.__webgl === "boolean") return window.__webgl;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function isMobileViewport(width: number = window.innerWidth): boolean {
  return width < 768;
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function fpsForMode(mode: Mode): "always" | number {
  switch (mode) {
    case "intro":
    case "browse":
      return "always";
    case "panel":
      return 30;
    case "watching":
      return 10;
  }
}

export function initDevice(): void {
  const s = useStore.getState();
  const webgl = detectWebGL();
  s.setWebgl(webgl);
  if (!webgl) s.startBrowsing();
  s.setIsMobile(isMobileViewport());
  s.setReducedMotion(prefersReducedMotion());
}
