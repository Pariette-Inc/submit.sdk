/**
 * Toplu okuma testi — aynı anda yapılan public GET'ler tek istekte gider mi?
 *
 * Gerçek bir HTTP sunucusu kurulur, SDK'nın attığı istekler sayılır.
 * Derlenmiş paketi kullanır: önce `npm run build` (bkz. `npm test`).
 */
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { SubmitCms, SubmitError } from '../dist/index.mjs'

/** Sunucunun gördüğü istekler. */
const seen = []
/** true iken toplu uç yokmuş gibi 404 döner (eski API). */
let batchMissing = false

const record = (slug) => ({ status: true, data: { slug } })

/** Tek bir public okumayı yanıtlar: "olmayan" adresi 404. */
function answer(path) {
  const slug = path.split('/').pop()
  if (slug === 'olmayan') return { status: 404, body: { status: false, message: 'Kayıt bulunamadı.' } }
  return { status: 200, body: record(slug) }
}

const server = createServer((req, res) => {
  let raw = ''
  req.on('data', (chunk) => (raw += chunk))
  req.on('end', () => {
    const url = new URL(req.url, 'http://x')
    seen.push({ method: req.method, path: url.pathname, body: raw ? JSON.parse(raw) : null })
    res.setHeader('Content-Type', 'application/json')

    if (url.pathname === '/api/public/batch') {
      if (batchMissing) {
        res.statusCode = 404
        return res.end(JSON.stringify({ status: false, message: 'Not found' }))
      }
      const { requests } = JSON.parse(raw)
      const data = requests.map((r) => ({ id: r.id, ...answer(r.path) }))
      return res.end(JSON.stringify({ status: true, data }))
    }

    const { status, body } = answer(url.pathname)
    res.statusCode = status
    res.end(JSON.stringify(body))
  })
})
await new Promise((resolve) => server.listen(0, resolve))
const baseUrl = `http://127.0.0.1:${server.address().port}`
after(() => server.close())

const sdk = (config = {}) => new SubmitCms({ mode: 'test', baseUrl, token: 't', retry: false, ...config })

test('aynı anda yapılan okumalar tek toplu istekte gider', async () => {
  seen.length = 0
  const cms = sdk()
  const [a, b, c] = await Promise.all([
    cms.delivery.record('page', 'a', { locale: 'tr' }),
    cms.delivery.record('page', 'b'),
    cms.delivery.records('blog', { per_page: 3, featured: true }),
  ])

  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/public/batch')
  assert.equal(a.data.slug, 'a')
  assert.equal(b.data.slug, 'b')
  assert.equal(c.data.slug, 'blog')
  // Sorgu tek GET'teki biçimde: sayı ve mantıksal değer metin.
  assert.deepEqual(seen[0].body.requests[2].query, { per_page: '3', featured: 'true' })
})

test('parça hatası yalnız kendi çağrısını düşürür', async () => {
  seen.length = 0
  const cms = sdk()
  const [ok, missing] = await Promise.allSettled([
    cms.delivery.record('page', 'var'),
    cms.delivery.record('page', 'olmayan'),
  ])

  assert.equal(seen.length, 1)
  assert.equal(ok.status, 'fulfilled')
  assert.equal(missing.status, 'rejected')
  assert.ok(missing.reason instanceof SubmitError)
  assert.equal(missing.reason.code, 404)
})

test('parçalar max sınırında bölünür', async () => {
  seen.length = 0
  const cms = sdk({ batch: { max: 2 } })
  await Promise.all(['a', 'b', 'c', 'd', 'e'].map((s) => cms.delivery.record('page', s)))

  // 2 + 2 toplu istek; tek kalan parça zarfsız tek GET olarak gider.
  assert.deepEqual(
    seen.map((r) => r.path).sort(),
    ['/api/public/batch', '/api/public/batch', '/api/public/records/page/item/e'].sort()
  )
})

test('tek çağrı ve batch:false tek GET gönderir', async () => {
  seen.length = 0
  await sdk().delivery.record('page', 'yalniz')
  await Promise.all([
    sdk({ batch: false }).delivery.record('page', 'x'),
    sdk({ batch: false }).delivery.record('page', 'y'),
  ])

  assert.equal(seen.length, 3)
  assert.ok(seen.every((r) => r.method === 'GET'))
})

test('eski API toplu ucu tanımazsa tek isteklere döner', async () => {
  seen.length = 0
  batchMissing = true
  try {
    const cms = sdk()
    const [a, b] = await Promise.all([cms.delivery.record('page', 'a'), cms.delivery.record('page', 'b')])
    assert.equal(a.data.slug, 'a')
    assert.equal(b.data.slug, 'b')

    // Sonraki turda toplu uç bir daha denenmez.
    seen.length = 0
    await Promise.all([cms.delivery.record('page', 'c'), cms.delivery.record('page', 'd')])
    assert.ok(seen.every((r) => r.path !== '/api/public/batch'))
  } finally {
    batchMissing = false
  }
})

test('public dışı yollar gruplanmaz', async () => {
  seen.length = 0
  const cms = sdk()
  await Promise.allSettled([
    cms.client.get('/api/schema/types'),
    cms.client.get('/api/schema/records/blog'),
  ])

  assert.equal(seen.length, 2)
  assert.ok(seen.every((r) => r.method === 'GET'))
})
