import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Fades content in the first time it scrolls into view, then stops observing.
 *
 * Returns `[ref, isVisible]` — attach the ref to the element that should
 * animate. The reveal is skipped entirely (content shown immediately) when the
 * visitor has asked for reduced motion, or when `IntersectionObserver` is
 * missing, so the content is never trapped behind an effect that cannot run.
 *
 * `threshold: 0` guards the same failure from the other side, and is not a
 * tuning choice — do not raise it for a later, softer feel. A *ratio* threshold
 * is unsatisfiable for any element taller than `root / threshold`, because the
 * observer can never hold enough of it on screen at once. The `rootMargin`
 * below shrinks the root to 0.9 of the viewport, so 0.2 would demand every
 * revealed element fit within 4.5 screens; the Experience pane stacks its three
 * columns into one below 1080px and its date gutters below 480px, so on a phone
 * it does not. The callback would simply never fire and the whole section would
 * sit at `opacity: 0` forever, with no error and nothing in the console.
 *
 * Firing on first contact is also what "scrolls into view" means. The delay
 * before the fade starts is `rootMargin`'s job, not the threshold's.
 */
export function useReveal({ threshold = 0, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [prefersReducedMotion, threshold, rootMargin])

  return [ref, isVisible]
}
