/**
 * Dinamik içerik şeması (v2) tipleri.
 *
 * Alanlar müşteri tarafından tanımlandığı için gövde şekli derleme zamanında
 * bilinemez. `data` varsayılan olarak gevşek tiplidir; kendi tipinizi generic
 * ile verebilirsiniz:
 *
 *   type Etkinlik = { baslik: string; kontenjan: number }
 *   const list = await submitcms.records<Etkinlik>('etkinlik').list()
 *   list.data[0].data.baslik  // string
 */

export type RecordStatus = 'draft' | 'published' | 'archived'

export interface ContentRecord<T = Record<string, any>> {
  id: number
  slug: string | null
  locale: string | null
  status: RecordStatus
  schema_version: number
  published_at: string | null
  created_at: string
  updated_at: string
  data: T
}

/** Desteklenen filtre operatörleri. */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in'

export type FilterValue = string | number | boolean | Array<string | number>

/** `{ sehir: 'ankara' }` ya da `{ kontenjan: { gte: 100 } }` */
export type RecordFilter = Record<string, FilterValue | Partial<Record<FilterOperator, FilterValue>>>

export interface RecordListParams {
  filter?: RecordFilter
  q?: string
  sort?: string
  dir?: 'asc' | 'desc'
  locale?: string
  status?: RecordStatus
  page?: number
  perPage?: number
}

export interface RecordFieldInfo {
  key: string
  type: string
  label: string
  required: boolean
  filterable: boolean
}

export interface ContentTypeSchema {
  code: string
  name: string
  version: number
  fields: RecordFieldInfo[]
}

export interface CreateRecordInput<T = Record<string, any>> {
  data: T
  status?: RecordStatus
  locale?: string
  slug?: string
  published_at?: string
}
