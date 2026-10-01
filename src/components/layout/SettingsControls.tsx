import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Contrast, History, Languages, Monitor, Moon, Sun, Trash2, Volume2, VolumeX, X } from 'lucide-react';
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
import { LOCALES, setLocale, useLocale, useMessages, type Locale } from '@/i18n';

const THEME_ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  'high-contrast': Contrast,
};
const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark', 'high-contrast'];

export function LanguageMenu() {
  const locale = useLocale();
  const t = useMessages().layout;
  const current = LOCALES.find((l) => l.value === locale)!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-1.5 px-2.5" aria-label={`${t.language}: ${current.label}`}>
          <Languages aria-hidden="true" />
          <span className="text-[0.8rem] uppercase">{locale === 'uz' ? 'Oʻz' : 'En'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{t.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.value}
            lang={l.htmlLang}
            onSelect={() => setLocale(l.value)}
            className="min-h-11 gap-3 text-[0.9rem]"
            role="menuitemradio"
            aria-checked={locale === l.value}
          >
            {l.label}
            {locale === l.value && <Check className="ml-auto size-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeMenu() {
  const { preference, resolved, setPreference } = useTheme();
  const t = useMessages().settings;
  const CurrentIcon = resolved === 'high-contrast' ? Contrast : resolved === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.themeButton(t.themes[preference])}>
          <CurrentIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>{t.themeTitle}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_ORDER.map((value) => {
          const Icon = THEME_ICONS[value];
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => setPreference(value)}
              className="min-h-11 gap-3 text-[0.9rem]"
              aria-checked={preference === value}
              role="menuitemradio"
            >
              <Icon className="size-4" aria-hidden="true" />
              {t.themes[value]}
              {preference === value && <Check className="ml-auto size-4" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SoundToggle() {
  const [on, setOn] = useState(isAudioEnabled);
  const t = useMessages().settings;
  const toggle = () => {
    setAudioEnabled(!on);
    setOn(!on);
    if (!on) playFeedback('click');
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-pressed={on} aria-label={t.sound} title={on ? t.soundOn : t.soundOff}>
      {on ? <Volume2 /> : <VolumeX />}
    </Button>
  );
}

/** Language, theme and sound settings for the mobile menu (the header icons are hidden on small screens). */
export function CompactSettings() {
  const { preference, setPreference } = useTheme();
  const locale = useLocale();
  const m = useMessages();
  const [sound, setSound] = useState(isAudioEnabled);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[0.85rem] font-bold">{m.layout.language}</p>
        <SegmentedControl
          label={m.layout.language}
          size="sm"
          value={locale}
          onChange={(l: Locale) => setLocale(l)}
          options={LOCALES.map((l) => ({ value: l.value, label: l.label }))}
        />
      </div>
      <div className="space-y-2">
        <p className="text-[0.85rem] font-bold">{m.settings.themeTitle}</p>
        <SegmentedControl
          label={m.settings.themeTitle}
          size="sm"
          value={preference}
          onChange={setPreference}
          className="flex w-full flex-wrap"
          options={THEME_ORDER.map((value) => ({ value, label: value === 'system' ? m.settings.themeAuto : m.settings.themes[value] }))}
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
        <Label htmlFor="mobile-sound">{m.settings.sound}</Label>
      </div>
    </div>
  );
}

function formatDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function HistorySheet() {
  const { history, removeEntry, clearHistory } = useConversionHistory();
  const [open, setOpen] = useState(false);
  const m = useMessages();
  const t = m.settings;
  const locale = useLocale();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.historyButton(history.length)}>
          <History />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.historyTitle}</SheetTitle>
          <SheetDescription>{t.historyDescription}</SheetDescription>
        </SheetHeader>
        {history.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">{t.historyEmpty}</p>
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
                    {formatDate(entry.date, locale)} · {m.codes.short[entry.code]} · {t.historyFormats[entry.format]}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 z-10 h-9 w-9"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={t.historyRemove(entry.title)}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full" onClick={clearHistory}>
              <Trash2 aria-hidden="true" />
              {t.historyClear}
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
