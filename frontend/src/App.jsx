import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AudioDetector from './pages/AudioDetector';
import SimSwap from './pages/SimSwap';
import JobScanner from './pages/JobScanner';
import Education from './pages/Education';
import useKavachStore from './store/kavachStore';

function AppContent() {
  const location = useLocation();
  const { sidebarOpen } = useKavachStore();
  const isLanding = location.pathname === '/';

  return (
    <>
      <Navbar />
      {!isLanding && <Sidebar />}
      <main
        className={isLanding ? '' : 'main-content'}
        style={!isLanding && !sidebarOpen ? { marginLeft: 0 } : {}}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/audio" element={<AudioDetector />} />
            <Route path="/simswap" element={<SimSwap />} />
            <Route path="/jobscanner" element={<JobScanner />} />
            <Route path="/education" element={<Education />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1f35',
            color: '#e8f4fd',
            border: '1px solid #1a2e4a',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.92rem',
          },
          success: { iconTheme: { primary: '#00ffb2', secondary: '#030810' } },
          error: { iconTheme: { primary: '#ff3b3b', secondary: '#030810' } },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
