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
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing! Auth will not work.');
        }
        // Safety timeout to prevent hanging UI indefinitely
        const timeout = setTimeout(() => {
            if (isLoading) {
                console.warn('Supabase initialization took too long, forcing load completion...');
                setIsLoading(false);
            }
        }, 8000);

        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching profile:', error);
                    }
                    setRole(profile?.role ?? 'frontend');
                }
            } catch (error) {
                console.error('Supabase Auth Error:', error);
            } finally {
                setIsLoading(false);
                clearTimeout(timeout);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            try {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();
                    setRole(profile?.role ?? 'frontend');
                } else {
                    setRole(null);
                }
            } catch (error) {
                console.error('Auth State Change Error:', error);
            } finally {
                setIsLoading(false);
                clearTimeout(timeout);
            }
        });

        return () => {
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
