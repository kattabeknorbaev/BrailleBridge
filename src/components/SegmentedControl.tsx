import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is an icon. */
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** A single-choice button group (radio semantics via Radix ToggleGroup). */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn('inline-flex rounded-lg border bg-muted p-1', className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold text-muted-foreground transition-colors',
            'hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
            'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm',
            size === 'sm' ? 'h-8 px-2.5 text-[0.8rem]' : 'h-9 px-3.5 text-[0.85rem]',
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
