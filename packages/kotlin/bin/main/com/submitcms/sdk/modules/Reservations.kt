package com.submitcms.sdk.modules

import com.submitcms.sdk.SubmitClient
import kotlinx.serialization.json.JsonObject

/**
 * Rezervasyon yönetimi (panel tarafı).
 *
 * **Oturum ister** ve `reservations` modülü açık olmalıdır. Ziyaretçi tarafı
 * (müsaitlik sorgusu ve talep gönderme) oturumsuzdur ve [Delivery] altındadır:
 * [Delivery.reservationAvailability], [Delivery.reservationCalendar],
 * [Delivery.book].
 *
 * Rezerve edilen şey bir KAYITTIR: otel odası, doktor, masa, tur — hepsi kendi
 * içerik tipinde birer kayıt. Bir kaydı rezervasyona AÇAN şey [saveSettings]
 * çağrısıdır; ayarı olmayan kayıtta müsaitlik `not_reservable` döner.
 *
 * ```kotlin
 * sdk.reservations.saveSettings(42, mapOf(
 *     "capacity" to 3, "unit" to "night", "min_units" to 2,
 *     "base_price" to 1500, "auto_confirm" to true,
 * ))
 *
 * val bekleyen = sdk.reservations.list(mapOf("status" to "pending"))
 * ```
 */
class Reservations(private val client: SubmitClient) {

    /**
     * Rezervasyon gelen kutusu. `meta.counts` durum başına sayaç taşır.
     *
     * Tarih filtresi aralıkla KESİŞENLERİ getirir: 1 Eylül sorgusu 28
     * Ağustos'ta başlayan konaklamayı da bulur.
     *
     * Filtreler: `status`, `record_id`, `type`, `from`, `to`, `q`, `page`, `per_page`.
     */
    suspend fun list(params: Map<String, Any?> = emptyMap()): JsonObject =
        client.get("/api/reservations", params)

    suspend fun get(id: Int): JsonObject = client.get("/api/reservations/$id")

    /**
     * Elle rezervasyon (telefonla gelen talep).
     *
     * Site formuyla AYNI kapıdan geçer: çakışan tarihler 422 ile reddedilir,
     * gerekçe `errors` alanında insan diliyle döner.
     */
    suspend fun create(payload: Map<String, Any?>): JsonObject =
        client.post("/api/reservations", payload)

    /**
     * Durum değişikliği ve tarih taşıma.
     *
     * `starts_at` / `ends_at` / `quantity` gönderilirse çakışma kontrolü
     * yeniden çalışır; kaydın KENDİ eski aralığı engel sayılmaz.
     *
     * İptal silme değildir: `mapOf("status" to "cancelled")` kaydı bırakır,
     * yalnız kapasiteyi serbest eder.
     */
    suspend fun update(id: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/reservations/$id", payload)

    /** Rezervasyonu çöp kutusuna taşır (kayıtlarla aynı soft-delete kuralı). */
    suspend fun delete(id: Int): JsonObject = client.delete("/api/reservations/$id")

    /**
     * Doluluk takvimi — gün gün kalan kapasite ve o günün fiyatı.
     *
     * Gece sayan birimlerde ÇIKIŞ GÜNÜ boş görünür: 12'sinde öğlen çıkan
     * misafir 12 gecesini tutmaz. Tek çağrıda en çok 120 gün döner.
     */
    suspend fun calendar(recordId: Int, from: String, to: String): JsonObject =
        client.get(
            "/api/reservations/calendar",
            mapOf("record_id" to recordId, "from" to from, "to" to to),
        )

    /** "Bu tarihlerde açık mı, kaça?" — yazmadan önce kontrol. */
    suspend fun check(params: Map<String, Any?>): JsonObject =
        client.get("/api/reservations/check", params)

    /** Sitedeki rezerve edilebilir kayıtlar. */
    suspend fun settings(): JsonObject = client.get("/api/reservations/settings")

    /** Kaydın ayarları + kapalı tarihleri + sezon fiyatları tek yanıtta. */
    suspend fun recordSettings(recordId: Int): JsonObject =
        client.get("/api/reservations/settings/$recordId")

    /**
     * Kur ya da güncelle — kaydı rezervasyona AÇAN çağrı budur.
     *
     * `unit`: `night` (otel), `day` (kiralama), `hour` (randevu).
     */
    suspend fun saveSettings(recordId: Int, payload: Map<String, Any?>): JsonObject =
        client.put("/api/reservations/settings/$recordId", payload)

    /** Rezervasyona kapatır: yeni talep alınmaz, geçmiş kayıtlar durur. */
    suspend fun closeSettings(recordId: Int): JsonObject =
        client.delete("/api/reservations/settings/$recordId")

    /**
     * Elle kapatma: bakım, tatil, özel kullanım. Rezervasyonla aynı şekilde
     * kapasiteden düşer — tek fark, karşısında müşteri olmamasıdır.
     */
    suspend fun addBlock(recordId: Int, payload: Map<String, Any?>): JsonObject =
        client.post("/api/reservations/settings/$recordId/blocks", payload)

    suspend fun removeBlock(recordId: Int, blockId: Int): JsonObject =
        client.delete("/api/reservations/settings/$recordId/blocks/$blockId")

    /**
     * Tarih aralığına özel fiyat. Kapsanmayan günler `base_price` ile
     * hesaplanır; çakışan aralıklarda `priority` büyük olan kazanır.
     *
     * Fiyat rezervasyon yazılırken KOPYALANIR: tarifeyi sonradan değiştirmek
     * eski rezervasyonların tutarını değiştirmez.
     */
    suspend fun addRate(recordId: Int, payload: Map<String, Any?>): JsonObject =
        client.post("/api/reservations/settings/$recordId/rates", payload)

    suspend fun removeRate(recordId: Int, rateId: Int): JsonObject =
        client.delete("/api/reservations/settings/$recordId/rates/$rateId")
}
