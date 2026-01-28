import { useState } from 'react';
import { Columns, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SideBySidePreviewProps {
  originalText: string;
  brailleOutput: string;
  showDots?: boolean;
  className?: string;
}

export function SideBySidePreview({
  originalText,
  brailleOutput,
  showDots = false,
  className,
}: SideBySidePreviewProps) {
  const [viewMode, setViewMode] = useState<'tabs' | 'side-by-side'>('tabs');

  return (
    <div className={cn('space-y-4', className)}>
      {/* View mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Preview Comparison</h2>
        <div className="flex items-center gap-3">
          <Label htmlFor="view-mode" className="text-sm text-muted-foreground">
            Side-by-side view
          </Label>
          <Switch
            id="view-mode"
            checked={viewMode === 'side-by-side'}
            onCheckedChange={(checked) => setViewMode(checked ? 'side-by-side' : 'tabs')}
            aria-label="Toggle side-by-side view"
          />
        </div>
      </div>

      {viewMode === 'tabs' ? (
        <Tabs defaultValue="original" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="original" className="gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              Original Text
            </TabsTrigger>
            <TabsTrigger value="braille" className="gap-2">
              <Eye className="w-4 h-4" aria-hidden="true" />
              Braille Output
            </TabsTrigger>
          </TabsList>
          <TabsContent value="original" className="mt-4">
            <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {originalText}
              </pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="braille" className="mt-4">
            <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
              <pre 
                className={cn(
                  'whitespace-pre-wrap text-sm leading-relaxed',
                  showDots ? 'font-mono' : 'font-sans text-2xl tracking-wide'
                )}
              >
                {brailleOutput}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" aria-hidden="true" />
              Original Text
            </div>
            <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {originalText}
              </pre>
            </ScrollArea>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="w-4 h-4" aria-hidden="true" />
              Braille Output
            </div>
            <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
              <pre 
                className={cn(
                  'whitespace-pre-wrap text-sm leading-relaxed',
                  showDots ? 'font-mono' : 'font-sans text-2xl tracking-wide'
                )}
              >
                {brailleOutput}
              </pre>
            </ScrollArea>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Compare the original extracted text with the Braille output for verification.
      </p>
    </div>
  );
}
