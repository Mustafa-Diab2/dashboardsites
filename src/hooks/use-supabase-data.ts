import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseCollection<T = any>(
    table: string,
    queryFn?: (query: any) => any
) {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const isInitialLoad = useRef(true);
    // Store the latest queryFn without causing re-renders
    const queryFnRef = useRef(queryFn);

    // Update ref when queryFn changes
    useEffect(() => {
        queryFnRef.current = queryFn;
    }, [queryFn]);

    useEffect(() => {
        const fetchData = async () => {
            if (isInitialLoad.current) {
                setIsLoading(true);
            }
            let query = supabase.from(table).select('*');

            if (queryFnRef.current) {
                query = queryFnRef.current(query);
            }

            const { data, error } = await query;

            if (error) {
                setError(error);
                setData(null);
            } else {
                setData(data as T[]);
                setError(null);
            }
            setIsLoading(false);
            isInitialLoad.current = false;
        };

        fetchData();

        const channel = supabase
            .channel(`public:${table}:${Math.random()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table]);

    return { data, isLoading, error };
}

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
