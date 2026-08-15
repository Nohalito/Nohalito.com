import ProfilePhoto from '../ProfilePhoto'
import { calculateAge } from '../../utils/calculateAge'
import './AboutSection.css'

/**
 * Opening pane: portrait, name, tagline, introduction.
 *
 * @param profile See PROFILE in `src/pages/homeContent.js`.
 */
export default function AboutSection({ profile }) {
  const { eyebrow, name, tagline, paragraphs, photo, birthYear, country} = profile

  return (
    <>
      <ProfilePhoto src={photo} alt={name} />

      <p className="eyebrow">{eyebrow}</p>
      <h1 className="about__name">{name}</h1>
      <p className="about__meta">
        {country} · {calculateAge(birthYear)}
      </p>
      <p className="tagline">{tagline}</p>

      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  )
}
