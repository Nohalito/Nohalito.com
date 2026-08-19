import SiteHeader from '../../../components/SiteHeader'
import SiteFooter from '../../../components/SiteFooter'
import { BRAND, FOOTER, SECTIONS } from '../../../pages/homeContent'
import { useStickyTopHeight } from '../hooks/useStickyTopHeight'
import { useStorageHealthy } from '../hooks/useTopics'
import './AppFrame.css'

/**
 * The shell every screen in the app renders inside: background, the sticky top
 * block, the page, the footer.
 *
 * The site's own header and footer components are reused rather than ported.
 * They style themselves from tokens they inherit from whichever page root they
 * are inside, so declaring the same token names on `.flash-cards` (AppFrame.css)
 * is the whole of what it takes — and it means a change to the wordmark or the
 * footer links reaches this app without anyone remembering it exists.
 *
 * `sectionBasePath` is what makes the nav work here: its links point at
 * sections that live on the home page, and from this route a bare `#about`
 * resolves to nothing at all.
 *
 * @param {object} props
 * @param {string} props.title Document title. React 19 hoists `<title>` into
 *   `<head>` from anywhere in the tree, so each route sets its own without a
 *   helmet library.
 * @param {import('react').ReactNode} [props.topicBar] Rendered inside the sticky block, under the
 *   header. Omitted on the main page, which has no topic to name.
 * @param {import('react').ReactNode} props.children
 */
export default function AppFrame({ title, topicBar = null, children }) {
  const { rootRef, topRef } = useStickyTopHeight()
  const storageHealthy = useStorageHealthy()

  return (
    <div className="flash-cards" ref={rootRef}>
      <title>{title}</title>

      <div className="fc-bg" aria-hidden="true" />

      <div className="fc-top" ref={topRef}>
        <SiteHeader brand={BRAND} sections={SECTIONS} sectionBasePath="/home" />
        {topicBar}

        {/*
          A banner rather than a dialog, and it never leaves once shown. The
          failure it reports — quota exhausted, storage blocked, private mode —
          does not resolve itself, and interrupting someone mid-sentence to say
          so would cost them the sentence.
        */}
        {!storageHealthy && (
          <p className="fc-storage" role="status">
            Changes are not being saved.{' '}
            <span>
              This browser refused to write to its local storage — the app still works, but
              everything is lost when the tab closes. Export anything you want to keep.
            </span>
          </p>
        )}
      </div>

      <main className="fc-main">{children}</main>

      <SiteFooter note={FOOTER.note} links={FOOTER.links} />
    </div>
  )
}
