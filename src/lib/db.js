const isStitch = !!globalThis.__B44_DB__;

// Safe localStorage helpers with quota/corruption handling
function safeGetList(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn(`[Lexora DB] Failed to read "${key}":`, err.message);
    return [];
  }
}

function safeSaveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (err) {
    console.error(`[Lexora DB] Failed to write "${key}". Storage may be full.`, err.message);
    // Attempt to notify user if quota exceeded
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      window.dispatchEvent(new CustomEvent('lexora-storage-error', { detail: 'Storage quota exceeded. Please clear some browser data.' }));
    }
    return false;
  }
}

// Simple LocalStorage-based DB for local development
const localDb = {
  entities: new Proxy({}, {
    get: (target, entityName) => {
      const entity = String(entityName);
      const storageKey = `lexora_${entity}`;
      return {
        list: async (sort, limit) => {
          let list = safeGetList(storageKey);
        
          // Basic sorting
          if (sort && typeof sort === 'string') {
            const key = sort.startsWith('-') ? sort.substring(1) : sort;
            const order = sort.startsWith('-') ? -1 : 1;
            list.sort((a, b) => {
              if (a[key] < b[key]) return -1 * order;
              if (a[key] > b[key]) return 1 * order;
              return 0;
            });
          }
        
          // Basic limit
          if (limit && typeof limit === 'number') {
            list = list.slice(0, limit);
          }
        
          return list;
        },
        get: async (id) => {
          const list = safeGetList(storageKey);
          return list.find(item => item.id === id) || null;
        },
        create: async (item) => {
          const list = safeGetList(storageKey);
          const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), created_date: new Date().toISOString() };
          list.push(newItem);
          safeSaveList(storageKey, list);
          return newItem;
        },
        update: async (id, updates) => {
          const list = safeGetList(storageKey);
          const index = list.findIndex(item => item.id === id);
          if (index === -1) return null;
          list[index] = { ...list[index], ...updates, updated_date: new Date().toISOString() };
          safeSaveList(storageKey, list);
          return list[index];
        },
        delete: async (id) => {
          const list = safeGetList(storageKey);
          const newList = list.filter(item => item.id !== id);
          safeSaveList(storageKey, newList);
          return true;
        }
      };
    }
  })
};

export const db = isStitch ? globalThis.__B44_DB__ : localDb;

