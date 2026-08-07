/**
 * SubmitCms webhook event payload'ı.
 *
 * Generic `T` ile event adını daraltabilirsin:
 *
 * @example
 *   type OrderEvent = WebhookEvent<'order.created' | 'order.paid'>
 *   const handler = (e: OrderEvent) => { ... }
 */
export interface WebhookEvent<T extends string = string> {
  /** Event adı — örn. 'order.created', 'product.updated' */
  event: T
  /** Event payload'ı — şekil event tipine göre değişir */
  payload: Record<string, unknown>
  /** Hangi environment ürettiği — multi-tenant context */
  environment_id: number
  /** ISO-8601 timestamp */
  timestamp: string
}
