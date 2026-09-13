import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: { include: [/tokens\.css/] }, // only the tokens, so tokens.test.ts can read the real values
    exclude: ["e2e/**", "node_modules/**"],
  },
});
