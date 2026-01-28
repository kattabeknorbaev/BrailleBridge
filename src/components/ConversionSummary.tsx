import { FileCheck, Hash, Gauge, Settings, FileOutput } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrailleGrade } from '@/lib/braille';

export type OCRConfidence = 'high' | 'medium' | 'low';

interface ConversionSummaryProps {
  wordCount: number;
  ocrConfidence: OCRConfidence;
  brailleGrade: BrailleGrade;
  outputFormat?: 'brf' | 'dxp' | 'unicode';
  className?: string;
}

function getConfidenceColor(confidence: OCRConfidence): string {
  switch (confidence) {
    case 'high':
      return 'text-green-500';
    case 'medium':
      return 'text-amber-500';
    case 'low':
      return 'text-red-500';
    default:
      return 'text-muted-foreground';
  }
}

function getConfidenceLabel(confidence: OCRConfidence): string {
  switch (confidence) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
}

function getConfidenceDescription(confidence: OCRConfidence): string {
  switch (confidence) {
    case 'high':
      return 'Text was clearly recognized';
    case 'medium':
      return 'Some text may need review';
    case 'low':
      return 'Please review carefully';
    default:
      return '';
  }
}

export function ConversionSummary({
  wordCount,
  ocrConfidence,
  brailleGrade,
  outputFormat,
  className,
}: ConversionSummaryProps) {
  const gradeLabel = brailleGrade === 'grade1' ? 'Grade 1 (Uncontracted)' : 'Grade 2 (Contracted)';
  const formatLabel = outputFormat 
    ? outputFormat === 'unicode' 
      ? 'Unicode Text' 
      : outputFormat.toUpperCase()
    : 'Not selected';

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6 animate-fade-in', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Conversion Summary</h3>
          <p className="text-sm text-muted-foreground">Overview of your document conversion</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Word Count */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Hash className="w-5 h-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Words Detected</p>
            <p className="text-lg font-semibold">{wordCount.toLocaleString()}</p>
          </div>
        </div>

        {/* OCR Confidence */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Gauge className={cn('w-5 h-5 mt-0.5', getConfidenceColor(ocrConfidence))} aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">OCR Confidence</p>
            <p className={cn('text-lg font-semibold', getConfidenceColor(ocrConfidence))}>
              {getConfidenceLabel(ocrConfidence)}
            </p>
            <p className="text-xs text-muted-foreground">{getConfidenceDescription(ocrConfidence)}</p>
          </div>
        </div>

        {/* Braille Grade */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <Settings className="w-5 h-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Braille Grade</p>
            <p className="text-lg font-semibold">{gradeLabel}</p>
          </div>
        </div>

        {/* Output Format */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <FileOutput className="w-5 h-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">Output Format</p>
            <p className="text-lg font-semibold">{formatLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
