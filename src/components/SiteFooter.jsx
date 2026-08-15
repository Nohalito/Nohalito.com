import './SiteFooter.css'

/**
 * @param note Left-hand text, e.g. the copyright line.
 * @param links `[{ label, href, icon }]` where `icon` is one of the keys in
 *   ICONS below. Contact lives here rather than in the nav, so every header
 *   link points at a section that genuinely exists on the page.
 */
export default function SiteFooter({ note, links = [] }) {
  return (
    <footer className="site-footer">
      <p className="site-footer__note">
        © {new Date().getFullYear()} {note}
      </p>

      <ul className="site-footer__links">
        {links.map(({ label, href, icon }) => (
          <li key={label}>
            <a
              className="site-footer__link"
              href={href}
              /* Only leave the tab for genuinely external destinations. */
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {/* The icon is decorative; the accessible name comes from the label. */}
              <span className="site-footer__icon" aria-hidden="true">
                {ICONS[icon]}
              </span>
              <span className="visually-hidden">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
}

const ICONS = {
  github: (
    <svg viewBox="0 0 10 10" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.6-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.6 1 1.5 1 2.6 0 3.8-2.4 4.6-4.6 4.9.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2Z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.9 8.4H3.6V20H6.9V8.4ZM5.3 3.2A1.9 1.9 0 1 0 5.3 7 1.9 1.9 0 0 0 5.3 3.2ZM20.4 20H17.1v-6.3c0-1.5-.5-2.5-1.9-2.5-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H9.9s.1-10.6 0-11.6h3.3v1.6a3.3 3.3 0 0 1 3-1.7c2.2 0 3.9 1.5 3.9 4.5V20Z" />
    </svg>
  ),
}
