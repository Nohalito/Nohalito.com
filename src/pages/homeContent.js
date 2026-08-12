/**
 * All copy and data for the home page, kept out of the components that render
 * it. Editing the site's wording should never mean opening a component.
 *
 * ⚠️ Everything marked TODO is placeholder text carried over from the design
 * mockups — replace before this goes anywhere public.
 */

/**
 * Drives both the header nav and the panes themselves, so the two cannot drift
 * apart. Order here is the order on the page.
 */
import majorCoD from '../assets/major_CoD.jpg'

export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
]

export const BRAND = 'Nohalito'

export const PROFILE = {
  eyebrow: 'About me',
  name: 'Noa Boimond',
  birthDate: '2003-11-15',
  country: 'France',
  tagline: 'Currently employed as a Data Engineer intern at Equancy | Groupe EDG.',
  paragraphs: [
    'Working between the limit of a Data Engineer and Cloud Engineer, I specialize myself in the Google Cloud environment with multiple basic services deployed on it.',
    'I work with GCP, Terraform, and Python. While continuing on improving these skills, I also want to get more experience with the AWS environment and software development.',
    "Aside from this, I'm a big fan of Noita. You all should go play Noita, like, now.",
  ],
  photo: majorCoD,
}

/**
 * Three parallel tracks rather than one merged list, because they genuinely
 * overlap: the internships cut into the middle of the Magistère instead of
 * following it, so a single date-ordered list would read as one confused
 * sequence. Roles come first so they land in the left column.
 *
 * The two education columns are one story split at the point where it stops
 * being linear. Everything from 2023 on happens *inside* the Magistère and
 * concurrently with the roles on the left; everything before it is a plain
 * sequence that already finished. Splitting there keeps the middle column
 * aligned in time with the left one instead of pushing it down the page.
 *
 * An entry is one of two shapes, and the renderer tells them apart by whether
 * `entries` is present:
 *
 *   row   — { id, period, title, badge?, subtitle?, description?, tags? }
 *   group — { id, label, period, description?, entries: [row, ...] }
 *
 * The group exists for the Magistère, which is not a fourth degree sitting
 * beside the others but a programme layered on top of three of them.
 *
 * All three columns run most-recent-first. They sit side by side, so a column
 * reading upward next to one reading downward would be a visible mismatch —
 * flip all three if you ever want chronological instead.
 */
export const EXPERIENCE = {
  title: 'Experience & Education',
  columns: [
    {
      id: 'roles',
      label: 'Experience',
      entries: [
        {
          id: 'equancy',
          period: 'Apr–Oct 2026',
          title: 'Data Engineer - Intern',
          subtitle: 'Equancy | EDG Group, Paris',
          description: '- Developing and publishing a coding-interview web-application.\n- Completing the GCP Professional Data Engineer learning path.\n- Creating Agent on GCP with RAG.',
          tags: ['GCP', 'Terraform', 'GitLab', 'Full-stack', 'Agentic AI'],
        },
        {
          id: 'alfa-laval',
          period: 'Jun–Aug 2025',
          title: 'Industry 4.0 Engineer & Data Analyst - Intern',
          subtitle: 'Alfa Laval Vicarb, Fontanil',
          description: '- Flow creation to source data for reporting on Power BI.',
          tags: ['Python', 'Power Platform', 'Power BI', 'VBA'],
        },
        {
          id: 'alinea',
          period: 'May–Jul 2024',
          title: 'Data Analyst - Intern',
          subtitle: 'Alinéa, Aubagne',
          // TODO: real description — reporting, retail data.
          description: 'Placeholder description of the mission.',
          tags: ['Excel', 'SQL', 'Reporting'],
        },
      ],
    },
    {
      id: 'education-current',
      // TODO: confirm these two column labels — they are the only new copy here.
      label: 'Education',
      entries: [
        {
          id: 'magistere',
          label: 'Magistère in Economic Engineering',
          period: '2023–2026',
          description:
            'Three-year selective programme layered on top of the three degrees below, combining economics with data science and programming.',
          entries: [
            {
              id: 'm2',
              period: '2025–2026',
              title: 'Master 2, Econometrics & Data Science',
              // The two Masters are one dual degree taken a year apart, which is
              // the sort of thing a reader has to be told rather than infer.
              badge: 'Dual degree',
              subtitle: 'Aix-Marseille University, France',
              description:
                'Second year of the dual degree, back in France: advanced econometrics and machine learning methods.',
              tags: ['Machine Learning', 'Econometrics', 'Python'],
            },
            {
              id: 'm1',
              period: '2024–2025',
              title: 'Master 1, Data Analytics for Business & Society',
              badge: 'Dual degree',
              subtitle: "Ca' Foscari University of Venice, Italy",
              description:
                'First year of a dual degree abroad, focused on applying data analytics to business and policy questions.',
              tags: ['Data Analysis', 'R', 'Business Analytics'],
            },
            {
              id: 'licence',
              period: '2023–2024',
              title: "Bachelor's (Licence), MIASHS — 3rd year",
              subtitle: 'Aix-Marseille University, France',
              description:
                'Human and social sciences applied to data: statistics, econometrics and an introduction to programming.',
              tags: ['Econometrics', 'Python', 'SQL'],
            },
          ],
        },
      ],
    },
    {
      id: 'education-prior',
      label: 'Prior studies',
      // Not a third track so much as the tail of the second one. Flagged rather
      // than left to a CSS `:nth-child`, because it is a fact about the content
      // — reorder the columns and the flag still points at the right one.
      subordinate: true,
      entries: [
        {
          id: 'prepa',
          period: '2021–2023',
          title: 'Preparatory class, ENS Cachan D2 (Economics)',
          subtitle: "With a Bachelor's in Economics & Management, left before its final year.",
          description:
            'Intensive two-year track preparing the ENS/ENSAI entrance exams: economics, mathematics and quantitative methods.',
          tags: ['Economics', 'Mathematics', 'Statistics'],
        },
        {
          id: 'bac',
          period: '2021',
          title: 'Baccalauréat',
          // TODO: real description (track/specialty), or drop this line entirely.
          description: 'Placeholder description.',
        },
      ],
    },
  ],
}

export const PROJECTS = {
  title: 'Projects',
  intro: 'Things built on this site, and the reasons they exist.',
  items: [
    {
      id: 'cram-cards',
      title: 'Cram Cards',
      description: 'Placeholder description — what it does and why you built it.',
      // Internal route: rendered as a router Link, no full page reload.
      to: '/cram-cards',
    },
    {
      id: 'black-hole',
      title: 'Black Hole',
      description:
        'A Three.js accretion disc: 500 particles spiralling inward, each trailing a fading line. Also the background of this page.',
      to: '/black-hole-test',
    },
    {
      id: 'qr-code-generator',
      title: 'QR Code Generator',
      description: 'Placeholder description.',
      // No route wired up yet, so the card renders without a link rather than
      // pointing somewhere broken.
      status: 'In progress',
    },
  ],
}

export const FOOTER = {
  note: 'Noa Boimond. Tous droits réservés.',
  links: [
    { label: 'GitHub', href: 'https://github.com/Nohalito', icon: 'github' },
    { label: 'LinkedIn', href: 'www.linkedin.com/in/noa-boimond', icon: 'linkedin' },
    // { label: 'Email', href: 'mailto:you@example.com', icon: 'mail' },
  ],
}
