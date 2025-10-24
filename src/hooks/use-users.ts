
'use client';

import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';

/**
 * A role-aware hook to fetch user data.
 * - If the user is an admin, it fetches all user documents.
 * - If the user is not an admin, it fetches only their own user document.
 * 
 * This prevents permission errors for non-admin users trying to list all users.
 * 
 * @param {string} userRole The role of the current user ('admin' or other).
 * @returns An array of user documents. The type is kept consistent for easier use in components.
 */
export function useUsers(userRole: string) {
  const { firestore, user } = useFirebase();

  // For Admins: Query for all users
  const allUsersQuery = useMemoFirebase(
    () => (firestore && userRole === 'admin' ? query(collection(firestore, 'users')) : null),
    [firestore, userRole]
  );
  const { data: allUsers } = useCollection(allUsersQuery);

  // For Non-Admins: Query for only the current user's doc
  const singleUserDocRef = useMemoFirebase(
    () => (firestore && user && userRole !== 'admin' ? doc(firestore, 'users', user.uid) : null),
    [firestore, user, userRole]
  );
  const { data: singleUser } = useDoc(singleUserDocRef);

  // Return the appropriate data based on the user's role
  if (userRole === 'admin') {
    return allUsers;
  }
  
  // If it's a single user, return it in an array to keep the data type consistent
  return singleUser ? [singleUser] : [];
}

