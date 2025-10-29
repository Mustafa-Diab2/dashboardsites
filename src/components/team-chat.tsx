'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
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
  const { firestore, user } = useFirebase();
  const { addDoc } = useMutations();
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chat'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [firestore]);

  const { data: messages, isLoading } = useCollection(messagesQuery);

  const handleSendMessage = () => {
    if (!firestore || !user || !newMessage.trim()) return;

    addDoc('chat', {
      userId: user.uid,
      userName: user.displayName || user.email,
      text: newMessage,
      timestamp: serverTimestamp(),
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
                className={`flex items-start gap-3 ${
                  msg.userId === user?.uid ? 'justify-end' : ''
                }`}
              >
                {msg.userId !== user?.uid && (
                   <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.userName?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-xs ${
                    msg.userId === user?.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.userName}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-right opacity-70 mt-1">
                    {msg.timestamp && formatDistanceToNow((msg.timestamp as Timestamp).toDate(), { addSuffix: true })}
                  </p>
                </div>
                 {msg.userId === user?.uid && (
                   <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.userName?.charAt(0).toUpperCase()}</AvatarFallback>
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
            onKeyPress={handleKeyPress}
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
