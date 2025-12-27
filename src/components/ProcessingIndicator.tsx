import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingIndicatorProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

export function ProcessingIndicator({
  message = 'Processing...',
  subMessage,
  className
}: ProcessingIndicatorProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 animate-fade-in', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center processing-indicator">
        <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden="true" />
      </div>
      
      <p className="text-xl font-semibold mt-6">{message}</p>
      
      {subMessage && (
        <p className="text-muted-foreground mt-2">{subMessage}</p>
      )}

      {/* Progress dots animation */}
      <div className="flex gap-2 mt-6" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            style={{
              animation: `bounce-subtle 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
