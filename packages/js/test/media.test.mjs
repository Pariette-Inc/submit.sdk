// Medya CDN adresi: varsayılan kök, `cdnUrl` ayarı ve `media()` birleştirmesi.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SubmitCms, CDN_URL, API_URLS } from '../dist/index.mjs'

test('ayarsız istemci üretim API ve CDN köklerini kullanır', () => {
  const sdk = new SubmitCms({ token: 't' })
  assert.equal(sdk.client.baseUrl, API_URLS.production)
  assert.equal(sdk.cdnUrl, CDN_URL)
  assert.equal(CDN_URL, 'https://cdn.submitcms.com')
})

test('media yolu CDN köküne ekler, eğik çizgiyi tekler', () => {
  const sdk = new SubmitCms({ token: 't' })
  assert.equal(sdk.media('wuxcomtr/a.webp'), 'https://cdn.submitcms.com/wuxcomtr/a.webp')
  assert.equal(sdk.media('/wuxcomtr/a.webp'), 'https://cdn.submitcms.com/wuxcomtr/a.webp')
})

test('media boş yolu boş, tam adresi aynen döndürür', () => {
  const sdk = new SubmitCms({ token: 't' })
  assert.equal(sdk.media(''), '')
  assert.equal(sdk.media(null), '')
  assert.equal(sdk.media(undefined), '')
  assert.equal(sdk.media('https://x.test/a.png'), 'https://x.test/a.png')
  assert.equal(sdk.media('//x.test/a.png'), '//x.test/a.png')
  assert.equal(sdk.media('data:image/png;base64,AA'), 'data:image/png;base64,AA')
})

test('cdnUrl ayarı kökü değiştirir', () => {
  const sdk = new SubmitCms({ token: 't', cdnUrl: 'http://localhost:9000/' })
  assert.equal(sdk.cdnUrl, 'http://localhost:9000')
  assert.equal(sdk.media('a.webp'), 'http://localhost:9000/a.webp')
})
