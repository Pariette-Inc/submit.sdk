export interface Subscription {
  id: number
  user_id: number
  product_id: number
  environment_id: number
  order_id: number
  start_date: string
  end_date: string
  next_payment_date?: string
  is_recurring: boolean
  payment_period: 'monthly' | 'yearly' | 'trial' | 'one-time'
  plan: string
  status: number
  created_at: string
  updated_at: string
}

export interface BillingProfile {
  id: number
  user_id: number
  type: 'individual' | 'corporate'
  name: string
  email?: string
  phone?: string
  tax_id?: string
  tax_office?: string
  company_name?: string
  address: string
  city: string
  state?: string
  postal_code: string
  country: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface CreateBillingProfileRequest {
  type: 'individual' | 'corporate'
  name: string
  email?: string
  phone?: string
  tax_id?: string
  tax_office?: string
  company_name?: string
  address: string
  city: string
  state?: string
  postal_code: string
  country: string
  is_default?: boolean
}

export interface UpdateBillingProfileRequest extends Partial<CreateBillingProfileRequest> {}

export interface SubscribeRequest {
  product_id: string
  billing_profile_id: number
  plan: 'monthly' | 'yearly'
  payment_method_id?: string
  card?: {
    number: string
    exp_month: string
    exp_year: string
    cvc: string
    holder_name: string
  }
  is_3d?: boolean
  installment_count?: number
  callbackUrl?: string
}

export interface CalculatePricingRequest {
  product_id: string
  plan: 'monthly' | 'yearly'
  billing_profile_id: number
}

export interface PricingResponse {
  base_price: number
  vat_rate: number
  vat_amount: number
  total: number
  currency: string
  installment_options?: InstallmentOption[]
}

export interface InstallmentOption {
  count: number
  monthly_amount: number
  total_amount: number
  interest_rate: number
}
