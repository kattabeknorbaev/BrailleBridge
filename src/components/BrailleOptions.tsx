import { Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SimplifyToggle } from './SimplifyToggle';
import { cn } from '@/lib/utils';
import type { BrailleGrade } from '@/lib/braille';

interface BrailleOptionsProps {
  grade: BrailleGrade;
  onGradeChange: (grade: BrailleGrade) => void;
  simplifyLayout: boolean;
  onSimplifyChange: (checked: boolean) => void;
  className?: string;
}

export function BrailleOptions({ 
  grade, 
  onGradeChange, 
  simplifyLayout, 
  onSimplifyChange,
  className 
}: BrailleOptionsProps) {
  return (
    <div className={cn('space-y-8 animate-fade-in', className)}>
      <div>
        <h2 className="text-xl font-semibold mb-2">Braille Options</h2>
        <p className="text-muted-foreground">
          Choose how your text will be converted to Braille
        </p>
      </div>

      {/* Grade Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Braille Grade</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8" aria-label="Learn about Braille grades">
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Grade 1 converts letter by letter. Grade 2 uses contractions for common words,
                making it more compact but requiring more training to read.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Inline explanation */}
        <p className="text-sm text-muted-foreground mb-4">
          Think of grades like typing styles: Grade 1 spells everything out (like typing each letter), 
          while Grade 2 uses shortcuts (like texting abbreviations). Most Braille readers learn Grade 2.
        </p>

        <RadioGroup
          value={grade}
          onValueChange={(value) => onGradeChange(value as BrailleGrade)}
          className="space-y-4"
        >
          <div
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer',
              grade === 'grade1' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
            onClick={() => onGradeChange('grade1')}
          >
            <RadioGroupItem
              value="grade1"
              id="grade1"
              className="mt-1"
            />
            <Label htmlFor="grade1" className="flex-1 cursor-pointer">
              <span className="text-lg font-semibold block">Grade 1 (Uncontracted)</span>
              <span className="text-muted-foreground block mt-1">
                Each letter is represented by a single Braille cell. Best for beginners
                and when accuracy is critical. Produces longer output.
              </span>
              <span className="text-xs text-primary/80 block mt-2 italic">
                💡 Recommended for: Beginners, educational materials, unfamiliar words
              </span>
            </Label>
          </div>

          <div
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer',
              grade === 'grade2' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            )}
            onClick={() => onGradeChange('grade2')}
          >
            <RadioGroupItem
              value="grade2"
              id="grade2"
              className="mt-1"
            />
            <Label htmlFor="grade2" className="flex-1 cursor-pointer">
              <span className="text-lg font-semibold block">Grade 2 (Contracted)</span>
              <span className="text-muted-foreground block mt-1">
                Uses contractions and abbreviations for common words and letter combinations.
                More compact but requires familiarity with Braille contractions.
              </span>
              <span className="text-xs text-primary/80 block mt-2 italic">
                💡 Recommended for: Experienced readers, everyday reading, saving paper
              </span>
            </Label>
          </div>
        </RadioGroup>
        
        {/* Quick reference */}
        <Collapsible className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-sm">Quick comparison example</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted/50 text-sm">
            <p className="text-muted-foreground mb-2">The word "the" in each grade:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Grade 1:</p>
                <p className="font-mono text-lg">⠞⠓⠑</p>
                <p className="text-xs text-muted-foreground">(3 cells: t-h-e)</p>
              </div>
              <div>
                <p className="font-semibold">Grade 2:</p>
                <p className="font-mono text-lg">⠮</p>
                <p className="text-xs text-muted-foreground">(1 cell: "the" contraction)</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Layout Simplification Option */}
      <SimplifyToggle
        checked={simplifyLayout}
        onCheckedChange={onSimplifyChange}
      />

      {/* Format Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Output Formats</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">BRF</span>
            </div>
            <div>
              <p className="font-semibold">Braille Ready Format</p>
              <p className="text-sm text-muted-foreground">
                Standard ASCII Braille format compatible with most embossers and software.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">DXP</span>
            </div>
            <div>
              <p className="font-semibold">DXP Format</p>
              <p className="text-sm text-muted-foreground">
                Extended format with additional formatting for compatible embossers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-xs">⠃⠗⠇</span>
            </div>
            <div>
              <p className="font-semibold">Unicode Braille</p>
              <p className="text-sm text-muted-foreground">
                Visual preview using Unicode Braille patterns for on-screen viewing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Both Grade 1 and Grade 2 use Unified English Braille (UEB) standards.
      </p>
    </div>
  );
}
