import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/sonner';
import Convert from './pages/Convert';

const Read = lazy(() => import('./pages/Read'));
const Learn = lazy(() => import('./pages/Learn'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Feedback = lazy(() => import('./pages/Feedback'));
const NotFound = lazy(() => import('./pages/NotFound'));

const TITLES: Record<string, string> = {
  '/': 'BrailleBridge — Convert text, PDFs and photos to braille',
  '/read': 'Read braille — BrailleBridge',
  '/learn': 'Learn Unified English Braille — BrailleBridge',
  '/about': 'About — BrailleBridge',
  '/faq': 'FAQ — BrailleBridge',
  '/accessibility': 'Accessibility — BrailleBridge',
  '/feedback': 'Feedback — BrailleBridge',
};

/** Title, scroll position and focus on navigation, so screen readers hear the new page. */
function RouteEffects() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Page not found — BrailleBridge';
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    // Wait for lazy pages to render, then focus the main region.
    const id = window.setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}

function PageFallback() {
  return <div className="min-h-screen" aria-busy="true" />;
}

export default function App() {
  return (
    <>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteEffects />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Convert />} />
            <Route path="/read" element={<Read />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/feedback" element={<Feedback />} />
            {/* Addresses from earlier versions of the site */}
            <Route path="/how-it-works" element={<Navigate to="/about" replace />} />
            <Route path="/reviews" element={<Navigate to="/feedback" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
      {/* Polite announcements for screen readers (see lib/audio-feedback). */}
      <div id="sr-announcer" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
      <Analytics />
    </>
  );
}
