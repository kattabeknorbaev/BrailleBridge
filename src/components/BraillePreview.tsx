import { getBrailleDots } from '@/lib/braille';
import { cn } from '@/lib/utils';

interface BrailleCellProps {
  char: string;
  showDots?: boolean;
}

function BrailleCell({ char, showDots = false }: BrailleCellProps) {
  const dots = getBrailleDots(char);
  
  if (!showDots) {
    return (
      <span className="text-4xl" aria-hidden="true">
        {char}
      </span>
    );
  }

  // Dots layout:
  // 1 4
  // 2 5
  // 3 6
  return (
    <div className="braille-cell" aria-hidden="true">
      <div className={cn('braille-dot', dots[0] ? 'braille-dot-active' : 'braille-dot-inactive')} />
      <div className={cn('braille-dot', dots[3] ? 'braille-dot-active' : 'braille-dot-inactive')} />
      <div className={cn('braille-dot', dots[1] ? 'braille-dot-active' : 'braille-dot-inactive')} />
      <div className={cn('braille-dot', dots[4] ? 'braille-dot-active' : 'braille-dot-inactive')} />
      <div className={cn('braille-dot', dots[2] ? 'braille-dot-active' : 'braille-dot-inactive')} />
      <div className={cn('braille-dot', dots[5] ? 'braille-dot-active' : 'braille-dot-inactive')} />
    </div>
  );
}

interface BraillePreviewProps {
  braille: string;
  showDots?: boolean;
  className?: string;
  maxChars?: number;
}

export function BraillePreview({ braille, showDots = false, className, maxChars = 500 }: BraillePreviewProps) {
  const displayBraille = braille.slice(0, maxChars);
  const isTruncated = braille.length > maxChars;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'p-6 bg-braille-bg rounded-xl overflow-x-auto',
          showDots ? 'flex flex-wrap gap-2' : ''
        )}
        role="region"
        aria-label="Braille output preview"
      >
        {showDots ? (
          displayBraille.split('').map((char, i) => (
            char === '\n' ? (
              <div key={i} className="w-full h-4" aria-hidden="true" />
            ) : (
              <BrailleCell key={i} char={char} showDots />
            )
          ))
        ) : (
          <p className="text-3xl md:text-4xl leading-relaxed tracking-wider font-mono whitespace-pre-wrap break-all">
            {displayBraille}
          </p>
        )}
      </div>

      {isTruncated && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first {maxChars} characters. Download the full file for complete output.
        </p>
      )}

      {/* Screen reader text */}
      <div className="sr-only" aria-live="polite">
        Braille preview with {braille.length} characters.
        {isTruncated && ` Showing first ${maxChars} characters.`}
      </div>
    </div>
  );
}
