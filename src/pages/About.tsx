import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, Users, Target, AlertTriangle } from 'lucide-react';

export default function About() {
  useEffect(() => {
    document.title = "About | BrailleBridge";
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">About BrailleBridge</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bridging the gap between printed materials and Braille accessibility.
            </p>
          </div>

          {/* The Problem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="w-6 h-6 text-primary" aria-hidden="true" />
                The Problem We Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Millions of printed documents—books, worksheets, forms, and notes—remain 
                inaccessible to blind and visually impaired readers. Converting these 
                materials to Braille often requires expensive software, specialized 
                training, or professional transcription services.
              </p>
              <p>
                This creates a significant barrier for students, educators, and 
                individuals who need quick access to printed information in a format 
                they can read independently.
              </p>
            </CardContent>
          </Card>

          {/* Why BrailleBridge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" aria-hidden="true" />
                Why BrailleBridge Exists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                BrailleBridge was built to provide a simple, free tool that helps 
                convert printed documents to Braille-ready files. The goal is to 
                reduce the time and effort needed to make materials accessible.
              </p>
              <p>
                By combining optical character recognition (OCR) with Braille 
                translation, BrailleBridge allows users to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Take a photo of a document and extract the text automatically</li>
                <li>Review and edit the extracted text before conversion</li>
                <li>Choose between Grade 1 and Grade 2 Braille</li>
                <li>Download files compatible with Braille embossers and displays</li>
              </ul>
            </CardContent>
          </Card>

          {/* Current Limitations */}
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-warning" aria-hidden="true" />
                Current Limitations (v1.1)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We believe in being transparent about what BrailleBridge can and cannot do. 
                Here are the current limitations of this version:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Unsupported Content Types</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Mathematical equations and formulas (Nemeth Code not yet supported)</li>
                    <li>Music notation (Music Braille not yet supported)</li>
                    <li>Complex tables and multi-column layouts may not preserve structure</li>
                    <li>Handwritten text recognition is limited</li>
                    <li>Languages other than English are not currently supported</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">OCR Accuracy Depends On</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Image quality and resolution (higher is better)</li>
                    <li>Lighting conditions when photographing documents</li>
                    <li>Print clarity and font legibility</li>
                    <li>Document condition (creases, stains may affect results)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Scope Boundaries</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>This tool is designed for personal and educational use</li>
                    <li>Not intended to replace professional Braille transcription for critical materials</li>
                    <li>Output should be reviewed before use in formal educational settings</li>
                    <li>File size limited to 20MB per upload</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm italic">
                We are actively working to improve these areas in future versions. 
                Your feedback helps us prioritize what to address next.
              </p>
            </CardContent>
          </Card>

          {/* Accessibility-First Design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" aria-hidden="true" />
                Accessibility-First Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                BrailleBridge is designed with accessibility as the primary 
                consideration, not an afterthought. Every feature has been built 
                with blind and low-vision users in mind:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full keyboard navigation throughout the application</li>
                <li>Screen reader support with proper ARIA labels and landmarks</li>
                <li>High-contrast display mode for low-vision users</li>
                <li>Clear, plain-language error messages and instructions</li>
                <li>Large touch targets and readable text sizes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Project Note */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" aria-hidden="true" />
                About This Project
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                BrailleBridge was built as an educational and social-impact project. 
                It is not a commercial product. The tool is provided free of charge 
                with the hope that it can help improve access to printed materials 
                for those who need Braille.
              </p>
              <p className="mt-4">
                We acknowledge that this is a developing tool with limitations. 
                Professional Braille transcription services remain important for 
                critical materials that require certified accuracy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
