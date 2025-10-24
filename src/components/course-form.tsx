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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useMutations } from '@/hooks/use-mutations';
import { collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

const INITIAL_FORM_STATE = {
  name: '',
  link: '',
  duration: '',
  userId: '',
};

export default function CourseForm({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { addDoc } = useMutations();
  const { t, language } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users } = useCollection(usersQuery);

  useEffect(() => {
    if (!isOpen) {
      setForm(INITIAL_FORM_STATE);
    }
  }, [isOpen]);

  const handleFieldChange = (field: keyof typeof INITIAL_FORM_STATE, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('must_be_logged_in_to_create_course'),
      });
      return;
    }
    if (!form.name || !form.link || !form.duration || !form.userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('please_fill_all_fields'),
      });
      return;
    }

    addDoc('courses', {
      ...form,
      status: 'not_started',
    });

    setForm(INITIAL_FORM_STATE);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('create_course')}</DialogTitle>
          <DialogDescription>
            {t('create_course_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('course_name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">{t('course_link')}</Label>
            <Input
              id="link"
              type="url"
              value={form.link}
              onChange={e => handleFieldChange('link', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">{t('duration_placeholder')}</Label>
            <Input
              id="duration"
              value={form.duration}
              onChange={e => handleFieldChange('duration', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assignee">{t('assign_to')}</Label>
            <Select
              value={form.userId}
              onValueChange={value =>
                handleFieldChange('userId', value)
              }
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder={t('select_user')} />
              </SelectTrigger>
              <SelectContent>
                {users?.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {(member as any).fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('create_course')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
