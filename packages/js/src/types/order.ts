export interface Order {
  id: number
  order_number: string
  environment_id: number
  basket_id?: number
  user_id?: number
  session_id?: string
  status: OrderStatus
  currency: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  shipping_amount: number
  total_amount: number
  payment_method?: string
  shipping_address?: OrderAddress
  billing_address?: OrderAddress
  carrier_id?: number
  carrier_name?: string
  tracking_number?: string
  tracking_link?: string
  coupon_code?: string
  customer_note?: string
  seller_note?: string
  invoice_path?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
  // Relations
  items?: OrderItem[]
  carrier?: Carrier
  payment?: OrderPayment
  refund?: Refund
  refund_items?: RefundItem[]
  timelines?: OrderTimeline[]
  messages?: OrderMessage[]
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export interface OrderItem {
  product_id: number
  name: string
  image?: string
  sku?: string
  unit_price: number
  quantity: number
  subtotal: number
  plan?: string
  target_env?: string
}

export interface OrderAddress {
  id?: number
  title?: string
  name: string
  surname?: string
  phone?: string
  country: string
  city: string
  district?: string
  address_detail: string
  zip_code?: string
  is_corporate?: boolean
  company_name?: string
  tax_office?: string
  tax_number?: string
}

export interface OrderTimeline {
  id: number
  order_id: number
  status: string
  note?: string
  created_at: string
}

export interface OrderMessage {
  id: number
  order_id: number
  user_id?: number
  message: string
  is_seller: boolean
  created_at: string
  user?: { id: number; name: string }
}

export interface Carrier {
  id: number
  environment_id: number
  name: string
  code?: string
  tracking_url?: string
  pricing_type: 'fixed' | 'per_desi' | 'per_kg'
  base_price: number
  per_unit_price: number
  free_shipping_threshold?: number
  is_active: boolean
  sort_order: number
}

export interface PaymentGateway {
  id: number
  environment_id: number
  provider: string
  label: string
  config?: Record<string, unknown>
  is_active: boolean
  is_default: boolean
  is_online: boolean
  sort_order: number
  provider_label?: string
}

/**
 * Sipariş ödemesi — bir order için kaydedilen ödeme satırı.
 * Online provider'lardan dönen `transaction_id` ile eşlenir.
 */
export interface OrderPayment {
  id: number
  order_id: number
  provider: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  transaction_id?: string
  reference?: string
  metadata?: Record<string, unknown>
  paid_at?: string
  failed_at?: string
  created_at: string
  updated_at?: string
}

export interface Refund {
  id: number
  order_id: number
  amount: number
  status: string
  type: 'full' | 'partial'
  reason?: string
  admin_note?: string
  customer_note?: string
  created_at: string
}

/** İade edilen ürün kalemi (kısmi iade) */
export interface RefundItem {
  id: number
  refund_id: number
  order_item_id?: number
  product_id?: number
  item_name?: string
  quantity: number
  amount: number
}

export interface OrderStats {
  total: number
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  refunded: number
  partially_refunded: number
  revenue: {
    today: number
    month: number
    total: number
  }
}

export interface CheckoutOptions {
  payment_methods: Pick<PaymentGateway, 'id' | 'provider' | 'label' | 'is_default' | 'is_online'>[]
  carriers: Pick<Carrier, 'id' | 'name' | 'pricing_type' | 'base_price' | 'free_shipping_threshold'>[]
}

export interface CheckoutRequest {
  basket_id: number
  payment_method: string
  shipping_address_id?: number
  shipping_address?: OrderAddress
  billing_address_id?: number
  billing_address?: OrderAddress
  carrier_id?: number
  coupon_code?: string
  customer_note?: string
  // Misafir sipariş
  guest_name?: string
  guest_email?: string
  guest_phone?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  note?: string
}

export interface UpdateShippingRequest {
  carrier_id?: number
  carrier_name?: string
  tracking_number?: string
}

/**
 * İade isteği.
 *
 * - **Tutar bazlı:** sadece `amount` gönder → tam iade
 * - **Ürün bazlı (kısmi):** `items[]` gönder → kısmi iade, sipariş `partially_refunded` olur
 */
export interface RefundRequest {
  /** Toplam iade tutarı (ürün bazlı iadelerde otomatik hesaplanır) */
  amount?: number
  /** İade nedeni (müşteriye gösterilir) */
  reason?: string
  /** Satıcı notu (dahili) */
  note?: string
  /** Stok geri yüklensin mi? (varsayılan: false) */
  restock_item?: boolean
  /** Ürün bazlı iade kalemleri */
  items?: {
    product_id: number
    quantity: number
    amount: number
  }[]
}
