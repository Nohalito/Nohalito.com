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
 *
 * `headingLevel` exists because the same row renders at two different depths.
 * Directly under a column it sits below that column's `h3`, so it is an `h4`;
 * inside an ExperienceGroup it sits below the group's own `h4`, so it must drop
 * to `h5` or the outline skips a rank. The level is the caller's to know — the
 * row cannot see how deeply it was nested.
 *
 * @param headingLevel 4 under a column, 5 inside a group. Written as a ternary
 *   over two literals rather than `` `h${n}` `` so the value stays a union of
 *   known tag names: a plain template string widens to `string`, which is not a
 *   valid JSX element type and fails the `checkJs` pass in jsconfig.json.
 */
export default function ExperienceItem({
  period,
  title,
  badge,
  subtitle,
  description,
  tags,
  headingLevel = 4,
}) {
  const Heading = headingLevel === 5 ? 'h5' : 'h4'

  return (
    <li className="experience-item">
      <span className="experience-item__period">{period}</span>

      <div className="experience-item__body">
        <Heading className="experience-item__title">
          {title}
          {badge ? <span className="experience-item__badge">{badge}</span> : null}
        </Heading>
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
