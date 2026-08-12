import ExperienceItem from './ExperienceItem'
import './ExperienceGroup.css'

/**
 * A programme that contains several entries — the Magistère, which runs
 * alongside three separate degrees rather than replacing them.
 *
 * The purple rule down the left is doing the structural work here: it is what
 * says "these three happened *inside* this one", which a heading on its own
 * would not, and which the indent alone is too subtle to carry in a narrow
 * column. The nested `<ul>` says the same thing to a screen reader.
 */
export default function ExperienceGroup({ label, period, description, entries }) {
  return (
    <li className="experience-group">
      <div className="experience-group__label">
        {label}
        {period ? ` — ${period}` : null}
      </div>
      {description ? <div className="experience-group__description">{description}</div> : null}

      <ul className="experience-group__list">
        {entries.map((entry) => (
          <ExperienceItem
            key={entry.id}
            period={entry.period}
            title={entry.title}
            badge={entry.badge}
            subtitle={entry.subtitle}
            description={entry.description}
            tags={entry.tags}
          />
        ))}
      </ul>
    </li>
  )
}
