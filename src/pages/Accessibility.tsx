import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  Keyboard,
  Monitor,
  MessageCircle,
  Users,
  CheckCircle,
  Heart,
} from 'lucide-react';

const accessibilityFeatures = [
  {
    icon: Eye,
    title: 'Screen Reader Support',
    description:
      'BrailleBridge is built with semantic HTML, proper heading structure, and ARIA labels to work effectively with screen readers.',
    details: [
      'All interactive elements have descriptive labels',
      'Page regions are marked with ARIA landmarks',
      'Status updates are announced to screen readers',
      'Tested with NVDA, JAWS, and VoiceOver',
    ],
  },
  {
    icon: Keyboard,
    title: 'Full Keyboard Navigation',
    description:
      'Every feature can be accessed using only a keyboard. No mouse required.',
    details: [
      'Tab key navigates between interactive elements',
      'Enter and Space activate buttons and controls',
      'Skip links allow jumping to main content',
      'Clear focus indicators show current position',
    ],
  },
  {
    icon: Monitor,
    title: 'Display Modes',
    description:
      'Multiple display options to accommodate different visual needs and preferences.',
    details: [
      'Dark mode (default): Reduced brightness for comfortable viewing',
      'Light mode: High contrast light background',
      'High-contrast mode: Yellow on black for low-vision users',
      'Text remains readable across all modes',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Plain-Language Communication',
    description:
      'Instructions and error messages are written in clear, simple language.',
    details: [
      'Jargon-free explanations throughout the interface',
      'Error messages explain what went wrong and what to do',
      'Step-by-step guidance through the conversion process',
      'Helpful tips provided at each stage',
    ],
  },
  {
    icon: Users,
    title: 'Designed for Blind and Low-Vision Users',
    description:
      'The primary audience for BrailleBridge includes blind and low-vision users who need access to printed materials in Braille.',
    details: [
      'Large touch targets (minimum 48px) for easy interaction',
      'Readable text sizes (18px base) throughout',
      'Consistent layout and predictable navigation',
      'Audio feedback for key actions',
    ],
  },
];

export default function Accessibility() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Accessibility Commitment</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              BrailleBridge is designed with accessibility as a core principle, not an afterthought.
            </p>
          </div>

          {/* Statement */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Our Commitment</p>
                  <p className="text-muted-foreground">
                    Accessibility is not a feature—it's a fundamental requirement. Every design 
                    decision in BrailleBridge prioritizes the needs of blind and visually impaired 
                    users. We believe everyone deserves equal access to information, and we're 
                    committed to making that a reality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Accessibility Features</h2>
            <div className="grid gap-6">
              {accessibilityFeatures.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle
                            className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Standards */}
          <Card>
            <CardHeader>
              <CardTitle>Standards and Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                BrailleBridge aims to meet or exceed the following accessibility standards:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>WCAG 2.1 Level AA:</strong> Web Content Accessibility Guidelines 
                  covering perceivable, operable, understandable, and robust content
                </li>
                <li>
                  <strong>Section 508:</strong> US federal accessibility requirements for 
                  electronic and information technology
                </li>
                <li>
                  <strong>ARIA Best Practices:</strong> Proper use of Accessible Rich 
                  Internet Applications specifications
                </li>
              </ul>
              <p>
                We continuously work to improve accessibility. If you encounter any barriers 
                or have suggestions, please share them through our{' '}
                <a href="/reviews" className="text-primary underline hover:no-underline">
                  feedback page
                </a>
                .
              </p>
            </CardContent>
          </Card>

          {/* Ongoing improvements */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Ongoing Improvements</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Accessibility is an ongoing effort. We're committed to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Regular testing with assistive technologies</li>
                <li>Incorporating user feedback from the disability community</li>
                <li>Updating the interface as accessibility standards evolve</li>
                <li>Documenting our accessibility features transparently</li>
              </ul>
              <p className="mt-4">
                This page will be updated as new features and improvements are implemented.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
