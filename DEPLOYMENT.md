# دليل النشر (Deployment Guide)

## نشر قواعد Firestore

بعد تعديل ملف [firestore.rules](firestore.rules)، يجب نشر القواعد الجديدة:

```bash
firebase deploy --only firestore:rules
```

### التحقق من نجاح النشر

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **Firestore Database** > **Rules**
4. تحقق من أن التاريخ والوقت محدّثان

### اختبار القواعد في Console

1. في صفحة Rules، انقر على **Rules Playground**
2. جرّب العمليات المختلفة:

   **اختبار 1: قراءة المستخدم لملفه الخاص**
   - Operation: `get`
   - Location: `/users/{userId}` (استبدل `{userId}` بـ UID المستخدم)
   - Authenticated: نعم
   - Provider: Custom
   - UID: نفس الـ UID في المسار
   - **النتيجة المتوقعة**: ✅ Allow

   **اختبار 2: قراءة قائمة المستخدمين بدون صلاحيات أدمن**
   - Operation: `list`
   - Location: `/users`
   - Authenticated: نعم
   - Provider: Custom
   - UID: أي UID
   - Custom Claims: `{}` (فارغ)
   - **النتيجة المتوقعة**: ❌ Deny

   **اختبار 3: قراءة قائمة المستخدمين مع صلاحيات أدمن**
   - Operation: `list`
   - Location: `/users`
   - Authenticated: نعم
   - Provider: Custom
   - UID: أي UID
   - Custom Claims: `{"role": "admin"}`
   - **النتيجة المتوقعة**: ✅ Allow

---

## إعداد حساب أدمن

### الخطوات السريعة

1. **تثبيت firebase-admin** (إن لم يكن مثبتاً):
   ```bash
   npm install firebase-admin
   ```

2. **الحصول على Service Account Key**:
   - Firebase Console > Project Settings > Service accounts
   - "Generate new private key"
   - احفظ الملف في: `scripts/serviceAccountKey.json`

3. **تشغيل السكريبت**:
   ```bash
   node scripts/set-admin-claim.js set admin@example.com
   ```

4. **تسجيل الخروج والدخول مرة أخرى** في التطبيق

للمزيد من التفاصيل، راجع [ADMIN_SETUP.md](ADMIN_SETUP.md)

---

## نشر التطبيق

### نشر على Firebase Hosting

```bash
# بناء التطبيق
npm run build

# نشر على Firebase
firebase deploy
```

### نشر على Vercel / Netlify

التطبيق جاهز للنشر على أي منصة تدعم Next.js:

```bash
# بناء التطبيق
npm run build

# اختبار البناء محلياً
npm run start
```

ثم اربط المشروع بـ Vercel أو Netlify من خلال لوحة التحكم الخاصة بهم.

---

## متغيرات البيئة (Environment Variables)

تأكد من إضافة متغيرات Firebase في ملف `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

في بيئة الإنتاج (Vercel/Netlify)، أضف هذه المتغيرات في إعدادات المشروع.

---

## استكشاف الأخطاء

### الخطأ: "Permission denied" رغم أن المستخدم أدمن

**الأسباب المحتملة**:
1. المستخدم لم يسجل خروج ودخول بعد تعيين Custom Claim
2. القواعد لم تُنشر بعد
3. Custom Claim غير صحيح

**الحلول**:
```bash
# 1. التحقق من Custom Claims
node scripts/set-admin-claim.js view admin@example.com

# 2. نشر القواعد مرة أخرى
firebase deploy --only firestore:rules

# 3. في الكود، طباعة Custom Claims:
const tokenResult = await user.getIdTokenResult();
console.log('Claims:', tokenResult.claims);
```

### الخطأ: "Service account not found"

**السبب**: ملف `serviceAccountKey.json` غير موجود

**الحل**: راجع [ADMIN_SETUP.md](ADMIN_SETUP.md) للحصول على Service Account Key

---

## قائمة التحقق قبل النشر

- [ ] نشر قواعد Firestore
- [ ] اختبار القواعد في Firebase Console
- [ ] إعداد حساب أدمن واحد على الأقل
- [ ] التحقق من Custom Claims للأدمن
- [ ] اختبار التطبيق محلياً مع حساب أدمن
- [ ] اختبار التطبيق محلياً مع حساب عادي
- [ ] بناء التطبيق بدون أخطاء (`npm run build`)
- [ ] إعداد متغيرات البيئة في بيئة الإنتاج
- [ ] نشر التطبيق

---

## موارد مفيدة

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
