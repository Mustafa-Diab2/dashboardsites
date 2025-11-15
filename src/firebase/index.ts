'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This function is the single source of truth for Firebase initialization.
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  if (getApps().length > 0) {
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  const firebaseApp = initializeApp(firebaseConfig);
  const firestore = initializeFirestore(firebaseApp, {
    localCache: memoryLocalCache(),
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
  };
}


// Export the necessary hooks and providers for use in the application.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
