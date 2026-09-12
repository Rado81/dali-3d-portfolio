# Dali Sandic 3D Portfolio — Design Spec

Date: 2026-09-12
Status: approved in brainstorming, awaiting written-spec review

## 1. Purpose

A showpiece website for Dali Sandic, cinematographer and visual storyteller in Copenhagen. Its job is to position Dali as a creative through a memorable 3D experience. Winning clients is secondary and is served by a prominent showreel and a Contact panel.

The site replaces nothing yet. It is a new project in a new repository, deployed to its own GitHub Pages URL. The existing site at `rado81.github.io/dali-portfolio` and its repository are not modified.

## 2. Experience summary

- The whole site is one WebGL scene: a curved ring of 12 video tiles wrapping the camera, on a near-black stage with a gold accent.
- Visitors arrive on a title card (name, tagline, Watch Reel, Enter) over a dim, slowly turning ring. Enter flies the camera into the ring.
- In the ring, drag or wheel spins it. One tile is always in focus, scaled up with a gold edge. Its title, category, and a Play button sit beneath it. Clicking plays the piece in a full-screen YouTube player overlay.
- About, Services, Journal, and Contact are slide-in panels over the ring. The ring dims behind them and keeps idling.
- The URL hash mirrors the state so every panel and piece is deep-linkable and browser back works.
- Phones get the same ring with fewer tiles and cheaper rendering. Devices without WebGL get a plain 2D grid using the same overlays.

## 3. Stack

| Concern | Choice |
|---|---|
| Build | Vite 8, React 19, TypeScript 5.9 |
| 3D | three, @react-three/fiber, @react-three/drei, @react-three/postprocessing |
| Animation | @react-spring/three for camera and tile springs; CSS transitions for HTML overlays |
| State | zustand (one store) |
| Markdown | a small in-repo frontmatter parser (gray-matter needs Node Buffer in the browser), marked for the body, imported with Vite `import.meta.glob` as raw strings |
| Tests | vitest, @testing-library/react, @playwright/test |
| Lint/format | eslint, prettier |
| Hosting | GitHub Pages via GitHub Actions, static files only |

No CSS framework. Design tokens are CSS custom properties in one stylesheet.

## 4. Project structure

```
index.html
vite.config.ts             base path from VITE_BASE_PATH env, defaults to "/"
src/
  main.tsx                 mounts <App/>
  App.tsx                  <Canvas> (or <Grid2D/>) + <Overlay/>
  store.ts                 zustand store (section 6)
  routes.ts                hash <-> store sync (section 7)
  tokens.css               design tokens (section 10)
  content/
    site.json              name, title, subtitle, email, phone, location,
                           availability, social, stats (stats unused)
    about.json             bio, longBio, timeline, equipment, awards
    services.json          4 services + icon names
    testimonials.json      3 testimonials
    projects.ts            12 videos: slug, title, category, youtubeId
    journal/*.md           one file per post, frontmatter: slug, title, excerpt,
                           date, readingTime, category
    index.ts               typed exports, journal loader, slug helpers
  scene/
    Scene.tsx              lights, fog, <Ring/>, <CameraRig/>, <Effects/>
    Ring.tsx               lays <Tile/>s on the cylinder, applies rotation
    Tile.tsx               plane + thumbnail texture + hover/focus visuals
    CameraRig.tsx          springs the camera between intro and browse poses
    Effects.tsx            bloom pass; blur in intro/panel modes is a CSS filter on the canvas
    useRingDrag.ts         pointer + wheel + keyboard -> rotation, inertia, snap
    layout.ts              pure math: angles for N tiles, row offsets, nearest tile
  ui/
    Overlay.tsx            chooses which HTML sits over the canvas per mode
    Intro.tsx              title card
    Nav.tsx                wordmark + Work/About/Services/Journal/Contact
    Caption.tsx            focused tile's title, category, Play
    Filter.tsx             All / Showreel / Commercial / Narrative / Aerial
    Panel.tsx              slide-in shell with close button and scrim
    panels/About.tsx       bio, timeline, equipment, awards, testimonials
    panels/Services.tsx    4 services + 4-phase process
    panels/Journal.tsx     post list and post view
    panels/Contact.tsx     email, phone, location, availability, socials
    Player.tsx             full-screen YouTube iframe overlay
    Grid2D.tsx             no-WebGL fallback for the ring
    Grain.tsx              film-grain overlay
public/
  images/dali-profile.jpg
  favicon.svg
docs/superpowers/specs/    this file
.github/workflows/deploy.yml
```

Boundaries:

- Files under `scene/` never touch the DOM and never import from `ui/`.
- Files under `ui/` never import three or fiber.
- Both read and write only the store. The store is the single interface between them.
- `layout.ts` and `useRingDrag.ts` math is pure and unit-tested without a renderer.

## 5. Content model

Content is copied from the existing repository so both sites can share it. Shapes are kept verbatim so a file can be copied between repos without editing.

```ts
type Category = "Showreel" | "Commercial" | "Narrative" | "Aerial";

interface Project {
  slug: string;        // derived at build: kebab-case of title, unique
  title: string;
  category: Category;
  youtubeId: string;
}

interface JournalPost {
  slug: string; title: string; excerpt: string; date: string; // ISO yyyy-mm-dd
  readingTime: string; category: "bts" | "gear" | "industry" | "tutorial";
  html: string;        // rendered body
}
```

The 12 projects, in ring order:

| # | Title | Category | YouTube id |
|---|---|---|---|
| 1 | Dali Showreel | Showreel | 5RXfPmbynlk |
| 2 | Lifestyle Mix Commercials | Commercial | EoXWVt3NjNI |
| 3 | Carlsberg Vuvuzela | Commercial | CLyKZZy71r4 |
| 4 | Ørsted Geo | Commercial | LFkhBvrvgCU |
| 5 | Dyrenes Beskyttelse | Commercial | AkDsDuWbSdw |
| 6 | Dyrenes Beskyttelse Original | Commercial | ERrPsSIHpJw |
| 7 | Movenorth — Lars | Narrative | FqKLK7deiz0 |
| 8 | Movenorth — Lene Original | Narrative | GE47eALvz_U |
| 9 | Vlaska Teaser | Narrative | KduVhrnIQI4 |
| 10 | Living With Humans | Narrative | OuPfCU0NKLo |
| 11 | The Drama of the Drama | Narrative | UBm5xIfvasM |
| 12 | DJI Phantom 3 | Aerial | ZrbmiU2OCr0 |

Thumbnails are fetched at runtime from `https://img.youtube.com/vi/<id>/maxresdefault.jpg`, falling back to `hqdefault.jpg` on error, then to a dark placeholder plane showing the title. No thumbnail images are stored in the repo.

Adding a piece: append one entry to `projects.ts`, push. Adding a post: add one `.md` file under `content/journal/`, push.

Fields present in the JSON but not displayed: `stats`, testimonial `avatar`, journal `featuredImage`. They stay in the files for compatibility.

## 6. State

One zustand store:

```ts
type Mode = "intro" | "browse" | "watching" | "panel";
type PanelId = "about" | "services" | "journal" | "contact";

interface State {
  mode: Mode;
  focusedIndex: number;          // index into filtered projects
  filter: Category | "all";
  panel: PanelId | null;
  journalSlug: string | null;    // post open inside the Journal panel
  playingId: string | null;      // youtubeId in the Player
  webgl: boolean;                // false -> Grid2D
  reducedMotion: boolean;

  enter(): void;                 // intro -> browse
  focus(i: number): void;
  step(delta: 1 | -1): void;
  setFilter(f): void;            // resets focusedIndex to 0
  play(youtubeId): void;         // -> watching
  stopPlaying(): void;           // -> browse
  openPanel(p, journalSlug?): void;
  closePanel(): void;            // -> browse
}
```

Rules:

- `intro` is the initial mode only when the page loads on the root hash. Any deep link starts in `browse` and then applies the link.
- `filter` change rebuilds the ring with the subset. `focusedIndex` resets to 0. If the current focused project exists in the new subset, its new index is used instead.
- `watching` and `panel` are both reachable from `browse` and return to `browse`. `watching` is also reachable from `intro` via Watch Reel and returns to `intro` in that case (the store remembers the previous mode).
- Escape closes the Player or the Panel. Left and Right arrows step the ring in `browse`. Enter plays the focused tile in `browse`.

## 7. Routing

Hash routes, mirrored both ways with the store:

| Hash | State |
|---|---|
| `#/` or empty | intro (fresh load) or browse (after Enter) |
| `#/work` | browse |
| `#/work/<slug>` | browse, ring rotated so that slug is focused |
| `#/play/<slug>` | watching that slug |
| `#/about`, `#/services`, `#/contact` | that panel open |
| `#/journal` | journal panel, list |
| `#/journal/<slug>` | journal panel, that post |

Unknown slug or panel falls back to `#/work`. Filter is not in the URL.

## 8. Scene

Coordinate frame: camera at the origin in browse mode, looking along -Z. Ring radius 6 units. Tiles are 16:9 planes, 1.6 by 0.9 units, pinned to the inside of a cylinder of that radius, each rotated to face the origin.

Layout (`layout.ts`, pure):

- Two rows: upper row at y = +0.55, lower row at y = -0.55, on desktop. One row at y = 0 below 768 px wide.
- N tiles are distributed evenly around the full circle in one row on mobile, or alternately between rows on desktop, so 12 tiles become 6 per row with the lower row offset by half a step. Angular step = 2π / ceil(N / rows).
- `nearestIndex(rotation)` returns the tile whose angle is closest to the camera's forward direction.
- With N <= 4 on desktop, use one row so tiles are not spread across a nearly empty circle.

Visuals per tile:

- Base: thumbnail texture, `MeshBasicMaterial`, slight emissive lift so the far side is not black, colour tint 0.75 when not focused.
- Focused: scale 1.25, tint 1.0, gold edge (a thin plane behind the tile, 2% larger, gold colour), bloom picks it up.
- Hovered (desktop): scale 1.08, tint 0.9, cursor pointer.
- Transitions via react-spring, 300 ms, tension 170, friction 26.

Stage:

- Background `#050505`. Fog `#050505` from radius 4 to 9 so the far side of the ring fades.
- Ambient light 0.6 plus one point light at the origin, warm gold `#D4AF37` at 0.4, so focused tiles read warmer.
- Post-processing: bloom (threshold 0.85, intensity 0.6). In `intro` and `panel` modes, a CSS `filter: blur(6px)` on the canvas element and tile tint dropped to 0.45.
- Film grain is an HTML overlay (SVG turbulence, opacity 0.4, overlay blend), not a shader pass.

Camera:

- Intro pose: position (0, 1.2, 7.5), looking at (0, 0, 0). The ring fills the lower two thirds of the frame behind the title card.
- Browse pose: position (0, 0, 0), looking along the current focus direction.
- `enter()` springs the camera between poses over 1.2 s (tension 120, friction 30). Nav and caption fade in during the last 400 ms.
- Idle rotation: 0.05 rad/s in intro and panel modes, 0 in browse.

Interaction (`useRingDrag.ts`):

- Pointer down captures. Horizontal delta in pixels times gain adds to rotation. Gain is 0.006 rad/px on desktop and 0.012 on touch, so one full swipe moves about one tile on a phone.
- On release, velocity carries with exponential decay (factor 0.92 per frame at 60 fps, frame-rate normalised).
- Wheel: deltaX and deltaY both add velocity with gain 0.0015 rad per unit, so trackpads and mice both spin the ring.
- When |velocity| < 0.002 rad/frame, ease to the nearest tile angle over 350 ms and set `focusedIndex`.
- Keyboard: Left and Right call `step`. Home focuses tile 0.
- A drag shorter than 6 px and 200 ms is a click. Click on the focused tile plays it. Click on another tile springs the ring to it.
- Vertical drag or shift-wheel tilts the camera between rows on desktop, clamped to the two row angles, with the same snap behaviour.

## 9. UI overlays

All overlays are HTML positioned over the canvas, using the tokens in section 10.

- **Intro**: name in Bebas Neue at 96 px desktop and 48 px mobile, letter-spacing 0.25em. Tagline in Inter 11 px, 0.2em, muted. Two buttons: Watch Reel (gold outline) and Enter the Work (gold fill). A play circle above the name, matching the current site.
- **Nav**: fixed top bar. Wordmark SANDIC in gold Bebas Neue left. Work, About, Services, Journal, Contact right, 11 px Inter uppercase. Active item gold. Below 768 px a hamburger opens a full-screen list. Work closes any panel and returns to browse.
- **Filter**: five chips centred under the nav in browse mode. Active chip gold text with a gold underline.
- **Caption**: centred at the bottom in browse mode. Title in Bebas Neue 28 px, category and a Play button beneath. Crossfades 200 ms when `focusedIndex` changes. Left and Right arrow buttons flank it on desktop for non-drag users.
- **Panel**: fixed right side, 100% width on mobile and 520 px on desktop, background `#0A0A0A` at 96% with a 1 px gold-subtle left border, slides in over 400 ms. Scrim over the canvas at 60% black; clicking it closes. Close button top-right. Content scrolls inside the panel.
  - About: profile photo, `bio`, `longBio`, timeline as a vertical list with gold year labels, equipment as chips, awards as a list, testimonials as three quotes with name, role, company.
  - Services: four services as title plus description, then the four-phase process (Discovery, Pre-production, Production, Delivery) as a numbered list.
  - Journal: list of posts sorted by date descending showing title, date, reading time, excerpt. Clicking opens the post in the same panel with a back link. Body rendered from markdown, headings in Bebas Neue, links gold.
  - Contact: large mailto button with the email, then phone as a tel link, location, availability with the pulsing gold dot, and the three social links opening in new tabs.
- **Player**: fixed full-screen, black at 95%, YouTube iframe with `autoplay=1&rel=0&modestbranding=1&color=white`, 16:9 box capped at 90vw by 85vh, close button, Escape and scrim click close. Ring behind stops idling and rendering is throttled to 10 fps while open.
- **Grid2D**: shown instead of the canvas when `webgl` is false. Responsive grid of thumbnails with title and category, respecting the filter, clicking plays. Same Nav, Filter, Panel, Player. The Intro is skipped.
- **Grain**: full-screen overlay, pointer-events none, above the canvas and below the overlays.

## 10. Design tokens

Lifted from the current site's stylesheet.

```css
:root {
  --bg-deep: #050505;   --bg-base: #0A0A0A;  --bg-surface: #111111;  --bg-elevated: #1A1A1A;
  --gold: #D4AF37;      --gold-dark: #B8962E;
  --gold-glow: rgba(212,175,55,.15);   --gold-subtle: rgba(212,175,55,.08);
  --text-primary: #F5F5F5;  --text-secondary: #AAAAAA;  --text-muted: #666666;  --text-subtle: #333333;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Bebas Neue", "Inter", sans-serif;
  --tracking-display: .25em;  --tracking-wide: .15em;  --tracking-label: .2em;
}
```

Fonts load from Google Fonts with `display=swap` and system fallbacks. Selection colour is gold at 30%.

## 11. Mobile and performance

- Below 768 px: one row, thumbnails use the 640 px `sddefault` size, bloom off, device pixel ratio capped at 1.5, touch drag gain doubled.
- Desktop: two rows, thumbnails use the 1280 px `maxresdefault` size, device pixel ratio capped at 2.
- Render loop is continuous in intro and browse, throttled to 30 fps in panel mode (idle rotation still runs), throttled to 10 fps in watching mode, paused when the tab is hidden.
- All thumbnails load at start through one shared loader (12 images); a tile shows the placeholder colour until its texture is ready. YouTube returns a 120x90 stand-in image with HTTP 200 for missing sizes, so the loader checks image width and falls back to `hqdefault` when it sees one.
- Target: 60 fps on a 2020 laptop with integrated graphics, 30 fps or better on a mid-range 2022 phone, initial JS under 400 KB gzipped, first ring visible under 2 s on a 4G connection.

## 12. Failure handling

| Case | Behaviour |
|---|---|
| WebGL unavailable at load | `webgl=false`, render Grid2D |
| WebGL context lost | Attempt one restore; if it fails within 2 s, switch to Grid2D and keep state |
| `maxresdefault` 404 or error | Retry with `hqdefault`, then placeholder with title |
| YouTube iframe fails or blocked | An "Open on YouTube" link is always shown under the player, so the piece stays reachable |
| Unknown hash slug or panel | Redirect to `#/work` |
| `prefers-reduced-motion` | Camera fly-in becomes a 300 ms fade, idle rotation off, inertia off, drag steps one tile per gesture, bloom off |
| Journal file with bad frontmatter | Build fails with the filename in the error |

## 13. Accessibility

- Every overlay control is a real button or link with a visible focus ring in gold.
- The ring has a visually hidden list of the projects as links so screen readers and search engines get the content. The Left and Right caption buttons make keyboard stepping discoverable.
- Panels trap focus while open and return it to the triggering nav item on close.
- All text meets 4.5:1 contrast against the dark backgrounds. Muted text `#666666` is used only for labels 11 px and larger at uppercase tracking.

## 14. Testing

- **Unit (vitest)**: `layout.ts` angles and nearest-index for N in {1, 3, 4, 5, 12} and both row modes; drag velocity decay, snap target, wraparound at 2π; hash to state and state to hash for every route in section 7; journal frontmatter parsing and date sort; slug derivation and uniqueness for the 12 projects.
- **Component (vitest + Testing Library)**: Intro, Nav, Filter, Caption, Panel bodies, Player, Grid2D against a mocked store. Asserts on labels, active states, Escape handling, focus trap, and mailto and tel hrefs.
- **End to end (Playwright)**: against the production build in headless Chromium with WebGL enabled. Load root, see Intro, click Enter, see caption "Dali Showreel", press Right, caption changes, click Play, iframe appears, Escape, open About via nav, panel visible, Escape, hash returns to `#/work`. A second test loads `#/about` directly and asserts the panel is open with no intro. A third forces WebGL off and asserts Grid2D.
- No visual regression tooling. The ring is reviewed by eye via screenshots during implementation.

## 15. Deployment

- GitHub Actions on push to `main` and manual dispatch: checkout, Node 20, `npm ci`, `npm test`, `npm run build` with `VITE_BASE_PATH=/<repo-name>/`, upload `dist`, deploy with `actions/deploy-pages`. Same shape as the current site's workflow.
- The repository name is chosen when the remote is created. Until then `VITE_BASE_PATH` defaults to `/` for local development.
- A `404.html` copy of `index.html` is emitted so GitHub Pages serves the app for any path, though all routes are hash-based anyway.

## 16. Out of scope

- Live video previews on tiles. Would need short self-hosted loops per piece. The Tile component takes a texture, so a video texture can be swapped in later.
- A working contact form. Needs a third-party endpoint.
- A CMS. Content is edited in the repo.
- Changes to the existing dali-portfolio repository or site.
