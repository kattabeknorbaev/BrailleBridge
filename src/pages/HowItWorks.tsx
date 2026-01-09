import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Eye, Edit, Settings, Download, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Upload Your Document',
    icon: Upload,
    description:
      'Start by uploading a photo or image of your printed document. You can use your camera to take a picture or upload an existing image file.',
    details: [
      'Supported formats include JPEG, PNG, and PDF images',
      'For best results, ensure the document is well-lit and in focus',
      'The camera feature works on mobile devices and laptops with webcams',
    ],
  },
  {
    number: 2,
    title: 'Text Extraction',
    icon: Eye,
    description:
      'BrailleBridge uses optical character recognition (OCR) to read the text from your image. This process happens automatically after you upload.',
    details: [
      'OCR technology identifies letters, numbers, and punctuation',
      'The extracted text appears for you to review',
      'Processing typically takes a few seconds depending on document length',
    ],
  },
  {
    number: 3,
    title: 'Review and Edit',
    icon: Edit,
    description:
      'Before converting to Braille, you can review the extracted text and make corrections. This step ensures accuracy in the final output.',
    details: [
      'Fix any OCR errors or misread characters',
      'Remove unwanted headers, footers, or page numbers',
      'Add or modify text as needed',
    ],
  },
  {
    number: 4,
    title: 'Choose Braille Format',
    icon: Settings,
    description:
      'Select the Braille grade that best fits your needs. BrailleBridge supports both Grade 1 (uncontracted) and Grade 2 (contracted) Braille.',
    details: [
      'Grade 1 Braille: Each letter is represented by a single Braille cell (easier to learn)',
      'Grade 2 Braille: Uses contractions and shortcuts (more compact, commonly used)',
      'Optional layout simplification for cleaner output',
    ],
  },
  {
    number: 5,
    title: 'Download Ready-to-Use Files',
    icon: Download,
    description:
      'Generate Braille files in formats compatible with embossers and refreshable Braille displays.',
    details: [
      'BRF (Braille Ready Format): Standard format for most Braille embossers',
      'DXP: Format supported by specific embosser brands',
      'Unicode Braille: For display on screens and digital documents',
    ],
  },
];

export default function HowItWorks() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">How It Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, step-by-step process to convert your documents to Braille.
            </p>
          </div>

          {/* Process overview */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" aria-hidden="true" />
                <p>
                  The entire process takes just a few minutes. No account required, 
                  and your documents are processed securely without being stored.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <Card key={step.number}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {step.number}
                    </div>
                    <div className="flex items-center gap-3">
                      <step.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                      {step.title}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{step.description}</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    {step.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips section */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Good lighting:</strong> Natural or even lighting reduces shadows 
                  and improves text recognition accuracy.
                </li>
                <li>
                  <strong>Steady camera:</strong> Hold your camera still or use a flat 
                  surface to avoid blurry images.
                </li>
                <li>
                  <strong>Readable text:</strong> Printed text works better than handwriting. 
                  Clear fonts produce more accurate results.
                </li>
                <li>
                  <strong>Review carefully:</strong> Always check the extracted text before 
                  converting, especially for important documents.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
