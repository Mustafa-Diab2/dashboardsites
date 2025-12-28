'use client';

import { useState, useCallback, useMemo } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { useSupabase } from '@/context/supabase-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useMutations } from '@/hooks/use-mutations';
import { useLanguage } from '@/context/language-context';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    user_id: string;
    type: 'task_assigned' | 'leave_approved' | 'leave_rejected' | 'mention' | 'task_completed' | 'general';
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationCenter() {
    const { user } = useSupabase();
    const { updateDoc, deleteDoc } = useMutations();
    const { t, language } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = useCallback(
        (query: any) =>
            query
                .eq('user_id', user?.id || '00000000-0000-0000-0000-000000000000')
                .order('created_at', { ascending: false })
                .limit(50),
        [user?.id]
    );

    const { data: notificationsData } = useSupabaseCollection<Notification>(
        'notifications',
        fetchNotifications
    );

    const notifications = (notificationsData || []) as Notification[];

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.is_read).length,
        [notifications]
    );

    const handleMarkAsRead = async (id: string) => {
        try {
            await updateDoc('notifications', id, { is_read: true }, { silent: true });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter((n) => !n.is_read);
            await Promise.all(
                unreadNotifications.map((n) =>
                    updateDoc('notifications', n.id, { is_read: true }, { silent: true })
                )
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc('notifications', id, { silent: true });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'task_assigned':
                return '📋';
            case 'leave_approved':
                return '✅';
            case 'leave_rejected':
                return '❌';
            case 'mention':
                return '💬';
            case 'task_completed':
                return '🎉';
            default:
                return '🔔';
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: language === 'ar' ? ar : enUS,
            });
        } catch {
            return '';
        }
    };

    if (!user) return null;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 md:w-96 p-0"
                align="end"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">{t('notifications')}</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            {t('mark_all_read')}
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">{t('no_notifications')}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-muted/50 transition-colors group relative',
                                        !notification.is_read && 'bg-primary/5'
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-xl">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {getTimeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive"
                                                onClick={() => handleDelete(notification.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="absolute top-4 right-4 h-2 w-2 bg-primary rounded-full" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
