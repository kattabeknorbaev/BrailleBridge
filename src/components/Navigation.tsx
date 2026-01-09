import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Reviews', href: '/reviews' },
  { name: 'Accessibility', href: '/accessibility' },
];

interface NavigationProps {
  className?: string;
  onLinkClick?: () => void;
  variant?: 'horizontal' | 'vertical';
}

export function Navigation({ className, onLinkClick, variant = 'horizontal' }: NavigationProps) {
  const location = useLocation();

  return (
    <nav aria-label="Main navigation" className={className}>
      <ul
        className={cn(
          'flex gap-1',
          variant === 'horizontal' ? 'flex-row items-center' : 'flex-col'
        )}
      >
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <li key={link.name}>
              <Link
                to={link.href}
                onClick={onLinkClick}
                className={cn(
                  'px-3 py-2 rounded-lg transition-colors font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                  'hover:bg-secondary hover:text-secondary-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                  variant === 'vertical' && 'block w-full'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { navLinks };
