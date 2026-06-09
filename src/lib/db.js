import { getApp } from 'firebase/app';
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, writeBatch, setDoc
} from 'firebase/firestore';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const isStitch = !!globalThis.__B44_DB__;

// ─── Auth-ready waiter ───

let authPromise = null;
let authAbortController = null;

function waitForAuth() {
  if (auth?.currentUser) return Promise.resolve(auth.currentUser.uid);
  if (!auth || !isFirebaseConfigured) return Promise.resolve(null);
  if (authPromise) return authPromise;
  
  // Cancel any previous pending auth wait
  authAbortController?.abort();
  authAbortController = new AbortController();
  const { signal } = authAbortController;
  
  authPromise = new Promise(resolve => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved && !signal.aborted) {
        resolved = true;
        authPromise = null;
        // Dispatch visible warning to user
        window.dispatchEvent(new CustomEvent('lexora-storage-error', {
          detail: 'Authentication timed out. Your progress will be saved locally until connection improves.'
        }));
        resolve(null);
      }
    }, 10000); // Increased from 3s to 10s
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsub();
      if (!resolved && !signal.aborted) { resolved = true; authPromise = null; resolve(user?.uid || null); }
    });
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      unsub();
    });
  });
  return authPromise;
}

// Cancel pending auth wait on logout
export function cancelPendingAuth() {
  authAbortController?.abort();
  authAbortController = null;
}

// ─── Firestore helpers ───

let firestoreInstance = null;

function getFirestoreDb() {
  if (firestoreInstance) return firestoreInstance;
  try {
    if (isFirebaseConfigured) {
      const app = getApp();
      firestoreInstance = getFirestore(app);
    }
  } catch (err) {
    console.warn('[DB] Firestore not available:', err.message);
  }
  return firestoreInstance;
}

// ─── LocalStorage fallback ───

function safeGetList(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.warn(`[DB] Failed to read "${key}":`, err.message);
    return [];
  }
}

function safeSaveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (err) {
    console.warn(`[DB] Failed to write "${key}". Storage may be full.`, err.message);
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      window.dispatchEvent(new CustomEvent('lexora-storage-error', { detail: 'Storage quota exceeded. Please clear some browser data.' }));
    }
    return false;
  }
}

const localDb = {
  entities: new Proxy({}, {
    get: (target, entityName) => {
      const entity = String(entityName);
      const storageKey = `lexora_${entity}`;
      return {
        list: async (sort, limit) => {
          let list = safeGetList(storageKey);
          if (sort && typeof sort === 'string') {
            const key = sort.startsWith('-') ? sort.substring(1) : sort;
            const order = sort.startsWith('-') ? -1 : 1;
            list.sort((a, b) => {
              if (a[key] < b[key]) return -1 * order;
              if (a[key] > b[key]) return 1 * order;
              return 0;
            });
          }
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

// ─── Firestore-backed entities ───

function createFirestoreEntity(entityName) {
  const getColRef = (fsDb, uid) => collection(fsDb, 'users', uid, entityName);

  const applySort = (q, sort) => {
    if (!sort || typeof sort !== 'string') return q;
    const key = sort.startsWith('-') ? sort.substring(1) : sort;
    const dir = sort.startsWith('-') ? 'desc' : 'asc';
    return query(q, orderBy(key, dir));
  };

  return {
    list: async (sortVal, limitVal) => {
      const uid = await waitForAuth();
      if (!uid) return localDb.entities[entityName].list(sortVal, limitVal);
      const fsDb = getFirestoreDb();
      if (!fsDb) return localDb.entities[entityName].list(sortVal, limitVal);
      try {
        const colRef = getColRef(fsDb, uid);
        let q = colRef;
        if (sortVal) q = applySort(q, sortVal);
        if (limitVal) q = query(q, limit(limitVal));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn(`[DB] Firestore list failed for "${entityName}":`, err.message);
        return localDb.entities[entityName].list(sortVal, limitVal);
      }
    },

    get: async (id) => {
      const uid = await waitForAuth();
      if (!uid) return localDb.entities[entityName].get(id);
      const fsDb = getFirestoreDb();
      if (!fsDb) return localDb.entities[entityName].get(id);
      try {
        const docRef = doc(fsDb, 'users', uid, entityName, id);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch (err) {
        console.warn(`[DB] Firestore get failed for "${entityName}":`, err.message);
        return localDb.entities[entityName].get(id);
      }
    },

    create: async (item) => {
      const uid = await waitForAuth();
      if (!uid) return localDb.entities[entityName].create(item);
      const fsDb = getFirestoreDb();
      if (!fsDb) return localDb.entities[entityName].create(item);
      try {
        const colRef = getColRef(fsDb, uid);
        const now = new Date().toISOString();
        const docRef = await addDoc(colRef, { ...item, user_id: uid, created_date: now });
        return { id: docRef.id, ...item, user_id: uid, created_date: now };
      } catch (err) {
        console.warn(`[DB] Firestore create failed for "${entityName}":`, err.message);
        return localDb.entities[entityName].create(item);
      }
    },

    update: async (id, updates) => {
      const uid = await waitForAuth();
      if (!uid) return localDb.entities[entityName].update(id, updates);
      const fsDb = getFirestoreDb();
      if (!fsDb) return localDb.entities[entityName].update(id, updates);
      try {
        const docRef = doc(fsDb, 'users', uid, entityName, id);
        const now = new Date().toISOString();
        await updateDoc(docRef, { ...updates, updated_date: now });
        return { id, ...updates, updated_date: now };
      } catch (err) {
        console.warn(`[DB] Firestore update failed for "${entityName}":`, err.message);
        return localDb.entities[entityName].update(id, updates);
      }
    },

    delete: async (id) => {
      const uid = await waitForAuth();
      if (!uid) return localDb.entities[entityName].delete(id);
      const fsDb = getFirestoreDb();
      if (!fsDb) return localDb.entities[entityName].delete(id);
      try {
        await deleteDoc(doc(fsDb, 'users', uid, entityName, id));
        return true;
      } catch (err) {
        console.warn(`[DB] Firestore delete failed for "${entityName}":`, err.message);
        return localDb.entities[entityName].delete(id);
      }
    }
  };
}

const firestoreEntityNames = ['WordReview', 'UserStats', 'LevelProgress', 'QuizAttempt'];
const firestoreEntities = {};
firestoreEntityNames.forEach(name => {
  firestoreEntities[name] = createFirestoreEntity(name);
});

const firestoreDb = { entities: firestoreEntities };

// ─── Batch writes ───

function batchCommit(ops) {
  // ops: [{ entity, type: 'create'|'update', id?, data }]
  // Returns: [{ entity, type, id? }] — IDs filled in for creates after commit
  const fsDb = getFirestoreDb();
  if (!fsDb) return null;
  const uid = auth?.currentUser?.uid;
  if (!uid) return null;

  const fsOps = ops.map(op => {
    const colRef = collection(fsDb, 'users', uid, op.entity);
    const docRef = op.id ? doc(colRef, op.id) : doc(colRef);
    return { ...op, docRef };
  });

  const batch = writeBatch(fsDb);
  const now = new Date().toISOString();
  for (const op of fsOps) {
    if (op.type === 'create') {
      batch.set(op.docRef, { ...op.data, user_id: uid, created_date: now });
    } else {
      batch.update(op.docRef, { ...op.data, updated_date: now });
    }
  }

  return batch.commit().then(() => fsOps.map(op => ({
    entity: op.entity,
    type: op.type,
    id: op.docRef.id,
    data: op.data,
  }))).catch(err => {
    console.warn('[DB] Batch commit failed:', err.message);
    return null;
  });
}

// ─── Select backend ───

function pickDb() {
  if (isStitch) return globalThis.__B44_DB__;
  if (isFirebaseConfigured) return firestoreDb;
  return localDb;
}

export const db = pickDb();
export { batchCommit };
