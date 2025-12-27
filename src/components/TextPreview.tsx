import { useState, useRef, useEffect } from 'react';
import { Edit3, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { feedback } from '@/lib/audio-feedback';

interface TextPreviewProps {
  text: string;
  onTextChange: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function TextPreview({ text, onTextChange, isProcessing, className }: TextPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [originalText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedText(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    feedback('click', 'Editing mode enabled');
  };

  const handleSave = () => {
    setIsEditing(false);
    onTextChange(editedText);
    feedback('success', 'Changes saved');
  };

  const handleReset = () => {
    setEditedText(originalText);
    onTextChange(originalText);
    feedback('click', 'Text reset to original');
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
    feedback('click', 'Edit cancelled');
  };

  const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editedText.length;

  return (
    <div className={cn('space-y-4 animate-fade-in', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Detected Text</h2>
          <p className="text-muted-foreground">
            {wordCount} words, {charCount} characters
          </p>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
                className="gap-2"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSave}
                disabled={isProcessing}
                className="gap-2"
              >
                <Check className="w-5 h-5" aria-hidden="true" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing || editedText === originalText}
                className="gap-2"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
                Reset
              </Button>
              <Button
                variant="secondary"
                onClick={handleEdit}
                disabled={isProcessing}
                className="gap-2"
              >
                <Edit3 className="w-5 h-5" aria-hidden="true" />
                Edit Text
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Text content */}
      <div className="bg-card border border-border rounded-xl p-6">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[300px] text-lg resize-y bg-background"
            aria-label="Edit detected text"
            placeholder="Enter or edit text here..."
          />
        ) : (
          <div
            className="min-h-[200px] whitespace-pre-wrap text-lg leading-relaxed"
            role="region"
            aria-label="Detected text from document"
          >
            {editedText || (
              <p className="text-muted-foreground italic">No text detected</p>
            )}
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-sm text-muted-foreground text-center">
        Review the text above. You can edit it to correct any OCR errors before converting to Braille.
      </p>
    </div>
  );
}
