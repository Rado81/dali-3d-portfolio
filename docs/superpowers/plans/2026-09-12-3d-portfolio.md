# Dali Sandic 3D Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-scene WebGL portfolio site where 12 YouTube pieces sit on a curved ring around the camera, with a title-card entry, slide-in content panels, a YouTube player overlay, hash routing, and a 2D fallback, deployed as static files to GitHub Pages.

**Architecture:** One React app with one react-three-fiber canvas and one zustand store. Files under `src/scene/` render the ring and never touch the DOM; files under `src/ui/` are plain HTML overlays and never import three. Both talk only through the store. Pure math for ring layout and drag physics lives in two files with no renderer dependency so it is fully unit-tested.

**Tech Stack:** Vite 8, React 19, TypeScript 5.9, three 0.186, @react-three/fiber 9, @react-three/drei 10, @react-three/postprocessing 3, @react-spring/three 10, zustand 5, marked 18, vitest 5, Testing Library, Playwright 1.63, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-12-3d-portfolio-design.md`

## Global Constraints

- Node 20 or newer (local machine has 22.11). npm, not pnpm or yarn.
- TypeScript pinned to `~5.9.0`. Do not install TypeScript 7.
- No CSS framework. All styling is CSS custom properties in `src/tokens.css` plus one `src/ui/overlay.css`.
- `src/scene/**` must not import from `src/ui/**` or touch `document`/`window` except through the fiber `gl.domElement`. `src/ui/**` must not import `three`, `@react-three/*`, or `@react-spring/three`.
- Colours, exactly: bg-deep `#050505`, bg-base `#0A0A0A`, bg-surface `#111111`, bg-elevated `#1A1A1A`, gold `#D4AF37`, gold-dark `#B8962E`, gold-glow `rgba(212,175,55,.15)`, gold-subtle `rgba(212,175,55,.08)`, text-primary `#F5F5F5`, text-secondary `#AAAAAA`, text-muted `#666666`, text-subtle `#333333`.
- Fonts: Bebas Neue for display, Inter for body, both from Google Fonts with `display=swap`. Tracking: display `.25em`, wide `.15em`, label `.2em`.
- Ring numbers: radius 6, tile 1.6 x 0.9, row y ±0.55, intro camera (0, 1.2, 7.5), browse camera (0, 0, 0), fog 4 to 9, bloom threshold 0.85 intensity 0.6, camera spring tension 120 friction 30 (about 1.2 s), tile spring tension 170 friction 26, idle rotation 0.05 rad/s.
- Drag numbers: desktop gain 0.006 rad/px, touch 0.012, wheel 0.0015 rad/unit, decay 0.92 per 60 fps frame, snap when |v| < 0.002 rad/frame, snap time constant 80 ms, click = under 6 px and 200 ms.
- Mobile = viewport width under 768 px: one row, `sddefault` thumbnails, no bloom, dpr cap 1.5. Desktop: two rows, `maxresdefault`, dpr cap 2.
- Hash routes exactly as spec section 7. Unknown → `#/work`.
- Commit after every task with the message given. Every commit message ends with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- The existing `Rado81/dali-portfolio` repository is read-only source material. Never push to it.
- Run commands from the project root: `C:\Ondrive\OneDrive - crossjoin.dk\Desktop\ClaudeCode Projects\3DWebsite`. On Windows use Git Bash syntax for the commands shown.

---

## File map

| File | Responsibility |
|---|---|
| `index.html` | shell, font links, root div |
| `vite.config.ts` | Vite + Vitest config, base path from env |
| `src/main.tsx` | mount |
| `src/App.tsx` | device detection, chooses Stage or Grid2D, mounts Overlay, starts routing |
| `src/tokens.css` | design tokens, base element styles, shared utility classes |
| `src/device.ts` | `detectWebGL`, `isMobileViewport`, `prefersReducedMotion`, `fpsForMode` |
| `src/store.ts` | zustand store, all app state and transitions |
| `src/routes.ts` | `stateToHash`, `applyHash`, `initRouting` |
| `src/content/*.json` | copied content |
| `src/content/projects.ts` | 12 projects, slugs, filtering, thumbnail URLs |
| `src/content/frontmatter.ts` | tiny frontmatter parser |
| `src/content/journal.ts` | markdown posts loader |
| `src/content/site.ts` | typed accessors for the JSON files |
| `src/scene/layout.ts` | pure ring geometry |
| `src/scene/ringPhysics.ts` | pure drag/inertia/snap math |
| `src/scene/useRingDrag.ts` | pointer/wheel listeners + per-frame integration |
| `src/scene/useThumbnail.ts` | texture loading with fallback chain |
| `src/scene/Tile.tsx`, `Ring.tsx`, `CameraRig.tsx`, `Effects.tsx`, `Scene.tsx`, `Stage.tsx` | rendering |
| `src/scene/FrameloopController.tsx` | throttles rendering per mode |
| `src/ui/overlay.css` | all overlay styles |
| `src/ui/Overlay.tsx` | picks overlays per mode |
| `src/ui/Intro.tsx`, `Nav.tsx`, `Filter.tsx`, `Caption.tsx`, `Panel.tsx`, `Player.tsx`, `Grid2D.tsx`, `Grain.tsx`, `ProjectList.tsx` | overlays |
| `src/ui/panels/About.tsx`, `Services.tsx`, `Journal.tsx`, `Contact.tsx` | panel bodies |
| `src/ui/useFocusTrap.ts`, `src/ui/useGlobalKeys.ts` | hooks |
| `e2e/site.spec.ts`, `playwright.config.ts` | end-to-end |
| `.github/workflows/deploy.yml`, `scripts/copy-404.mjs` | deployment |

---

### Task 1: Scaffold, tokens, test runner

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.prettierrc`, `eslint.config.js`
- Create: `src/main.tsx`, `src/App.tsx`, `src/tokens.css`, `src/test/setup.ts`, `src/vite-env.d.ts`
- Create: `public/favicon.svg`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev|build|test|test:e2e|lint|format`; CSS classes `.display`, `.label`, `.btn`, `.btn--solid`, `.visually-hidden`; CSS variables listed in Global Constraints.

- [ ] **Step 1: Write package.json and install dependencies**

```json
{
  "name": "dali-3d-portfolio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

Run:
```bash
npm install react@^19.3.0 react-dom@^19.3.0 three@^0.186.0 @react-three/fiber@^9.7.0 @react-three/drei@^10.7.8 @react-three/postprocessing@^3.1.1 postprocessing@^6.39.5 @react-spring/three@^10.1.2 zustand@^5.0.15 marked@^18.0.12
npm install -D vite@^8.3.0 @vitejs/plugin-react@^6.1.1 typescript@~5.9.0 @types/react@^19.3.0 @types/react-dom@^19.3.0 @types/three@^0.186.0 vitest@^5.0.0 jsdom@^30.0.1 @testing-library/react@^16.3.3 @testing-library/jest-dom@^7.0.1 @testing-library/user-event@^14.6.7 @playwright/test@^1.63.0 prettier@^3.9.6 eslint@^10.10.0 @eslint/js typescript-eslint eslint-plugin-react-hooks
npx playwright install chromium
```

- [ ] **Step 2: Write TypeScript and Vite config**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "playwright.config.ts", "scripts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`.prettierrc`:
```json
{ "printWidth": 100, "singleQuote": false, "semi": true }
```

`eslint.config.js`:
```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".superpowers", "playwright-report", "test-results"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
);
```

- [ ] **Step 3: Write index.html, favicon, tokens.css**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dali Sandic — Cinematographer & Visual Storyteller</title>
    <meta name="description" content="Dali Sandic, cinematographer and visual storyteller based in Copenhagen. Narrative films, commercials, music videos and documentaries." />
    <meta name="theme-color" content="#050505" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#050505"/><text x="32" y="44" text-anchor="middle" font-family="Impact, 'Bebas Neue', sans-serif" font-size="34" fill="#D4AF37">S</text></svg>
```

`src/tokens.css`:
```css
:root {
  --bg-deep: #050505;
  --bg-base: #0a0a0a;
  --bg-surface: #111111;
  --bg-elevated: #1a1a1a;
  --gold: #d4af37;
  --gold-dark: #b8962e;
  --gold-glow: rgba(212, 175, 55, 0.15);
  --gold-subtle: rgba(212, 175, 55, 0.08);
  --text-primary: #f5f5f5;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --text-subtle: #333333;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Bebas Neue", "Inter", sans-serif;
  --tracking-display: 0.25em;
  --tracking-wide: 0.15em;
  --tracking-label: 0.2em;
  --ease-out: cubic-bezier(0.25, 0.9, 0.3, 1);
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; margin: 0; }

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

::selection { background: rgba(212, 175, 55, 0.3); color: var(--text-primary); }

a { color: inherit; }

button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }

:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

.display {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  line-height: 1;
  margin: 0;
}

.label {
  font-size: 11px;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0;
}

.btn {
  display: inline-block;
  font-size: 10px;
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 12px 24px;
  border-radius: 2px;
  transition: background-color 0.25s, border-color 0.25s, color 0.25s;
  text-decoration: none;
}
.btn:hover { background: var(--gold-subtle); border-color: var(--gold); }
.btn--solid { background: var(--gold); color: var(--bg-deep); border-color: var(--gold); }
.btn--solid:hover { background: var(--gold-dark); border-color: var(--gold-dark); color: var(--bg-deep); }

.visually-hidden {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}
```

- [ ] **Step 4: Write the failing App test**

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the site name", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `./App`.

- [ ] **Step 6: Write main.tsx and a minimal App**

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:
```tsx
export default function App() {
  return <h1 className="display">Dali Sandic</h1>;
}
```

- [ ] **Step 7: Run tests, typecheck, lint, dev server**

Run: `npm test && npm run build && npm run lint`
Expected: 1 test passes, `dist/` produced, lint clean.

Run `npm run dev`, open http://localhost:5173, confirm the name renders in Bebas Neue on a near-black page. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS with tokens and test runner

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Content

**Files:**
- Create: `src/content/site.json`, `about.json`, `services.json`, `testimonials.json`, `site.ts`
- Create: `src/content/projects.ts`, `frontmatter.ts`, `journal.ts`, `journal/behind-the-scenes-the-last-horizon.md`
- Create: `public/images/dali-profile.jpg` (downloaded)
- Test: `src/content/projects.test.ts`, `frontmatter.test.ts`, `journal.test.ts`

**Interfaces:**
- Produces:
  - `type Category = "Showreel" | "Commercial" | "Narrative" | "Aerial"`, `CATEGORIES: Category[]`
  - `interface Project { slug: string; title: string; category: Category; youtubeId: string }`
  - `projects: Project[]` (12, in ring order), `filterProjects(filter: Category | "all"): Project[]`, `projectBySlug(slug): Project | undefined`, `projectByYoutubeId(id): Project | undefined`, `slugify(title): string`, `thumbnailChain(youtubeId, mobile: boolean): string[]`, `SHOWREEL: Project`
  - `interface JournalPost { slug; title; excerpt; date; readingTime; category; html }`, `journalPosts: JournalPost[]` (date desc), `postBySlug(slug)`, `postFromRaw(filename, raw)`, `sortPosts(posts)`
  - `parseFrontmatter(raw): { data: Record<string,string>; body: string }`
  - `site`, `about`, `services`, `testimonials` typed exports from `site.ts`

- [ ] **Step 1: Copy content JSON**

`src/content/site.json`:
```json
{
  "name": "Dali Sandic",
  "title": "Cinematographer & Visual Storyteller",
  "subtitle": "Crafting visual narratives that move audiences",
  "email": "Dali@sandicfilm.com",
  "phone": "+45 23 66 37 48",
  "location": "Copenhagen, Denmark",
  "availability": "Currently booking Q3 2026",
  "social": {
    "instagram": "https://instagram.com/dalisandic",
    "youtube": "https://www.youtube.com/@daliborsandic4938",
    "linkedin": "https://www.linkedin.com/in/dalibor-sandic-955204139/"
  },
  "stats": { "projects": 50, "years": 8, "clients": 20, "awards": 5 }
}
```

`src/content/about.json`:
```json
{
  "bio": "Dali Sandic is a cinematographer and visual storyteller based in Copenhagen, Denmark. With over 8 years of experience behind the camera, Dali has crafted visuals for narrative films, commercials, music videos, and documentaries across Europe and beyond.",
  "longBio": "Every frame tells a story. That belief drives every project I take on — whether it's a feature film shot over 30 days across three countries or a 30-second commercial that needs to capture lightning in a bottle. I specialize in creating visual languages that serve the narrative, blending technical precision with an intuitive feel for light, movement, and emotion.",
  "timeline": [
    { "year": 2018, "title": "First Short Film", "description": "Debuted as cinematographer on award-winning short 'Fragments'" },
    { "year": 2019, "title": "Commercial Work", "description": "Began shooting commercials for Scandinavian brands" },
    { "year": 2021, "title": "First Feature", "description": "Shot first feature-length narrative film" },
    { "year": 2023, "title": "International Work", "description": "Expanded to international productions across Europe" },
    { "year": 2025, "title": "Studio Founded", "description": "Established Sandic Film as a full-service production entity" }
  ],
  "equipment": ["ARRI Alexa Mini LF", "Sony FX6", "DJI Ronin 4D", "Cooke Anamorphic Lenses", "DaVinci Resolve"],
  "awards": [
    { "year": 2022, "title": "Best Cinematography", "event": "Nordic Short Film Festival" },
    { "year": 2023, "title": "Silver Award", "event": "Copenhagen Commercial Awards" },
    { "year": 2024, "title": "Official Selection", "event": "Gothenburg Film Festival" }
  ]
}
```

`src/content/services.json`:
```json
[
  { "id": "cinematography", "title": "Cinematography", "description": "Full-service camera operation and visual direction for narrative films, commercials, and documentaries.", "icon": "Camera" },
  { "id": "color-grading", "title": "Color Grading", "description": "Professional color correction and grading to establish mood, tone, and visual consistency across your project.", "icon": "Palette" },
  { "id": "directing", "title": "Directing", "description": "Creative direction from concept through final cut, bringing stories to life with a distinct visual voice.", "icon": "Clapperboard" },
  { "id": "consulting", "title": "Visual Consulting", "description": "Pre-production visual planning, shot design, and creative consulting for productions of any scale.", "icon": "Lightbulb" }
]
```

`src/content/testimonials.json`:
```json
[
  { "id": "1", "quote": "Dali brought our vision to life with breathtaking visuals. Every shot was a masterpiece of composition and lighting.", "name": "Anna Jensen", "role": "Director", "company": "Horizon Films", "avatar": "/images/placeholder.jpg" },
  { "id": "2", "quote": "Working with Dali was an incredible experience. His understanding of visual storytelling elevated our entire project.", "name": "Marcus Holm", "role": "Producer", "company": "Nordic Studios", "avatar": "/images/placeholder.jpg" },
  { "id": "3", "quote": "The cinematic quality Dali brings to commercial work is unmatched. Our brand video exceeded all expectations.", "name": "Sofia Larsen", "role": "Creative Director", "company": "Studio North", "avatar": "/images/placeholder.jpg" }
]
```

`src/content/journal/behind-the-scenes-the-last-horizon.md`:
```md
---
slug: "behind-the-scenes-the-last-horizon"
title: "Behind the Scenes: The Last Horizon"
excerpt: "A look at the creative process and technical challenges behind our most ambitious narrative project."
date: "2024-12-15"
readingTime: "5 min read"
category: "bts"
featuredImage: "/images/placeholder.jpg"
---

## The Challenge

When director Anna Jensen first described her vision for The Last Horizon, I knew we needed a visual approach that could shift between two distinct worlds — the warm, golden tones of memory and the cold, clinical look of reality.

## Camera and Lens Choice

We chose the ARRI Alexa Mini LF paired with Cooke Anamorphic lenses to capture the wide, cinematic frames the story demanded. The anamorphic distortion added a dreamy quality that perfectly complemented the memory sequences.

## Lighting Approach

For the memory sequences, we used a combination of natural light and warm practicals. The reality scenes required a more controlled setup with cooler color temperatures and harder shadows.
```

Download the profile photo:
```bash
mkdir -p public/images
curl -sL -o public/images/dali-profile.jpg https://raw.githubusercontent.com/Rado81/dali-portfolio/main/public/images/dali-profile.jpg
ls -la public/images/dali-profile.jpg
```
Expected: about 91 KB.

`src/content/site.ts`:
```ts
import siteJson from "./site.json";
import aboutJson from "./about.json";
import servicesJson from "./services.json";
import testimonialsJson from "./testimonials.json";

export interface SiteConfig {
  name: string; title: string; subtitle: string; email: string; phone: string;
  location: string; availability: string;
  social: { instagram: string; youtube: string; linkedin: string };
}
export interface TimelineEntry { year: number; title: string; description: string }
export interface Award { year: number; title: string; event: string }
export interface AboutContent {
  bio: string; longBio: string; timeline: TimelineEntry[]; equipment: string[]; awards: Award[];
}
export interface Service { id: string; title: string; description: string; icon: string }
export interface Testimonial { id: string; quote: string; name: string; role: string; company: string }

export const site: SiteConfig = siteJson;
export const about: AboutContent = aboutJson;
export const services: Service[] = servicesJson;
export const testimonials: Testimonial[] = testimonialsJson;
export const PROCESS_PHASES = [
  { title: "Discovery", description: "Understanding your vision, audience and goals." },
  { title: "Pre-production", description: "Shot design, lookbooks, and planning every frame." },
  { title: "Production", description: "On-set cinematography and direction." },
  { title: "Delivery", description: "Color grading and final output in every format you need." },
] as const;
```

- [ ] **Step 2: Write the failing projects test**

`src/content/projects.test.ts`:
```ts
import { projects, slugify, filterProjects, projectBySlug, thumbnailChain, SHOWREEL, projectByYoutubeId } from "./projects";

test("has 12 projects in ring order starting with the showreel", () => {
  expect(projects).toHaveLength(12);
  expect(projects[0].title).toBe("Dali Showreel");
  expect(projects[11].title).toBe("DJI Phantom 3");
  expect(SHOWREEL.youtubeId).toBe("5RXfPmbynlk");
});

test("slugs are unique and ascii", () => {
  const slugs = projects.map((p) => p.slug);
  expect(new Set(slugs).size).toBe(12);
  for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("slugify handles dashes and Danish letters", () => {
  expect(slugify("Movenorth — Lars")).toBe("movenorth-lars");
  expect(slugify("Ørsted Geo")).toBe("orsted-geo");
  expect(slugify("DJI Phantom 3")).toBe("dji-phantom-3");
});

test("filters by category", () => {
  expect(filterProjects("all")).toHaveLength(12);
  expect(filterProjects("Commercial")).toHaveLength(5);
  expect(filterProjects("Narrative")).toHaveLength(5);
  expect(filterProjects("Showreel")).toHaveLength(1);
  expect(filterProjects("Aerial")).toHaveLength(1);
});

test("looks up by slug and youtube id", () => {
  expect(projectBySlug("vlaska-teaser")?.youtubeId).toBe("KduVhrnIQI4");
  expect(projectBySlug("nope")).toBeUndefined();
  expect(projectByYoutubeId("KduVhrnIQI4")?.slug).toBe("vlaska-teaser");
});

test("thumbnail chain picks size by device and always ends with hqdefault", () => {
  expect(thumbnailChain("abc", false)).toEqual([
    "https://img.youtube.com/vi/abc/maxresdefault.jpg",
    "https://img.youtube.com/vi/abc/hqdefault.jpg",
  ]);
  expect(thumbnailChain("abc", true)[0]).toBe("https://img.youtube.com/vi/abc/sddefault.jpg");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- projects`
Expected: FAIL, cannot find module `./projects`.

- [ ] **Step 4: Write projects.ts**

```ts
export type Category = "Showreel" | "Commercial" | "Narrative" | "Aerial";
export const CATEGORIES: Category[] = ["Showreel", "Commercial", "Narrative", "Aerial"];
export type FilterId = Category | "all";

export interface Project {
  slug: string;
  title: string;
  category: Category;
  youtubeId: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "a")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
```

- [ ] **Step 5: Run projects test to verify it passes**

Run: `npm test -- projects`
Expected: 6 tests pass.

- [ ] **Step 6: Write the failing frontmatter and journal tests**

`src/content/frontmatter.test.ts`:
```ts
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
```

`src/content/journal.test.ts`:
```ts
import { journalPosts, postBySlug, postFromRaw, sortPosts } from "./journal";

test("loads the seeded post with rendered html", () => {
  expect(journalPosts).toHaveLength(1);
  const post = postBySlug("behind-the-scenes-the-last-horizon");
  expect(post?.title).toBe("Behind the Scenes: The Last Horizon");
  expect(post?.html).toContain("<h2>The Challenge</h2>");
  expect(post?.category).toBe("bts");
});

test("sorts by date descending", () => {
  const a = postFromRaw("a.md", `---\nslug: a\ntitle: A\nexcerpt: x\ndate: 2024-01-01\nreadingTime: 1 min\ncategory: gear\n---\nA`);
  const b = postFromRaw("b.md", `---\nslug: b\ntitle: B\nexcerpt: x\ndate: 2025-01-01\nreadingTime: 1 min\ncategory: gear\n---\nB`);
  expect(sortPosts([a, b]).map((p) => p.slug)).toEqual(["b", "a"]);
});

test("names the file when a required field is missing or the date is malformed", () => {
  expect(() => postFromRaw("broken.md", `---\ntitle: T\n---\nbody`)).toThrow(/broken\.md.*slug/);
  expect(() =>
    postFromRaw("d.md", `---\nslug: d\ntitle: T\nexcerpt: x\ndate: 15/12/2024\nreadingTime: 1\ncategory: bts\n---\n`),
  ).toThrow(/d\.md.*yyyy-mm-dd/);
});
```

- [ ] **Step 7: Run to verify they fail**

Run: `npm test -- content`
Expected: FAIL, modules `./frontmatter` and `./journal` not found.

- [ ] **Step 8: Write frontmatter.ts and journal.ts**

`src/content/frontmatter.ts`:
```ts
export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter block (--- ... ---)");
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`Bad frontmatter line: "${line}"`);
    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: match[2] };
}
```

`src/content/journal.ts`:
```ts
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
```

- [ ] **Step 9: Run all tests and typecheck**

Run: `npm test && npx tsc --noEmit -p tsconfig.json`
Expected: all content tests pass, no type errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add site content, projects, and journal loader

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Store

**Files:**
- Create: `src/store.ts`
- Test: `src/store.test.ts`

**Interfaces:**
- Consumes: `filterProjects`, `FilterId` from `content/projects`.
- Produces:
```ts
type Mode = "intro" | "browse" | "watching" | "panel";
type PanelId = "about" | "services" | "journal" | "contact";
interface AppState {
  mode: Mode; returnMode: "intro" | "browse"; focusedIndex: number; filter: FilterId;
  panel: PanelId | null; journalSlug: string | null; playingId: string | null;
  webgl: boolean; reducedMotion: boolean; isMobile: boolean;
  enter(): void; startBrowsing(): void; focus(i: number): void; step(delta: 1 | -1): void;
  setFilter(f: FilterId): void; play(youtubeId: string): void; stopPlaying(): void;
  openPanel(p: PanelId, journalSlug?: string | null): void; closePanel(): void;
  setWebgl(b: boolean): void; setReducedMotion(b: boolean): void; setIsMobile(b: boolean): void;
}
useStore, resetStore(), selectFocusedProject(s): Project | undefined, selectFilteredProjects(s): Project[]
```

- [ ] **Step 1: Write the failing store test**

`src/store.test.ts`:
```ts
import { useStore, resetStore, selectFocusedProject } from "./store";

beforeEach(() => resetStore());

test("starts in intro with the showreel focused and no filter", () => {
  const s = useStore.getState();
  expect(s.mode).toBe("intro");
  expect(s.filter).toBe("all");
  expect(selectFocusedProject(s)?.slug).toBe("dali-showreel");
});

test("enter moves to browse; startBrowsing is a no-op outside intro", () => {
  useStore.getState().enter();
  expect(useStore.getState().mode).toBe("browse");
  useStore.getState().openPanel("about");
  useStore.getState().startBrowsing();
  expect(useStore.getState().mode).toBe("panel");
});

test("focus wraps around the filtered list and step moves by one", () => {
  const s = useStore.getState();
  s.focus(12);
  expect(useStore.getState().focusedIndex).toBe(0);
  s.focus(-1);
  expect(useStore.getState().focusedIndex).toBe(11);
  s.step(1);
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("setFilter keeps the focused project when it is in the subset, else resets to 0", () => {
  const s = useStore.getState();
  s.focus(8); // vlaska-teaser, Narrative
  s.setFilter("Narrative");
  expect(selectFocusedProject(useStore.getState())?.slug).toBe("vlaska-teaser");
  useStore.getState().setFilter("Commercial");
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("play from intro returns to intro; play from browse returns to browse", () => {
  useStore.getState().play("5RXfPmbynlk");
  expect(useStore.getState().mode).toBe("watching");
  useStore.getState().stopPlaying();
  expect(useStore.getState().mode).toBe("intro");
  expect(useStore.getState().playingId).toBeNull();

  useStore.getState().enter();
  useStore.getState().play("KduVhrnIQI4");
  useStore.getState().stopPlaying();
  expect(useStore.getState().mode).toBe("browse");
});

test("panels open and close back to browse", () => {
  useStore.getState().enter();
  useStore.getState().openPanel("journal", "behind-the-scenes-the-last-horizon");
  let s = useStore.getState();
  expect(s.mode).toBe("panel");
  expect(s.panel).toBe("journal");
  expect(s.journalSlug).toBe("behind-the-scenes-the-last-horizon");
  s.closePanel();
  s = useStore.getState();
  expect(s.mode).toBe("browse");
  expect(s.panel).toBeNull();
  expect(s.journalSlug).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- store`
Expected: FAIL, cannot find module `./store`.

- [ ] **Step 3: Write store.ts**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- store`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store.ts src/store.test.ts
git commit -m "feat: add app store with mode transitions

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Hash routing

**Files:**
- Create: `src/routes.ts`
- Test: `src/routes.test.ts`

**Interfaces:**
- Consumes: store (Task 3), `projectBySlug`, `projectByYoutubeId`, `filterProjects` (Task 2), `postBySlug` (Task 2).
- Produces: `stateToHash(s: AppState): string`, `applyHash(hash: string): void`, `initRouting(): () => void` (returns a cleanup function).

- [ ] **Step 1: Write the failing routes test**

`src/routes.test.ts`:
```ts
import { useStore, resetStore } from "./store";
import { stateToHash, applyHash, initRouting } from "./routes";

beforeEach(() => {
  resetStore();
  window.history.replaceState(null, "", "#/");
});

test("stateToHash covers every mode", () => {
  const s = useStore.getState;
  expect(stateToHash(s())).toBe("#/");
  s().enter();
  expect(stateToHash(s())).toBe("#/work/dali-showreel");
  s().focus(8);
  expect(stateToHash(s())).toBe("#/work/vlaska-teaser");
  s().play("KduVhrnIQI4");
  expect(stateToHash(s())).toBe("#/play/vlaska-teaser");
  s().stopPlaying();
  s().openPanel("about");
  expect(stateToHash(s())).toBe("#/about");
  s().openPanel("journal");
  expect(stateToHash(s())).toBe("#/journal");
  s().openPanel("journal", "behind-the-scenes-the-last-horizon");
  expect(stateToHash(s())).toBe("#/journal/behind-the-scenes-the-last-horizon");
});

test("applyHash opens work, project, play, panels, and journal posts", () => {
  applyHash("#/work");
  expect(useStore.getState().mode).toBe("browse");

  applyHash("#/work/orsted-geo");
  expect(useStore.getState().focusedIndex).toBe(3);

  applyHash("#/play/carlsberg-vuvuzela");
  expect(useStore.getState().mode).toBe("watching");
  expect(useStore.getState().playingId).toBe("CLyKZZy71r4");

  applyHash("#/services");
  expect(useStore.getState().panel).toBe("services");

  applyHash("#/journal/behind-the-scenes-the-last-horizon");
  expect(useStore.getState().panel).toBe("journal");
  expect(useStore.getState().journalSlug).toBe("behind-the-scenes-the-last-horizon");
});

test("a project outside the current filter resets the filter to all", () => {
  useStore.getState().enter();
  useStore.getState().setFilter("Commercial");
  applyHash("#/work/vlaska-teaser");
  expect(useStore.getState().filter).toBe("all");
  expect(useStore.getState().focusedIndex).toBe(8);
});

test("unknown routes redirect to #/work", () => {
  applyHash("#/nope");
  expect(window.location.hash).toBe("#/work");
  expect(useStore.getState().mode).toBe("browse");
  applyHash("#/work/does-not-exist");
  expect(window.location.hash).toBe("#/work");
  applyHash("#/journal/missing");
  expect(window.location.hash).toBe("#/journal");
});

test("empty hash keeps intro on a fresh load", () => {
  applyHash("");
  expect(useStore.getState().mode).toBe("intro");
});

test("initRouting mirrors store changes into the hash and back", async () => {
  const stop = initRouting();
  useStore.getState().enter();
  expect(window.location.hash).toBe("#/work/dali-showreel");
  useStore.getState().openPanel("contact");
  expect(window.location.hash).toBe("#/contact");

  window.location.hash = "#/about";
  await new Promise((r) => setTimeout(r, 0));
  expect(useStore.getState().panel).toBe("about");
  stop();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- routes`
Expected: FAIL, cannot find module `./routes`.

- [ ] **Step 3: Write routes.ts**

```ts
import { filterProjects, projectBySlug, projectByYoutubeId } from "./content/projects";
import { postBySlug } from "./content/journal";
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
    if (store.mode !== "intro") useStore.setState({ mode: "browse", panel: null, journalSlug: null, playingId: null });
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
    applying = true;
    try {
      applyHash(window.location.hash);
    } finally {
      applying = false;
    }
  };

  onHashChange();
  window.addEventListener("hashchange", onHashChange);

  let prev = useStore.getState();
  const unsubscribe = useStore.subscribe((s) => {
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
```

Note on `applying` during `window.location.hash = hash`: jsdom and browsers fire `hashchange` asynchronously, so the flag is cleared before the event arrives. That is fine: the handler re-applies a hash that already matches the state, which is idempotent.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- routes`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/routes.ts src/routes.test.ts
git commit -m "feat: add hash routing mirrored with the store

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Ring layout math

**Files:**
- Create: `src/scene/layout.ts`
- Test: `src/scene/layout.test.ts`

**Interfaces:**
- Produces:
```ts
RING_RADIUS = 6; ROW_Y = 0.55; TILE_W = 1.6; TILE_H = 0.9; TWO_PI
interface TileSlot { index: number; angle: number; row: number; y: number }
rowsFor(count, wantRows: 1 | 2): 1 | 2
layoutRing(count, wantRows: 1 | 2): TileSlot[]
normalizeAngle(a): number            // [0, 2π)
shortestDelta(from, to): number      // (-π, π]
nearestIndex(rotation, slots, row?): number
rotationFor(index, slots, current): number
slotPosition(slot): [number, number, number]
slotRotationY(slot): number
```
- Convention: a tile at `angle` sits at `(R sin a, y, -R cos a)`. The ring group rotates by `rotation` around Y. A tile is directly ahead of the camera (on -Z) when `rotation === angle`.

- [ ] **Step 1: Write the failing layout test**

`src/scene/layout.test.ts`:
```ts
import {
  layoutRing, rowsFor, nearestIndex, rotationFor, shortestDelta, normalizeAngle, slotPosition, slotRotationY, RING_RADIUS,
} from "./layout";

test("12 tiles on 2 rows: 6 per row, lower row offset by half a step", () => {
  const slots = layoutRing(12, 2);
  expect(slots).toHaveLength(12);
  expect(slots.filter((s) => s.row === 0)).toHaveLength(6);
  expect(slots[0]).toMatchObject({ index: 0, angle: 0, row: 0, y: 0.55 });
  expect(slots[1].row).toBe(1);
  expect(slots[1].y).toBe(-0.55);
  expect(slots[1].angle).toBeCloseTo(Math.PI / 6);
  expect(slots[2].angle).toBeCloseTo(Math.PI / 3);
});

test("small counts collapse to one row; one row is evenly spaced at y 0", () => {
  expect(rowsFor(3, 2)).toBe(1);
  expect(rowsFor(5, 2)).toBe(2);
  const slots = layoutRing(3, 2);
  expect(slots.every((s) => s.row === 0 && s.y === 0)).toBe(true);
  expect(slots[1].angle).toBeCloseTo((2 * Math.PI) / 3);
});

test("angle helpers", () => {
  expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  expect(shortestDelta(0, 6.2)).toBeCloseTo(6.2 - 2 * Math.PI);
  expect(shortestDelta(0, Math.PI)).toBeCloseTo(Math.PI);
});

test("nearestIndex picks the tile whose angle matches the rotation, with wraparound and row filter", () => {
  const slots = layoutRing(12, 2);
  expect(nearestIndex(0, slots)).toBe(0);
  expect(nearestIndex(2 * Math.PI + 0.1, slots)).toBe(0);
  expect(nearestIndex(Math.PI / 6, slots)).toBe(1);
  expect(nearestIndex(0, slots, 1)).toBe(1);
  expect(nearestIndex(-Math.PI / 6 + 0.01, slots, 1)).toBe(11);
});

test("rotationFor takes the shortest path", () => {
  const slots = layoutRing(12, 2);
  expect(rotationFor(11, slots, 0)).toBeCloseTo(-Math.PI / 6);
  expect(rotationFor(0, slots, 2 * Math.PI - 0.1)).toBeCloseTo(2 * Math.PI);
});

test("slot position and facing", () => {
  const [x, y, z] = slotPosition({ index: 0, angle: 0, row: 0, y: 0.55 });
  expect([x, y, z]).toEqual([0, 0.55, -RING_RADIUS]);
  expect(slotRotationY({ index: 3, angle: Math.PI / 2, row: 0, y: 0 })).toBeCloseTo(-Math.PI / 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- layout`
Expected: FAIL, cannot find module `./layout`.

- [ ] **Step 3: Write layout.ts**

```ts
export const RING_RADIUS = 6;
export const ROW_Y = 0.55;
export const TILE_W = 1.6;
export const TILE_H = 0.9;
export const TWO_PI = Math.PI * 2;

export interface TileSlot {
  index: number;
  angle: number;
  row: number;
  y: number;
}

export function rowsFor(count: number, wantRows: 1 | 2): 1 | 2 {
  return wantRows === 2 && count > 4 ? 2 : 1;
}

export function layoutRing(count: number, wantRows: 1 | 2): TileSlot[] {
  const rows = rowsFor(count, wantRows);
  const perRow = Math.ceil(count / rows);
  const step = TWO_PI / perRow;
  return Array.from({ length: count }, (_, index) => {
    const row = index % rows;
    const col = Math.floor(index / rows);
    const angle = col * step + (row === 1 ? step / 2 : 0);
    const y = rows === 1 ? 0 : row === 0 ? ROW_Y : -ROW_Y;
    return { index, angle, row, y };
  });
}

export function normalizeAngle(a: number): number {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

export function shortestDelta(from: number, to: number): number {
  let d = normalizeAngle(to - from);
  if (d > Math.PI) d -= TWO_PI;
  return d;
}

export function nearestIndex(rotation: number, slots: TileSlot[], row?: number): number {
  let best = -1;
  let bestDist = Infinity;
  for (const s of slots) {
    if (row !== undefined && s.row !== row) continue;
    const dist = Math.abs(shortestDelta(rotation, s.angle));
    if (dist < bestDist) {
      bestDist = dist;
      best = s.index;
    }
  }
  return best;
}

export function rotationFor(index: number, slots: TileSlot[], current: number): number {
  return current + shortestDelta(current, slots[index].angle);
}

export function slotPosition(slot: TileSlot): [number, number, number] {
  return [RING_RADIUS * Math.sin(slot.angle), slot.y, -RING_RADIUS * Math.cos(slot.angle)];
}

export function slotRotationY(slot: TileSlot): number {
  return -slot.angle;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- layout`
Expected: 6 tests pass. If `slotPosition` returns `-0` for x, change the test to `toBeCloseTo` per component.

- [ ] **Step 5: Commit**

```bash
git add src/scene/layout.ts src/scene/layout.test.ts
git commit -m "feat: add pure ring layout math

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Drag physics

**Files:**
- Create: `src/scene/ringPhysics.ts`
- Test: `src/scene/ringPhysics.test.ts`

**Interfaces:**
- Produces:
```ts
interface RingMotion { rotation: number; velocity: number; target: number | null }
DRAG_GAIN_DESKTOP = 0.006; DRAG_GAIN_TOUCH = 0.012; WHEEL_GAIN = 0.0015; DECAY = 0.92;
SNAP_VELOCITY = 0.002; SNAP_TAU_MS = 80; CLICK_MAX_PX = 6; CLICK_MAX_MS = 200; FRAME_MS = 1000 / 60
idle(): RingMotion
dragBy(m, deltaPx, gain): RingMotion        // rotation -= deltaPx * gain, velocity = -deltaPx * gain, target null
release(m): RingMotion                        // keeps velocity, target null
addWheel(m, deltaX, deltaY): RingMotion      // velocity += (deltaX + deltaY) * WHEEL_GAIN, target null
integrate(m, dtMs, snapTargetFor: (rotation: number) => number): RingMotion
isSettled(m): boolean
isClick(distancePx, durationMs): boolean
```
- Sign convention: dragging right (positive deltaPx) decreases rotation so tiles follow the pointer. Wheel down (positive deltaY) increases rotation, advancing to the next tile.

- [ ] **Step 1: Write the failing physics test**

`src/scene/ringPhysics.test.ts`:
```ts
import { idle, dragBy, release, addWheel, integrate, isSettled, isClick, DECAY, SNAP_VELOCITY, FRAME_MS } from "./ringPhysics";

const snapToHalf = (r: number) => Math.round(r * 2) / 2;

test("dragging right decreases rotation and records velocity", () => {
  const m = dragBy(idle(), 100, 0.006);
  expect(m.rotation).toBeCloseTo(-0.6);
  expect(m.velocity).toBeCloseTo(-0.6);
  expect(m.target).toBeNull();
});

test("velocity decays per frame and rotation advances while coasting", () => {
  let m = release({ rotation: 0, velocity: 0.1, target: null });
  m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.rotation).toBeCloseTo(0.1);
  expect(m.velocity).toBeCloseTo(0.1 * DECAY);
  expect(m.target).toBeNull();
});

test("decay is frame-rate independent", () => {
  const one = integrate({ rotation: 0, velocity: 0.1, target: null }, FRAME_MS * 2, snapToHalf);
  const two = integrate(integrate({ rotation: 0, velocity: 0.1, target: null }, FRAME_MS, snapToHalf), FRAME_MS, snapToHalf);
  expect(one.velocity).toBeCloseTo(two.velocity, 5);
});

test("below the snap velocity a target is chosen and approached, then settles", () => {
  let m = { rotation: 0.3, velocity: SNAP_VELOCITY / 2, target: null as number | null };
  m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.target).toBe(0.5);
  expect(m.velocity).toBe(0);
  for (let i = 0; i < 60; i++) m = integrate(m, FRAME_MS, snapToHalf);
  expect(m.rotation).toBe(0.5);
  expect(isSettled(m)).toBe(true);
});

test("wheel adds velocity from both axes and cancels a snap", () => {
  const m = addWheel({ rotation: 0, velocity: 0, target: 0.5 }, 100, 100);
  expect(m.velocity).toBeCloseTo(0.3);
  expect(m.target).toBeNull();
});

test("click detection", () => {
  expect(isClick(3, 100)).toBe(true);
  expect(isClick(10, 100)).toBe(false);
  expect(isClick(3, 300)).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ringPhysics`
Expected: FAIL, cannot find module `./ringPhysics`.

- [ ] **Step 3: Write ringPhysics.ts**

```ts
export interface RingMotion {
  rotation: number;
  velocity: number; // radians per 60 fps frame
  target: number | null;
}

export const DRAG_GAIN_DESKTOP = 0.006;
export const DRAG_GAIN_TOUCH = 0.012;
export const WHEEL_GAIN = 0.0015;
export const DECAY = 0.92;
export const SNAP_VELOCITY = 0.002;
export const SNAP_TAU_MS = 80;
export const CLICK_MAX_PX = 6;
export const CLICK_MAX_MS = 200;
export const FRAME_MS = 1000 / 60;
const SETTLE_EPS = 0.0005;

export function idle(): RingMotion {
  return { rotation: 0, velocity: 0, target: null };
}

export function dragBy(m: RingMotion, deltaPx: number, gain: number): RingMotion {
  const d = -deltaPx * gain;
  return { rotation: m.rotation + d, velocity: d, target: null };
}

export function release(m: RingMotion): RingMotion {
  return { ...m, target: null };
}

export function addWheel(m: RingMotion, deltaX: number, deltaY: number): RingMotion {
  return { ...m, velocity: m.velocity + (deltaX + deltaY) * WHEEL_GAIN, target: null };
}

export function integrate(m: RingMotion, dtMs: number, snapTargetFor: (rotation: number) => number): RingMotion {
  const frames = dtMs / FRAME_MS;
  if (m.target === null) {
    let rotation = m.rotation + m.velocity * frames;
    let velocity = m.velocity * Math.pow(DECAY, frames);
    let target: number | null = null;
    if (Math.abs(velocity) < SNAP_VELOCITY) {
      velocity = 0;
      target = snapTargetFor(rotation);
    }
    return { rotation, velocity, target };
  }
  const k = 1 - Math.exp(-dtMs / SNAP_TAU_MS);
  let rotation = m.rotation + (m.target - m.rotation) * k;
  if (Math.abs(m.target - rotation) < SETTLE_EPS) rotation = m.target;
  return { rotation, velocity: 0, target: m.target };
}

export function isSettled(m: RingMotion): boolean {
  return m.target !== null && m.rotation === m.target;
}

export function isClick(distancePx: number, durationMs: number): boolean {
  return distancePx <= CLICK_MAX_PX && durationMs <= CLICK_MAX_MS;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ringPhysics`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/scene/ringPhysics.ts src/scene/ringPhysics.test.ts
git commit -m "feat: add pure ring drag physics

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The 3D scene

**Files:**
- Create: `src/device.ts`, `src/scene/useThumbnail.ts`, `src/scene/useRingDrag.ts`, `src/scene/Tile.tsx`, `src/scene/Ring.tsx`, `src/scene/CameraRig.tsx`, `src/scene/Effects.tsx`, `src/scene/Scene.tsx`, `src/scene/Stage.tsx`, `src/scene/stage.css`
- Modify: `src/App.tsx`, `src/App.test.tsx`
- Test: `src/device.test.ts`, `src/scene/useThumbnail.test.ts`

**Interfaces:**
- Consumes: store, layout, ringPhysics, `filterProjects`, `thumbnailChain`.
- Produces: `<Stage/>` (self-contained canvas), `detectWebGL(): boolean`, `isMobileViewport(width?): boolean`, `prefersReducedMotion(): boolean`, `fpsForMode(mode): "always" | number`, `loadThumbnail(urls: string[], loader?): Promise<Texture | null>`, `useThumbnail(youtubeId): Texture | null`.

- [ ] **Step 1: Write the failing device test**

`src/device.test.ts`:
```ts
import { detectWebGL, isMobileViewport, fpsForMode } from "./device";

test("detectWebGL is false when no context can be created", () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = () => null;
  expect(detectWebGL()).toBe(false);
  HTMLCanvasElement.prototype.getContext = original;
});

test("detectWebGL is true when a webgl context exists", () => {
  const original = HTMLCanvasElement.prototype.getContext;
  // @ts-expect-error minimal stub
  HTMLCanvasElement.prototype.getContext = (kind: string) => (kind.startsWith("webgl") ? {} : null);
  expect(detectWebGL()).toBe(true);
  HTMLCanvasElement.prototype.getContext = original;
});

test("mobile breakpoint is 768", () => {
  expect(isMobileViewport(767)).toBe(true);
  expect(isMobileViewport(768)).toBe(false);
});

test("frame rate per mode", () => {
  expect(fpsForMode("intro")).toBe("always");
  expect(fpsForMode("browse")).toBe("always");
  expect(fpsForMode("panel")).toBe(30);
  expect(fpsForMode("watching")).toBe(10);
});
```

- [ ] **Step 2: Run to verify it fails, then write device.ts**

Run: `npm test -- device` → FAIL, module not found.

`src/device.ts`:
```ts
import type { Mode } from "./store";

export function detectWebGL(): boolean {
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
```

Run: `npm test -- device` → 4 tests pass.

- [ ] **Step 3: Write the failing thumbnail loader test**

`src/scene/useThumbnail.test.ts`:
```ts
import { loadThumbnail } from "./useThumbnail";

function fakeLoader(sizes: Record<string, number | "error">) {
  return {
    loadAsync: async (url: string) => {
      const size = sizes[url];
      if (size === "error" || size === undefined) throw new Error("404");
      return { image: { width: size, height: 90 }, colorSpace: "", repeat: { set: vi.fn() }, offset: { set: vi.fn() }, dispose: vi.fn() };
    },
  };
}

test("uses the first url when it is a real image", async () => {
  const t = await loadThumbnail(["a", "b"], fakeLoader({ a: 1280, b: 480 }) as never);
  expect(t?.image.width).toBe(1280);
});

test("falls through when YouTube returns its 120px stand-in or an error", async () => {
  const t = await loadThumbnail(["a", "b"], fakeLoader({ a: 120, b: 480 }) as never);
  expect(t?.image.width).toBe(480);
  const u = await loadThumbnail(["a", "b"], fakeLoader({ a: "error", b: 480 }) as never);
  expect(u?.image.width).toBe(480);
});

test("returns null when every url fails", async () => {
  expect(await loadThumbnail(["a"], fakeLoader({}) as never)).toBeNull();
});

test("crops the 4:3 hqdefault letterbox to 16:9", async () => {
  const t = await loadThumbnail(["x/hqdefault.jpg"], fakeLoader({ "x/hqdefault.jpg": 480 }) as never);
  expect(t?.repeat.set).toHaveBeenCalledWith(1, 0.75);
  expect(t?.offset.set).toHaveBeenCalledWith(0, 0.125);
});
```

- [ ] **Step 4: Run to verify it fails, then write useThumbnail.ts**

Run: `npm test -- useThumbnail` → FAIL, module not found.

`src/scene/useThumbnail.ts`:
```ts
import { useEffect, useState } from "react";
import { SRGBColorSpace, Texture, TextureLoader } from "three";
import { thumbnailChain } from "../content/projects";
import { useStore } from "../store";

const STAND_IN_WIDTH = 120;
const sharedLoader = new TextureLoader();
sharedLoader.setCrossOrigin("anonymous");
const cache = new Map<string, Promise<Texture | null>>();

export async function loadThumbnail(urls: string[], loader: TextureLoader = sharedLoader): Promise<Texture | null> {
  for (const url of urls) {
    try {
      const texture = await loader.loadAsync(url);
      const width = (texture.image as { width?: number } | undefined)?.width ?? 0;
      if (width <= STAND_IN_WIDTH) {
        texture.dispose();
        continue;
      }
      texture.colorSpace = SRGBColorSpace;
      if (url.endsWith("hqdefault.jpg")) {
        texture.repeat.set(1, 0.75);
        texture.offset.set(0, 0.125);
      }
      return texture;
    } catch {
      continue;
    }
  }
  return null;
}

export function useThumbnail(youtubeId: string): Texture | null {
  const isMobile = useStore((s) => s.isMobile);
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const key = `${youtubeId}:${isMobile ? "m" : "d"}`;
    let promise = cache.get(key);
    if (!promise) {
      promise = loadThumbnail(thumbnailChain(youtubeId, isMobile));
      cache.set(key, promise);
    }
    let alive = true;
    promise.then((t) => {
      if (alive) setTexture(t);
    });
    return () => {
      alive = false;
    };
  }, [youtubeId, isMobile]);

  return texture;
}
```

Run: `npm test -- useThumbnail` → 4 tests pass.

- [ ] **Step 5: Write useRingDrag.ts**

```ts
import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import { useStore } from "../store";
import { nearestIndex, rotationFor, type TileSlot } from "./layout";
import {
  addWheel, dragBy, idle, integrate, isClick, isSettled, release, type RingMotion,
  DRAG_GAIN_DESKTOP, DRAG_GAIN_TOUCH,
} from "./ringPhysics";

const IDLE_RAD_PER_SEC = 0.05;
const ROW_SWITCH_PX = 40;

/**
 * Drives `group.rotation.y` from pointer, wheel and keyboard state.
 * Writes `focusedIndex` to the store when the ring settles on a tile,
 * and follows `focusedIndex` when something else changes it.
 */
export function useRingDrag(group: RefObject<Group | null>, slots: TileSlot[]): void {
  const gl = useThree((s) => s.gl);
  const motion = useRef<RingMotion>(idle());
  const lastFocused = useRef<number>(-1);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let startX = 0, startY = 0, lastX = 0, startT = 0, rowSwitched = false;

    const gain = () => (useStore.getState().isMobile ? DRAG_GAIN_TOUCH : DRAG_GAIN_DESKTOP);
    const canDrag = () => useStore.getState().mode === "browse";

    const onDown = (e: PointerEvent) => {
      if (!canDrag()) return;
      dragging = true;
      rowSwitched = false;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (useStore.getState().reducedMotion) return;
      motion.current = dragBy(motion.current, dx, gain());
      const dy = e.clientY - startY;
      if (!rowSwitched && Math.abs(dy) > ROW_SWITCH_PX && Math.abs(dy) > Math.abs(e.clientX - startX)) {
        rowSwitched = true;
        switchRow(dy > 0 ? 1 : 0);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const dur = performance.now() - startT;
      if (isClick(dist, dur)) {
        motion.current = { ...motion.current, velocity: 0, target: null };
        return; // Tile onClick handles selection
      }
      if (useStore.getState().reducedMotion) {
        const dir = e.clientX < startX ? 1 : -1;
        useStore.getState().step(dir);
        return;
      }
      motion.current = release(motion.current);
    };
    const onWheel = (e: WheelEvent) => {
      if (!canDrag()) return;
      e.preventDefault();
      if (e.shiftKey) {
        switchRow(e.deltaY > 0 ? 1 : 0);
        return;
      }
      if (useStore.getState().reducedMotion) {
        useStore.getState().step(e.deltaY + e.deltaX > 0 ? 1 : -1);
        return;
      }
      motion.current = addWheel(motion.current, e.deltaX, e.deltaY);
    };
    const switchRow = (row: number) => {
      const s = useStore.getState();
      const current = slotsRef.current[s.focusedIndex];
      if (!current || current.row === row) return;
      const idx = nearestIndex(motion.current.rotation, slotsRef.current, row);
      if (idx !== -1) s.focus(idx);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.style.touchAction = "none";
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const s = useStore.getState();
    const dtMs = Math.min(delta * 1000, 100);
    const current = slotsRef.current;
    if (current.length === 0) return;

    if (s.mode === "intro" || s.mode === "panel") {
      if (!s.reducedMotion) motion.current = { rotation: motion.current.rotation + (IDLE_RAD_PER_SEC * dtMs) / 1000, velocity: 0, target: null };
      lastFocused.current = -1; // force re-snap when we come back
    } else {
      if (s.focusedIndex !== lastFocused.current) {
        const target = rotationFor(s.focusedIndex, current, motion.current.rotation);
        motion.current = { ...motion.current, velocity: 0, target };
        lastFocused.current = s.focusedIndex;
      }
      const wasSettled = isSettled(motion.current);
      motion.current = integrate(motion.current, dtMs, (r) => {
        const idx = nearestIndex(r, current, current[s.focusedIndex]?.row);
        return rotationFor(idx, current, r);
      });
      if (!wasSettled && isSettled(motion.current)) {
        const idx = nearestIndex(motion.current.rotation, current);
        if (idx !== s.focusedIndex) {
          lastFocused.current = idx;
          s.focus(idx);
        }
      }
    }

    if (group.current) group.current.rotation.y = motion.current.rotation;
  });
}
```

- [ ] **Step 6: Write Tile.tsx**

```tsx
import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { animated, useSpring } from "@react-spring/three";
import { Text } from "@react-three/drei";
import type { MeshStandardMaterial } from "three";
import type { Project } from "../content/projects";
import { slotPosition, slotRotationY, TILE_H, TILE_W, type TileSlot } from "./layout";
import { useThumbnail } from "./useThumbnail";
import { CLICK_MAX_PX } from "./ringPhysics";

interface TileProps {
  slot: TileSlot;
  project: Project;
  focused: boolean;
  dim: boolean;
  onSelect(index: number): void;
}

export function Tile({ slot, project, focused, dim, onSelect }: TileProps) {
  const texture = useThumbnail(project.youtubeId);
  const [hovered, setHovered] = useState(false);
  const material = useRef<MeshStandardMaterial>(null);

  const tint = dim ? 0.45 : focused ? 1 : hovered ? 0.9 : 0.75;
  const { scale, tintValue, edge } = useSpring({
    from: { scale: 0, tintValue: 0.45, edge: 0 },
    to: { scale: focused ? 1.25 : hovered ? 1.08 : 1, tintValue: tint, edge: focused ? 1 : 0 },
    config: { tension: 170, friction: 26 },
  });

  useFrame(() => {
    if (material.current) material.current.color.setScalar(tintValue.get());
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta <= CLICK_MAX_PX) onSelect(slot.index);
  };

  return (
    <group position={slotPosition(slot)} rotation-y={slotRotationY(slot)}>
      <animated.mesh
        scale={scale}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
      >
        <planeGeometry args={[TILE_W, TILE_H]} />
        {texture ? (
          <meshStandardMaterial
            ref={material}
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={0.35}
            roughness={0.9}
            metalness={0}
          />
        ) : (
          <meshStandardMaterial ref={material} color="#111111" roughness={1} />
        )}
      </animated.mesh>
      {!texture && (
        <Text position={[0, 0, 0.01]} fontSize={0.12} color="#F5F5F5" maxWidth={TILE_W * 0.9} textAlign="center" anchorX="center" anchorY="middle">
          {project.title.toUpperCase()}
        </Text>
      )}
      <animated.mesh position-z={-0.01} scale={scale.to((s) => s * 1.02)}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <animated.meshBasicMaterial color="#D4AF37" transparent opacity={edge} toneMapped={false} />
      </animated.mesh>
      <mesh position={[0, -0.08, -0.05]} scale={[1.04, 1.04, 1]}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
```

Note: `document.body.style.cursor` is the one DOM touch allowed in scene code because fiber offers no cursor API. Keep it to this line.

- [ ] **Step 7: Write Ring.tsx, CameraRig.tsx, Effects.tsx, Scene.tsx, Stage.tsx**

`src/scene/Ring.tsx`:
```tsx
import { useCallback, useMemo, useRef } from "react";
import type { Group } from "three";
import { filterProjects } from "../content/projects";
import { useStore } from "../store";
import { layoutRing } from "./layout";
import { Tile } from "./Tile";
import { useRingDrag } from "./useRingDrag";

export function Ring() {
  const filter = useStore((s) => s.filter);
  const isMobile = useStore((s) => s.isMobile);
  const mode = useStore((s) => s.mode);
  const focusedIndex = useStore((s) => s.focusedIndex);

  const projects = useMemo(() => filterProjects(filter), [filter]);
  const slots = useMemo(() => layoutRing(projects.length, isMobile ? 1 : 2), [projects.length, isMobile]);
  const group = useRef<Group>(null);
  useRingDrag(group, slots);

  const dim = mode === "intro" || mode === "panel";

  const handleSelect = useCallback(
    (index: number) => {
      const s = useStore.getState();
      if (s.mode !== "browse") return;
      if (index === s.focusedIndex) s.play(projects[index].youtubeId);
      else s.focus(index);
    },
    [projects],
  );

  return (
    <group ref={group}>
      {projects.map((p, i) => (
        <Tile key={p.slug} slot={slots[i]} project={p} focused={i === focusedIndex && !dim} dim={dim} onSelect={handleSelect} />
      ))}
    </group>
  );
}
```

`src/scene/CameraRig.tsx`:
```tsx
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { useStore } from "../store";
import { layoutRing, RING_RADIUS } from "./layout";
import { filterProjects } from "../content/projects";

const INTRO_POS: [number, number, number] = [0, 1.2, 7.5];
const INTRO_LOOK: [number, number, number] = [0, 0, 0];

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const mode = useStore((s) => s.mode);
  const focusedIndex = useStore((s) => s.focusedIndex);
  const filter = useStore((s) => s.filter);
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const count = filterProjects(filter).length;
  const rowY = layoutRing(count, isMobile ? 1 : 2)[focusedIndex]?.y ?? 0;
  const inside = mode !== "intro";

  const { pos, look } = useSpring({
    pos: inside ? [0, 0, 0] : INTRO_POS,
    look: inside ? [0, rowY, -RING_RADIUS] : INTRO_LOOK,
    config: { tension: 120, friction: 30 },
    immediate: reducedMotion,
  });

  useFrame(() => {
    const p = pos.get() as [number, number, number];
    const l = look.get() as [number, number, number];
    camera.position.set(p[0], p[1], p[2]);
    camera.lookAt(l[0], l[1], l[2]);
  });

  return null;
}
```

`src/scene/Effects.tsx`:
```tsx
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useStore } from "../store";

export function Effects() {
  const isMobile = useStore((s) => s.isMobile);
  const reducedMotion = useStore((s) => s.reducedMotion);
  if (isMobile || reducedMotion) return null;
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.85} intensity={0.6} mipmapBlur />
    </EffectComposer>
  );
}
```

`src/scene/Scene.tsx`:
```tsx
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Ring } from "./Ring";

export function Scene() {
  return (
    <>
      <fog attach="fog" args={["#050505", 4, 9]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} color="#D4AF37" intensity={0.4} />
      <Ring />
      <CameraRig />
      <Effects />
    </>
  );
}
```

`src/scene/stage.css`:
```css
.stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  transition: filter 0.6s var(--ease-out);
}
.stage--blurred { filter: blur(6px); }
.stage canvas { display: block; }
```

`src/scene/Stage.tsx`:
```tsx
import { Canvas } from "@react-three/fiber";
import { useStore } from "../store";
import { Scene } from "./Scene";
import "./stage.css";

export function Stage() {
  const mode = useStore((s) => s.mode);
  const isMobile = useStore((s) => s.isMobile);
  const blurred = mode === "intro" || mode === "panel";

  return (
    <div className={"stage" + (blurred ? " stage--blurred" : "")} aria-hidden="true">
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ fov: 60, near: 0.1, far: 30, position: [0, 1.2, 7.5] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#050505")}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 8: Wire App with device detection and a temporary Enter button; update the App test**

`src/App.tsx`:
```tsx
import { useEffect } from "react";
import { detectWebGL, isMobileViewport, prefersReducedMotion } from "./device";
import { useStore } from "./store";
import { Stage } from "./scene/Stage";

export default function App() {
  const webgl = useStore((s) => s.webgl);
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    const s = useStore.getState();
    s.setWebgl(detectWebGL());
    s.setIsMobile(isMobileViewport());
    s.setReducedMotion(prefersReducedMotion());
    const onResize = () => useStore.getState().setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {webgl && <Stage />}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 10 }}>
        <h1 className="display">Dali Sandic</h1>
        {mode === "intro" && (
          <button className="btn btn--solid" onClick={() => useStore.getState().enter()}>
            Enter
          </button>
        )}
      </div>
    </>
  );
}
```

`src/App.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";
import { resetStore } from "./store";

vi.mock("./scene/Stage", () => ({ Stage: () => <div data-testid="stage" /> }));

beforeEach(() => resetStore());

test("renders the site name", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
});
```

- [ ] **Step 9: Run tests, typecheck, and look at it**

Run: `npm test && npx tsc --noEmit -p tsconfig.json`
Expected: all pass.

Run `npm run dev`. Open http://localhost:5173. Expected: a blurred ring of 12 thumbnails seen from outside, slowly turning. Click Enter: the camera glides inside over about a second, blur lifts, the showreel tile is centred, larger, with a gold edge. Drag left and right: the ring spins with the pointer, coasts, and snaps to a tile. Wheel spins it. Click a non-centred tile: it rotates to centre. Resize below 768 px: one row.

Capture a screenshot for the record:
```bash
npx playwright screenshot --browser chromium --viewport-size=1440,900 --wait-for-timeout=4000 http://localhost:5173 docs/superpowers/screenshots/task7-intro.png
```
If the ring is not visible, check the browser console first, then confirm textures load (network tab shows img.youtube.com requests returning 200).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: render the 3D ring with drag, snap, camera fly-in, and bloom

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Intro, Nav, Filter, Caption overlays

**Files:**
- Create: `src/ui/overlay.css`, `src/ui/Overlay.tsx`, `src/ui/Intro.tsx`, `src/ui/Nav.tsx`, `src/ui/Filter.tsx`, `src/ui/Caption.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/Intro.test.tsx`, `src/ui/Nav.test.tsx`, `src/ui/Filter.test.tsx`, `src/ui/Caption.test.tsx`

**Interfaces:**
- Consumes: store, `site`, `SHOWREEL`, `CATEGORIES`, `selectFocusedProject`, `initRouting`.
- Produces: `<Overlay/>` which renders the right overlays for the current mode. Later tasks add `<Panel/>`, `<Player/>`, `<Grain/>`, `<ProjectList/>` inside it.

- [ ] **Step 1: Write the failing overlay tests**

`src/ui/Intro.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Intro } from "./Intro";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("shows name and tagline, Enter moves to browse, Watch Reel plays the showreel", async () => {
  render(<Intro />);
  expect(screen.getByRole("heading", { name: /dali sandic/i })).toBeInTheDocument();
  expect(screen.getByText(/cinematographer & visual storyteller/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /watch reel/i }));
  expect(useStore.getState().mode).toBe("watching");
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
  useStore.getState().stopPlaying();
  await userEvent.click(screen.getByRole("button", { name: /enter the work/i }));
  expect(useStore.getState().mode).toBe("browse");
});
```

`src/ui/Nav.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Nav } from "./Nav";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("links point at hash routes and the open panel is marked current", () => {
  useStore.getState().enter();
  useStore.getState().openPanel("services");
  render(<Nav />);
  expect(screen.getByRole("link", { name: /^work$/i })).toHaveAttribute("href", "#/work");
  expect(screen.getByRole("link", { name: /services/i })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "#/contact");
  expect(screen.getByRole("link", { name: /sandic/i })).toHaveAttribute("href", "#/work");
});
```

`src/ui/Filter.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Filter } from "./Filter";
import { useStore, resetStore } from "../store";

beforeEach(() => resetStore());

test("renders All plus the four categories and sets the filter", async () => {
  render(<Filter />);
  expect(screen.getAllByRole("button")).toHaveLength(5);
  expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: /narrative/i }));
  expect(useStore.getState().filter).toBe("Narrative");
  expect(screen.getByRole("button", { name: /narrative/i })).toHaveAttribute("aria-pressed", "true");
});
```

`src/ui/Caption.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Caption } from "./Caption";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("shows the focused piece, steps with the arrows, and plays", async () => {
  render(<Caption />);
  expect(screen.getByRole("heading", { name: /dali showreel/i })).toBeInTheDocument();
  expect(screen.getByText(/showreel/i, { selector: "p" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /next/i }));
  expect(screen.getByRole("heading", { name: /lifestyle mix commercials/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /previous/i }));
  await userEvent.click(screen.getByRole("button", { name: /^play$/i }));
  expect(useStore.getState().playingId).toBe("5RXfPmbynlk");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- ui`
Expected: FAIL, four modules not found.

- [ ] **Step 3: Write overlay.css**

`src/ui/overlay.css`:
```css
.overlay-layer { position: fixed; inset: 0; z-index: 2; pointer-events: none; }
.overlay-layer > * { pointer-events: auto; }

/* Intro */
.intro {
  position: fixed; inset: 0; z-index: 3;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 24px;
  animation: fade-in 0.6s var(--ease-out);
}
.intro__play {
  width: 72px; height: 72px; border-radius: 50%;
  border: 2px solid rgba(212, 175, 55, 0.5);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 32px; transition: border-color 0.3s, transform 0.3s;
}
.intro__play:hover { border-color: var(--gold); transform: scale(1.1); }
.intro__play svg { width: 24px; height: 24px; fill: var(--gold); margin-left: 3px; }
.intro__name { font-size: clamp(48px, 9vw, 96px); }
.intro__tagline { margin-top: 12px; }
.intro__actions { display: flex; gap: 16px; margin-top: 40px; flex-wrap: wrap; justify-content: center; }

/* Nav */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 4;
  display: flex; align-items: center; justify-content: space-between;
  height: 72px; padding: 0 32px;
  animation: fade-in 0.4s var(--ease-out);
}
.nav__brand { font-family: var(--font-display); letter-spacing: var(--tracking-display); text-transform: uppercase; color: var(--gold); font-size: 18px; text-decoration: none; }
.nav__links { display: flex; gap: 32px; align-items: center; list-style: none; margin: 0; padding: 0; }
.nav__link { font-size: 11px; letter-spacing: var(--tracking-label); text-transform: uppercase; text-decoration: none; color: var(--text-primary); transition: color 0.25s; }
.nav__link:hover, .nav__link[aria-current="page"] { color: var(--gold); }
.nav__link--cta { background: var(--gold); color: var(--bg-deep); padding: 10px 20px; border-radius: 2px; font-size: 10px; }
.nav__link--cta:hover { background: var(--gold-dark); color: var(--bg-deep); }
.nav__burger { display: none; width: 24px; height: 24px; flex-direction: column; justify-content: center; gap: 6px; }
.nav__burger span { display: block; height: 1px; background: var(--gold); }
.nav__burger span:first-child { width: 20px; }
.nav__burger span:last-child { width: 14px; }
.nav__sheet { display: none; }
@media (max-width: 767px) {
  .nav { padding: 0 20px; height: 64px; }
  .nav__links { display: none; }
  .nav__burger { display: flex; }
  .nav__sheet {
    position: fixed; inset: 0; background: var(--bg-deep); z-index: 5;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px;
    list-style: none; margin: 0; padding: 0;
  }
  .nav__sheet .nav__link { font-size: 28px; letter-spacing: var(--tracking-wide); font-weight: 300; }
}

/* Filter */
.filter { position: fixed; top: 84px; left: 0; right: 0; z-index: 3; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; padding: 0 16px; animation: fade-in 0.4s var(--ease-out); }
.filter__chip { font-size: 10px; letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--text-secondary); padding: 6px 2px; border-bottom: 1px solid transparent; transition: color 0.25s, border-color 0.25s; }
.filter__chip:hover { color: var(--text-primary); }
.filter__chip[aria-pressed="true"] { color: var(--gold); border-bottom-color: var(--gold); }

/* Caption */
.caption { position: fixed; left: 0; right: 0; bottom: 40px; z-index: 3; display: flex; align-items: center; justify-content: center; gap: 32px; padding: 0 16px; animation: fade-in 0.4s var(--ease-out); }
.caption__body { text-align: center; min-width: 200px; animation: fade-in 0.2s var(--ease-out); }
.caption__title { font-size: 28px; }
.caption__category { margin-top: 6px; color: var(--gold); }
.caption__play { margin-top: 14px; }
.caption__arrow { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--text-subtle); color: var(--text-secondary); font-size: 20px; transition: border-color 0.25s, color 0.25s; }
.caption__arrow:hover { border-color: var(--gold); color: var(--gold); }
@media (max-width: 767px) { .caption { bottom: 24px; gap: 16px; } .caption__title { font-size: 22px; } }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```

- [ ] **Step 4: Write the four components and Overlay**

`src/ui/Intro.tsx`:
```tsx
import { site } from "../content/site";
import { SHOWREEL } from "../content/projects";
import { useStore } from "../store";

export function Intro() {
  const play = useStore((s) => s.play);
  const enter = useStore((s) => s.enter);
  return (
    <section className="intro">
      <button className="intro__play" aria-label="Play showreel" onClick={() => play(SHOWREEL.youtubeId)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </button>
      <h1 className="display intro__name">{site.name}</h1>
      <p className="label intro__tagline">{site.title}</p>
      <div className="intro__actions">
        <button className="btn" onClick={() => play(SHOWREEL.youtubeId)}>Watch Reel</button>
        <button className="btn btn--solid" onClick={enter}>Enter the Work</button>
      </div>
    </section>
  );
}
```

`src/ui/Nav.tsx`:
```tsx
import { useEffect, useState } from "react";
import { useStore, type PanelId } from "../store";

const LINKS: { href: string; label: string; panel: PanelId | null; cta?: boolean }[] = [
  { href: "#/work", label: "Work", panel: null },
  { href: "#/about", label: "About", panel: "about" },
  { href: "#/services", label: "Services", panel: "services" },
  { href: "#/journal", label: "Journal", panel: "journal" },
  { href: "#/contact", label: "Contact", panel: "contact", cta: true },
];

export function Nav() {
  const mode = useStore((s) => s.mode);
  const panel = useStore((s) => s.panel);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [mode, panel]);

  const isCurrent = (p: PanelId | null) => (mode === "panel" ? panel === p : mode === "browse" && p === null);

  const items = LINKS.map((l) => (
    <li key={l.href}>
      <a className={"nav__link" + (l.cta ? " nav__link--cta" : "")} href={l.href} aria-current={isCurrent(l.panel) ? "page" : undefined}>
        {l.label}
      </a>
    </li>
  ));

  return (
    <header className="nav">
      <a className="nav__brand" href="#/work">Sandic</a>
      <ul className="nav__links">{items}</ul>
      <button className="nav__burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span /><span />
      </button>
      {open && <ul className="nav__sheet">{items}</ul>}
    </header>
  );
}
```

`src/ui/Filter.tsx`:
```tsx
import { CATEGORIES, type FilterId } from "../content/projects";
import { useStore } from "../store";

const OPTIONS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ id: c as FilterId, label: c })),
];

export function Filter() {
  const filter = useStore((s) => s.filter);
  const setFilter = useStore((s) => s.setFilter);
  return (
    <div className="filter" role="group" aria-label="Filter work by category">
      {OPTIONS.map((o) => (
        <button key={o.id} className="filter__chip" aria-pressed={filter === o.id} onClick={() => setFilter(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

`src/ui/Caption.tsx`:
```tsx
import { selectFocusedProject, useStore } from "../store";

export function Caption() {
  const project = useStore(selectFocusedProject);
  const step = useStore((s) => s.step);
  const play = useStore((s) => s.play);
  if (!project) return null;
  return (
    <div className="caption">
      <button className="caption__arrow" aria-label="Previous" onClick={() => step(-1)}>‹</button>
      <div className="caption__body" key={project.slug}>
        <h2 className="display caption__title">{project.title}</h2>
        <p className="label caption__category">{project.category}</p>
        <button className="btn caption__play" onClick={() => play(project.youtubeId)}>Play</button>
      </div>
      <button className="caption__arrow" aria-label="Next" onClick={() => step(1)}>›</button>
    </div>
  );
}
```

`src/ui/Overlay.tsx`:
```tsx
import { useStore } from "../store";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Filter } from "./Filter";
import { Caption } from "./Caption";
import "./overlay.css";

export function Overlay() {
  const mode = useStore((s) => s.mode);
  const returnMode = useStore((s) => s.returnMode);
  const showNav = mode !== "intro" && !(mode === "watching" && returnMode === "intro");
  return (
    <>
      {mode === "intro" && <Intro />}
      {showNav && <Nav />}
      {mode === "browse" && (
        <>
          <Filter />
          <Caption />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 5: Replace the temporary App markup and start routing**

`src/App.tsx`:
```tsx
import { useEffect } from "react";
import { detectWebGL, isMobileViewport, prefersReducedMotion } from "./device";
import { useStore } from "./store";
import { initRouting } from "./routes";
import { Stage } from "./scene/Stage";
import { Overlay } from "./ui/Overlay";

export default function App() {
  const webgl = useStore((s) => s.webgl);

  useEffect(() => {
    const s = useStore.getState();
    s.setWebgl(detectWebGL());
    s.setIsMobile(isMobileViewport());
    s.setReducedMotion(prefersReducedMotion());
    const onResize = () => useStore.getState().setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    const stopRouting = initRouting();
    return () => {
      window.removeEventListener("resize", onResize);
      stopRouting();
    };
  }, []);

  return (
    <>
      {webgl && <Stage />}
      <Overlay />
    </>
  );
}
```

- [ ] **Step 6: Run tests and check in the browser**

Run: `npm test && npx tsc --noEmit -p tsconfig.json`
Expected: all pass, including the App test (the name is now rendered by Intro).

`npm run dev`: intro shows the play circle, name, tagline, two buttons over the blurred ring. Enter the Work: fly-in, nav and filter fade in, caption shows "Dali Showreel" with arrows. Arrows and filter chips work. Nav links change the hash (panels come in Task 9, so the ring just dims for now). Below 768 px the burger opens the sheet.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add intro, nav, filter and caption overlays

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Panels

**Files:**
- Create: `src/ui/useFocusTrap.ts`, `src/ui/Panel.tsx`, `src/ui/panels/About.tsx`, `src/ui/panels/Services.tsx`, `src/ui/panels/Journal.tsx`, `src/ui/panels/Contact.tsx`
- Modify: `src/ui/overlay.css`, `src/ui/Overlay.tsx`
- Test: `src/ui/Panel.test.tsx`, `src/ui/panels/Journal.test.tsx`, `src/ui/panels/Contact.test.tsx`

**Interfaces:**
- Consumes: store, `about`, `services`, `testimonials`, `site`, `PROCESS_PHASES`, `journalPosts`, `postBySlug`.
- Produces: `<Panel/>` (reads `panel` and `journalSlug` from the store), `useFocusTrap(ref, active, onEscape)`.

- [ ] **Step 1: Write the failing panel tests**

`src/ui/Panel.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Panel } from "./Panel";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("About shows bio, timeline, equipment, awards and testimonials", () => {
  useStore.getState().openPanel("about");
  render(<Panel />);
  const dialog = screen.getByRole("dialog", { name: /about/i });
  expect(dialog).toHaveTextContent(/based in Copenhagen/);
  expect(dialog).toHaveTextContent(/2018/);
  expect(dialog).toHaveTextContent(/ARRI Alexa Mini LF/);
  expect(dialog).toHaveTextContent(/Nordic Short Film Festival/);
  expect(dialog).toHaveTextContent(/Anna Jensen/);
  expect(screen.getByRole("img", { name: /dali sandic/i })).toBeInTheDocument();
});

test("Services shows four services and the four phases", () => {
  useStore.getState().openPanel("services");
  render(<Panel />);
  expect(screen.getByRole("heading", { name: /color grading/i })).toBeInTheDocument();
  expect(screen.getByText(/pre-production/i)).toBeInTheDocument();
});

test("Escape and the close button return to browse and restore focus", async () => {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  useStore.getState().openPanel("contact");
  render(<Panel />);
  expect(screen.getByRole("button", { name: /close/i })).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(useStore.getState().mode).toBe("browse");
  expect(trigger).toHaveFocus();
  trigger.remove();
});

test("clicking the scrim closes", async () => {
  useStore.getState().openPanel("about");
  render(<Panel />);
  await userEvent.click(screen.getByTestId("scrim"));
  expect(useStore.getState().mode).toBe("browse");
});
```

`src/ui/panels/Journal.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Journal } from "./Journal";
import { useStore, resetStore } from "../../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("lists posts with links, and renders a post with a back link", () => {
  useStore.getState().openPanel("journal");
  const { rerender } = render(<Journal />);
  expect(screen.getByRole("link", { name: /behind the scenes: the last horizon/i })).toHaveAttribute(
    "href",
    "#/journal/behind-the-scenes-the-last-horizon",
  );
  expect(screen.getByText(/5 min read/)).toBeInTheDocument();

  useStore.getState().openPanel("journal", "behind-the-scenes-the-last-horizon");
  rerender(<Journal />);
  expect(screen.getByRole("heading", { level: 2, name: /the last horizon/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 3, name: /the challenge/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /all posts/i })).toHaveAttribute("href", "#/journal");
});
```

`src/ui/panels/Contact.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { Contact } from "./Contact";

test("email, phone, availability and socials", () => {
  render(<Contact />);
  expect(screen.getByRole("link", { name: /dali@sandicfilm\.com/i })).toHaveAttribute("href", "mailto:Dali@sandicfilm.com");
  expect(screen.getByRole("link", { name: /\+45 23 66 37 48/ })).toHaveAttribute("href", "tel:+4523663748");
  expect(screen.getByText(/currently booking q3 2026/i)).toBeInTheDocument();
  const ig = screen.getByRole("link", { name: /instagram/i });
  expect(ig).toHaveAttribute("target", "_blank");
  expect(ig).toHaveAttribute("rel", expect.stringContaining("noopener"));
  expect(screen.getByText(/copenhagen, denmark/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- Panel Journal Contact`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write useFocusTrap.ts**

```ts
import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [ref, active, onEscape]);
}
```

- [ ] **Step 4: Write the panel bodies**

`src/ui/panels/About.tsx`:
```tsx
import { about, site, testimonials } from "../../content/site";

export function About() {
  return (
    <>
      <img className="panel__photo" src={`${import.meta.env.BASE_URL}images/dali-profile.jpg`} alt={site.name} width="120" height="120" loading="eager" />
      <p className="panel__lead">{about.bio}</p>
      <p>{about.longBio}</p>

      <h3 className="label panel__section">Journey</h3>
      <ol className="timeline">
        {about.timeline.map((t) => (
          <li key={t.year}><span className="timeline__year">{t.year}</span><strong>{t.title}</strong><span>{t.description}</span></li>
        ))}
      </ol>

      <h3 className="label panel__section">Equipment</h3>
      <ul className="chips">{about.equipment.map((e) => <li key={e}>{e}</li>)}</ul>

      <h3 className="label panel__section">Recognition</h3>
      <ul className="plain">
        {about.awards.map((a) => (
          <li key={a.year + a.title}><span className="timeline__year">{a.year}</span><strong>{a.title}</strong><span>{a.event}</span></li>
        ))}
      </ul>

      <h3 className="label panel__section">What they say</h3>
      {testimonials.map((t) => (
        <blockquote className="quote" key={t.id}>
          <p>“{t.quote}”</p>
          <footer><strong>{t.name}</strong> <span>{t.role}, {t.company}</span></footer>
        </blockquote>
      ))}
    </>
  );
}
```

`src/ui/panels/Services.tsx`:
```tsx
import { PROCESS_PHASES, services } from "../../content/site";

export function Services() {
  return (
    <>
      <p className="label panel__kicker">What I do</p>
      {services.map((s) => (
        <section className="service" key={s.id}>
          <h3 className="display service__title">{s.title}</h3>
          <p>{s.description}</p>
        </section>
      ))}
      <h3 className="label panel__section">Process</h3>
      <ol className="process">
        {PROCESS_PHASES.map((p, i) => (
          <li key={p.title}><span className="timeline__year">0{i + 1}</span><strong>{p.title}</strong><span>{p.description}</span></li>
        ))}
      </ol>
    </>
  );
}
```

`src/ui/panels/Journal.tsx`:
```tsx
import { journalPosts, postBySlug } from "../../content/journal";
import { useStore } from "../../store";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function Journal() {
  const slug = useStore((s) => s.journalSlug);
  const post = slug ? postBySlug(slug) : undefined;

  if (post) {
    return (
      <article className="post">
        <a className="label post__back" href="#/journal">← All posts</a>
        <h2 className="display post__title">{post.title}</h2>
        <p className="label">{formatDate(post.date)} · {post.readingTime}</p>
        <div className="post__body" dangerouslySetInnerHTML={{ __html: post.html.replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>") }} />
      </article>
    );
  }

  return (
    <ul className="plain posts">
      {journalPosts.map((p) => (
        <li key={p.slug} className="posts__item">
          <p className="label">{formatDate(p.date)} · {p.readingTime}</p>
          <a className="posts__link" href={`#/journal/${p.slug}`}>{p.title}</a>
          <p className="posts__excerpt">{p.excerpt}</p>
        </li>
      ))}
    </ul>
  );
}
```

The h2 to h3 rewrite keeps the panel's own title as the only h2. Journal markdown authors write `##` for sections.

`src/ui/panels/Contact.tsx`:
```tsx
import { site } from "../../content/site";

export function Contact() {
  const tel = site.phone.replace(/\s+/g, "");
  return (
    <>
      <p className="label panel__kicker">Let's create together</p>
      <a className="btn btn--solid contact__email" href={`mailto:${site.email}`}>{site.email}</a>
      <ul className="plain contact__list">
        <li><span className="label">Phone</span><a href={`tel:${tel}`}>{site.phone}</a></li>
        <li><span className="label">Location</span><span>{site.location}</span></li>
        <li><span className="label">Availability</span><span className="contact__availability"><i className="contact__dot" aria-hidden="true" />{site.availability}</span></li>
      </ul>
      <h3 className="label panel__section">Social</h3>
      <ul className="plain contact__social">
        <li><a href={site.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>
        <li><a href={site.social.youtube} target="_blank" rel="noopener noreferrer">YouTube</a></li>
        <li><a href={site.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      </ul>
    </>
  );
}
```

- [ ] **Step 5: Write Panel.tsx and its CSS, add it to Overlay**

`src/ui/Panel.tsx`:
```tsx
import { useCallback, useRef } from "react";
import { useStore, type PanelId } from "../store";
import { useFocusTrap } from "./useFocusTrap";
import { About } from "./panels/About";
import { Services } from "./panels/Services";
import { Journal } from "./panels/Journal";
import { Contact } from "./panels/Contact";

const TITLES: Record<PanelId, string> = { about: "About", services: "Services", journal: "Journal", contact: "Contact" };
const BODIES: Record<PanelId, () => JSX.Element> = { about: About, services: Services, journal: Journal, contact: Contact };

export function Panel() {
  const panel = useStore((s) => s.panel);
  const closePanel = useStore((s) => s.closePanel);
  const ref = useRef<HTMLElement>(null);
  const onEscape = useCallback(() => closePanel(), [closePanel]);
  useFocusTrap(ref, panel !== null, onEscape);
  if (!panel) return null;
  const Body = BODIES[panel];
  const titleId = `panel-title-${panel}`;
  return (
    <>
      <div className="scrim" data-testid="scrim" onClick={closePanel} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <button className="panel__close" aria-label="Close" onClick={closePanel}>×</button>
        <h2 className="display panel__title" id={titleId}>{TITLES[panel]}</h2>
        <div className="panel__body"><Body /></div>
      </aside>
    </>
  );
}
```

If the TypeScript version complains about the global `JSX` namespace, import it: `import type { JSX } from "react";`.

Append to `src/ui/overlay.css`:
```css
/* Panel */
.scrim { position: fixed; inset: 0; z-index: 5; background: rgba(0, 0, 0, 0.6); animation: fade-in 0.3s; }
.panel {
  position: fixed; top: 0; right: 0; bottom: 0; z-index: 6;
  width: min(520px, 100vw);
  background: rgba(10, 10, 10, 0.96);
  border-left: 1px solid var(--gold-subtle);
  padding: 88px 40px 48px;
  overflow-y: auto;
  animation: slide-in 0.4s var(--ease-out);
}
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.panel__close { position: absolute; top: 20px; right: 24px; font-size: 28px; line-height: 1; color: var(--text-muted); transition: color 0.25s; }
.panel__close:hover { color: var(--text-primary); }
.panel__title { font-size: 40px; margin-bottom: 24px; }
.panel__body { font-size: 15px; line-height: 1.7; color: var(--text-secondary); }
.panel__body p { margin: 0 0 16px; }
.panel__lead { color: var(--text-primary); font-size: 17px; }
.panel__photo { width: 120px; height: 120px; object-fit: cover; border-radius: 2px; border: 1px solid var(--gold-subtle); margin-bottom: 24px; display: block; }
.panel__section { margin: 32px 0 12px; color: var(--gold); }
.panel__kicker { margin-bottom: 20px; color: var(--gold); }
.plain { list-style: none; margin: 0; padding: 0; }
.timeline, .process { list-style: none; margin: 0; padding: 0; }
.timeline li, .process li, .plain li { display: grid; grid-template-columns: 56px 1fr; gap: 2px 16px; padding: 10px 0; border-bottom: 1px solid var(--text-subtle); }
.timeline li strong, .process li strong, .plain li strong { color: var(--text-primary); font-weight: 500; }
.timeline li span:last-child, .process li span:last-child, .plain li span:last-child { grid-column: 2; }
.timeline__year { grid-row: span 2; color: var(--gold); font-family: var(--font-display); letter-spacing: var(--tracking-wide); font-size: 18px; }
.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.chips li { font-size: 11px; letter-spacing: var(--tracking-wide); text-transform: uppercase; border: 1px solid var(--text-subtle); padding: 6px 10px; border-radius: 2px; }
.quote { margin: 0 0 20px; padding-left: 16px; border-left: 2px solid var(--gold); font-style: italic; }
.quote footer { font-style: normal; font-size: 13px; }
.quote footer strong { color: var(--text-primary); font-weight: 500; }
.service { margin-bottom: 24px; }
.service__title { font-size: 26px; margin-bottom: 6px; color: var(--text-primary); }
.posts__item { display: block; padding: 16px 0; }
.posts__link { display: block; font-family: var(--font-display); font-size: 24px; letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-primary); text-decoration: none; margin: 4px 0 8px; }
.posts__link:hover { color: var(--gold); }
.posts__excerpt { color: var(--text-secondary); }
.post__back { display: inline-block; margin-bottom: 16px; text-decoration: none; }
.post__back:hover { color: var(--gold); }
.post__title { font-size: 32px; margin-bottom: 8px; color: var(--text-primary); }
.post__body h3 { font-family: var(--font-display); letter-spacing: var(--tracking-wide); font-size: 22px; color: var(--text-primary); margin: 28px 0 8px; }
.post__body a { color: var(--gold); }
.contact__email { display: block; text-align: center; margin-bottom: 28px; font-size: 12px; }
.contact__list li { grid-template-columns: 100px 1fr; }
.contact__list a { text-decoration: none; color: var(--text-primary); }
.contact__list a:hover { color: var(--gold); }
.contact__availability { display: inline-flex; align-items: center; gap: 8px; }
.contact__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.contact__social { display: flex; gap: 20px; }
.contact__social li { display: block; padding: 0; border: 0; }
.contact__social a { text-decoration: none; color: var(--text-secondary); }
.contact__social a:hover { color: var(--gold); }
@media (max-width: 767px) { .panel { padding: 76px 24px 40px; } .panel__title { font-size: 32px; } }
```

In `src/ui/Overlay.tsx`, import `Panel` and add `{mode === "panel" && <Panel />}` after the browse block.

- [ ] **Step 6: Run tests and check in the browser**

Run: `npm test && npx tsc --noEmit -p tsconfig.json`
Expected: all pass.

`npm run dev`: click About in the nav. Panel slides in from the right, ring dims and blurs behind and keeps turning, close button has focus. Escape closes and focus returns to the About link. Journal list links open the post in place. Contact shows the mailto button. Direct load of http://localhost:5173/#/services opens Services without the intro.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add About, Services, Journal and Contact panels with focus trap

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Player

**Files:**
- Create: `src/ui/Player.tsx`
- Modify: `src/ui/overlay.css`, `src/ui/Overlay.tsx`
- Test: `src/ui/Player.test.tsx`

**Interfaces:**
- Consumes: store (`playingId`, `stopPlaying`), `projectByYoutubeId`, `useFocusTrap`.
- Produces: `<Player/>`.

- [ ] **Step 1: Write the failing player test**

`src/ui/Player.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Player } from "./Player";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
  useStore.getState().play("KduVhrnIQI4");
});

test("embeds the video with autoplay and offers a YouTube link", () => {
  render(<Player />);
  const frame = screen.getByTitle(/vlaska teaser/i);
  expect(frame).toHaveAttribute("src", "https://www.youtube.com/embed/KduVhrnIQI4?autoplay=1&rel=0&modestbranding=1&color=white");
  expect(frame).toHaveAttribute("allow", expect.stringContaining("autoplay"));
  expect(screen.getByRole("link", { name: /open on youtube/i })).toHaveAttribute("href", "https://www.youtube.com/watch?v=KduVhrnIQI4");
});

test("close button, Escape and scrim click stop playing", async () => {
  const { unmount } = render(<Player />);
  await userEvent.click(screen.getByRole("button", { name: /close video/i }));
  expect(useStore.getState().mode).toBe("browse");
  unmount();

  useStore.getState().play("KduVhrnIQI4");
  const second = render(<Player />);
  await userEvent.keyboard("{Escape}");
  expect(useStore.getState().mode).toBe("browse");
  second.unmount();

  useStore.getState().play("KduVhrnIQI4");
  render(<Player />);
  await userEvent.click(screen.getByTestId("player-scrim"));
  expect(useStore.getState().mode).toBe("browse");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- Player` → FAIL, module not found.

- [ ] **Step 3: Write Player.tsx, CSS, and add to Overlay**

`src/ui/Player.tsx`:
```tsx
import { useCallback, useRef } from "react";
import { projectByYoutubeId } from "../content/projects";
import { useStore } from "../store";
import { useFocusTrap } from "./useFocusTrap";

export function Player() {
  const id = useStore((s) => s.playingId);
  const stopPlaying = useStore((s) => s.stopPlaying);
  const ref = useRef<HTMLDivElement>(null);
  const onEscape = useCallback(() => stopPlaying(), [stopPlaying]);
  useFocusTrap(ref, id !== null, onEscape);
  if (!id) return null;
  const title = projectByYoutubeId(id)?.title ?? "Video";
  return (
    <div className="player" data-testid="player-scrim" onClick={stopPlaying} ref={ref} role="dialog" aria-modal="true" aria-label={title}>
      <button className="player__close" aria-label="Close video" onClick={stopPlaying}>×</button>
      <div className="player__frame" onClick={(e) => e.stopPropagation()}>
        <iframe
          title={title}
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&color=white`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <a className="player__link label" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        Open on YouTube
      </a>
    </div>
  );
}
```

Append to `overlay.css`:
```css
/* Player */
.player { position: fixed; inset: 0; z-index: 7; background: rgba(5, 5, 5, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; animation: fade-in 0.4s; }
.player__close { position: absolute; top: 20px; right: 24px; font-size: 32px; line-height: 1; color: var(--text-muted); transition: color 0.25s; }
.player__close:hover { color: var(--text-primary); }
.player__frame { width: min(90vw, calc(85vh * 16 / 9)); aspect-ratio: 16 / 9; border-radius: 4px; overflow: hidden; background: #000; animation: scale-in 0.3s var(--ease-out); }
.player__frame iframe { width: 100%; height: 100%; border: 0; display: block; }
.player__link { color: var(--text-muted); text-decoration: none; }
.player__link:hover { color: var(--gold); }
@keyframes scale-in { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```

In `Overlay.tsx`, import `Player` and add `{mode === "watching" && <Player />}` after the panel line.

- [ ] **Step 4: Run tests and check in the browser**

Run: `npm test` → all pass.

`npm run dev`: Watch Reel on the intro opens the player over the blurred ring and closes back to the intro. From the ring, Play on the caption or clicking the focused tile opens the piece. Escape closes. The hash reads `#/play/<slug>` while open.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add YouTube player overlay

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: 2D fallback

**Files:**
- Create: `src/ui/Grid2D.tsx`
- Modify: `src/App.tsx`, `src/ui/overlay.css`
- Test: `src/ui/Grid2D.test.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: store, `selectFilteredProjects`, `thumbnailChain`.
- Produces: `<Grid2D/>`; App renders it when `webgl` is false and skips the intro.

- [ ] **Step 1: Write the failing tests**

`src/ui/Grid2D.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Grid2D } from "./Grid2D";
import { useStore, resetStore } from "../store";

beforeEach(() => {
  resetStore();
  useStore.getState().setWebgl(false);
  useStore.getState().enter();
});

test("lists filtered projects as buttons with hqdefault thumbnails and plays on click", async () => {
  useStore.getState().setFilter("Aerial");
  render(<Grid2D />);
  const buttons = screen.getAllByRole("button", { name: /dji phantom 3/i });
  expect(buttons).toHaveLength(1);
  expect(screen.getByRole("img", { name: /dji phantom 3/i })).toHaveAttribute("src", "https://img.youtube.com/vi/ZrbmiU2OCr0/hqdefault.jpg");
  await userEvent.click(buttons[0]);
  expect(useStore.getState().playingId).toBe("ZrbmiU2OCr0");
});
```

Add to `src/App.test.tsx`:
```tsx
test("without WebGL the grid replaces the stage and the intro is skipped", () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = () => null;
  render(<App />);
  expect(screen.queryByTestId("stage")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /dali showreel/i }).length).toBeGreaterThan(0);
  expect(useStore.getState().mode).toBe("browse");
  HTMLCanvasElement.prototype.getContext = original;
});
```
Add `import { useStore } from "./store";` at the top of that test file.

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- Grid2D App` → FAIL.

- [ ] **Step 3: Write Grid2D.tsx, CSS, and the App branch**

`src/ui/Grid2D.tsx`:
```tsx
import { thumbnailChain } from "../content/projects";
import { selectFilteredProjects, useStore } from "../store";

export function Grid2D() {
  const projects = useStore(selectFilteredProjects);
  const play = useStore((s) => s.play);
  return (
    <main className="grid2d">
      <ul className="plain grid2d__list">
        {projects.map((p) => (
          <li key={p.slug}>
            <button className="grid2d__item" onClick={() => play(p.youtubeId)}>
              <img src={thumbnailChain(p.youtubeId, true)[1]} alt={p.title} loading="lazy" width="480" height="360" />
              <span className="grid2d__title">{p.title}</span>
              <span className="label">{p.category}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Append to `overlay.css`:
```css
/* 2D fallback */
.grid2d { position: fixed; inset: 0; overflow-y: auto; padding: 140px 32px 160px; z-index: 1; }
.grid2d__list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; }
.grid2d__item { display: block; width: 100%; text-align: left; }
.grid2d__item img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border: 1px solid var(--text-subtle); border-radius: 2px; transition: border-color 0.25s; display: block; }
.grid2d__item:hover img { border-color: var(--gold); }
.grid2d__title { display: block; margin: 10px 0 2px; font-family: var(--font-display); font-size: 20px; letter-spacing: var(--tracking-wide); text-transform: uppercase; }
```

`src/App.tsx` return becomes:
```tsx
  return (
    <>
      {webgl ? <Stage /> : <Grid2D />}
      <Overlay />
    </>
  );
```
and in the effect, right after `s.setWebgl(detectWebGL())`, add:
```ts
    if (!detectWebGL()) useStore.getState().startBrowsing();
```
(`detectWebGL` is cheap; calling it twice keeps the code obvious.)

Add the import `import { Grid2D } from "./ui/Grid2D";`.

- [ ] **Step 4: Run tests, then verify in the browser with WebGL disabled**

Run: `npm test` → all pass.

In Chrome, open chrome://flags, set "WebGL" to disabled (or run `chrome --disable-webgl`), load the dev URL. Expected: nav, filter chips, caption, and a thumbnail grid; no intro. Re-enable WebGL afterwards.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add 2D thumbnail grid fallback for devices without WebGL

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Keyboard, grain, hidden project list, reduced motion

**Files:**
- Create: `src/ui/useGlobalKeys.ts`, `src/ui/Grain.tsx`, `src/ui/ProjectList.tsx`
- Modify: `src/ui/Overlay.tsx`, `src/ui/overlay.css`, `src/tokens.css`
- Test: `src/ui/useGlobalKeys.test.tsx`, `src/ui/ProjectList.test.tsx`

**Interfaces:**
- Consumes: store.
- Produces: `useGlobalKeys()` (mounted once in Overlay), `<Grain/>`, `<ProjectList/>`.

- [ ] **Step 1: Write the failing tests**

`src/ui/useGlobalKeys.test.tsx`:
```tsx
import { render, fireEvent } from "@testing-library/react";
import { useGlobalKeys } from "./useGlobalKeys";
import { useStore, resetStore } from "../store";

function Host() {
  useGlobalKeys();
  return <input aria-label="field" />;
}

beforeEach(() => {
  resetStore();
  useStore.getState().enter();
});

test("arrows step, Home resets, Enter plays, only in browse", () => {
  render(<Host />);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(1);
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  fireEvent.keyDown(window, { key: "ArrowLeft" });
  expect(useStore.getState().focusedIndex).toBe(11);
  fireEvent.keyDown(window, { key: "Home" });
  expect(useStore.getState().focusedIndex).toBe(0);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(useStore.getState().mode).toBe("watching");
  fireEvent.keyDown(window, { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(0);
});

test("ignores keys typed into form fields", () => {
  const { getByLabelText } = render(<Host />);
  fireEvent.keyDown(getByLabelText("field"), { key: "ArrowRight" });
  expect(useStore.getState().focusedIndex).toBe(0);
});
```

`src/ui/ProjectList.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { ProjectList } from "./ProjectList";

test("exposes every project as a link for assistive tech and crawlers", () => {
  render(<ProjectList />);
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(12);
  expect(links[8]).toHaveAttribute("href", "#/work/vlaska-teaser");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- useGlobalKeys ProjectList` → FAIL.

- [ ] **Step 3: Write the three pieces**

`src/ui/useGlobalKeys.ts`:
```ts
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
```

`src/ui/Grain.tsx`:
```tsx
export function Grain() {
  return <div className="grain" aria-hidden="true" />;
}
```

`src/ui/ProjectList.tsx`:
```tsx
import { projects } from "../content/projects";

export function ProjectList() {
  return (
    <nav className="visually-hidden" aria-label="All work">
      <ul>
        {projects.map((p) => (
          <li key={p.slug}><a href={`#/work/${p.slug}`}>{p.title} ({p.category})</a></li>
        ))}
      </ul>
    </nav>
  );
}
```

Append to `overlay.css`:
```css
/* Film grain */
.grain {
  position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.4; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
}
```

Append to `src/tokens.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
```

`src/ui/Overlay.tsx` final form:
```tsx
import { useStore } from "../store";
import { Intro } from "./Intro";
import { Nav } from "./Nav";
import { Filter } from "./Filter";
import { Caption } from "./Caption";
import { Panel } from "./Panel";
import { Player } from "./Player";
import { Grain } from "./Grain";
import { ProjectList } from "./ProjectList";
import { useGlobalKeys } from "./useGlobalKeys";
import "./overlay.css";

export function Overlay() {
  const mode = useStore((s) => s.mode);
  const returnMode = useStore((s) => s.returnMode);
  const webgl = useStore((s) => s.webgl);
  useGlobalKeys();
  const showNav = mode !== "intro" && !(mode === "watching" && returnMode === "intro");
  return (
    <>
      {webgl && <Grain />}
      <ProjectList />
      {mode === "intro" && <Intro />}
      {showNav && <Nav />}
      {mode === "browse" && (
        <>
          <Filter />
          <Caption />
        </>
      )}
      {mode === "panel" && <Panel />}
      {mode === "watching" && <Player />}
    </>
  );
}
```

- [ ] **Step 4: Run tests and check reduced motion**

Run: `npm test && npx tsc --noEmit -p tsconfig.json` → all pass.

In Chrome DevTools, Rendering tab, emulate `prefers-reduced-motion: reduce`, reload. Expected: intro to ring is a near-instant cut, ring does not idle, arrow keys step one tile with no coasting, no bloom. Turn emulation off.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: keyboard navigation, film grain, hidden project list, reduced motion

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Render throttling and context loss

**Files:**
- Create: `src/scene/FrameloopController.tsx`
- Modify: `src/scene/Stage.tsx`

**Interfaces:**
- Consumes: `fpsForMode`, store `setWebgl`.
- Produces: `<FrameloopController/>` mounted inside the Canvas.

- [ ] **Step 1: Write FrameloopController.tsx**

```tsx
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { fpsForMode } from "../device";
import { useStore } from "../store";

/** Runs the render loop continuously in intro/browse and on a timer in panel/watching. */
export function FrameloopController() {
  const mode = useStore((s) => s.mode);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const fps = fpsForMode(mode);
    if (fps === "always") {
      setFrameloop("always");
      return;
    }
    setFrameloop("demand");
    const id = window.setInterval(() => invalidate(), 1000 / fps);
    return () => window.clearInterval(id);
  }, [mode, setFrameloop, invalidate]);

  return null;
}
```

- [ ] **Step 2: Add it and context-loss handling to Stage.tsx**

Replace `Stage.tsx` with:
```tsx
import { Canvas } from "@react-three/fiber";
import { useStore } from "../store";
import { Scene } from "./Scene";
import { FrameloopController } from "./FrameloopController";
import "./stage.css";

const RESTORE_GRACE_MS = 2000;

export function Stage() {
  const mode = useStore((s) => s.mode);
  const isMobile = useStore((s) => s.isMobile);
  const blurred = mode === "intro" || mode === "panel";

  return (
    <div className={"stage" + (blurred ? " stage--blurred" : "")} aria-hidden="true">
      <Canvas
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ fov: 60, near: 0.1, far: 30, position: [0, 1.2, 7.5] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505");
          let timer = 0;
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            timer = window.setTimeout(() => useStore.getState().setWebgl(false), RESTORE_GRACE_MS);
          });
          gl.domElement.addEventListener("webglcontextrestored", () => window.clearTimeout(timer));
        }}
      >
        <FrameloopController />
        <Scene />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm test && npx tsc --noEmit -p tsconfig.json` → all pass.

`npm run dev`, open About: in DevTools Performance, frame rate drops to about 30 while the ring still turns. Open the player: about 10 fps. Back in browse: full rate.

Context loss: in the console run
```js
document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()
```
Expected: after two seconds the canvas is replaced by the 2D grid with the same focused piece and filter.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: throttle rendering per mode and fall back on WebGL context loss

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: End-to-end tests

**Files:**
- Create: `playwright.config.ts`, `e2e/site.spec.ts`
- Modify: `.gitignore` (add `playwright-report/`, `test-results/`)

- [ ] **Step 1: Write the Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    launchOptions: { args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 2: Write the tests**

`e2e/site.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("intro, enter, step, play, panel, escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dali Sandic" })).toBeVisible();
  await page.getByRole("button", { name: "Enter the Work" }).click();
  await expect(page.getByRole("heading", { name: "Dali Showreel" })).toBeVisible();
  await expect(page).toHaveURL(/#\/work\/dali-showreel$/);

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Lifestyle Mix Commercials" })).toBeVisible();

  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("iframe[title='Lifestyle Mix Commercials']")).toBeVisible();
  await expect(page).toHaveURL(/#\/play\/lifestyle-mix-commercials$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("iframe")).toHaveCount(0);

  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByRole("dialog", { name: "About" })).toBeVisible();
  await expect(page).toHaveURL(/#\/about$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#\/work\/lifestyle-mix-commercials$/);
});

test("deep link opens a panel without the intro", async ({ page }) => {
  await page.goto("/#/services");
  await expect(page.getByRole("dialog", { name: "Services" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter the Work" })).toHaveCount(0);
});

test("without WebGL the 2D grid is shown", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Dali Showreel/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
```

- [ ] **Step 3: Run**

```bash
printf 'playwright-report/\ntest-results/\n' >> .gitignore
npm run test:e2e
```
Expected: 3 passed. If the first test fails on the iframe, check that the YouTube embed is reachable from the machine; the assertion only checks that the iframe element exists, not that it loads.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: add Playwright end-to-end coverage

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Deployment and README

**Files:**
- Create: `.github/workflows/deploy.yml`, `scripts/copy-404.mjs`, `README.md`
- Modify: `package.json` (build script)

- [ ] **Step 1: Add the 404 copy step**

`scripts/copy-404.mjs`:
```js
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html written");
```

In `package.json` set:
```json
"build": "tsc --noEmit -p tsconfig.json && vite build && node scripts/copy-404.mjs"
```

- [ ] **Step 2: Write the workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          VITE_BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Write README.md**

```md
# Dali Sandic — 3D Portfolio

Single-scene WebGL portfolio: a curved ring of YouTube pieces around the camera, slide-in panels for About, Services, Journal and Contact, hash routing, and a 2D fallback.

## Develop

    npm install
    npm run dev          # http://localhost:5173
    npm test             # unit + component tests
    npm run test:e2e     # Playwright (builds first)
    npm run build        # dist/

## Edit content

- Work: `src/content/projects.ts` — add `{ title, category, youtubeId }` and push.
- Bio, timeline, equipment, awards: `src/content/about.json`
- Services: `src/content/services.json`
- Testimonials: `src/content/testimonials.json`
- Contact, socials, availability: `src/content/site.json`
- Journal: add a Markdown file to `src/content/journal/` with the frontmatter fields `slug, title, excerpt, date (yyyy-mm-dd), readingTime, category`. Use `##` for section headings.

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml`. In the repository settings, set Pages → Source to "GitHub Actions" once. The base path is derived from the repository name.

Design spec: `docs/superpowers/specs/2026-09-12-3d-portfolio-design.md`.
```

- [ ] **Step 4: Verify the production build with a base path**

```bash
VITE_BASE_PATH=/some-repo/ npm run build
ls dist/404.html
grep -o '/some-repo/assets/[^"]*\.js' dist/index.html | head -1
```
Expected: `404.html` exists and asset URLs carry the base path. Then run `npm run build` again without the variable so `dist/` is back to the local form, and `npm run test:e2e` still passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: GitHub Pages deployment workflow and README

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

After this task, create the remote repository under the user's GitHub account with the name they choose, push `main`, and enable Pages with the "GitHub Actions" source. Do not push until the user confirms the repository name.

---

## Self-review against the spec

- Section 2 experience: Tasks 7 (ring, fly-in), 8 (intro, caption, filter, nav), 9 (panels), 10 (player), 4 (routing), 11 (fallback).
- Section 3 stack: Task 1.
- Section 4 structure and boundaries: File map; `scene/` touches only `gl.domElement` and `document.body.style.cursor`.
- Section 5 content: Task 2, thumbnails Task 7.
- Section 6 state rules: Task 3 tests cover intro/browse return, filter keeping focus, wrap. Escape/arrows/Enter: Tasks 9, 10, 12.
- Section 7 routing table: Task 4, including unknown → `#/work` and journal fallback.
- Section 8 scene numbers: Tasks 5, 6, 7 use the exact constants. Row tilt: `CameraRig` looks at the focused row's y; row switching by vertical drag and shift-wheel in `useRingDrag`.
- Section 9 overlays: Tasks 8, 9, 10, 11, 12.
- Section 10 tokens: Task 1.
- Section 11 mobile and performance: Task 7 (rows, dpr, thumbnail size, bloom off), Task 13 (throttle). Idle pause when the tab is hidden comes from the browser suspending requestAnimationFrame and, in demand mode, timers being throttled.
- Section 12 failures: Task 7 (thumbnails), Task 10 (YouTube link), Task 4 (unknown routes), Task 12 + Task 7 (reduced motion), Task 2 (journal build error), Task 13 (context loss), Task 11 (no WebGL).
- Section 13 accessibility: Tasks 9 (focus trap, dialog roles), 12 (hidden list, keyboard), 1 (focus ring).
- Section 14 tests: unit in Tasks 2 to 7 and 12, component in 8 to 12, e2e in 14.
- Section 15 deployment: Task 15.
