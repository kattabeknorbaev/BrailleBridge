import { useId, useState, type FormEvent } from 'react';
import { Github, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Layout, PageHeader, REPO_URL } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getSupabase } from '@/integrations/supabase/client';
import { feedback as notify } from '@/lib/audio-feedback';

const MAX_NAME = 80;
const MAX_MESSAGE = 2000;

export default function Feedback() {
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
      toast.error('Please write your feedback first.');
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
      toast.error('The feedback form is not available on this copy of BrailleBridge. Please use GitHub instead.');
      return;
    }
    const { error } = await supabase
      .from('feedback')
      .insert({ name: name.trim().slice(0, MAX_NAME) || null, feedback: message.trim().slice(0, MAX_MESSAGE) });
    if (error) {
      setStatus('idle');
      notify('error', 'Your feedback could not be sent');
      toast.error('Your feedback could not be sent. Please try again in a moment.');
      return;
    }
    setStatus('sent');
    notify('success', 'Thank you. Your feedback was sent.');
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <PageHeader
          eyebrow="Feedback"
          title="Help improve BrailleBridge"
          intro="Braille readers, transcribers and teachers know best. Tell us about wrong braille, confusing screens, missing features or anything that did not work for you."
        />

        {status === 'sent' ? (
          <div className="rounded-xl border bg-card p-6" role="status">
            <h2 className="text-xl font-bold">Thank you!</h2>
            <p className="mt-2 text-muted-foreground">Your feedback was sent. It is read by the developer and not shown publicly.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setMessage('');
                setStatus('idle');
              }}
            >
              Send more feedback
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 rounded-xl border bg-card p-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor={nameId}>Name (optional)</Label>
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
              <Label htmlFor={messageId}>Your feedback</Label>
              <textarea
                id={messageId}
                value={message}
                maxLength={MAX_MESSAGE}
                required
                aria-describedby={countId}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder="For wrong braille, please include the print text and what you expected."
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
              {status === 'sending' ? 'Sending…' : 'Send feedback'}
            </Button>
          </form>
        )}

        <p className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Github className="size-4" aria-hidden="true" />
          Developers can also open an issue on{' '}
          <a href={`${REPO_URL}/issues`} className="font-semibold text-primary underline underline-offset-4">
            GitHub
          </a>
          .
        </p>
      </div>
    </Layout>
  );
}
