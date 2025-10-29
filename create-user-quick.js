/**
 * Quick script to create user document
 * Run: node create-user-quick.js
 */

// Use the existing Firebase setup from functions
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Try to use existing app or initialize new one
let app;
try {
  const admin = require('firebase-admin');
  app = admin.app();
  console.log('Using existing Firebase app');
} catch (e) {
  // Initialize new app
  console.log('Initializing new Firebase app...');

  // Try to load service account key
  let serviceAccount;
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (err) {
    console.log('⚠️  No serviceAccountKey.json found. Using default credentials...');
  }

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    app = initializeApp();
  }
}

const db = getFirestore(app);

// User data
const USER_ID = 'PEVTqUVMPzSTmTETWXi1Bzkvx5D2';
const USER_EMAIL = 'nourkhaleds1223@gmail.com';
const USER_NAME = 'Nour Khaled';
const USER_ROLE = 'frontend';

async function createUserDocument() {
  try {
    console.log('🚀 Creating user document...');
    console.log(`User ID: ${USER_ID}`);
    console.log(`Email: ${USER_EMAIL}`);
    console.log(`Role: ${USER_ROLE}`);
    console.log('');

    const userRef = db.collection('users').doc(USER_ID);

    // Check if exists
    const doc = await userRef.get();
    if (doc.exists) {
      console.log('📝 Document exists. Updating role...');
      await userRef.update({
        role: USER_ROLE,
        updatedAt: Timestamp.now(),
      });
    } else {
      console.log('📝 Creating new document...');
      await userRef.set({
        id: USER_ID,
        email: USER_EMAIL,
        fullName: USER_NAME,
        role: USER_ROLE,
        createdAt: Timestamp.now(),
      });
    }

    console.log('');
    console.log('✅ SUCCESS! User document created/updated');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Refresh your browser (F5 or Ctrl+R)');
    console.log('2. Or sign out and sign in again');
    console.log('3. You should now be able to access the app!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('');
    console.log('Please try using Firebase Console instead:');
    console.log('https://console.firebase.google.com/project/studio-6017697584-aeed8/firestore');
    process.exit(1);
  }
}

createUserDocument();
