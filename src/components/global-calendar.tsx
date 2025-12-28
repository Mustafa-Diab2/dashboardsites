'use client';

import { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useLanguage } from '@/context/language-context';
import { useSupabaseCollection } from '@/hooks/use-supabase-data';
import { useSupabase } from '@/context/supabase-context';
import type { Task, Leave } from '@/lib/data';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'task_deadline' | 'leave';
    status?: string;
    priority?: string;
    userName?: string;
    leaveType?: string;
}

export function GlobalCalendar() {
    const { t, language } = useLanguage();
    const { role } = useSupabase();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

    const { data: tasksData } = useSupabaseCollection<Task>('tasks');
    const { data: leavesData } = useSupabaseCollection<any>('leaves');

    const tasks = (tasksData || []) as Task[];
    const leaves = (leavesData || []) as any[];

    const calendarEvents = useMemo(() => {
        const events: CalendarEvent[] = [];

        // Add task deadlines
        tasks.forEach((task) => {
            if (task.due_date) {
                events.push({
                    id: task.id,
                    title: task.title,
                    date: new Date(task.due_date),
                    type: 'task_deadline',
                    status: task.status,
                    priority: task.priority,
                });
            }
        });

        // Add approved leaves
        leaves
            .filter((leave) => leave.status === 'approved')
            .forEach((leave) => {
                const startDate = new Date(leave.start_date);
                const endDate = new Date(leave.end_date);
                const days = eachDayOfInterval({ start: startDate, end: endDate });

                days.forEach((day) => {
                    events.push({
                        id: `${leave.id}-${day.toISOString()}`,
                        title: `${leave.user_name} - ${t((leave.type + '_leave') as any) || leave.type}`,
                        date: day,
                        type: 'leave',
                        userName: leave.user_name,
                        leaveType: leave.type,
                    });
                });
            });

        return events;
    }, [tasks, leaves, t]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 6 }); // Saturday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getEventsForDay = (day: Date) =>
        calendarEvents.filter((event) => isSameDay(event.date, day));

    const handleDayClick = (day: Date) => {
        const dayEvents = getEventsForDay(day);
        setSelectedDate(day);
        setSelectedEvents(dayEvents);
    };

    const weekDays = language === 'ar'
        ? ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج']
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const getEventColor = (event: CalendarEvent) => {
        if (event.type === 'leave') {
            return 'bg-green-500/20 text-green-600 border-green-500/50';
        }
        switch (event.priority) {
            case 'high':
                return 'bg-red-500/20 text-red-600 border-red-500/50';
            case 'medium':
                return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
            default:
                return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="px-4 py-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <CardTitle className="font-headline flex items-center gap-2 text-lg sm:text-xl">
                            <CalendarIcon className="h-5 w-5" />
                            {t('calendar')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-medium min-w-[120px] sm:min-w-[150px] text-center text-sm sm:text-base">
                                {format(currentMonth, 'MMMM yyyy', {
                                    locale: language === 'ar' ? ar : enUS,
                                })}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                            <span>{t('task_deadline')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                            <span>{t('leave')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                            <span>{t('high_priority')}</span>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-px sm:gap-1 bg-muted rounded-lg overflow-hidden border">
                        {/* Week day headers */}
                        {weekDays.map((day) => (
                            <div
                                key={day}
                                className="text-center text-[10px] sm:text-sm font-medium text-muted-foreground py-2 bg-background"
                            >
                                {day}
                            </div>
                        ))}

                        {/* Calendar days */}
                        {calendarDays.map((day) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        'min-h-[60px] sm:min-h-[80px] p-0.5 sm:p-1 bg-background cursor-pointer transition-colors hover:bg-muted/50 relative',
                                        !isCurrentMonth && 'text-muted-foreground/30',
                                        isCurrentDay && 'z-10 ring-1 ring-inset ring-primary'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'text-[10px] sm:text-sm font-medium mb-1',
                                            isCurrentDay && 'text-primary'
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 2).map((event) => (
                                            <div
                                                key={event.id}
                                                className={cn(
                                                    'text-xs px-1 py-0.5 rounded truncate border',
                                                    getEventColor(event)
                                                )}
                                            >
                                                {event.type === 'leave' ? (
                                                    <User className="h-3 w-3 inline mr-1" />
                                                ) : (
                                                    <Briefcase className="h-3 w-3 inline mr-1" />
                                                )}
                                                {event.title.substring(0, 10)}...
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-muted-foreground text-center">
                                                +{dayEvents.length - 2} {t('more')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Day Details Dialog */}
            <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
                <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate &&
                                format(selectedDate, 'EEEE, d MMMM yyyy', {
                                    locale: language === 'ar' ? ar : enUS,
                                })}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvents.length === 0
                                ? t('no_events_for_day')
                                : `${selectedEvents.length} ${t('events')}`}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[400px]">
                        <div className="space-y-3">
                            {selectedEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        'p-3 rounded-lg border',
                                        getEventColor(event)
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium">{event.title}</p>
                                            <p className="text-xs mt-1">
                                                {event.type === 'leave' ? (
                                                    <>
                                                        <User className="h-3 w-3 inline mr-1" />
                                                        {t('leave')} - {event.userName}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="h-3 w-3 inline mr-1" />
                                                        {t('task_deadline')}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        {event.type === 'task_deadline' && event.status && (
                                            <Badge variant="outline">{t(event.status as any)}</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
