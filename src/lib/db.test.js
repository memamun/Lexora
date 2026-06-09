import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '@/lib/firebase';
import { batchCommit, db } from './db';

// Mock Firebase dependencies
vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();
const mockBatchSet = vi.fn();
const mockWriteBatch = vi.fn().mockReturnValue({
  commit: mockBatchCommit,
  update: mockBatchUpdate,
  set: mockBatchSet,
});

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({}),
  collection: vi.fn(),
  doc: vi.fn().mockImplementation((col, id) => ({ id: id || 'new-doc-id' })),
  writeBatch: () => mockWriteBatch(),
  enableIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  isFirebaseConfigured: true,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

describe('db batchCommit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.currentUser = { uid: 'test-uid' };
    mockBatchCommit.mockReset().mockResolvedValue(undefined);
  });

  it('should chunk operations in slices of 500 when online', async () => {
    const ops = Array.from({ length: 600 }, (_, i) => ({
      entity: 'WordReview',
      type: 'create',
      data: { word: `word${i}` },
    }));

    const results = await batchCommit(ops);

    expect(mockWriteBatch).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(600);
    expect(results[0].id).toBe('new-doc-id');
  });

  it('should fallback to individual db.entities writes when offline/unauthenticated', async () => {
    auth.currentUser = null;

    const mockCreate = vi.spyOn(db.entities.WordReview, 'create').mockResolvedValue({ id: 'local-id', word: 'test' });

    const ops = [
      { entity: 'WordReview', type: 'create', data: { word: 'test' } },
    ];

    const results = await batchCommit(ops);

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledWith({ word: 'test' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('local-id');
  });
});
