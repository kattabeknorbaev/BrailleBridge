/**
 * Non-visual feedback: short tones for key events and announcements for
 * screen readers through a single polite live region.
 */

export type FeedbackType = 'success' | 'error' | 'upload' | 'processing' | 'complete' | 'click';

type Tone = { frequency: number; duration: number; type: OscillatorType };

const TONES: Record<FeedbackType, Tone[]> = {
  success: [
    { frequency: 523.25, duration: 90, type: 'sine' },
    { frequency: 659.25, duration: 90, type: 'sine' },
    { frequency: 783.99, duration: 140, type: 'sine' },
  ],
  error: [
    { frequency: 220, duration: 160, type: 'triangle' },
    { frequency: 165, duration: 240, type: 'triangle' },
  ],
  upload: [
    { frequency: 440, duration: 80, type: 'sine' },
    { frequency: 554.37, duration: 100, type: 'sine' },
  ],
  processing: [{ frequency: 440, duration: 50, type: 'sine' }],
  complete: [
    { frequency: 523.25, duration: 70, type: 'sine' },
    { frequency: 659.25, duration: 70, type: 'sine' },
    { frequency: 783.99, duration: 70, type: 'sine' },
    { frequency: 1046.5, duration: 180, type: 'sine' },
  ],
  click: [{ frequency: 800, duration: 25, type: 'sine' }],
};

const STORAGE_KEY = 'braillebridge:sounds';
let audioContext: AudioContext | null = null;
let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
})();

/** Create/resume the audio context; browsers require a user gesture first. */
export function initAudio(): void {
  if (!enabled) return;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  audioContext ??= new Ctx();
  if (audioContext.state === 'suspended') void audioContext.resume();
}

export function setAudioEnabled(value: boolean): void {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // ignore
  }
  if (value) initAudio();
}

export function isAudioEnabled(): boolean {
  return enabled;
}

export function playFeedback(type: FeedbackType): void {
  if (!enabled || !audioContext) return;
  let start = audioContext.currentTime;
  for (const tone of TONES[type]) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + tone.duration / 1000);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + tone.duration / 1000);
    start += tone.duration / 1000;
  }
}

/** Announce a message to screen readers without moving focus. */
export function announce(message: string): void {
  const region = document.getElementById('sr-announcer');
  if (!region) return;
  region.textContent = '';
  // A short delay makes repeated identical messages be read again.
  window.setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/** Tone + screen reader announcement. */
export function feedback(type: FeedbackType, message: string): void {
  playFeedback(type);
  announce(message);
}
