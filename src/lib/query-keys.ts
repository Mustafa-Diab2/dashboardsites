/**
 * Query Key Factory - Stable query keys for React Query
 * Prevents unstable keys that cause infinite refetches
 */

export const queryKeys = {
  all: ['app'] as const,
  
  // Table-based keys
  table: (tableName: string) => [...queryKeys.all, 'table', tableName] as const,
  tableFiltered: (tableName: string, filterHash: string) => 
    [...queryKeys.table(tableName), 'filtered', filterHash] as const,
  
  // Document keys  
  document: (tableName: string, id: string) => 
    [...queryKeys.table(tableName), 'document', id] as const,
};

/**
 * Simple hash function for query filters
 * Converts queryFn to stable string representation
 */
export function hashQueryFn(queryFn: Function): string {
  const fnString = queryFn.toString();
  let hash = 0;
  for (let i = 0; i < fnString.length; i++) {
    const char = fnString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Hash object parameters for stable query keys
 */
export function hashObject(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'function') return hashQueryFn(obj);
  
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  return hashQueryFn(() => str);
}
