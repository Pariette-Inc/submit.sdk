<?php

declare(strict_types=1);

namespace SubmitCms\Sdk\Modules;

/**
 * Destek talepleri gelen kutusu — sitenizin iletişim/destek formlarına düşenler.
 *
 * OKUMA tarafıdır ve **oturum ister**: site token'ı tek başına yetmez, kullanıcı
 * o sitenin üyesi olmalı ve `tickets` modülü açık olmalıdır. Talebi oluşturan
 * taraf ziyaretçidir ve oturumsuzdur — onun için `$sdk->delivery->submitTicket()`
 * ve `$sdk->delivery->ticketForm()` vardır.
 *
 * ```php
 * $liste = $sdk->tickets->list(['type' => 'contact', 'per_page' => 25]);
 * $detay = $sdk->tickets->get($liste['data'][0]['id']);
 * ```
 */
final class Tickets extends Module
{
    /**
     * Sayfalı gelen kutusu; yanıt `meta` (sayfalama) ve `stats` de taşır.
     *
     * @param array{search?:string,type?:string,subject?:string,status?:int,start?:string,end?:string,page?:int,per_page?:int} $params
     */
    public function list(array $params = []): mixed
    {
        return $this->client->get('/api/tickets', $params);
    }

    /** Tek talep: gövde + yazışma + onaylar (KVKK/ticari ileti/veri işleme) + IP. */
    public function get(int $id): mixed
    {
        return $this->client->get('/api/tickets/' . $id);
    }

    /**
     * Filtre için talep türleri: tanımlı konular + gelen kutusunda geçen türler.
     * Gönderene giden otomatik yanıt şablonları (`...Return`) listede yer almaz.
     */
    public function subjects(): mixed
    {
        return $this->client->get('/api/tickets/subjects');
    }
}
