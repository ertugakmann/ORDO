export function formatPrice(amount: number | string): string {
  return `£${Number(amount).toFixed(2)}`;
}
