import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import AppFrame from './components/AppFrame'
import EmptySession from './components/EmptySession'
import SessionLayout from './components/SessionLayout'
import TopicBar from './components/TopicBar'
import { useSession, useSessionKeys } from './hooks/useSession'
import { useTopicRecord } from './hooks/useTopics'
import { titleOf } from './model'
import './StudyPage.css'

/**
 * The card session: one card at a time, turned front to back.
 *
 * ---------------------------------------------------------------------------
 * Why the card gets hit/miss
 *
 * A question scores itself. A card, as specified, has no notion of right or
 * wrong — so without these two buttons the completion screen can only report
 * coverage ("you saw 24 of 24"), which is not a score, and "retry the ones you
 * missed" cannot exist at all. Marking is what makes a card session a session
 * rather than a slideshow.
 *
 * An unmarked card counts as missed. Not as a punishment — it is the only
 * reading that keeps the denominator honest: skipping is not knowing.
 *
 * ---------------------------------------------------------------------------
 * Nothing is persisted
 *
 * Leaving the page abandons the run. Resuming would need a "resume or start
 * over?" screen on the way in, and with a verdict per card to keep, not just a
 * position — a whole screen and a storage shape, to save a session that takes
 * two minutes to redo.
 */
export default function StudyPage() {
  /* The route table guarantees this segment; `useParams` cannot know that, and
     the alternative is threading `string | undefined` through every call. */
  const topicId = /** @type {string} */ (useParams().topicId)
  const topic = useTopicRecord(topicId)
  const navigate = useNavigate()
  const { state } = useLocation()

  const cards = useMemo(
    () => (topic?.items ?? []).filter((item) => item.kind === 'card'),
    [topic],
  )

  const session = useSession(cards, { shuffle: topic?.shuffle, only: state?.only ?? null })
  const { list, index, current, atStart, atEnd, next, prev, setIndex } = session

  const [flipped, setFlipped] = useState(false)
  const [marks, setMarks] = useState({})

  function go(step) {
    /* Every move lands on the front. Arriving at the next card already turned
       around shows you an answer to a question you have not read. */
    setFlipped(false)
    step()
  }

  function mark(verdict) {
    /* The keyboard bindings are registered before this component's early
       return, so on a topic with no cards the handler is live with nothing
       under it. The click path cannot reach here without a card; the key path
       can. */
    if (!current) return

    setMarks((current_) => ({ ...current_, [current.id]: verdict }))
    if (!atEnd) go(next)
  }

  function finish() {
    const results = list.map((card) => ({
      id: card.id,
      title: titleOf(card),
      right: marks[card.id] === 'hit',
    }))

    navigate(`/flash-cards/t/${topicId}/score`, {
      /* Router state, not a query string: a score is the outcome of a run, and
         a URL you could paste to someone would be claiming to be a record of
         it. Reloading the score page is meant to lose it — see ScorePage. */
      state: {
        mode: 'cards',
        topicName: topic?.name ?? '',
        results,
      },
      replace: true,
    })
  }

  /* Bound as an object so the effect's dependency is a value that changes when
     the handlers close over new state — see `useSessionKeys`.

     A and E mark the card without reaching for the mouse, which is the whole
     point of a session you run one card a second through. Both cases of each,
     because `event.key` reports the shifted letter — a binding that dies under
     Caps Lock is a binding that dies silently.

     They are letters rather than the ✓/✕ side they sit on, because the buttons
     swap sides at narrow widths and a key that means "the left one" would then
     mean the other thing. */
  useSessionKeys(
    useMemo(
      () => ({
        ' ': () => setFlipped((was) => !was),
        ArrowLeft: () => !atStart && go(prev),
        ArrowRight: () => !atEnd && go(next),
        a: () => mark('miss'),
        A: () => mark('miss'),
        e: () => mark('hit'),
        E: () => mark('hit'),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [atStart, atEnd, prev, next, current],
    ),
  )

  if (!topic || list.length === 0) {
    return <EmptySession topicId={topicId} need="cards" />
  }

  const entries = list.map((card) => ({
    item: card,
    done: card.id in marks,
    right: marks[card.id] === 'hit',
    wrong: marks[card.id] === 'miss',
  }))

  return (
    <AppFrame
      title={`Studying — ${topic.name}`}
      topicBar={
        <TopicBar
          name={topic.name}
          mode="Cards"
          actions={
            <Link className="ghost-btn" to={`/flash-cards/t/${topicId}`}>
              Topic
            </Link>
          }
        />
      }
    >
      <SessionLayout
        entries={entries}
        currentIndex={index}
        onJump={(to) => {
          setFlipped(false)
          setIndex(to)
        }}
      >
        <div className="main__inner">
          {/*
            No fixed aspect ratio: a ratio is what leaves margins around the
            card, and the card is the thing you came to read. It fills the stage
            minus its controls, capped at 960px so it does not become a
            letterbox on a wide monitor — so its shape follows the window.
          */}
          <div className={flipped ? 'flip is-flipped' : 'flip'}>
            <div
              className="flip__inner"
              role="button"
              tabIndex={0}
              aria-label="Flash card — activate to turn"
              onClick={() => setFlipped((was) => !was)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setFlipped((was) => !was)
              }}
            >
              <div className="flip__face flip__face--front">
                <span className="face-label">Front</span>
                <div className="flip__body">
                  <p className="q-text">{current.front}</p>
                </div>
                <span className="flip__hint">Click, or press Space, to turn</span>
              </div>

              <div className="flip__face flip__face--back">
                <span className="face-label">Back</span>
                <div className="flip__body">
                  <p className="a-text">{current.back}</p>
                </div>
                <span className="flip__hint">Click to turn back</span>
              </div>
            </div>
          </div>

          <div className="hitmiss">
            {/* The key is in the tooltip rather than printed on the button:
                the hint line under the controls already teaches it, and a badge
                on each of two buttons would compete with the ✓/✕ that carries
                the meaning. */}
            <button
              className={marks[current.id] === 'miss' ? 'hitmiss__miss is-on' : 'hitmiss__miss'}
              type="button"
              title="Missed it (A)"
              onClick={() => mark('miss')}
            >
              <span className="hitmiss__glyph" aria-hidden="true">
                ✕
              </span>{' '}
              Missed it (A)
            </button>

            <button
              className={marks[current.id] === 'hit' ? 'hitmiss__hit is-on' : 'hitmiss__hit'}
              type="button"
              title="Got it (E)"
              onClick={() => mark('hit')}
            >
              <span className="hitmiss__glyph" aria-hidden="true">
                ✓
              </span>{' '}
              Got it (E)
            </button>
          </div>

          <div className="nav-row">
            <button
              className="nav-btn"
              type="button"
              aria-label="Previous"
              disabled={atStart}
              onClick={() => go(prev)}
            >
              ←
            </button>

            <span className="nav-count">
              {index + 1} out of {list.length}
            </span>

            <button
              className="nav-btn"
              type="button"
              aria-label="Next"
              disabled={atEnd}
              onClick={() => go(next)}
            >
              →
            </button>

            <button
              className={atEnd ? 'btn btn--sm btn--primary' : 'btn btn--sm'}
              type="button"
              onClick={finish}
            >
              Finish
            </button>
          </div>

          <p className="key-hint">Space turns · A missed · E got it · ← → move</p>
        </div>
      </SessionLayout>
    </AppFrame>
  )
}
