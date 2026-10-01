import { useId, useState, type FormEvent } from 'react';
import { Github, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Layout, PageHeader, REPO_URL } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSupabase } from '@/integrations/supabase/client';
import { feedback as notify } from '@/lib/audio-feedback';
import { rich, useMessages } from '@/i18n';

const MAX_NAME = 80;
const MAX_MESSAGE = 2000;

export default function Feedback() {
  const t = useMessages().feedback;
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: hidden from people, filled by bots
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const nameId = useId();
  const messageId = useId();
  const countId = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(t.writeFirst);
      return;
    }
    if (website) {
      setStatus('sent');
      return;
    }
    setStatus('sending');
    const supabase = await getSupabase();
    if (!supabase) {
      setStatus('idle');
      toast.error(t.unavailable);
      return;
    }
    const { error } = await supabase
      .from('feedback')
      .insert({ name: name.trim().slice(0, MAX_NAME) || null, feedback: message.trim().slice(0, MAX_MESSAGE) });
    if (error) {
      setStatus('idle');
      notify('error', t.failedShort);
      toast.error(t.failed);
      return;
    }
    setStatus('sent');
    notify('success', t.sentAnnounce);
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} />

        {status === 'sent' ? (
          <div className="rounded-xl border bg-card p-6" role="status">
            <h2 className="text-xl font-bold">{t.sentTitle}</h2>
            <p className="mt-2 text-muted-foreground">{t.sentBody}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setMessage('');
                setStatus('idle');
              }}
            >
              {t.more}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor={nameId}>{t.name}</Label>
              <input
                id={nameId}
                value={name}
                maxLength={MAX_NAME}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="h-11 w-full max-w-sm rounded-lg border border-input bg-background px-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={messageId}>{t.message}</Label>
              <textarea
                id={messageId}
                value={message}
                maxLength={MAX_MESSAGE}
                required
                aria-describedby={countId}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder={t.placeholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 leading-relaxed placeholder:text-muted-foreground"
              />
              <p id={countId} className="text-right text-[0.8rem] text-muted-foreground">
                {message.length} / {MAX_MESSAGE}
              </p>
            </div>
            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            <Button type="submit" disabled={status === 'sending'}>
              <Send aria-hidden="true" />
              {status === 'sending' ? t.sending : t.send}
            </Button>
          </form>
        )}

        <p className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Github className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {rich(t.github, {
              github: (
                <a href={`${REPO_URL}/issues`} className="font-semibold text-primary underline underline-offset-4">
                  GitHub
                </a>
              ),
            })}
          </span>
        </p>
      </div>
    </Layout>
  );
}
