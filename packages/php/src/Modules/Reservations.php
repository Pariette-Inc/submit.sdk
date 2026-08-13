<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Rezervasyon yönetimi (panel tarafı).
 *
 * **Oturum ister** ve `reservations` modülü açık olmalıdır. Ziyaretçi tarafı
 * (müsaitlik sorgusu ve talep gönderme) oturumsuzdur ve
 * `$sdk->delivery->reservationAvailability()` / `reservationCalendar()` /
 * `book()` altındadır.
 *
 * Rezerve edilen şey bir KAYITTIR: otel odası, doktor, masa, tur — hepsi kendi
 * içerik tipinde birer kayıt. Bir kaydı rezervasyona AÇAN şey
 * `saveSettings()` çağrısıdır; ayarı olmayan kayıtta müsaitlik
 * `not_reservable` döner.
 *
 * ```php
 * // 1. Odayı rezervasyona aç
 * $sdk->reservations->saveSettings(42, [
 *     'capacity' => 3, 'unit' => 'night', 'min_units' => 2,
 *     'base_price' => 1500, 'auto_confirm' => true,
 * ]);
 *
 * // 2. Sezon fiyatı
 * $sdk->reservations->addRate(42, [
 *     'name' => 'Yüksek sezon', 'starts_on' => '2027-07-01',
 *     'ends_on' => '2027-08-31', 'price' => 2500,
 * ]);
 *
 * // 3. Gelen kutusu
 * $bekleyen = $sdk->reservations->list(['status' => 'pending']);
 * ```
 */
final class Reservations extends Module
{
    /**
     * Rezervasyon gelen kutusu. `meta.counts` durum başına sayaç taşır.
     *
     * Tarih filtresi aralıkla KESİŞENLERİ getirir: 1 Eylül sorgusu 28
     * Ağustos'ta başlayan konaklamayı da bulur.
     *
     * @param array{status?:string,record_id?:int,type?:string,from?:string,to?:string,q?:string,page?:int,per_page?:int} $params
     */
    public function list(array $params = []): mixed
    {
        return $this->client->get('/api/reservations', $params);
    }

    public function get(int $id): mixed
    {
        return $this->client->get('/api/reservations/' . $id);
    }

    /**
     * Elle rezervasyon (telefonla gelen talep).
     *
     * Site formuyla AYNI kapıdan geçer: çakışan tarihler 422 ile reddedilir,
     * gerekçe `errors` alanında insan diliyle döner.
     *
     * @param array{record_id:int,starts_at:string,ends_at:string,guest_name:string,quantity?:int,guests?:int,guest_email?:string,guest_phone?:string,note?:string} $payload
     */
    public function create(array $payload): mixed
    {
        return $this->client->post('/api/reservations', $payload);
    }

    /**
     * Durum değişikliği ve tarih taşıma.
     *
     * `starts_at` / `ends_at` / `quantity` gönderilirse çakışma kontrolü
     * yeniden çalışır; kaydın KENDİ eski aralığı engel sayılmaz.
     *
     * İptal silme değildir: `['status' => 'cancelled']` kaydı bırakır, yalnız
     * kapasiteyi serbest eder.
     */
    public function update(int $id, array $payload): mixed
    {
        return $this->client->put('/api/reservations/' . $id, $payload);
    }

    /** Rezervasyonu çöp kutusuna taşır (kayıtlarla aynı soft-delete kuralı). */
    public function delete(int $id): mixed
    {
        return $this->client->delete('/api/reservations/' . $id);
    }

    /**
     * Doluluk takvimi — gün gün kalan kapasite ve o günün fiyatı.
     *
     * Gece sayan birimlerde ÇIKIŞ GÜNÜ boş görünür: 12'sinde öğlen çıkan
     * misafir 12 gecesini tutmaz, o akşam oda yeniden satılır.
     *
     * Tek çağrıda en çok 120 gün döner.
     */
    public function calendar(int $recordId, string $from, string $to): mixed
    {
        return $this->client->get('/api/reservations/calendar', [
            'record_id' => $recordId,
            'from' => $from,
            'to' => $to,
        ]);
    }

    /**
     * "Bu tarihlerde açık mı, kaça?" — yazmadan önce kontrol.
     *
     * @param array{record_id:int,starts_at:string,ends_at:string,quantity?:int} $params
     */
    public function check(array $params): mixed
    {
        return $this->client->get('/api/reservations/check', $params);
    }

    /** Sitedeki rezerve edilebilir kayıtlar. */
    public function settings(): mixed
    {
        return $this->client->get('/api/reservations/settings');
    }

    /** Kaydın ayarları + kapalı tarihleri + sezon fiyatları tek yanıtta. */
    public function recordSettings(int $recordId): mixed
    {
        return $this->client->get('/api/reservations/settings/' . $recordId);
    }

    /**
     * Kur ya da güncelle — kaydı rezervasyona AÇAN çağrı budur.
     *
     * @param array{capacity:int,unit:'night'|'day'|'hour',min_units?:int,max_units?:int|null,lead_time_hours?:int,buffer_minutes?:int,season_start?:string|null,season_end?:string|null,auto_confirm?:bool,base_price?:float,currency?:string,active?:bool} $payload
     */
    public function saveSettings(int $recordId, array $payload): mixed
    {
        return $this->client->put('/api/reservations/settings/' . $recordId, $payload);
    }

    /** Rezervasyona kapatır: yeni talep alınmaz, geçmiş kayıtlar durur. */
    public function closeSettings(int $recordId): mixed
    {
        return $this->client->delete('/api/reservations/settings/' . $recordId);
    }

    /**
     * Elle kapatma: bakım, tatil, özel kullanım. Rezervasyonla aynı şekilde
     * kapasiteden düşer — tek fark, karşısında müşteri olmamasıdır.
     *
     * @param array{starts_at:string,ends_at:string,quantity?:int,reason?:string} $payload
     */
    public function addBlock(int $recordId, array $payload): mixed
    {
        return $this->client->post('/api/reservations/settings/' . $recordId . '/blocks', $payload);
    }

    public function removeBlock(int $recordId, int $blockId): mixed
    {
        return $this->client->delete('/api/reservations/settings/' . $recordId . '/blocks/' . $blockId);
    }

    /**
     * Tarih aralığına özel fiyat. Kapsanmayan günler `base_price` ile
     * hesaplanır; çakışan aralıklarda `priority` büyük olan kazanır.
     *
     * Fiyat rezervasyon yazılırken KOPYALANIR: tarifeyi sonradan değiştirmek
     * eski rezervasyonların tutarını değiştirmez.
     *
     * @param array{starts_on:string,ends_on:string,price:float,name?:string,min_units?:int,priority?:int} $payload
     */
    public function addRate(int $recordId, array $payload): mixed
    {
        return $this->client->post('/api/reservations/settings/' . $recordId . '/rates', $payload);
    }

    public function removeRate(int $recordId, int $rateId): mixed
    {
        return $this->client->delete('/api/reservations/settings/' . $recordId . '/rates/' . $rateId);
    }
}
