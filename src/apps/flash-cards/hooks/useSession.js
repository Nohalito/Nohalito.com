import { useEffect, useMemo, useState } from 'react'
import { shuffled } from '../model'

/**
 * The part of a study run and a test run that is the same run: which items are
 * in it, where you are, and how you move.
 *
 * ---------------------------------------------------------------------------
 * A session is always the whole topic
 *
 * The topic page's filter is a list-management tool — it decides what you are
 * *looking at*, not what you are studying. If it carried into the session, the
 * counter's total and the score's denominator would both have to say which
 * subset they meant, on every screen, for a filter you set for an unrelated
 * reason twenty seconds earlier.
 *
 * `only` is the one exception, and it comes from the other direction: the score
 * page's "Retry missed" hands back a list of ids, which is a subset you asked
 * for by name.
 *
 * ---------------------------------------------------------------------------
 * Order
 *
 * Insertion order unless the topic's shuffle is on. Reshuffling happens when
 * the list or the flag changes, which in practice means once per session —
 * there are no writes to a topic while you are studying it.
 *
 * @param {import('../model').Item[]} items
 * @param {{ shuffle?: boolean, only?: string[] | null }} [options]
 */
export function useSession(items, { shuffle = false, only = null } = {}) {
  const onlyKey = only ? only.join(',') : ''

  const list = useMemo(() => {
    const chosen = only ? items.filter((item) => only.includes(item.id)) : items
    return shuffle ? shuffled(chosen) : chosen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, shuffle, onlyKey])

  const [index, setIndex] = useState(0)

  /* A list that shrinks under the cursor — the retry subset, or a topic emptied
     in another tab — would otherwise leave the index past the end and every
     read returning undefined. */
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(list.length - 1, 0)))
  }, [list.length])

  return {
    list,
    index,
    current: list[index] ?? null,
    setIndex,
    atStart: index === 0,
    atEnd: index >= list.length - 1,
    next: () => setIndex((i) => Math.min(i + 1, list.length - 1)),
    prev: () => setIndex((i) => Math.max(i - 1, 0)),
  }
}

/**
 * Keyboard control for the study screens: ← → to move, and whatever else the
 * screen defines.
 *
 * Bound to the document rather than to a focusable wrapper, because the thing
 * you are looking at is the card, and requiring a click on it first to make the
 * arrow keys work is a rule nobody is told.
 *
 * It ignores every event coming from a field, so the same keys keep their
 * ordinary meaning wherever text can be typed.
 */

/**
 * Keys that press the element already holding focus, and the elements they
 * press. A document-level shortcut on one of these has to stand down, because
 * this hook calls `preventDefault` — so binding Enter globally would otherwise
 * make every visible button unreachable from the keyboard: you would tab to
 * Finish, press Enter, and answer the current question instead of finishing.
 *
 * Same reasoning as the field check below it, one layer out: a control that
 * handles a key itself is a control this hook is not entitled to.
 */
const ACTIVATION_KEYS = { Enter: ['BUTTON', 'A'], ' ': ['BUTTON'] }

export function useSessionKeys(handlers) {
  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (ACTIVATION_KEYS[event.key]?.includes(tag)) return

      const handler = handlers[event.key]
      if (!handler) return

      /* Space scrolls the page by default, and the card is exactly the element
         that would move out from under you as you turn it. */
      event.preventDefault()
      handler()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
