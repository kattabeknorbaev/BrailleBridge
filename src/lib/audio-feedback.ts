// Audio feedback utilities for accessibility

type FeedbackType = 'success' | 'error' | 'upload' | 'processing' | 'complete' | 'click';

// Simple tone frequencies for different feedback types
const TONES: Record<FeedbackType, { frequency: number; duration: number; type: OscillatorType }[]> = {
  success: [
    { frequency: 523.25, duration: 100, type: 'sine' }, // C5
    { frequency: 659.25, duration: 100, type: 'sine' }, // E5
    { frequency: 783.99, duration: 150, type: 'sine' }, // G5
  ],
  error: [
    { frequency: 200, duration: 200, type: 'sawtooth' },
    { frequency: 150, duration: 300, type: 'sawtooth' },
  ],
  upload: [
    { frequency: 440, duration: 100, type: 'sine' }, // A4
    { frequency: 554.37, duration: 100, type: 'sine' }, // C#5
  ],
  processing: [
    { frequency: 440, duration: 50, type: 'sine' },
  ],
  complete: [
    { frequency: 523.25, duration: 80, type: 'sine' },
    { frequency: 659.25, duration: 80, type: 'sine' },
    { frequency: 783.99, duration: 80, type: 'sine' },
    { frequency: 1046.50, duration: 200, type: 'sine' }, // C6
  ],
  click: [
    { frequency: 800, duration: 30, type: 'sine' },
  ],
};

let audioContext: AudioContext | null = null;
let audioEnabled = true;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudio(): void {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

/**
 * Enable or disable audio feedback
 */
export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled;
}

/**
 * Check if audio feedback is enabled
 */
export function isAudioEnabled(): boolean {
  return audioEnabled;
}

/**
 * Play audio feedback
 */
export function playFeedback(type: FeedbackType): void {
  if (!audioEnabled || !audioContext) {
    return;
  }

  const tones = TONES[type];
  let startTime = audioContext.currentTime;

  for (const tone of tones) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, startTime);

    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + tone.duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + tone.duration / 1000);

    startTime += tone.duration / 1000;
  }
}

/**
 * Announce text to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = document.getElementById('aria-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  
  // Clear and set new message
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * Create the ARIA announcer element
 */
function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'aria-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * Combined feedback: play sound and announce
 */
export function feedback(
  type: FeedbackType,
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  playFeedback(type);
  announce(message, priority);
}
