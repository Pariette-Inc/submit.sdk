/**
 * Mock fixture'ları — `mock: true` modunda gerçek HTTP yapmadan
 * dönen sahte response'lar. URL deseni eşleşmezse generic boş response döner.
 *
 * Test/storybook senaryoları içindir, üretim trafiği için DEĞİL.
 */

export interface MockRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  body?: unknown
  params?: unknown
}

type FixtureResponder = (req: MockRequest) => unknown

interface FixtureRule {
  match: RegExp
  method?: MockRequest['method']
  respond: FixtureResponder
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ok = <T>(data: T): { status: true; data: T } => ({ status: true, data })

const paginated = <T>(items: T[]): {
  status: true
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
} => ({
  status: true,
  data: items,
  current_page: 1,
  last_page: 1,
  per_page: items.length || 20,
  total: items.length,
})

// ── Fixture rules — sıra önemli, ilk eşleşen kullanılır ──────────────────────

const rules: FixtureRule[] = [
  // Products
  {
    match: /\/api\/(public\/)?products$/,
    method: 'GET',
    respond: () =>
      paginated([
        { id: 1, title: 'Mock Product', slug: 'mock-product', status: 1, price: 99, environment_id: 1, user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]),
  },
  {
    match: /\/api\/(public\/)?product\/[^/]+$/,
    method: 'GET',
    respond: () => ({
      id: 1,
      title: 'Mock Product',
      slug: 'mock-product',
      status: 1,
      price: 99,
      environment_id: 1,
      user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  },

  // Canvas
  {
    match: /\/api\/(public\/)?canvas$/,
    method: 'GET',
    respond: () =>
      paginated([
        { id: 1, title: 'Mock Canvas', slug: 'mock-canvas', type: 'page', status: 1, environment_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]),
  },
  {
    match: /\/api\/(public\/)?canvas\/[^/]+$/,
    method: 'GET',
    respond: () => ({
      id: 1,
      title: 'Mock Canvas',
      slug: 'mock-canvas',
      type: 'page',
      status: 1,
      environment_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  },

  // Orders (seller)
  {
    match: /\/api\/console\/orders$/,
    method: 'GET',
    respond: () => paginated([]),
  },
  {
    match: /\/api\/console\/orders\/stats$/,
    method: 'GET',
    respond: () =>
      ok({
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        partially_refunded: 0,
        revenue: { today: 0, month: 0, total: 0 },
      }),
  },

  // My orders (customer)
  {
    match: /\/api\/my-orders$/,
    method: 'GET',
    respond: () => paginated([]),
  },

  // Auth
  {
    match: /\/api\/login$/,
    method: 'POST',
    respond: () => ok({ access_token: 'mock_token_xxx', token_type: 'Bearer', user: { id: 1, name: 'Mock User', email: 'mock@submitcms.test' } }),
  },
  {
    match: /\/api\/me$/,
    method: 'GET',
    respond: () => ok({ id: 1, name: 'Mock User', email: 'mock@submitcms.test' }),
  },

  // Cart
  {
    match: /\/api\/cart$/,
    respond: () => ok({ id: 1, items: [], subtotal: 0, total: 0 }),
  },

  // Storage upload
  {
    match: /\/api\/storage-image$/,
    method: 'POST',
    respond: () => ok({ id: 1, url: 'https://mock.cdn/image.webp', created_at: new Date().toISOString() }),
  },
]

/**
 * URL + method'a göre fixture response döner. Eşleşme yoksa generic
 * `{ status: true, data: [] }` döner — testler patlamasın diye.
 */
export function getMockResponse(req: MockRequest): unknown {
  for (const rule of rules) {
    if (rule.method && rule.method !== req.method) continue
    if (rule.match.test(req.url)) {
      return rule.respond(req)
    }
  }
  // Fallback — generic OK
  return req.method === 'GET' ? paginated([]) : ok(null)
}
