import { Layout } from '@/components/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';



const faqs = [
  {
    id: 'grade-difference',
    question: 'What is the difference between Grade 1 and Grade 2 Braille?',
    answer: `Grade 1 Braille (also called uncontracted Braille) represents each letter of the alphabet with a single Braille cell. It's a direct letter-by-letter translation and is often used for beginners learning Braille.

Grade 2 Braille (contracted Braille) uses special symbols and contractions to represent common words and letter combinations. For example, "the" is represented by a single cell instead of three. Grade 2 is more compact and is the standard form used in most Braille publications.

Both grades are valid and useful depending on the reader's familiarity with Braille.`,
  },
  {
    id: 'file-formats',
    question: 'Which file formats are supported?',
    answer: `For upload, BrailleBridge accepts common image formats including JPEG, PNG, and image-based PDFs. These are the most common formats for photos taken with phones or cameras.

For download, we offer three Braille file formats:
• BRF (Braille Ready Format): The most widely supported format, compatible with most Braille embossers
• DXP: A format used by specific embosser brands
• Unicode Braille: A text format that displays Braille characters on screen, useful for digital viewing`,
  },
  {
    id: 'data-storage',
    question: 'Is my data stored or saved?',
    answer: `No. BrailleBridge does not permanently store your documents or converted files on our servers. 

• Uploaded images are processed temporarily and then discarded
• Your conversion history is stored only in your browser's local storage on your own device
• We do not create accounts or track individual users
• No document content is retained after your session ends

Your privacy is respected. The tool is designed to process and return results without keeping copies of your materials.`,
  },
  {
    id: 'ocr-accuracy',
    question: 'How accurate is OCR?',
    answer: `OCR (Optical Character Recognition) accuracy depends on several factors:

• Image quality: Clear, well-lit photos produce better results
• Font type: Standard printed fonts are recognized more accurately than decorative or handwritten text
• Document condition: Clean documents without wrinkles, stains, or heavy shadows work best

For most printed documents with standard fonts, accuracy is high. However, we always recommend reviewing the extracted text before converting to Braille. The review step allows you to correct any errors.

OCR is not perfect, especially with poor image quality, unusual fonts, or handwriting. For critical documents, professional transcription may be needed.`,
  },
  {
    id: 'embossers-displays',
    question: 'Can this work with Braille embossers and displays?',
    answer: `Yes. The BRF and DXP file formats are designed to be compatible with Braille embossers, which are specialized printers that produce raised Braille dots on paper.

Refreshable Braille displays can also use these files, depending on the display's software. Many displays can read BRF files directly or through compatible reading applications.

If you use a specific embosser or display, check its documentation for supported file formats. BRF is the most universally compatible format.`,
  },
  {
    id: 'limitations',
    question: 'What are the current limitations?',
    answer: `BrailleBridge has several limitations to be aware of:

• Images only: Currently, text-based PDFs (like exported Word documents) are not directly supported. You would need to take a screenshot or photo of the page.
• Single images: Each conversion handles one image at a time. Multi-page documents require separate conversions.
• English focus: The Braille translation is primarily designed for English text. Other languages may not translate correctly.
• No formatting: Complex layouts, tables, and graphics are not preserved. Only the text content is converted.
• Accuracy: As mentioned, OCR accuracy varies. This tool should not be used as the sole method for critical or official documents without review.

This is a developing project, and improvements are ongoing.`,
  },
  {
    id: 'free-to-use',
    question: 'Is BrailleBridge free to use?',
    answer: `Yes. BrailleBridge is provided free of charge as an educational and social-impact project. There are no premium features, subscriptions, or hidden costs.

The tool is maintained as a non-commercial project with the goal of improving accessibility to printed materials.`,
  },
];

export default function FAQ() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Common questions about using BrailleBridge and understanding Braille conversion.
            </p>
          </div>

          {/* FAQ Accordion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-primary" aria-hidden="true" />
                Questions & Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact note */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Have a question that's not answered here? Visit our{' '}
                <a href="/reviews" className="text-primary underline hover:no-underline">
                  Reviews & Feedback
                </a>{' '}
                page to share your thoughts or questions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
