import { correctIndexes, newId } from './model'

/**
 * The shape the create/edit form works in, and the two conversions between it
 * and a stored item.
 *
 * A stored question marks each answer with its own `correct` boolean. The form
 * holds the *positions* of the correct ones instead — one list, rather than a
 * flag per row that the form has to keep in step with the row it belongs to.
 * That distinction is what made removing an answer a one-line remap instead of
 * a walk over every flag.
 *
 * It also once carried the single-correct rule: `correct` was a single index,
 * because the control was a radio. Widening it to a list of indexes, plus the
 * two lines below that read and write it, is the whole of what "several answers
 * can be correct" cost the data layer — the stored format never moved.
 *
 * It lives beside the model rather than inside ItemForm.jsx because the topic
 * page needs `blankDraft` and `draftFromItem` to open the form, and a module
 * that exports both a component and its helpers gives up fast refresh.
 */

/**
 * @typedef {import('./model').Item} Item
 * @typedef {{
 *   id: string | null,
 *   kind: 'card' | 'question',
 *   front: string,
 *   back: string,
 *   prompt: string,
 *   answers: { text: string, explain: string }[],
 *   correct: number[],
 * }} Draft
 */

/**
 * @param {'card' | 'question'} [kind]
 * @returns {Draft}
 */
export function blankDraft(kind = 'card') {
  return {
    id: null,
    kind,
    front: '',
    back: '',
    prompt: '',
    answers: [
      { text: '', explain: '' },
      { text: '', explain: '' },
    ],
    correct: [0],
  }
}

/** @returns {Draft} */
export function draftFromItem(item) {
  const draft = blankDraft(item.kind)
  draft.id = item.id

  if (item.kind === 'card') {
    draft.front = item.front
    draft.back = item.back
    return draft
  }

  draft.prompt = item.prompt
  draft.answers = item.answers.map((answer) => ({ text: answer.text, explain: answer.explain }))

  /* Falls back to marking the first. `validateItem` refuses a question with
     nothing correct, so a stored one always has at least one — but a form that
     opens in a state it cannot be saved from would blame the user for damage
     done before they arrived. */
  const marked = correctIndexes(item)
  draft.correct = marked.length ? marked : [0]

  return draft
}

/** @returns {Item} */
export function itemFromDraft(draft) {
  if (draft.kind === 'card') {
    return { id: draft.id ?? newId(), kind: 'card', front: draft.front, back: draft.back }
  }

  return {
    id: draft.id ?? newId(),
    kind: 'question',
    prompt: draft.prompt,
    answers: draft.answers.map((answer, index) => ({
      text: answer.text,
      explain: answer.explain,
      correct: draft.correct.includes(index),
    })),
  }
}
