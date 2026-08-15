# nohalito.org

My personal website: an interactive presentation of myself, and a host for the small
web applications I build along the way. 

**Live:** https://nohalito.github.io/nohalito.org/

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick start](#quick-start)
  - [URLs](#urls)
- [Deployment](#deployment)

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | **React 19** |
| Routing | **React Router 7** (`react-router`, *not* `react-router-dom`) |
| 3D | **Three.js** |
| Styling | **Plain CSS**, one file next to each component |
| Build | **Vite 5** |
| Packages | **Bun** |
| Linting | **ESLint 9 flat config** |
| Types | **jsconfig.json + `checkJs`** |

## Project structure

```
nohalito.org/
├─ .github/workflows/deploy.yml   # build → lint → upload → deploy to Pages
├─ public/
│  ├─ 404.html                    # SPA redirect trick, half of the clean-URL pair
│  ├─ favicon.svg
│  ├─ robots.txt
│  └─ sitemap.xml
├─ src/
│  ├─ apps/                       # standalone apps hosted on the site
│  │  └─ cram-cards/              # <App>.jsx + .css at the root, then:
│  │     ├─ components/
│  │     └─ hooks/
│  ├─ assets/
│  ├─ components/
│  │  ├─ BackgroundStage.jsx      # gradient still + lazy WebGL canvas
│  │  ├─ BlackHoleAnimation.jsx   # the only module that owns a Three.js scene
│  │  ├─ blackHoleBackgrounds.js
│  │  ├─ ErrorBoundary.jsx        # contains a renderer throw
│  │  ├─ Pane.jsx                 # glass / solid section shell
│  │  ├─ Reveal.jsx               # scroll-in fade
│  │  ├─ SiteHeader.jsx / SiteFooter.jsx / ProfilePhoto.jsx
│  │  └─ home/                    # one component per home-page section
│  ├─ hooks/
│  │  ├─ useActiveSection.js      # IntersectionObserver → nav highlight
│  │  ├─ usePrefersReducedMotion.js
│  │  └─ useReveal.js
│  ├─ pages/
│  │  ├─ Home.jsx                 # composes only — no styling, no fetching
│  │  ├─ homeContent.js           # all copy and data live here
│  │  └─ BlackHoleTest.jsx
│  ├─ utils/
│  ├─ App.jsx                     # the whole route table
│  ├─ main.jsx
│  └─ index.css                   # reset only
├─ index.html                     # %BASE_URL% placeholders + SPA decode script
├─ jsconfig.json
├─ eslint.config.js
└─ vite.config.js
```

Each hosted app follows the same shape: `src/apps/<app-name>/` with the entry component at the root and `components/` + `hooks/` beneath it. `cram-cards` and `qr-code-generator` are both scaffolds for now.

## Getting started

### Prerequisites

- **[Bun](https://bun.sh/) 1.3+** — the package manager for this repo. CI pins 1.3.14.
- A browser with **WebGL** if you want to see the animated background; without it the gradient still renders and the site is otherwise fully functional.

### Quick start

```bash
bun install      # installs from the committed bun.lock
bun run dev      # Vite dev server with hot module replacement
bun run lint     # eslint src — CI runs this and fails the build on any error
bun run build    # production build → dist/
bun run preview  # serve the built output, base path and all
```

### URLs

| Environment | URL |
| --- | --- |
| Dev server | http://localhost:5173 |
| Preview build | http://localhost:4173/nohalito.org/ |
| Production | https://nohalito.github.io/nohalito.org/ |

Routes: `/` redirects to `/home`; `/black-hole-test` renders the background on its own for tuning; `/cram-cards` is the first hosted app.

## Deployment

The site is served from a GitHub Pages **project** subpath, `/nohalito.org/` — the repo name, not a domain — and that value is written in five files that must agree. Three break the site if they disagree:

1. [`vite.config.js`](vite.config.js) — `base: '/nohalito.org/'`
2. [`src/App.jsx`](src/App.jsx) — `<BrowserRouter basename="/nohalito.org">`
3. [`public/404.html`](public/404.html) — `pathSegmentsToKeep = 1` (segments, not the name — a rename leaves this alone)

Two more embed it in an absolute URL and go wrong silently, since scrapers and crawlers resolve them off-site and so cannot use a relative path:

4. [`index.html`](index.html) — `og:url`
5. [`public/sitemap.xml`](public/sitemap.xml) — `<loc>`

Clean URLs come from the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) trick. GitHub Pages has no server-side rewrite, so a hard refresh on `/home` would 404.

## License

See [LICENSE](LICENSE).
