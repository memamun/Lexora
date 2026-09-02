import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { setDoc, doc } from 'firebase/firestore';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'lexora-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore Security Rules', () => {
  const userId = 'user_abc';

  it('should allow user to write to their allowed subcollections (UserStats, LevelProgress, QuizAttempt)', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const authedDb = testEnv.authenticatedContext(userId).firestore();

    await assertSucceeds(setDoc(doc(authedDb, `users/${userId}/UserStats/stat1`), { data: 'test' }));
    await assertSucceeds(setDoc(doc(authedDb, `users/${userId}/LevelProgress/level1`), { data: 'test' }));
    await assertSucceeds(setDoc(doc(authedDb, `users/${userId}/QuizAttempt/quiz1`), { data: 'test' }));
  });

  it('should deny user from writing to unauthorized arbitrary subcollections', async () => {
    const authedDb = testEnv.authenticatedContext(userId).firestore();

    await assertFails(setDoc(doc(authedDb, `users/${userId}/junk/doc1`), { data: 'test' }));
    await assertFails(setDoc(doc(authedDb, `users/${userId}/AnotherJunk/doc2`), { data: 'test' }));
  });

  it('should deny unauthenticated users from writing anywhere', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(unauthedDb, `users/${userId}/UserStats/stat1`), { data: 'test' }));
    await assertFails(setDoc(doc(unauthedDb, `users/${userId}/junk/doc1`), { data: 'test' }));
  });

  it('should allow user to write to WordReview up to 10KB', async () => {
    const authedDb = testEnv.authenticatedContext(userId).firestore();
    await assertSucceeds(setDoc(doc(authedDb, `users/${userId}/WordReview/word1`), { data: 'test' }));
  });

});
