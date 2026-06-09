import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speak } from './audio';

describe('audio util: speak', () => {
  let originalSpeechSynthesis;
  let originalSpeechSynthesisUtterance;
  let mockCancel;
  let mockSpeak;
  let mockGetVoices;

  beforeEach(() => {
    originalSpeechSynthesis = window.speechSynthesis;
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    mockCancel = vi.fn();
    mockSpeak = vi.fn();
    mockGetVoices = vi.fn().mockReturnValue([]);

    window.speechSynthesis = {
      cancel: mockCancel,
      speak: mockSpeak,
      getVoices: mockGetVoices
    };

    window.SpeechSynthesisUtterance = vi.fn().mockImplementation(function(text) {
      this.text = text;
    });
  });

  afterEach(() => {
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    vi.clearAllMocks();
  });

  it('does nothing if window.speechSynthesis is undefined', () => {
    delete window.speechSynthesis;
    speak('test');
    expect(window.SpeechSynthesisUtterance).not.toHaveBeenCalled();
  });

  it('cancels any ongoing speech', () => {
    speak('test');
    expect(mockCancel).toHaveBeenCalled();
  });

  it('creates an utterance with correct default properties', () => {
    speak('Hello world');
    expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello world');

    // Check properties that were set on the created instance
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.text).toBe('Hello world');
    expect(utteranceInstance.lang).toBe('en-US');
    expect(utteranceInstance.rate).toBe(0.9);
    expect(utteranceInstance.pitch).toBe(1);
  });

  it('allows overriding language', () => {
    speak('Hola', 'es-ES');
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.lang).toBe('es-ES');
  });

  it('selects Google English voice if available', () => {
    const googleVoice = { lang: 'en-US', name: 'Google US English' };
    const otherVoice = { lang: 'en-US', name: 'Other English' };
    mockGetVoices.mockReturnValue([otherVoice, googleVoice]);

    speak('Hello');
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.voice).toBe(googleVoice);
  });

  it('falls back to any English voice if Google voice is not available', () => {
    const spanishVoice = { lang: 'es-ES', name: 'Spanish' };
    const otherEnglishVoice = { lang: 'en-GB', name: 'UK English' };
    mockGetVoices.mockReturnValue([spanishVoice, otherEnglishVoice]);

    speak('Hello');
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.voice).toBe(otherEnglishVoice);
  });

  it('falls back to the first available voice if no English voice is found', () => {
    const spanishVoice = { lang: 'es-ES', name: 'Spanish' };
    const frenchVoice = { lang: 'fr-FR', name: 'French' };
    mockGetVoices.mockReturnValue([spanishVoice, frenchVoice]);

    speak('Hello');
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.voice).toBe(spanishVoice);
  });

  it('does not set voice if no voices are available', () => {
    mockGetVoices.mockReturnValue([]);

    speak('Hello');
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.voice).toBeUndefined();
  });

  it('calls speechSynthesis.speak with the created utterance', () => {
    speak('Hello');
    expect(mockSpeak).toHaveBeenCalled();
    const utteranceInstance = mockSpeak.mock.calls[0][0];
    expect(utteranceInstance.text).toBe('Hello');
  });
});
