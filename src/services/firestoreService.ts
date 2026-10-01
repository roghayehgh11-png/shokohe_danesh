import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';

// Helper to remove undefined fields which Firestore rejects
export function cleanDataForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Subscribes to real-time updates for a specific Firestore collection
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((d) => {
          items.push({ ...(d.data() as T), id: d.id });
        });
        onData(items);
      },
      (error) => {
        console.warn(`[Firestore] Subscription sync status on ${collectionName}:`, error?.message || error);
        onError?.(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    return () => {};
  }
}

/**
 * One-time fetch of all documents in a collection with timeout protection
 */
export async function fetchCollectionDocs<T extends { id: string }>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const getPromise = getDocs(colRef);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const snap = await Promise.race([getPromise, timeoutPromise]);
    const items: T[] = [];
    snap.forEach((d) => {
      items.push({ ...(d.data() as T), id: d.id });
    });
    return items;
  } catch (error) {
    console.info(`[Firestore] fetchCollectionDocs fallback for ${collectionName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Saves or updates a single document in Firestore
 */
export async function saveDocumentInFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<void> {
  const docPath = `${collectionName}/${data.id}`;
  try {
    const docRef = doc(db, collectionName, data.id);
    const cleaned = cleanDataForFirestore(data);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error(`[Firestore] Failed to save document at ${docPath}:`, error);
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Deletes a document from Firestore by ID
 */
export async function deleteDocumentFromFirestore(
  collectionName: string,
  id: string
): Promise<void> {
  const docPath = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[Firestore] Failed to delete document at ${docPath}:`, error);
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Batch saves multiple documents into a Firestore collection
 */
export async function batchSaveDocuments<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;

  try {
    // Firestore batch supports up to 500 operations per batch
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, cleanDataForFirestore(item), { merge: true });
      });

      await batch.commit();
    }
  } catch (error) {
    console.error(`[Firestore] Batch save failed for ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

/**
 * Checks if collection has any documents
 */
export async function isCollectionEmpty(collectionName: string): Promise<boolean> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.empty;
  } catch (error) {
    console.warn(`[Firestore] Could not check if collection ${collectionName} is empty:`, error);
    return false;
  }
}

/**
 * Seeds initial mock data into Firestore if database is empty on first run
 */
export async function seedInitialFirestoreData(seedData: {
  users: any[];
  courses: any[];
  projects: any[];
  dailyReports: any[];
  customerLeads: any[];
  tuitions: any[];
  payments: any[];
  installments: any[];
  expenses: any[];
  teacherSalaries: any[];
  groupLinks: any[];
  notifications: any[];
  activityLogs: any[];
}): Promise<boolean> {
  try {
    const empty = await isCollectionEmpty('users');
    if (!empty) {
      console.log('[Firestore] Users collection already populated, skipping seed.');
      return false;
    }

    console.log('[Firestore] Seeding initial data to Firestore...');
    await Promise.all([
      batchSaveDocuments('users', seedData.users),
      batchSaveDocuments('courses', seedData.courses),
      batchSaveDocuments('projects', seedData.projects),
      batchSaveDocuments('dailyReports', seedData.dailyReports),
      batchSaveDocuments('customerLeads', seedData.customerLeads),
      batchSaveDocuments('tuitions', seedData.tuitions),
      batchSaveDocuments('payments', seedData.payments),
      batchSaveDocuments('installments', seedData.installments),
      batchSaveDocuments('expenses', seedData.expenses),
      batchSaveDocuments('teacherSalaries', seedData.teacherSalaries),
      batchSaveDocuments('groupLinks', seedData.groupLinks),
      batchSaveDocuments('notifications', seedData.notifications),
      batchSaveDocuments('activityLogs', seedData.activityLogs)
    ]);

    console.log('[Firestore] Initial data successfully seeded into Firestore.');
    return true;
  } catch (error) {
    console.error('[Firestore] Error while seeding initial data:', error);
    return false;
  }
}

export const fetchAllFromCollection = fetchCollectionDocs;

export { testConnection };
