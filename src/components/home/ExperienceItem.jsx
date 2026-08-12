import './ExperienceItem.css'

/**
 * One entry — a role or a degree. The date column is the only purple element
 * in this pane, which is what makes both timelines scannable at a glance.
 *
 * `subtitle` carries the organisation (employer or institution). The mockup ran
 * it into the title behind an em dash; on its own muted line the eye lands on
 * the role first, which matters more once the column is only half as wide.
 *
 * `badge` marks an entry as belonging to something the list cannot show: the two
 * Masters are one dual degree, which no amount of adjacency conveys once they
 * are two rows a year apart. It sits *inside* the heading rather than beside it
 * so the qualifier is part of the entry's accessible name — read on its own,
 * "Master 1, Data Analytics" would otherwise lose the fact entirely.
 *
 * The sub-title and description are `div`s rather than `p`s on purpose: Home.css
 * styles `.home p` at (0,1,1) specificity, which would quietly outrank any
 * single-class rule here and drag both back to body size and spacing.
 */
export default function ExperienceItem({ period, title, badge, subtitle, description, tags }) {
  return (
    <li className="experience-item">
      <span className="experience-item__period">{period}</span>

      <div className="experience-item__body">
        <h4 className="experience-item__title">
          {title}
          {badge ? <span className="experience-item__badge">{badge}</span> : null}
        </h4>
        {subtitle ? <div className="experience-item__subtitle">{subtitle}</div> : null}
        {description ? <div className="experience-item__description">{description}</div> : null}

        {tags?.length ? (
          <ul className="experience-item__tags">
            {tags.map((tag) => (
              <li key={tag} className="experience-item__tag">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}
