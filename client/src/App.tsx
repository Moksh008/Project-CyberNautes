import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/landingpage/LandingPage'
import SentinelDashboard from './components/dashboard/SentinelDashboard'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<SentinelDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
