'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseCollection<T = any>(
    table: string,
    queryFn?: (query: any) => any
) {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            let query = supabase.from(table).select('*');

            if (queryFn) {
                query = queryFn(query);
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
        };

        fetchData();

        // Subscribe to changes
        const channel = supabase
            .channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, queryFn]);

    return { data, isLoading, error };
}

export function useSupabaseDoc<T = any>(
    table: string,
    id: string | null | undefined
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!id) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
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
        };

        fetchData();

        const channel = supabase
            .channel(`public:${table}:${id}`)
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
