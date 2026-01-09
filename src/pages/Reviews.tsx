import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, AlertCircle, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Example feedback entries (clearly labeled)
const exampleFeedback = [
  {
    id: 1,
    name: 'Example User A',
    feedback:
      'The step-by-step process made it easy to understand what was happening at each stage. The preview feature was helpful for checking the output before downloading.',
    isExample: true,
  },
  {
    id: 2,
    name: 'Example User B',
    feedback:
      'I appreciated the high-contrast mode option. The keyboard navigation worked well with my screen reader. Would be great to support multiple pages in the future.',
    isExample: true,
  },
  {
    id: 3,
    name: 'Example User C',
    feedback:
      'Simple and straightforward. The OCR accuracy was good for printed text, though handwritten notes didn\'t work as well. Still a useful tool overall.',
    isExample: true,
  },
];

export default function Reviews() {
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        variant: 'destructive',
        title: 'Feedback required',
        description: 'Please enter your feedback before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate submission (in a real app, this would send to a backend)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Thank you!',
      description: 'Your feedback has been received. We appreciate your input.',
    });

    setName('');
    setFeedback('');
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Page header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">Reviews & Feedback</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              User feedback helps us improve BrailleBridge. Share your experience or read what others have said.
            </p>
          </div>

          {/* Disclaimer */}
          <Card className="border-warning/50 bg-warning/10">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Important Note</p>
                  <p className="text-muted-foreground">
                    BrailleBridge is an early-stage prototype. User testing is ongoing, 
                    and the feedback examples shown below are illustrative samples to 
                    demonstrate the feedback format. They do not represent real user 
                    testimonials.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example feedback */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
              Sample Feedback (Examples)
            </h2>
            <div className="grid gap-4">
              {exampleFeedback.map((item) => (
                <Card key={item.id} className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {item.name}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            (example entry)
                          </span>
                        </p>
                        <p className="text-muted-foreground">{item.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Feedback form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" aria-hidden="true" />
                Share Your Feedback
              </CardTitle>
              <CardDescription>
                Your input helps improve the tool. All feedback is welcome—positive, negative, 
                or suggestions for improvement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    Your Feedback <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Share your experience, suggestions, or questions..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  <Send className="w-4 h-4" aria-hidden="true" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
