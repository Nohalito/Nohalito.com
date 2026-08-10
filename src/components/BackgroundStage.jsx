import { lazy, Suspense } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { createTransparentBackground } from './blackHoleBackgrounds'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './BackgroundStage.css'

// Three.js is ~600 kB. Loading it lazily keeps it out of the initial bundle, so
// the page paints before the animation is even fetched — and visitors whose
// device cannot run it never pay for the download on the critical path.
const BlackHoleAnimation = lazy(() => import('./BlackHoleAnimation'))

/**
 * The fixed layer behind the whole page.
 *
 * Layered, deliberately, so the page degrades in one direction only:
 *
 *   1. A CSS gradient still — always painted, cannot fail, needs no JS.
 *   2. The WebGL animation on top of it, mounted only when it is both wanted
 *      and possible.
 *
 * There is no "if it breaks, show the fallback" branch to get wrong: the
 * fallback is simply what remains visible when layer 2 does not arrive, whether
 * that is because of reduced-motion, a chunk that failed to load, or a WebGL
 * context that was refused.
 */
export default function BackgroundStage() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    // Purely decorative: hidden from assistive tech, and never intercepts a
    // click meant for the content sitting above it.
    <div className="background-stage" aria-hidden="true">
      <div className="background-stage__still" />

      {!prefersReducedMotion && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <div className="background-stage__canvas">
              {/* Module-level factory: a stable reference, so the scene is
                  built once rather than torn down on every render. */}
              <BlackHoleAnimation background={createTransparentBackground} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}
