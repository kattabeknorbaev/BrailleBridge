import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toBraille } from '@/lib/braille';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <Layout>
      <div className="container flex max-w-xl flex-col items-center py-24 text-center">
        <p className="braille-text text-[2.5rem] text-primary" aria-hidden="true">
          {toBraille('404', 1)}
        </p>
        <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          There is no page at <code className="rounded bg-muted px-1.5 py-0.5">{pathname}</code>.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Go to the converter</Link>
        </Button>
      </div>
    </Layout>
  );
}
