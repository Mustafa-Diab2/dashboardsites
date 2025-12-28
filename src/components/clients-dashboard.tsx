'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, Users, MoreHorizontal, Edit, Trash2, Link } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';

export default function ClientsDashboard() {
  const { t } = useLanguage();
  const [isClientFormOpen, setClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);
  const clients = useClients();
  const { updateDoc, deleteDoc } = useMutations();
  const { toast } = useToast();
  const [portalLink, setPortalLink] = useState<string | null>(null);

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

  const handleGeneratePortalLink = (client: Client) => {
    const token = client.public_token || crypto.randomUUID();
    const link = `${window.location.origin}/client-portal/${token}`;

    // If the client doesn't have a token, update the document
    if (!client.public_token) {
      updateDoc('clients', client.id, { public_token: token });
    }

    setPortalLink(link);
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

      <AlertDialog open={!!portalLink} onOpenChange={() => setPortalLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Client Portal Link</AlertDialogTitle>
            <AlertDialogDescription>
              Share this secure link with your client for them to view project progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            readOnly
            value={portalLink || ''}
            className="my-4"
            onFocus={(e) => e.target.select()}
          />
          <AlertDialogFooter>
            <Button onClick={() => {
              if (portalLink) {
                navigator.clipboard.writeText(portalLink);
                toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
              }
            }}>
              Copy Link
            </Button>
            <AlertDialogAction onClick={() => setPortalLink(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
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
                            <DropdownMenuItem onClick={() => handleGeneratePortalLink(client)}>
                              <Link className="mr-2 h-4 w-4" />
                              <span>Client Portal</span>
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
