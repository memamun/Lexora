import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speak } from './audio';

describe('audio utility', () => {
  let originalSpeechSynthesis;
  let originalSpeechSynthesisUtterance;
  let mockSpeak;
  let mockCancel;
  let mockGetVoices;

  beforeEach(() => {
    // Save originals
    originalSpeechSynthesis = window.speechSynthesis;
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    // Setup mocks
    mockSpeak = vi.fn();
    mockCancel = vi.fn();
    mockGetVoices = vi.fn().mockReturnValue([]);

    window.speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: mockGetVoices,
    };

    window.SpeechSynthesisUtterance = vi.fn().mockImplementation(function(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.voice = null;
    });
  });

  afterEach(() => {
    // Restore originals
    window.speechSynthesis = originalSpeechSynthesis;
    window.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    vi.clearAllMocks();
  });

  it('should return early if window.speechSynthesis is not available', () => {
    delete window.speechSynthesis;
    speak('test');
    // If it didn't throw and no errors occurred, it successfully returned early.
    expect(window.SpeechSynthesisUtterance).not.toHaveBeenCalled();
  });

  it('should cancel ongoing speech before speaking', () => {
    speak('test');
    expect(mockCancel).toHaveBeenCalled();
  });

  it('should create a SpeechSynthesisUtterance with the correct text, lang, rate, and pitch', () => {
    speak('hello', 'en-US');
    expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('hello');

    // We can't directly check the properties of the instantiated object since it's passed directly to speak,
    // but we can check the argument passed to window.speechSynthesis.speak
    expect(mockSpeak).toHaveBeenCalled();
    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.text).toBe('hello');
    expect(utteranceArg.lang).toBe('en-US');
    expect(utteranceArg.rate).toBe(0.9);
    expect(utteranceArg.pitch).toBe(1);
  });

  it('should assign a Google English voice if available', () => {
    const mockVoices = [
      { name: 'Some other voice', lang: 'fr-FR' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Apple English', lang: 'en-GB' }
    ];
    mockGetVoices.mockReturnValue(mockVoices);

    speak('hello');

    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.voice).toEqual(mockVoices[1]);
  });

  it('should assign a generic English voice if Google English is not available', () => {
    const mockVoices = [
      { name: 'Some other voice', lang: 'fr-FR' },
      { name: 'Apple English', lang: 'en-GB' }
    ];
    mockGetVoices.mockReturnValue(mockVoices);

    speak('hello');

    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.voice).toEqual(mockVoices[1]);
  });

  it('should assign the first voice if no English voices are available', () => {
    const mockVoices = [
      { name: 'Some other voice', lang: 'fr-FR' },
      { name: 'Another voice', lang: 'es-ES' }
    ];
    mockGetVoices.mockReturnValue(mockVoices);

    speak('hello');

    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.voice).toEqual(mockVoices[0]);
  });

  it('should not assign a voice if no voices are available', () => {
    mockGetVoices.mockReturnValue([]);

    speak('hello');

    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.voice).toBeNull();
  });

  it('should use default language en-US if none is provided', () => {
    speak('hello');
    const utteranceArg = mockSpeak.mock.calls[0][0];
    expect(utteranceArg.lang).toBe('en-US');
  });
});
