import { titleOf } from '../model'

/**
 * The left pane: one row per card or question, and the "create new" affordance
 * the README puts at the end of the list.
 *
 * A row is a single button and nothing else. Edit and Delete live in the detail
 * pane instead — two Edit buttons for the same item, one per pane, is a coin
 * toss about which one you meant, and the pane that shows you the whole item is
 * the one where deciding to change it actually happens.
 *
 * The label is `titleOf`, plain text, ellipsised by CSS rather than truncated
 * here: a string cut at 60 characters is cut at 60 characters on a 2000px
 * monitor too.
 *
 * @param {object} props
 * @param {import('../model').Item[]} props.items
 * @param {string | null} props.selectedId
 * @param {string} props.filter
 * @param {(id: string) => void} props.onSelect
 * @param {() => void} props.onNew
 */
export default function ItemList({ items, selectedId, filter, onSelect, onNew }) {
  const emptyMessage =
    filter === 'all'
      ? 'Nothing here yet.'
      : `No ${filter === 'card' ? 'cards' : 'questions'} in this topic.`

  return (
    <ul className="picks">
      {items.map((item) => (
        <li key={item.id}>
          <button
            className={item.id === selectedId ? 'pick is-on' : 'pick'}
            type="button"
            aria-current={item.id === selectedId ? 'true' : undefined}
            onClick={() => onSelect(item.id)}
          >
            <span className={`chip chip--${item.kind}`}>
              {item.kind === 'card' ? 'Card' : 'Question'}
            </span>
            <span className="pick__text">{titleOf(item) || 'Untitled'}</span>
          </button>
        </li>
      ))}

      {items.length === 0 && (
        <li>
          <div className="empty">{emptyMessage}</div>
        </li>
      )}

      {/* Stays visible while the form is open: the form is in the other pane,
          so it is not competing with itself for the same space. */}
      <li>
        <button className="newitem" type="button" onClick={onNew}>
          + Create new card
        </button>
      </li>
    </ul>
  )
}
