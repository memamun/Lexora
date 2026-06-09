export const DAILY_RETENTION_DAYS = 90;

export function pruneOldDaily(data) {
  if (!data) return {};
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAILY_RETENTION_DAYS);
  const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
  return Object.fromEntries(
    Object.entries(data).filter(([date]) => date >= cutoffStr)
  );
}

// ─── Module-level cache to survive unmount/remount across navigations ───
export let _cache = null;
export let _lastLoadTime = 0;
export let _cachedUserId = null;
export const CACHE_TTL = 60_000; // 1 minute cache freshness

export function clearStudyEngineCache() {
  _cache = null;
  _lastLoadTime = 0;
  _cachedUserId = null;
}

export function setCache(newCache) {
  _cache = newCache;
}

export function setLastLoadTime(time) {
  _lastLoadTime = time;
}

export function setCachedUserId(id) {
  _cachedUserId = id;
}
