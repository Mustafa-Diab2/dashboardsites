'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase';
import type { User } from '@/lib/data';

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function AddMemberDialog({ isOpen, onOpenChange }: AddMemberDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const app = useFirebaseApp();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'frontend' as User['role'],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const { email, password, fullName, role } = formData;

    if (!email || !password || !fullName || !role) {
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: t('please_fill_all_fields'),
      });
      setIsLoading(false);
      return;
    }
    
    try {
        const functions = getFunctions(app);
        const createNewUser = httpsCallable(functions, 'createNewUser');
        const result = await createNewUser({ email, password, fullName, role });

        if ((result.data as any).success) {
            toast({
                title: t('user_created_title'),
                description: t('user_created_desc', { email }),
            });
            onOpenChange(false);
            setFormData({ fullName: '', email: '', password: '', role: 'frontend' });
        } else {
            throw new Error((result.data as any).error || 'Failed to create user.');
        }
    } catch (error: any) {
        console.error('Error creating user:', error);
        toast({
            variant: 'destructive',
            title: t('error_title'),
            description: error.message || t('error_desc'),
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('add_member')}</DialogTitle>
          <DialogDescription>{t('add_member_desc')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">{t('full_name')}</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={e => handleFieldChange('fullName', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => handleFieldChange('email', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={e => handleFieldChange('password', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">{t('role')}</Label>
            <Select value={formData.role} onValueChange={value => handleFieldChange('role', value)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">{t('frontend')}</SelectItem>
                <SelectItem value="backend">{t('backend')}</SelectItem>
                <SelectItem value="ui_ux">{t('ui_ux')}</SelectItem>
                <SelectItem value="security">{t('security')}</SelectItem>
                <SelectItem value="admin">{t('admin')}</SelectItem>
                <SelectItem value="trainee">{t('trainee')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? t('creating') : t('create_user')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
