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
import majorCoD from '../assets/major_CoD.webp'

export const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
]

export const BRAND = 'Nohalito'

export const PROFILE = {
  eyebrow: 'About me',
  name: 'Noa Boimond',
  birthYear: 2004,
  country: 'France',
  tagline: 'Currently employed as a Data Engineer intern at Equancy | EDG.',
  paragraphs: [
    'Working between the limit of a Data Engineer and Cloud Engineer, I specialize myself in the Google Cloud environment with multiple basic services deployed on it.',
    'I work with GCP, Terraform, and Python. While continuing on improving these skills, I also want to get more experience with the AWS environment and software development.',
    "Aside from this, I'm a big fan of Noita. You all should go play Noita, like, now.",
  ],
  photo: majorCoD,
}

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
          description: '- Application design with Power Platform. \n - Computer vision with python. \n - Power BI dashboard creation.',
          tags: ['Python', 'Power Platform', 'Power BI', 'VBA'],
        },
        {
          id: 'alinea',
          period: 'May–Jul 2024',
          title: 'Data Analyst - Intern',
          subtitle: 'Alinéa, Aubagne',
          description: '- SQL query engineering.',
          tags: ['BigQuery', 'SQL', 'Looker Studio'],
        },
      ],
    },
    {
      id: 'education-current',
      label: 'Education',
      entries: [
        {
          id: 'magistere',
          label: 'Magistère in Economic Engineering',
          period: '2023–2026',
          description:
            'Three-year selective programme layered on top of the three degrees below, combining big data with data science and AI.',
          entries: [
            {
              id: 'm2',
              period: '2025–2026',
              title: 'Master 2, Econometrics & Data Science',
              badge: 'Dual degree',
              subtitle: 'Aix-Marseille University, France',
              description:
                'Second year of the dual degree, back in France: advanced machine learnings and econometrics methods.',
              tags: ['Deep Learning', 'Interpretability in ML','Advanced Econometrics'],
            },
            {
              id: 'm1',
              period: '2024–2025',
              title: 'Master 1, Data Analytics for Business & Society',
              badge: 'Dual degree',
              subtitle: "Ca' Foscari University of Venice, Italy",
              description:
                'First year of a dual degree abroad, focused on applying data analytics with a specialization around AI, NLP and transformers.',
              tags: ['Machine Learning', 'AI', 'Deep Learning','RGPD'],
            },
            {
              id: 'licence',
              period: '2023–2024',
              title: "Bachelor's (Licence), MIASHS - 3rd year",
              subtitle: 'Aix-Marseille University, France',
              description:
                'Mathematics & Informatics applied to Human and social sciences: statistics, econometrics and an introduction to programming.',
              tags: ['Python', 'SQL', 'Java', 'Econometrics'],
            },
          ],
        },
      ],
    },
    {
      id: 'education-prior',
      label: 'Prior studies',
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
          description: 'Mathematics and Economics science.',
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
        'A Three.js accretion disc: 150 particles spiralling inward, each trailing a fading line. Also the background of this page.',
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
  note: 'Noa Boimond. All rights reserved.',
  links: [
    { label: 'GitHub', href: 'https://github.com/Nohalito', icon: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/noa-boimond/', icon: 'linkedin' },
    // { label: 'Email', href: 'mailto:you@example.com', icon: 'mail' },
  ],
}
