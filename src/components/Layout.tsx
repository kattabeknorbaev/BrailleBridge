import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { AccessibilityControls } from './AccessibilityControls';
import { Navigation } from './Navigation';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header with navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and title */}
            <Link
              to="/"
              className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Eye className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold">BrailleBridge</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Document to Braille Converter
                </p>
              </div>
            </Link>

            {/* Desktop navigation */}
            <Navigation className="hidden md:block" />

            {/* Right side: Accessibility controls + Mobile menu */}
            <div className="flex items-center gap-2">
              <AccessibilityControls />
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* ARIA announcer for screen readers */}
      <div id="aria-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
