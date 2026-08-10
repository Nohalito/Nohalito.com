# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nohalito.com** is a personal portfolio site (React 19 + Vite, deployed to GitHub Pages) that also hosts small standalone web apps. The project treats code quality and engineering reasoning as part of the deliverable, not just the visual result — most modules carry a docblock explaining *why* they are shaped the way they are. Match that when editing: explain the reasoning, not the mechanics.

## Development Commands

Bun is the package manager (`bun.lock` is committed, and CI uses `oven-sh/setup-bun`). Do not introduce `package-lock.json` / `yarn.lock`.

```bash
bun install
bun run dev      # Vite dev server, http://localhost:5173
bun run build    # production build → dist/
bun run preview  # serve the built output
bun run lint     # eslint src  — see caveat below
```

There is **no test runner configured** — no Vitest/Jest, no test files. Don't reference `bun test` as if it exercised this project.

### Lint is currently broken

`package.json` declares `eslint` 8 plus the React plugins, but **no ESLint config file exists** (`eslint.config.js` / `.eslintrc*` are all absent), so `bun run lint` cannot resolve a config. Adding one is outstanding work, not a repair to make silently mid-task. Likewise, `tsconfig.json` does not exist — the codebase is plain JSX despite TypeScript being the stated preference.

## Deployment path — three files must agree

The site is served from a GitHub Pages **project** subpath, currently `/Nohalito.com/`. Changing it means changing all three:

1. [vite.config.js](vite.config.js) — `base: '/Nohalito.com/'`
2. [src/App.jsx](src/App.jsx) — `<BrowserRouter basename="/Nohalito.com">`
3. [public/404.html](public/404.html) — `pathSegmentsToKeep = 1` (0 only if the site moves to a custom domain / user page at the root)

The GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) hardcodes no path — it just uploads `dist` — so it needs no change.

Clean URLs come from the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) trick, split across two files that must stay paired: `public/404.html` encodes the requested path into a query string, and the inline script in [index.html](index.html) decodes it back before React mounts. Neither is dead code.

## Architecture

### Routing

[src/App.jsx](src/App.jsx) is the whole route table. `/` redirects to `/home`; each hosted app gets its own top-level route. Imports come from `react-router` v7 (**not** `react-router-dom`).

### The layered background — the load-bearing idea

[src/components/BackgroundStage.jsx](src/components/BackgroundStage.jsx) stacks a CSS-gradient still underneath a lazily-loaded WebGL canvas. There is deliberately **no "if it fails, show the fallback" branch**: the still is simply what remains visible when the canvas doesn't arrive — whether from `prefers-reduced-motion`, a failed chunk load, or a refused WebGL context. Preserve that shape; don't add fallback state.

Supporting pieces: [ErrorBoundary](src/components/ErrorBoundary.jsx) contains a renderer throw (a `useEffect` failure in Three.js would otherwise blank the entire page), and [usePrefersReducedMotion](src/hooks/usePrefersReducedMotion.js) subscribes to `matchMedia` `change` so the OS setting takes effect live.

⚠️ **Three.js code-splitting is fragile.** `BlackHoleAnimation` is behind `React.lazy` in *both* `BackgroundStage` and `App.jsx` (for the `/black-hole-test` route). A single static `import` of it — or of `three` — anywhere in the graph forces Rollup to fold the module back into the main bundle and silently undoes the split (755 kB → 404 kB + a 353 kB async chunk). Check `dist/assets` chunk sizes after touching anything that imports it.

[docs/black-hole-background.md](docs/black-hole-background.md) is the live working spec for this area — read it before changing the animation, and update its checkboxes as items land.

### Home page composition

[src/pages/Home.jsx](src/pages/Home.jsx) composes only; it neither styles nor fetches. Three `<Pane>` sections alternate `glass` (background shows through) and `solid` (background eclipsed) to give the scroll a beat.

All copy and data live in [src/pages/homeContent.js](src/pages/homeContent.js), separate from the components that render it — editing wording should never mean opening a component. Much of it is still `TODO` placeholder text from the design mockups. `SECTIONS` drives both the header nav and the panes, so the two cannot drift.

### Convention: stable prop references

Several components take a prop that seeds a `useEffect` dependency — `BlackHoleAnimation`'s `background` factory, `useActiveSection`'s `sectionIds`, `SiteHeader`'s `sections`. Pass module-level constants or `useMemo` results; an inline array or arrow tears down and rebuilds the scene (or re-subscribes the observer) on every render. The docblocks say so — keep them accurate if a signature changes.

### Hosted apps

Each lives under `src/apps/<app-name>/` with the entry component at the root plus `components/` and `hooks/` subfolders (`.gitkeep`-ed while empty). `cram-cards` and `qr-code-generator` are both scaffolds only; `qr-code-generator` is not yet routed in `App.jsx`. Follow that layout for new apps.

### Styling

Plain CSS, one `.css` file next to each component, imported by it. [src/index.css](src/index.css) is a minimal reset only — no design-token layer exists yet; colours are literals in component CSS. `body` sets `#040404` so there is never a white flash.

## Other notes

- `design-templates*.html` at the repo root are self-contained static design explorations (three rounds). They are reference mockups, not part of the build — the site does not import them.
- [vite.config.js](vite.config.js) enables `server.watch.usePolling` because the dev server may be run from WSL against the Windows filesystem, where inotify misses Windows-side edits. Leave it unless the WSL workflow is abandoned.
- `Learning/` and `Notes.md` are gitignored personal notes.

## When suggesting libraries or features

Favour well-reasoned modern choices over the simplest option, and explain the reasoning — the repo is itself the portfolio artifact. The author is fluent in HTML/CSS/Git but newer to build tooling, React internals, and TypeScript configuration, so introduce new tooling with the concept, not just the command.
