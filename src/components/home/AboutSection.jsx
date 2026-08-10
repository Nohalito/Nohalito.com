import ProfilePhoto from '../ProfilePhoto'
import { calculateAge } from '../../utils/calculateAge'
import './AboutSection.css'

/**
 * Opening pane: portrait, name, tagline, introduction.
 *
 * @param profile See PROFILE in `src/pages/homeContent.js`.
 */
export default function AboutSection({ profile }) {
  const { eyebrow, name, tagline, paragraphs, photo, birthDate, country} = profile

  return (
    <>
      <ProfilePhoto src={photo} alt={name} />

      <p className="eyebrow">{eyebrow}</p>
      <h1 className="about__name">{name}</h1>
      <p className="about__meta">
        {country} · {calculateAge(birthDate)}
      </p>
      <p className="tagline">{tagline}</p>

      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {/* Decorative nudge that the page continues below the fold.
      <span className="scroll-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14m0 0-6-6m6 6 6-6" />
        </svg>
        scroll
      </span> */}
    </>
  )
}
