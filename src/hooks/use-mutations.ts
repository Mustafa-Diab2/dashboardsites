'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export function useMutations() {
  const { toast } = useToast();

  const addDoc = useCallback(async (collectionName: string, data: object, options?: { silent?: boolean }) => {
    const { data: result, error } = await supabase.from(collectionName).insert([data]).select();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      throw error;
    } else {
      if (!options?.silent) {
        toast({ title: 'Success', description: 'Document added successfully.' });
      }
      return result;
    }
  }, [toast]);

  const updateDoc = useCallback(async (collectionName: string, docId: string, data: object, options?: { silent?: boolean }) => {
    const { data: result, error } = await supabase
      .from(collectionName)
      .update(data)
      .eq('id', docId)
      .select();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      throw error;
    } else {
      if (!options?.silent) {
        toast({ title: 'Success', description: 'Document updated successfully.' });
      }
      return result;
    }
  }, [toast]);

  const deleteDoc = useCallback(async (collectionName: string, docId: string, options?: { silent?: boolean }) => {
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
      throw error;
    } else {
      if (!options?.silent) {
        toast({ title: 'Success', description: 'Document deleted successfully.' });
      }
      return true;
    }
  }, [toast]);

  return { addDoc, updateDoc, deleteDoc };
}
