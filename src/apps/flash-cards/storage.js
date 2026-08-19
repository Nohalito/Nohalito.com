import { SCHEMA_VERSION, makeTopic, normalizeItem, countOf } from './model'

/**
 * @typedef {import('./model').Topic} Topic
 * @typedef {import('./model').Item} Item
 * @typedef {{ id: string, name: string, cards: number, questions: number,
 *   updatedAt: number, openedAt: number }} TopicEntry
 */

/**
 * Topics, kept in localStorage, read through an in-memory cache.
 *
 * ---------------------------------------------------------------------------
 * Why localStorage
 *
 * A topic is text and nothing else, so the ~5 MB ceiling is thousands of cards
 * and the synchronous API costs nothing. IndexedDB buys capacity and blobs; it
 * would be the answer the day a card can hold an image, and that is the day to
 * revisit this — the migration is this file and nothing above it.
 *
 * ---------------------------------------------------------------------------
 * Why an index, separately from the topics
 *
 *   flash-cards:index      → [{ id, name, cards, questions, updatedAt, openedAt }]
 *   flash-cards:topic:<id> → the whole topic
 *
 * The main page needs every topic's *name and size*, not its contents. Without
 * the index it would parse every card of every topic to draw a list of titles.
 * The index is derived data, rebuilt on every write, so a corrupted one is a
 * cosmetic problem rather than a lost topic.
 *
 * ---------------------------------------------------------------------------
 * Why a store rather than a hook
 *
 * The cache is what makes `useSyncExternalStore` viable: a `getSnapshot` that
 * parsed JSON on every call would hand React a new object each render and spin
 * forever. Reads come out of the Map, writes update the Map and *then* persist.
 *
 * That ordering is also the failure plan. If a write throws — quota exhausted,
 * Safari private mode, a user who blocked storage — the cache already holds the
 * change, so the app keeps working with everything intact for this session and
 * reports that it is no longer saving. The alternative, failing the edit, loses
 * work that was typed correctly for a reason that has nothing to do with it.
 */

const INDEX_KEY = 'flash-cards:index'
const topicKey = (id) => `flash-cards:topic:${id}`

const cache = {
  /** @type {TopicEntry[] | null} */ index: null,
  /** @type {Map<string, Topic | null>} */ topics: new Map(),
}
const listeners = new Set()

let healthy = true

function notify() {
  listeners.forEach((listener) => listener())
}

/** Anything at all changed — the index, a topic, the health flag. */
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isStorageHealthy() {
  return healthy
}

function fail() {
  if (!healthy) return
  healthy = false
  notify()
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    /* A read that throws is a storage that is unavailable, not a topic that is
       missing — but there is nothing to recover either way, so treat it as
       empty and let the banner explain why nothing is being kept. */
    fail()
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    fail()
  }
}

/* --- the index ----------------------------------------------------------- */

function entryFor(topic) {
  return {
    id: topic.id,
    name: topic.name,
    cards: countOf(topic.items, 'card'),
    questions: countOf(topic.items, 'question'),
    updatedAt: topic.updatedAt,
    openedAt: topic.openedAt ?? topic.updatedAt,
  }
}

/**
 * Most-recently-opened first, which is what makes the main page's list useful
 * without a separate "recents" concept: the topic you are working on is at the
 * top because you are working on it.
 *
 * @returns {TopicEntry[]}
 */
export function getIndex() {
  if (cache.index === null) {
    const stored = read(INDEX_KEY)
    cache.index = Array.isArray(stored) ? stored : []
  }

  return cache.index
}

function saveIndex(next) {
  cache.index = next.slice().sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0))
  write(INDEX_KEY, cache.index)
}

function reindex(topic) {
  const rest = getIndex().filter((entry) => entry.id !== topic.id)
  saveIndex([...rest, entryFor(topic)])
}

/* --- topics -------------------------------------------------------------- */

/**
 * Reads through the cache and heals what it finds: a topic written by an older
 * version, or hand-edited between exports, is normalised on the way in rather
 * than trusted. Returns `null` for an id that is not there, which is what the
 * routes render their "no such topic" state from.
 *
 * @returns {Topic | null}
 */
export function getTopic(id) {
  if (!id) return null
  if (cache.topics.has(id)) return cache.topics.get(id) ?? null

  const stored = read(topicKey(id))
  const topic = stored ? hydrate(stored) : null

  cache.topics.set(id, topic)
  return topic
}

/**
 * What a stored topic is called when the record has lost its own name — hand
 * edited between exports, or written by something that did not know the shape.
 *
 * It is a repair label, not a default. Nothing in this app creates a topic
 * without a name, so a topic wearing this one arrived damaged, and the word
 * says so instead of implying it was simply never titled. The alternative —
 * refusing to load it — would hide forty cards over a missing string.
 */
const RECOVERED_NAME = 'Recovered topic'

function hydrate(stored) {
  /* Assigned after the spread, not before it: `...stored` re-applies a `name`
     key that is present but empty or null, which is most of the ways a record
     loses its name. Seeding `makeTopic` alone would let that through. */
  const name = typeof stored.name === 'string' && stored.name.trim() ? stored.name : RECOVERED_NAME

  return {
    ...makeTopic(name),
    ...stored,
    name,
    version: SCHEMA_VERSION,
    shuffle: Boolean(stored.shuffle),
    items: Array.isArray(stored.items) ? stored.items.map(normalizeItem) : [],
  }
}

function persist(topic) {
  cache.topics.set(topic.id, topic)
  write(topicKey(topic.id), topic)
  reindex(topic)
  notify()
  return topic
}

/**
 * The single write path. Every mutation below is this plus a change to `items`
 * or `name`, so `updatedAt` cannot be forgotten by one of them.
 */
function update(id, change) {
  const current = getTopic(id)
  if (!current) return null

  return persist({ ...current, ...change, updatedAt: Date.now() })
}

/**
 * Every topic in the browser came through here, so this is where "a topic has
 * a name" is true or not. The name is trimmed rather than substituted: there
 * is nothing sensible to fall back to, and a caller that reaches this with a
 * blank string has a bug the checker should be pointing at, not one this
 * function should be papering over with a placeholder.
 *
 * @param {string} name Non-empty. Typed on the main page, or taken from the
 *   file an import came out of.
 */
export function createTopic(name) {
  return persist(makeTopic(name.trim()))
}

/**
 * A blank name is ignored, not substituted. Clearing the field is somebody
 * mid-edit rather than somebody asking for the topic to be called nothing —
 * TopicBar already refuses to commit an empty draft, and stating the rule here
 * too means it holds for any future caller as well as that one.
 */
export function renameTopic(id, name) {
  const next = name.trim()
  if (!next) return getTopic(id)

  return update(id, { name: next })
}

export function setShuffle(id, shuffle) {
  return update(id, { shuffle })
}

export function addItems(id, items) {
  const current = getTopic(id)
  if (!current) return null

  return update(id, { items: [...current.items, ...items.map(normalizeItem)] })
}

export function replaceItem(id, item) {
  const current = getTopic(id)
  if (!current) return null

  const next = normalizeItem(item)
  return update(id, {
    items: current.items.map((existing) => (existing.id === next.id ? next : existing)),
  })
}

export function removeItem(id, itemId) {
  const current = getTopic(id)
  if (!current) return null

  return update(id, { items: current.items.filter((item) => item.id !== itemId) })
}

/**
 * Puts a deleted item back where it was. Undo is only honest if the item
 * returns to its position — appending it to the end is a different edit that
 * happens to restore the same content.
 */
export function insertItemAt(id, item, index) {
  const current = getTopic(id)
  if (!current) return null

  const items = current.items.slice()
  items.splice(Math.min(Math.max(index, 0), items.length), 0, normalizeItem(item))
  return update(id, { items })
}

export function deleteTopic(id) {
  cache.topics.delete(id)

  try {
    localStorage.removeItem(topicKey(id))
  } catch {
    fail()
  }

  saveIndex(getIndex().filter((entry) => entry.id !== id))
  notify()
}

/**
 * Records that a topic was opened, which is the only thing that orders the
 * main page's list.
 *
 * It writes the index but not the topic, and it deliberately leaves
 * `updatedAt` alone: opening a topic to read it is not editing it, and a list
 * sorted by "last touched in any way" would make "what did I change recently"
 * unanswerable.
 */
export function touchTopic(id) {
  const entry = getIndex().find((item) => item.id === id)
  if (!entry) return

  saveIndex([...getIndex().filter((item) => item.id !== id), { ...entry, openedAt: Date.now() }])
  notify()
}
