'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface SupabaseContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    role: string | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing! Auth will not work.');
            setIsLoading(false);
            return;
        }
        
        // Safety timeout - قلل من 8 ثواني إلى 3 ثواني
        const timeout = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn('Supabase initialization timeout - forcing completion');
                setIsLoading(false);
            }
        }, 3000);

        const getSession = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('Session Error:', sessionError);
                    if (isMounted) setIsLoading(false);
                    return;
                }
                
                if (!isMounted) return;
                
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!isMounted) return;

                    let finalRole = 'trainee';

                    if (profile) {
                        finalRole = profile.role;
                    } else if (session.user.user_metadata?.role) {
                        finalRole = session.user.user_metadata.role;
                    } else if (session.user.email?.includes('outlook.com')) {
                        finalRole = 'admin';
                    }

                    console.log('User loaded:', {
                        id: session.user.id,
                        email: session.user.email,
                        role: finalRole
                    });

                    setRole(finalRole);
                }
            } catch (error) {
                console.error('Supabase Auth Error:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    clearTimeout(timeout);
                }
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;
            
            setSession(session);
            setUser(session?.user ?? null);

            try {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!isMounted) return;

                    let finalRole = profile?.role ?? session.user.user_metadata?.role ?? 'trainee';

                    if (!profile && session.user.email?.includes('outlook.com')) {
                        finalRole = 'admin';
                    }

                    setRole(finalRole);
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error('Auth State Change Error:', error);
                if (session?.user && isMounted) {
                    setRole(session.user.user_metadata?.role ?? 'trainee');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const contextValue = useMemo(() => ({ user, session, isLoading, role }), [user, session, isLoading, role]);

    return (
        <SupabaseContext.Provider value={contextValue}>
            {children}
        </SupabaseContext.Provider>
    );
}

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};
