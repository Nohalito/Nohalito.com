import { useEffect, useRef, useState } from 'react'

/**
 * The bar under the header on every screen inside a topic: which topic, and
 * everything scoped to the whole of it.
 *
 * The name is editable in place when `onRename` is given. There is no topic
 * settings screen — renaming and deleting are the only two things such a screen
 * would hold, and they belong in different places: rename is a correction you
 * make while looking at the name, delete is a decision you make while looking
 * at the list of topics. Splitting them costs a screen and buys the delete a
 * distance from everything else.
 *
 * @param {object} props
 * @param {string} props.name Current topic name.
 * @param {((name: string) => void) | null} [props.onRename] Omit on the study
 *   screens, where renaming mid-session is a slip, not an intention.
 * @param {string | null} [props.meta] Right of the name — a count on the topic
 *   page.
 * @param {string | null} [props.mode] Badge for the session screens: Cards,
 *   Test, Result.
 * @param {import('react').ReactNode} [props.center] The middle slot — what the
 *   topic is *for*, as opposed to what manages it. Only the topic page has
 *   anything to put here, which is why it is optional rather than a third
 *   required region every caller has to pass nothing to.
 * @param {import('react').ReactNode} props.actions Buttons for the right-hand side.
 */
export default function TopicBar({
  name,
  onRename = null,
  meta = null,
  mode = null,
  center = null,
  actions,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function open() {
    setDraft(name)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    if (draft.trim() && draft !== name) onRename?.(draft)
  }

  /*
    A session bar and a topic bar are two different problems. The topic bar
    carries five controls and has to wrap. This one carries the name, a badge
    and one link — it fits, and it should keep fitting by trimming the one part
    that can be trimmed rather than by growing a row. `mode` is the honest test
    for which is which: it is set on exactly the screens that are a session.
  */
  return (
    <div className={mode ? 'topic-bar topic-bar--session' : 'topic-bar'}>
      <div className="topic-bar__id">
        {/* The badge beside it already says what you are looking at, and on a
            phone this label was costing more width than it explained. It stays
            where there is no badge, because there it labels a name you can
            click to edit. */}
        {!mode && <span className="topic-bar__eyebrow">Topic</span>}

        {editing ? (
          <input
            ref={inputRef}
            className="topic-bar__input"
            value={draft}
            aria-label="Topic name"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            /* Enter commits, Escape abandons. Both because this is a text field
               with no visible buttons — the keyboard is the only way out of it. */
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') setEditing(false)
            }}
          />
        ) : onRename ? (
          <button
            className="topic-bar__name topic-bar__rename"
            type="button"
            onClick={open}
            title="Rename this topic"
          >
            {name}
          </button>
        ) : (
          <span className="topic-bar__name">{name}</span>
        )}

        {meta && <span className="topic-bar__count">{meta}</span>}
        {mode && <span className="topic-bar__mode">{mode}</span>}
      </div>

      {center && <div className="topic-bar__center">{center}</div>}

      <div className="topic-bar__actions">{actions}</div>
    </div>
  )
}
