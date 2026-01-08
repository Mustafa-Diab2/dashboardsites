# 📁 دليل إعداد Document Management

## المشكلة الحالية ❌
الـ database tables موجودة لكن:
1. **RLS Policies ناقصة** - المستخدمين مش يقدروا يضيفوا ملفات (فقط عرض)
2. **Storage Bucket غير موجود** - لازم تنشئه يدوياً في Supabase

---

## الحل: خطوات الإعداد الكامل ✅

### 1️⃣ تنفيذ SQL Policies

افتح Supabase Dashboard → SQL Editor وشغل الملف: `fix-documents-policies.sql`

أو انسخ والصق الكود:

```sql
-- حذف الـ policy القديمة
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;

-- Policies للـ documents
CREATE POLICY "Users can view documents" ON documents
  FOR SELECT USING (
    uploaded_by = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Policies للـ folders
CREATE POLICY "Users can view folders" ON document_folders FOR SELECT USING (true);
CREATE POLICY "Users can create folders" ON document_folders FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update folders" ON document_folders FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete folders" ON document_folders FOR DELETE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

---

### 2️⃣ إنشاء Storage Bucket

**الطريقة الأولى: من Dashboard (سهلة) 👍**

1. اذهب إلى: https://supabase.com/dashboard
2. افتح مشروعك → Storage → Buckets
3. اضغط **"New Bucket"**
4. املأ البيانات:
   - **Name:** `documents`
   - **Public:** ❌ OFF (خلّيه Private)
   - **File size limit:** `52428800` (50 MB)
   - **Allowed MIME types:** اتركها فاضية
5. اضغط **"Create bucket"**

**الطريقة الثانية: من SQL Editor**

```sql
-- إنشاء bucket (لو ما اشتغلت، استخدم الطريقة الأولى)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800);
```

---

### 3️⃣ إضافة Storage Policies

بعد إنشاء الـ bucket، اذهب إلى:
**Storage → documents bucket → Policies**

أو شغل في SQL Editor:

```sql
-- رفع الملفات
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- تحميل الملفات
CREATE POLICY "Users can download files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  )
);

-- حذف الملفات
CREATE POLICY "Users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
);
```

---

### 4️⃣ التحقق من التثبيت

**التحقق من Tables:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('documents', 'document_folders');
```

**التحقق من Policies:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('documents', 'document_folders');
```

**التحقق من Storage Bucket:**
```sql
SELECT * FROM storage.buckets WHERE id = 'documents';
```

**التحقق من Storage Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## ملاحظات مهمة 📝

### بنية المجلدات في Storage:
```
documents/
├── {user_id}/
│   ├── {timestamp}_{filename}.pdf
│   ├── {timestamp}_{filename}.docx
│   └── ...
```

### صلاحيات المستخدمين:
- **موظف عادي:** رفع/تحميل/حذف ملفاته فقط
- **مدير:** رفع/تحميل/حذف ملفاته + تحميل ملفات الآخرين
- **أدمن:** كل الصلاحيات على كل الملفات

### الحد الأقصى للملفات:
- **حجم الملف:** 50 MB (قابل للتعديل)
- **عدد الملفات:** غير محدود
- **أنواع الملفات:** كل الأنواع مسموحة

---

## استكشاف الأخطاء 🔧

### ❌ "new row violates row-level security policy"
**الحل:** تأكد من تنفيذ جميع الـ RLS Policies أعلاه

### ❌ "The resource was not found - Bucket not found"
**الحل:** أنشئ الـ bucket من Dashboard (الخطوة 2)

### ❌ "Row level security policy prevents access"
**الحل:** تأكد من:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
```

### ❌ الملفات بترفع لكن مش بتظهر
**الحل:** امسح cache المتصفح وانتظر ثانية (Real-time يحتاج وقت)

---

## اختبار سريع ⚡

بعد تطبيق كل الخطوات:

1. سجل دخول كمستخدم عادي
2. اذهب إلى Document Management
3. اضغط "Upload Files"
4. ارفع ملف صغير (مثلاً PDF)
5. انتظر ثانية
6. المفروض الملف يظهر في القائمة ✅

---

## الدعم 💬

لو واجهت أي مشكلة، تحقق من:
- Console في المتصفح (F12)
- Supabase Logs في Dashboard
- الـ errors في terminal
