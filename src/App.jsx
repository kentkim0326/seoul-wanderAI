import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import PlannerPage from './pages/PlannerPage'
import ResultPage  from './pages/ResultPage'

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1A1F3C', color: '#fff', border: '1px solid rgba(0,180,216,0.3)' },
        }}
      />
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/plan"    element={<PlannerPage />} />
        <Route path="/result"  element={<ResultPage />} />
      </Routes>
    </>
  )
}
