# Setup Admin User Guide

## Problem
You're getting a permission error because your user doesn't have the `admin` role set in Firestore.

## Quick Fix (Using Firebase Console)

### Method 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `studio-6017697584-aeed8`
3. Click on **Firestore Database** in the left menu
4. Find or create the `users` collection
5. Find your user document with ID: `PEVTqUVMPzSTmTETWXi1Bzkvx5D2`
6. If the document doesn't exist:
   - Click **Add document**
   - Document ID: `PEVTqUVMPzSTmTETWXi1Bzkvx5D2`
   - Add these fields:
     - `id` (string): `PEVTqUVMPzSTmTETWXi1Bzkvx5D2`
     - `email` (string): `nourkhaleds1223@gmail.com`
     - `fullName` (string): `Nour Khaled`
     - `role` (string): `admin`
     - `createdAt` (timestamp): Click "Add field" → choose timestamp → select current time
7. If the document exists:
   - Click on the document
   - Add or edit the `role` field
   - Set value to: `admin`
8. Click **Save**

### Method 2: Using Firebase CLI (Node.js Script)

1. Install Firebase Admin SDK dependencies:
```bash
cd /home/user/studio
npm install firebase-admin --save-dev
```

2. Download your service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in the project root
   - **Important**: Add `serviceAccountKey.json` to `.gitignore`!

3. Update the USER_ID in `scripts/setup-admin.js`:
```javascript
const USER_ID = 'PEVTqUVMPzSTmTETWXi1Bzkvx5D2'; // Your user ID
```

4. Run the script:
```bash
node scripts/setup-admin.js
```

### Method 3: Create a Sign-up Component with Role Selection

If you want new users to specify their role during signup, add this to your auth flow:

```typescript
// During user registration
await createUserWithEmailAndPassword(auth, email, password);
const user = auth.currentUser;

if (user) {
  // Create user document with role
  await setDoc(doc(firestore, 'users', user.uid), {
    id: user.uid,
    email: user.email,
    fullName: displayName,
    role: 'admin', // or 'frontend', 'backend', etc.
    createdAt: serverTimestamp(),
  });
}
```

## Verify Setup

After setting the admin role:

1. **Refresh your browser** (or sign out and sign in again)
2. Open browser console
3. Run this to verify:
```javascript
// Check Firestore document
const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
console.log('User role:', userDoc.data()?.role);
```

## User Roles in Your System

Your application supports these roles:

- **`admin`**: Full access to all features including:
  - View all users
  - Manage clients
  - View reports
  - HR Management (leaves, deductions, attendance)

- **`frontend`**: Regular user access
- **`backend`**: Regular user access
- **(No role)**: Treated as regular user

## Troubleshooting

### Still getting permission errors?

1. **Clear browser cache and cookies**
2. **Sign out and sign in again** to refresh the auth token
3. **Check Firestore rules** are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Verify the document exists** in Firebase Console
5. **Check the exact field name** - it should be `role` (lowercase)

### Setting multiple admin users

Repeat the process for each user you want to make admin, or use the Node.js script with different USER_IDs.

## Next Steps: Implement Custom Claims (Optional but Recommended)

Custom Claims are faster and more secure than reading from Firestore:

1. See [FIRESTORE_RULES_OPTIMIZATION.md](./FIRESTORE_RULES_OPTIMIZATION.md) for details
2. Implement the Cloud Function to set claims automatically
3. Update rules to use `request.auth.token.role` instead of document reads

---

**Quick Command Reference:**

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Run admin setup script
node scripts/setup-admin.js

# Check Firebase login
firebase login

# List Firebase projects
firebase projects:list
```
