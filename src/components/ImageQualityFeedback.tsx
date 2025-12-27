import { AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageQualityResult } from '@/lib/image-quality';

interface ImageQualityFeedbackProps {
  result: ImageQualityResult;
  className?: string;
}

export function ImageQualityFeedback({ result, className }: ImageQualityFeedbackProps) {
  if (result.isGood) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" aria-hidden="true" />
        <p className="text-sm text-success">✔ {result.message}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm text-warning font-medium">⚠️ {result.message}</p>
        {result.issues.length > 0 && (
          <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
            {result.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
