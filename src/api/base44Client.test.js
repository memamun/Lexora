import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('base44Client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete globalThis.__B44_DB__;
  });

  it('should export defaultDb when globalThis.__B44_DB__ is not set', async () => {
    delete globalThis.__B44_DB__;
    const { db } = await import('./base44Client.js');

    expect(db.auth).toBeDefined();
    expect(await db.auth.isAuthenticated()).toBe(false);
    expect(await db.auth.me()).toBe(null);
    await expect(db.auth.logout()).resolves.toBeUndefined();

    // Check entities proxy
    expect(db.entities.AnyEntity).toBeDefined();
    expect(await db.entities.AnyEntity.filter()).toEqual([]);
    expect(await db.entities.AnyEntity.list()).toEqual([]);
    expect(await db.entities.AnyEntity.get()).toBe(null);
    expect(await db.entities.AnyEntity.create()).toEqual({});
    expect(await db.entities.AnyEntity.update()).toEqual({});
    expect(await db.entities.AnyEntity.delete()).toEqual({});

    // Check integrations
    expect(db.integrations.Core.UploadFile).toBeDefined();
    expect(await db.integrations.Core.UploadFile()).toEqual({ file_url: '' });
  });

  it('should export globalThis.__B44_DB__ when it is set', async () => {
    const mockDb = {
      auth: { isAuthenticated: async () => true },
      customField: 'test'
    };
    globalThis.__B44_DB__ = mockDb;

    const { db } = await import('./base44Client.js');

    expect(db).toBe(mockDb);
    expect(db.customField).toBe('test');
    expect(await db.auth.isAuthenticated()).toBe(true);
  });
});
