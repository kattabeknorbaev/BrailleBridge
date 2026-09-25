import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Contrast, History, Monitor, Moon, Sun, Trash2, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { isAudioEnabled, playFeedback, setAudioEnabled } from '@/lib/audio-feedback';

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Match my device', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'high-contrast', label: 'High contrast', icon: Contrast },
];

export function ThemeMenu() {
  const { preference, resolved, setPreference } = useTheme();
  const CurrentIcon = resolved === 'high-contrast' ? Contrast : resolved === 'dark' ? Moon : Sun;
  const currentLabel = THEMES.find((t) => t.value === preference)?.label ?? 'Match my device';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Display theme: ${currentLabel}`}>
          <CurrentIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Display theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setPreference(value)}
            className="min-h-11 gap-3 text-[0.9rem]"
            aria-checked={preference === value}
            role="menuitemradio"
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {preference === value && <Check className="ml-auto size-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SoundToggle() {
  const [on, setOn] = useState(isAudioEnabled);
  const toggle = () => {
    setAudioEnabled(!on);
    setOn(!on);
    if (!on) playFeedback('click');
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={on}
      aria-label="Sound feedback"
      title={on ? 'Sound feedback is on' : 'Sound feedback is off'}
    >
      {on ? <Volume2 /> : <VolumeX />}
    </Button>
  );
}

/** Theme and sound settings for the mobile menu (the header icons are hidden on small screens). */
export function CompactSettings() {
  const { preference, setPreference } = useTheme();
  const [sound, setSound] = useState(isAudioEnabled);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[0.85rem] font-bold">Display theme</p>
        <SegmentedControl
          label="Display theme"
          size="sm"
          value={preference}
          onChange={setPreference}
          className="flex w-full flex-wrap"
          options={THEMES.map((t) => ({ value: t.value, label: t.value === 'system' ? 'Auto' : t.label }))}
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="mobile-sound"
          checked={sound}
          onCheckedChange={(on) => {
            setAudioEnabled(on);
            setSound(on);
            if (on) playFeedback('click');
          }}
        />
        <Label htmlFor="mobile-sound">Sound feedback</Label>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const FORMAT_LABEL = { brf: 'BRF', pef: 'PEF', txt: 'Text', print: 'Print', copy: 'Copied' } as const;

export function HistorySheet() {
  const { history, removeEntry, clearHistory } = useConversionHistory();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Recent documents (${history.length})`}>
          <History />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Recent documents</SheetTitle>
          <SheetDescription>Saved in this browser only. Nothing is uploaded.</SheetDescription>
        </SheetHeader>
        {history.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">Documents you export will appear here.</p>
        ) : (
          <>
            <ul className="mt-6 flex-1 space-y-3 overflow-y-auto pr-1">
              {history.map((entry) => (
                <li key={entry.id} className="group relative rounded-lg border bg-card p-3 pr-12">
                  <Link
                    to={`/?open=${entry.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded font-semibold text-foreground after:absolute after:inset-0 hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
                    {formatDate(entry.date)} · Grade {entry.grade} · {FORMAT_LABEL[entry.format]}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 z-10 h-9 w-9"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`Remove ${entry.title} from history`}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full" onClick={clearHistory}>
              <Trash2 aria-hidden="true" />
              Clear history
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
