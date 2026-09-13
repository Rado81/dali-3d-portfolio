import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE_PATH ?? "/";

/**
 * The 3D scene is a lazy chunk, so the title card paints without it. Left alone, its download would
 * only start once the entry script had run, delaying the ring by about a second on slow connections.
 * This adds a tiny script to the page head that checks for WebGL and, only if it is there, preloads
 * the scene chunk in parallel with the entry. The 2D fallback still never fetches it, and the result
 * is kept on window.__webgl so the app does not create a second WebGL context to check again.
 */
function preloadSceneWhenWebgl(): Plugin {
  return {
    name: "preload-scene-when-webgl",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        const scene = Object.values(ctx.bundle ?? {}).find(
          (c) => c.type === "chunk" && c.isDynamicEntry && (c.facadeModuleId ?? "").split("\\").join("/").endsWith("/src/scene/Stage.tsx"),
        );
        if (!scene) throw new Error("preload-scene-when-webgl: the scene chunk was not found in the bundle");
        const href = JSON.stringify(base + scene.fileName);
        return [
          {
            tag: "script",
            injectTo: "head-prepend",
            children:
              "(function(){var w=false;try{var c=document.createElement('canvas');w=!!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){}" +
              "window.__webgl=w;if(!w)return;var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';" +
              `l.href=${href};document.head.appendChild(l)})();`,
          },
        ];
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), preloadSceneWhenWebgl()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: { include: [/tokens\.css/] }, // only the tokens, so tokens.test.ts can read the real values
    exclude: ["e2e/**", "node_modules/**"],
  },
});
