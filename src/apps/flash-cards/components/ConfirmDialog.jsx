import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

/**
 * A confirmation for the one action in this app that is both destructive and
 * irreversible: deleting a topic.
 *
 * Everything else that destroys something — deleting a card, deleting a
 * question — gets an undo line instead. A dialog for those would interrupt the
 * work forty times an hour to guard a few seconds of typing. A topic is the
 * other extreme: dozens of items, no undo, and no way to tell from the row
 * which topic you were about to lose. So it names the topic and its size, and
 * the destructive button is the one that is *not* focused on open.
 *
 * `showModal()` rather than an `open` attribute: only the former puts the
 * dialog in the top layer, renders the backdrop, and makes the rest of the page
 * inert. Rendering `<dialog open>` looks identical and does none of it.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.body
 * @param {string} props.confirmLabel
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  const ref = useRef(/** @type {HTMLDialogElement | null} */ (null))

  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      className="flash-cards-dialog"
      ref={ref}
      /* Escape fires `cancel`, and the browser closes the dialog by itself —
         which would leave React still rendering it. Preventing the default and
         routing through the same callback keeps one owner of that state. */
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      /* A click on the backdrop lands on the dialog element itself, since the
         backdrop is a pseudo-element and not a child. */
      onClick={(event) => {
        if (event.target === ref.current) onCancel()
      }}
    >
      <h2>{title}</h2>
      <p>{body}</p>

      <div className="flash-cards-dialog__actions">
        <button className="flash-cards-dialog__btn" type="button" autoFocus onClick={onCancel}>
          Keep it
        </button>

        <button
          className="flash-cards-dialog__btn flash-cards-dialog__btn--danger"
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
