'use client';

import { useState } from 'react';
import { ResearchItem } from '@/lib/data';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { BookOpen, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useLanguage } from '@/context/language-context';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';

interface TaskResearchProps {
  research: ResearchItem[];
  onChange: (research: ResearchItem[]) => void;
  readonly?: boolean;
}

export function TaskResearch({ research, onChange, readonly = false }: TaskResearchProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ResearchItem>>({
    type: 'other',
  });
  const { t } = useLanguage();

  const addItem = () => {
    if (!newItem.title?.trim() || !newItem.url?.trim()) return;

    const item: ResearchItem = {
      id: crypto.randomUUID(),
      title: newItem.title.trim(),
      url: newItem.url.trim(),
      type: newItem.type as ResearchItem['type'] || 'other',
      notes: newItem.notes?.trim(),
      created_at: new Date(),
    };

    onChange([...research, item]);
    setNewItem({ type: 'other' });
    setIsAddingNew(false);
  };

  const removeItem = (id: string) => {
    onChange(research.filter((item) => item.id !== id));
  };

  const getTypeColor = (type: ResearchItem['type']) => {
    const colors = {
      ui: 'bg-blue-500/10 text-blue-500',
      tech: 'bg-green-500/10 text-green-500',
      competitor: 'bg-orange-500/10 text-orange-500',
      other: 'bg-gray-500/10 text-gray-500',
    };
    return colors[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('research_hub')}
          </CardTitle>
          {!readonly && (
            <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add_research')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('add_research_item')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('title')}</Label>
                    <Input
                      placeholder={t('research_title')}
                      value={newItem.title || ''}
                      onChange={(e) =>
                        setNewItem({ ...newItem, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t('url')}</Label>
                    <Input
                      placeholder="https://..."
                      type="url"
                      value={newItem.url || ''}
                      onChange={(e) =>
                        setNewItem({ ...newItem, url: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t('type')}</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value: ResearchItem['type']) =>
                        setNewItem({ ...newItem, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ui">UI/UX</SelectItem>
                        <SelectItem value="tech">Technical</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('notes')}</Label>
                    <Textarea
                      placeholder={t('optional_notes')}
                      value={newItem.notes || ''}
                      onChange={(e) =>
                        setNewItem({ ...newItem, notes: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    {t('add')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {research.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('no_research_items')}
          </p>
        ) : (
          research.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 border rounded-md group hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <Badge className={getTypeColor(item.type)} variant="secondary">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {item.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
              </div>
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
