import { cn } from '@/lib/utils';

/** The brand mark: "bb" (⠃⠃) in braille, for BrailleBridge. */
export function LogoMark({ className }: { className?: string }) {
  const cells = [0, 14];
  const filled = [
    [7, 7],
    [7, 14],
  ];
  const empty = [
    [7, 21],
    [13, 7],
    [13, 14],
    [13, 21],
  ];
  return (
    <svg viewBox="0 0 34 28" className={cn('h-9 w-auto', className)} aria-hidden="true" focusable="false">
      <rect width="34" height="28" rx="7" className="fill-primary" />
      {cells.map((offset) => (
        <g key={offset} transform={`translate(${offset + 0.5} 0)`}>
          {filled.map(([x, y]) => (
            <circle key={`f${x}${y}`} cx={x} cy={y} r="2.6" className="fill-primary-foreground" />
          ))}
          {empty.map(([x, y]) => (
            <circle key={`e${x}${y}`} cx={x} cy={y} r="1.3" className="fill-primary-foreground" opacity="0.35" />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[1.15rem] font-bold tracking-tight text-foreground">BrailleBridge</span>
    </span>
  );
}
