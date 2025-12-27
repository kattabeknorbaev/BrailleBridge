import { useCallback, useState } from 'react';
import { Upload, Camera, FileText, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { feedback } from '@/lib/audio-feedback';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function FileUpload({ onFileSelect, isProcessing, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const isValidType = Object.keys(ACCEPTED_TYPES).includes(file.type);
    
    if (!isValidType) {
      feedback('error', 'Invalid file type. Please upload a PDF or image file.');
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    feedback('upload', `File selected: ${file.name}`);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleCameraCapture = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  }, [handleFile]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    feedback('click', 'File cleared');
  }, [previewUrl]);

  if (selectedFile) {
    return (
      <div className={cn('animate-fade-in', className)}>
        <div className="bg-card border-2 border-primary rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {previewUrl ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={previewUrl}
                    alt="Preview of uploaded file"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold truncate">{selectedFile.name}</p>
                <p className="text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-success mt-1" role="status">
                  ✓ File ready for processing
                </p>
              </div>
            </div>
            
            {!isProcessing && (
              <Button
                variant="outline"
                size="icon"
                onClick={clearSelection}
                aria-label="Remove selected file"
                className="flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Drop zone */}
      <div
        className={cn(
          'upload-zone',
          isDragging && 'upload-zone-active'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Drop files here or click to browse"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          type="file"
          id="file-input"
          accept={Object.keys(ACCEPTED_TYPES).join(',')}
          onChange={handleInputChange}
          className="sr-only"
          aria-describedby="file-help"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce-subtle">
            <Upload className="w-10 h-10 text-primary" aria-hidden="true" />
          </div>
          
          <div>
            <p className="text-xl font-semibold">Drop your file here</p>
            <p className="text-muted-foreground mt-1">or click to browse</p>
          </div>
          
          <p id="file-help" className="text-sm text-muted-foreground">
            Supported: PDF, JPG, PNG, WebP (max 20MB)
          </p>
        </div>
      </div>

      {/* Alternative upload methods */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => document.getElementById('file-input')?.click()}
          className="min-h-[56px] text-lg gap-3"
        >
          <ImageIcon className="w-6 h-6" aria-hidden="true" />
          Browse Files
        </Button>
        
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCameraCapture}
          className="min-h-[56px] text-lg gap-3"
        >
          <Camera className="w-6 h-6" aria-hidden="true" />
          Take Photo
        </Button>
      </div>
    </div>
  );
}
