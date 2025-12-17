'use client';

import { useState } from 'react';
import { User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { Users, Save, Plus } from 'lucide-react';
import AddMemberDialog from './add-member-dialog';

interface TeamManagementProps {
  users: User[];
}

export default function TeamManagement({ users }: TeamManagementProps) {
  const { t } = useLanguage();
  const { updateDoc } = useMutations();
  const [userRates, setUserRates] = useState<Record<string, number | string>>(
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.hourlyRate || '' }), {})
  );
  const [isAddMemberDialogOpen, setAddMemberDialogOpen] = useState(false);


  const handleRateChange = (userId: string, value: string) => {
    setUserRates(prev => ({ ...prev, [userId]: value }));
  };

  const handleSaveRate = (userId: string) => {
    const rate = parseFloat(userRates[userId] as string);
    if (!isNaN(rate)) {
      updateDoc('users', userId, { hourlyRate: rate });
    }
  };
  
  const getRoleTranslation = (role: User['role']) => {
    const roleKey = role.replace('_', '-');
    return t(roleKey as any) || role;
  }

  return (
    <>
      <AddMemberDialog isOpen={isAddMemberDialogOpen} onOpenChange={setAddMemberDialogOpen} />
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className="font-headline flex items-center gap-2">
            <Users />
            {t('team_management')}
          </CardTitle>
          <Button onClick={() => setAddMemberDialogOpen(true)}>
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
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleTranslation(user.role)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={userRates[user.id]}
                        onChange={(e) => handleRateChange(user.id, e.target.value)}
                        className="w-24"
                        placeholder={t('not_set')}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleSaveRate(user.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        {t('save')}
                      </Button>
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
