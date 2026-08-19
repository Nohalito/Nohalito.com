import { Link } from 'react-router'
import AppFrame from './AppFrame'

/**
 * Reached by starting a session in a topic that holds none of what the session
 * needs.
 *
 * The buttons that lead here are disabled when that is true, which makes this
 * screen look unreachable — it is not. A URL can be typed, a bookmark can
 * outlive the cards it pointed at, and a reload after deleting the last card
 * lands here directly. A route that cannot be reached through the UI is still
 * a route.
 *
 * @param {object} props
 * @param {string} props.topicId
 * @param {string} props.need
 */
export default function EmptySession({ topicId, need }) {
  return (
    <AppFrame title="Nothing to study — Flash Cards">
      <div className="fc-missing">
        <h1>No {need} in this topic</h1>
        <p>Add some first — a session needs something to run through.</p>
        <Link className="btn" to={`/flash-cards/t/${topicId}`}>
          Back to the topic
        </Link>
      </div>
    </AppFrame>
  )
}
