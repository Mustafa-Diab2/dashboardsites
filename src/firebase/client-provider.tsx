'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

let firebaseServices: ReturnType<typeof initializeFirebase> | null = null;

function getFirebaseServices() {
  if (typeof window !== 'undefined') {
    if (!firebaseServices) {
      firebaseServices = initializeFirebase();
    }
    return firebaseServices;
  }
  return null;
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const services = getFirebaseServices();
  
  if(!services) {
    // We can't render anything on the server, as it would cause a hydration mismatch.
    // Return null and let the client-side render handle it.
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
