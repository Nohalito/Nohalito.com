/**
 * The shapes everything else in the app agrees on, and the rules that decide
 * whether one of them is allowed to be saved.
 *
 * It is a module of its own because three separate consumers need to agree:
 * the form that builds an item, the parser that reads one out of a file, and
 * the storage layer that writes it down. A validation rule living in the form
 * would be a rule an imported file never has to pass.
 *
 * ---------------------------------------------------------------------------
 * A topic
 *
 *   { id, version, name, createdAt, updatedAt, shuffle, items: [] }
 *
 * An item is one of two shapes, told apart by `kind`:
 *
 *   { id, kind: 'card',     front, back }
 *   { id, kind: 'question', prompt, answers: [{ text, explain, correct }] }
 *
 * `correct` is a boolean *on each answer*, not a `correctIndex` on the
 * question. That shape was chosen against the day several answers could be
 * true, and that day arrived: allowing it cost a validation rule, a control in
 * the form and a scoring rule, and **no change to the format at all**. Every
 * file exported before it still imports, and every file exported since still
 * opens in an older build with the extra flags intact. A `correctIndex` would
 * have made the same feature a format migration.
 *
 * All text is plain. Nothing in this app renders authored text as HTML, and
 * `parseTopicFile` is the reason that matters: an imported file is a file
 * somebody else wrote. React escapes by default, which makes plain text the
 * path of least resistance as well as the safe one — the hole only opens if
 * someone reaches for `dangerouslySetInnerHTML`, so don't.
 */

/**
 * The shapes above, written down for the checker. There is no TypeScript here —
 * `jsconfig.json` runs TS's checker over plain JSX — so a `@typedef` is how a
 * shape becomes something the editor can hold you to, and it costs nothing at
 * runtime.
 *
 * @typedef {{ id: string, kind: 'card', front: string, back: string }} Card
 * @typedef {{ text: string, explain: string, correct: boolean }} Answer
 * @typedef {{ id: string, kind: 'question', prompt: string, answers: Answer[] }} Question
 * @typedef {Card | Question} Item
 * @typedef {{
 *   id: string,
 *   version: number,
 *   name: string,
 *   createdAt: number,
 *   updatedAt: number,
 *   openedAt?: number,
 *   shuffle: boolean,
 *   items: Item[],
 * }} Topic
 */

export const SCHEMA_VERSION = 1

export const MIN_ANSWERS = 2
export const MAX_ANSWERS = 6

/** Keeps one topic's localStorage footprint predictable. See storage.js. */
export const MAX_FIELD = 2000

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * `crypto.randomUUID` needs a secure context — true on the deployed https
 * origin and on localhost, false on a bare-IP dev server, which is a real way
 * someone opens a Vite server from their phone. The fallback is not
 * cryptographically anything; it only has to not collide inside one browser.
 */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * A topic is named at the moment it exists — by the person creating it, or by
 * the file it was imported from. There is deliberately no default name: one is
 * a placeholder somebody has to remember to replace, and a list of topics that
 * mostly share it is a list you cannot read. Dropping the default makes the
 * name a required argument, which `checkJs` enforces at every call site.
 *
 * @param {string} name
 * @returns {Topic}
 */
export function makeTopic(name) {
  const now = Date.now()

  return {
    id: newId(),
    version: SCHEMA_VERSION,
    name,
    createdAt: now,
    updatedAt: now,
    /* Remembered per topic, and deliberately not part of what gets exported —
       it is how *you* study this topic, not a property of its contents. */
    shuffle: false,
    items: [],
  }
}

/** @returns {Item} */
export function blankCard() {
  return { id: newId(), kind: 'card', front: '', back: '' }
}

/** @returns {Item} */
export function blankQuestion() {
  return {
    id: newId(),
    kind: 'question',
    prompt: '',
    answers: [
      { text: '', explain: '', correct: true },
      { text: '', explain: '', correct: false },
    ],
  }
}

/** The one line of an item, used by every list, panel and label in the app. */
export function titleOf(item) {
  if (!item) return ''
  return item.kind === 'card' ? item.front : item.prompt
}

export function countOf(items, kind) {
  return items.filter((item) => item.kind === kind).length
}

export function isCard(item) {
  return item?.kind === 'card'
}

/**
 * Which of a question's answers are correct, as positions in `answers`.
 *
 * Positions rather than the answer objects themselves, because every caller is
 * comparing against what the user clicked — and what the user clicked is a
 * position. It is also what tells the test screen whether this question is a
 * one-click question or a pick-several one.
 *
 * @returns {number[]} Ascending, so two of these compare directly.
 */
export function correctIndexes(question) {
  const found = []

  question.answers.forEach((answer, index) => {
    if (answer.correct) found.push(index)
  })

  return found
}

/**
 * Did this set of picks answer the question?
 *
 * All-or-nothing: the picked set must be exactly the correct set, so an
 * incomplete answer and an over-complete one are both simply wrong. Partial
 * credit would make the verdict a fraction, and the verdict being a boolean is
 * what lets one sidebar mark, one score line and "Retry missed" all read the
 * same number.
 *
 * It lives here rather than in TestPage because that screen needs it twice —
 * once to draw the running marks, once to build the result — and two copies of
 * a scoring rule is how they come to disagree.
 *
 * @param {number[] | undefined} picked Ascending positions, or undefined for a
 *   question that was never answered. Unanswered is wrong: the denominator is
 *   the session, and skipping is not knowing.
 */
export function isRight(question, picked) {
  if (!picked) return false

  const correct = correctIndexes(question)
  return picked.length === correct.length && correct.every((index) => picked.includes(index))
}

/**
 * Returns a human-readable reason the item cannot be saved, or `null` if it
 * can. A string rather than a boolean because every caller has somewhere to
 * show it: the form puts it under the buttons, the importer puts it in the
 * error naming which entry was bad.
 */
export function validateItem(item) {
  if (!item || (item.kind !== 'card' && item.kind !== 'question')) {
    return 'Not a card or a question.'
  }

  if (item.kind === 'card') {
    if (!item.front?.trim()) return 'The front is empty.'
    if (!item.back?.trim()) return 'The back is empty.'
    if (item.front.length > MAX_FIELD || item.back.length > MAX_FIELD) {
      return `Fields are limited to ${MAX_FIELD} characters.`
    }
    return null
  }

  if (!item.prompt?.trim()) return 'The question is empty.'
  if (item.prompt.length > MAX_FIELD) return `Fields are limited to ${MAX_FIELD} characters.`

  const answers = item.answers ?? []
  const written = answers.filter((answer) => answer.text?.trim())

  if (written.length < MIN_ANSWERS) return `A question needs at least ${MIN_ANSWERS} answers.`
  if (answers.length > MAX_ANSWERS) return `A question takes at most ${MAX_ANSWERS} answers.`

  /* At least one, with no upper bound short of "all of them". A question where
     every answer is true is useless but not malformed, and a validator that
     refuses it is guessing at intent rather than checking a rule. */
  if (!written.some((answer) => answer.correct)) {
    return 'Mark at least one answer as correct.'
  }

  const tooLong = answers.some(
    (answer) => answer.text?.length > MAX_FIELD || answer.explain?.length > MAX_FIELD,
  )
  if (tooLong) return `Fields are limited to ${MAX_FIELD} characters.`

  return null
}

/**
 * Trims an item down to exactly the fields the format defines, dropping blank
 * answer rows the form leaves behind.
 *
 * Every write goes through here, so a field invented by a hand-edited import
 * file never reaches storage — and the export is a straight serialisation of
 * what is stored rather than a second, subtly different shape.
 */
/** @returns {Item} */
export function normalizeItem(item) {
  if (item.kind === 'card') {
    return {
      id: item.id ?? newId(),
      kind: 'card',
      front: String(item.front ?? '').trim(),
      back: String(item.back ?? '').trim(),
    }
  }

  return {
    id: item.id ?? newId(),
    kind: 'question',
    prompt: String(item.prompt ?? '').trim(),
    answers: (item.answers ?? [])
      .filter((answer) => String(answer.text ?? '').trim())
      .slice(0, MAX_ANSWERS)
      .map((answer) => ({
        text: String(answer.text).trim(),
        explain: String(answer.explain ?? '').trim(),
        correct: Boolean(answer.correct),
      })),
  }
}

/**
 * Fisher–Yates on a copy. Two callers, on two different axes: the sessions
 * reorder the *items* when the topic's shuffle flag is on, and the test always
 * deals a question's *answers* before drawing them.
 *
 * Neither touches what is stored. List order and study order are two different
 * questions, and only one of them is the user's arrangement of their own
 * material — a topic that came back from a session rearranged would have been
 * edited by reading it.
 */
export function shuffled(items) {
  const copy = items.slice()

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}
