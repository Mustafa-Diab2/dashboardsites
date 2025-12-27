'use client';

import { useState } from 'react';
import { User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { Users, Save, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import AddMemberDialog from './add-member-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { adminDeleteUser } from '@/lib/admin-actions';

interface TeamManagementProps {
  users: User[];
}

export default function TeamManagement({ users }: TeamManagementProps) {
  const { t } = useLanguage();
  const { updateDoc, deleteDoc } = useMutations();
  const [userRates, setUserRates] = useState<Record<string, number | string>>(
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.hourly_rate || '' }), {})
  );
  const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);
  const { toast } = useToast();

  const handleRateChange = (userId: string, value: string) => {
    setUserRates(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveRate = (userId: string) => {
    const rate = parseFloat(userRates[userId] as string);
    if (!isNaN(rate)) {
      updateDoc('profiles', userId, { hourly_rate: rate });
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setAddMemberDialogOpen(true);
  };

  const handleAddUser = () => {
    setUserToEdit(undefined);
    setAddMemberDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await adminDeleteUser(userId);
      if (!result.success) throw new Error(result.error);

      toast({
        title: t('user_deleted_title'),
        description: t('user_deleted_desc'),
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: t('error_title'),
        description: error.message,
      });
    }
  };

  const getRoleTranslation = (role: User['role']) => {
    const roleKey = role || 'frontend';
    return t(roleKey as any) || role;
  }

  return (
    <>
      <AddMemberDialog
        isOpen={isAddMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        userToEdit={userToEdit}
      />
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className="font-headline flex items-center gap-2">
            <Users />
            {t('team_management')}
          </CardTitle>
          <Button onClick={handleAddUser}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add_member')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee_name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('hourly_rate')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleTranslation(user.role)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Input
                          type="number"
                          value={userRates[user.id]}
                          onChange={(e) => handleRateChange(user.id, e.target.value)}
                          className="w-24"
                          placeholder={t('not_set')}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleSaveRate(user.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t('edit')}</span>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{t('delete')}</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('delete_user_confirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
