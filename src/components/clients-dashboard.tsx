
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Users, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import ClientForm from './client-form';
import { useClients } from '@/hooks/use-clients';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutations } from '@/hooks/use-mutations';
import type { Client } from '@/lib/data';

export default function ClientsDashboard() {
  const { t } = useLanguage();
  const [isClientFormOpen, setClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const clients = useClients();
  const { deleteDoc } = useMutations();

  const handleAddClient = () => {
    setSelectedClient(undefined);
    setClientFormOpen(true);
  };
  
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientFormOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    deleteDoc('clients', clientId);
  };
  
  const calculateBalance = (total?: number, paid?: number) => {
    const balance = (total || 0) - (paid || 0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);
  }

  return (
    <>
      <ClientForm 
        isOpen={isClientFormOpen} 
        onOpenChange={setClientFormOpen}
        client={selectedClient}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2">
            <Users />
            {t('manage_clients')}
          </CardTitle>
          <Button onClick={handleAddClient}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add_client')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('client_name')}</TableHead>
                  <TableHead>{t('project_name')}</TableHead>
                  <TableHead>{t('total_payment')}</TableHead>
                  <TableHead>{t('paid_amount')}</TableHead>
                  <TableHead>{t('balance')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients && clients.length > 0 ? (
                  clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.project_name}</TableCell>
                      <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(client.total_payment || 0)}</TableCell>
                      <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(client.paid_amount || 0)}</TableCell>
                      <TableCell>{calculateBalance(client.total_payment, client.paid_amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>{t('edit')}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>{t('delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t('no_clients_found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
