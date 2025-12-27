
'use server';

import { createClient } from '@supabase/supabase-js';

// ملاحظة: لاستخدام هذا السيرفر أكشن، ستحتاج لإضافة SUPABASE_SERVICE_ROLE_KEY في ملف .env
// هذا المفتاح يسمح للأدمن بإدارة المستخدمين دون الحاجة لتأكيد البريد يدويًا ودون الخروج من حسابه.

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function adminCreateUser(formData: any) {
    const { email, password, full_name, role } = formData;

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function adminDeleteUser(userId: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
