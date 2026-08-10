import ExperienceItem from './ExperienceItem'
import './ExperienceSection.css'

/**
 * The one opaque pane. Rendered inside a `solid` Pane, so it eclipses the
 * background animation completely for the length of the section.
 *
 * @param experience See EXPERIENCE in `src/pages/homeContent.js`.
 */
export default function ExperienceSection({ experience }) {
  const { title, intro, items } = experience

  return (
    <>
      <h2>{title}</h2>
      {intro ? <p>{intro}</p> : null}

      <ul className="experience-section__list">
        {items.map((item) => (
          <ExperienceItem
            key={item.id}
            period={item.period}
            role={item.role}
            organisation={item.organisation}
          />
        ))}
      </ul>
    </>
  )
}
