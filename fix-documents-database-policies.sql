-- =====================================================
-- إضافة RLS Policies للـ documents و document_folders
-- =====================================================

-- حذف الـ policies القديمة لو موجودة
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update documents" ON documents;
DROP POLICY IF EXISTS "Users can delete documents" ON documents;

DROP POLICY IF EXISTS "Users can view folders" ON document_folders;
DROP POLICY IF EXISTS "Users can create folders" ON document_folders;
DROP POLICY IF EXISTS "Users can insert folders" ON document_folders;
DROP POLICY IF EXISTS "Users can update folders" ON document_folders;
DROP POLICY IF EXISTS "Users can delete folders" ON document_folders;

-- =====================================================
-- Policies للـ documents table
-- =====================================================

-- عرض: الكل يشوف كل المستندات
CREATE POLICY "Users can view documents" ON documents
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- إضافة: أي مستخدم يقدر يضيف مستندات
CREATE POLICY "Users can insert documents" ON documents
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- تعديل: أي مستخدم يقدر يعدل مستنداته
CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- حذف: أي مستخدم يقدر يحذف مستنداته
CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Policies للـ document_folders table
-- =====================================================

-- عرض: الكل يشوف كل المجلدات
CREATE POLICY "Users can view folders" ON document_folders
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- إضافة: أي مستخدم يقدر يضيف مجلدات
CREATE POLICY "Users can insert folders" ON document_folders
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- تعديل: أي مستخدم يقدر يعدل المجلدات
CREATE POLICY "Users can update folders" ON document_folders
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- حذف: أي مستخدم يقدر يحذف المجلدات
CREATE POLICY "Users can delete folders" ON document_folders
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- التحقق من نجاح العملية
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('documents', 'document_folders')
ORDER BY tablename, cmd;
