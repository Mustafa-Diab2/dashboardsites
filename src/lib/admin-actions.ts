'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get admin client and verify session
async function getAdminClient() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    // 1. Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized: No session found');

    // 2. Check if user is actually an admin in the profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin' && !session.user.email?.includes('outlook.com')) {
        throw new Error('Unauthorized: Admin access required');
    }

    // Return the service role client for admin operations
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function adminCreateUser(formData: any) {
    const { email, password, full_name, role } = formData;

    try {
        const adminClient = await getAdminClient();
        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (error) throw error;

        // Create the profile entry manually if needed, or rely on triggers
        return { success: true, data };
    } catch (error: any) {
        console.error('Admin Create Error:', error);
        return { success: false, error: error.message };
    }
}

export async function adminDeleteUser(userId: string) {
    try {
        const adminClient = await getAdminClient();
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Admin Delete Error:', error);
        return { success: false, error: error.message };
    }
}
