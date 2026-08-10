import { useReveal } from '../hooks/useReveal'
import './Reveal.css'

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * @param as Element to render. Defaults to a div; pass 'article', 'li', etc.
 *   when the surrounding markup needs a more specific tag.
 */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, isVisible] = useReveal()

  return (
    <Tag
      ref={ref}
      className={['reveal', isVisible && 'is-visible', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
