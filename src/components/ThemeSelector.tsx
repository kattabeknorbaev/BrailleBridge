import { Sun, Moon, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';
import { playFeedback } from '@/lib/audio-feedback';

const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'dark', label: 'Dark Mode', icon: <Moon className="w-4 h-4" /> },
  { value: 'light', label: 'Light Mode', icon: <Sun className="w-4 h-4" /> },
  { value: 'high-contrast', label: 'High Contrast', icon: <Contrast className="w-4 h-4" /> },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const currentOption = themeOptions.find(opt => opt.value === theme) || themeOptions[0];

  const handleSelect = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    playFeedback('click');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="min-w-[48px] min-h-[48px]"
          aria-label={`Display mode: ${currentOption.label}. Click to change.`}
        >
          {currentOption.icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Display / Accessibility Mode
        </div>
        {themeOptions.map(option => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`gap-3 min-h-[44px] ${theme === option.value ? 'bg-primary/10' : ''}`}
          >
            {option.icon}
            <span>{option.label}</span>
            {theme === option.value && (
              <span className="ml-auto text-primary" aria-label="(selected)">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
