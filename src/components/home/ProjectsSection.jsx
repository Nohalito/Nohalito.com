import ProjectCard from './ProjectCard'
import './ProjectsSection.css'

/**
 * Closing pane. Glass again, so the background returns after the opaque
 * Experience section — the third beat of the reveal → conceal → reveal rhythm.
 *
 * @param projects See PROJECTS in `src/pages/homeContent.js`.
 */
export default function ProjectsSection({ projects }) {
  const { title, intro, items } = projects

  return (
    <>
      <h2>{title}</h2>
      {intro ? <p>{intro}</p> : null}

      <ul className="projects-section__grid">
        {items.map((item) => (
          <ProjectCard
            key={item.id}
            title={item.title}
            description={item.description}
            to={item.to}
            href={item.href}
            status={item.status}
          />
        ))}
      </ul>
    </>
  )
}
