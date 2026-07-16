import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let db: Firestore | MockFirestore;
let auth: Auth | MockAuth;
let isMock = false;

// Simple In-Memory Mock Database for Firestore CRUD operations
class MockDocRef {
  private collectionName: string;
  public readonly id: string;
  private memoryStore: Record<string, Record<string, any>>;

  constructor(collectionName: string, id: string, memoryStore: any) {
    this.collectionName = collectionName;
    this.id = id;
    this.memoryStore = memoryStore;
  }

  async get() {
    const data = this.memoryStore[this.collectionName]?.[this.id];
    return {
      id: this.id,
      exists: !!data,
      data: () => data || null
    };
  }

  async set(data: any) {
    if (!this.memoryStore[this.collectionName]) {
      this.memoryStore[this.collectionName] = {};
    }
    this.memoryStore[this.collectionName][this.id] = { ...data };
    return { writeTime: new Date() };
  }

  async update(data: any) {
    if (!this.memoryStore[this.collectionName]) {
      this.memoryStore[this.collectionName] = {};
    }
    const current = this.memoryStore[this.collectionName][this.id] || {};
    this.memoryStore[this.collectionName][this.id] = { ...current, ...data };
    return { writeTime: new Date() };
  }

  async delete() {
    if (this.memoryStore[this.collectionName]) {
      delete this.memoryStore[this.collectionName][this.id];
    }
    return { writeTime: new Date() };
  }
}

class MockCollectionRef {
  private collectionName: string;
  private memoryStore: Record<string, Record<string, any>> = {};
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private orderFields: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
  private limitCount: number = -1;

  constructor(
    collectionName: string, 
    memoryStore: any, 
    filters?: any[], 
    orderFields?: any[], 
    limitCount?: number
  ) {
    this.collectionName = collectionName;
    this.memoryStore = memoryStore;
    this.filters = filters || [];
    this.orderFields = orderFields || [];
    this.limitCount = limitCount !== undefined ? limitCount : -1;
  }

  doc(id: string) {
    return new MockDocRef(this.collectionName, id, this.memoryStore);
  }

  async add(data: any) {
    const id = `mock-${Math.floor(Math.random() * 1000000)}`;
    if (!this.memoryStore[this.collectionName]) {
      this.memoryStore[this.collectionName] = {};
    }
    this.memoryStore[this.collectionName][id] = { ...data };
    return new MockDocRef(this.collectionName, id, this.memoryStore);
  }

  where(field: string, op: string, value: any) {
    return new MockCollectionRef(
      this.collectionName,
      this.memoryStore,
      [...this.filters, { field, op, value }],
      this.orderFields,
      this.limitCount
    );
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new MockCollectionRef(
      this.collectionName,
      this.memoryStore,
      this.filters,
      [...this.orderFields, { field, direction }],
      this.limitCount
    );
  }

  limit(count: number) {
    return new MockCollectionRef(
      this.collectionName,
      this.memoryStore,
      this.filters,
      this.orderFields,
      count
    );
  }

  async get() {
    const coll = this.memoryStore[this.collectionName] || {};
    let docs = Object.keys(coll).map(id => ({
      id,
      exists: true,
      data: () => coll[id]
    }));

    // Apply where filters in-memory
    for (const filter of this.filters) {
      docs = docs.filter(d => {
        const item = d.data();
        if (!item) return false;
        const docVal = item[filter.field];
        
        switch (filter.op) {
          case '==': return docVal === filter.value;
          case '!=': return docVal !== filter.value;
          case '>': return docVal > filter.value;
          case '<': return docVal < filter.value;
          case '>=': return docVal >= filter.value;
          case '<=': return docVal <= filter.value;
          case 'array-contains':
            return Array.isArray(docVal) && docVal.includes(filter.value);
          default: return true;
        }
      });
    }

    // Apply sorting in-memory
    if (this.orderFields.length > 0) {
      docs.sort((a, b) => {
        for (const order of this.orderFields) {
          const valA = a.data()[order.field];
          const valB = b.data()[order.field];
          if (valA === valB) continue;
          const comp = valA > valB ? 1 : -1;
          return order.direction === 'desc' ? -comp : comp;
        }
        return 0;
      });
    }

    // Apply limit constraint
    if (this.limitCount >= 0) {
      docs = docs.slice(0, this.limitCount);
    }

    return {
      docs,
      forEach: (cb: any) => docs.forEach(cb),
      empty: docs.length === 0,
      size: docs.length
    };
  }
}

class MockFirestore {
  private memoryStore: Record<string, Record<string, any>> = {};

  collection(name: string) {
    return new MockCollectionRef(name, this.memoryStore);
  }
}

class MockAuth {
  async verifyIdToken(token: string) {
    return { uid: 'mock-user-id', role: 'OPS' };
  }
}

try {
  const forceMock = process.env.FORCE_MOCK_FIRESTORE === 'true';
  const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!forceMock && firebaseKey && firebaseKey !== 'your-firebase-service-account-base64-or-json-here') {
    let serviceAccount;
    const trimmedKey = firebaseKey.trim();
    if (trimmedKey.startsWith('{')) {
      serviceAccount = JSON.parse(trimmedKey);
    } else {
      serviceAccount = JSON.parse(Buffer.from(trimmedKey, 'base64').toString('utf8'));
    }
    if (serviceAccount && serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    const app = initializeApp({
      credential: cert(serviceAccount)
    }, 'stadium-os-app-' + Math.random().toString(36).substring(2, 7)); // Name explicitly to avoid double-init errors
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase Admin SDK initialized successfully for StadiumOS server.');
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY missing or placeholder.');
  }
} catch (error: any) {
  isMock = true;
  db = new MockFirestore();
  auth = new MockAuth();
  console.warn(`WARNING: Firebase Client fallback activated on StadiumOS server. Reason: ${error.message}`);
}

export { db, auth, isMock };
