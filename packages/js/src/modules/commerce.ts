import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

export interface CartItem {
  id: number
  record_id?: number
  product_id?: number
  quantity: number
  price: number
  title?: string
  [key: string]: unknown
}

export interface Cart {
  id?: number
  items: CartItem[]
  subtotal?: number
  total?: number
  currency?: string
  [key: string]: unknown
}

/**
 * Ziyaretçi sepeti — mağaza önyüzü.
 *
 * Oturum gerekmez; misafir sepeti `X-Guest-Id` ile taşınır
 * (`client.setGuestId(...)`). `ecommerce` modülü kapalıysa uçlar 403 döner.
 *
 * @example
 *   sdk.client.setGuestId(localStorage.getItem('guest') ?? crypto.randomUUID())
 *   await sdk.cart.add({ record_id: 12, quantity: 2 })
 *   const { data } = await sdk.cart.get()
 */
export class CartModule extends BaseModule {
  get(): Promise<ApiResponse<Cart>> {
    return this.client.get('/api/shop/cart')
  }

  /** Ürün ekler. Aynı ürün tekrar eklenirse adet artar. */
  add(payload: { record_id?: number; product_id?: number; quantity?: number } & Record<string, unknown>): Promise<
    ApiResponse<Cart>
  > {
    return this.client.post('/api/shop/cart', payload)
  }

  /** Satır adedini değiştirir. `0` göndermek satırı silmez — `removeItem` kullanın. */
  updateItem(itemId: number, quantity: number): Promise<ApiResponse<Cart>> {
    return this.client.put(`/api/shop/cart/items/${itemId}`, { quantity })
  }

  removeItem(itemId: number): Promise<ApiResponse<Cart>> {
    return this.client.delete(`/api/shop/cart/items/${itemId}`)
  }

  /** Sepeti tamamen boşaltır. */
  clear(): Promise<ApiResponse<null>> {
    return this.client.delete('/api/shop/cart')
  }

  /** Sepeti siparişe çevirir. Ödeme yönlendirmesi yanıtta döner. */
  checkout(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/shop/checkout', payload)
  }
}

/**
 * Eski sepet/checkout uçları (`/api/shopping/*`).
 *
 * Yeni entegrasyonlarda `sdk.cart` kullanın. Bunlar hâlen canlıdır ve eski
 * mağazalar için ayaktadır; kupon ve kargo seçenekleri şu an yalnızca burada.
 */
export class LegacyShoppingModule extends BaseModule {
  cart(): Promise<ApiResponse<Cart>> {
    return this.client.get('/api/shopping/cart')
  }

  addToCart(payload: Record<string, unknown>): Promise<ApiResponse<Cart>> {
    return this.client.post('/api/shopping/cart', payload)
  }

  updateCartItem(itemId: number, payload: Record<string, unknown>): Promise<ApiResponse<Cart>> {
    return this.client.put(`/api/shopping/cart/${itemId}`, payload)
  }

  removeCartItem(itemId: number): Promise<ApiResponse<Cart>> {
    return this.client.delete(`/api/shopping/cart/${itemId}`)
  }

  clearCart(): Promise<ApiResponse<null>> {
    return this.client.delete('/api/shopping/cart/clear')
  }

  checkout(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/shopping/checkout', payload)
  }

  /** Ödeme ve teslimat seçenekleri — checkout formunu doldurmadan önce. */
  checkoutOptions(): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/shopping/checkout/options')
  }

  /** Kupon uygular ve yeni toplamı döner. */
  applyCoupon(code: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/shopping/checkout/coupon', { code })
  }

  carriers(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/shopping/carriers')
  }
}

export interface Order {
  id: number
  code?: string
  status: string
  total?: number
  currency?: string
  created_at: string
  [key: string]: unknown
}

/**
 * Sipariş yönetimi (satıcı tarafı).
 *
 * `orders` modülü açık olmalıdır — kapalıysa 403. Oturum ve site üyeliği ister.
 */
export class OrderModule extends BaseModule {
  list(params: Record<string, unknown> = {}): Promise<ApiResponse<Order[]>> {
    return this.client.get('/api/commerce/orders', { params })
  }

  get(id: number): Promise<ApiResponse<Order>> {
    return this.client.get(`/api/commerce/orders/${id}`)
  }

  update(id: number, payload: Record<string, unknown>): Promise<ApiResponse<Order>> {
    return this.client.put(`/api/commerce/orders/${id}`, payload)
  }

  /** Durum geçişi. Geçersiz geçişler 422 döner. */
  updateStatus(id: number, status: string, payload: Record<string, unknown> = {}): Promise<ApiResponse<Order>> {
    return this.client.put(`/api/commerce/orders/${id}/status`, { status, ...payload })
  }

  cancel(id: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Order>> {
    return this.client.post(`/api/commerce/orders/${id}/cancel`, payload)
  }

  /** Satış raporu — ciro, adet, dönem kırılımı. */
  report(params: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get('/api/commerce/orders/report', { params })
  }

  readonly invoice = {
    /** Faturayı üretir. */
    create: (orderId: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post(`/api/commerce/orders/${orderId}/invoice`, payload),

    get: (orderId: number): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get(`/api/commerce/orders/${orderId}/invoice`),
  }

  /** Sipariş e-postalarının şablon ve gönderim ayarları. */
  readonly mailSettings = {
    get: (): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.get('/api/commerce/orders/mail-settings'),

    update: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.put('/api/commerce/orders/mail-settings', payload),
  }
}

/** Müşterinin kendi siparişleri — son kullanıcı hesabı için. */
export class CustomerOrderModule extends BaseModule {
  list(params: Record<string, unknown> = {}): Promise<ApiResponse<Order[]>> {
    return this.client.get('/api/my-orders', { params })
  }

  get(id: number): Promise<ApiResponse<Order>> {
    return this.client.get(`/api/my-orders/${id}`)
  }

  cancel(id: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Order>> {
    return this.client.post(`/api/my-orders/${id}/cancel`, payload)
  }

  /** Satıcıya sipariş üzerinden mesaj yazar. */
  message(id: number, message: string): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post(`/api/my-orders/${id}/message`, { message })
  }
}

export interface Address {
  id: number
  title?: string
  name?: string
  surname?: string
  phone?: string
  city?: string
  district?: string
  address?: string
  zip?: string
  is_default?: boolean
  [key: string]: unknown
}

/**
 * Kullanıcı adresleri.
 *
 * `/api/user/addresses` ve `/api/shopping/addresses` aynı işi görür; SDK
 * ilkini kullanır.
 */
export class AddressModule extends BaseModule {
  list(): Promise<ApiResponse<Address[]>> {
    return this.client.get('/api/user/addresses')
  }

  create(payload: Omit<Address, 'id'>): Promise<ApiResponse<Address>> {
    return this.client.post('/api/user/addresses', payload)
  }

  update(id: number, payload: Partial<Address>): Promise<ApiResponse<Address>> {
    return this.client.put(`/api/user/addresses/${id}`, payload)
  }

  delete(id: number): Promise<ApiResponse<null>> {
    return this.client.delete(`/api/user/addresses/${id}`)
  }
}

/** Ödemeler. Stripe/Tami webhook uçları sunucu-sunucu olduğu için SDK'da yoktur. */
export class PaymentModule extends BaseModule {
  list(params: Record<string, unknown> = {}): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/payments', { params })
  }

  get(id: number): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.get(`/api/payments/${id}`)
  }

  create(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/payments', payload)
  }

  /** Stripe PaymentIntent açar — `client_secret` ile Stripe.js'e devredin. */
  createStripeIntent(payload: Record<string, unknown>): Promise<ApiResponse<{ client_secret: string }>> {
    return this.client.post('/api/payments/stripe/create-intent', payload)
  }
}

/** Abonelik ve fatura profilleri (SaaS tarafı). */
export class BillingModule extends BaseModule {
  subscriptions(): Promise<ApiResponse<Array<Record<string, unknown>>>> {
    return this.client.get('/api/user/subscriptions')
  }

  /** Satın almadan önce vergi dahil tutarı hesaplatır. */
  calculatePricing(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/user/calculate-pricing', payload)
  }

  subscribe(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.client.post('/api/user/subscribe', payload)
  }

  readonly profiles = {
    list: (): Promise<ApiResponse<Array<Record<string, unknown>>>> =>
      this.client.get('/api/user/billing-profiles'),

    create: (payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.post('/api/user/billing-profiles', payload),

    update: (id: number, payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> =>
      this.client.put(`/api/user/billing-profiles/${id}`, payload),
  }
}
