export interface WarehouseInventory {
  id: number
  warehouse_id: number
  product_id: number
  variant_id?: number
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold?: number
  location?: string
  updated_at: string
}

export interface StockAdjustment {
  quantity: number
  type: 'add' | 'remove' | 'set'
  reason?: string
  reference?: string
}

export interface BulkStockAdjustment {
  items: {
    product_id: number
    warehouse_id: number
    quantity: number
    type: 'add' | 'remove' | 'set'
    reason?: string
  }[]
}

export interface StockMovement {
  id: number
  product_id: number
  warehouse_id: number
  quantity: number
  type: string
  reason?: string
  reference?: string
  user_id?: number
  created_at: string
}

export interface StockTransfer {
  id: number
  from_warehouse_id: number
  to_warehouse_id: number
  status: string
  notes?: string
  created_at: string
  items: StockTransferItem[]
}

export interface StockTransferItem {
  product_id: number
  quantity: number
}

export interface CreateStockTransferRequest {
  from_warehouse_id: number
  to_warehouse_id: number
  notes?: string
  items: StockTransferItem[]
}

export interface StockSummary {
  total_products: number
  total_quantity: number
  total_reserved: number
  total_available: number
  low_stock_count: number
}

export interface LowStockItem {
  product_id: number
  product_title: string
  warehouse_id: number
  quantity: number
  threshold: number
}
