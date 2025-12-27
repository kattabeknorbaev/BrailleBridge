import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Progress steps"
      className={cn('w-full', className)}
    >
      <ol className="flex items-center justify-between gap-2 md:gap-4">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <li
              key={step.id}
              className="flex-1 flex flex-col items-center text-center"
            >
              <div className="flex items-center w-full">
                {/* Connector line before */}
                {index > 0 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-colors duration-300',
                      isComplete || isCurrent ? 'bg-primary' : 'bg-border'
                    )}
                    aria-hidden="true"
                  />
                )}

                {/* Step circle */}
                <div
                  className={cn(
                    'step-dot flex-shrink-0',
                    isComplete && 'step-dot-complete',
                    isCurrent && 'step-dot-active',
                    isUpcoming && 'step-dot-inactive'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <Check className="w-6 h-6" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{step.id}</span>
                  )}
                </div>

                {/* Connector line after */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-colors duration-300',
                      isComplete ? 'bg-primary' : 'bg-border'
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 hidden md:block">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-300',
                    isCurrent && 'text-primary',
                    isComplete && 'text-success',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>

              {/* Mobile label */}
              <span className="sr-only md:hidden">
                Step {step.id}: {step.label} - {step.description}
                {isComplete && ' (Completed)'}
                {isCurrent && ' (Current)'}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Mobile current step info */}
      <div className="md:hidden mt-4 text-center" aria-hidden="true">
        <p className="text-lg font-semibold text-primary">
          Step {currentStep}: {steps.find(s => s.id === currentStep)?.label}
        </p>
        <p className="text-sm text-muted-foreground">
          {steps.find(s => s.id === currentStep)?.description}
        </p>
      </div>
    </nav>
  );
}
