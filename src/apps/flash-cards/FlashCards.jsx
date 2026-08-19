import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AppFrame from './components/AppFrame'
import ConfirmDialog from './components/ConfirmDialog'
import Notice from './components/Notice'
import { useTopicIndex } from './hooks/useTopics'
import { addItems, createTopic, deleteTopic } from './storage'
import { ImportError, parseTopicFile, readFileText } from './transfer'
import './FlashCards.css'

/**
 * The main app page: your topics on the left, the two ways to start one on the
 * right. It is the same split as the topic page, rehearsed — landing on it
 * teaches the shape you are about to work in.
 *
 * Both routes into a topic are one step and both end in a named topic — there
 * is no unnamed state to pass through. Creating asks for the name here, in the
 * panel, rather than in a dialog: a modal to collect one short string is a
 * screen in front of the work, whereas a field sitting beside "Import a topic"
 * reads as the other half of the same choice. "Import a topic" is a `<label>`
 * over a hidden file input, so the click reaches the OS file dialog directly;
 * there is no in-page drop zone, because a panel whose only content is "now
 * choose a file" is a stall in the middle of pick-parse-open. Drag-and-drop
 * can be added later as an *extra*: a drop handler needs no visible target.
 */
export default function FlashCards() {
  const topics = useTopicIndex()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const nameRef = useRef(/** @type {HTMLInputElement | null} */ (null))

  /* `useState(null)` alone infers the type `null`, so every later set is an
     error under `checkJs`. The cast is how a JSDoc codebase says "nullable". */
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [newName, setNewName] = useState('')
  const [pendingDelete, setPendingDelete] = useState(
    /** @type {import('./storage').TopicEntry | null} */ (null),
  )

  function openTopic(id) {
    navigate(`/flash-cards/t/${id}`)
  }

  /**
   * A `<form>` rather than a click handler, so Enter in the field submits
   * without a keydown listener of our own — and so the browser's own "this
   * field is required" plumbing is available if it is ever wanted.
   */
  function createNamedTopic(event) {
    event.preventDefault()

    const name = newName.trim()
    if (!name) return

    setNewName('')
    openTopic(createTopic(name).id)
  }

  /* The list's own create affordance points at the field instead of duplicating
     it. Two name inputs on one page would be two things to look at and one
     question about which of them is the real one. */
  function focusNameField() {
    nameRef.current?.focus()
  }

  async function onFileChosen(event) {
    const file = event.target.files?.[0]

    /* Reset first: choosing the same file twice in a row fires no `change`
       event otherwise, which reads as the import silently failing. */
    event.target.value = ''
    if (!file) return

    try {
      const text = await readFileText(file)
      const parsed = parseTopicFile(text)

      /* The envelope names the topic; a bare array of items has no name to
         give, so the file does. Either way it is editable the moment the topic
         opens. The last fallback is not decoration — this is the one path where
         the name comes from a file rather than a person, and `createTopic` has
         nothing to offer a file called ".json". */
      const name = parsed.name || file.name.replace(/\.[^.]+$/, '').trim() || 'Imported topic'
      const topic = createTopic(name)
      addItems(topic.id, parsed.items)

      setError(null)
      openTopic(topic.id)
    } catch (failure) {
      setError(
        failure instanceof ImportError
          ? failure.message
          : 'That file could not be read as a topic.',
      )
    }
  }

  return (
    <AppFrame title="Flash Cards — Nohalito">
      <div className="entry">
        <div className="entry__brand">
          <h1>Flash Cards</h1>
          <p>
            Write a topic once, then study it as cards or sit the test. Everything sit in your
            browser.
          </p>
        </div>

        <div className="entry__split">
          <div className="entry__col">
            <h2 className="sect__title">Your topics</h2>

            {topics.length === 0 ? (
              <div className="empty">
                <p>No topics yet — create one, or import a file.</p>
              </div>
            ) : (
              topics.map((topic) => {
                /* Empty until the topic has been opened once. An empty span is
                   still a flex item and still takes its share of the gap, so it
                   is left out rather than rendered blank. */
                const when = whenText(topic.openedAt)

                return (
                  <div className="tag-row" key={topic.id}>
                    <Link className="tag-row__open" to={`/flash-cards/t/${topic.id}`}>
                      <span className="tag-row__name">{topic.name}</span>

                      {/* The counts and the last-opened time are one line, not
                          two columns. Held apart they compete with the name for
                          a width none of the three can give up, and the name is
                          the one you are reading — it loses that argument first
                          and ellipsises to nothing on a phone. */}
                      <span className="tag-row__sub">
                        <span className="tag-row__meta">
                          {topic.cards} cards · {topic.questions} questions
                        </span>
                        {when && <span className="tag-row__when">{when}</span>}
                      </span>
                    </Link>

                    {/*
                      Deleting a topic lives here rather than on the topic bar: on
                      the bar it would sit inches from the per-item Delete, and the
                      two are wildly different sizes of mistake.
                    */}
                    <button
                      className="tag-row__del"
                      type="button"
                      aria-label={`Delete ${topic.name}`}
                      title="Delete this topic"
                      onClick={() => setPendingDelete(topic)}
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}

            <button className="tag-row tag-row--new" type="button" onClick={focusNameField}>
              <span className="tag-row__name">+ Create a topic</span>
            </button>
          </div>

          <div className="entry__col">
            <h2 className="sect__title">Start a new topic</h2>

            <div className="createbox">
              {error && (
                <Notice tone="bad" onDismiss={() => setError(null)}>
                  {error}
                </Notice>
              )}

              <div className="createbox__opts">
                <label className="opt">
                  <b>Import a topic</b>
                  <span>
                    Pick a JSON export. It is parsed into cards and questions, then opens as a
                    topic.
                  </span>
                  <input
                    ref={fileRef}
                    className="visually-hidden"
                    type="file"
                    accept=".json,application/json"
                    onChange={onFileChosen}
                  />
                </label>

                {/* The label points at the field rather than wrapping it: the
                    description sits between the two, and a <label> spanning a
                    paragraph makes that paragraph part of the click target. */}
                <form className="opt opt--form" onSubmit={createNamedTopic}>
                  <label className="opt__label" htmlFor="new-topic-name">
                    Create a topic
                  </label>
                  <span>Name it, then write the cards and questions yourself.</span>

                  <div className="opt__row">
                    <input
                      ref={nameRef}
                      className="inp"
                      id="new-topic-name"
                      type="text"
                      value={newName}
                      placeholder="Topic name"
                      autoComplete="off"
                      onChange={(event) => setNewName(event.target.value)}
                    />

                    {/* Disabled on a blank field rather than validated on
                        submit: the rule is one word long, so showing it as a
                        state costs nothing and saves an error message. */}
                    <button
                      className="btn btn--sm btn--primary"
                      type="submit"
                      disabled={!newName.trim()}
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Reads better here than inside an import panel: it is visible
                  before you commit to a file rather than after. */}
              <p className="createbox__note">
                Nothing is uploaded — files read are parsed in this browser.
              </p>
            </div>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this topic?"
          body={`“${pendingDelete.name}” and its ${pendingDelete.cards + pendingDelete.questions} items will be removed from this browser. This cannot be undone.`}
          confirmLabel="Delete topic"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteTopic(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      )}
    </AppFrame>
  )
}

/**
 * "2 days ago", from the browser's own relative formatter rather than a date
 * library — the whole need is one string, and `Intl` has shipped it since 2020.
 */
const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
const STEPS = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

function whenText(timestamp) {
  if (!timestamp) return ''

  const elapsed = Date.now() - timestamp

  for (const [unit, size] of STEPS) {
    if (elapsed >= size) return RELATIVE.format(-Math.floor(elapsed / size), unit)
  }

  return 'just now'
}
