import { LETTERS, MAX_ANSWERS, MAX_FIELD, MIN_ANSWERS } from '../model'

/**
 * @typedef {import('../draft').Draft} Draft
 * @typedef {{ onKeep: () => void, onDiscard: () => void }} Leaving
 */

/**
 * One form for both jobs: creating pre-fills it blank, editing pre-fills it
 * from the item. It mounts in the detail pane, which is the reason the topic
 * page is laid out this way at all — a question with six answer/explanation
 * pairs needs the width, and it gets it here without displacing the list you
 * are working through.
 *
 * ---------------------------------------------------------------------------
 * The draft is not an item
 *
 * A stored question marks each answer with its own `correct` boolean; the form
 * holds the positions of the correct ones as one list. `itemFromDraft` is where
 * the two meet — see draft.js for why the shapes differ.
 *
 * Several answers may be correct, so the OK control is a toggle rather than a
 * radio. It refuses to un-mark the last one: a question with nothing correct
 * cannot be saved, and a control that lets you reach that state only to have
 * Save reject it has taught you the rule in the most expensive order.
 *
 * ---------------------------------------------------------------------------
 * It is controlled
 *
 * The draft lives in the page, not here. The page is what has to know whether
 * there are unsaved changes when you click another item — a form that owned its
 * own state would have to report that upwards anyway, and then two components
 * would hold the same truth.
 *
 * @param {object} props
 * @param {Draft} props.draft
 * @param {boolean} props.isNew
 * @param {string | null} [props.error] Why the last save was refused.
 * @param {Leaving | null} [props.leaving] Set while an action waits on the
 *   unsaved-changes question.
 * @param {(draft: Draft) => void} props.onChange
 * @param {() => void} props.onSave
 * @param {() => void} props.onCancel
 */

export default function ItemForm({
  draft,
  isNew,
  error = null,
  leaving = null,
  onChange,
  onSave,
  onCancel,
}) {
  const isCard = draft.kind === 'card'
  const set = (patch) => onChange({ ...draft, ...patch })

  function setAnswer(index, patch) {
    set({
      answers: draft.answers.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)),
    })
  }

  function addAnswer() {
    set({ answers: [...draft.answers, { text: '', explain: '' }] })
  }

  function toggleCorrect(index) {
    const on = draft.correct.includes(index)

    /* The last mark cannot be taken off — see the docblock. Silently refusing
       is right here because the control shows its own state: the button stays
       lit, which is the answer to "why did nothing happen". */
    if (on && draft.correct.length === 1) return

    set({
      correct: on
        ? draft.correct.filter((i) => i !== index)
        : [...draft.correct, index].sort((a, b) => a - b),
    })
  }

  function removeAnswer(index) {
    /* The marks move with the list. Dropping a row above a marked one without
       this leaves that mark pointing at its neighbour — silently, since a mark
       is a position rather than a flag on the row itself. */
    const correct = draft.correct.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))

    set({
      answers: draft.answers.filter((_, i) => i !== index),
      /* Deleting the only correct answer would leave nothing marked, which is
         the one state this form does not allow to exist. */
      correct: correct.length ? correct : [0],
    })
  }

  return (
    <div className="form">
      <div className="form__head">
        <h4 className="form__title">{isNew ? 'New' : 'Editing'}</h4>

        <div className="seg" role="group" aria-label="What are you creating">
          <button
            type="button"
            className={isCard ? 'is-on' : undefined}
            onClick={() => set({ kind: 'card' })}
          >
            Card
          </button>
          <button
            type="button"
            className={isCard ? undefined : 'is-on'}
            onClick={() => set({ kind: 'question' })}
          >
            Question
          </button>
        </div>
      </div>

      {isCard ? (
        <>
          <Field
            label="Front — what you are asked"
            rows={2}
            value={draft.front}
            placeholder="A question, a term, a prompt"
            onChange={(front) => set({ front })}
          />
          <Field
            label="Back — the answer"
            rows={4}
            value={draft.back}
            placeholder="The answer, and why it is the answer"
            onChange={(back) => set({ back })}
          />
        </>
      ) : (
        <>
          <Field
            label="Question"
            rows={2}
            value={draft.prompt}
            placeholder="The question as it will be shown"
            onChange={(prompt) => set({ prompt })}
          />

          <div className="pairs">
            <div className="pairs__head">
              <span>OK</span>
              <span>Answer</span>
              <span>Explanation</span>
              <span />
            </div>

            {draft.answers.map((answer, index) => (
              <div className="pair" key={index}>
                {/*
                  A toggle drawn as a button rather than <input type="checkbox">,
                  so it keeps the letter that labels the row — the letter is how
                  the answer is referred to everywhere else in the app, and a
                  checkbox beside it would be two controls' worth of width for
                  one control's worth of meaning. `aria-pressed` announces it.
                */}
                <button
                  className="pick-ok"
                  type="button"
                  aria-pressed={draft.correct.includes(index)}
                  title={
                    draft.correct.includes(index)
                      ? draft.correct.length === 1
                        ? `Answer ${LETTERS[index]} is correct — a question needs at least one`
                        : `Answer ${LETTERS[index]} is correct — click to unmark it`
                      : `Mark answer ${LETTERS[index]} as correct`
                  }
                  onClick={() => toggleCorrect(index)}
                >
                  {LETTERS[index]}
                </button>

                <textarea
                  className="inp"
                  rows={2}
                  value={answer.text}
                  maxLength={MAX_FIELD}
                  placeholder={`Answer ${LETTERS[index]}`}
                  aria-label={`Answer ${LETTERS[index]}`}
                  onChange={(event) => setAnswer(index, { text: event.target.value })}
                />

                <textarea
                  className="inp"
                  rows={2}
                  value={answer.explain}
                  maxLength={MAX_FIELD}
                  placeholder="Why this is right, or why it is not"
                  aria-label={`Explanation for answer ${LETTERS[index]}`}
                  onChange={(event) => setAnswer(index, { explain: event.target.value })}
                />

                <button
                  className="pair__x"
                  type="button"
                  disabled={draft.answers.length <= MIN_ANSWERS}
                  aria-label={`Remove answer ${LETTERS[index]}`}
                  onClick={() => removeAnswer(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="btn btn--sm btn--ghost"
              type="button"
              disabled={draft.answers.length >= MAX_ANSWERS}
              onClick={addAnswer}
            >
              + Add answer
            </button>
          </div>
        </>
      )}

      {error && <p className="form__error">{error}</p>}

      {/*
        The unsaved-changes prompt, inline and in the form itself rather than as
        a browser dialog. `beforeunload` cannot be worded, cannot name what is
        unsaved, and fires for the tab as a whole — this fires for the one
        action that would discard the draft, and says which.
      */}
      {leaving && (
        <div className="form__leave" role="alertdialog" aria-label="Unsaved changes">
          <span>Discard the changes to this {isCard ? 'card' : 'question'}?</span>
          <div className="form__actions">
            <button className="btn btn--sm btn--ghost" type="button" onClick={leaving.onKeep}>
              Keep editing
            </button>
            <button className="btn btn--sm btn--danger" type="button" onClick={leaving.onDiscard}>
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="form__foot">
        {/* The correct count is here rather than as a hint above the rows: it
            is the one thing about a question you cannot read off the form at a
            glance, and it is how you notice you marked a second one. */}
        <span className="form__count">
          {isCard
            ? '2 fields'
            : `${draft.answers.length} / ${MAX_ANSWERS} answers · ${draft.correct.length} correct`}
        </span>

        <div className="form__actions">
          <button className="btn btn--sm btn--ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn--sm btn--primary" type="button" onClick={onSave}>
            {isNew ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** A labelled textarea, with the character counter appearing only near the cap. */
function Field({ label, rows, value, placeholder, onChange }) {
  const left = MAX_FIELD - value.length

  return (
    <label className="field">
      <span>
        {label}
        {left < 200 && <em className="field__count"> {left} left</em>}
      </span>
      <textarea
        className="inp"
        rows={rows}
        value={value}
        maxLength={MAX_FIELD}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
