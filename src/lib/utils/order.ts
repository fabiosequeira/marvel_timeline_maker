/**
 * Fractional ordering: to insert an entry between two others, average their
 * order values. This lets us reorder without rewriting every row. If values
 * get too close together after many inserts in the same spot, callers can
 * run `normalizeOrders` to spread everything back out to whole numbers.
 */
export function computeOrderBetween(before?: number | null, after?: number | null): number {
  if (before == null && after == null) return 1000;
  if (before == null) return (after as number) - 1000;
  if (after == null) return before + 1000;
  return (before + after) / 2;
}

export const MIN_ORDER_GAP = 0.0001;

export function needsNormalization(before?: number | null, after?: number | null): boolean {
  if (before == null || after == null) return false;
  return Math.abs(after - before) < MIN_ORDER_GAP;
}
