import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Fades content in the first time it scrolls into view, then stops observing.
 *
 * Returns `[ref, isVisible]` — attach the ref to the element that should
 * animate. The reveal is skipped entirely (content shown immediately) when the
 * visitor has asked for reduced motion, or when `IntersectionObserver` is
 * missing, so the content is never trapped behind an effect that cannot run.
 */
export function useReveal({ threshold = 0.2, rootMargin = '0px 0px -10% 0px' } = {}) {
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
