/**
 * Setup Admin User Script
 *
 * This script helps you set the admin role for a user in Firestore.
 * Run this script after creating your first user account.
 *
 * Usage:
 * 1. Update the USER_ID constant below with your user's UID
 * 2. Run: node scripts/setup-admin.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// CHANGE THIS to your user's UID
// You can find this in Firebase Console > Authentication > Users
const USER_ID = 'PEVTqUVMPzSTmTETWXi1Bzkvx5D2';

async function setupAdmin() {
  try {
    console.log(`Setting up admin role for user: ${USER_ID}`);

    // Check if user document exists
    const userDoc = await db.collection('users').doc(USER_ID).get();

    if (!userDoc.exists) {
      console.log('User document does not exist. Creating new document...');

      // Get user from Auth to get email
      const userRecord = await admin.auth().getUser(USER_ID);

      await db.collection('users').doc(USER_ID).set({
        id: USER_ID,
        email: userRecord.email,
        fullName: userRecord.displayName || 'Admin User',
        role: 'admin',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Created user document with admin role');
    } else {
      // Update existing document
      await db.collection('users').doc(USER_ID).update({
        role: 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Updated user document with admin role');
    }

    // Optional: Set custom claims for better performance
    // Uncomment this section when you implement custom claims
    /*
    await admin.auth().setCustomUserClaims(USER_ID, { role: 'admin' });
    console.log('✅ Set custom claims for user');
    */

    console.log('\n✨ Admin setup complete!');
    console.log('Please refresh your browser to see the changes.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
