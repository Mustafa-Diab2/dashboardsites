# Firestore Rules Optimization Guide

## Current State

The current Firestore rules use `isAdminViaDoc()` which reads the user's document on every request to check if they have admin role. This works but causes extra reads and can be slow.

## Problem

```javascript
function isAdminViaDoc() {
  return request.auth != null &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

This function performs a document read on EVERY firestore operation, which:
- Increases read costs
- Slows down operations
- Can hit rate limits

## Recommended Solution: Custom Claims

Custom Claims are stored in the Firebase Auth token and don't require document reads.

### Step 1: Create Cloud Function to Set Custom Claims

Create `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Set custom claims when user document is created/updated
export const setUserRole = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();

    if (!newData) return; // Document was deleted

    const role = newData.role || 'user';

    // Set custom claim
    await admin.auth().setCustomUserClaims(userId, { role });

    console.log(`Set custom claim role=${role} for user ${userId}`);
  });

// Optional: HTTP function to manually set admin role
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Only existing admins can set admin role
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin role');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  // Set custom claim
  await admin.auth().setCustomUserClaims(userId, { role: 'admin' });

  // Update Firestore document
  await admin.firestore().collection('users').doc(userId).update({ role: 'admin' });

  return { success: true };
});
```

### Step 2: Deploy Cloud Functions

```bash
cd functions
npm install firebase-functions firebase-admin
npm run build
firebase deploy --only functions
```

### Step 3: Update Firestore Rules

Replace `isAdminViaDoc()` with `isAdmin()`:

```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.role == 'admin';
}

match /users/{userId} {
  allow get: if isOwner(userId) || isAdmin();
  allow list: if isAdmin(); // No document read required!
  allow create: if isOwner(userId);
  allow update: if isOwner(userId) || isAdmin();
  allow delete: if isOwner(userId) || isAdmin();
}
```

### Step 4: Handle Token Refresh in Client

After role changes, users need to refresh their token:

```typescript
import { getAuth } from 'firebase/auth';

// After role is changed
const auth = getAuth();
if (auth.currentUser) {
  await auth.currentUser.getIdToken(true); // Force refresh
  // Reload the page or update UI
  window.location.reload();
}
```

## Benefits of Custom Claims

✅ **No extra reads**: Claims are in the auth token
✅ **Faster**: No need to fetch user document
✅ **More secure**: Can't be modified by client
✅ **Cost effective**: Reduces Firestore reads
✅ **Better performance**: Rules evaluation is faster

## Migration Steps

1. Deploy the Cloud Function
2. Run a one-time script to set claims for existing users:

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

async function migrateExistingUsers() {
  const usersSnapshot = await admin.firestore().collection('users').get();

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const role = data.role || 'user';

    await admin.auth().setCustomUserClaims(doc.id, { role });
    console.log(`Migrated user ${doc.id} with role ${role}`);
  }

  console.log('Migration complete!');
}

migrateExistingUsers();
```

3. Update Firestore rules to use `isAdmin()` instead of `isAdminViaDoc()`
4. Deploy the new rules
5. Test thoroughly

## Current Workaround

Until Custom Claims are implemented, the current rules with `isAdminViaDoc()` will work but with reduced performance. The code already handles this by:

- Non-admin users only fetch their own document (using `doc()` not `collection()`)
- Admin users fetch all documents (allowed by `isAdminViaDoc()`)

This prevents permission errors while we implement the optimal solution.

## Testing Custom Claims

```typescript
// In client code
import { getAuth } from 'firebase/auth';

const auth = getAuth();
auth.currentUser?.getIdTokenResult().then(idTokenResult => {
  console.log('Custom claims:', idTokenResult.claims);
  console.log('Is admin:', idTokenResult.claims.role === 'admin');
});
```

## Notes

- Custom claims can be up to 1000 bytes
- Claims are included in every auth token
- Token refresh happens automatically every hour
- Force refresh after role changes: `getIdToken(true)`
