import { useSyncExternalStore } from 'react'
import { getIndex, getTopic, isStorageHealthy, subscribe } from '../storage'

/**
 * React's view of the storage module.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`, because storage
 * is genuinely external: the main page's list and the topic page's contents are
 * two components reading one source, and a write from either has to reach both.
 * The alternative is a copy of the topic in each component and a rule about who
 * re-reads when — which is a cache with no invalidation strategy.
 *
 * It works here only because the store hands back cached objects: `getSnapshot`
 * must return a referentially stable value while nothing has changed, and a
 * function that parsed JSON on every call would return a new object each render
 * and re-render forever.
 */

export function useTopicIndex() {
  return useSyncExternalStore(subscribe, getIndex)
}

/** `null` while the id names no topic — the routes render their own not-found. */
export function useTopicRecord(topicId) {
  return useSyncExternalStore(subscribe, () => getTopic(topicId))
}

/**
 * False once a write has thrown. It never returns to true within a session:
 * quota and permission failures do not resolve themselves, and a banner that
 * flickers off after the next successful read would say the work is safe when
 * it is not.
 */
export function useStorageHealthy() {
  return useSyncExternalStore(subscribe, isStorageHealthy)
}
