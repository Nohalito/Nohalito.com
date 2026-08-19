import { LETTERS, correctIndexes } from '../model'

/**
 * One item at full size, with the three things you can do to it.
 *
 * The correct answer is marked by a green edge *and* the word "Correct". Same
 * rule as the type chips: the word carries the meaning, the colour only makes
 * it faster to find. Nothing in this app is legible only in colour.
 *
 * The export here is scoped to this item and sits between its Edit and its
 * Delete — which, along with the topic's own export three inches up on the
 * topic bar, is the whole of what tells the two apart. It downloads on the
 * click: it used to open a menu because there were two formats to pick from,
 * and a menu holding one entry is a question with one answer.
 *
 * @param {object} props
 * @param {import('../model').Item | null} props.item
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 * @param {() => void} props.onExport
 */
export default function ItemDetail({ item, onEdit, onDelete, onExport }) {
  if (!item) {
    return <div className="empty">Pick something on the left to read it, or create a new card.</div>
  }

  return (
    <div className="detail">
      <div className="detail__eyebrow">
        <span className={`chip chip--${item.kind}`}>
          {item.kind === 'card' ? 'Card' : 'Question'}
        </span>
      </div>

      {item.kind === 'card' ? (
        <>
          <p className="detail__label">Front</p>
          <h3>{item.front}</h3>
          <p className="detail__label">Back</p>
          <p className="detail__body">{item.back}</p>
        </>
      ) : (
        <>
          <h3>{item.prompt}</h3>

          {/* The correct count, because it is what the test screen turns into
              "Select 2" — and the one property of a question you would
              otherwise have to count the green edges to learn. */}
          <p className="detail__label">
            {item.answers.length} answers · {correctIndexes(item).length} correct
          </p>

          {item.answers.map((answer, index) => (
            <div
              key={index}
              className={answer.correct ? 'detail__ans is-correct' : 'detail__ans'}
            >
              <div className="detail__ans-top">
                <span className="detail__ans-n">{LETTERS[index]}</span>
                <span>
                  {answer.text}
                  {answer.correct && (
                    <>
                      {' — '}
                      <em>Correct</em>
                    </>
                  )}
                </span>
              </div>

              {answer.explain && <p className="detail__ans-why">{answer.explain}</p>}
            </div>
          ))}
        </>
      )}

      <div className="detail__acts">
        <button className="btn btn--sm" type="button" onClick={onEdit}>
          Edit
        </button>

        <button
          className="btn btn--sm"
          type="button"
          title="Download this item as JSON — it imports back into any topic"
          onClick={onExport}
        >
          Export
        </button>

        <button className="btn btn--sm btn--ghost btn--danger" type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
