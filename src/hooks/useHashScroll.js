import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Scrolls to the element named by the URL fragment after a client-side
 * navigation.
 *
 * The browser does this by itself on a real page load, and only then. A router
 * navigation to `/home#about` never touches the document's loading path, so the
 * fragment sits in the URL and nothing moves — which is exactly what happened
 * when the hosted apps started linking back to the home page's sections.
 *
 * Landing on `/home` with no fragment must not scroll: the effect returns
 * early rather than resetting to the top, so a plain visit and a browser
 * back-navigation both keep whatever scroll position they arrived with.
 *
 * `scrollIntoView` rather than `scrollTo`, because the panes already declare a
 * `scroll-margin-top` for the sticky header — honouring it is free here and
 * would be a second copy of `--header-h` anywhere else.
 */
export function useHashScroll() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return

    const target = document.getElementById(hash.slice(1))
    if (!target) return

    /*
      One frame's delay: on a fresh navigation this runs before the panes have
      been laid out, and scrolling to an element whose height is still zero
      lands in the wrong place.
    */
    const frame = requestAnimationFrame(() => target.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])
}
