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
        description: 'You must be logged in to create a course.',
      });
      return;
    }
    if (!form.name || !form.link || !form.duration || !form.userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    try {
      addDoc(collection(firestore, 'courses'), {
        ...form,
        status: 'not_started',
      });
      
      toast({
        title: 'Course Created',
        description: `Course "${form.name}" has been successfully created.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
          <DialogDescription>
            Fill in the details to assign a new course.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Course Link</Label>
            <Input
              id="link"
              type="url"
              value={form.link}
              onChange={e => handleFieldChange('link', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (e.g., 2 hours)</Label>
            <Input
              id="duration"
              value={form.duration}
              onChange={e => handleFieldChange('duration', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assignee">Assign to</Label>
            <Select
              value={form.userId}
              onValueChange={value =>
                handleFieldChange('userId', value)
              }
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users?.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Course</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
