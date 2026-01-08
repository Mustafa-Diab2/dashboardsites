'use client'

import { useState, useRef } from 'react'
import { useLanguage } from '@/context/language-context'
import { useSupabase } from '@/context/supabase-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, Upload, Download, Folder, File, Trash2, Share2,
  Eye, Edit, Clock, User, Search, Grid, List, Plus, X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCollection } from '@/hooks/use-supabase-data'
import { useAddMutation, useDeleteMutation } from '@/hooks/use-mutations'
import { supabase } from '@/lib/supabase'

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  folder_id: string | null
  uploaded_by: string
  created_at: string
  updated_at: string
  tags: string[]
  shared_with: string[]
}

interface Folder {
  id: string
  name: string
  parent_id: string | null
  created_by: string
  created_at: string
}

export function DocumentManagement() {
  const { language } = useLanguage()
  const { user } = useSupabase()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: documents } = useCollection<Document>('documents', (q) => {
    let query = currentFolder 
      ? q.eq('folder_id', currentFolder)
      : q.is('folder_id', null)
    return query.order('created_at', { ascending: false })
  })

  const { data: folders } = useCollection<Folder>('document_folders', (q) => 
    currentFolder
      ? q.eq('parent_id', currentFolder)
      : q.is('parent_id', null)
  )

  const { mutate: addDocument } = useAddMutation('documents')
  const { mutate: deleteDocument } = useDeleteMutation('documents')
  const { mutate: addFolder } = useAddMutation('document_folders')

  const filteredDocuments = documents?.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadPromises = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = `${user?.id}/${Date.now()}_${file.name}`

        // Upload to Supabase Storage
        const uploadPromise = (async () => {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Add to database
          return addDocument({
            name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            folder_id: currentFolder,
            uploaded_by: user?.id,
            tags: [],
            shared_with: []
          })
        })()

        uploadPromises.push(uploadPromise)
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises)

      // Wait a moment for real-time to propagate
      await new Promise(resolve => setTimeout(resolve, 800))
      
      toast({
        title: language === 'ar' ? 'تم الرفع' : 'Uploaded',
        description: language === 'ar' ? `تم رفع ${files.length} ملف بنجاح` : `${files.length} files uploaded successfully`
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: language === 'ar' ? 'خطأ في الرفع' : 'Upload Error',
        description: language === 'ar' ? 'فشل رفع بعض الملفات' : 'Failed to upload some files',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setShowUploadDialog(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحميل الملف' : 'Failed to download file',
        variant: 'destructive'
      })
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(language === 'ar' ? 'هل تريد حذف هذا الملف؟' : 'Delete this file?')) return

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.file_path])
      
      // Delete from database
      await deleteDocument(doc.id)

      // Force refresh
      setRefreshKey(prev => prev + 1)

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل حذف الملف' : 'Failed to delete file',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📎'
  }

  const handleCreateFolder = async () => {
    const name = prompt(language === 'ar' ? 'اسم المجلد:' : 'Folder name:')
    if (!name) return

    try {
      await addFolder({
        name,
        parent_id: currentFolder,
        created_by: user?.id
      })

      // Force refresh
      setRefreshKey(prev => prev + 1)

      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Created',
      })
    } catch (error) {
      console.error('Create folder error:', error)
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل إنشاء المجلد' : 'Failed to create folder',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            {language === 'ar' ? 'إدارة المستندات' : 'Document Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'رفع وإدارة جميع ملفات المشاريع' : 'Upload and manage all project files'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateFolder}>
            <Folder className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'مجلد جديد' : 'New Folder'}
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'رفع ملفات' : 'Upload Files'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'رفع ملفات' : 'Upload Files'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'اضغط لاختيار الملفات أو اسحبها هنا' : 'Click to select files or drag them here'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</span>
                      <span>{uploadProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في المستندات...' : 'Search documents...'}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          {currentFolder && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Button variant="link" size="sm" onClick={() => setCurrentFolder(null)}>
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Button>
              <span>/</span>
              <span>{folders?.find(f => f.id === currentFolder)?.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Folders */}
      {folders && folders.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
          {folders.map(folder => (
            <Card
              key={folder.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setCurrentFolder(folder.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Folder className="w-8 h-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{folder.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(folder.created_at).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documents */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDocuments?.map(doc => (
            <Card key={doc.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="text-5xl mb-3">{getFileIcon(doc.file_type)}</div>
                  <div className="w-full">
                    <div className="font-medium truncate mb-1">{doc.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {formatFileSize(doc.file_size)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocuments?.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 group">
                  <div className="text-3xl">{getFileIcon(doc.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{doc.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!filteredDocuments || filteredDocuments.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{language === 'ar' ? 'لا توجد مستندات' : 'No documents'}</p>
            <p className="text-sm">{language === 'ar' ? 'ابدأ برفع ملفاتك' : 'Start by uploading your files'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
