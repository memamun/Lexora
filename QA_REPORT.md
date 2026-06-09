# Production QA & Security Report

## 1. Data Loss for High-Volume Users (MAX_REVIEWS_FETCH)
- **Severity:** Critical
- **Reproduction Steps:** 1. Study more than 100 words.
2. Reload the app.
3. Observe that words beyond the 100th are missing.
- **Root Cause:** db.entities.WordReview.list fetches a hardcoded MAX_REVIEWS_FETCH (100) records. Additional reviews are dropped from memory.
- **User Impact:** Power users lose their spaced repetition progress, streaks, and mastery levels for older words.
- **Business Impact:** High churn rate among the most dedicated users. Complete loss of trust.
- **Exact Fix:** Increase MAX_REVIEWS_FETCH, implement pagination in loadData(), or use an unbounded query for user data.
- **Regression Test:** Create 150 mock WordReview documents. Assert that loadData() retrieves all 150 and correctly populates the cache.

## 2. Security Vulnerability: Firestore 1MB Data Injection
- **Severity:** Critical
- **Reproduction Steps:** 1. Authenticate to Firebase.
2. Execute a direct Firestore REST API call to write a 1MB string to `users/{userId}/WordReview/malicious_doc`.
3. Observe the write succeeds.
- **Root Cause:** firestore.rules allows write access up to 1MB under `/{document=**}`, overriding the stricter 10KB rule for WordReview due to Firestore's 'allow if ANY rule matches' logic.
- **User Impact:** No immediate UX impact, but bad actors can fill the database.
- **Business Impact:** Massive cost explosion (Firebase billing), potential denial of service.
- **Exact Fix:** Remove the `/{document=**}` wildcard rule and explicitly define rules for each subcollection.
- **Regression Test:** Write a unit test using @firebase/rules-unit-testing to assert that writing a 50KB document to WordReview is denied.

## 3. Offline Progress Lost due to null Batch Commit
- **Severity:** Critical
- **Reproduction Steps:** 1. Disconnect network.
2. Complete a level quiz.
3. Restart app.
4. Observe quiz progress is lost.
- **Root Cause:** In `src/lib/db.js`, `batchCommit` returns null if `getFirestoreDb()` is null (offline/unconfigured), completely bypassing the `localDb` fallback mechanism.
- **User Impact:** Users studying offline lose all progress permanently.
- **Business Impact:** Negative app store reviews, users abandon app when offline usage fails.
- **Exact Fix:** Implement a `localDb` fallback inside `batchCommit` to write to localStorage when Firestore is unavailable.
- **Regression Test:** Mock `getFirestoreDb` to return null. Call `batchCommit` and assert that localStorage contains the updated entities.

## 4. Firestore Offline Persistence Disabled
- **Severity:** High
- **Reproduction Steps:** 1. Load app while online.
2. Turn off Wi-Fi/Cellular.
3. Attempt to fetch levels.
4. App throws network error or loads empty arrays.
- **Root Cause:** Firebase SDK is initialized in `firebase.js` but `enableIndexedDbPersistence` is never called, meaning Firestore offline cache is not utilized.
- **User Impact:** App appears broken or empty when launched in a subway or airplane.
- **Business Impact:** Reduced engagement from commuters, a key demographic for learning apps.
- **Exact Fix:** Add `enableIndexedDbPersistence(firestoreInstance)` in `db.js` initialization.
- **Regression Test:** Disable network in Playwright, load app, verify previously loaded data is visible.

## 5. Auth State Leak Across Tabs
- **Severity:** Medium
- **Reproduction Steps:** 1. Open app in Tab A and Tab B.
2. Logout in Tab A.
3. Switch to Tab B, observe user is logged out but data is still visible.
- **Root Cause:** `onFirebaseAuthChange` sets user to null but does not call `clearStudyEngineCache()` for passive tab updates, leaving stale user data in memory.
- **User Impact:** Privacy violation if a shared device is used; user B can see user A's study data.
- **Business Impact:** Privacy complaints, potential GDPR/CCPA issues.
- **Exact Fix:** Add `clearStudyEngineCache()` inside the `else` block of `onFirebaseAuthChange` when `firebaseUser` is null.
- **Regression Test:** Automate a multi-context test: Login, open two tabs, logout in one, assert second tab's memory cache is cleared.

## 6. Stale Cache on Remount (Data Reversion)
- **Severity:** Critical
- **Reproduction Steps:** 1. Complete a review.
2. Navigate to Analytics, then back to Dashboard within 60 seconds.
3. Progress reverts to old state.
- **Root Cause:** `_cache` object in `useStudyEngine.jsx` is not updated during `setReviews`/`setLevelProgress` mutations, only during `loadData`. Fast remounts load the stale `_cache`.
- **User Impact:** User feels gaslit as their progress randomly disappears and reappears.
- **Business Impact:** Severe UX degradation, high support ticket volume.
- **Exact Fix:** Update `_cache` explicitly inside the `if (usResult.id)` batch commit success block.
- **Regression Test:** Review a word, unmount provider, remount provider, assert review state is preserved without network call.

## 7. Unbounded growth of Daily Reviews object
- **Severity:** Medium
- **Reproduction Steps:** 1. Study daily for 100 days.
2. Observe `stats.daily_reviews` continues to grow despite pruning logic.
- **Root Cause:** `pruneOldDaily` is called, but the result is merged back into the full stats incorrectly if `currentStats` contains unpruned keys.
- **User Impact:** Performance degradation over time, localStorage quota eventually exceeded.
- **Business Impact:** Long-term users experience crashes.
- **Exact Fix:** Ensure `statsUpdate` assigns the strictly pruned object rather than merging with the raw `currentStats.daily_reviews`.
- **Regression Test:** Mock `daily_reviews` with 150 days of data, run a review, assert object length is exactly 90.

## 8. Race condition in async queue returning undefined
- **Severity:** High
- **Reproduction Steps:** 1. Rapidly tap 'Got it' on two flashcards.
2. The second tap resolves immediately while the first is processing.
- **Root Cause:** `recordReview` is an async function that returns immediately if `recordReviewRef.current` is true, resolving with `undefined` instead of awaiting queue completion.
- **User Impact:** UI components relying on the promise to update local state will desync and show incorrect animations.
- **Business Impact:** Glitches in UI, perceived lack of polish.
- **Exact Fix:** Return a Promise that resolves when the specific queued item is processed (e.g., using a deferred promise pattern).
- **Regression Test:** Call `recordReview` twice synchronously. Await both. Assert both promises resolve only after DB writes.

## 9. LocalStorage Quota Crash not handled gracefully
- **Severity:** High
- **Reproduction Steps:** 1. Fill browser localStorage to 5MB.
2. Attempt to save progress.
3. App crashes or behaves unpredictably.
- **Root Cause:** `safeSaveList` catches the error and returns false, but callers like `db.entities.LevelProgress.create` assume an object with an `id` is returned.
- **User Impact:** Silent failures followed by loud crashes when undefined IDs are accessed.
- **Business Impact:** Data loss and app crashes.
- **Exact Fix:** Throw a custom `StorageQuotaError` and catch it in UI to prompt the user, or gracefully degrade to in-memory only.
- **Regression Test:** Mock `localStorage.setItem` to throw QuotaExceededError. Assert app shows banner and doesn't crash.

## 10. Memory Leak in Capacitor Back Button
- **Severity:** Medium
- **Reproduction Steps:** 1. On Android, navigate between 10 pages.
2. Observe memory consumption.
- **Root Cause:** `[location, navigate]` in `useEffect` dependency array causes the `backButton` listener to be rapidly removed and added, but `.remove()` is asynchronous.
- **User Impact:** App slows down and eventually crashes on low-end Android devices.
- **Business Impact:** High crash rate on Google Play Vitals.
- **Exact Fix:** Use a mutable ref to store `location.pathname` and `navigate` so the listener never needs to be recreated.
- **Regression Test:** Navigate 50 times in an automated test. Assert active listeners count remains 1.

## 11. React Router navigate() during render phase
- **Severity:** Medium
- **Reproduction Steps:** 1. Simulate an auth error during initial load.
2. React throws a warning/error about state updates during render.
- **Root Cause:** `if (authError.type === 'auth_required') { navigate('/login'); return null; }` violates React's pure render rule.
- **User Impact:** Console errors, potential infinite loops in strict mode.
- **Business Impact:** Technical debt, potential performance issues.
- **Exact Fix:** Wrap `navigate` in a `useEffect` or return `<Navigate to='/login' />`.
- **Regression Test:** Trigger auth error, assert no console.error is thrown by React.

## 12. Corrupted Favorites JSON crashes app
- **Severity:** Medium
- **Reproduction Steps:** 1. Open DevTools, set `lexora-favorites` to `[object Object]`.
2. Reload app.
3. `getFavorites()` returns `[]`, but `toggleFavorite` saves corrupted state.
- **Root Cause:** `JSON.parse` failure returns `[]`, which is fine, but it allows the corrupt data to be overwritten silently, losing all previous valid favorites.
- **User Impact:** User loses all bookmarked words if a browser extension or glitch corrupts the string.
- **Business Impact:** Frustration and loss of customized learning paths.
- **Exact Fix:** Implement a robust schema validation (e.g., Zod) and backup corrupted data to a recovery key before overwriting.
- **Regression Test:** Set local storage to invalid JSON, call toggleFavorite, assert previous valid data isn't permanently unrecoverable.

## 13. Stale Stats in Queue (Total Reviews Bug)
- **Severity:** High
- **Reproduction Steps:** 1. Tap two flashcards rapidly.
2. Total reviews increments by 1 instead of 2.
- **Root Cause:** The second queued call to `_recordReview` reads `stats` from the component's outer closure, which hasn't updated yet.
- **User Impact:** Analytics and streaks are calculated incorrectly. Gamification is broken.
- **Business Impact:** Users complain their stats are inaccurate.
- **Exact Fix:** Use functional state updates `setStats(prev => ...)` to calculate all derivations instead of reading closure variables.
- **Regression Test:** Queue 5 reviews. Assert `total_reviews` increments by exactly 5.

## 14. Double-click advances SRS twice
- **Severity:** Medium
- **Reproduction Steps:** 1. Double-tap the 'Hard' button on a flashcard.
2. The word's interval increases twice.
- **Root Cause:** No debounce on the UI buttons, and the queueing system faithfully processes the same word twice against the same starting state.
- **User Impact:** Words disappear for months because their intervals grew too fast.
- **Business Impact:** Learning algorithm is compromised, effectiveness of app drops.
- **Exact Fix:** Add a `processingWords` Set to block concurrent updates for the same `wordIndex`.
- **Regression Test:** Dispatch two rapid clicks. Assert DB is updated only once.

## 15. window.confirm blocking on Android hardware back
- **Severity:** High
- **Reproduction Steps:** 1. Press hardware back button on Android root route.
2. App freezes or ignores input.
- **Root Cause:** Capacitor WebViews handle `window.confirm` poorly when triggered from native events; often the UI thread is blocked or the dialog doesn't paint.
- **User Impact:** App appears frozen. User has to force kill.
- **Business Impact:** 1-star reviews for 'app freezing'.
- **Exact Fix:** Use Capacitor's `@capacitor/dialog` plugin to show native alerts instead of `window.confirm`.
- **Regression Test:** Trigger back button event, assert native Dialog.confirm is called.

## 16. Offline Auth Timeout overwrites local data
- **Severity:** High
- **Reproduction Steps:** 1. Launch offline.
2. `waitForAuth` times out after 10s.
3. App falls back to empty `localDb`.
4. User completes level, overwriting any previous localDb data.
- **Root Cause:** Timeout assumes 'no user' instead of 'network slow', decoupling the session from the actual Firebase user.
- **User Impact:** Progress is fragmented between 'offline ghost user' and 'online user'.
- **Business Impact:** High friction and data inconsistencies.
- **Exact Fix:** Check `indexedDB` for cached Firebase auth tokens before giving up, or block the app with a 'Network Required for Login' screen.
- **Regression Test:** Throttle network to 1kbps. Assert app handles timeout without creating a ghost profile.

## 17. SecurityError on window.top in iframes
- **Severity:** Medium
- **Reproduction Steps:** 1. Embed the app in an iframe on a different domain.
2. App crashes on load.
- **Root Cause:** `isIframe = window.self !== window.top` throws a cross-origin DOMException in many modern browsers.
- **User Impact:** App fails to load entirely in embedded contexts.
- **Business Impact:** Partnerships or web embeds fail to function.
- **Exact Fix:** Wrap the check in a `try...catch` block and default to true if it throws.
- **Regression Test:** Run in cross-origin iframe context, assert no unhandled DOMException.

## 18. Crashlytics native module missing
- **Severity:** Medium
- **Reproduction Steps:** 1. Run on Android.
2. Trigger a fatal JS error.
3. Check Firebase console.
- **Root Cause:** `getCrashlytics(app)` is the web implementation. Capacitor apps require native plugin wiring to capture NDK/Java/Swift crashes.
- **User Impact:** Native crashes (OOM, plugin failures) are entirely blind to developers.
- **Business Impact:** SREs cannot debug production crashes.
- **Exact Fix:** Implement `@capacitor-community/firebase-crashlytics` conditionally for native platforms.
- **Regression Test:** Simulate native crash, verify Crashlytics webhook receives payload.

## 19. useNetworkStatus memory leak
- **Severity:** Low
- **Reproduction Steps:** 1. Disconnect and reconnect network 50 times quickly.
2. Unmount component.
- **Root Cause:** `setTimeout` in `handleOnline` is not tracked and cleared on unmount.
- **User Impact:** Minor memory leak and potential React state update on unmounted component error.
- **Business Impact:** Cluttered logs, slight performance degradation.
- **Exact Fix:** Store timeout ID in a ref and `clearTimeout` on unmount.
- **Regression Test:** Toggle network, unmount, assert no warnings in console.

## 20. Unhandled ChunkLoadError
- **Severity:** High
- **Reproduction Steps:** 1. Deploy new version.
2. User clicks 'Analytics' on an old session.
3. Blank white screen.
- **Root Cause:** Lazy loading `import('@/pages/Analytics')` throws if the JS chunk is missing. `ErrorBoundary` catches it but requires manual reload.
- **User Impact:** Disruptive UX during deployments.
- **Business Impact:** Spikes in error rates during CI/CD deployments.
- **Exact Fix:** Wrap lazy imports in a retry function that automatically reloads the page once if a chunk fails.
- **Regression Test:** Delete chunk file dynamically, trigger navigation, assert app auto-recovers.

## 21. Batch Write > 500 Limit Error
- **Severity:** Medium
- **Reproduction Steps:** 1. Be offline for 2 days. Complete 200 flashcards.
2. Go online.
3. App attempts to sync.
- **Root Cause:** `batchCommit` adds operations indefinitely. 200 cards * 3 ops/card = 600 ops. Firebase throws 'Maximum batch size is 500'.
- **User Impact:** Sync fails permanently, trapping user in offline mode.
- **Business Impact:** Critical data loss for heavy offline users.
- **Exact Fix:** Chunk the `ops` array into slices of 500 and `await Promise.all` on multiple batches.
- **Regression Test:** Generate 600 mock operations, call batchCommit, assert 2 distinct network requests are made.

## 22. Streak computation ignores timezone/DST
- **Severity:** Medium
- **Reproduction Steps:** 1. User studies at 11:30 PM.
2. Daylight saving time changes.
3. User studies at 12:30 AM.
- **Root Cause:** `86400000` ms is hardcoded for day calculation in various places instead of using robust date libraries like `date-fns`.
- **User Impact:** Streaks break unfairly.
- **Business Impact:** Users complain to support, lose motivation.
- **Exact Fix:** Use `startOfDay()` from `date-fns` for streak calculations.
- **Regression Test:** Mock system time to DST boundary, simulate reviews, assert streak continues.

## 23. Missing input validation on Quiz Score
- **Severity:** Low
- **Reproduction Steps:** 1. Intercept network request.
2. Send `score: 1000` for a level with 20 words.
- **Root Cause:** `db.entities.QuizAttempt.create` accepts arbitrary score integers.
- **User Impact:** Leaderboards or analytics are easily poisoned.
- **Business Impact:** Loss of competitive integrity.
- **Exact Fix:** Add Firestore rules to cap `score` at `WORDS_PER_LEVEL`, and validate in `recordLevelQuiz`.
- **Regression Test:** Submit score of 999, assert rejection by backend/rules.

## 24. Missing CSRF / Rate Limit on Signup
- **Severity:** Medium
- **Reproduction Steps:** 1. Script a loop calling `firebaseEmailSignUp`.
2. Create 10,000 accounts.
- **Root Cause:** No App Check or reCAPTCHA is configured on the Firebase Auth instance.
- **User Impact:** No direct UX impact until quotas hit.
- **Business Impact:** SMS/Email quota exhaustion, massive billing spike.
- **Exact Fix:** Enable Firebase App Check with Play Integrity (Android) and reCAPTCHA v3 (Web).
- **Regression Test:** Attempt 10 signups in 1 second, assert 429 Too Many Requests.

## 25. Level Progress Race Condition
- **Severity:** High
- **Reproduction Steps:** 1. Open app on Phone and Tablet simultaneously.
2. Complete level 2 on Phone, complete level 3 on Tablet.
- **Root Cause:** Level progress uses read-modify-write without Firestore transactions. Tablet overwrites Phone's progress.
- **User Impact:** Multi-device users experience desynced progress.
- **Business Impact:** Frustration and loss of trust.
- **Exact Fix:** Use `runTransaction` for level and stats updates.
- **Regression Test:** Simulate concurrent writes to LevelProgress, assert both unlock flags merge correctly.

## 26. Memory leak in audio play (speak)
- **Severity:** Medium
- **Reproduction Steps:** 1. Play word audio.
2. Quickly navigate back.
3. Audio continues playing or throws DOM error.
- **Root Cause:** `speak()` from `utils/audio.js` likely uses `SpeechSynthesis` without cancellation on unmount.
- **User Impact:** Audio overlapping, ghost voices playing on wrong screens.
- **Business Impact:** Annoying UX.
- **Exact Fix:** Export a `cancelAudio()` function and call it in `useEffect` cleanup of `WordDetail`.
- **Regression Test:** Trigger audio, unmount component, assert `speechSynthesis.cancel()` is called.

## 27. QuizAttempt payload size bloat
- **Severity:** Low
- **Reproduction Steps:** 1. Fail 200 words in a massive custom quiz (if feature exists).
2. `wrong_word_indices` array grows large.
- **Root Cause:** While limited to WORDS_PER_LEVEL currently, no hard limit in rules means future updates could cause payload rejections.
- **User Impact:** None currently, technical debt.
- **Business Impact:** Minor.
- **Exact Fix:** Add array length validation in Firestore rules.
- **Regression Test:** Submit array of 1000 items, assert rejection.

## 28. Popup Closed By User edge case
- **Severity:** Low
- **Reproduction Steps:** 1. Click Login with Google.
2. Immediately close popup.
3. Error state is set.
- **Root Cause:** `auth/popup-closed-by-user` is caught and throws a generic error, but doesn't reset loading state correctly if unhandled upstream.
- **User Impact:** Infinite loading spinner on login page.
- **Business Impact:** User must refresh to try again.
- **Exact Fix:** Ensure `setIsLoadingAuth(false)` is always called in `finally` block in component.
- **Regression Test:** Mock popup closure, assert loading spinner disappears.

## 29. Weak Password Policy
- **Severity:** Medium
- **Reproduction Steps:** 1. Register with password '123456'.
2. Success.
- **Root Cause:** Firebase Auth default allows 6-character passwords. App doesn't enforce stricter checks locally.
- **User Impact:** User accounts are easily compromised via credential stuffing.
- **Business Impact:** Data breaches, support tickets.
- **Exact Fix:** Add client-side regex for strong passwords and enforce in Firebase Identity Platform settings.
- **Regression Test:** Attempt registration with '123456', assert client-side validation error.

## 30. Base44 API Token stored in LocalStorage
- **Severity:** High
- **Reproduction Steps:** 1. Exploit an XSS vulnerability (e.g. via malicious word.example).
2. Read `localStorage.getItem('base44_access_token')`.
- **Root Cause:** Access tokens are stored in plain text localStorage instead of secure HttpOnly cookies or Capacitor Secure Storage.
- **User Impact:** Complete account takeover if XSS is achieved.
- **Business Impact:** Severe security breach.
- **Exact Fix:** Move token storage to `SecureStoragePlugin` on native, and in-memory or HttpOnly cookies on web.
- **Regression Test:** Run script to check localStorage, assert `base44_access_token` is undefined.
