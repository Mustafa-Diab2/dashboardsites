import { supabase } from './supabase';

type NotificationType = 'task_assigned' | 'leave_approved' | 'leave_rejected' | 'mention' | 'task_completed' | 'general';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}

export async function createNotification({
    userId,
    type,
    title,
    message,
    link,
}: CreateNotificationParams) {
    try {
        const { error } = await supabase.from('notifications').insert([
            {
                user_id: userId,
                type,
                title,
                message,
                link,
                is_read: false,
                created_at: new Date().toISOString(),
            },
        ]);

        if (error) {
            console.error('Failed to create notification:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error };
    }
}

export async function createBulkNotifications(
    notifications: CreateNotificationParams[]
) {
    try {
        const notificationsData = notifications.map((n) => ({
            user_id: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            is_read: false,
            created_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('notifications').insert(notificationsData);

        if (error) {
            console.error('Failed to create bulk notifications:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        return { success: false, error };
    }
}

// Helper functions for common notification types
export const notifyTaskAssigned = (userId: string, taskTitle: string, assignerName: string) =>
    createNotification({
        userId,
        type: 'task_assigned',
        title: 'مهمة جديدة',
        message: `تم إسناد مهمة "${taskTitle}" إليك بواسطة ${assignerName}`,
    });

export const notifyLeaveApproved = (userId: string, leaveType: string) =>
    createNotification({
        userId,
        type: 'leave_approved',
        title: 'تمت الموافقة على الإجازة',
        message: `تمت الموافقة على طلب إجازتك (${leaveType})`,
    });

export const notifyLeaveRejected = (userId: string, leaveType: string) =>
    createNotification({
        userId,
        type: 'leave_rejected',
        title: 'تم رفض الإجازة',
        message: `تم رفض طلب إجازتك (${leaveType})`,
    });

export const notifyMention = (userId: string, mentionerName: string, context: string) =>
    createNotification({
        userId,
        type: 'mention',
        title: 'تمت الإشارة إليك',
        message: `قام ${mentionerName} بالإشارة إليك: "${context}"`,
    });

export const notifyTaskCompleted = (userId: string, taskTitle: string, completedBy: string) =>
    createNotification({
        userId,
        type: 'task_completed',
        title: 'تم إكمال المهمة',
        message: `أكمل ${completedBy} العمل على مهمة "${taskTitle}"`,
    });

// --- Activity Logs ---

export type ActivityAction = 'create' | 'update' | 'delete' | 'upload' | 'login' | 'logout';
export type ActivityEntity = 'user' | 'task' | 'file' | 'client' | 'profile' | 'attendance';

export async function logActivity({
    userId,
    userName,
    action,
    entity,
    details
}: {
    userId: string;
    userName: string;
    action: ActivityAction;
    entity: ActivityEntity;
    details: string;
}) {
    try {
        const { error } = await supabase.from('activity_logs').insert([
            {
                user_id: userId,
                user_name: userName,
                action,
                entity,
                details,
                created_at: new Date().toISOString(),
            },
        ]);

        if (error) console.error('Failed to log activity:', error);
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}
