#!/usr/bin/env node

/**
 * سكريبت لتعيين صلاحيات الأدمن (Custom Claims) للمستخدمين
 *
 * الاستخدام:
 *   node scripts/set-admin-claim.js <email>
 *
 * مثال:
 *   node scripts/set-admin-claim.js admin@example.com
 */

const admin = require('firebase-admin');
const path = require('path');

// تهيئة Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ تم تهيئة Firebase Admin SDK');
} catch (error) {
  console.error('\n❌ خطأ في تهيئة Firebase Admin SDK\n');
  console.error('الرجاء التأكد من وجود ملف serviceAccountKey.json في مجلد scripts/');
  console.error('\nللحصول على Service Account Key:');
  console.error('1. اذهب إلى Firebase Console');
  console.error('2. Project Settings > Service accounts');
  console.error('3. Generate new private key');
  console.error('4. احفظ الملف باسم: scripts/serviceAccountKey.json');
  console.error('\n⚠️  لا تنسَ إضافة الملف إلى .gitignore!\n');
  process.exit(1);
}

/**
 * تعيين صلاحية الأدمن لمستخدم
 */
async function setAdminClaim(email) {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${email}...`);

    // الحصول على المستخدم عن طريق البريد الإلكتروني
    const user = await admin.auth().getUserByEmail(email);

    console.log(`✓ تم العثور على المستخدم`);
    console.log(`  UID: ${user.uid}`);
    console.log(`  Display Name: ${user.displayName || 'غير محدد'}`);

    // التحقق من Custom Claims الحالية
    const currentUser = await admin.auth().getUser(user.uid);
    console.log(`\n📋 Custom Claims الحالية:`, currentUser.customClaims || 'لا يوجد');

    // تعيين Custom Claim
    console.log(`\n⚙️  تعيين صلاحية الأدمن...`);
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin'
    });

    console.log(`\n✅ تم تعيين صلاحية الأدمن بنجاح!`);
    console.log(`\n⚠️  ملاحظة مهمة:`);
    console.log(`   يجب على المستخدم تسجيل الخروج ثم الدخول مرة أخرى`);
    console.log(`   حتى تُطبّق الصلاحيات الجديدة\n`);

  } catch (error) {
    console.error('\n❌ خطأ في تعيين صلاحية الأدمن:\n');

    if (error.code === 'auth/user-not-found') {
      console.error(`المستخدم بالبريد الإلكتروني "${email}" غير موجود`);
      console.error('الرجاء التأكد من البريد الإلكتروني أو إنشاء حساب جديد أولاً\n');
    } else if (error.code === 'auth/invalid-email') {
      console.error(`البريد الإلكتروني "${email}" غير صالح\n`);
    } else {
      console.error(error.message);
      console.error('\nللمزيد من المعلومات:');
      console.error(error);
      console.error('');
    }

    process.exit(1);
  }

  process.exit(0);
}

/**
 * إزالة صلاحية الأدمن من مستخدم
 */
async function removeAdminClaim(email) {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${email}...`);

    const user = await admin.auth().getUserByEmail(email);

    console.log(`✓ تم العثور على المستخدم`);
    console.log(`  UID: ${user.uid}`);

    // إزالة Custom Claim
    console.log(`\n⚙️  إزالة صلاحية الأدمن...`);
    await admin.auth().setCustomUserClaims(user.uid, {
      role: null
    });

    console.log(`\n✅ تم إزالة صلاحية الأدمن بنجاح!\n`);

  } catch (error) {
    console.error('\n❌ خطأ في إزالة صلاحية الأدمن:', error.message, '\n');
    process.exit(1);
  }

  process.exit(0);
}

/**
 * عرض Custom Claims لمستخدم
 */
async function viewClaims(email) {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${email}...`);

    const user = await admin.auth().getUserByEmail(email);

    console.log(`✓ تم العثور على المستخدم`);
    console.log(`  UID: ${user.uid}`);
    console.log(`  Display Name: ${user.displayName || 'غير محدد'}`);
    console.log(`  Email: ${user.email}`);
    console.log(`\n📋 Custom Claims:`);
    console.log(user.customClaims || 'لا يوجد');
    console.log('');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message, '\n');
    process.exit(1);
  }

  process.exit(0);
}

// معالجة المدخلات من سطر الأوامر
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

if (!command) {
  console.log('\n📖 الاستخدام:');
  console.log('  node scripts/set-admin-claim.js set <email>     - تعيين صلاحية أدمن');
  console.log('  node scripts/set-admin-claim.js remove <email>  - إزالة صلاحية أدمن');
  console.log('  node scripts/set-admin-claim.js view <email>    - عرض صلاحيات المستخدم');
  console.log('\nأمثلة:');
  console.log('  node scripts/set-admin-claim.js set admin@example.com');
  console.log('  node scripts/set-admin-claim.js view admin@example.com');
  console.log('  node scripts/set-admin-claim.js remove admin@example.com\n');
  process.exit(0);
}

if (!email) {
  console.error('\n❌ خطأ: الرجاء تحديد البريد الإلكتروني\n');
  console.log('مثال:');
  console.log(`  node scripts/set-admin-claim.js ${command} user@example.com\n`);
  process.exit(1);
}

// تنفيذ الأمر المناسب
switch (command) {
  case 'set':
    setAdminClaim(email);
    break;
  case 'remove':
    removeAdminClaim(email);
    break;
  case 'view':
    viewClaims(email);
    break;
  default:
    console.error(`\n❌ أمر غير معروف: ${command}\n`);
    console.log('الأوامر المتاحة: set, remove, view\n');
    process.exit(1);
}
