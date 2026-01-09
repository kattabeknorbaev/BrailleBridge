import { Link } from 'react-router-dom';

const footerLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Reviews', href: '/reviews' },
  { name: 'Accessibility', href: '/accessibility' },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-auto bg-card/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Navigation links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-4 md:gap-6">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded px-2 py-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main info */}
          <div className="text-center space-y-2">
            <p className="text-foreground font-medium">BrailleBridge</p>
            <p className="text-muted-foreground text-sm">
              Accessibility-first document to Braille conversion
            </p>
            <p className="text-muted-foreground text-sm">
              Educational / non-commercial project
            </p>
            <p className="text-muted-foreground text-sm mt-4">
              Built by Kattabek Norbaev
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
