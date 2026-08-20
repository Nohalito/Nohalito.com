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
bun run preview  # serve the built output, base path and all (localhost:4173/nohalito.org/)
bun run lint     # eslint src
```

There is **no test runner configured** — no Vitest/Jest, no test files. Don't reference `bun test` as if it exercised this project. The practical consequence is that `bun run build` and the chunk-size check below are the only automated signal that the Three.js split still holds, so run them after touching that graph.

### Lint

`bun run lint` currently reports **0 problems across 26 source files** — treat a non-empty result as something you introduced. CI runs it *before* the build ([deploy.yml](.github/workflows/deploy.yml)) and fails the job on any error, on pushes and pull requests alike, so lint is a real gate.

[eslint.config.js](eslint.config.js) is ESLint 9 **flat config**: an array of config objects applied in order, no `.eslintrc` cascade. Add rules by editing the last object; a new plugin is `import`ed and placed in `plugins`, never referenced by name string.

The script is scoped to `eslint src`, so root-level files (`vite.config.js`, the config itself) are not linted — they would need a second block with `globals.node`.

`react/prop-types` is deliberately off — the JSDoc blocks state the shapes, and [jsconfig.json](jsconfig.json) checks them (below).

### Type checking

There is no `tsconfig.json` and no `typescript` dependency: the codebase stays plain JSX, and [jsconfig.json](jsconfig.json) runs TypeScript's *checker* over it via `checkJs`. VS Code does this live; the CLI equivalent is `bunx tsc --noEmit -p jsconfig.json` (not a package script, since `typescript` is not installed). Nothing enforces it in CI — unlike lint.

**Currently 10 errors, and they are not evenly spread:**

- **9 sit in the background/Three.js graph and the app entry** — `BlackHoleAnimation` (3), `blackHoleBackgrounds` (3), `BackgroundStage` (1), `Reveal` (1), `main.jsx` (1). Almost all are DOM-nullability (`getContext` may return null, `getElementById` may return null) and ref-typing noise, not logic bugs.
- **1 is a genuine annotation bug**: `Home.jsx(39,8)` reports `sectionBasePath` missing on `SiteHeader`. Home omitting it is *correct and deliberate* (see below) — the JSDoc simply declares it as required. The fix is `@param [sectionBasePath]`, not a prop passed at the call site.

The entire `src/apps/flash-cards/` tree — the largest thing in the repo — type-checks **clean**. It was written with the checker on, and uses the JSDoc-codebase idioms for it: `useState(/** @type {string | null} */ (null))` to declare a nullable state, and `@typedef` in [model.js](src/apps/flash-cards/model.js) as the single source of the data shapes. Keep new code in that tree at zero.

Three jsconfig settings are load-bearing and easy to undo by accident:

- **`maxNodeModuleJsDepth: 0`** — a jsconfig defaults this to `2`, which makes `checkJs` type-check untyped library JavaScript inside `node_modules`. Removing this line reintroduces **~5,700 errors from `three`'s bundled source**. A jsconfig is not just "a tsconfig with `allowJs`"; it carries its own defaults.
- **`types: ["vite/client"]`** — declares `*.css`, `*.webp` and `import.meta.env` as real modules. Without it every component errors on its own stylesheet import.
- **`noImplicitAny: false`** — staging, not preference. Turning it on adds ~43 "prop has no declared type" errors. The intended path is to type props incrementally (`@param profile` → `@param {typeof PROFILE} profile`) and flip it back on at zero.

There is deliberately **no `paths` / `@/*` alias**. It would need a matching `resolve.alias` in [vite.config.js](vite.config.js), and a `paths` entry without one lets the editor green-light imports the build then rejects. The repo's deepest relative import is `../../../` (the flash-cards app reaching shared components), so an alias is now closer to worth it than it was — but add both halves together or neither.

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

A **sixth** consumer exists in JS rather than markup: any hand-written `href` to an internal route. React Router's `basename` only applies to router navigation, so a raw `<a href="/home#about">` skips the base and 404s on the deployed subpath. Use `<Link>` for internal targets — this is exactly the bug `SiteHeader`'s `sectionBasePath` branch exists to avoid.

The GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) hardcodes no path — it just uploads `dist` — so it needs no change. It does pass `actions/configure-pages` **without** `static_site_generator: vite`, deliberately: that input injects a base path of its own and would become yet another opinion about this value. Bun is pinned to 1.3.14 and install uses `--frozen-lockfile`, both deliberately; bump the pin as its own commit.

Renaming the repo and pushing the matching commit cannot be atomic, and the rename alone breaks the live site: `index.html` still loads, then every asset 404s at the old path. Rename, edit, verify with `bun run preview`, then push.

Clean URLs come from the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) trick, split across two files that must stay paired: `public/404.html` encodes the requested path into a query string, and the inline script in [index.html](index.html) decodes it back before React mounts. Neither is dead code — and it is what makes the flash-cards app's deep routes (`/flash-cards/t/:topicId/study`) reloadable and bookmarkable at no cost.

## Architecture

### Routing

[src/App.jsx](src/App.jsx) is the whole route table. `/` redirects to `/home`; each hosted app gets its own top-level route, and may nest beneath it. Imports come from `react-router` v7 (**not** `react-router-dom`).

Everything except `Home` is behind `React.lazy`, for **two different reasons** that should not be conflated:

- `BlackHoleTest` is lazy to keep **Three.js** out of the main bundle (see below) — a hard bundling constraint.
- The five flash-cards routes are lazy because they are a **whole app** the average home-page visitor never runs, not because of a heavy dependency.

Topic ids in the URL are opaque, not slugs of the topic name: renaming a topic is an ordinary action, and a slug would break every link to it the moment you did.

### The layered background — the load-bearing idea

[src/components/BackgroundStage.jsx](src/components/BackgroundStage.jsx) stacks a CSS-gradient still underneath a lazily-loaded WebGL canvas. There is deliberately **no "if it fails, show the fallback" branch**: the still is simply what remains visible when the canvas doesn't arrive — whether from `prefers-reduced-motion`, a failed chunk load, or a refused WebGL context. Preserve that shape; don't add fallback state.

Supporting pieces: [ErrorBoundary](src/components/ErrorBoundary.jsx) contains a renderer throw (a `useEffect` failure in Three.js would otherwise blank the entire page), and [usePrefersReducedMotion](src/hooks/usePrefersReducedMotion.js) subscribes to `matchMedia` `change` so the OS setting takes effect live.

That hook is the single source both motion features read — `BackgroundStage` skips the canvas, and [useReveal](src/hooks/useReveal.js) shows content immediately instead of fading it in. Every `<Pane>` wraps its children in [Reveal](src/components/Reveal.jsx), so panes get the scroll-in fade for free. Put new motion behind the same hook rather than a fresh `matchMedia` call: a CSS `@media (prefers-reduced-motion)` block cannot see a `requestAnimationFrame` loop, which is why the JS check exists at all.

⚠️ **Three.js code-splitting is fragile, and the invariant is subtler than "never import three".** `BlackHoleAnimation` is behind `React.lazy` in *both* [BackgroundStage](src/components/BackgroundStage.jsx) and [App.jsx](src/App.jsx) (for the `/black-hole-test` route) — the second `lazy` is load-bearing, not stylistic. A static `import` of the component from anywhere folds it back into the main bundle and silently undoes the split.

The tighter constraint sits one module further down. `BackgroundStage` *does* statically import [blackHoleBackgrounds.js](src/components/blackHoleBackgrounds.js), which in turn does `import * as THREE from 'three'`. That is only survivable because the export it pulls — `createTransparentBackground` — references no `THREE` symbol, so Rollup tree-shakes the namespace away and Three stays entirely in the async chunk. Make that factory touch `THREE` even once (a `THREE.Color`, a texture) and all ~600 kB of Three lands in the main bundle, with no error and no warning.

**Verify by chunk size, not by reading the imports.** After touching anything in that graph, `bun run build` and check `dist/assets` for these two sitting side by side (current, verified):

```
assets/BlackHoleAnimation-*.js   354 kB │ gzip: 89 kB
assets/index-*.js                410 kB │ gzip: 125 kB
```

One fat bundle (~755 kB) means the split is gone.

### Home page composition

[src/pages/Home.jsx](src/pages/Home.jsx) composes only; it neither styles nor fetches. Three `<Pane>` sections alternate `glass` (background shows through) and `solid` (background eclipsed) to give the scroll a beat.

All copy and data live in [src/pages/homeContent.js](src/pages/homeContent.js), separate from the components that render it — editing wording should never mean opening a component. `SECTIONS` drives both the header nav and the panes, so the two cannot drift. Its exports (`SECTIONS`, `BRAND`, `PROFILE`, `EXPERIENCE`, `PROJECTS`, `FOOTER`) are consumed by the hosted apps too, not just Home — `AppFrame` pulls `BRAND`, `FOOTER` and `SECTIONS` so the chrome stays in one place.

Each pane has a section component under [src/components/home/](src/components/home/) taking its slice of `homeContent` as one prop. `EXPERIENCE` is three parallel columns rather than one merged list, and within a column `ExperienceSection` distinguishes a row from a group *by whether `entries` is present* — so adding a field named `entries` to a row silently reclassifies it. The `EXPERIENCE` docblock carries the reasoning and both field lists; read it before restructuring that data.

### Shared chrome across pages

`SiteHeader` and `SiteFooter` are rendered by both the home page and the hosted apps, and two mechanisms make that reuse work. Both matter when adding a new app:

- **`SiteHeader`'s `sectionBasePath`.** The nav links point at sections that live on the home page. From `/home` a bare `#about` is correct, so Home omits this prop. From any other route that fragment resolves to nothing — silently, since a fragment with no matching element is not an error. Passing `sectionBasePath="/home"` switches the links to `/home#about` **and** to router `<Link>`s, which is what applies the `/nohalito.org` basename. It also switches the scroll-spy off by handing `useActiveSection` an empty list, so "About" cannot light up on a route with no About.
- **[useHashScroll](src/hooks/useHashScroll.js).** The browser scrolls to a fragment only on a real page load; a router navigation to `/home#about` leaves it in the URL with nothing moving. This hook does it after a client-side nav, waits one frame (panes have zero height before layout), and returns early with no fragment so a plain visit or a back-navigation keeps its scroll position.

### Hosted apps

Each lives under `src/apps/<app-name>/` with the entry component at the root plus `components/` and `hooks/` subfolders. Follow that layout for new apps.

| App | State |
| --- | --- |
| `flash-cards` | **Complete and routed** — five screens. The reference implementation; read it before writing a new app. |
| `qr-code-generator` | Scaffold only: an `<h1>`, empty `components/`+`hooks/`, **not routed** in `App.jsx`. |

#### Flash Cards

The largest subsystem in the repo, and the one whose conventions a second app should copy. Data lives in `localStorage`; nothing is uploaded.

**The four data modules are split by *who has to agree*, not by size.** Reach for the right one:

| Module | Owns |
| --- | --- |
| [model.js](src/apps/flash-cards/model.js) | The shapes, the `@typedef`s, validation, normalisation, scoring (`isRight`), `shuffled`. |
| [storage.js](src/apps/flash-cards/storage.js) | localStorage + the in-memory cache; the only writer. |
| [transfer.js](src/apps/flash-cards/transfer.js) | File import/export (JSON only) and duplicate detection. |
| [draft.js](src/apps/flash-cards/draft.js) | The *form's* shape and the two conversions to/from a stored item. |

`model.js` is separate precisely because three consumers must agree on validation — the form, the file parser, and the storage layer. A rule that lives in the form is a rule an imported file never has to pass.

Load-bearing decisions, each with fuller reasoning in the file's docblock:

- **A question's `correct` is a boolean on each answer, not a `correctIndex` on the question.** Multi-correct answers therefore cost a validation rule, a form control and a scoring rule — and *no format change*. Files exported before and after still round-trip. Don't "simplify" this to an index.
- **Two localStorage keys**: `flash-cards:index` (name + counts + timestamps, for the topic list) and `flash-cards:topic:<id>` (the whole topic). The index is derived data rebuilt on every write, so a corrupted index is cosmetic, not lost work.
- **Cache first, then persist.** If a write throws (quota, private mode, blocked storage), the in-memory cache already holds the change, so the session continues intact and a permanent banner says saving has stopped. `useStorageHealthy` never returns to `true` within a session — a banner that flickers off would claim the work is safe when it isn't.
- **`useSyncExternalStore`, via [useTopics.js](src/apps/flash-cards/hooks/useTopics.js)** — not `useState` + `useEffect`. This works *only* because the store returns cached objects: a `getSnapshot` that parsed JSON per call would return a new object every render and loop forever. Preserve that property when touching `storage.js`.
- **Imports are all-or-nothing.** `parseTopicFile` parses to completion before anything is added, so the outcomes are "nothing happened, entry N was bad" or "all of it arrived". Duplicates are matched on **item id only** — matching on front text would be wrong the first time two cards share a prompt.
- **JSON only, both directions. CSV was removed deliberately** and should not come back: a question holds up to six answers with explanations, which is fourteen mostly-empty columns, and the old CSV export silently wrote out only the *cards* of a mixed topic — a file that looks like a backup and isn't.
- **All authored text is plain, and nothing renders it as HTML.** An imported file is a file someone else wrote; React escapes by default. Do not reach for `dangerouslySetInnerHTML` anywhere in this app.
- **`updatedAt` vs `openedAt`.** `touchTopic` records opening and writes the index only — reading a topic is not editing it, and one merged "last touched" timestamp would make "what did I change recently" unanswerable.

Session behaviour lives in [useSession.js](src/apps/flash-cards/hooks/useSession.js): a session is always the **whole topic** (the topic page's filter is a list-management tool, not a study selection), with `only` as the single exception, fed by the score page's "Retry missed". `useSessionKeys` binds shortcuts at the document level and stands down for fields, modifier combos, and keys that would activate the focused control — otherwise binding Enter globally makes every visible button unreachable by keyboard.

[AppFrame.jsx](src/apps/flash-cards/components/AppFrame.jsx) is the shell every screen renders inside, and [AppFrame.css](src/apps/flash-cards/components/AppFrame.css) is a deliberate exception to the one-stylesheet-per-component rule: it is the only stylesheet guaranteed loaded on every route, so it owns the tokens and the shared furniture. Splitting that out would make loading order depend on which route you entered through. `<title>` is set per route as a plain JSX element — React 19 hoists it into `<head>`, so no helmet library is needed.

### Convention: stable prop references

Several components take a prop that seeds a `useEffect` dependency — `BlackHoleAnimation`'s `background` factory, `useActiveSection`'s `sectionIds`, `SiteHeader`'s `sections`. Pass module-level constants or `useMemo` results; an inline array or arrow tears down and rebuilds the scene (or re-subscribes the observer) on every render. The docblocks say so — keep them accurate if a signature changes.

### Styling

Plain CSS, one `.css` file next to each component, imported by it.

**There is a design-token layer, and it is deliberately duplicated per page root.** The same names (`--bg`, `--panel`, `--text`, `--muted`, `--line`, `--purple`, `--blue`, the font stacks) are declared twice: on `.home` in [Home.css](src/pages/Home.css) and on `.flash-cards` in [AppFrame.css](src/apps/flash-cards/components/AppFrame.css). That is not an oversight waiting to be hoisted to `:root` — it is what lets the two surfaces diverge without a fight, and it is the mechanism by which `SiteHeader`/`SiteFooter` restyle themselves per page: they read `var(--line)`, `var(--text)` and friends, inheriting from whichever page root they sit inside.

**A new hosted app must therefore declare that token set on its own root**, or the shared chrome renders unstyled. `AppFrame` adds app-specific tokens beyond the shared set (`--correct`/`--wrong` families, `--fc-top-h`).

Colour is never the only channel carrying meaning: every place the correct/wrong tokens appear, a word and a glyph say the same thing.

`body` sets `#040404` in [index.css](src/index.css) so there is never a white flash. `index.css` is otherwise a minimal reset **plus `.visually-hidden`** — which lives there specifically because it is depended on by shared components (`SiteFooter`, `ExperienceSection`, and two flash-cards screens) rendering under different page roots. It was once scoped `.home .visually-hidden`, and the failure mode when the flash-cards app reused `SiteFooter` was the opposite of harmless: the "hidden" label became visible text beside every footer icon. Any rule a shared component depends on belongs in the reset, not in a page stylesheet.

## Known drift worth fixing

Small, real, and independently verified — not speculation:

- **[SiteHeader.jsx](src/components/SiteHeader.jsx) JSDoc** declares `sectionBasePath` as required; Home correctly omits it. This is the one genuine type error outside the Three.js graph. Fix as `@param [sectionBasePath]`.
- **[App.jsx](src/App.jsx#L13-L17)'s comment** says the flash-cards routes "share one chunk". The build actually emits a separate chunk per route plus shared `AppFrame`/`SessionLayout`/`useSession`/`transfer` chunks — the intent (shared code isn't duplicated, navigation isn't blocked) holds, but the wording doesn't match the output.
- **[homeContent.js](src/pages/homeContent.js#L5-L6)'s docblock** still warns that "everything marked TODO is placeholder text". No `TODO` markers remain — both project descriptions are real. The warning outlived its subject.
- **[README.md](README.md)** still describes `flash-cards` as a scaffold and omits the app entirely from its project-structure tree.

## When suggesting libraries or features

Favour well-reasoned modern choices over the simplest option, and explain the reasoning — the repo is itself the portfolio artifact. Prefer platform APIs where they genuinely suffice, matching what is already here: `Intl.RelativeTimeFormat` instead of a date library, `ResizeObserver` instead of a `resize` listener, `useSyncExternalStore` instead of a state-management dependency. The author is fluent in HTML/CSS/Git but newer to build tooling, React internals, and TypeScript configuration, so introduce new tooling with the concept, not just the command.
