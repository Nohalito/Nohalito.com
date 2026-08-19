import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import AppFrame from './components/AppFrame'
import EmptySession from './components/EmptySession'
import SessionLayout from './components/SessionLayout'
import TopicBar from './components/TopicBar'
import { useSession, useSessionKeys } from './hooks/useSession'
import { useTopicRecord } from './hooks/useTopics'
import { LETTERS, correctIndexes, isRight, shuffled, titleOf } from './model'
import './TestPage.css'

/**
 * The test: one question, its answers as boxes, and a verdict once you commit.
 *
 * ---------------------------------------------------------------------------
 * One attempt
 *
 * "Clicking an answer switches all answer cards to the answer explanation" is
 * a single irreversible attempt, and that is what this does — once committed
 * the answers lock. Allowing a re-pick would need a rule about which attempt
 * counts (first? last? best?), and a sidebar mark that can change after it has
 * been shown, which is a worse thing to look at than a locked answer.
 *
 * ---------------------------------------------------------------------------
 * Two shapes of question, one screen
 *
 * A question with one correct answer commits on the click: there is nothing to
 * assemble, and making you confirm a choice the app already has is a second
 * action buying nothing. A question with several needs a set built before it
 * can be judged, so its boxes toggle and a Check button commits them.
 *
 * The screen says which it is — "Select 2" — and that is not a courtesy. The
 * scoring is all-or-nothing, so without the count you would be guessing at how
 * many to pick as well as at which, and being marked wrong for the first is not
 * a fact about whether you knew the material.
 *
 * Every answer reveals its explanation, not only the ones you chose. The wrong
 * ones are where the learning is, and you paid for them by getting it wrong.
 *
 * ---------------------------------------------------------------------------
 * The answers are dealt, not listed
 *
 * Always, and independently of the topic's shuffle flag — that one is about the
 * order of the *questions*, and this is a different axis. A stored order is the
 * order somebody typed the answers in, and in a bank imported from a study
 * guide the correct one is very often first, or always last. Learning that is
 * learning the file, and the whole reason the flag exists is that a fixed order
 * teaches the order.
 *
 * It costs nothing downstream because the deal is applied to the question
 * itself: `picked` and `staged` hold positions in the dealt array, and so do
 * `correctIndexes` and `isRight`, which read `answer.correct` off the same
 * objects. There is no display-order-to-stored-order mapping anywhere, because
 * there is only ever one order in play. The stored item is untouched — see
 * `shuffled`.
 *
 * Unanswered counts as wrong, for the same reason an unmarked card does: the
 * denominator is the session, and skipping is not knowing.
 */
export default function TestPage() {
  /* The route table guarantees this segment; `useParams` cannot know that, and
     the alternative is threading `string | undefined` through every call. */
  const topicId = /** @type {string} */ (useParams().topicId)
  const topic = useTopicRecord(topicId)
  const navigate = useNavigate()
  const { state } = useLocation()

  /*
    The deal, one permutation per question, kept for the life of the mount.

    Deliberately a ref and not a `useMemo`. A memo is a performance hint that
    React is free to discard and recompute, and recomputing this one re-deals
    the answers underneath verdicts already on the screen — `picked` holds
    positions in the dealt array, so answer B of a locked question would quietly
    become a different sentence. Randomness that something else already depends
    on needs a cache with a promise attached to it, and a memo is not that.

    Indexes rather than the answer objects, so that an edit arriving from
    another tab shows the new text in the held order instead of the old text.
    The length check is the one case worth re-dealing for: an answer added or
    removed is a different question from the one that was dealt.
  */
  const deals = useRef(/** @type {Map<string, number[]>} */ (new Map()))

  const questions = useMemo(
    () =>
      (topic?.items ?? [])
        .filter((item) => item.kind === 'question')
        .map((question) => {
          const held = deals.current.get(question.id)
          const order =
            held?.length === question.answers.length
              ? held
              : shuffled(question.answers.map((_, i) => i))

          deals.current.set(question.id, order)
          return { ...question, answers: order.map((i) => question.answers[i]) }
        }),
    [topic],
  )

  const session = useSession(questions, { shuffle: topic?.shuffle, only: state?.only ?? null })
  const { list, index, current, atStart, atEnd, next, prev, setIndex } = session

  /*
    Two maps, and the split is the whole interaction model. `picked` is what has
    been committed — a question in it is answered and locked, forever. `staged`
    is what is merely ticked on a multi-answer question and not yet submitted.

    Keeping staged selections out of `picked` is what makes "answered" a single
    check (`id in picked`) everywhere: the sidebar mark, the lock, the verdict
    and the final score all read it, and none of them has to also ask whether a
    selection was real or still being assembled.
  */
  const [picked, setPicked] = useState(/** @type {Record<string, number[]>} */ ({}))
  const [staged, setStaged] = useState(/** @type {Record<string, number[]>} */ ({}))

  /* Read straight from state rather than from the render-scope values below,
     because the keyboard handler is bound before this component's early return
     and would otherwise capture nothing on a topic with no questions. */
  function choose(answerIndex) {
    if (!current || current.id in picked) return

    if (correctIndexes(current).length <= 1) {
      setPicked((was) => ({ ...was, [current.id]: [answerIndex] }))
      return
    }

    setStaged((was) => {
      const now = was[current.id] ?? []

      return {
        ...was,
        [current.id]: now.includes(answerIndex)
          ? now.filter((i) => i !== answerIndex)
          : [...now, answerIndex].sort((a, b) => a - b),
      }
    })
  }

  /* Commits a multi-answer question. An empty selection is not submitted —
     "I don't know" is already expressed by moving on, and it does not need a
     button that looks like answering. */
  function commit() {
    if (!current || current.id in picked) return

    const selection = staged[current.id] ?? []
    if (selection.length === 0) return

    setPicked((was) => ({ ...was, [current.id]: selection }))
  }

  function finish() {
    const results = list.map((question) => ({
      id: question.id,
      title: titleOf(question),
      right: isRight(question, picked[question.id]),
    }))

    navigate(`/flash-cards/t/${topicId}/score`, {
      state: { mode: 'test', topicName: topic?.name ?? '', results },
      replace: true,
    })
  }

  useSessionKeys(
    useMemo(() => {
      const keys = {
        ArrowLeft: () => !atStart && prev(),
        ArrowRight: () => !atEnd && next(),
      }

      /* 1–6 answer, matching the A–F keys drawn on the boxes. Bound from the
         current question's own length, so a key with no box behind it is not
         bound at all rather than bound to nothing. On a multi-answer question
         the same key toggles, and Enter is what commits — the keyboard mirrors
         the pointer rather than being a second interaction model. */
      current?.answers.forEach((_, i) => {
        keys[String(i + 1)] = () => choose(i)
      })

      keys.Enter = () => commit()

      return keys
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atStart, atEnd, prev, next, current, picked, staged]),
  )

  if (!topic || list.length === 0) {
    return <EmptySession topicId={topicId} need="questions" />
  }

  const committed = picked[current.id]
  const revealed = committed !== undefined

  const wanted = correctIndexes(current).length
  const multi = wanted > 1

  /* What is highlighted right now: the committed answer once locked, the
     in-progress ticks before that. One value, so the boxes are drawn the same
     way either side of the commit. */
  const chosen = committed ?? staged[current.id] ?? []

  const entries = list.map((question) => ({
    item: question,
    done: question.id in picked,
    right: isRight(question, picked[question.id]),
    wrong: question.id in picked && !isRight(question, picked[question.id]),
  }))

  return (
    <AppFrame
      title={`Test — ${topic.name}`}
      topicBar={
        <TopicBar
          name={topic.name}
          mode="Test"
          actions={
            <Link className="ghost-btn" to={`/flash-cards/t/${topicId}`}>
              Topic
            </Link>
          }
        />
      }
    >
      <SessionLayout entries={entries} currentIndex={index} onJump={setIndex}>
        <div className="qbox">
          <div className="qbox__prompt">
            <span className="face-label">Question</span>
            <p className="q-text">{current.prompt}</p>
          </div>

          {/*
            "Mini box in a 2 columns format, scrolling will be enabled as answer
            can be long" — the scroll is on this container rather than on the
            grid, so the scrollbar sits inside the inset instead of breaking its
            edge.
          */}
          <div className="qbox__answers fc-scroll">
            <ul className={revealed ? 'answers is-revealed' : 'answers'}>
              {current.answers.map((answer, i) => {
                const took = chosen.includes(i)

                /* "Missed" only on a multi-answer question. On a single-answer
                   one the correct box you did not click is the answer, and
                   labelling it as something you failed to collect describes the
                   mistake as the wrong shape. */
                const verdict = answer.correct
                  ? multi && !took
                    ? 'Correct — missed'
                    : 'Correct'
                  : took
                    ? 'Your answer'
                    : 'Not it'

                const className = [
                  'answer',
                  revealed ? (answer.correct ? 'is-correct' : 'is-incorrect') : '',
                  took ? 'is-picked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <li key={i}>
                    <button
                      className={className}
                      type="button"
                      disabled={revealed}
                      /* Before the commit these are a set being assembled, so
                         they announce as toggles. After it they are a verdict,
                         and `aria-pressed` on a disabled result would say the
                         reading is still editable. */
                      aria-pressed={multi && !revealed ? took : undefined}
                      onClick={() => choose(i)}
                    >
                      <span className="answer__head">
                        <span className="answer__key">{LETTERS[i]}</span>
                        <span className="answer__text">{answer.text}</span>
                        <span className="answer__mark" aria-hidden="true">
                          {answer.correct ? '✓' : '✕'}
                        </span>
                      </span>

                      {/* The word, not only the colour — and it is inside the
                          box it describes, so it reads without a legend. */}
                      <span className="answer__verdict">{verdict}</span>

                      {answer.explain && <span className="answer__explain">{answer.explain}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Only while a multi-answer question is open. It sits under the
              answers rather than in the nav row below, because it acts on them
              and not on the session. */}
          {multi && !revealed && (
            <div className="qbox__commit">
              <span className="qbox__wanted">
                Select {wanted} — a partial answer counts as wrong.
              </span>

              <button
                className="btn btn--sm btn--primary"
                type="button"
                disabled={chosen.length === 0}
                onClick={commit}
              >
                Check {chosen.length > 0 && `(${chosen.length}/${wanted})`}
              </button>
            </div>
          )}

          <div className="nav-row">
            <button
              className="nav-btn"
              type="button"
              aria-label="Previous"
              disabled={atStart}
              onClick={prev}
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
              onClick={next}
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

          <p className="key-hint">
            {multi && !revealed ? '1–6 toggle · Enter check · ← → move' : '1–6 answer · ← → move'}
          </p>
        </div>
      </SessionLayout>
    </AppFrame>
  )
}
