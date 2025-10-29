'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Plus,
  Search,
  FileDown,
  Users,
  BarChart,
  Settings,
  LogOut,
  ListTodo,
  Briefcase,
} from 'lucide-react';

interface CommandPaletteProps {
  onAction: (action: string, data?: any) => void;
}

export function CommandPalette({ onAction }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (action: string, data?: any) => {
    setOpen(false);
    onAction(action, data);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('type_command_or_search')} />
      <CommandList>
        <CommandEmpty>{t('no_results_found')}</CommandEmpty>

        <CommandGroup heading={t('actions')}>
          <CommandItem onSelect={() => handleSelect('new-task')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create_new_task')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('new-client')}>
            <Briefcase className="mr-2 h-4 w-4" />
            {t('create_new_client')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('export-pdf')}>
            <FileDown className="mr-2 h-4 w-4" />
            {t('export_to_pdf')}
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading={t('navigation')}>
          <CommandItem onSelect={() => handleSelect('navigate', 'dashboard')}>
            <BarChart className="mr-2 h-4 w-4" />
            {t('dashboard')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('navigate', 'my-tasks')}>
            <ListTodo className="mr-2 h-4 w-4" />
            {t('my_tasks')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('navigate', 'reports')}>
            <FileDown className="mr-2 h-4 w-4" />
            {t('reports')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('navigate', 'clients')}>
            <Briefcase className="mr-2 h-4 w-4" />
            {t('clients')}
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading={t('filters')}>
          <CommandItem onSelect={() => handleSelect('filter', 'my-tasks')}>
            <Search className="mr-2 h-4 w-4" />
            {t('show_my_tasks')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('filter', 'urgent')}>
            <Search className="mr-2 h-4 w-4" />
            {t('show_urgent')}
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('filter', 'blocked')}>
            <Search className="mr-2 h-4 w-4" />
            {t('show_blocked')}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
