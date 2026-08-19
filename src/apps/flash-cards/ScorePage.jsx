import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import AppFrame from './components/AppFrame'
import SessionLayout from './components/SessionLayout'
import TopicBar from './components/TopicBar'
import { useTopicRecord } from './hooks/useTopics'
import './ScorePage.css'

/* How many misses are shown before the list folds. Three is a sample rather
   than a summary: enough to recognise the shape of what went wrong, short
   enough that the score stays on the screen with it. */
const PREVIEW = 3

/**
 * What the session came to. The README says only "display score", so the rest
 * of this screen is an answer to "and then what?".
 *
 * ---------------------------------------------------------------------------
 * The missed list is the point
 *
 * A number alone ends the session; a list of what you got wrong continues it.
 * Every entry links back to the item on the topic page, and "Retry missed"
 * starts a new session made of exactly those — which is the reason cards are
 * scored at all, since without a verdict per card there is no such subset.
 *
 * There is no pass mark. Nothing in the spec defines passing, and inventing a
 * threshold would turn a study tool into an exam with a made-up cut-off.
 *
 * ---------------------------------------------------------------------------
 * Why the list collapses
 *
 * A bad run on a 45-question topic produces a missed list taller than the
 * screen, and it sits *above* the buttons — so the page it pushed off-screen
 * was the score you came to read. Three entries is enough to say what kind of
 * thing you got wrong; the rest is a reference you open when you want it, and
 * it opens into a box with its own scroll so that the score above it and the
 * actions below it both stay put however long it is.
 *
 * The toggle appears only when something is actually hidden. Offering to "show
 * all 3" of the 3 already on screen is a control that does nothing, and a
 * control that does nothing still has to be read before you can dismiss it.
 *
 * ---------------------------------------------------------------------------
 * Why a reload loses it
 *
 * The result arrives as router state, not in the URL. Nothing about a finished
 * session is stored, so a score page you could return to would have to be
 * reconstructed from data that no longer exists. Better to say so than to show
 * a number that has quietly become a different session's.
 */
export default function ScorePage() {
  /* The route table guarantees this segment; `useParams` cannot know that, and
     the alternative is threading `string | undefined` through every call. */
  const topicId = /** @type {string} */ (useParams().topicId)
  const topic = useTopicRecord(topicId)
  const navigate = useNavigate()
  const { state } = useLocation()

  /* Above the early return, where every hook has to be — this one is unused on
     the "no session" branch, and moving it down to where it is read would make
     the hook order depend on whether there is a result to show. */
  const [expanded, setExpanded] = useState(false)

  const results = state?.results ?? null

  if (!results) {
    return (
      <AppFrame title="No session — Flash Cards">
        <div className="fc-missing">
          <h1>No session to show</h1>
          <p>
            A score belongs to the run that produced it, and nothing about a finished run is kept —
            so this page has nothing to report after a reload.
          </p>
          <Link className="btn" to={`/flash-cards/t/${topicId}`}>
            Back to the topic
          </Link>
        </div>
      </AppFrame>
    )
  }

  const right = results.filter((result) => result.right).length
  const missed = results.filter((result) => !result.right)
  const percent = results.length ? Math.round((right / results.length) * 100) : 0
  const isTest = state.mode === 'test'

  const hidden = missed.length - PREVIEW
  const shown = expanded || hidden <= 0 ? missed : missed.slice(0, PREVIEW)

  const entries = results.map((result) => ({
    /* The panel takes items; a result carries only what it needs to draw one,
       because the topic may have been edited since the run finished. */
    item: { id: result.id, kind: isTest ? 'question' : 'card', prompt: result.title, front: result.title },
    done: true,
    right: result.right,
    wrong: !result.right,
  }))

  return (
    <AppFrame
      title={`Result — ${state.topicName}`}
      topicBar={
        <TopicBar
          name={state.topicName}
          mode="Result"
          actions={
            <Link className="ghost-btn" to={`/flash-cards/t/${topicId}`}>
              Topic
            </Link>
          }
        />
      }
    >
      {/* No current row: nothing is in progress here, so highlighting one would
          imply a cursor that does not exist. */}
      <SessionLayout entries={entries} currentIndex={-1} centred>
        <div className="done">
          <div className="done__score">
            <b>{right}</b> / <span>{results.length}</span>
          </div>
          <div className="done__of">{isTest ? 'Questions answered correctly' : 'Cards you got'}</div>

          <h1>{isTest ? 'Test complete' : 'Session complete'}</h1>
          <p>{state.topicName}</p>

          <div className="done__bars">
            <div className="done__bar">
              <b>{percent}%</b>
              <div
                className="meter"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Share correct"
              >
                <div className="meter__fill" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          {missed.length > 0 && (
            <div className="done__missed">
              <h2>{missed.length} to look at again</h2>

              {/* The scroll is on the list itself, not on the block around it:
                  the heading and the toggle sit outside it and so stay put
                  while it moves, which is what makes the box readable at all. */}
              <ul id="missed-list" className={expanded ? 'is-open fc-scroll' : undefined}>
                {shown.map((result) => (
                  <li key={result.id}>
                    {/* A query parameter rather than router state: this one *is*
                        a place, and it should survive a reload and a bookmark. */}
                    <Link to={`/flash-cards/t/${topicId}?item=${result.id}`}>{result.title}</Link>
                  </li>
                ))}
              </ul>

              {hidden > 0 && (
                <button
                  className="done__more"
                  type="button"
                  /* The pair the assistive tech needs to report this as one
                     control over one region, rather than as a button that
                     mysteriously changes the page somewhere. */
                  aria-expanded={expanded}
                  aria-controls="missed-list"
                  onClick={() => setExpanded((was) => !was)}
                >
                  {expanded ? 'Show fewer' : `Show all ${missed.length}`}
                </button>
              )}
            </div>
          )}

          <div className="done__actions">
            {missed.length > 0 && (
              <button
                className="done__btn"
                type="button"
                onClick={() =>
                  navigate(`/flash-cards/t/${topicId}/${isTest ? 'test' : 'study'}`, {
                    state: { only: missed.map((result) => result.id) },
                    replace: true,
                  })
                }
              >
                Retry the {missed.length} missed
              </button>
            )}

            <button
              className="done__btn done__btn--ghost"
              type="button"
              disabled={!topic}
              onClick={() =>
                navigate(`/flash-cards/t/${topicId}/${isTest ? 'test' : 'study'}`, {
                  replace: true,
                })
              }
            >
              Take it again
            </button>

            <Link className="done__btn done__btn--ghost" to={`/flash-cards/t/${topicId}`}>
              Back to topic
            </Link>
          </div>
        </div>
      </SessionLayout>
    </AppFrame>
  )
}
