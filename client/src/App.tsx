import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './components/landingpage/LandingPage'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  )
}

export default App
