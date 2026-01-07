'use client';

import { useState, useCallback } from 'react';
import {
    FileIcon,
    FolderIcon,
    Upload,
    Trash2,
    Download,
    Search,
    Grid,
    List,
    Plus,
    Image as ImageIcon,
    FileText,
    Video,
    File,
    X,
    ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '@/context/language-context';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useMutations } from '@/hooks/use-mutations';
import { useClients } from '@/hooks/use-clients';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface FileRecord {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    client_id?: string;
    task_id?: string;
    folder?: string;
    uploaded_by: string;
    uploaded_by_name?: string;
    created_at: string;
}

const FOLDERS = ['general', 'contracts', 'invoices', 'designs', 'documents'];

export function FileManager() {
    const { t, language } = useLanguage();
    const { user } = useSupabase();
    const clients = useClients();
    const { addDoc, deleteDoc } = useMutations();
    const { toast } = useToast();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedClient, setSelectedClient] = useState('all');
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadFolder, setUploadFolder] = useState('general');
    const [uploadClientId, setUploadClientId] = useState('');

    const fetchFiles = useCallback(
        (query: any) => query.order('created_at', { ascending: false }),
        []
    );

    const { data: filesData } = useSupabaseCollection<FileRecord>(
        'files',
        fetchFiles
    );

    const files = (filesData || []) as FileRecord[];

    const filteredFiles = files.filter((file) => {
        const matchesSearch =
            searchQuery === '' ||
            file.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder =
            selectedFolder === 'all' || file.folder === selectedFolder;
        const matchesClient =
            selectedClient === 'all' || file.client_id === selectedClient;

        return matchesSearch && matchesFolder && matchesClient;
    });

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-8 w-8" />;
        if (fileType.startsWith('video/')) return <Video className="h-8 w-8" />;
        if (fileType.includes('pdf')) return <FileText className="h-8 w-8" />;
        return <File className="h-8 w-8" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleUpload = async () => {
        if (!uploadFile || !user) return;

        setIsUploading(true);

        try {
            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${uploadFolder}/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('files')
                .upload(filePath, uploadFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('files')
                .getPublicUrl(filePath);

            // Save file record to database
            await addDoc('files', {
                name: uploadFile.name,
                file_path: urlData.publicUrl,
                file_type: uploadFile.type,
                file_size: uploadFile.size,
                folder: uploadFolder,
                client_id: (uploadClientId && uploadClientId !== 'none') ? uploadClientId : null,
                uploaded_by: user.id,
                uploaded_by_name: user.user_metadata?.full_name || user.email,
                created_at: new Date().toISOString(),
            });

            toast({ title: t('file_uploaded'), description: uploadFile.name });
            setUploadDialogOpen(false);
            setUploadFile(null);
            setUploadFolder('general');
            setUploadClientId('');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                variant: 'destructive',
                title: t('upload_failed'),
                description: error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (file: FileRecord) => {
        try {
            // Extract path from URL for storage deletion
            const urlParts = file.file_path.split('/files/');
            if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                await supabase.storage.from('files').remove([storagePath]);
            }

            await deleteDoc('files', file.id, { silent: true });
            toast({ title: t('file_deleted'), description: file.name });
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            return formatDistanceToNow(date, {
                addSuffix: true,
                locale: language === 'ar' ? ar : enUS,
            });
        } catch (err) {
            console.error('Date formatting error:', err);
            return '';
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle className="font-headline flex items-center gap-2">
                            <FolderIcon className="h-5 w-5" />
                            {t('file_manager')}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('search_files')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 sm:h-10"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 sm:h-10 w-9 sm:w-10"
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            >
                                {viewMode === 'grid' ? (
                                    <List className="h-4 w-4" />
                                ) : (
                                    <Grid className="h-4 w-4" />
                                )}
                            </Button>
                            <Button onClick={() => setUploadDialogOpen(true)} className="h-9 sm:h-10">
                                <Upload className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">{t('upload')}</span>
                                <span className="sm:hidden">{t('add')}</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
                        <div className="grid gap-1.5 flex-1 min-w-[140px]">
                            <Label className="text-xs sm:text-sm">{t('folder')}</Label>
                            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                                <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {FOLDERS.map((folder) => (
                                        <SelectItem key={folder} value={folder}>
                                            {t(folder as any)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5 flex-1 min-w-[140px]">
                            <Label className="text-xs sm:text-sm">{t('client')}</Label>
                            <Select value={selectedClient} onValueChange={setSelectedClient}>
                                <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('all')}</SelectItem>
                                    {(clients || []).map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Files Display */}
                    {filteredFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileIcon className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t('no_files_found')}</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="text-muted-foreground mb-2">
                                            {getFileIcon(file.file_type)}
                                        </div>
                                        <p className="text-sm font-medium truncate w-full">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.file_size)}
                                        </p>
                                        <Badge variant="secondary" className="mt-2 text-xs">
                                            {file.folder}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <a
                                                        href={file.file_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        {t('open')}
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <a href={file.file_path} download={file.name}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        {t('download')}
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(file)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    {t('delete')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left p-3 text-sm font-medium">
                                            {t('name')}
                                        </th>
                                        <th className="text-left p-3 text-sm font-medium">
                                            {t('folder')}
                                        </th>
                                        <th className="text-left p-3 text-sm font-medium">
                                            {t('size')}
                                        </th>
                                        <th className="text-left p-3 text-sm font-medium">
                                            {t('uploaded_by')}
                                        </th>
                                        <th className="text-left p-3 text-sm font-medium">
                                            {t('date')}
                                        </th>
                                        <th className="text-right p-3 text-sm font-medium">
                                            {t('actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredFiles.map((file) => (
                                        <tr key={file.id} className="hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {getFileIcon(file.file_type)}
                                                    <span className="text-sm">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="secondary">{file.folder}</Badge>
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {formatFileSize(file.file_size)}
                                            </td>
                                            <td className="p-3 text-sm">
                                                {file.uploaded_by_name || '-'}
                                            </td>
                                            <td className="p-3 text-sm text-muted-foreground">
                                                {getTimeAgo(file.created_at)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a
                                                            href={file.file_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(file)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle>{t('upload_file')}</DialogTitle>
                        <DialogDescription>{t('upload_file_desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div
                            className={cn(
                                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                                uploadFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                            )}
                        >
                            {uploadFile ? (
                                <div className="flex items-center justify-center gap-2">
                                    <FileIcon className="h-6 w-6" />
                                    <span className="font-medium">{uploadFile.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setUploadFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {t('click_to_upload')}
                                    </p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('folder')}</Label>
                            <Select value={uploadFolder} onValueChange={setUploadFolder}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FOLDERS.map((folder) => (
                                        <SelectItem key={folder} value={folder}>
                                            {t(folder as any)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('link_to_client')}</Label>
                            <Select value={uploadClientId} onValueChange={setUploadClientId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('optional')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('none')}</SelectItem>
                                    {(clients || []).map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                            {t('cancel')}
                        </Button>
                        <Button onClick={handleUpload} disabled={!uploadFile || isUploading}>
                            {isUploading ? t('uploading') : t('upload')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
