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
import { useSupabase } from '@/context/supabase-context';
import { useMutations } from '@/hooks/use-mutations';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import type { Client } from '@/lib/data';
import { Textarea } from './ui/textarea';

const INITIAL_FORM_STATE: Omit<Client, 'id'> = {
  name: '',
  project_name: '',
  total_payment: 0,
  paid_amount: 0,
  contact_info: '',
  notes: '',
};

export default function ClientForm({
  isOpen,
  onOpenChange,
  client,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  client?: Client;
}) {
  const { user } = useSupabase();
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMutations();
  const { t, language } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setForm(client);
      } else {
        setForm(INITIAL_FORM_STATE);
      }
    }
  }, [isOpen, client]);

  const handleFieldChange = (field: keyof typeof INITIAL_FORM_STATE, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('must_be_logged_in_to_create_course'), // Using existing translation
      });
      return;
    }
    if (!form.name || !form.project_name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: t('client_and_project_name_required'),
      });
      return;
    }

    const clientData = {
      name: form.name,
      project_name: form.project_name,
      total_payment: form.total_payment,
      paid_amount: form.paid_amount,
      contact_info: form.contact_info,
      notes: form.notes,
      created_by: user.id,
    };

    if (client) {
      updateDoc('clients', client.id, clientData);
    } else {
      addDoc('clients', {
        ...clientData,
        created_at: new Date().toISOString(),
      });
    }

    setForm(INITIAL_FORM_STATE);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{client ? t('edit_client') : t('add_client')}</DialogTitle>
          <DialogDescription>
            {t('client_form_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('client_name')}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="project_name">{t('project_name')}</Label>
            <Input
              id="project_name"
              value={form.project_name}
              onChange={e => handleFieldChange('project_name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="total_payment">{t('total_payment')}</Label>
              <Input
                id="total_payment"
                type="number"
                value={form.total_payment || ''}
                onChange={e => handleFieldChange('total_payment', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paid_amount">{t('paid_amount')}</Label>
              <Input
                id="paid_amount"
                type="number"
                value={form.paid_amount || ''}
                onChange={e => handleFieldChange('paid_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_info">{t('contact_info')}</Label>
            <Input
              id="contact_info"
              value={form.contact_info || ''}
              onChange={e => handleFieldChange('contact_info', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              value={form.notes || ''}
              onChange={e => handleFieldChange('notes', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>{client ? t('save_changes') : t('add_client')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
