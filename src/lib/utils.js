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
  const randomBuffer = new Uint32Array(1);
  for (let i = a.length - 1; i > 0; i--) {
    crypto.getRandomValues(randomBuffer);
    const fraction = randomBuffer[0] / (0xffffffff + 1);
    const j = Math.floor(fraction * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
