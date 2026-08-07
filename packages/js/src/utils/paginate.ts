import { PaginatedResponse } from '../types/common'

/**
 * Sayfalı bir endpoint'i async generator ile gezer.
 *
 * Kullanıcı `page` parametresini elle artırmak yerine `for await` ile
 * tüm öğeler üzerinde dolaşabilir. Sayfa sayfa fetch yapılır — bellek
 * şişmez, son sayfa otomatik tespit edilir.
 *
 * @example
 *   for await (const product of paginate(p => submitcms.products.list({ page: p }))) {
 *     console.log(product.name)
 *   }
 */
export async function* paginate<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>
): AsyncGenerator<T, void, void> {
  let page = 1
  while (true) {
    const res = await fetchPage(page)
    for (const item of res.data) yield item
    if (page >= res.last_page) break
    page++
  }
}
