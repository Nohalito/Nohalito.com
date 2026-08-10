import './ProfilePhoto.css'

/**
 * The portrait, wrapped in its halo.
 *
 * With the animated background removed from behind the panes, this glow is the
 * only light source on the page — so it carries the focal point.
 *
 * @param src Image to display. Without one, a neutral placeholder glyph is
 *   drawn instead, so the layout is identical before and after the real
 *   photo lands.
 */
export default function ProfilePhoto({ src, alt = '' }) {
  return (
    <div className="profile-photo">
      {src ? (
        <img className="profile-photo__image" src={src} alt={alt} />
      ) : (
        <svg
          className="profile-photo__placeholder"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.8-4 4.4-6 7-6s5.2 2 7 6" />
        </svg>
      )}
    </div>
  )
}
