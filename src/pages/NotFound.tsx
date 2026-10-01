import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toBraille } from '@/lib/braille';
import { useMessages } from '@/i18n';

export default function NotFound() {
  const { pathname } = useLocation();
  const t = useMessages().notFound;
  return (
    <Layout>
      <div className="container flex max-w-xl flex-col items-center py-24 text-center">
        <p className="braille-text text-[2.5rem] text-primary" aria-hidden="true">
          {toBraille('404', 1)}
        </p>
        <h1 className="mt-4 text-3xl font-bold">{t.title}</h1>
        <p className="mt-3 text-muted-foreground">
          {t.body} <code className="rounded bg-muted px-1.5 py-0.5">{pathname}</code>
        </p>
        <Button asChild className="mt-8">
          <Link to="/">{t.home}</Link>
        </Button>
      </div>
    </Layout>
  );
}
