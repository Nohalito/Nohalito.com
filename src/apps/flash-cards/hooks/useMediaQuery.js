import { useEffect, useState } from 'react'

/**
 * Subscribes to a media query, the same shape as `usePrefersReducedMotion` in
 * the site's own hooks folder — including the `change` subscription, so a
 * window resized across the breakpoint takes effect immediately instead of on
 * the next mount.
 *
 * It exists because two of this app's responsive answers cannot be expressed in
 * CSS. Below 860px the topic page stops being two panes side by side and
 * becomes a drill-down: list, then detail, one at a time. That is a difference
 * in *what is rendered*, not in how it is laid out — a media query can hide the
 * list, but it cannot stop a form in the hidden pane from holding focus, and it
 * cannot make the back button exist.
 *
 * Everything that is only a layout difference stays in CSS, where it belongs.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)

    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** The topic page's two-panes-or-one boundary, and the study view's. */
export const NARROW = '(max-width: 860px)'
