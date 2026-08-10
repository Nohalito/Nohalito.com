import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reads the OS-level "reduce motion" accessibility preference.
 *
 * CSS `@media (prefers-reduced-motion)` only reaches CSS animations and
 * transitions — it cannot stop a `requestAnimationFrame` loop or prevent a
 * WebGL canvas from mounting. Anything driven by JavaScript has to ask here.
 *
 * Subscribes to changes, so toggling the setting takes effect immediately
 * rather than only on the next full page load.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event) => setPrefersReducedMotion(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
