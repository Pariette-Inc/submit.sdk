package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * Destek talepleri gelen kutusu — sitenin iletişim/destek formlarına düşenler.
 *
 * OKUMA tarafıdır ve **oturum ister**: site token'ı tek başına yetmez, kullanıcı
 * o sitenin üyesi olmalı ve `tickets` modülü açık olmalıdır. Talebi oluşturan
 * taraf ziyaretçidir ve oturumsuzdur — bunun için [Delivery.submitTicket] ve
 * [Delivery.ticketForm] kullanılır.
 */
class Tickets(private val client: SubmitClient) {

    /**
     * Sayfalı gelen kutusu; yanıt `meta` (sayfalama) ve `stats` de taşır.
     *
     * Filtreler: `search`, `type`, `subject`, `status`, `start`, `end`,
     * `page`, `per_page`.
     */
    suspend fun list(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/tickets", params)

    /** Tek talep: gövde + yazışma + onaylar (KVKK/ticari ileti/veri işleme) + IP. */
    suspend fun get(id: Int): JsonObject = client.get("/api/tickets/$id")

    /**
     * Filtre için talep türleri: tanımlı konular + gelen kutusunda geçen türler.
     * Gönderene giden otomatik yanıt şablonları (`...Return`) listede yer almaz.
     */
    suspend fun subjects(): JsonObject = client.get("/api/tickets/subjects")
}
