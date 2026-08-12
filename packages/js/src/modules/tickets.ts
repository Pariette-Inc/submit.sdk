import { BaseModule } from './base'
import type { ApiResponse } from '../types/common'

/** Talep gövdesi: form gönderimleri alan → değer yazar, eski akış düz metin bırakır. */
export interface TicketMessageBody {
  format: 'empty' | 'text' | 'fields'
  text: string | null
  fields: Record<string, string> | null
}

export interface SupportTicket {
  id: number
  /** Talep türü — formun gönderdiği `type` (`ticket_subjects.value`). */
  type: string | null
  subject: string | null
  title: string | null
  name: string | null
  email: string | null
  phone: string | null
  locale: string | null
  status: number
  /** Talebe eklenmiş yanıt sayısı (`ticket_contents`). */
  reply_count: number
  message: TicketMessageBody
  created_at: string
}

export interface SupportTicketDetail extends SupportTicket {
  user: string | null
  ip: string | null
  consents: { gdpr: string | null; advertising: string | null; drp: string | null }
  thread: Array<{
    id: number
    name: string | null
    email: string | null
    phone: string | null
    message: TicketMessageBody
    created_at: string
  }>
}

export interface TicketListParams {
  search?: string
  /** `ticket_subjects.value` */
  type?: string
  subject?: string
  status?: number
  /** YYYY-AA-GG */
  start?: string
  end?: string
  page?: number
  per_page?: number
}

/**
 * Destek talepleri gelen kutusu — sitenizin iletişim/destek formlarına düşenler.
 *
 * OKUMA tarafıdır ve **oturum ister** (panel yetkisi): site token'ı tek başına
 * yetmez, kullanıcı o sitenin üyesi olmalı ve `tickets` modülü açık olmalıdır.
 * Talebi OLUŞTURAN taraf ziyaretçidir ve oturumsuzdur — bunun için
 * `sdk.delivery.submitTicket()` / `sdk.delivery.ticketForm()` kullanılır.
 *
 * @example
 *   const { data, meta } = await sdk.tickets.list({ type: 'contact', per_page: 25 })
 *   const detay = await sdk.tickets.get(data[0].id)
 *   console.log(detay.data.thread.length, 'yanıt')
 */
export class TicketModule extends BaseModule {
  /** Sayfalı gelen kutusu. Yanıt ayrıca `meta` (sayfalama) ve `stats` taşır. */
  list(params: TicketListParams = {}): Promise<
    ApiResponse<SupportTicket[]> & {
      meta?: { current_page: number; last_page: number; per_page: number; total: number }
      stats?: { total: number; today: number; month: number }
    }
  > {
    return this.client.get('/api/tickets', params as Record<string, unknown>)
  }

  /** Tek talep: gövde + yazışma + onaylar (KVKK/ticari ileti/veri işleme) + IP. */
  get(id: number): Promise<ApiResponse<SupportTicketDetail>> {
    return this.client.get(`/api/tickets/${id}`)
  }

  /**
   * Filtre için talep türleri. Panelde tanımlı konular ile gelen kutusunda
   * gerçekten geçen türlerin birleşimidir; gönderene giden otomatik yanıt
   * şablonları (`...Return`) listede yer almaz.
   */
  subjects(): Promise<ApiResponse<Array<{ value: string; label: string }>>> {
    return this.client.get('/api/tickets/subjects')
  }
}
