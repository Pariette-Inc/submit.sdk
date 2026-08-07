/**
 * Kontrat testi — SDK'nın çağırdığı her yol submit.api'de gerçekten var mı?
 *
 * Bu testin varlık sebebi somut: devraldığımız pariette.sdk'nın çağırdığı 163
 * yoldan 96'sı 410 (emekli panel), 9'u 404 döndürüyordu. Yani paketin %64'ü
 * ölüydü ve bunu ancak çalıştırınca fark ediyordunuz. Burada derleme zamanında
 * yakalanır.
 *
 * Yaklaşım: SDK kaynağındaki string literal yolları çıkar, `spec/endpoints.json`
 * ile eşleştir. Şablon değişkenleri (`${id}`) rota parametrelerine (`{id}`) denk gelir.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SPEC = JSON.parse(readFileSync(join(ROOT, 'spec/endpoints.json'), 'utf8'))
const SRC = join(ROOT, 'packages/js/src')

/** `/api/x/{id}/y` → bu yolu eşleyen regex. Parametreler tek segment yer tutar. */
const toMatcher = (path) =>
  new RegExp('^' + path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+') + '$')

const ROUTES = SPEC.endpoints.map((e) => ({ ...e, re: toMatcher(e.path) }))

/**
 * `src/index.ts`'ten başlayıp göreli import'ları izleyerek paketlenen dosyaları bulur.
 *
 * Klasörü düz taramak yerine erişilebilirlik izlenir: kimsenin import etmediği
 * bir dosya derlemeye girmez, dolayısıyla kontratın parçası değildir.
 */
function reachableFiles(entry) {
  const seen = new Set()
  const queue = [entry]
  while (queue.length) {
    const file = queue.pop()
    if (seen.has(file)) continue
    seen.add(file)
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) {
      const base = resolve(dirname(file), m[1])
      for (const cand of [`${base}.ts`, join(base, 'index.ts')]) {
        try {
          readFileSync(cand)
          queue.push(cand)
          break
        } catch {
          /* sıradaki adayı dene */
        }
      }
    }
  }
  return [...seen]
}

/** Erişilebilir dosyalardaki tüm `'/api/...'` literal yolları. */
function collectSdkPaths() {
  const found = []
  const walk = (files) => {
    for (const full of files) {
      const raw = readFileSync(full, 'utf8')
      // Yorumlar taranmaz: JSDoc örnekleri ve açıklamalarda geçen yollar gerçek
      // çağrı değildir. Satır numarası korunsun diye yorumlar boşlukla değil,
      // aynı sayıda satırsonuyla değiştirilir.
      const text = raw
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
      const rel = full.slice(SRC.length + 1)
      for (const m of text.matchAll(/['"`](\/api\/[^'"`]*)['"`]/g)) {
        found.push({ raw: m[1], file: rel, line: text.slice(0, m.index).split('\n').length })
      }
    }
  }
  walk(reachableFiles(join(SRC, 'index.ts')))
  return found
}

/** `${encodeURIComponent(typeCode)}` gibi ifadeleri tek segmentlik yer tutucuya indirger. */
const normalize = (raw) =>
  raw
    .replace(/\$\{[^}]*\}/g, 'X')      // JS ${x} ve Kotlin ${x}
    .replace(/\\\([^)]*\)/g, 'X')     // Swift \(x)
    .replace(/\$[A-Za-z_][A-Za-z0-9_]*/g, 'X') // Kotlin $x
    .replace(/\?.*$/, '')

/**
 * Diğer dillerdeki paketleri tarar.
 *
 * Klasörü düz gezmek burada yeterli: JS'ten farklı olarak bu paketlerde
 * pariette'den devralınmış ölü dosya yok, hepsi bu repoda yazıldı.
 */
function collectPathsIn(pkgDir, extensions, commentStrippers) {
  const found = []
  const root = join(ROOT, 'packages', pkgDir)
  const walk = (dir) => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return // paket henüz yazılmadıysa sessizce geç
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['vendor', 'node_modules', '.build', 'build'].includes(entry.name)) continue
        walk(full)
        continue
      }
      if (!extensions.some((e) => entry.name.endsWith(e))) continue
      let text = readFileSync(full, 'utf8')
      for (const strip of commentStrippers) text = text.replace(strip, (m) => m.replace(/[^\n]/g, ' '))
      const rel = join(pkgDir, full.slice(root.length + 1))

      if (pkgDir === 'php') {
        found.push(...extractPhpPaths(text, rel))
        continue
      }

      // Swift ve Kotlin dize araya-değer koyma (interpolation) kullanır, yani
      // yol tek bir literal içinde kalır — ayrıştırmaya gerek yok.
      for (const m of text.matchAll(/['"`](\/api\/[^'"`]*)['"`]/g)) {
        found.push({ raw: m[1], file: rel, line: text.slice(0, m.index).split('\n').length })
      }
    }
  }
  walk(root)
  return found
}

const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//g
const LINE_COMMENT = /\/\/[^\n]*/g

/**
 * PHP yolları birleştirmeyle kurar: `'/api/x/' . $id . '/y'`.
 *
 * Tek tek string literal aramak `'/api/x/'` ve `'/y'` diye iki yarım parça
 * verir, ikisi de hiçbir rotayla eşleşmez. Bu yüzden birleştirme zincirini
 * baştan sona okuyup tek yola indiriyoruz: string parçaları olduğu gibi,
 * değişkenler tek segmentlik `X` olarak.
 */
function extractPhpPaths(text, file) {
  const found = []
  const re = /'(\/api\/[^']*)'/g

  for (const m of text.matchAll(re)) {
    let path = m[1]
    let i = m.index + m[0].length

    // Zinciri izle: `. <operand>` tekrarları
    for (;;) {
      const rest = text.slice(i)
      const dot = /^\s*\.\s*/.exec(rest)
      if (!dot) break
      i += dot[0].length

      const str = /^'([^']*)'/.exec(text.slice(i))
      if (str) {
        path += str[1]
        i += str[0].length
        continue
      }

      // Değişken ya da metot çağrısı — bir URL segmentine karşılık gelir.
      // Parantez dengesi izlenmeli: `$this->seg($code)` içindeki kapanış
      // parantezi ifadenin sonu değil, aksi halde zincir burada kopar.
      const start = i
      let depth = 0
      while (i < text.length) {
        const ch = text[i]
        if (ch === '(' || ch === '[') depth++
        else if (ch === ')' || ch === ']') {
          if (depth === 0) break
          depth--
        } else if (depth === 0 && (ch === ',' || ch === ';' || ch === '.')) break
        i++
      }
      if (i === start) break
      path += 'X'
    }

    found.push({ raw: path, file, line: text.slice(0, m.index).split('\n').length })
  }

  return found
}

/** Her paketin taranacak yolları — yeni dil eklendiğinde buraya bir satır. */
const PACKAGES = {
  js: collectSdkPaths(),
  php: collectPathsIn('php', ['.php'], [BLOCK_COMMENT, LINE_COMMENT, /#[^\n]*/g]),
  swift: collectPathsIn('swift', ['.swift'], [BLOCK_COMMENT, LINE_COMMENT]),
  kotlin: collectPathsIn('kotlin', ['.kt'], [BLOCK_COMMENT, LINE_COMMENT]),
}

const SDK_PATHS = PACKAGES.js

test('SDK en az bir yol çağırıyor (toplayıcı bozulmadı)', () => {
  assert.ok(SDK_PATHS.length > 50, `yalnızca ${SDK_PATHS.length} yol bulundu — regex bozulmuş olabilir`)
})

test('SDK yollarının hepsi submit.api rota tablosunda var', () => {
  const missing = SDK_PATHS.filter(({ raw }) => !ROUTES.some((r) => r.re.test(normalize(raw))))
  assert.deepEqual(
    missing.map((m) => `${m.file}:${m.line} → ${m.raw}`),
    [],
    'API tarafında karşılığı olmayan yollar (404 döner)'
  )
})

test('SDK hiçbir emekli (410) uca dokunmuyor', () => {
  const retired = SDK_PATHS.filter(({ raw }) => {
    const hits = ROUTES.filter((r) => r.re.test(normalize(raw)))
    return hits.length > 0 && hits.every((r) => r.status === 'retired')
  })
  assert.deepEqual(
    retired.map((m) => `${m.file}:${m.line} → ${m.raw}`),
    [],
    'PANEL_RETIRED uçları — bunlar 410 döner, SDK çağırmamalı'
  )
})

for (const [pkg, paths] of Object.entries(PACKAGES)) {
  if (pkg === 'js' || paths.length === 0) continue

  test(`[${pkg}] yolların hepsi submit.api rota tablosunda var`, () => {
    const missing = paths.filter(({ raw }) => !ROUTES.some((r) => r.re.test(normalize(raw))))
    assert.deepEqual(missing.map((m) => `${m.file}:${m.line} → ${m.raw}`), [])
  })

  test(`[${pkg}] hiçbir emekli (410) uca dokunmuyor`, () => {
    const retired = paths.filter(({ raw }) => {
      const hits = ROUTES.filter((r) => r.re.test(normalize(raw)))
      return hits.length > 0 && hits.every((r) => r.status === 'retired')
    })
    assert.deepEqual(retired.map((m) => `${m.file}:${m.line} → ${m.raw}`), [])
  })

  test(`[${pkg}] JS ile aynı yüzeyi kapsıyor`, () => {
    const surfaceOf = (list) =>
      new Set(
        list.flatMap(({ raw }) => ROUTES.filter((r) => r.re.test(normalize(raw))).map((r) => r.path))
      )
    const js = surfaceOf(PACKAGES.js)
    const other = surfaceOf(paths)
    // JS referans yüzeydir; diğer diller ondan geri kalmamalı. URL üreten
    // yardımcılar (PDF, sitemap) string birleştirdiği için taranamaz —
    // bilinçli istisna listesi.
    const urlBuilders = [
      '/api/platform/my/receipts/{id}/pdf',
      '/api/platform/partner/receipts/{id}/pdf',
      '/api/public/sitemap.xml',
      '/api/auth/google/redirect',
    ]
    const gaps = [...js].filter((p) => !other.has(p) && !urlBuilders.includes(p)).sort()
    assert.deepEqual(gaps, [], `${pkg} paketinde eksik uçlar`)
  })
}

test('spec canlı/emekli sayıları tutarlı', () => {
  const live = SPEC.endpoints.filter((e) => e.status === 'live').length
  const retired = SPEC.endpoints.filter((e) => e.status === 'retired').length
  assert.equal(live, SPEC.counts.live)
  assert.equal(retired, SPEC.counts.retired)
  assert.equal(live + retired, SPEC.counts.total)
})

test('kapsam raporu', () => {
  const covered = new Set()
  for (const { raw } of SDK_PATHS) {
    for (const r of ROUTES) if (r.status === 'live' && r.re.test(normalize(raw))) covered.add(r.path)
  }
  const livePaths = new Set(SPEC.endpoints.filter((e) => e.status === 'live').map((e) => e.path))
  const pct = ((covered.size / livePaths.size) * 100).toFixed(1)
  console.log(`\n  Kapsam: ${covered.size}/${livePaths.size} canlı yol (%${pct})`)

  const uncovered = [...livePaths].filter((p) => !covered.has(p)).sort()
  if (uncovered.length) {
    console.log(`  SDK'da karşılığı olmayan ${uncovered.length} canlı yol:`)
    for (const p of uncovered) console.log(`    - ${p}`)
  }
  // Kapsam bilgilendirmedir; bilinçli olarak dışarıda bıraktığımız uçlar var
  // (cron, webhook alıcıları, OAuth yönlendirmeleri) — bu yüzden assert yok.
})
