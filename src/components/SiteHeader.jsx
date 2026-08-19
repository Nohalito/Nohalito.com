import { useMemo } from 'react'
import { Link } from 'react-router'
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
 * @param sectionBasePath Route holding those sections, for pages that do *not*
 *   contain them. Omitted on the home page, where the sections are on the page
 *   and a bare `#about` is correct. Set to `/home` by the hosted apps, whose
 *   routes have no such anchors — the links pointed at `#about` there and went
 *   nowhere, silently, because a fragment with no matching element is not an
 *   error. It also switches the links to router `Link`s, which is what applies
 *   the `/nohalito.org` basename; a hand-written `href="/home#about"` would
 *   skip it and 404 on the deployed subpath.
 */
export default function SiteHeader({ brand, sections, sectionBasePath }) {
  /*
    The scroll-spy only has something to watch when the sections are on this
    page. Passing an empty list is what switches it off: the hook returns null
    for the active id and its observer bails on finding no elements. Anything
    else would light "About" on a route that has no About.
  */
  const spyIds = useMemo(
    () => (sectionBasePath ? [] : sections.map((section) => section.id)),
    [sections, sectionBasePath],
  )

  const activeId = useActiveSection(spyIds)
  const brandTarget = sectionBasePath ?? `#${sections[0].id}`

  return (
    <header className="site-header">
      {sectionBasePath ? (
        <Link className="site-header__brand" to={brandTarget}>
          {brand}
        </Link>
      ) : (
        <a className="site-header__brand" href={brandTarget}>
          {brand}
        </a>
      )}

      <nav className="site-header__nav" aria-label="Page sections">
        {sections.map(({ id, label }) => {
          const isActive = id === activeId
          const className = isActive ? 'navlink is-active' : 'navlink'

          /* Tells a screen reader which section is current, rather than
             leaving the state as colour-only information. */
          const current = isActive ? 'location' : undefined

          return sectionBasePath ? (
            <Link key={id} to={`${sectionBasePath}#${id}`} className={className}>
              {label}
            </Link>
          ) : (
            <a key={id} href={`#${id}`} className={className} aria-current={current}>
              {label}
            </a>
          )
        })}
      </nav>
    </header>
  )
}
