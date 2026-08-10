import Reveal from './Reveal'
import './Pane.css'

/**
 * One full-height section of the page.
 *
 * The `variant` decides how the section relates to the background behind it,
 * which is the whole rhythm of the page:
 *
 *   - `glass` — translucent, blurred: the black hole shows through.
 *   - `solid` — opaque: the black hole is eclipsed completely.
 *
 * Alternating the two gives the scroll a beat (reveal → conceal → reveal)
 * instead of a single uninterrupted wash of animation.
 */
export default function Pane({ id, variant = 'glass', children }) {
  return (
    <section id={id} className={`pane pane--${variant}`}>
      <Reveal className="pane__inner">{children}</Reveal>
    </section>
  )
}
