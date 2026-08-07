import { SubmitClient } from '../client'

/**
 * Tüm SDK modüllerinin ortak atası — istemciyi taşır, başka bir şey yapmaz.
 *
 * Modüller yolları `/api/...` ile tam yazar; istemci yalnızca kökü (host) tutar.
 * Böylece bir yol okunduğunda `spec/endpoints.json`'daki satırla birebir eşleşir
 * ve kontrat testi ikisini karşılaştırabilir.
 */
export abstract class BaseModule {
  constructor(protected client: SubmitClient) {}
}
