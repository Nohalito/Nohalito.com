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

export const EXPERIENCE = {
  title: 'Experience',
  // TODO: replace with a real lead-in, or set to null to omit it.
  intro: 'Placeholder introduction to the roles below.',
  // TODO: replace with real roles.
  items: [
    {
      id: 'role-1',
      period: '20XX — 20XX',
      role: 'Role placeholder',
      organisation: 'Company placeholder',
    },
    {
      id: 'role-2',
      period: '20XX — 20XX',
      role: 'Role placeholder',
      organisation: 'Company placeholder',
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
