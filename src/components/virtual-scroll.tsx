import { FixedSizeList as List } from 'react-window';
import { useMemo, useRef, useCallback } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

/**
 * Virtual scrolling component for large lists
 * Renders only visible items for optimal performance
 * 
 * Usage:
 * <VirtualScroll
 *   items={budgets}
 *   itemHeight={120}
 *   containerHeight={600}
 *   renderItem={(budget, index) => <BudgetCard key={budget.id} budget={budget} />}
 * />
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscanCount = 3,
}: VirtualScrollProps<T>) {
  const listRef = useRef<List>(null);

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index];
      return <div style={style}>{renderItem(item, index)}</div>;
    },
    [items, renderItem]
  );

  const itemKey = useCallback((index: number) => {
    const item = items[index] as any;
    return item?.id || index;
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <List
      ref={listRef}
      className={className}
      height={containerHeight}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={overscanCount}
      itemKey={itemKey}
    >
      {Row}
    </List>
  );
}

/**
 * Example usage in budget-management.tsx:
 * 
 * import { VirtualScroll } from '@/components/virtual-scroll';
 * 
 * <VirtualScroll
 *   items={budgets || []}
 *   itemHeight={120}
 *   containerHeight={600}
 *   renderItem={(budget) => (
 *     <Card className="p-4 mb-2">
 *       <h3>{budget.name}</h3>
 *       <p>{budget.total_budget}</p>
 *     </Card>
 *   )}
 * />
 */
