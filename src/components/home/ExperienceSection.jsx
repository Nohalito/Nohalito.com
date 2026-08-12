import ExperienceItem from './ExperienceItem'
import ExperienceGroup from './ExperienceGroup'
import './ExperienceSection.css'

/**
 * The one opaque pane. Rendered inside a `solid` Pane, so it eclipses the
 * background animation completely for the length of the section.
 *
 * Independent timelines side by side — roles on the left, education split
 * across the columns to its right — not one merged list. The count is not
 * fixed here: the section renders whatever `columns` holds, so rebalancing the
 * tracks is a data edit. See EXPERIENCE in `src/pages/homeContent.js` for why
 * they are kept apart, and for the shape of an entry.
 *
 * @param experience See EXPERIENCE in `src/pages/homeContent.js`.
 */
export default function ExperienceSection({ experience }) {
  const { title, columns } = experience

  return (
    <>
      {/*
        Hidden rather than deleted. The columns carry their own headings now, so
        a visible section title would be a fourth heading stacked above three.
        But the pane is a landmark, and deleting the `h2` would leave it with no
        accessible name and drop three `h3`s under nothing — the outline breaks
        even though the page looks right.
      */}
      <h2 className="visually-hidden">{title}</h2>

      <div className="experience-section__columns">
        {columns.map((column) => (
          <section
            key={column.id}
            className={
              column.subordinate
                ? 'experience-section__column experience-section__column--sub'
                : 'experience-section__column'
            }
          >
            <h3 className="experience-section__column-title">{column.label}</h3>

            <ul className="experience-section__list">
              {column.entries.map((entry) =>
                // Nested `entries` is what marks a group — a programme that
                // brackets several degrees rather than being one itself.
                entry.entries ? (
                  <ExperienceGroup
                    key={entry.id}
                    label={entry.label}
                    period={entry.period}
                    description={entry.description}
                    entries={entry.entries}
                  />
                ) : (
                  <ExperienceItem
                    key={entry.id}
                    period={entry.period}
                    title={entry.title}
                    badge={entry.badge}
                    subtitle={entry.subtitle}
                    description={entry.description}
                    tags={entry.tags}
                  />
                ),
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
