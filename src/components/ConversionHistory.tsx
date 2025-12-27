import { History, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useConversionHistory, type ConversionEntry } from '@/hooks/useConversionHistory';
import { playFeedback } from '@/lib/audio-feedback';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryEntry({ entry }: { entry: ConversionEntry }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50">
      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.fileName}</p>
        <p className="text-sm text-muted-foreground">{formatDate(entry.date)}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {entry.grade === 'grade1' ? 'Grade 1' : 'Grade 2'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">
            {entry.format}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ConversionHistory() {
  const { history, clearHistory } = useConversionHistory();

  const handleClear = () => {
    clearHistory();
    playFeedback('click');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="min-w-[48px] min-h-[48px]"
          aria-label="View conversion history"
        >
          <History className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" aria-hidden="true" />
            Conversion History
          </SheetTitle>
          <SheetDescription>
            Your recent conversions (stored locally on this device only).
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
              <p>No conversion history yet.</p>
              <p className="text-sm mt-1">Your conversions will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {history.map(entry => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleClear}
                className="w-full gap-2 mt-4"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Clear History
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                History is stored locally and never uploaded to the cloud.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
