import { useMemo } from 'react'
import { useActiveSection } from '../hooks/useActiveSection'
import './SiteHeader.css'

/**
 * Sticky, translucent header. The background animation runs edge to edge
 * behind it rather than being letterboxed by an opaque bar.
 *
 * @param brand Wordmark text.
 * @param sections `[{ id, label }]` — the page owns this list, so the nav can
 *   never drift out of sync with the sections that actually exist. Pass a
 *   stable reference (module-level constant).
 */
export default function SiteHeader({ brand, sections }) {
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections])
  const activeId = useActiveSection(sectionIds)

  return (
    <header className="site-header">
      <a className="site-header__brand" href={`#${sectionIds[0]}`}>
        {brand}
      </a>

      <nav className="site-header__nav" aria-label="Page sections">
        {sections.map(({ id, label }) => {
          const isActive = id === activeId

          return (
            <a
              key={id}
              href={`#${id}`}
              className={isActive ? 'navlink is-active' : 'navlink'}
              /* Tells a screen reader which section is current, rather than
                 leaving the state as colour-only information. */
              aria-current={isActive ? 'location' : undefined}
            >
              {label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
