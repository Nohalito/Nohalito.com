import { Link } from 'react-router'
import './ProjectCard.css'

/**
 * A project. Renders as one of three things depending on where it points:
 *
 *   - `to`     → a router Link (in-app navigation, no full reload)
 *   - `href`   → a normal anchor, opened in a new tab
 *   - neither  → a plain, unclickable card
 *
 * The last case is deliberate: an unfinished project still belongs on the page,
 * but a card that looks clickable and goes nowhere is worse than no link.
 */
export default function ProjectCard({ title, description, to, href, status }) {
  const content = (
    <>
      <h3 className="project-card__title">{title}</h3>
      {status ? <span className="project-card__status">{status}</span> : null}
      <p className="project-card__description">{description}</p>
    </>
  )

  if (to) {
    return (
      <li className="project-card project-card--link">
        <Link className="project-card__anchor" to={to}>
          {content}
        </Link>
      </li>
    )
  }

  if (href) {
    return (
      <li className="project-card project-card--link">
        <a className="project-card__anchor" href={href} target="_blank" rel="noreferrer">
          {content}
        </a>
      </li>
    )
  }

  return <li className="project-card">{content}</li>
}
