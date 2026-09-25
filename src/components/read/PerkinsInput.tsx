import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { CornerDownLeft, Delete, Space } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { describeCell, dotsToCell } from '@/lib/braille';
import { cn } from '@/lib/utils';

/** Perkins brailler layout: F D S = dots 1 2 3, J K L = dots 4 5 6. */
const KEY_TO_DOT: Record<string, number> = { KeyF: 1, KeyD: 2, KeyS: 3, KeyJ: 4, KeyK: 5, KeyL: 6 };
const DOT_KEYS: Record<number, string> = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };

interface PerkinsInputProps {
  onCell: (cell: string) => void;
  onSpace: () => void;
  onNewline: () => void;
  onBackspace: () => void;
}

/**
 * A six-key chording keyboard. Hold the dot keys of a cell together and
 * release them to type it. On touch screens, tap the dots, then "Add cell".
 */
export function PerkinsInput({ onCell, onSpace, onNewline, onBackspace }: PerkinsInputProps) {
  const [pressed, setPressed] = useState<Set<number>>(new Set());
  const chord = useRef<Set<number>>(new Set());
  const down = useRef<Set<string>>(new Set());
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [last, setLast] = useState<string | null>(null);

  const emit = useCallback(
    (dots: Set<number>) => {
      if (dots.size === 0) return;
      const cell = dotsToCell([...dots].sort().join(''));
      onCell(cell);
      setLast(cell);
    },
    [onCell],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dot = KEY_TO_DOT[e.code];
    if (dot) {
      e.preventDefault();
      if (e.repeat) return;
      down.current.add(e.code);
      chord.current.add(dot);
      setPressed(new Set(chord.current));
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      onSpace();
    } else if (e.code === 'Enter') {
      e.preventDefault();
      onNewline();
    } else if (e.code === 'Backspace') {
      e.preventDefault();
      onBackspace();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (!KEY_TO_DOT[e.code]) return;
    e.preventDefault();
    down.current.delete(e.code);
    // The cell is typed when every key of the chord has been released.
    if (down.current.size === 0) {
      emit(chord.current);
      chord.current = new Set();
      setPressed(new Set());
    }
  };

  const shown = pressed.size ? pressed : tapped;
  const preview = dotsToCell([...shown].sort().join('') || '');

  return (
    <div className="space-y-4">
      <div
        tabIndex={0}
        role="application"
        aria-roledescription="braille keyboard"
        aria-label="Perkins-style braille keyboard. Hold F D S J K L together for dots 1 to 6, then release. Space, Enter and Backspace also work."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => {
          down.current.clear();
          chord.current = new Set();
          setPressed(new Set());
        }}
        className="rounded-lg border-2 border-dashed border-input p-4 text-center transition-colors focus:border-primary focus:bg-primary/5 focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        <p className="text-[0.85rem] font-semibold">Click here, then type with your keyboard</p>
        <p className="mt-1 text-[0.8rem] text-muted-foreground">
          Hold <kbd className="font-mono">F D S</kbd> + <kbd className="font-mono">J K L</kbd> together for dots 1–6,
          release to type. <kbd className="font-mono">Space</kbd>, <kbd className="font-mono">Enter</kbd>,{' '}
          <kbd className="font-mono">Backspace</kbd> work as usual.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tap dots to build a cell">
          {[1, 4, 2, 5, 3, 6].map((dot) => {
            const on = shown.has(dot);
            return (
              <button
                key={dot}
                type="button"
                aria-pressed={tapped.has(dot)}
                aria-label={`Dot ${dot}`}
                onClick={() =>
                  setTapped((t) => {
                    const next = new Set(t);
                    if (next.has(dot)) next.delete(dot);
                    else next.add(dot);
                    return next;
                  })
                }
                className={cn(
                  'flex size-14 flex-col items-center justify-center rounded-full border-2 text-[0.7rem] font-bold transition-colors',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card text-muted-foreground hover:border-primary',
                )}
              >
                <span className="text-base leading-none">{dot}</span>
                <span className="font-mono opacity-70">{DOT_KEYS[dot]}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="surface-braille flex size-24 items-center justify-center rounded-lg border">
            <BrailleCell cell={preview} size={64} />
          </div>
          <Button
            size="sm"
            disabled={tapped.size === 0}
            onClick={() => {
              emit(tapped);
              setTapped(new Set());
            }}
          >
            Add cell
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onSpace}>
          <Space aria-hidden="true" /> Space
        </Button>
        <Button variant="outline" size="sm" onClick={onNewline}>
          <CornerDownLeft aria-hidden="true" /> New line
        </Button>
        <Button variant="outline" size="sm" onClick={onBackspace}>
          <Delete aria-hidden="true" /> Delete
        </Button>
      </div>

      <p className="text-center text-[0.8rem] text-muted-foreground" aria-live="polite">
        {last ? `Last cell typed: ${describeCell(last)}` : '\u00a0'}
      </p>
    </div>
  );
}
