# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**nohalito.org** is a personal portfolio site (React 19 + Vite, deployed to GitHub Pages) that also hosts small standalone web apps. The project treats code quality and engineering reasoning as part of the deliverable, not just the visual result — most modules carry a docblock explaining *why* they are shaped the way they are. Match that when editing: explain the reasoning, not the mechanics.

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

### Lint

`bun run lint` works and currently reports **0 problems across 26 files** — treat a non-empty result as something you introduced. [eslint.config.js](eslint.config.js) is ESLint 9 **flat config**: an array of config objects applied in order, no `.eslintrc` cascade. Add rules by editing the last object; a new plugin is `import`ed and placed in `plugins`, never referenced by name string.

The script is scoped to `eslint src`, so root-level files (`vite.config.js`, the config itself) are not linted — they would need a second block with `globals.node`.

`react/prop-types` is deliberately off — the JSDoc blocks state the shapes, and [jsconfig.json](jsconfig.json) now checks them (below).

### Type checking

There is no `tsconfig.json` and no `typescript` dependency: the codebase stays plain JSX, and [jsconfig.json](jsconfig.json) runs TypeScript's *checker* over it via `checkJs`. VS Code does this live; the CLI equivalent is `bunx tsc --noEmit -p jsconfig.json` (not a package script, since `typescript` is not installed). **Currently 10 errors, all genuine**. Nothing enforces them in CI.

Three settings there are load-bearing and easy to undo by accident:

- **`maxNodeModuleJsDepth: 0`** — a jsconfig defaults this to `2`, which makes `checkJs` type-check untyped library JavaScript inside `node_modules`. Removing this line reintroduces **~5,700 errors from `three`'s bundled source**. A jsconfig is not just "a tsconfig with `allowJs`"; it carries its own defaults.
- **`types: ["vite/client"]`** — declares `*.css`, `*.jpg` and `import.meta.env` as real modules. Without it every component errors on its own stylesheet import.
- **`noImplicitAny: false`** — staging, not preference. Turning it on adds ~43 "prop has no declared type" errors. The intended path is to type props incrementally (`@param profile` → `@param {typeof PROFILE} profile`) and flip it back on at zero.

There is deliberately **no `paths` / `@/*` alias**. It would need a matching `resolve.alias` in [vite.config.js](vite.config.js), and a `paths` entry without one lets the editor green-light imports the build then rejects. The repo has one `../../` import today, so the alias is not yet worth two sources of truth — add both halves together or neither.

## Deployment path — five files must agree

The site is served from a GitHub Pages **project** subpath, currently `/nohalito.org/` (the repo name; it is not a domain anyone owns, and the site is served from `github.io`). Three files encode it, and getting any of them wrong breaks the site outright:

1. [vite.config.js](vite.config.js) — `base: '/nohalito.org/'`
2. [src/App.jsx](src/App.jsx) — `<BrowserRouter basename="/nohalito.org">`
3. [public/404.html](public/404.html) — `pathSegmentsToKeep = 1` (0 only if the site moves to a custom domain / user page at the root)

Note that #3 counts path *segments*, not the name — renaming the repo leaves it at 1, because the site is still one level below the origin. It is the one value a rename must **not** touch.

Two more carry the path inside an absolute URL, and are wrong *silently* — the site still works, it just misreports its own address to machines:

4. [index.html](index.html) — `og:url`, currently `https://nohalito.github.io/nohalito.org/`
5. [public/sitemap.xml](public/sitemap.xml) — `<loc>`, the same URL

⚠️ This section previously claimed #4 joined the list only for an **origin** change (a custom domain), not a subpath change. That was wrong, and cost a rename: `og:url` is absolute, so it contains the subpath as well as the origin. A repo rename changes both. #5 was not listed at all. If the site ever does move to a custom domain, all five change, plus a `CNAME` file in `public/`.

Open Graph and sitemap URLs cannot be relative and cannot use the base placeholder — scrapers and crawlers resolve them on their own servers, with no page context. That is why they duplicate the value instead of deriving it. Everything else in that head uses `%BASE_URL%`, which Vite substitutes from `base` at build time — prefer it for any new asset path so the count stays at five. Note the substitution is plain text and does not skip HTML comments, so don't write the placeholder inside one.

The GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) hardcodes no path — it just uploads `dist` — so it needs no change. It does pass `actions/configure-pages` **without** `static_site_generator: vite`, deliberately: that input injects a base path of its own and would become a sixth opinion about this value.

Renaming the repo and pushing the matching commit cannot be atomic, and the rename alone breaks the live site: `index.html` still loads, then every asset 404s at the old path. Rename, edit, verify with `bun run preview`, then push.

Clean URLs come from the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) trick, split across two files that must stay paired: `public/404.html` encodes the requested path into a query string, and the inline script in [index.html](index.html) decodes it back before React mounts. Neither is dead code.

## Architecture

### Routing

[src/App.jsx](src/App.jsx) is the whole route table. `/` redirects to `/home`; each hosted app gets its own top-level route. Imports come from `react-router` v7 (**not** `react-router-dom`).

### The layered background — the load-bearing idea

[src/components/BackgroundStage.jsx](src/components/BackgroundStage.jsx) stacks a CSS-gradient still underneath a lazily-loaded WebGL canvas. There is deliberately **no "if it fails, show the fallback" branch**: the still is simply what remains visible when the canvas doesn't arrive — whether from `prefers-reduced-motion`, a failed chunk load, or a refused WebGL context. Preserve that shape; don't add fallback state.

Supporting pieces: [ErrorBoundary](src/components/ErrorBoundary.jsx) contains a renderer throw (a `useEffect` failure in Three.js would otherwise blank the entire page), and [usePrefersReducedMotion](src/hooks/usePrefersReducedMotion.js) subscribes to `matchMedia` `change` so the OS setting takes effect live.

That hook is the single source both motion features read — `BackgroundStage` skips the canvas, and [useReveal](src/hooks/useReveal.js) shows content immediately instead of fading it in. Every `<Pane>` wraps its children in [Reveal](src/components/Reveal.jsx), so panes get the scroll-in fade for free. Put new motion behind the same hook rather than a fresh `matchMedia` call: a CSS `@media (prefers-reduced-motion)` block cannot see a `requestAnimationFrame` loop, which is why the JS check exists at all.

⚠️ **Three.js code-splitting is fragile, and the invariant is subtler than "never import three".** `BlackHoleAnimation` is behind `React.lazy` in *both* [BackgroundStage](src/components/BackgroundStage.jsx) and [App.jsx](src/App.jsx) (for the `/black-hole-test` route) — the second `lazy` is load-bearing, not stylistic. A static `import` of the component from anywhere folds it back into the main bundle and silently undoes the split (755 kB → 404 kB + a 353 kB async chunk).

The tighter constraint sits one module further down. `BackgroundStage` *does* statically import [blackHoleBackgrounds.js](src/components/blackHoleBackgrounds.js), which in turn does `import * as THREE from 'three'`. That is only survivable because the export it pulls — `createTransparentBackground` — references no `THREE` symbol, so Rollup tree-shakes the namespace away and Three stays entirely in the async chunk. Make that factory touch `THREE` even once (a `THREE.Color`, a texture) and all ~600 kB of Three lands in the main bundle, with no error and no warning.

Verify by chunk size, not by reading the imports: after touching anything in that graph, `bun run build` and check `dist/assets` for a `BlackHoleAnimation-*.js` around 350 kB sitting *beside* an `index-*.js` around 400 kB. One fat bundle means the split is gone.

### Home page composition

[src/pages/Home.jsx](src/pages/Home.jsx) composes only; it neither styles nor fetches. Three `<Pane>` sections alternate `glass` (background shows through) and `solid` (background eclipsed) to give the scroll a beat.

All copy and data live in [src/pages/homeContent.js](src/pages/homeContent.js), separate from the components that render it — editing wording should never mean opening a component. `SECTIONS` drives both the header nav and the panes, so the two cannot drift. Most content is now real; the remaining `TODO` placeholders are the Cram Cards and QR generator project descriptions.

Each pane has a section component under [src/components/home/](src/components/home/) taking its slice of `homeContent` as one prop. `EXPERIENCE` is three parallel columns rather than one merged list, and within a column `ExperienceSection` distinguishes a row from a group *by whether `entries` is present* — so adding a field named `entries` to a row silently reclassifies it. The `EXPERIENCE` docblock carries the reasoning and both field lists; read it before restructuring that data.

### Convention: stable prop references

Several components take a prop that seeds a `useEffect` dependency — `BlackHoleAnimation`'s `background` factory, `useActiveSection`'s `sectionIds`, `SiteHeader`'s `sections`. Pass module-level constants or `useMemo` results; an inline array or arrow tears down and rebuilds the scene (or re-subscribes the observer) on every render. The docblocks say so — keep them accurate if a signature changes.

### Hosted apps

Each lives under `src/apps/<app-name>/` with the entry component at the root plus `components/` and `hooks/` subfolders (`.gitkeep`-ed while empty). `cram-cards` and `qr-code-generator` are both scaffolds only; `qr-code-generator` is not yet routed in `App.jsx`. Follow that layout for new apps.

### Styling

Plain CSS, one `.css` file next to each component, imported by it. [src/index.css](src/index.css) is a minimal reset only — no design-token layer exists yet; colours are literals in component CSS. `body` sets `#040404` so there is never a white flash.

One trap: `.visually-hidden` is used by `SiteFooter` and `ExperienceSection` but defined in [Home.css](src/pages/Home.css) scoped as `.home .visually-hidden`. It works today only because both render inside `<div className="home">`. Reusing either component on another page would make the "hidden" label visible — move the rule to `index.css` at that point.

## Other notes

## When suggesting libraries or features

Favour well-reasoned modern choices over the simplest option, and explain the reasoning — the repo is itself the portfolio artifact. The author is fluent in HTML/CSS/Git but newer to build tooling, React internals, and TypeScript configuration, so introduce new tooling with the concept, not just the command.
