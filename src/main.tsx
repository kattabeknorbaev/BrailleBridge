import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { applyTheme } from './hooks/useTheme';
import './index.css';

// An inline script in index.html sets the theme before first paint; this keeps it in sync.
try {
  applyTheme((localStorage.getItem('braillebridge:theme') as Parameters<typeof applyTheme>[0]) ?? 'system');
} catch {
  applyTheme('system');
}

createRoot(document.getElementById('root')!).render(<App />);
