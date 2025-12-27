'use client';

import { useState } from 'react';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send, MessageSquare } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';

export default function TeamChat() {
  const { user } = useSupabase();
  const { addDoc } = useMutations();
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');

  const { data: messages, isLoading } = useSupabaseCollection(
    'chat',
    (query) => query.order('timestamp', { ascending: true }).limit(50)
  );

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    await addDoc('chat', {
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email,
      text: newMessage,
      timestamp: new Date().toISOString(),
    });

    setNewMessage('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <MessageSquare />
          {t('team_chat')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            {isLoading && <p>{t('loading')}...</p>}
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.user_id === user?.id ? 'justify-end' : ''
                  }`}
              >
                {msg.user_id !== user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.user_name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-xs ${msg.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                    }`}
                >
                  <p className="text-sm font-medium">{msg.user_name}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-right opacity-70 mt-1">
                    {msg.timestamp && formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </p>
                </div>
                {msg.user_id === user?.id && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.user_name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('type_message')}
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
