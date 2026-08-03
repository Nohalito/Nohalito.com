import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import BlackHoleTest from './pages/BlackHoleTest'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/black-hole-test" element={<BlackHoleTest />} />
        <Route path="/cram-cards" element={<CramCards />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
