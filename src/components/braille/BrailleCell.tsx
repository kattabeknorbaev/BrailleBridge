import { memo } from 'react';
import { cellToDotMask } from '@/lib/braille';
import { cn } from '@/lib/utils';

// Dot centres in a 12 × 18 cell: columns (1-2-3 | 4-5-6), rows top to bottom.
const POSITIONS: [number, number][] = [
  [3.5, 3.5],
  [3.5, 9],
  [3.5, 14.5],
  [8.5, 3.5],
  [8.5, 9],
  [8.5, 14.5],
];

interface BrailleCellProps {
  cell: string;
  /** Height in CSS pixels (width is two thirds of it). */
  size?: number;
  /** Show unraised dot positions as faint guides. */
  showEmpty?: boolean;
  className?: string;
}

/** One braille cell drawn as dots. Decorative: pair it with text for screen readers. */
export const BrailleCell = memo(function BrailleCell({ cell, size = 24, showEmpty = true, className }: BrailleCellProps) {
  const mask = cellToDotMask(cell);
  return (
    <svg
      viewBox="0 0 12 18"
      width={(size * 2) / 3}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      {POSITIONS.map(([cx, cy], i) =>
        mask[i] ? (
          <circle key={i} cx={cx} cy={cy} r={2.15} className="fill-braille-dot" />
        ) : showEmpty ? (
          <circle key={i} cx={cx} cy={cy} r={1.1} className="fill-braille-empty" />
        ) : null,
      )}
    </svg>
  );
});
