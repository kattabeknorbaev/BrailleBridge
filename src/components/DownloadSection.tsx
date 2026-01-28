import { Download, FileText, Printer, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brailleToBRF, brailleToDXP } from '@/lib/braille';
import { feedback } from '@/lib/audio-feedback';
import { cn } from '@/lib/utils';

import type { BrailleGrade } from '@/lib/braille';

interface DownloadSectionProps {
  braille: string;
  originalFilename?: string;
  brailleGrade?: BrailleGrade;
  onDownload?: (format: 'brf' | 'dxp' | 'unicode') => void;
  className?: string;
}

function generateFilename(originalFilename: string, grade: BrailleGrade, extension: string): string {
  // Remove extension from original filename
  const baseName = originalFilename.replace(/\.[^/.]+$/, '');
  
  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Clean up base name (remove special characters, replace spaces with underscores)
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .substring(0, 50); // Limit length
  
  // Build descriptive filename
  const gradeLabel = grade === 'grade1' ? 'grade1' : 'grade2';
  
  return `${cleanBaseName}_${gradeLabel}_${dateStr}.${extension}`;
}

export function DownloadSection({ 
  braille, 
  originalFilename = 'document', 
  brailleGrade = 'grade1',
  onDownload, 
  className 
}: DownloadSectionProps) {
  const downloadFile = (content: string, extension: string, mimeType: string, format: 'brf' | 'dxp' | 'unicode') => {
    const filename = generateFilename(originalFilename, brailleGrade, extension);
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    feedback('complete', `Downloaded ${filename}`);
    onDownload?.(format);
  };

  const handleDownloadBRF = () => {
    const brf = brailleToBRF(braille);
    downloadFile(brf, 'brf', 'application/x-brf', 'brf');
  };

  const handleDownloadDXP = () => {
    const dxp = brailleToDXP(braille);
    downloadFile(dxp, 'dxp', 'application/x-dxp', 'dxp');
  };

  const handleDownloadTXT = () => {
    downloadFile(braille, 'txt', 'text/plain', 'unicode');
  };

  return (
    <div className={cn('space-y-6 animate-fade-in', className)}>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Download Your Braille File</h2>
        <p className="text-muted-foreground">
          Choose a format compatible with your device
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* BRF Download */}
        <Button
          variant="default"
          size="lg"
          onClick={handleDownloadBRF}
          className="h-auto py-6 flex flex-col gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Printer className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">BRF Format</p>
            <p className="text-sm opacity-80">For embossers</p>
          </div>
        </Button>

        {/* DXP Download */}
        <Button
          variant="secondary"
          size="lg"
          onClick={handleDownloadDXP}
          className="h-auto py-6 flex flex-col gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-secondary-foreground/10 flex items-center justify-center">
            <Download className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">DXP Format</p>
            <p className="text-sm opacity-80">Extended format</p>
          </div>
        </Button>

        {/* Unicode TXT Download */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleDownloadTXT}
          className="h-auto py-6 flex flex-col gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Unicode Text</p>
            <p className="text-sm opacity-80">For displays</p>
          </div>
        </Button>
      </div>

      {/* Device compatibility info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" aria-hidden="true" />
          Device Compatibility
        </h3>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">BRF:</span>
            <span>Standard Braille embossers, most Braille translation software</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">DXP:</span>
            <span>Index embossers, compatible Braille production software</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary font-bold">TXT:</span>
            <span>Refreshable Braille displays, tactile e-readers, screen readers</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
