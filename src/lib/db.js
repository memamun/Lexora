const isStitch = !!globalThis.__B44_DB__;

// Simple LocalStorage-based DB for local development
const localDb = {
  entities: new Proxy({}, {
    get: (target, entityName) => {
      const entity = String(entityName);
      return {
        list: async (sort, limit) => {
          const data = localStorage.getItem(`lexora_${entity}`);
        let list = data ? JSON.parse(data) : [];
        
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
          const data = localStorage.getItem(`lexora_${entity}`);
          const list = data ? JSON.parse(data) : [];
          return list.find(item => item.id === id) || null;
        },
        create: async (item) => {
          const data = localStorage.getItem(`lexora_${entity}`);
          const list = data ? JSON.parse(data) : [];
          const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), created_date: new Date().toISOString() };
          list.push(newItem);
          localStorage.setItem(`lexora_${entity}`, JSON.stringify(list));
          return newItem;
        },
        update: async (id, updates) => {
          const data = localStorage.getItem(`lexora_${entity}`);
          const list = data ? JSON.parse(data) : [];
          const index = list.findIndex(item => item.id === id);
          if (index === -1) return null;
          list[index] = { ...list[index], ...updates, updated_date: new Date().toISOString() };
          localStorage.setItem(`lexora_${entity}`, JSON.stringify(list));
          return list[index];
        },
        delete: async (id) => {
          const data = localStorage.getItem(`lexora_${entity}`);
          const list = data ? JSON.parse(data) : [];
          const newList = list.filter(item => item.id !== id);
          localStorage.setItem(`lexora_${entity}`, JSON.stringify(newList));
          return true;
        }
      };
    }
  })
};

export const db = isStitch ? globalThis.__B44_DB__ : localDb;
