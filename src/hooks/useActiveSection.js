import { useEffect, useState } from 'react'

/**
 * Scroll-spy: reports which section currently occupies the middle of the
 * viewport, so the header nav can highlight it.
 *
 * The rootMargin squeezes the observer's viewport down to a thin band across
 * the vertical centre of the screen. A section counts as "active" only while it
 * crosses that band, which keeps exactly one link lit instead of every section
 * that happens to be partly on screen.
 *
 * @param sectionIds Element ids to watch, in document order. Pass a stable
 *   reference (module-level constant) — an inline array re-subscribes on every
 *   render.
 */
export function useActiveSection(sectionIds, { rootMargin = '-45% 0px -45% 0px' } = {}) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveId(visible[0].target.id)
      },
      { rootMargin, threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sectionIds, rootMargin])

  return activeId
}
