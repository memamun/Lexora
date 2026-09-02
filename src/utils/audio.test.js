import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speak, cancelSpeech } from './audio';

describe('audio utility', () => {
  let mockSynthesis;
  let mockUtteranceConstructor;
  let voices;
  let originalSpeechSynthesis;
  let originalSpeechSynthesisUtterance;

  beforeEach(() => {
    voices = [
      { lang: 'es-ES', name: 'Spanish Voice' },
      { lang: 'en-US', name: 'Some English Voice' },
      { lang: 'en-US', name: 'Google US English' }
    ];

    mockSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => voices)
    };

    mockUtteranceConstructor = vi.fn();

    class MockSpeechSynthesisUtterance {
      constructor(text) {
        this.text = text;
        mockUtteranceConstructor(text);
      }
    }

    originalSpeechSynthesis = window.speechSynthesis;
    originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSynthesis,
      configurable: true,
      writable: true
    });

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockSpeechSynthesisUtterance,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: originalSpeechSynthesis,
      configurable: true,
      writable: true
    });

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: originalSpeechSynthesisUtterance,
      configurable: true,
      writable: true
    });
    vi.restoreAllMocks();
  });

  describe('speak', () => {
    it('should early return if window.speechSynthesis is unavailable', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        configurable: true,
        writable: true
      });
      speak('hello');
      expect(mockUtteranceConstructor).not.toHaveBeenCalled();
    });

    it('should cancel any ongoing speech before starting a new one', () => {
      speak('hello');
      expect(mockSynthesis.cancel).toHaveBeenCalled();
    });

    it('should configure utterance with text, lang, rate, and pitch', () => {
      speak('hello', 'en-GB');
      expect(mockUtteranceConstructor).toHaveBeenCalledWith('hello');

      const utteranceInstance = mockSynthesis.speak.mock.calls[0][0];
      expect(utteranceInstance.text).toBe('hello');
      expect(utteranceInstance.lang).toBe('en-GB');
      expect(utteranceInstance.rate).toBe(0.9);
      expect(utteranceInstance.pitch).toBe(1);
    });

    it('should prefer Google English voice', () => {
      speak('hello');
      const utteranceInstance = mockSynthesis.speak.mock.calls[0][0];
      expect(utteranceInstance.voice).toEqual({ lang: 'en-US', name: 'Google US English' });
    });

    it('should fallback to first English voice if Google English is unavailable', () => {
      voices = [
        { lang: 'es-ES', name: 'Spanish Voice' },
        { lang: 'en-GB', name: 'British Voice' },
      ];

      speak('hello');
      const utteranceInstance = mockSynthesis.speak.mock.calls[0][0];
      expect(utteranceInstance.voice).toEqual({ lang: 'en-GB', name: 'British Voice' });
    });

    it('should fallback to first voice if no English voice is available', () => {
      voices = [
        { lang: 'es-ES', name: 'Spanish Voice' },
        { lang: 'fr-FR', name: 'French Voice' },
      ];

      speak('hello');
      const utteranceInstance = mockSynthesis.speak.mock.calls[0][0];
      expect(utteranceInstance.voice).toEqual({ lang: 'es-ES', name: 'Spanish Voice' });
    });

    it('should not set voice if voices array is empty', () => {
      voices = [];

      speak('hello');
      const utteranceInstance = mockSynthesis.speak.mock.calls[0][0];
      expect(utteranceInstance.voice).toBeUndefined();
    });

    it('should call speechSynthesis.speak with the utterance', () => {
      speak('hello');
      expect(mockSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('cancelSpeech', () => {
    it('should call window.speechSynthesis.cancel() if available', () => {
      cancelSpeech();
      expect(mockSynthesis.cancel).toHaveBeenCalled();
    });

    it('should not throw if window.speechSynthesis is unavailable', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        configurable: true,
        writable: true
      });
      expect(() => cancelSpeech()).not.toThrow();
    });
  });
});
