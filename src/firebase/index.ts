'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This function is the single source of truth for Firebase initialization.
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  let firebaseApp: FirebaseApp;
  let firestore: Firestore;

  if (!getApps().length) {
    // Initialize Firebase app for the first time
    firebaseApp = initializeApp(firebaseConfig);

    // Initialize Firestore with MEMORY-ONLY cache to avoid IndexedDB conflicts
    // This ensures fresh security rules are always used without persistence issues
    firestore = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache()
    });
  } else {
    // App already initialized, get existing instances
    firebaseApp = getApp();
    firestore = getFirestore(firebaseApp);
  }

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