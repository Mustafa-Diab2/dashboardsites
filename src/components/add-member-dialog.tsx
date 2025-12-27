'use client';

import { useEffect, useState } from 'react';
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
import type { User } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { adminCreateUser } from '@/lib/admin-actions';

interface AddMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userToEdit?: User;
}

export default function AddMemberDialog({ isOpen, onOpenChange, userToEdit }: AddMemberDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'frontend' as User['role'],
  });
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          full_name: userToEdit.full_name,
          email: userToEdit.email,
          password: '',
          role: userToEdit.role,
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          password: '',
          role: 'frontend' as User['role'],
        });
      }
    }
  }, [isOpen, userToEdit, isEditing]);


  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role
          })
          .eq('id', userToEdit.id);

        if (error) throw error;

        toast({
          title: t('user_updated_title'),
          description: t('user_updated_desc', { email: userToEdit.email }),
        });
      } else {
        const { email, password, full_name, role } = formData;

        if (!email || !password || !full_name || !role) {
          toast({
            variant: 'destructive',
            title: t('error_title'),
            description: t('please_fill_all_fields'),
          });
          setIsLoading(false);
          return;
        }

        const result = await adminCreateUser({
          email,
          password,
          full_name,
          role
        });

        if (!result.success) throw new Error(result.error);

        toast({
          title: t('user_created_title'),
          description: t('user_created_desc', { email }),
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing user:', error);
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
          <DialogTitle>{isEditing ? t('edit_member') : t('add_member')}</DialogTitle>
          <DialogDescription>{isEditing ? t('edit_member_desc') : t('add_member_desc')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">{t('full_name')}</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={e => handleFieldChange('full_name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => handleFieldChange('email', e.target.value)}
              disabled={isEditing}
            />
          </div>
          {!isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => handleFieldChange('password', e.target.value)}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="role">{t('role')}</Label>
            <Select value={formData.role} onValueChange={value => handleFieldChange('role', value as any)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontend">{t('frontend')}</SelectItem>
                <SelectItem value="backend">{t('backend')}</SelectItem>
                <SelectItem value="ui_ux">{t('ui_ux')}</SelectItem>
                <SelectItem value="security">{t('security')}</SelectItem>
                <SelectItem value="ai_specialist">{t('ai_specialist')}</SelectItem>
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
            {isLoading ? (isEditing ? t('saving') : t('creating')) : (isEditing ? t('save_changes') : t('create_user'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
