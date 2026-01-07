'use client';

import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { History, User, Box, FileText, Trash2, Edit, Plus, LogIn, LogOut, Share2 } from 'lucide-react';

interface LogEntry {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    entity: string;
    details: string;
    created_at: string;
}

export function ActivityLog() {
    const { language, t } = useLanguage();
    const { data: logs, isLoading } = useSupabaseCollection<LogEntry>(
        'activity_logs',
        (q) => q.order('created_at', { ascending: false }).limit(50)
    );

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return <Plus className="h-4 w-4 text-green-500" />;
            case 'update': return <Edit className="h-4 w-4 text-blue-500" />;
            case 'delete': return <Trash2 className="h-4 w-4 text-red-500" />;
            case 'login': return <LogIn className="h-4 w-4 text-emerald-500" />;
            case 'logout': return <LogOut className="h-4 w-4 text-orange-500" />;
            case 'upload': return <Share2 className="h-4 w-4 text-purple-500" />;
            default: return <History className="h-4 w-4" />;
        }
    };

    const getEntityBadge = (entity: string) => {
        const variants: any = {
            user: 'default',
            task: 'secondary',
            file: 'outline',
            client: 'destructive',
        };
        return <Badge variant={variants[entity] || 'outline'}>{entity}</Badge>;
    };

    if (isLoading) return <div className="p-8 text-center">Loading Activity Logs...</div>;

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Activity Logs
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {logs?.map((log) => (
                            <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="mt-1 p-2 rounded-full bg-background border border-white/10">
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                            <span className="text-primary">{log.user_name}</span>
                                            {' '} {log.action}d a {log.entity}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">
                                            {formatDistanceToNow(new Date(log.created_at), {
                                                addSuffix: true,
                                                locale: language === 'ar' ? ar : enUS
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{log.details}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {getEntityBadge(log.entity)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!logs || logs.length === 0) && (
                            <div className="text-center py-12 text-muted-foreground">
                                No activity recorded yet.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
