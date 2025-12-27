'use client';

import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export function useMutations() {
  const { toast } = useToast();

  const addDoc = async (collectionName: string, data: object) => {
    const { error } = await supabase.from(collectionName).insert([data]);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({ title: 'Success', description: 'Document added successfully.' });
    }
  };

  const updateDoc = async (collectionName: string, docId: string, data: object) => {
    const { error } = await supabase
      .from(collectionName)
      .update(data)
      .eq('id', docId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({ title: 'Success', description: 'Document updated successfully.' });
    }
  };

  const deleteDoc = async (collectionName: string, docId: string) => {
    const { error } = await supabase
      .from(collectionName)
      .delete()
      .eq('id', docId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({ title: 'Success', description: 'Document deleted successfully.' });
    }
  };

  return { addDoc, updateDoc, deleteDoc };
}
