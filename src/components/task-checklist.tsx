'use client';

import { useState } from 'react';
import { ChecklistItem } from '@/lib/data';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/context/language-context';

interface TaskChecklistProps {
  checklist: ChecklistItem[];
  onChange: (checklist: ChecklistItem[]) => void;
  readonly?: boolean;
}

export function TaskChecklist({ checklist, onChange, readonly = false }: TaskChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const { t } = useLanguage();

  const addItem = () => {
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: newItemTitle.trim(),
      done: false,
      createdAt: new Date(),
    };

    onChange([...checklist, newItem]);
    setNewItemTitle('');
  };

  const toggleItem = (id: string) => {
    onChange(
      checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const removeItem = (id: string) => {
    onChange(checklist.filter((item) => item.id !== id));
  };

  const completedCount = checklist.filter((item) => item.done).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {t('checklist')}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {totalCount} {t('completed')}
          </span>
        </div>
        {totalCount > 0 && (
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <Checkbox
              checked={item.done}
              onCheckedChange={() => !readonly && toggleItem(item.id)}
              disabled={readonly}
            />
            <span
              className={`flex-1 ${
                item.done ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {item.title}
            </span>
            {!readonly && (
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {!readonly && (
          <div className="flex gap-2 pt-2">
            <Input
              placeholder={t('add_checklist_item')}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
            />
            <Button onClick={addItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
