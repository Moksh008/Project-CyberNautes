import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Lazy loading route components for code splitting & fast initial render
const LandingPage = lazy(() => import('./components/landingpage/LandingPage'));
const SentinelDashboard = lazy(() => import('./components/dashboard/SentinelDashboard'));
const AuthUI = lazy(() => import('./components/landingpage/AuthUI').then(m => ({ default: m.AuthUI })));

// Minimal loading spinner placeholder for Suspense fallback
function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#05070a] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="font-mono text-xs text-zinc-400">Loading SentinelAI...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthUI />} />
          <Route path="/dashboard" element={<SentinelDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
