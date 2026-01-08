-- =====================================================
-- إنشاء Storage Bucket للمستندات
-- =====================================================

-- إنشاء bucket (نفذ هذا من Supabase Dashboard → SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',           -- ID
  'documents',           -- Name
  false,                 -- Private (not public)
  52428800,              -- 50 MB file size limit
  NULL                   -- All file types allowed
)
ON CONFLICT (id) DO NOTHING;

-- إضافة Policies للـ Storage
-- حذف الـ policies القديمة لو موجودة
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can download files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files" ON storage.objects;

-- السماح برفع الملفات
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

-- السماح بتحميل الملفات
CREATE POLICY "Users can download files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

-- السماح بحذف الملفات
CREATE POLICY "Users can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

-- التحقق من نجاح العملية
SELECT * FROM storage.buckets WHERE id = 'documents';
