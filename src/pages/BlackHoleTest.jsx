import BlackHoleAnimation from '../components/BlackHoleAnimation'

/**
 * Development harness for the animation — the disc on its own, with no page
 * around it, so it can be tuned without scrolling past the home content.
 *
 * The `<title>` is hoisted into `<head>` by React 19; see the note in
 * `src/pages/Home.jsx`. It is labelled as a test rather than given a presentable
 * name on purpose: this route is reachable but is not a page anyone was meant to
 * land on, and the tab should say so.
 */
export default function BlackHoleTest() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}>

      <BlackHoleAnimation />
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '15px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 100,
          maxWidth: '300px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>Black Hole Animation Test</h3>
      </div>
    </div>
  )
}
