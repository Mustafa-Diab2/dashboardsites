
'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

/**
 * A hook to fetch client data for admins.
 * It will only fetch the data if the user is an admin.
 * 
 * @returns An array of client documents, or an empty array.
 */
export function useClients() {
  const { firestore, user } = useFirebase();

  // This hook relies on the parent component to enforce the admin role.
  // The query will only be active if firestore is available.
  const clientsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'clients')) : null),
    [firestore]
  );
  
  const { data: clients, isLoading } = useCollection(clientsQuery);
  
  if (isLoading || !clients) {
    return [];
  }

  return clients;
}

