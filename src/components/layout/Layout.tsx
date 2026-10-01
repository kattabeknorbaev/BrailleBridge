import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Github, Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CompactSettings, HistorySheet, LanguageMenu, SoundToggle, ThemeMenu } from './SettingsControls';
import { useMessages } from '@/i18n';
import { cn } from '@/lib/utils';

export const REPO_URL = 'https://github.com/kattabeknorbaev/BrailleBridge';

const NAV = [
  { to: '/', key: 'convert' },
  { to: '/read', key: 'read' },
  { to: '/learn', key: 'learn' },
  { to: '/about', key: 'about' },
  { to: '/faq', key: 'faq' },
] as const;

function NavItems({ vertical, onNavigate }: { vertical?: boolean; onNavigate?: () => void }) {
  const t = useMessages().layout.nav;
  return (
    <ul className={cn('flex gap-1', vertical ? 'flex-col' : 'items-center')}>
      {NAV.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'block whitespace-nowrap rounded-lg px-3 py-2 text-[0.9rem] font-semibold transition-colors',
                // Uzbek labels are longer: tighten the bar between 1024 and 1280 px.
                vertical ? 'py-3 text-base' : 'lg:px-2 xl:px-3',
                isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )
            }
          >
            {t[item.key]}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const t = useMessages().layout;
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.openMenu}>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.menu}</SheetTitle>
        </SheetHeader>
        <nav aria-label={t.navLabel} className="mt-6">
          <NavItems vertical onNavigate={() => setOpen(false)} />
        </nav>
        <div className="mt-8 border-t pt-6 sm:hidden">
          <CompactSettings />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SiteHeader() {
  const t = useMessages().layout;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="rounded-lg" aria-label={t.home}>
          <Logo />
        </Link>
        <nav aria-label={t.navLabel} className="hidden lg:block xl:ml-4">
          <NavItems />
        </nav>
        <div className="ml-auto flex items-center gap-0.5" role="group" aria-label={t.settings}>
          <HistorySheet />
          <div className="hidden sm:contents">
            <LanguageMenu />
            <ThemeMenu />
            <SoundToggle />
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  const t = useMessages().layout;
  const links = [
    { to: '/about', label: t.footer.about },
    { to: '/faq', label: t.footer.faq },
    { to: '/accessibility', label: t.footer.accessibility },
    { to: '/feedback', label: t.footer.feedback },
  ];
  return (
    <footer className="mt-24 border-t">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <Logo />
          <p className="text-[0.85rem] text-muted-foreground">{t.footerTagline}</p>
        </div>
        <nav aria-label={t.footerNav}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9rem]">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={REPO_URL}
                className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Github className="size-4" aria-hidden="true" />
                {t.footer.source}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const t = useMessages().layout;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        {t.skip}
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Standard heading block for content pages. */
export function PageHeader({ title, intro, eyebrow }: { title: string; intro?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-10 space-y-3">
      {eyebrow && <p className="text-[0.8rem] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
      <h1 className="text-[2.1rem] font-bold leading-tight md:text-[2.6rem]">{title}</h1>
      {intro && <p className="max-w-2xl text-[1.05rem] text-muted-foreground">{intro}</p>}
    </div>
  );
}
