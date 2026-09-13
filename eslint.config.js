import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".superpowers", ".playwright-mcp", "playwright-report", "test-results"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    // Node build scripts run outside the browser environment.
    files: ["scripts/**"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
  {
    // react-hooks/immutability forbids mutating values from hooks or hook arguments, but the
    // r3f frame loop exists to do exactly that: write gl.domElement and the Object3D refs.
    files: ["src/scene/**"],
    rules: { "react-hooks/immutability": "off" },
  },
);
