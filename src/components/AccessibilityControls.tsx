import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ThemeSelector } from './ThemeSelector';
import { ConversionHistory } from './ConversionHistory';
import { setAudioEnabled, isAudioEnabled, initAudio, playFeedback } from '@/lib/audio-feedback';

export function AccessibilityControls() {
  const [audioOn, setAudioOn] = useState(isAudioEnabled());

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const toggleAudio = () => {
    const newState = !audioOn;
    setAudioOn(newState);
    setAudioEnabled(newState);
    if (newState) {
      initAudio();
      playFeedback('click');
    }
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Accessibility controls">
      <ConversionHistory />
      
      <ThemeSelector />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAudio}
            aria-label={audioOn ? 'Disable audio feedback' : 'Enable audio feedback'}
            aria-pressed={audioOn}
            className="min-w-[48px] min-h-[48px]"
          >
            {audioOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {audioOn ? 'Disable' : 'Enable'} audio feedback
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
