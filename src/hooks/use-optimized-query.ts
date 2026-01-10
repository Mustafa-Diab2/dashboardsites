'use client'

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './use-toast'
import { queryKeys, hashQueryFn } from '@/lib/query-keys'

// Optimized Query Hook
export function useOptimizedQuery<T = any>(
  table: string,
  queryFn?: (query: any) => any,
  options?: Omit<UseQueryOptions<T[]>, 'queryKey' | 'queryFn'>
) {
  // استخدام stable queryKey مع hash للـ filter
  const queryKey = useMemo(() => {
    if (!queryFn) return queryKeys.table(table);
    const filterHash = hashQueryFn(queryFn);
    return queryKeys.tableFiltered(table, filterHash);
  }, [table, queryFn]);
  
  return useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase.from(table).select('*')
      if (queryFn) {
        query = queryFn(query)
      }
      const { data, error } = await query
      if (error) throw error
      return data as T[]
    },
    ...options,
  })
}

// Optimized Mutation Hook with Optimistic Updates
export function useOptimizedMutation<T = any>(
  table: string,
  action: 'insert' | 'update' | 'delete'
) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      let result
      
      if (action === 'insert') {
        result = await supabase.from(table).insert([data]).select()
      } else if (action === 'update') {
        const { id, ...rest } = data
        result = await supabase.from(table).update(rest).eq('id', id).select()
      } else if (action === 'delete') {
        result = await supabase.from(table).delete().eq('id', data)
      }
      
      if (result?.error) throw result.error
      return result?.data
    },
    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: [table] })
      
      // Snapshot previous value
      const previous = queryClient.getQueryData([table])
      
      // Optimistically update
      if (action === 'insert') {
        queryClient.setQueryData<T[]>([table], (old: any) => 
          old ? [...old, { ...newData, id: 'temp-' + Date.now() }] : [newData]
        )
      } else if (action === 'update') {
        queryClient.setQueryData<T[]>([table], (old: any) =>
          old ? old.map((item: any) => item.id === newData.id ? { ...item, ...newData } : item) : old
        )
      } else if (action === 'delete') {
        queryClient.setQueryData<T[]>([table], (old: any) =>
          old ? old.filter((item: any) => item.id !== newData) : old
        )
      }
      
      return { previous }
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      queryClient.setQueryData([table], context.previous)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong'
      })
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [table] })
    },
  })
}

// Real-time subscription with debounce
export function useRealtimeQuery<T = any>(
  table: string,
  queryFn?: (query: any) => any,
  debounceMs: number = 300
) {
  const queryClient = useQueryClient()
  const query = useOptimizedQuery<T>(table, queryFn)
  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout | null = null
    const channelName = `${table}-changes`
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [table] })
        }, debounceMs)
      })
      .subscribe()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [table, debounceMs, queryClient])

  return query
}
