import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { StepIndicator } from '@/components/StepIndicator';
import { FileUpload } from '@/components/FileUpload';
import { TextPreview } from '@/components/TextPreview';
import { BrailleOptions } from '@/components/BrailleOptions';
import { BraillePreview } from '@/components/BraillePreview';
import { DownloadSection } from '@/components/DownloadSection';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import { textToBraille, type BrailleGrade } from '@/lib/braille';
import { simplifyTextForBraille } from '@/lib/text-simplification';
import { getErrorMessage } from '@/lib/error-messages';
import { feedback, initAudio } from '@/lib/audio-feedback';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  { id: 1, label: 'Upload', description: 'Choose a file' },
  { id: 2, label: 'Review', description: 'Check the text' },
  { id: 3, label: 'Options', description: 'Choose format' },
  { id: 4, label: 'Download', description: 'Get your file' },
];

export default function Index() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [brailleGrade, setBrailleGrade] = useState<BrailleGrade>('grade1');
  const [simplifyLayout, setSimplifyLayout] = useState(false);
  const [brailleOutput, setBrailleOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [lastDownloadFormat, setLastDownloadFormat] = useState<'brf' | 'dxp' | 'unicode'>('brf');
  const { toast } = useToast();
  const { addEntry } = useConversionHistory();

  // Initialize audio on mount
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Process file and extract text
  const processFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    feedback('processing', 'Processing your file');

    try {
      // Read file as base64
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
      });

      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      // Call OCR edge function
      const { data, error } = await supabase.functions.invoke('ocr', {
        body: { 
          image: base64Data,
          mimeType: selectedFile.type
        }
      });

      if (error) throw error;

      if (data?.text && data.text.trim().length > 0) {
        setExtractedText(data.text);
        setCurrentStep(2);
        feedback('success', 'Text extracted successfully');
        toast({
          title: 'Text Extracted',
          description: `Found ${data.text.split(/\s+/).length} words in your document.`,
        });
      } else {
        throw new Error('No text could be extracted from the image');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      const errorInfo = getErrorMessage(err, 'ocr');
      feedback('error', errorInfo.title);
      toast({
        variant: 'destructive',
        title: errorInfo.title,
        description: `${errorInfo.description} ${errorInfo.suggestion}`,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  // Convert text to Braille
  const convertToBraille = useCallback(() => {
    setIsProcessing(true);
    feedback('processing', 'Converting to Braille');

    setTimeout(() => {
      try {
        // Apply simplification if enabled
        const textToConvert = simplifyLayout 
          ? simplifyTextForBraille(extractedText)
          : extractedText;

        const braille = textToBraille(textToConvert, brailleGrade);
        setBrailleOutput(braille);
        setCurrentStep(4);
        feedback('complete', 'Conversion complete');
        toast({
          title: 'Conversion Complete',
          description: 'Your Braille file is ready to download.',
        });
      } catch (err) {
        const errorInfo = getErrorMessage(err, 'conversion');
        feedback('error', errorInfo.title);
        toast({
          variant: 'destructive',
          title: errorInfo.title,
          description: `${errorInfo.description} ${errorInfo.suggestion}`,
        });
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  }, [extractedText, brailleGrade, simplifyLayout, toast]);

  // Track download for history
  const handleDownload = useCallback((format: 'brf' | 'dxp' | 'unicode') => {
    setLastDownloadFormat(format);
    addEntry({
      fileName: file?.name || 'Camera capture',
      grade: brailleGrade,
      format,
    });
  }, [file, brailleGrade, addEntry]);

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
      feedback('click', `Step ${step}`);
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      convertToBraille();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    goToStep(currentStep - 1);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setFile(null);
    setExtractedText('');
    setBrailleOutput('');
    setSimplifyLayout(false);
    feedback('click', 'Starting over');
  };

  // Check if we can proceed to next step
  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!extractedText;
      case 2: return extractedText.trim().length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Step indicator */}
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Main content area */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 min-h-[400px]">
          {isProcessing ? (
            <ProcessingIndicator
              message={currentStep === 1 ? 'Extracting text from your document...' : 'Converting to Braille...'}
              subMessage="This may take a few moments"
            />
          ) : (
            <>
              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <FileUpload
                  onFileSelect={processFile}
                  isProcessing={isProcessing}
                />
              )}

              {/* Step 2: Review Text */}
              {currentStep === 2 && (
                <TextPreview
                  text={extractedText}
                  onTextChange={setExtractedText}
                  isProcessing={isProcessing}
                />
              )}

              {/* Step 3: Braille Options */}
              {currentStep === 3 && (
                <BrailleOptions
                  grade={brailleGrade}
                  onGradeChange={setBrailleGrade}
                  simplifyLayout={simplifyLayout}
                  onSimplifyChange={setSimplifyLayout}
                />
              )}

              {/* Step 4: Download */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  {/* Preview toggle */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Braille Preview</h2>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="show-dots" className="text-muted-foreground">
                        Show dot pattern
                      </Label>
                      <Switch
                        id="show-dots"
                        checked={showDots}
                        onCheckedChange={setShowDots}
                      />
                    </div>
                  </div>

                  <BraillePreview
                    braille={brailleOutput}
                    showDots={showDots}
                  />

                  <DownloadSection
                    braille={brailleOutput}
                    originalFilename={file?.name}
                    onDownload={handleDownload}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation buttons */}
        {!isProcessing && (
          <div className="flex justify-between items-center mt-6">
            {currentStep > 1 ? (
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="gap-2 min-h-[56px]"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                variant="default"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 min-h-[56px]"
              >
                {currentStep === 3 ? 'Convert to Braille' : 'Continue'}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={handleStartOver}
                className="gap-2 min-h-[56px]"
              >
                <RefreshCw className="w-5 h-5" aria-hidden="true" />
                Convert Another File
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
