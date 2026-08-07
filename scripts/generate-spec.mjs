#!/usr/bin/env node
/**
 * spec/endpoints.json'u submit.api'nin gerçek rota tablosundan üretir.
 *
 *   node scripts/generate-spec.mjs --api-path ../submit.api
 *
 * Neden route:list: rota dosyalarını elle ayrıştırmak middleware zincirini kaçırır.
 * Emekli uçları (RetiredPanel) canlılardan ayıran şey tam olarak o zincir, ve bu
 * ayrım SDK'nın 410 dönen uçları çağırmaması için kritik.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const argv = process.argv.slice(2)
const apiPath = resolve(argv[argv.indexOf('--api-path') + 1] ?? '../submit.api')

if (!existsSync(resolve(apiPath, 'artisan'))) {
  console.error(`submit.api bulunamadı: ${apiPath}\nKullanım: node scripts/generate-spec.mjs --api-path ../submit.api`)
  process.exit(1)
}

const raw = execFileSync('php', ['artisan', 'route:list', '--json'], {
  cwd: apiPath,
  maxBuffer: 32 * 1024 * 1024,
  encoding: 'utf8',
})

const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: apiPath, encoding: 'utf8' }).trim()
const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: apiPath, encoding: 'utf8' }).trim()

const short = (m) => m.replace('App\\Http\\Middleware\\', '')

const endpoints = []
for (const r of JSON.parse(raw)) {
  if (!r.uri.startsWith('api/')) continue
  const mw = r.middleware.map(short)

  const auth = []
  if (mw.includes('CheckApiToken')) auth.push('envToken')
  if (mw.some((m) => m.includes('Authenticate:api'))) auth.push('jwt')
  if (mw.includes('EnsureEnvMembership')) auth.push('envMember')
  if (mw.includes('BossMiddleware')) auth.push('boss')
  if (mw.includes('SuperAdminMiddleware')) auth.push('superAdmin')

  // ── Operatör uçları public SDK'ya GİRMEZ (2026-08-07) ──────────────────
  // submit.sdk public bir repo ve @submitcms/sdk müşteri istemcisi. Platform
  // ekibinin uçları (boss / superAdmin) müşteri uygulamasından zaten 403
  // döner; spec'te durmalarının tek etkisi tam bir operatör uç haritasını
  // yayınlamaktı. Bu filtre kaynaktadır ki bir daha elle geri sızmasın:
  // `pnpm spec:generate` her çalıştığında bu uçlar elenir.
  if (auth.includes('boss') || auth.includes('superAdmin')) continue

  const retired = mw.includes('RetiredPanel')

  for (const method of r.method.split('|').filter((m) => m !== 'HEAD')) {
    endpoints.push({
      method,
      path: `/${r.uri}`,
      controller: r.action.replace('App\\Http\\Controllers\\', ''),
      auth,
      moduleGate: mw.find((m) => m.startsWith('ModuleGate:'))?.split(':')[1] ?? null,
      throttle: mw.find((m) => m.includes('ThrottleRequests:'))?.split(':')[1] ?? null,
      status: retired ? 'retired' : 'live',
      ...(retired && {
        httpStatus: 410,
        reason:
          'PANEL_RETIRED — eski sahip-yönetim paneli (karar 2026-07-30). Yerine: schema/records, menus, platform/my, commerce.',
      }),
    })
  }
}

endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))

const doc = {
  $comment:
    "submit.api'nin gerçek rota tablosundan üretildi (php artisan route:list). Elle düzenlemeyin — `pnpm spec:generate` ile yenileyin.",
  source: { repo: 'submit.api', branch, commit: sha },
  counts: {
    total: endpoints.length,
    live: endpoints.filter((e) => e.status === 'live').length,
    retired: endpoints.filter((e) => e.status === 'retired').length,
  },
  authLegend: {
    envToken: 'SubmitToken başlığı (veya ?env=) — site kimliği. Neredeyse her uçta gerekir.',
    jwt: 'Authorization: Bearer <token> — oturum açmış kullanıcı.',
    envMember: "Kullanıcının o environment'ta üyeliği olmalı.",
  },
  endpoints,
}

writeFileSync(resolve(ROOT, 'spec/endpoints.json'), JSON.stringify(doc, null, 1) + '\n')
console.log(`spec/endpoints.json yazıldı — ${doc.counts.live} canlı / ${doc.counts.retired} emekli (${branch}@${sha})`)
