import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = window.self !== window.top;

/**
 * Fisher-Yates shuffle (mutates a copy, returns new array)
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a multiple-choice question object for a given word.
 */
export function buildMCQ(word) {
  const correct = word.options?.[word.answer] || word.answer;
  const allOptions = Object.values(word.options || {}).filter(Boolean);
  return {
    word: word.word,
    correct,
    explanation: word.explanation,
    options: shuffle(allOptions),
    index: word.index,
  };
}
