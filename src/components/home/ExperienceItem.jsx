import './ExperienceItem.css'

/**
 * One role. The date column is the only purple element in this pane, which is
 * what makes the timeline scannable at a glance.
 */
export default function ExperienceItem({ period, role, organisation }) {
  return (
    <li className="experience-item">
      <span className="experience-item__period">{period}</span>
      <span className="experience-item__role">
        {role}
        {organisation ? `, ${organisation}` : null}
      </span>
    </li>
  )
}
