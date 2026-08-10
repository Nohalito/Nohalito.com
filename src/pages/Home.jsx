import BackgroundStage from '../components/BackgroundStage'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import Pane from '../components/Pane'
import AboutSection from '../components/home/AboutSection'
import ExperienceSection from '../components/home/ExperienceSection'
import ProjectsSection from '../components/home/ProjectsSection'
import { BRAND, EXPERIENCE, FOOTER, PROFILE, PROJECTS, SECTIONS } from './homeContent'
import './Home.css'

/**
 * The home page composes; it does not style or fetch.
 *
 * Three sections over one fixed background, alternating how much of that
 * background they let through:
 *
 *   About      glass  — the black hole shows through
 *   Experience solid  — eclipsed entirely
 *   Projects   glass  — and back again
 */
export default function Home() {
  return (
    <div className="home">
      <BackgroundStage />
      <SiteHeader brand={BRAND} sections={SECTIONS} />

      <main className="home__content">
        <Pane id="about" variant="glass">
          <AboutSection profile={PROFILE} />
        </Pane>

        <Pane id="experience" variant="solid">
          <ExperienceSection experience={EXPERIENCE} />
        </Pane>

        <Pane id="projects" variant="glass">
          <ProjectsSection projects={PROJECTS} />
        </Pane>
      </main>

      <SiteFooter note={FOOTER.note} links={FOOTER.links} />
    </div>
  )
}
