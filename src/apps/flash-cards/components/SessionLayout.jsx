import { titleOf } from '../model'
import './SessionLayout.css'

/**
 * The stage every study screen renders inside: progress on the left, the work
 * on the right.
 *
 * The panel is the same component on all three screens, which is why the score
 * page can list the questions with their verdicts without a second one. What
 * differs is the state of each row, and that is a prop.
 *
 * @param {object} props
 * @param {{ item: import('../model').Item, done: boolean, right: boolean,
 *   wrong: boolean }[]} props.entries In session order.
 * @param {number} props.currentIndex -1 on the score screen, where nothing is
 *   in progress.
 * @param {((index: number) => void) | null} [props.onJump] Omit to make the
 *   rows inert — the score screen's list is a record, not a control.
 * @param {boolean} [props.centred] Centres the stage on its own content, for
 *   the score screen.
 * @param {import('react').ReactNode} props.children
 */
export default function SessionLayout({
  entries,
  currentIndex,
  onJump = null,
  centred = false,
  children,
}) {
  const done = entries.filter((entry) => entry.done).length
  const progress = entries.length ? (done / entries.length) * 100 : 0

  return (
    <div className="stage">
      <aside className="side">
        <div className="side__head">
          <h2 className="side__title">Progress</h2>
          <div
            className="meter"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={entries.length}
            aria-label="Session progress"
          >
            <div className="meter__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ul className="side__list fc-scroll">
          {entries.map((entry, index) => {
            const className = [
              'side__row',
              index === currentIndex ? 'is-current' : '',
              entry.done ? 'is-done' : '',
              entry.right ? 'is-right' : '',
              entry.wrong ? 'is-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <li key={entry.item.id}>
                <button
                  className={className}
                  type="button"
                  disabled={!onJump}
                  aria-current={index === currentIndex ? 'true' : undefined}
                  onClick={() => onJump?.(index)}
                >
                  <span className="side__num">{index + 1}</span>
                  <span className="side__label">{titleOf(entry.item)}</span>
                  {/* The glyph says which verdict; the colour only makes it
                      quicker to find. Both are needed — see the palette note. */}
                  <span className="side__mark" aria-hidden="true">
                    {entry.wrong ? '✕' : '✓'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div className={centred ? 'main main--centred fc-scroll' : 'main fc-scroll'}>{children}</div>
    </div>
  )
}
