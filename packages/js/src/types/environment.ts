export interface Environment {
  id: number
  token: string
  name: string
  type: string
  status: number
  domain?: string
  logo?: string
  favicon?: string
  takedown_at?: string
  release_at?: string
  main?: number
  created_at: string
  updated_at: string
}

export interface EnvironmentStatistics {
  total_orders: number
  total_revenue: number
  total_products: number
  total_customers: number
  total_canvas: number
}
