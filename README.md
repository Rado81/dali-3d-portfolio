# Dali Sandic — 3D Portfolio

Single-scene WebGL portfolio: a curved ring of YouTube pieces around the camera, slide-in panels for About, Services, Journal and Contact, hash routing, and a 2D fallback.

## Develop

Node 22.12 or newer (see .node-version).

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
