import { lazy, Suspense } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import Home from './pages/Home'

// Lazy so Three.js lands in its own chunk. Home already imports the animation
// dynamically; if this route imported it statically as well, Rollup would be
// forced to keep it in the main bundle and the split would be undone.
const BlackHoleTest = lazy(() => import('./pages/BlackHoleTest'))

/*
  The flash-cards routes are lazy for a different reason: not a dependency, but
  a whole app — five screens, a storage layer and two file parsers that a
  visitor reading the home page never runs. They share one chunk because they
  share nearly all of that code, and because moving between them mid-session
  should not wait on a network request.
*/
const FlashCards = lazy(() => import('./apps/flash-cards/FlashCards'))
const TopicPage = lazy(() => import('./apps/flash-cards/TopicPage'))
const StudyPage = lazy(() => import('./apps/flash-cards/StudyPage'))
const TestPage = lazy(() => import('./apps/flash-cards/TestPage'))
const ScorePage = lazy(() => import('./apps/flash-cards/ScorePage'))

function App() {
  return (
    <BrowserRouter basename="/nohalito.org">
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/black-hole-test" element={<BlackHoleTest />} />

          {/*
            A topic gets a URL, and so does a session inside it. Deep links work
            on this host without extra work — public/404.html encodes the path
            and the decoder in index.html puts it back before React mounts — so
            nesting costs nothing and buys a reloadable, bookmarkable study run.

            The id is opaque rather than a slug of the name: renaming a topic is
            a normal thing to do, and a slug in the URL would break every link
            to it the moment you did.
          */}
          <Route path="/flash-cards" element={<FlashCards />} />
          <Route path="/flash-cards/t/:topicId" element={<TopicPage />} />
          <Route path="/flash-cards/t/:topicId/study" element={<StudyPage />} />
          <Route path="/flash-cards/t/:topicId/test" element={<TestPage />} />
          <Route path="/flash-cards/t/:topicId/score" element={<ScorePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
