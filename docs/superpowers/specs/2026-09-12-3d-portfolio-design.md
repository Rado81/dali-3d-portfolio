# Dali Sandic 3D Portfolio — Design Spec

Date: 2026-09-12
Status: approved in brainstorming, awaiting written-spec review

## 1. Purpose

A showpiece website for Dali Sandic, cinematographer and visual storyteller in Copenhagen. Its job is to position Dali as a creative through a memorable 3D experience. Winning clients is secondary and is served by a prominent showreel and a Contact panel.

The site replaces nothing yet. It is a new project in a new repository, deployed to its own GitHub Pages URL. The existing site at `rado81.github.io/dali-portfolio` and its repository are not modified.

## 2. Experience summary

- The whole site is one WebGL scene: a curved ring of 12 video tiles wrapping the camera, on a near-black stage in a slow dark haze that the screens light, with a gold accent.
- Visitors arrive on a title card (a play circle, name, tagline, Enter) over a dim, slowly turning ring standing on a glossy studio floor. The play circle opens the showreel; Enter flies the camera into the ring.
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
    Caption.tsx            focused tile's title and category
    Pager.tsx              prev/next arrows, a dot per piece, focus-revealed Play
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

Thumbnails are fetched at runtime from `https://img.youtube.com/vi/<id>/maxresdefault.jpg` (desktop) or `sddefault.jpg` (mobile), falling back to `hqdefault.jpg` on error, then to a dark placeholder plane showing the title. `sddefault` and `hqdefault` are 4:3 letterboxed, so any texture whose measured aspect is under 1.7 is cropped to 16:9 via `repeat`/`offset`. No thumbnail images are stored in the repo.

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
  showIntro(): void;             // anywhere -> intro (browse when webgl is false)
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
- `watching` and `panel` are both reachable from `browse` and return to `browse`. `watching` is also reachable from `intro` via the play circle and returns to `intro` in that case (the store remembers the previous mode).
- Escape closes the Player or the Panel. Left and Right arrows step the ring in `browse`. Enter plays the focused tile in `browse`.

## 7. Routing

Hash routes, mirrored both ways with the store:

| Hash | State |
|---|---|
| `#/` or empty | intro: the fresh load and the destination of the wordmark, which backs out of any panel or player. Without WebGL it browses instead, since the 2D grid has no title card. |
| `#/work` | browse |
| `#/work/<slug>` | browse, ring rotated so that slug is focused |
| `#/play/<slug>` | watching that slug |
| `#/about`, `#/services`, `#/contact` | that panel open |
| `#/journal` | journal panel, list |
| `#/journal/<slug>` | journal panel, that post |

Unknown slug or panel falls back to `#/work`. Filter is not in the URL.

Each view also sets the browser tab title (`titleFor` in `routes.ts`): the title card uses "Dali Sandic — Cinematographer & Visual Storyteller", and every other view names what it shows, such as "Vlaska Teaser — Dali Sandic", "About — Dali Sandic" or a journal post's title, so tabs, history and bookmarks are distinguishable.

Shared links get a preview: `index.html` carries Open Graph and Twitter card tags with the site title, the page description and the showreel's 1280x720 frame as the image.

## 8. Scene

Coordinate frame: camera at the origin in browse mode, looking along -Z. Ring radius 6 units. Tiles are 16:9 planes, 2.2 by 1.2375 units, pinned to the inside of a cylinder of that radius, each rotated to face the origin.

Layout (`layout.ts`, pure):

- One row at y = 0 on every viewport. Tiles sit 30° apart (2π / max(N, 12)), so the 12-tile ring closes and a filtered subset forms an arc with the same spacing: the focused tile in the middle with its two neighbours turned inward at the edges of the view. A fling past the end of an arc springs back to the last tile.
- `layoutRing` still supports a two-row layout (alternating rows, lower row offset by half a step) but nothing calls it with two rows: alternating rows made every step swap rows and tilt the camera, which read as a zigzag rather than a carousel.
- `nearestIndex(rotation)` returns the tile whose angle is closest to the camera's forward direction.

Visuals per tile:

- Base: thumbnail texture on `MeshBasicMaterial`, colour tint 0.75 when not focused.
- Focused: scale 1.25, tint 1.0, gold edge (a thin plane behind the tile, 2% larger, gold colour), bloom picks it up.
- Shadow: a black plane at 40% behind each tile, 4% larger and offset downward. It follows the tile's scale spring, so a tile growing in never shows a larger fixed dark box around it. It was 55% on plain black; the spill behind it now does most of the separating.
- Hovered (desktop): scale 1.08, tint 0.9, cursor pointer.
- Transitions via react-spring, tension 120, friction 24, so the focus scale and gold edge arrive with the ring's settle.

Stage:

- Background `#050505`. Fog `#050505` from 7 to 14 units: in browse every tile sits 6 units from the camera and is unfogged; from the intro camera the far wall of the ring (10 to 13.5 units away) fades with distance.
- Haze (`Haze.tsx`, parameters in `hazeParams.ts`): the screening room's air. A fullscreen quad drawn first, without depth, fog or tone mapping, running a three-octave value-noise field (two on phones) from the stage colour up to a warm peak of `#181614`, weighted by a vertical profile that is full at the ring's horizon and 0.4 at the top and bottom edges. The profile is baked in TypeScript into a one-row lookup the shader samples, so it is tested rather than duplicated in GLSL. The noise drifts sideways at 0.03 units per second across 1.6 cycles of screen width, so a shape takes about 53 s to cross, and changes along a third noise axis at 0.02 per second. A frame longer than 100 ms (the tab was hidden) moves it on by 100 ms. Half a level of dither breaks the banding of the slow gradient, scaled for the composer's linear buffer on desktop and the 8-bit screen on phones.
- Spill (`Spill.tsx`, parameters in `spillParams.ts`): the light each screen throws into the haze. A plane behind every tile, 2.4 tile widths by 3.2 tile heights, carrying a radial `(1 - d²)²` falloff as alpha, additive, in one warm tone `#d9c9a3` for every tile, and out of tone mapping like the gold edge. Its opacity is 0.12 × tint², so the focused tile lights the most and a dimmed room goes quiet, and it follows the tile's scale spring.
- Floor (`Floor.tsx` and `Reflection.tsx`, parameters in `floorParams.ts`): a studio floor on the title card only; `floorVisible` is true in `intro` and false in browse, panel and watching, so the ring, the panels and the player keep the plain haze. A 60-unit plane at y = -1.05, below the lowest edge of a focused tile and its shadow, in `#080808`, alpha-blended over the haze. Its opacity follows Schlick reflectance with F0 0.04, so it barely reflects near the camera and mostly reflects toward the horizon, with faint smudges to break up the sheen, and it thins out with the fog so the far floor dissolves into the haze instead of ending in a band. Each tile carries its reflection: the tile mirrored about the floor inside its own group, additive, dimmed by e^-1.55 and blurred by 2.6 mip levels per unit below the floor, following the tile's scale and tint springs. The floor and the reflections fade on a spring faster than the camera (tension 170, friction 26), so they are gone before the camera is inside the ring, and draw nothing while gone. The haze and the floor take their dither from `dither.ts`.
- Projector beam (`ProjectorBeam.tsx`, shaders in `beamShaders.ts`, parameters in `beamParams.ts`): on the ring only; `beamVisible` is true in `browse` and false on the title card, in panels and in the player. A projector behind and above the browse camera at (-0.9, 4.6, 10.5) is aimed at the focused tile, which is always the one in front, with a cone of half-angle tangent 0.11: full light out to 0.7 of its radius, gone at 1.05, a little brighter at the core. The camera sits outside the cone, so the light reads as a shaft entering the top of the frame. Along the beam the light is full where it passes over the camera and thins with the fourth power of the distance beyond, so the shaft carries the top of the frame while the air behind the caption stays dim. Each frame, before the composer renders, the cone is ray-marched at a quarter of the canvas's CSS size (16 steps, 12 on phones) up to the ring's cylinder, weighted by a drifting 32-cube dust volume and by fine rays fanning out from the lens, stored gamma-encoded in eight bits, then added over the scene in #fff0d2 at intensity 0.015 with a 2.5% film-frame flicker. 320 dust motes drift as points between the camera and the ring, faint in the dark and glinting inside the beam. It fades on the camera's spring and draws nothing while gone. `e2e/beam.spec.ts` checks that the beam brightens the top of the frame and that the chips, the caption title and the gold category keep 4.5:1 against the scene behind each of them.
- Tiles use an unlit `MeshBasicMaterial` (map times a tint colour), so the tint values below are exact and no scene lights are needed. The gold edge plane is gold scaled by 1.5 (an HDR value) so bloom picks it up.
- Post-processing: bloom (threshold 0.85, intensity 0.6). In `intro` and `panel` modes, a CSS `filter: blur(6px)` on the canvas element and tile tint dropped to 0.45. The composer turns the renderer's tone mapping off while it runs, so on desktop nothing is tone mapped; on phones and under reduced motion there is no composer and react-three-fiber's default filmic curve applies to the tiles, which crushes dark values, so the haze and the spill opt out of it (`hasPostprocessing` in `device.ts` is the single decision).
- Film grain is an HTML overlay (SVG turbulence, opacity 0.4, overlay blend), not a shader pass.

Camera:

- Intro pose: position (0, 1.2, 7.5), looking at (0, 0, 0). Tiles are single-sided and face the ring centre, so from outside the near half is culled and the far wall of the ring is visible as a band behind the title card, fading with distance.
- Browse pose: position (0, 0, 0), looking at (0, 0, -6); the ring turns, the camera does not.
- `enter()` springs the camera between poses over 1.2 s (tension 120, friction 30). Nav and caption fade in during the last 400 ms.
- Idle rotation: 0.05 rad/s in intro and panel modes, 0 in browse.

Interaction (`useRingDrag.ts`):

- Pointer down captures. The drag tracks 1:1: the gain is derived from the canvas width and the camera's horizontal field of view so the tile in front of the camera stays under the pointer. Velocity is estimated from the last pointer moves in rad/s; a pointer that rests for 80 ms before lifting has none.
- On release, the landing tile is chosen from the projected momentum (`v · 0.998 / (1 − 0.998)` in seconds, the scroll-view deceleration curve, clamped to 1.6 rad, about three tiles) rather than the nearest tile to the release point, so a flick throws the ring and never snaps back against its direction.
- The ring then springs to that tile: critically damped, response 0.6 s, inheriting the release velocity so there is no seam between dragging and settling. A step requested mid-flight retargets the same spring and keeps the velocity. `focusedIndex` is written when the spring settles.
- Wheel: a mouse notch (a single event of 80 px or more) is one `step`; the spring retargets and keeps its velocity, so fast wheeling flows across several tiles. Smaller trackpad deltas scroll the ring 1:1 like a drag, and 100 ms after the last event it glides to the projected tile. The dominant axis wins, so horizontal trackpad swipes and vertical mouse wheels both work.
- Keyboard: Left and Right call `step`. Home focuses tile 0.
- A drag shorter than 6 px and 200 ms is a click. Click on the focused tile plays it. Click on another tile springs the ring to it.
- Reduced motion: the ring cuts straight to the focused tile; drags and wheels become single steps.

## 9. UI overlays

All overlays are HTML positioned over the canvas, using the tokens in section 10.

- **Intro**: name in Bebas Neue at 96 px desktop and 48 px mobile, letter-spacing 0.25em. Tagline in Inter 11 px, 0.2em, muted. A gold play circle above the name opens the showreel, and one button below the tagline, Enter the Work (gold fill). The circle is the only control for the reel: a separate Watch Reel button beside Enter duplicated it and made the title card read as two competing choices.
- **Nav**: fixed top bar. Wordmark SANDIC in gold Bebas Neue left, linking to `#/` so it returns to the title card from any panel, player or ring position. Work, About, Services, Journal, Contact right, 11 px Inter uppercase. Active item gold. Below 768 px a hamburger opens a full-screen list. Work closes any panel and returns to browse.
- **Filter**: five chips centred under the nav in browse mode. Active chip gold text with a gold underline.
- **Caption**: in browse mode, the filter chips and the caption share one fixed column that runs from the bottom of the nav to the top edge of the focused tile, 38.8% down the stage (derived from the tile size, ring radius, camera fov and focus scale, and guarded by a test in `layout.test.ts`). The chips take the height they need, one row or wrapped, and the caption centres itself in what remains, so it never collides with either. The column is sized in `dvh` so it matches the stage when a mobile browser shows its toolbar. Title in Bebas Neue 28 px with the category beneath, as plain text with no controls. Crossfades 200 ms when `focusedIndex` changes.
- **Pager**: centred below the ring. Left and Right arrow buttons for non-drag users, with one 6 px dot per piece between them: `--control-idle` grey, the current one gold and scaled 1.6. Each dot is a button that jumps straight to its piece, with a 24 px target around the 6 px mark (40 px tall on touch screens). On a narrow phone the dots shrink toward 12 px wide to keep the row on screen, and the 44 px arrows stay full size as the equivalent way to move between pieces. A screen-reader-only phrase ("Piece 4 of 12") states the position, and the current dot carries `aria-current`. A Play button sits in the cluster but is clipped out of view until it takes keyboard focus: the tiles live in the canvas and cannot be focused, so this is the only Tab-reachable way to play a piece.
- **Panel**: fixed right side, 100% width on mobile and 520 px on desktop, background `#0A0A0A` at 96% with a 1 px gold-subtle left border, slides in over 400 ms. Scrim over the canvas at 60% black; clicking it closes. Close button top-right. Content scrolls inside the panel.
  - About: profile photo, `bio`, `longBio`, timeline as a vertical list with gold year labels, equipment as chips, awards as a list, testimonials as three quotes with name, role, company.
  - Services: four services as title plus description, then the four-phase process (Discovery, Pre-production, Production, Delivery) as a numbered list.
  - Journal: list of posts sorted by date descending showing title, date, reading time, excerpt. Clicking opens the post in the same panel with a back link. Body rendered from markdown, headings in Bebas Neue, links gold.
  - Contact: large mailto button with the email, then phone as a tel link, location, availability with the pulsing gold dot, and the three social links opening in new tabs.
- **Player**: fixed full-screen, black at 95%, YouTube iframe from the privacy-enhanced `youtube-nocookie.com` domain, which sets no tracking cookies until the viewer plays, with `autoplay=1&rel=0&modestbranding=1&color=white`, 16:9 box capped at 90vw by 85vh, close button, Escape and scrim click close. Ring behind stops idling and rendering is throttled to 10 fps while open.
- **Grid2D**: shown instead of the canvas when `webgl` is false. Responsive grid of thumbnails with title and category, respecting the filter, clicking plays. Same Nav, Filter, Panel, Player. The Intro is skipped.
- **Grain**: full-screen overlay, pointer-events none, above the canvas and below the overlays.

## 10. Design tokens

Lifted from the current site's stylesheet.

```css
:root {
  --bg-deep: #050505;   --bg-base: #0A0A0A;  --bg-surface: #111111;  --bg-elevated: #1A1A1A;
  --gold: #D4AF37;      --gold-dark: #B8962E;
  --gold-glow: rgba(212,175,55,.15);   --gold-subtle: rgba(212,175,55,.08);
  --text-primary: #F5F5F5;  --text-secondary: #AAAAAA;  --text-muted: #808080;
  --text-subtle: #333333;   /* decorative dividers only */
  --control-idle: #6A6A6A;  /* outlines and marks of resting controls */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Bebas Neue", "Inter", sans-serif;
  --tracking-display: .25em;  --tracking-wide: .15em;  --tracking-label: .2em;
}
```

Fonts load from Google Fonts with `display=swap` and system fallbacks. Selection colour is gold at 30%.

`--text-muted` was `#666666` on the original site, which is only 3.5:1 on the stage; it was first raised to `#7A7A7A` (4.7:1). `--text-subtle` stays for decorative dividers, and resting controls use `--control-idle` so their outlines and dots stay visible. With the haze, the stage is no longer a flat `#050505`: `--text-muted` is `#808080` and `--control-idle` `#6A6A6A` so both keep their ratios over the haze at its brightest (`HAZE_PEAK`, `#181614`). `src/tokens.test.ts` computes the WCAG ratios from the stylesheet against both surfaces and the haze peak, and fails if a token drops below its threshold.

## 11. Mobile and performance

- Below 768 px: thumbnails use the 640 px `sddefault` size, bloom off, device pixel ratio capped at 1.5.
- Below 460 px tall, mostly phones held sideways: the nav slims to 56 px and the caption to a 20 px title so it still fits between the chips and the videos. An end-to-end test checks the caption placement on a desktop, a portrait phone and two landscape phones.
- Desktop: thumbnails use the 1280 px `maxresdefault` size, device pixel ratio capped at 2.
- Render loop is continuous in intro and browse, throttled to 30 fps in panel mode (idle rotation still runs), throttled to 10 fps in watching mode, paused when the tab is hidden.
- Thumbnails load in two tiers through one shared loader. Behind the title card the ring is blurred, so every tile gets YouTube's 320x180 `mqdefault` preview: about 70 KB for all twelve instead of 611 KB. While browsing, the focused tile and three either side (`thumbnailPriority.ts`) upgrade to full resolution, because a fling lands at most about three tiles away; on a filtered arc shorter than twelve, distance does not wrap. A tile keeps its preview on screen until the sharp image arrives and never drops back once sharp. A visitor who enters downloads about 500 KB of thumbnails rather than 611 KB, and a dot jump across the ring still lands sharp because the upgrade starts the moment the focus changes. A tile shows the placeholder colour until its first texture is ready.
- YouTube returns a 120x90 stand-in image with HTTP 200 for missing sizes, so the loader checks image width and falls back to `hqdefault` when it sees one.
- The 3D scene is a separate chunk (`src/stage.ts`). `App` imports it in an effect and mounts `<Stage/>` in an ordinary render once the module arrives. Do not switch this to `React.lazy` with a `Suspense` boundary: revealed from a boundary, the Canvas meets StrictMode's development-only effect re-run after its renderer exists, react-three-fiber's unmount cleanup force-loses the WebGL context, and the context-loss handler then switches the site to the 2D grid. A Playwright project that runs the dev server (`e2e/dev.spec.ts`) guards this. The entry bundle with the overlays is about 82 KB gzipped, so the title card paints without waiting for three.js; the scene chunk (about 318 KB gzipped) fades in behind the overlays when it arrives. A small inline script in the page head, added at build time by a Vite plugin, checks for WebGL and only then adds a `modulepreload` for the scene chunk, so it downloads in parallel with the entry script rather than after it has run. The 2D fallback never requests it, which an end-to-end test checks, and the check's result is kept on `window.__webgl` so the app does not create a second WebGL context.
- Measured on a throttled 1.6 Mbps connection with an integrated laptop GPU, against the single-bundle build: the title card went from 2.6 s to 1.6 s, and the 3D ring from 2.9 s to 3.0 s. Without the head preload the title card was 1.0 s but the ring slipped to 4.5 s, so the preload stays. Marking it low priority made no difference. In the software renderer the tests use, creating the first WebGL context takes about 1.7 s, which hides this effect; timings must be taken on a real GPU.
- Target: 60 fps on a 2020 laptop with integrated graphics, 30 fps or better on a mid-range 2022 phone, entry JS under 100 KB gzipped, first ring visible under 2 s on a 4G connection.

## 12. Failure handling

| Case | Behaviour |
|---|---|
| WebGL unavailable at load | `webgl=false`, render Grid2D |
| WebGL context lost | Attempt one restore; if it fails within 2 s, switch to Grid2D and keep state |
| `maxresdefault` 404 or error | Retry with `hqdefault`, then keep the preview, then placeholder with title |
| YouTube iframe fails or blocked | An "Open on YouTube" link is always shown under the player, so the piece stays reachable |
| Unknown hash slug or panel | Redirect to `#/work` |
| `prefers-reduced-motion` | Camera fly-in becomes a 300 ms fade, idle rotation off, inertia off, drag steps one tile per gesture, bloom off, haze frozen in place, the title card's floor and the ring's beam come and go without fading, and the beam's dust holds still |
| Journal file with bad frontmatter | Build fails with the filename in the error |

## 13. Accessibility

- Every overlay control is a real button or link with a visible focus ring in gold.
- The ring has a list of the projects as links so screen readers and search engines get the content. It sits last in the tab order, after every visible control, and is clipped out of view until keyboard focus enters it, when it appears as a small list in the bottom-left corner so focus never goes invisible. The Left and Right pager buttons make keyboard stepping discoverable.
- Every mode has exactly one `h1`, the site name: visible on the title card, visually hidden elsewhere, with the caption and panel titles as `h2`.
- The pager arrows, the mobile menu button and the panel and player close buttons are 44 px targets.
- Panels trap focus while open and return it to the triggering nav item on close.
- All text tokens meet 4.5:1 against both the stage and the panel background, and resting control marks meet 3:1, enforced by `tokens.test.ts`.

## 14. Testing

- **Unit (vitest)**: `layout.ts` angles and nearest-index for N in {1, 3, 4, 5, 12} and both row modes; drag velocity decay, snap target, wraparound at 2π; hash to state and state to hash for every route in section 7; journal frontmatter parsing and date sort; slug derivation and uniqueness for the 12 projects.
- **Component (vitest + Testing Library)**: Intro, Nav, Filter, Caption, Panel bodies, Player, Grid2D against a mocked store. Asserts on labels, active states, Escape handling, focus trap, and mailto and tel hrefs.
- **End to end (Playwright)**: against the production build in headless Chromium with WebGL enabled. Load root, see Intro, click Enter, see caption "Dali Showreel", press Right, caption changes, click Play, iframe appears, Escape, open About via nav, panel visible, Escape, hash returns to `#/work`. A second test loads `#/about` directly and asserts the panel is open with no intro. A third forces WebGL off and asserts Grid2D. A separate `dev` project runs the same browser against `npm run dev`, because React's StrictMode only runs there, and checks that the ring survives it without losing its WebGL context. A haze probe (`e2e/haze.spec.ts`) decodes screenshots with a small PNG reader (`e2e/png.ts`) and checks that the bands above and below the ring average between 8 and 40 of 255, that the title card sits in the same haze, that the band changes over three seconds, and that it does not change at all under reduced motion.
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
