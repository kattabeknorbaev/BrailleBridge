import { Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SimplifyToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function SimplifyToggle({ checked, onCheckedChange, className }: SimplifyToggleProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-border bg-card/50',
        className
      )}
    >
      <Checkbox
        id="simplify-layout"
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="simplify-layout" className="font-medium cursor-pointer">
            Simplify layout for Braille readability
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6" aria-label="Learn more about layout simplification">
                <Info className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                When enabled, this option removes excessive line breaks, flattens multi-column 
                layouts into single-column text, and normalizes bullets and lists for optimal 
                tactile reading experience.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Optimizes text structure for Braille embossers and tactile displays.
        </p>
      </div>
    </div>
  );
}
