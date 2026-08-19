import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Publishes the real height of the sticky top block as `--fc-top-h` on the app
 * root, so each screen can size itself to end exactly at the fold and leave the
 * footer starting one pixel below it — which is the README's "scrolling down
 * reveals the footer", implemented rather than approximated.
 *
 * It is measured rather than declared. The header's height is a `rem` padding
 * plus a serif line box plus a border, and the topic bar adds a second row; all
 * of those move with the type scale, the viewport width (the header becomes a
 * column at 560px) and the user's own font-size setting. A stylesheet cannot
 * add them up in advance, and the mockup's attempt to — a hard-coded 72px —
 * was a few pixels out, which is visible as a gap.
 *
 * `ResizeObserver` rather than a `resize` listener: it also catches the late
 * arrival of a webfont and the nav wrapping onto a second line, neither of
 * which fires a window resize.
 *
 * Returns two refs. Attach `rootRef` to the element that owns the custom
 * property and `topRef` to the sticky block being measured — they are separate
 * elements because a custom property inherits downwards, and the block cannot
 * publish a value its own siblings need to read.
 */
export function useStickyTopHeight() {
  const [root, setRoot] = useState(/** @type {HTMLDivElement | null} */ (null))
  const topRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  /* A callback ref, not a plain one: the root element has to be *known* before
     the observer can write to it, and a ref object's mutation triggers nothing. */
  const rootRef = useCallback((node) => setRoot(node), [])

  useEffect(() => {
    const top = topRef.current
    if (!root || !top) return

    const publish = () => {
      root.style.setProperty('--fc-top-h', `${top.getBoundingClientRect().height}px`)
    }

    publish()

    const observer = new ResizeObserver(publish)
    observer.observe(top)
    return () => observer.disconnect()
  }, [root])

  return { rootRef, topRef }
}
