import BlackHoleAnimation from '../components/BlackHoleAnimation'

export default function BlackHoleTest() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
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
