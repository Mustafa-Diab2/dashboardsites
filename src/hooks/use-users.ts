
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
 * @param {string | undefined} userRole The role of the current user ('admin' or other). Pass undefined while loading.
 * @returns An array of user documents. The type is kept consistent for easier use in components.
 */
export function useUsers(userRole: string | undefined) {
  const { firestore, user } = useFirebase();

  // Don't query anything if userRole is not yet determined
  const shouldFetchAllUsers = firestore && userRole === 'admin';
  const shouldFetchOwnUser = firestore && user && userRole && userRole !== 'admin';

  // For Admins: Query for all users
  const allUsersQuery = useMemoFirebase(
    () => (shouldFetchAllUsers ? query(collection(firestore, 'users')) : null),
    [firestore, shouldFetchAllUsers]
  );
  const { data: allUsers } = useCollection(allUsersQuery);

  // For Non-Admins: Query for only the current user's doc
  const singleUserDocRef = useMemoFirebase(
    () => (shouldFetchOwnUser ? doc(firestore, 'users', user.uid) : null),
    [firestore, user, shouldFetchOwnUser]
  );
  const { data: singleUser } = useDoc(singleUserDocRef);

  // Return the appropriate data based on the user's role
  if (userRole === 'admin') {
    return allUsers;
  }

  // If it's a single user, return it in an array to keep the data type consistent
  return singleUser ? [singleUser] : [];
}

