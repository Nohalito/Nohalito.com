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
 *
 * The `<title>` below is not misplaced. React 19 hoists `<title>` and `<meta>`
 * rendered anywhere in the tree into `<head>` itself, which is why this project
 * needs no `react-helmet`. For a title specifically React inserts *before* any
 * existing `head > title` rather than after — and since the browser reads the
 * first one in tree order, the route's title wins while index.html's stays a
 * real fallback for the moment before hydration, and for anything that does not
 * run JS. Unmounting removes it and the fallback surfaces again.
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
