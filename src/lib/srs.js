/**
 * Pure SRS next-review calculator (SM-2 variant).
 * Deterministic — no Date.now() coupling, mockable for tests.
 *
 * @param {{ ease_factor?: number, interval?: number, repetitions?: number, next_review?: string, last_review?: string, mastery_level?: string, confidence?: string }} review
 * @param {'instant'|'hesitated'|'forgot'} confidence
 * @returns {{ ease_factor: number, interval: number, repetitions: number, next_review: string, last_review: string, mastery_level: string, confidence: string }}
 */
export function calculateNextReview(review, confidence) {
  const now = new Date();
  let { ease_factor = 2.5, interval = 0, repetitions = 0 } = review;
  const quality = confidence === 'instant' ? 5 : confidence === 'hesitated' ? 3 : 1;

  if (quality >= 3) {
    if (repetitions === 0) interval = 0.25;
    else if (repetitions === 1) interval = quality === 5 ? 24 : 6;
    else interval = interval * ease_factor;
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = quality === 1 ? 0.05 : 0.25;
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const nextReview = new Date(now.getTime() + interval * 3600000);

  let mastery_level = 'new';
  if (repetitions >= 5 && interval > 168) mastery_level = 'mastered';
  else if (repetitions >= 2) mastery_level = 'reviewing';
  else if (repetitions >= 1) mastery_level = 'learning';

  return {
    ease_factor,
    interval,
    repetitions,
    next_review: nextReview.toISOString(),
    last_review: now.toISOString(),
    mastery_level,
    confidence,
  };
}
