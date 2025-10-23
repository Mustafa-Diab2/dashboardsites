'use client';

import { useFirebase } from '@/firebase';
import {
  addDoc as fbAddDoc,
  updateDoc as fbUpdateDoc,
  deleteDoc as fbDeleteDoc,
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { useToast } from './use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export function useMutations() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const getCollectionRef = (collectionName: string): CollectionReference => {
    if (!firestore) throw new Error('Firestore not initialized');
    return collection(firestore, collectionName);
  };
  
  const getDocRef = (collectionName: string, docId: string): DocumentReference => {
     if (!firestore) throw new Error('Firestore not initialized');
    return doc(firestore, collectionName, docId);
  }

  const addDoc = (collectionName: string, data: object) => {
    const collRef = getCollectionRef(collectionName);
    fbAddDoc(collRef, data)
      .then(() => {
        toast({ title: 'Success', description: 'Document added successfully.' });
      })
      .catch((error) => {
        console.error(`Error adding document to ${collectionName}:`, error);
        const permError = new FirestorePermissionError({
            path: collRef.path,
            operation: 'create',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add document.' });
      });
  };

  const updateDoc = (collectionName: string, docId: string, data: object) => {
    const docRef = getDocRef(collectionName, docId);
    fbUpdateDoc(docRef, data)
      .then(() => {
        toast({ title: 'Success', description: 'Document updated successfully.' });
      })
      .catch((error) => {
        console.error(`Error updating document in ${collectionName}:`, error);
         const permError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update document.' });
      });
  };

  const deleteDoc = (collectionName: string, docId: string) => {
     const docRef = getDocRef(collectionName, docId);
    fbDeleteDoc(docRef)
      .then(() => {
        toast({ title: 'Success', description: 'Document deleted successfully.' });
      })
      .catch((error) => {
        console.error(`Error deleting document from ${collectionName}:`, error);
        const permError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete document.' });
      });
  };

  return { addDoc, updateDoc, deleteDoc };
}
