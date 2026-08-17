import { lazy, Suspense } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import Home from './pages/Home'
import FlashCards from './apps/flash-cards/FlashCards'

// Lazy so Three.js lands in its own chunk. Home already imports the animation
// dynamically; if this route imported it statically as well, Rollup would be
// forced to keep it in the main bundle and the split would be undone.
const BlackHoleTest = lazy(() => import('./pages/BlackHoleTest'))

function App() {
  return (
    <BrowserRouter basename="/nohalito.org">
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/black-hole-test" element={<BlackHoleTest />} />
          <Route path="/flash-cards" element={<FlashCards />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
