-- =====================================================
-- إصلاح Policies للـ Document Management
-- =====================================================

-- حذف الـ policy القديمة لو موجودة
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;

DROP POLICY IF EXISTS "Users can view folders" ON document_folders;
DROP POLICY IF EXISTS "Users can create folders" ON document_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON document_folders;

-- =====================================================
-- Policies للـ documents table
-- =====================================================

-- عرض: المستخدم يشوف الملفات اللي رفعها أو اللي مشاركة معاه
CREATE POLICY "Users can view documents" ON documents
  FOR SELECT 
  USING (
    uploaded_by = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- رفع: أي مستخدم يقدر يرفع ملفات
CREATE POLICY "Users can upload documents" ON documents
  FOR INSERT 
  WITH CHECK (uploaded_by = auth.uid());

-- تعديل: المستخدم يقدر يعدل ملفاته فقط أو الأدمن
CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- حذف: المستخدم يقدر يحذف ملفاته فقط أو الأدمن
CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE 
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- Policies للـ document_folders table
-- =====================================================

-- عرض: الكل يشوف كل المجلدات
CREATE POLICY "Users can view folders" ON document_folders
  FOR SELECT 
  USING (true);

-- إنشاء: أي مستخدم يقدر ينشئ مجلد
CREATE POLICY "Users can create folders" ON document_folders
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- تعديل: المستخدم يقدر يعدل مجلداته فقط
CREATE POLICY "Users can update folders" ON document_folders
  FOR UPDATE 
  USING (created_by = auth.uid());

-- حذف: المستخدم يقدر يحذف مجلداته فقط أو الأدمن
CREATE POLICY "Users can delete folders" ON document_folders
  FOR DELETE 
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- Storage Bucket Configuration (نفذها من Supabase Dashboard)
-- =====================================================

-- ⚠️ هذا الكود للتوضيح فقط - نفذه من Supabase Dashboard → Storage
-- 1. اذهب إلى: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
-- 2. اضغط "New Bucket"
-- 3. الاسم: documents
-- 4. Public: OFF (خلّيه Private)
-- 5. File size limit: 50 MB (أو حسب احتياجك)
-- 6. Allowed MIME types: اتركها فاضية لأي نوع ملف

-- بعد إنشاء الـ bucket، اضبط الـ Storage Policies:

-- Policy للرفع (Upload)
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy للقراءة (Download)
CREATE POLICY "Users can download their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
);

-- Policy للحذف (Delete)
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);
