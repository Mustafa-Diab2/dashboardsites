# 📧 دليل إعداد إشعارات البريد الإلكتروني
## Email Notifications Setup Guide

تم إعداد نظام الإشعارات بالبريد الإلكتروني بنجاح! سيتم إرسال إشعارات تلقائية عند:
- ✅ إنشاء مهمة جديدة (Task)
- ✅ تعيين دورة تدريبية جديدة (Course)

---

## 📋 المتطلبات

تم تثبيت وإعداد:
- ✅ Firebase Cloud Functions
- ✅ Nodemailer (لإرسال البريد الإلكتروني)
- ✅ Firebase Admin SDK

---

## ⚙️ الإعداد المطلوب

### 1. إعداد بريد Gmail لإرسال الإشعارات

#### الطريقة الأولى: استخدام Gmail App Password (موصى بها)

1. **اذهب إلى إعدادات Google Account:**
   - افتح: https://myaccount.google.com/apppasswords
   - قد يطلب منك تسجيل الدخول مرة أخرى

2. **إنشاء App Password:**
   - في حقل "Select app": اختر **Mail**
   - في حقل "Select device": اختر **Other** واكتب "Firebase Functions"
   - اضغط **Generate**
   - انسخ كلمة المرور المكونة من 16 حرف

3. **تفعيل 2-Step Verification** (إذا لم يكن مفعل):
   - اذهب إلى: https://myaccount.google.com/security
   - فعّل "2-Step Verification"
   - بعدها يمكنك إنشاء App Password

### 2. إضافة متغيرات البيئة في Firebase

قم بتشغيل الأوامر التالية لإعداد البريد الإلكتروني:

```bash
# إضافة بريد المرسل
firebase functions:secrets:set EMAIL_USER

# عند التنفيذ، أدخل: your-email@gmail.com

# إضافة كلمة مرور التطبيق
firebase functions:secrets:set EMAIL_PASS

# عند التنفيذ، أدخل: App Password المكون من 16 حرف

# إضافة البريد الظاهر للمستخدم (اختياري)
firebase functions:secrets:set EMAIL_FROM

# عند التنفيذ، أدخل: نظام إدارة المهام <your-email@gmail.com>
```

#### البديل: استخدام Firebase Config (أقل أماناً)

إذا كنت تفضل استخدام Firebase Config بدلاً من Secrets:

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.pass="your-app-password"
firebase functions:config:set email.from="نظام إدارة المهام <your-email@gmail.com>"
```

ثم عدّل ملف `functions/index.js`:

```javascript
// استبدل:
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS,

// بـ:
user: functions.config().email.user,
pass: functions.config().email.pass,
```

### 3. إعادة نشر Cloud Functions

بعد إضافة المتغيرات، أعد نشر Functions:

```bash
firebase deploy --only functions
```

---

## 🧪 اختبار النظام

### 1. اختبار إشعار المهام

1. قم بتسجيل الدخول كـ **Admin**
2. أنشئ مهمة جديدة وعيّنها لأحد الأعضاء
3. تحقق من بريد العضو - يجب أن يصل إشعار خلال ثوانٍ

### 2. اختبار إشعار الدورات

1. قم بتسجيل الدخول كـ **Admin**
2. أنشئ دورة تدريبية جديدة وعيّنها لأحد الأعضاء
3. تحقق من بريد العضو - يجب أن يصل إشعار خلال ثوانٍ

### 3. مراقبة Logs

لمشاهدة logs الخاصة بـ Cloud Functions:

```bash
# عرض آخر 50 سطر من logs
firebase functions:log --limit 50

# متابعة logs مباشرة
firebase functions:log --only onTaskCreated,onCourseCreated
```

أو من Firebase Console:
- افتح: https://console.firebase.google.com/project/studio-6017697584-aeed8/functions
- اضغط على اسم Function
- اذهب إلى تبويب **Logs**

---

## 📊 هيكل Cloud Functions

### Files Structure

```
functions/
├── index.js              # Cloud Functions الرئيسي
├── package.json          # Dependencies
├── .env.example          # مثال على متغيرات البيئة
├── .gitignore           # تجاهل node_modules و .env
└── node_modules/        # المكتبات المثبتة
```

### Functions المتوفرة

#### 1. `onTaskCreated`
- **Trigger**: عند إنشاء مستند جديد في `/tasks/{taskId}`
- **Action**: إرسال بريد إلكتروني للمستخدم المُعيَّن (`assigneeId`)
- **Email Content**:
  - عنوان المهمة
  - الوصف
  - الأولوية
  - الحالة
  - الموعد النهائي
  - الفريق (Backend/Frontend)

#### 2. `onCourseCreated`
- **Trigger**: عند إنشاء مستند جديد في `/courses/{courseId}`
- **Action**: إرسال بريد إلكتروني للمستخدم المُعيَّن (`userId`)
- **Email Content**:
  - اسم الدورة
  - المدة
  - الحالة
  - رابط الدورة

---

## 🎨 تخصيص القوالب

### تعديل تصميم البريد الإلكتروني

لتخصيص شكل البريد الإلكتروني، عدّل ملف [functions/index.js](functions/index.js):

1. **تغيير الألوان:**
   ```javascript
   // ابحث عن:
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

   // غيّر إلى الألوان المطلوبة
   ```

2. **إضافة شعار الشركة:**
   ```html
   <div class="header">
     <img src="https://your-logo-url.com/logo.png" alt="Logo" style="max-width: 150px;">
     <h1>📋 مهمة جديدة</h1>
   </div>
   ```

3. **تخصيص المحتوى:**
   - عدّل النصوص في `htmlContent`
   - أضف حقول إضافية من بيانات المهمة/الدورة

---

## ⚠️ استكشاف الأخطاء

### البريد لا يُرسل

1. **تحقق من Logs:**
   ```bash
   firebase functions:log --limit 50
   ```

2. **تحقق من المتغيرات:**
   ```bash
   firebase functions:secrets:access EMAIL_USER
   firebase functions:secrets:access EMAIL_PASS
   ```

3. **تحقق من Gmail Settings:**
   - App Password صحيح؟
   - 2-Step Verification مفعل؟
   - لا يوجد قيود على البريد؟

### البريد يذهب إلى Spam

- أضف Domain Verification في Gmail
- استخدم خدمة SMTP محترفة مثل:
  - SendGrid
  - AWS SES
  - Mailgun

### تعديل الكود لاستخدام SendGrid

إذا أردت استخدام SendGrid بدلاً من Gmail:

1. **ثبّت SendGrid:**
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```

2. **عدّل `functions/index.js`:**
   ```javascript
   const sgMail = require('@sendgrid/mail');
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   async function sendEmail(to, subject, htmlContent, textContent) {
     const msg = {
       to: to,
       from: process.env.EMAIL_FROM,
       subject: subject,
       text: textContent,
       html: htmlContent,
     };
     await sgMail.send(msg);
   }
   ```

3. **أضف API Key:**
   ```bash
   firebase functions:secrets:set SENDGRID_API_KEY
   ```

---

## 📈 المراقبة والإحصائيات

### عرض عدد الرسائل المرسلة

في Firebase Console:
- Functions → Metrics
- شاهد:
  - عدد Invocations (التنفيذات)
  - Execution time
  - Memory usage
  - Errors

### التنبيهات (Alerts)

قم بإعداد تنبيهات في حالة فشل Functions:
1. افتح Cloud Console
2. Monitoring → Alerting
3. أنشئ Alert Policy لـ Function errors

---

## 💰 التكلفة

### Cloud Functions Pricing

Firebase Cloud Functions لها **Free Tier**:
- ✅ 2 million invocations/month
- ✅ 400,000 GB-seconds
- ✅ 200,000 CPU-seconds

بعد Free Tier، التكلفة تقريبية:
- $0.40 لكل million invocations
- $0.0000025 لكل GB-second
- $0.00001 لكل CPU-second

**لمشروع صغير-متوسط:**
- التكلفة المتوقعة: **$0 - $5/month**

---

## 🔒 الأمان

### Best Practices

1. **لا تكتب Secrets في الكود:**
   - ✅ استخدم Firebase Secrets
   - ❌ لا تضع passwords في `index.js`

2. **استخدم App Passwords:**
   - ✅ App Password لـ Gmail
   - ❌ كلمة مرور الحساب الأساسية

3. **راجع Firestore Rules:**
   - تأكد أن المستخدمين لا يمكنهم تعديل emails بشكل غير صحيح

4. **Rate Limiting:**
   - راقب عدد الرسائل لتجنب Spam

---

## 🚀 التطويرات المستقبلية

### ميزات يمكن إضافتها:

1. **إشعارات إضافية:**
   - عند تحديث حالة المهمة
   - قبل انتهاء الموعد النهائي
   - عند إضافة تعليق

2. **قوالب متعددة:**
   - قوالب مختلفة حسب نوع الإشعار
   - دعم لغات متعددة

3. **تفضيلات المستخدم:**
   - السماح للمستخدم بإيقاف الإشعارات
   - اختيار نوع الإشعارات المفضلة

4. **إحصائيات:**
   - تتبع معدل فتح الرسائل
   - تحليل أداء الإشعارات

5. **Push Notifications:**
   - إضافة Firebase Cloud Messaging
   - إشعارات في المتصفح والموبايل

---

## 📞 الدعم

إذا واجهت مشكلة:

1. **راجع Logs:**
   ```bash
   firebase functions:log
   ```

2. **تحقق من Status:**
   ```bash
   firebase functions:list
   ```

3. **أعد النشر:**
   ```bash
   firebase deploy --only functions --force
   ```

4. **تواصل مع Firebase Support:**
   - https://firebase.google.com/support

---

## ✅ الخلاصة

تم إعداد نظام الإشعارات بنجاح! 🎉

**ما تم إنجازه:**
- ✅ إنشاء Cloud Functions للمهام والدورات
- ✅ إعداد Nodemailer مع Gmail
- ✅ نشر Functions على Firebase
- ✅ قوالب HTML جميلة للإشعارات

**الخطوات التالية:**
1. إعداد Gmail App Password
2. إضافة Secrets في Firebase
3. إعادة نشر Functions
4. اختبار النظام

**الملفات المهمة:**
- [functions/index.js](functions/index.js) - الكود الرئيسي
- [functions/package.json](functions/package.json) - Dependencies
- [firebase.json](firebase.json) - Firebase Config

---

تم إنشاء هذا الدليل بواسطة Claude Code 🤖
