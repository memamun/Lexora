# Production Readiness Implementation Plan - Lexora

This document outlines the phased plan to resolve the architectural, security, reliability, and offline synchronization issues identified in the production readiness audit.

---

## Phase 1 – Critical Launch Blockers

These issues must be resolved before launch to prevent immediate data loss, crashes, or security concerns.

### 1. Fix WordReview Fetch Limit (`MAX_REVIEWS_FETCH`) [High Impact + Low Risk]
* **Target File**: [constants.js](file:///home/mamun/Lexora/src/lib/constants.js) (or wherever `MAX_REVIEWS_FETCH` is defined) and [useStudyState.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyState.js)
* **Action**: Increase `MAX_REVIEWS_FETCH` to a safe, unbounded value like `5000` or paginate the reads so that users with more than 100 reviewed words do not lose progress.

### 2. Resolve Stale Cache on Remount (Data Reversion) [High Impact + Low Risk]
* **Target File**: [useStudyReviews.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyReviews.js), [useStudyQuizzes.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyQuizzes.js), and [cache.js](file:///home/mamun/Lexora/src/lib/study-engine/cache.js)
* **Action**: Update the module-level `_cache` inside the mutation success blocks (specifically when reviews, stats, or levelProgress are modified) to prevent state reversion during navigation.

### 3. Resolve Stale Closure in Queue & Total Reviews Bug [High Impact + Medium Risk]
* **Target File**: [useStudyReviews.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyReviews.js)
* **Action**: Utilize the references `statsRef.current` and `levelProgressRef.current` inside the review update flow, ensuring the queue reads the absolute latest states instead of stale closure values.

### 4. Enable Firestore IndexedDB Offline Persistence [High Impact + Low Risk]
* **Target File**: [db.js](file:///home/mamun/Lexora/src/lib/db.js)
* **Action**: Call `enableIndexedDbPersistence` on the Firestore client during initialization to ensure all reads and writes are natively cached.

### 5. Fix React Router Navigation during Render Phase [High Impact + Low Risk]
* **Target File**: [App.jsx](file:///home/mamun/Lexora/src/App.jsx)
* **Action**: Replace imperatively-called `navigate()` inside the render body of `AuthenticatedApp` with `<Navigate to="/login" replace />` to enforce standard React Router lifecycles.

---

## Phase 2 – High-Priority Fixes

These improvements address UX stability, mobile compatibility, and security.

### 6. Fix Memory Leak in Capacitor Back Button Listener [High Impact + Medium Risk]
* **Target File**: [App.jsx](file:///home/mamun/Lexora/src/App.jsx)
* **Action**: Cache location and navigation states using mutable refs so the native listener is registered only once during the app's lifetime.

### 7. Replace window.confirm with Native Dialogs on Mobile [High Impact + Low Risk]
* **Target File**: [App.jsx](file:///home/mamun/Lexora/src/App.jsx)
* **Action**: Import `@capacitor/dialog` and use `Dialog.confirm` for native prompts to prevent freezes on Android/iOS.

### 8. Resolve Race Condition in Async Queue [Medium Impact + Medium Risk]
* **Target File**: [useStudyReviews.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyReviews.js)
* **Action**: Rework `recordReview` to return a Promise that awaits queue processing.

### 9. Double-Click Advances SRS Twice [Medium Impact + Low Risk]
* **Target File**: [useStudyReviews.js](file:///home/mamun/Lexora/src/lib/study-engine/useStudyReviews.js)
* **Action**: Block duplicate click events for the same card index by tracking active transitions in a `processingWords` Set.

### 10. Clean Up Audio Synthesis on Unmount [Medium Impact + Low Risk]
* **Target File**: [WordDetail.jsx](file:///home/mamun/Lexora/src/pages/WordDetail.jsx), [utils/audio.js](file:///home/mamun/Lexora/src/utils/audio.js)
* **Action**: Cancel active TTS speaking whenever components unmount.

---

## Phase 3 – Scalability & Security Improvements

### 11. Implement App ID / Google Client ID Config Dynamic Fetch [Medium Impact + Low Risk]
* **Target File**: [capacitor.config.json](file:///home/mamun/Lexora/capacitor.config.json), [firebase.js](file:///home/mamun/Lexora/src/lib/firebase.js)
* **Action**: Read config parameters from build variables/configurations rather than placeholders.

### 12. App Check Integration for Bot/Rate-Limit Protection [Medium Impact + Medium Risk]
* **Target File**: [firebase.js](file:///home/mamun/Lexora/src/lib/firebase.js)
* **Action**: Configure Firebase App Check with Play Integrity (mobile) and reCAPTCHA Enterprise (web).

### 13. Multi-Device Conflict Transaction Resolution [Medium Impact + High Risk]
* **Target File**: [db.js](file:///home/mamun/Lexora/src/lib/db.js)
* **Action**: Refactor state changes to run within standard Firestore transactions.

### 14. SecureStorage integration for mobile API tokens [Medium Impact + Low Risk]
* **Target File**: [AuthContext.jsx](file:///home/mamun/Lexora/src/lib/AuthContext.jsx)
* **Action**: Switch from localStorage to Capacitor SecureStorage plugin on native devices.

---

## Phase 4 – Long-Term Improvements

### 15. Unhandled ChunkLoadError Recovery [Low Impact + Low Risk]
* **Target File**: [App.jsx](file:///home/mamun/Lexora/src/App.jsx)
* **Action**: Create a custom chunk-loading utility wrapper that reloads the browser tab once if chunk loading fails.

### 16. useNetworkStatus Timeout Clear [Low Impact + Low Risk]
* **Target File**: [use-network-status.js](file:///home/mamun/Lexora/src/hooks/use-network-status.js)
* **Action**: Clear pending timers inside cleanup hooks.

### 17. Robust Schema Validation for Saved Bookmarks [Low Impact + Low Risk]
* **Target File**: [Favorites.jsx](file:///home/mamun/Lexora/src/pages/Favorites.jsx), [WordDetail.jsx](file:///home/mamun/Lexora/src/pages/WordDetail.jsx)
* **Action**: Parse localStorage properties with fallbacks and recovery backups.
