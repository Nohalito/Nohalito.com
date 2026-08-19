/**
 * What just happened, said once, where the result of it appears.
 *
 * Dismissed by hand rather than on a timer. An import reports a count — how
 * many arrived, how many were already there — and a count that vanishes after
 * four seconds is a count you either read immediately or never.
 *
 * `role="status"` rather than `alert`: a screen reader should hear it at the
 * next pause, not be interrupted with it.
 *
 * @param {object} props
 * @param {'info' | 'bad'} [props.tone]
 * @param {import('react').ReactNode} props.children
 * @param {() => void} props.onDismiss
 */
export default function Notice({ tone = 'info', children, onDismiss }) {
  return (
    <div className={tone === 'bad' ? 'notice notice--bad' : 'notice'} role="status">
      <span className="notice__text">{children}</span>
      <button className="notice__x" type="button" aria-label="Dismiss" onClick={onDismiss}>
        ✕
      </button>
    </div>
  )
}
