import { SCHEMA_VERSION, MAX_ANSWERS, normalizeItem, newId, validateItem } from './model'

/**
 * Files in and files out.
 *
 * ---------------------------------------------------------------------------
 * One JSON envelope, at every scope
 *
 *   { version, name, items: [ … ] }
 *
 * A whole topic, a selection, or a single question are all this shape with a
 * different number of entries. That is what makes "export this question,
 * import it into another topic" work: it is the same writer and the same
 * parser, so the one-item case is exercised by every test of the many-item
 * case rather than being a second path nobody runs.
 *
 * Item ids travel in the file. They are what lets an import say "two of these
 * are already here" instead of silently doubling a topic — matching on the
 * front text instead would be wrong the first time two cards share a prompt,
 * which is a normal thing for cards to do.
 *
 * ---------------------------------------------------------------------------
 * JSON only, in both directions
 *
 * CSV used to be offered here and is gone. Two columns carry a card and
 * nothing else: a question holds up to six answers, six explanations and a
 * correct flag, which is fourteen mostly-empty columns or an encoded blob in
 * one cell. The consequence was an export that silently wrote out only the
 * cards of a mixed topic — a file that looks like a backup and is not one.
 *
 * The one thing it bought was typing cards in a spreadsheet, and that is not
 * worth an asymmetric format: a file this app writes should be a file this app
 * reads back whole, which is the property the whole "export a question, import
 * it into another topic" story rests on.
 *
 * ---------------------------------------------------------------------------
 * Imports are all-or-nothing
 *
 * A file that fails half way leaves a topic in a state the user cannot reason
 * about — some of it arrived, in an order they did not choose, and the fix is
 * to find and delete exactly those. Parsing to completion first means the only
 * two outcomes are "nothing happened, here is which entry was wrong" and "all
 * of it arrived".
 */

/** Refused before parsing. A file this size cannot fit in localStorage anyway,
    and failing at write time — after a successful parse — is a worse story. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024

export class ImportError extends Error {}

/* --- writing -------------------------------------------------------------- */

export function toEnvelope(name, items) {
  return { version: SCHEMA_VERSION, name, items: items.map(normalizeItem) }
}

export function toJson(name, items) {
  return JSON.stringify(toEnvelope(name, items), null, 2)
}

export function fileNameFor(name, extension) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'topic'

  return `${slug}.${extension}`
}

/**
 * Hands the file to the browser's own download path.
 *
 * The object URL is revoked on the next frame rather than immediately: the
 * click is synchronous but the fetch the browser starts from it is not, and
 * revoking in the same tick cancels the download in some browsers.
 */
export function downloadText(fileName, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

/* --- reading -------------------------------------------------------------- */

export function readFileText(file) {
  if (file.size > MAX_FILE_BYTES) {
    const mb = (MAX_FILE_BYTES / 1024 / 1024).toFixed(0)
    return Promise.reject(new ImportError(`That file is larger than ${mb} MB.`))
  }

  return file.text().catch(() => {
    throw new ImportError('That file could not be read.')
  })
}

/**
 * The one entry point for reading a file. It was a format switch — extension
 * first, then content, because a `.txt` holding JSON is a thing people produce
 * — and with one format left there is nothing to switch on: text that does not
 * parse is not a topic, whatever it is called.
 */
export function parseTopicFile(text) {
  let data

  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError('That file is not valid JSON.')
  }

  /* A bare array is accepted as well as the envelope: it is what someone
     writing a file by hand produces, and rejecting it teaches nothing. */
  const items = Array.isArray(data) ? data : data?.items
  const name = Array.isArray(data) ? '' : (data?.name ?? '')

  if (!Array.isArray(items)) {
    throw new ImportError('That JSON has no "items" list.')
  }

  if (!Array.isArray(data) && data.version && Number(data.version) > SCHEMA_VERSION) {
    throw new ImportError(
      `That file was written by a newer version of this app (format ${data.version}).`,
    )
  }

  const parsed = items.map((raw, index) => {
    const kind = raw?.kind === 'question' ? 'question' : 'card'

    const item = normalizeItem({
      id: typeof raw?.id === 'string' ? raw.id : newId(),
      kind,
      front: raw?.front,
      back: raw?.back,
      prompt: raw?.prompt,
      answers: Array.isArray(raw?.answers) ? raw.answers.slice(0, MAX_ANSWERS) : [],
    })

    const problem = validateItem(item)
    if (problem) throw new ImportError(`Entry ${index + 1}: ${problem}`)

    return item
  })

  if (parsed.length === 0) throw new ImportError('That file holds no cards or questions.')

  return { name: String(name).trim(), items: parsed }
}

/**
 * Splits an incoming batch against what a topic already holds.
 *
 * Exact id match only. Anything cleverer is a guess about when two cards are
 * "the same card", and the cost of guessing wrong — silently dropping material
 * somebody wrote — is worse than the cost of a duplicate they can see and
 * delete.
 */
export function splitAgainst(existingItems, incoming) {
  const known = new Set(existingItems.map((item) => item.id))

  return {
    fresh: incoming.filter((item) => !known.has(item.id)),
    duplicates: incoming.filter((item) => known.has(item.id)),
  }
}
