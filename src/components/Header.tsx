import { Eye } from 'lucide-react';
import { AccessibilityControls } from './AccessibilityControls';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Eye className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold">BrailleBridge</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Document to Braille Converter</p>
          </div>
        </div>

        {/* Accessibility controls */}
        <AccessibilityControls />
      </div>
    </header>
  );
}
