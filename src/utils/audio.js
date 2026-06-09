/**
 * Simple Speech Synthesis utility for Lexora
 */

export const speak = (text, lang = 'en-US') => {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower for better clarity
  utterance.pitch = 1;

  // Find a good English voice if possible
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                       voices.find(v => v.lang.startsWith('en')) || 
                       voices[0];
  
  if (englishVoice) utterance.voice = englishVoice;

  window.speechSynthesis.speak(utterance);
};

export const cancelSpeech = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
