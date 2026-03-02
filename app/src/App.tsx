import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { initSession, trackPageView } from './lib/analytics';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProjectsPage from './pages/ProjectsPage';
import ContactPage from './pages/ContactPage';
import config from './lib/config';
import { SpeedInsights } from "@vercel/speed-insights/react"

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(pathname);
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initSession();

      // Console easter egg
      console.log(
        `%c ${config.easterEgg.consoleGreeting}`,
        'font-size: 24px; font-weight: bold; color: #007AFF; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);'
      );
      console.log(
        `%c ${config.easterEgg.consoleMessage}`,
        'font-size: 14px; color: #c678dd; padding: 4px 0;'
      );
      console.log(
        `%c 🔗 ${config.personal.github}`,
        'font-size: 14px; color: #56b6c2; font-weight: bold; padding: 4px 0;'
      );
      console.log(
        `%c ${config.easterEgg.consoleTech}`,
        'font-size: 12px; color: #888; padding: 2px 0;'
      );
      console.log(
        `%c ${config.easterEgg.consoleRecruiter}`,
        'font-size: 12px; color: #98c379; padding: 2px 0;'
      );

      // Ctrl+U / Ctrl+I easter egg overlay
      const handleKeydown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'i')) {
          showEasterEgg();
        }
      };

      const showEasterEgg = () => {
        // Don't show if one already exists
        if (document.getElementById('source-easter-egg')) return;

        const overlay = document.createElement('div');
        overlay.id = 'source-easter-egg';
        overlay.innerHTML = `
          <div style="
            position: fixed; top: 20px; right: 20px; z-index: 99999;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 1px solid rgba(0, 122, 255, 0.3);
            border-radius: 16px; padding: 20px 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 122, 255, 0.1);
            font-family: 'Inter', sans-serif; max-width: 340px;
            animation: slideIn 0.4s cubic-bezier(0.25, 0.4, 0.25, 1);
          ">
            <style>
              @keyframes slideIn {
                from { opacity: 0; transform: translateX(40px) scale(0.95); }
                to { opacity: 1; transform: translateX(0) scale(1); }
              }
              @keyframes slideOut {
                from { opacity: 1; transform: translateX(0) scale(1); }
                to { opacity: 0; transform: translateX(40px) scale(0.95); }
              }
            </style>
            <div style="font-size: 24px; margin-bottom: 8px;">👀</div>
            <div style="font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 6px;">
              ${config.easterEgg.overlayTitle}
            </div>
            <div style="font-size: 13px; color: #a0a0b0; line-height: 1.5; margin-bottom: 12px;">
              ${config.easterEgg.overlayMessage.replace('\n', '<br/>')}
            </div>
            <a href="${config.personal.github}" target="_blank" rel="noopener noreferrer" style="
              display: inline-block; padding: 8px 16px;
              background: #007AFF; color: white; border-radius: 8px;
              font-size: 13px; font-weight: 500; text-decoration: none;
              transition: background 0.2s;
            " onmouseover="this.style.background='#0066DD'" onmouseout="this.style.background='#007AFF'">
              ${config.easterEgg.overlayButtonText}
            </a>
          </div>
        `;
        document.body.appendChild(overlay);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          const el = document.getElementById('source-easter-egg');
          if (el) {
            const inner = el.firstElementChild as HTMLElement;
            if (inner) inner.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => el.remove(), 300);
          }
        }, 5000);
      };

      document.addEventListener('keydown', handleKeydown);
      initialized.current = true;

      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </AnimatePresence>
      {location.pathname !== '/contact' && <Footer />}
    </div>
  );
}

export default App;
