import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// کلیدهای واقعی پروژه جدید Firebase شما (shokohe-danesh)
const firebaseConfig = {
  apiKey: "AIzaSyDyK9r_LsLPOXZQnU2R5aCYfd_AZcrxRY8",
  authDomain: "shokohe-danesh.firebaseapp.com",
  projectId: "shokohe-danesh",
  storageBucket: "shokohe-danesh.firebasestorage.app",
  messagingSenderId: "544592936470",
  appId: "1:544592936470:web:648ccbe12dfcaed9cbbf37",
  measurementId: "G-V9GTDEGBWQ"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (استفاده از دیتابیس استاندارد پروژه به همراه Long Polling برای شبکه‌های ایران/محدود)
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never | void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isPermissionError = errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('insufficient');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('[Firestore Operation Notice]:', JSON.stringify(errInfo));
  }
}

// Validate Connection to Firestore on startup
export async function testConnection(): Promise<boolean> {
  try {
    const testDocPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 4000)
    );
    await Promise.race([testDocPromise, timeoutPromise]);
    console.log('[Firestore] Connection validated successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('timeout'))) {
      console.info('[Firestore] Client is operating in local/offline cache mode. Background sync active.');
    } else {
      console.info('[Firestore] Connection verification note:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}