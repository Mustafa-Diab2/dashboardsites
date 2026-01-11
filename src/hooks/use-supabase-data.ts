import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useOptimizedQuery, useRealtimeQuery } from './use-optimized-query';

// Legacy hook - kept for backwards compatibility but not recommended
export function useSupabaseCollection<T = any>(
    table: string,
    queryFn?: (query: any) => any
) {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    // استخدم ref لتخزين queryFn
    const queryFnRef = useRef(queryFn);
    queryFnRef.current = queryFn;

    const fetchData = useCallback(async () => {
        try {
            let query = supabase.from(table).select('*');
            if (queryFnRef.current) {
                query = queryFnRef.current(query);
            }

            const { data: result, error: fetchError } = await query;

            if (fetchError) {
                setError(fetchError);
            } else {
                setData(result as T[]);
                setError(null);
            }
        } catch (err) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [table]);

    useEffect(() => {
        if (!table) return; // Guard للـ null tables

        let isMounted = true;
        let channel: any = null;

        const fetchDataIfMounted = async () => {
            if (isMounted) {
                await fetchData();
            }
        };

        fetchDataIfMounted();

        // استخدام channel name ثابت بدون Date.now()
        const channelName = `public:${table}`;
        channel = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                if (isMounted) {
                    fetchDataIfMounted();
                }
            })
            .subscribe();

        return () => {
            isMounted = false;
            if (channel) {
                channel.unsubscribe();
                supabase.removeChannel(channel);
            }
        };
    }, [table, fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Alias for backward compatibility
export const useCollection = useSupabaseCollection;

export function useSupabaseDoc<T = any>(
    table: string,
    id: string | null | undefined
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        let isMounted = true;
        let channel: any = null;

        if (!id) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            if (isInitialLoad.current) {
                setIsLoading(true);
            }

            try {
                const { data: result, error: fetchError } = await supabase
                    .from(table)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (!isMounted) return;

                if (fetchError) {
                    setError(fetchError);
                    setData(null);
                } else {
                    setData(result as T);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    isInitialLoad.current = false;
                }
            }
        };

        fetchData();

        const channelName = `public:${table}:${id}`;
        channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
                () => {
                    if (isMounted) {
                        fetchData();
                    }
                }
            )
            .subscribe();

        return () => {
            isMounted = false;
            if (channel) {
                // ✅ تحسين الترتيب: unsubscribe قبل removeChannel
                channel.unsubscribe();
                supabase.removeChannel(channel);
            }
        };
    }, [table, id]);

    return { data, isLoading, error };
}
