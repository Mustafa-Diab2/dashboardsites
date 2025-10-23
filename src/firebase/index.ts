'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// A private function to get all the SDKs.
// This is to ensure that we're only getting the SDKs from a single app instance.
function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This function is the single source of truth for Firebase initialization.
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // This will automatically use the FIREBASE_CONFIG environment variable if it exists.
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      // If automatic initialization fails, fall back to the config file.
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }

  // If the app is already initialized, return the existing instance.
  return getSdks(getApp());
}

// Export the necessary hooks and providers for use in the application.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
