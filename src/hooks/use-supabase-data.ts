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

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                let query = supabase.from(table).select('*');
                if (queryFn) {
                    query = queryFn(query);
                }

                const { data: result, error: fetchError } = await query;

                if (!isMounted) return;

                if (fetchError) {
                    setError(fetchError);
                } else {
                    setData(result as T[]);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        const channel = supabase
            .channel(`public:${table}:${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [table, queryFn]); // Use the memoized queryFn directly

    return { data, isLoading, error };
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
        if (!id) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            if (isInitialLoad.current) {
                setIsLoading(true);
            }
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                setError(error);
                setData(null);
            } else {
                setData(data as T);
                setError(null);
            }
            setIsLoading(false);
            isInitialLoad.current = false;
        };

        fetchData();

        const channelName = `public:${table}:${id}:${Math.random()}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, id]);

    return { data, isLoading, error };
}
