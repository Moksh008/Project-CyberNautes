import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/landingpage/LandingPage'
import SentinelDashboard from './components/dashboard/SentinelDashboard'
import { AuthUI } from './components/landingpage/AuthUI'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthUI />} />
        <Route path="/dashboard" element={<SentinelDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
