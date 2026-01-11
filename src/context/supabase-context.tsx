'use client';

import React, { createContext, useContext, useEffect, useReducer, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { logActivity } from '@/lib/notifications';

interface SupabaseContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    role: string | null;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    role: string | null;
    isLoading: boolean;
}

type AuthAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_AUTH'; payload: { user: User | null; session: Session | null; role: string | null } }
    | { type: 'CLEAR_AUTH' };

const initialState: AuthState = {
    user: null,
    session: null,
    role: null,
    isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_AUTH':
            return {
                user: action.payload.user,
                session: action.payload.session,
                role: action.payload.role,
                isLoading: false,
            };
        case 'CLEAR_AUTH':
            return { ...initialState, isLoading: false };
        default:
            return state;
    }
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const queryClient = useQueryClient();

    useEffect(() => {
        let isMounted = true;

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing! Auth will not work.');
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
        }

        // Safety timeout - قلل من 8 ثواني إلى 3 ثواني
        const timeout = setTimeout(() => {
            if (isMounted) {
                console.warn('Supabase initialization timeout - forcing completion');
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        }, 3000);

        const getSession = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session Error:', sessionError);
                    if (isMounted) dispatch({ type: 'SET_LOADING', payload: false });
                    return;
                }

                if (!isMounted) return;

                if (session?.user) {
                    const { data: profile } = await supabase
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

                    if (isMounted) {
                        dispatch({
                            type: 'SET_AUTH',
                            payload: {
                                user: session.user,
                                session: session,
                                role: finalRole
                            }
                        });
                    }
                } else {
                    if (isMounted) dispatch({ type: 'CLEAR_AUTH' });
                }
            } catch (error) {
                console.error('Supabase Auth Error:', error);
                if (isMounted) dispatch({ type: 'SET_LOADING', payload: false });
            } finally {
                clearTimeout(timeout);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            try {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, full_name')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!isMounted) return;

                    let finalRole = profile?.role ?? session.user.user_metadata?.role ?? 'trainee';

                    if (!profile && session.user.email?.includes('outlook.com')) {
                        finalRole = 'admin';
                    }

                    dispatch({
                        type: 'SET_AUTH',
                        payload: {
                            user: session.user,
                            session: session,
                            role: finalRole
                        }
                    });

                    // سجل النشاط عند تسجيل الدخول
                    if (event === 'SIGNED_IN') {
                        logActivity({
                            userId: session.user.id,
                            userName: profile?.full_name || session.user.email || 'Unknown User',
                            action: 'login',
                            entity: 'user',
                            details: `Logged in from ${typeof window !== 'undefined' ? window.navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop' : 'Unknown'}`
                        }).catch(console.error);
                    }
                } else {
                    dispatch({ type: 'CLEAR_AUTH' });
                }
            } catch (error) {
                console.error('Auth State Change Error:', error);
                if (session?.user && isMounted) {
                    dispatch({
                        type: 'SET_AUTH',
                        payload: {
                            user: session.user,
                            session: session,
                            role: session.user.user_metadata?.role ?? 'trainee'
                        }
                    });
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [queryClient]);

    // 🔥 Separate useEffect للـ profile subscription - يعمل عند login
    useEffect(() => {
        if (!state.user?.id) return;

        let profileChannel: any = null;
        let isMounted = true;
        let debounceTimer: NodeJS.Timeout | null = null;

        const setupSubscription = () => {
            profileChannel = supabase
                .channel(`profile:${state.user!.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${state.user!.id}`
                    },
                    (payload) => {
                        if (!isMounted) return;

                        console.log('🔄 Profile updated:', payload);

                        const newRole = (payload.new as any)?.role;
                        if (newRole && newRole !== state.role) {
                            // Clear any existing debounce timer
                            if (debounceTimer) {
                                clearTimeout(debounceTimer);
                            }

                            // Update role immediately
                            dispatch({
                                type: 'SET_AUTH',
                                payload: {
                                    user: state.user!,
                                    session: state.session,
                                    role: newRole
                                }
                            });

                            // Debounce cache invalidation to prevent multiple rapid invalidations
                            debounceTimer = setTimeout(() => {
                                if (isMounted && queryClient) {
                                    console.log('🔄 Invalidating user-specific queries after role change');
                                    // ✅ FIX: Invalidate ONLY specific queries instead of ALL queries
                                    queryClient.invalidateQueries({
                                        predicate: (query) => {
                                            const key = query.queryKey[0] as string;
                                            // Only invalidate user-related and permission-sensitive queries
                                            return key === 'profiles' ||
                                                key === 'users' ||
                                                key === 'tasks' ||
                                                key === 'departments' ||
                                                key === 'attendance' ||
                                                key === 'leaves';
                                        }
                                    });
                                }
                            }, 500); // 500ms debounce
                        }
                    }
                )
                .subscribe();
        };

        setupSubscription();

        return () => {
            isMounted = false;
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            if (profileChannel) {
                profileChannel.unsubscribe();
                supabase.removeChannel(profileChannel);
            }
        };
    }, [state.user?.id, state.role, queryClient]); // ✅ Added state.role to prevent redundant updates

    const contextValue = useMemo(() => ({
        user: state.user,
        session: state.session,
        isLoading: state.isLoading,
        role: state.role
    }), [state]);

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
