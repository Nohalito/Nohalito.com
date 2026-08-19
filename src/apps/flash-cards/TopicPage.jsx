import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import AppFrame from './components/AppFrame'
import ItemDetail from './components/ItemDetail'
import ItemForm from './components/ItemForm'
import ItemList from './components/ItemList'
import Notice from './components/Notice'
import TopicBar from './components/TopicBar'
import { NARROW, useMediaQuery } from './hooks/useMediaQuery'
import { useTopicRecord } from './hooks/useTopics'
import { blankDraft, draftFromItem, itemFromDraft } from './draft'
import { countOf, validateItem } from './model'
import {
  addItems,
  insertItemAt,
  removeItem,
  renameTopic,
  replaceItem,
  setShuffle,
  touchTopic,
} from './storage'
import {
  ImportError,
  downloadText,
  fileNameFor,
  parseTopicFile,
  readFileText,
  splitAgainst,
  toJson,
} from './transfer'
import './TopicPage.css'

/**
 * @typedef {import('./model').Item} Item
 * @typedef {import('./draft').Draft} Draft
 * @typedef {{ tone: 'info' | 'bad', text: string }} NoticeState
 * @typedef {{ onKeep: () => void, onDiscard: () => void }} Leaving
 */

/**
 * The topic page: a compact index on the left that never moves, and one item at
 * full size on the right.
 *
 * ---------------------------------------------------------------------------
 * What this component owns
 *
 * Selection, the filter, and the draft. The items themselves live in the
 * storage module and arrive through `useTopicRecord` — this page never holds a
 * copy of them, so an edit is one write and every reader sees it.
 *
 * The draft is the exception, and deliberately so: it is the only state here
 * that is not yet a fact. It exists from the moment the form opens until Save
 * writes it or Cancel drops it.
 *
 * ---------------------------------------------------------------------------
 * `guard`
 *
 * Every action that would replace the form — selecting another item, starting a
 * new one, importing, leaving — goes through it. With no unsaved changes it
 * runs straight through; with unsaved changes it parks the action and asks. The
 * point of routing all of them through one function is that adding a fourth way
 * to leave the form cannot forget to ask.
 */
export default function TopicPage() {
  /* The route table guarantees this segment; `useParams` cannot know that, and
     the alternative is threading `string | undefined` through every call. */
  const topicId = /** @type {string} */ (useParams().topicId)
  const topic = useTopicRecord(topicId)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const narrow = useMediaQuery(NARROW)
  const fileRef = useRef(null)

  /*
    The casts are not decoration: `useState(null)` infers the type `null`, and
    every later set then fails the checker. In a JSDoc codebase this is how a
    nullable piece of state is declared.
  */
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null))
  const [editing, setEditing] = useState(/** @type {string | null} */ (null))
  const [draft, setDraft] = useState(/** @type {Draft | null} */ (null))
  const [savedDraft, setSavedDraft] = useState(/** @type {Draft | null} */ (null))
  const [formError, setFormError] = useState(/** @type {string | null} */ (null))
  const [notice, setNotice] = useState(/** @type {NoticeState | null} */ (null))
  const [undo, setUndo] = useState(/** @type {{ item: Item, index: number } | null} */ (null))
  const [leaving, setLeaving] = useState(/** @type {Leaving | null} */ (null))
  const [pane, setPane] = useState('list') // narrow layouts only
  /* Wide layouts only — below 860px the drill-down already answers "show me one
     thing at a time", and a second control for the same idea would be two ways
     to hide the list with different ways back. Not persisted: it is a view you
     take for one item, not a preference about the topic. */
  const [listOpen, setListOpen] = useState(true)

  const items = useMemo(() => topic?.items ?? [], [topic])

  /* Ordering the list is what makes the main page's "most recent" mean
     anything, and opening is the only event that reports it. */
  useEffect(() => {
    if (topic) touchTopic(topicId)
  }, [topic?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* The score page links back to a specific item — `?item=<id>`, so the link is
     a real URL rather than router state that a reload would lose. */
  useEffect(() => {
    const wanted = searchParams.get('item')
    if (!wanted) return

    setSelectedId(wanted)
    setPane('detail')
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const visible = items.filter((item) => filter === 'all' || item.kind === filter)
  const selected = items.find((item) => item.id === selectedId) ?? visible[0] ?? null

  const cards = countOf(items, 'card')
  const questions = countOf(items, 'question')

  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(savedDraft)

  /* Undo is a promise with a deadline; without one, a stale "Undo" sits under
     the list forever offering to resurrect something you deliberately removed
     ten minutes ago. */
  useEffect(() => {
    if (!undo) return
    const timer = setTimeout(() => setUndo(null), 10000)
    return () => clearTimeout(timer)
  }, [undo])

  function closeForm() {
    setEditing(null)
    setDraft(null)
    setSavedDraft(null)
    setFormError(null)
    setLeaving(null)
  }

  function guard(action) {
    if (!dirty) {
      action()
      return
    }

    setLeaving({
      onKeep: () => setLeaving(null),
      onDiscard: () => {
        closeForm()
        action()
      },
    })
  }

  function openNew() {
    guard(() => {
      const fresh = blankDraft('card')
      setEditing('new')
      setDraft(fresh)
      setSavedDraft(fresh)
      setFormError(null)
      setPane('detail')
    })
  }

  function openEdit(item) {
    guard(() => {
      const fresh = draftFromItem(item)
      setEditing(item.id)
      setDraft(fresh)
      setSavedDraft(fresh)
      setFormError(null)
      setPane('detail')
    })
  }

  function select(id) {
    guard(() => {
      setSelectedId(id)
      setPane('detail')
    })
  }

  function save() {
    const item = itemFromDraft(draft)
    const problem = validateItem(item)

    /* Validation happens here and not on every keystroke: a card is invalid for
       the whole time you are writing it, and saying so throughout is noise. */
    if (problem) {
      setFormError(problem)
      return
    }

    if (editing === 'new') addItems(topicId, [item])
    else replaceItem(topicId, item)

    setSelectedId(item.id)
    closeForm()
  }

  function remove(item) {
    const index = items.findIndex((existing) => existing.id === item.id)

    removeItem(topicId, item.id)
    setUndo({ item, index })
    closeForm()

    const next = items[index + 1] ?? items[index - 1] ?? null
    setSelectedId(next?.id ?? null)
    if (narrow) setPane('list')
  }

  /* --- import / export --------------------------------------------------- */

  async function onFileChosen(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await readFileText(file)
      const parsed = parseTopicFile(text)
      const { fresh, duplicates } = splitAgainst(items, parsed.items)

      if (fresh.length === 0) {
        setNotice({
          tone: 'bad',
          text: `Everything in ${file.name} is already in this topic — nothing added.`,
        })
        return
      }

      addItems(topicId, fresh)
      setSelectedId(fresh[0].id)
      setFilter('all')

      const already = duplicates.length ? ` ${duplicates.length} were already here.` : ''
      setNotice({
        tone: 'info',
        text: `Added ${fresh.length} items from ${file.name} — ${countOf(fresh, 'card')} cards, ${countOf(fresh, 'question')} questions.${already} They are at the end of the list.`,
      })
    } catch (failure) {
      setNotice({
        tone: 'bad',
        text:
          failure instanceof ImportError
            ? `Nothing was imported. ${failure.message}`
            : 'Nothing was imported — that file could not be read as a topic.',
      })
    }
  }

  /* Both scopes go through one writer. A single item exports as the topic
     format holding one entry, which is what makes "export this question,
     import it into another topic" work through the same parser. */
  function exportItems(subject, name) {
    downloadText(fileNameFor(name, 'json'), toJson(name, subject), 'application/json')
  }

  if (!topic) {
    return (
      <AppFrame title="Topic not found — Flash Cards">
        <div className="fc-missing">
          <h1>No such topic</h1>
          <p>
            It was deleted, or this link came from another browser — topics live in the browser
            that made them and nowhere else.
          </p>
          <Link className="btn" to="/flash-cards">
            All topics
          </Link>
        </div>
      </AppFrame>
    )
  }

  /* Two different questions answered by two different pieces of state. Narrow:
     which of the two panes is *the* pane. Wide: whether the rail is there at
     all, with the body always present beside it. */
  const showList = narrow ? pane === 'list' : listOpen
  const showBody = !narrow || pane === 'detail'

  return (
    <AppFrame
      title={`${topic.name} — Flash Cards`}
      topicBar={
        <TopicBar
          name={topic.name}
          onRename={(name) => renameTopic(topicId, name)}
          meta={`${cards} cards · ${questions} questions`}
          center={
            <>
              {/*
                The two session starts, up from the foot of the list pane. They
                act on the whole topic, which is what this bar is for, and in the
                pane they were only reachable while the pane was — so on a phone
                showing the detail view, or behind the collapse on a wide one,
                there was no way to start a session without going back first.

                The middle slot rather than the actions group: these two are what
                the topic is *for*, and the three beside them manage the file it
                lives in. Sharing a group would have sorted them by "things that
                are buttons".

                Short labels below 860px. Not an abbreviation for its own sake —
                the bar is sticky, so every row it wraps to is a row taken off
                every screen under it for as long as you are on the page. The
                full wording stays in the `title`.
              */}
              <button
                className="btn btn--sm btn--primary"
                type="button"
                disabled={cards === 0}
                title={cards === 0 ? 'This topic has no cards yet' : 'Study the cards in this topic'}
                onClick={() => guard(() => navigate(`/flash-cards/t/${topicId}/study`))}
              >
                {narrow ? 'Study' : 'Start studying'}
              </button>

              <button
                className="btn btn--sm"
                type="button"
                disabled={questions === 0}
                title={
                  questions === 0 ? 'This topic has no questions yet' : 'Sit the test for this topic'
                }
                onClick={() => guard(() => navigate(`/flash-cards/t/${topicId}/test`))}
              >
                {narrow ? 'Test' : 'Start test'}
              </button>
            </>
          }
          actions={
            <>
              {/* One control for both cases the spec separates: a file holding
                  one question and a file holding forty are the same operation
                  on a different file. */}
              <label className="btn btn--sm btn--ghost fc-import">
                Import
                <input
                  ref={fileRef}
                  className="visually-hidden"
                  type="file"
                  accept=".json,application/json"
                  onChange={onFileChosen}
                />
              </label>

              {/* Downloads on the click. The menu it replaces existed to choose
                  between JSON and CSV; with one format the choice is the
                  button. */}
              <button
                className="btn btn--sm btn--ghost"
                type="button"
                title="Download the whole topic as JSON — it imports back in unchanged"
                onClick={() => exportItems(items, topic.name)}
              >
                Export
              </button>

              <Link className="ghost-btn" to="/flash-cards">
                All topics
              </Link>
            </>
          }
        />
      }
    >
      <div className="page">
        {showList && (
          <aside className="split__list">
            <div className="split__head">
              <div className="seg" role="group" aria-label="Filter by type">
                {FILTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={filter === id ? 'is-on' : undefined}
                    aria-pressed={filter === id}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="split__head-acts">
                <button className="btn btn--sm" type="button" onClick={openNew}>
                  + New
                </button>

                {/* Wide layouts only. It reads as part of the list's own head
                    rather than as page chrome, which is what says that the
                    thing it hides is this pane and not the topic. */}
                {!narrow && (
                  <button
                    className="split__fold"
                    type="button"
                    aria-label="Hide the item list"
                    title="Hide the item list"
                    onClick={() => setListOpen(false)}
                  >
                    ‹
                  </button>
                )}
              </div>
            </div>

            {notice && (
              <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>
                {notice.text}
              </Notice>
            )}

            <div className="split__scroll fc-scroll">
              <ItemList
                items={visible}
                selectedId={selected?.id ?? null}
                filter={filter}
                onSelect={select}
                onNew={openNew}
              />
            </div>

            {/*
              Undo rather than a confirmation. A card is a few seconds of
              typing, so a dialog every time costs more than the mistake does —
              and this restores the item to its own position, which is what
              makes it an undo rather than a re-add.
            */}
            {undo && (
              <div className="split__undo">
                <span>Deleted.</span>
                <button
                  className="btn btn--sm btn--ghost"
                  type="button"
                  onClick={() => {
                    insertItemAt(topicId, undo.item, undo.index)
                    setSelectedId(undo.item.id)
                    setUndo(null)
                  }}
                >
                  Undo
                </button>
              </div>
            )}

            {/* Shuffle belongs to the session, not to the list: studying a
                fixed order teaches the order. Remembered per topic, and not
                part of what gets exported — it is how you study this material,
                not a property of it. */}
            <label className="split__shuffle">
              <input
                type="checkbox"
                checked={topic.shuffle}
                onChange={(event) => setShuffle(topicId, event.target.checked)}
              />
              Shuffle each session
            </label>
          </aside>
        )}

        {/*
          The way back, and it replaces the pane rather than hiding it. A
          collapsed rail done in CSS leaves the filter, the list and two Start
          buttons still in the document — still tabbable, still read out, still
          able to take the focus to somewhere invisible. That is the same
          reasoning that put the narrow layout's drill-down in JavaScript
          instead of in a media query; see `useMediaQuery`.
        */}
        {!narrow && !listOpen && (
          <button
            className="split__unfold"
            type="button"
            aria-label="Show the item list"
            title="Show the item list"
            onClick={() => setListOpen(true)}
          >
            ›
          </button>
        )}

        {showBody && (
          <section className="split__body fc-scroll">
            <div className="split__body-inner">
              {narrow && (
                <button
                  className="btn btn--sm btn--ghost split__back"
                  type="button"
                  onClick={() => guard(() => setPane('list'))}
                >
                  ← All items
                </button>
              )}

              {draft ? (
                <ItemForm
                  draft={draft}
                  isNew={editing === 'new'}
                  error={formError}
                  leaving={leaving}
                  onChange={setDraft}
                  onSave={save}
                  onCancel={() => guard(closeForm)}
                />
              ) : (
                <ItemDetail
                  item={selected}
                  onExport={() => exportItems([selected], `${topic.name} — 1 item`)}
                  onEdit={() => openEdit(selected)}
                  onDelete={() => remove(selected)}
                />
              )}
            </div>
          </section>
        )}
      </div>
    </AppFrame>
  )
}

/**
 * The README lists two filters, "question or cards". All is a third, added
 * because two mutually exclusive filters and no reset leaves no way back to the
 * whole list — and the whole list is the default view.
 */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'card', label: 'Cards' },
  { id: 'question', label: 'Questions' },
]
