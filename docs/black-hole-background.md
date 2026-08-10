# Black hole background — working notebook

Running spec + todo list for turning `BlackHoleAnimation` from a test-page demo
into the permanent background of the main page.

**Started:** 2026-08-08
**Owner:** Noa
**Files in scope:** [`src/components/BlackHoleAnimation.jsx`](../src/components/BlackHoleAnimation.jsx),
[`src/components/blackHoleBackgrounds.js`](../src/components/blackHoleBackgrounds.js)
**Out of scope:** [`src/pages/BlackHoleTest.jsx`](../src/pages/BlackHoleTest.jsx) — kept working as-is.

Status key: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` decided against

---

## The short version

The animation is WebGL. WebGL is the one part of a web page that can fail
*completely* — the user's settings can forbid it, their hardware can refuse it,
their phone can survive it but at the cost of a hot device and a flat battery.
Every other part of the site degrades gracefully on its own; this part does not,
unless it is made to.

Three problems, one shared answer: **a static fallback that looks deliberate.**

---

## Problem 1 — People who have asked for less motion

### What it is

`prefers-reduced-motion` is an operating-system accessibility setting, not a
browser one:

- Windows: Settings → Accessibility → Visual effects → Animation effects
- macOS: System Settings → Accessibility → Display → Reduce motion

The browser forwards it to the page. Turning it on is a real request from a real
person: large moving visuals can trigger nausea, dizziness and migraines in
people with vestibular disorders. A full-screen swirling accretion disc is close
to the worst case for this. It is also covered by WCAG 2.3.3, which is why
people reviewing a portfolio tend to check for it.

### Why the existing CSS is not enough

The design templates already carry the standard block:

```css
@media (prefers-reduced-motion: reduce) { /* … */ }
```

CSS can only stop *CSS* animations and transitions. The black hole's motion
comes from a `requestAnimationFrame` loop inside JavaScript, which CSS cannot
see or touch. **The media query has zero effect on the canvas.** It has to be
checked in JS as well:

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

### Acceptance criteria

- With the setting on, nothing on screen moves — verified by actually toggling
  it in Windows settings, not by assuming.
- The page still looks composed. Preference: build the scene and render exactly
  **one** frame, then stop. The black hole is present, simply frozen.
- The preference is re-checked if it changes mid-session (`matchMedia` fires a
  `change` event), rather than only being read once at mount.

### Todo

- [x] `usePrefersReducedMotion` hook, subscribed to `change` so toggling the OS
      setting takes effect live
- [x] `BackgroundStage` skips mounting the animation entirely when the
      preference is set — the static still (Problem 4) is what remains
- [x] `Reveal` / `useReveal` show content immediately instead of animating it in
- [ ] Single-frame render path: build the scene, `renderer.render()` once, never
      start the loop. Better than not mounting at all — the black hole is
      present, simply frozen. Needs a `paused` prop on `BlackHoleAnimation`.
- [ ] Manual test with the OS setting on **and** off

---

## Problem 2 — Devices where WebGL is unavailable or broken

### What it is

Creating a WebGL context is allowed to fail. Causes seen in the wild: old
integrated GPUs, drivers on the browser's blocklist, locked-down corporate
machines, privacy-hardened browsers, some headless/screenshot tools, and simply
having too many WebGL canvases already open in other tabs.

### Why it matters more than it sounds

`new THREE.WebGLRenderer()` runs inside a `useEffect`. If it throws, the error
propagates and React unmounts the tree — **the entire page goes blank**, not
just the background. A decorative element is able to take down the content it
decorates.

### Acceptance criteria

- A renderer failure is contained, not propagated.
- On failure the page renders the static fallback (Problem 4) and every pane,
  all text and all navigation still work.
- The failure is logged once, not per frame.

### Todo

- [x] `ErrorBoundary` around the animation in `BackgroundStage`. An error thrown
      inside an effect propagates to the nearest boundary, so this catches the
      refused context without `BlackHoleAnimation` needing to know it might
      fail. Logged once in `componentDidCatch`.
- [x] Failure needs no explicit fallback state — the static still sits *under*
      the canvas, so it is simply what remains visible.
- [ ] Feature-detect up front rather than relying on the throw
      (`document.createElement('canvas').getContext('webgl2')`), so the failure
      path does not involve an exception at all
- [ ] Test by disabling hardware acceleration in the browser settings

---

## Problem 3 — Devices where it runs, but shouldn't at full size

### What it is

The scene currently draws 500 particles, each owning its own `THREE.Line` trail.
That is ~500 separate draw calls plus ~500 buffer uploads **every frame**. On a
desktop GPU this is wasteful; on a mid-range phone it means dropped frames, a
warm device and visible battery drain — while being, at most, decoration.

Two extra wrinkles specific to this design:

- The **Experience pane is fully opaque** (`#0d0d0d`), so for roughly a full
  viewport of scrolling the canvas renders at full cost while being completely
  invisible.
- A **backgrounded tab** still gets throttled `requestAnimationFrame` callbacks
  in some browsers rather than none.

### Acceptance criteria

- A measured frame budget on a real phone, not a guess. Target: 60 fps on
  desktop, and no worse than 30 fps on a mid-range phone.
- Particle count scales down on small screens / low-core devices instead of the
  animation being dropped entirely.
- No rendering happens while the canvas is provably not visible.

### Todo

- [ ] Make `particleCount` a prop with a sensible per-device default
- [ ] Pause the loop on `document.visibilitychange`
- [ ] Pause the loop when the opaque Experience pane covers the viewport
      (`IntersectionObserver`) — cheap, invisible to the user, real saving
- [ ] Merge the 500 trail `Line`s into one buffer geometry if profiling says the
      draw-call count is the bottleneck — **only after measuring**
- [ ] Profile on an actual phone over the local network
- [x] Code-split Three.js. `React.lazy` around `BlackHoleAnimation` in
      `BackgroundStage`, plus the same around the `/black-hole-test` route in
      `App.jsx` — the second was required, because a single static import
      anywhere forces Rollup to keep the module in the main bundle and undoes
      the split. Main bundle 755 kB → 404 kB, with Three in its own 353 kB
      chunk fetched only when it is actually going to be used.

---

## Problem 4 — The static fallback itself

The shared answer to problems 1, 2 and 3. Not an error state — a designed
second version of the page.

A CSS `radial-gradient` in the same background slot, echoing the composition of
the real scene: dark core, faint halo around it. Costs nothing, cannot fail, and
guarantees the About / Experience / Projects panes never float over an empty
void.

### Acceptance criteria

- Lives in CSS, requires no JavaScript to appear.
- Sits in the same sticky slot so the layout is byte-for-byte identical.
- Looks intentional on its own. If it only looks acceptable "for a fallback",
  it isn't finished.

### Todo

- [x] Layered as the default in `BackgroundStage.css`
      (`.background-stage__still`), with the canvas mounted *over* it. No
      trigger logic exists, and so none can be wrong: the fallback is whatever
      shows when the canvas doesn't arrive.
- [x] `background-color` set on both `.background-stage` and `body`, so even
      with the gradient gone the page is never white
- [ ] Review the gradient's placement against the real animation — the halo is
      currently guessed at 62%/42%, matching roughly where the camera puts the
      hole. Compare side by side and adjust.
- [ ] Check it against the blue profile halo so the two don't compete

---

## Resolved

- [x] **Background creation split out** (2026-08-08) — moved into
      `blackHoleBackgrounds.js` as factory functions.
      `createSpaceGradientBackground()` keeps the test page's purple gradient
      and stays the default; `createTransparentBackground()` returns `null` so
      the main page's own base colour shows through the canvas instead. Each
      factory owns disposal of what it allocates.
- [x] **Sizes to its container, not the window** (2026-08-08) — was reading
      `window.innerWidth/innerHeight` and hardcoding `height: 100vh`, which
      would have broken inside the sticky background slot. Now measures the
      container and watches it with a `ResizeObserver`. Pixel ratio capped at 2.
- [x] **StrictMode remount** (2026-08-08) — a `if (sceneRef.current) return`
      guard was never reset by the cleanup, so React's dev-mode double-invoke
      tore the canvas down and then skipped rebuilding it. Guard removed in
      favour of a cleanup that genuinely restores the starting state.
- [x] **Animation loop leak** (2026-08-08) — the cleanup never called
      `cancelAnimationFrame`, so the loop kept running against a detached,
      disposed canvas after unmount. Now cancelled, with geometries, materials
      and the background texture disposed too.

---

- [x] **Glow rebuilt as a halo, purple/white** (2026-08-09) — the old
      `0xff6b00` shell was a sphere of radius 0.52 concentric with the 0.5
      sphere, alpha-blended at 20% opacity. Being concentric, its silhouette
      contained the sphere's from every angle, so the black hole was never
      visible: what read as "the glow" was the sphere seen through an orange
      film (`0.2 × orange + 0.8 × black` = `#331500`). Alpha blending also meant
      it could only ever *darken* toward its tint, never emit light.
      Replaced with a camera-facing quad using additive blending, `depthWrite:
      false` and a radial falloff — white at the rim, easing to `#8b5cf6`. The
      opaque sphere depth-masks the middle of the quad, which is what carves
      the void out. Settles the palette question in favour of purple.

## Decided against

- [-] **Scroll-reactive camera / particles** (2026-08-08) — considered camera
      parallax, off-centre framing, scroll-velocity-driven spin. Dropped: the
      background should stay calm and the panes should carry the motion.
      Note the *non-visual* scroll idea survives as a performance task under
      Problem 3 (pause while the opaque pane covers the canvas).

---

## Open questions

- [ ] Halo tuning is guesswork until it is seen on a real screen —
      `HALO_INNER_RADIUS`, `HALO_FALLOFF`, `HALO_STRENGTH` and `HALO_SIZE` are
      module constants at the top of `BlackHoleAnimation.jsx` for exactly that
      reason. The white rim in particular may need pulling back.
- [ ] The particle trails emit non-premultiplied colour into a renderer running
      with `premultipliedAlpha: true`, so they render brighter than their alpha
      intends. Harmless-looking, but the same class of bug the halo hit. Worth
      correcting when the trails are next touched.
- [ ] Does the main page pass `createTransparentBackground`, or a third factory
      producing something subtler than flat `#040404`?
- [ ] Camera framing: the panes are left-aligned at `max-width: 520px`, leaving
      the right half empty. Should the static framing put the hole there?
