# إعداد صلاحيات الأدمن (Admin Custom Claims)

## نظرة عامة

هذا التطبيق يستخدم **Firebase Custom Claims** لتحديد صلاحيات الأدمن. هناك فرق بين:

- **`role` في Firestore**: حقل في وثيقة المستخدم (`/users/{userId}`) يمكن أن يكون:
  - `frontend` - مطور فرونت إند
  - `backend` - مطور باك إند
  - `admin` - مدير النظام

- **Custom Claim `role: "admin"`**: صلاحية خاصة في Firebase Auth تُستخدم في قواعد Firestore لتحديد من يمكنه:
  - قراءة قائمة كل المستخدمين (`allow list: if isAdmin()`)
  - قراءة ملفات المستخدمين الآخرين (`allow get: if isAdmin()`)

---

## خطوات إعداد الأدمن

### 1. تثبيت Firebase Admin SDK (إذا لم يكن مثبتًا)

```bash
npm install firebase-admin
```

### 2. إنشاء سكريبت لإعداد Custom Claims

أنشئ ملف `scripts/set-admin-claim.js`:

```javascript
const admin = require('firebase-admin');

// تهيئة Firebase Admin SDK
// الخيار 1: استخدام ملف Service Account
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// الخيار 2: استخدام Application Default Credentials (في بيئة Google Cloud)
// admin.initializeApp();

async function setAdminClaim(email) {
  try {
    // الحصول على المستخدم عن طريق البريد الإلكتروني
    const user = await admin.auth().getUserByEmail(email);

    // تعيين Custom Claim
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin'
    });

    console.log(`✓ تم تعيين صلاحية الأدمن للمستخدم: ${email}`);
    console.log(`  UID: ${user.uid}`);
    console.log(`  يجب على المستخدم تسجيل الدخول مرة أخرى لتفعيل الصلاحيات الجديدة`);

  } catch (error) {
    console.error('خطأ في تعيين صلاحية الأدمن:', error);
  }

  process.exit();
}

// استخدام البريد الإلكتروني من سطر الأوامر
const email = process.argv[2];
if (!email) {
  console.error('الرجاء تحديد البريد الإلكتروني:');
  console.error('  node scripts/set-admin-claim.js user@example.com');
  process.exit(1);
}

setAdminClaim(email);
```

### 3. الحصول على Service Account Key

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **Project Settings** > **Service accounts**
4. انقر على **Generate new private key**
5. احفظ الملف باسم `serviceAccountKey.json` في مجلد `scripts/`
6. **مهم جداً**: أضف `scripts/serviceAccountKey.json` إلى `.gitignore`

```bash
echo "scripts/serviceAccountKey.json" >> .gitignore
```

### 4. تشغيل السكريبت

```bash
node scripts/set-admin-claim.js admin@example.com
```

### 5. إعادة تسجيل الدخول

**مهم**: يجب على المستخدم تسجيل الخروج ثم الدخول مرة أخرى حتى تُطبّق الصلاحيات الجديدة.

---

## التحقق من Custom Claims

### في الكود (Client-Side)

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const tokenResult = await user.getIdTokenResult();
  console.log('Custom Claims:', tokenResult.claims);
  console.log('Is Admin:', tokenResult.claims.role === 'admin');
}
```

### في Firebase Console Rules Simulator

1. اذهب إلى **Firestore Database** > **Rules**
2. انقر على **Rules Playground**
3. اختر `list` operation
4. المسار: `/users`
5. في **Authenticated as**: أدخل UID المستخدم
6. في **Provider**: اختر `Custom`
7. أضف Custom Claims:
   ```json
   {
     "role": "admin"
   }
   ```
8. انقر **Run** - يجب أن تظهر نتيجة "Allow"

---

## قواعد Firestore ذات الصلة

```javascript
// دالة مساعدة للتحقق من الأدمن
function isAdmin() {
  return isSignedIn() && (request.auth.token.role == "admin");
}

// قواعد المستخدمين
match /users/{userId} {
  // القراءة الفردية: المالك أو الأدمن
  allow get: if isOwner(userId) || isAdmin();

  // قراءة القائمة: فقط الأدمن
  allow list: if isAdmin();

  allow create: if isOwner(userId) && request.resource.data.id == request.auth.uid;
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

---

## استكشاف الأخطاء

### الخطأ: "Missing or insufficient permissions"

**السبب**: المستخدم ليس لديه Custom Claim `role: "admin"`

**الحل**:
1. تأكد من تشغيل سكريبت `set-admin-claim.js`
2. تأكد من أن المستخدم سجل خروج ودخول مرة أخرى
3. تحقق من Custom Claims في الكود:
   ```javascript
   const tokenResult = await user.getIdTokenResult();
   console.log(tokenResult.claims);
   ```

### الخطأ: "Service account not found"

**السبب**: ملف `serviceAccountKey.json` غير موجود أو في مسار خاطئ

**الحل**:
1. تأكد من وجود الملف في `scripts/serviceAccountKey.json`
2. تأكد من أن المسار في السكريبت صحيح

---

## البديل: استخدام Cloud Functions

يمكنك أيضاً إنشاء Cloud Function لتعيين صلاحيات الأدمن:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // التحقق من أن المستخدم الحالي هو أدمن
  if (!context.auth.token.role === 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set admin roles'
    );
  }

  const email = data.email;
  const user = await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(user.uid, {
    role: 'admin'
  });

  return { success: true };
});
```

---

## ملاحظات أمنية

1. **لا تشارك** ملف `serviceAccountKey.json` أبداً
2. أضف الملف إلى `.gitignore` دائماً
3. لا تستخدم Custom Claims لتخزين بيانات حساسة (الحد الأقصى 1000 بايت)
4. Custom Claims تُخزّن في JWT Token وتُرسل مع كل طلب
5. لا يمكن للمستخدم تعديل Custom Claims من جانب العميل

---

## المراجع

- [Firebase Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
