#!/usr/bin/env node
/**
 * submitcms.com/sdk sayfasının beslendiği referansı üretir.
 *
 *   node scripts/generate-reference.mjs [--out ../submit.web/src/data/sdk-reference.json]
 *
 * Kaynak, JS paketinin kendisidir — modül sınıfları, metot adları, JSDoc
 * açıklamaları ve çağrılan yollar oradan okunur; kimlik doğrulama zinciri,
 * modül kapısı ve rate limit bilgisi `spec/endpoints.json` ile eşleştirilir.
 *
 * Neden koddan üretiliyor: elle yazılan dokümantasyon kaçınılmaz olarak
 * saparr. Devraldığımız SDK'nın çağırdığı uçların %59'u 410 dönüyordu ve
 * README hâlâ onları anlatıyordu. Buradaki her satırın kaynakta bir karşılığı
 * var; olmayan bir metot dokümana giremez.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC = JSON.parse(readFileSync(join(ROOT, 'spec/endpoints.json'), 'utf8'))
const MODULES_DIR = join(ROOT, 'packages/js/src/modules')

const argv = process.argv.slice(2)
const outArg = argv.indexOf('--out')
const OUT = resolve(outArg === -1 ? join(ROOT, 'docs/reference.json') : argv[outArg + 1])

const toMatcher = (path) =>
  new RegExp('^' + path.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+') + '$')

const ROUTES = SPEC.endpoints.map((e) => ({ ...e, re: toMatcher(e.path) }))

/**
 * Diller arası yol karşılaştırması için ortak biçime indirger:
 * her araya-değer koyma ifadesi tek segmentlik `X` olur.
 *
 * Swift'in `\(esc(typeCode))` biçimi iç içe parantez içerdiği için düz
 * `[^)]*` ile kesilemez — ilk `)` ifadeyi erken kapatır ve yola sarkan bir
 * `)` bırakır. Diller farklı anahtar üretince eşleşme kaçar, o yüzden
 * parantez dengesi sayılıyor.
 */
function normalize(raw) {
  let out = ''
  let i = 0

  while (i < raw.length) {
    const isSwift = raw[i] === '\\' && raw[i + 1] === '('
    const isTemplate = raw[i] === '$' && (raw[i + 1] === '{' || raw[i + 1] === '(')

    if (isSwift || isTemplate) {
      const open = isSwift ? '(' : raw[i + 1]
      const close = open === '{' ? '}' : ')'
      i += 2
      let depth = 1
      while (i < raw.length && depth > 0) {
        if (raw[i] === open) depth++
        else if (raw[i] === close) depth--
        i++
      }
      out += 'X'
      continue
    }

    // Kotlin'in süssüz biçimi: `$id`
    if (raw[i] === '$' && /[A-Za-z_]/.test(raw[i + 1] ?? '')) {
      i++
      while (i < raw.length && /[A-Za-z0-9_]/.test(raw[i])) i++
      out += 'X'
      continue
    }

    out += raw[i]
    i++
  }

  return out.replace(/\?.*$/, '')
}

/** Yolu spec'teki rota kaydıyla eşler (metot da uyuşmalı). */
function lookup(verb, rawPath) {
  const normalized = normalize(rawPath)
  return ROUTES.find((r) => r.method === verb.toUpperCase() && r.re.test(normalized)) ?? null
}

/** JSDoc bloğunu düz metne indirger: yıldızları ve `@` etiketlerini atar. */
function cleanDoc(block) {
  if (!block) return { summary: '', body: '', example: '' }

  const lines = block
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*ᅟ?ᅠ?\s?/, '').trimEnd())

  const example = []
  const prose = []
  let inExample = false

  for (const line of lines) {
    if (/^@example/.test(line)) {
      inExample = true
      continue
    }
    if (/^@/.test(line)) {
      inExample = false
      continue
    }
    if (inExample) example.push(line)
    else prose.push(line)
  }

  // Markdown kod çiti içindeki örnekler de yakalanır.
  const fenced = block.match(/```[a-z]*\n([\s\S]*?)```/)
  if (fenced && example.length === 0) example.push(...fenced[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '')))

  const text = prose
    .join('\n')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
  const [summary, ...rest] = text.split(/\n\s*\n/)

  return {
    summary: (summary ?? '').replace(/\s+/g, ' ').trim(),
    body: rest.join('\n\n').trim(),
    example: example.join('\n').trim(),
  }
}

/**
 * `typeCode: string, params: RecordListParams = {}` → parametre listesi.
 *
 * Tip ifadelerinde virgül geçebildiği için (`Record<string, unknown>`) düz
 * `split(',')` yanlış böler; parantez/köşeli/süslü derinliği izlenir.
 */
function parseParams(raw) {
  if (!raw.trim()) return []

  const parts = []
  let depth = 0
  let current = ''

  for (const ch of raw) {
    if ('([{<'.includes(ch)) depth++
    else if (')]}>'.includes(ch)) depth--

    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current)

  return parts.map((part) => {
    const [head, ...defaultParts] = part.split('=')
    const [name, ...typeParts] = head.split(':')
    const defaultValue = defaultParts.join('=').trim()

    return {
      name: name.replace('?', '').trim(),
      type: typeParts.join(':').replace(/\s+/g, ' ').trim() || 'unknown',
      optional: head.includes('?') || defaultValue !== '',
      default: defaultValue || null,
    }
  })
}

/**
 * Bir modül dosyasından metotları çıkarır.
 *
 * İki biçim var: sınıf metotları (`list(...)`) ve alt-nesne okları
 * (`readonly revisions = { list: (...) => ... }`). İkisi de aynı şekilde
 * kullanıcıya metot gibi göründüğü için ikisini de topluyoruz.
 */
function parseModule(file) {
  const source = readFileSync(join(MODULES_DIR, file), 'utf8')
  const modules = []

  // `(?:(?!\*\/)[\s\S])*?` — blok kendi kapanışını yutmasın. Düz `[\s\S]*?`
  // ile motor dosyanın ilk `/**`'ından başlayıp araya giren tüm kodu içine
  // alıyor ve yanlış açıklamayı sınıfa bağlıyordu.
  const DOC = String.raw`(\/\*\*(?:(?!\*\/)[\s\S])*?\*\/)?\s*`
  const classRe = new RegExp(DOC + String.raw`export class (\w+) extends BaseModule \{`, 'g')
  let classMatch

  while ((classMatch = classRe.exec(source))) {
    const [, doc, className] = classMatch
    const start = classMatch.index + classMatch[0].length
    const nextClass = classRe.lastIndex
    const end = source.indexOf('\nexport class ', nextClass)
    const body = source.slice(start, end === -1 ? source.length : end)

    const methods = []
    let group = null

    // Satır satır gezip her metot/ok tanımından önceki JSDoc'u eşliyoruz.
    const memberRe = new RegExp(
      DOC +
        String.raw`(?:readonly (\w+) = \{|(\w+)\s*(?:\(([^)]*)\)|:\s*(?:async\s*)?\(([^)]*)\))\s*(?::\s*([^{=]*?))?\s*[={])`,
      'g'
    )
    let member

    while ((member = memberRe.exec(body))) {
      const [, doc, groupName, methodName, paramsA, paramsB, returns] = member

      if (groupName) {
        group = { name: groupName, ...cleanDoc(doc) }
        continue
      }
      if (!methodName) continue

      const params = parseParams(paramsA ?? paramsB ?? '')

      // Metot gövdesini bul: sonraki 800 karakter içindeki ilk çağrı yeterli.
      const tail = body.slice(member.index, member.index + 900)
      const call = /this\.client\.(get|post|put|patch|delete|raw|upload)\s*[<(]/.exec(tail)
      const pathMatch = /['"`](\/api\/[^'"`]*)['"`]/.exec(tail)

      if (!call || !pathMatch) continue

      // `raw` gövdeyi ham döndüren bir GET, `upload` çok parçalı bir POST.
      const verb = { raw: 'get', upload: 'post' }[call[1]] ?? call[1]
      const route = lookup(verb, pathMatch[1])

      methods.push({
        name: group ? `${group.name}.${methodName}` : methodName,
        group: group?.name ?? null,
        params,
        returns: (returns ?? '').replace(/\s+/g, ' ').trim() || null,
        method: verb.toUpperCase(),
        path: pathMatch[1],
        specPath: route?.path ?? null,
        auth: route?.auth ?? [],
        moduleGate: route?.moduleGate ?? null,
        throttle: route?.throttle ?? null,
        status: route?.status ?? 'unknown',
        ...cleanDoc(doc),
      })
    }

    modules.push({ class: className, file, ...cleanDoc(doc), methods })
  }

  return modules
}

const modules = readdirSync(MODULES_DIR)
  .filter((f) => f.endsWith('.ts') && f !== 'base.ts')
  .flatMap(parseModule)
  .filter((m) => m.methods.length > 0)

/**
 * Diğer dillerdeki gerçek metot adlarını (verb, yol) eşleşmesiyle bulur.
 *
 * JS'te alt-nesne olan şeyler (`revisions.restore`) PHP/Swift/Kotlin'de
 * düzleştirilmiş adla duruyor (`restoreRevision`). Bu eşleşmeyi ad
 * dönüştürerek tahmin etmek yanlış örnek üretir — dokümanda tahmine yer yok,
 * o yüzden adı kaynaktan okuyoruz.
 */
function methodNamesByPath(pkgDir, ext, declRe, callRe, resolvePath) {
  const map = new Map()
  const root = join(ROOT, 'packages', pkgDir)

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (['vendor', 'node_modules', '.build', 'build'].includes(entry.name)) continue
        walk(full)
        continue
      }
      if (!entry.name.endsWith(ext)) continue

      const text = readFileSync(full, 'utf8')

      // Bildirimlerin konumlarını topla; her metodun gövdesi bir sonraki
      // bildirime kadar sürer. Sabit karakter penceresi yerine bu sınır
      // kullanılıyor — uzun imzalar ve çok satırlı gövdeler kaçmasın.
      const decls = [...text.matchAll(declRe)].map((m) => ({ name: m.groups.name, at: m.index }))

      decls.forEach((decl, i) => {
        const body = text.slice(decl.at, decls[i + 1]?.at ?? text.length)
        const call = callRe.exec(body)
        callRe.lastIndex = 0
        if (!call) return

        const path = resolvePath(body, call)
        if (!path) return

        const verb = { raw: 'get', upload: 'post' }[call.groups.verb] ?? call.groups.verb
        map.set(`${verb.toUpperCase()} ${normalize(path)}`, decl.name)
      })
    }
  }

  walk(root)
  return map
}

/**
 * PHP yolu birleştirmeyle kurar: `'/api/x/' . $this->seg($id) . '/y'`.
 * Zinciri okuyup tek yola indirger; değişkenler tek segment yer tutucu olur.
 */
function resolvePhpPath(body, call) {
  let path = call.groups.path
  let i = call.index + call[0].length

  for (;;) {
    const dot = /^\s*\.\s*/.exec(body.slice(i))
    if (!dot) break
    i += dot[0].length

    const str = /^'([^']*)'/.exec(body.slice(i))
    if (str) {
      path += str[1]
      i += str[0].length
      continue
    }

    // Parantez dengesi izlenmeli: `$this->seg($code)` içindeki kapanış
    // parantezi ifadenin sonu değil.
    const start = i
    let depth = 0
    while (i < body.length) {
      const ch = body[i]
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

  return path
}

const PHP_NAMES = methodNamesByPath(
  'php',
  '.php',
  /function (?<name>\w+)\(/g,
  /client->(?<verb>get|post|put|patch|delete|raw|upload)\(\s*'(?<path>\/api\/[^']*)'/,
  resolvePhpPath
)

// Swift ve Kotlin dize araya-değer koyma kullanır; yol tek literalde kalır.
const SWIFT_NAMES = methodNamesByPath(
  'swift',
  '.swift',
  /func (?<name>\w+)\(/g,
  /client\.(?<verb>get|post|put|patch|delete|raw|upload)\(\s*"(?<path>\/api\/[^"]*)"/,
  (_, call) => call.groups.path
)
const KOTLIN_NAMES = methodNamesByPath(
  'kotlin',
  '.kt',
  /fun (?<name>\w+)\(/g,
  /client\.(?<verb>get|post|put|patch|delete|raw|upload)\(\s*"(?<path>\/api\/[^"]*)"/,
  (_, call) => call.groups.path
)

for (const m of modules) {
  for (const method of m.methods) {
    const key = `${method.method} ${normalize(method.path)}`
    method.names = {
      js: method.name,
      php: PHP_NAMES.get(key) ?? null,
      swift: SWIFT_NAMES.get(key) ?? null,
      kotlin: KOTLIN_NAMES.get(key) ?? null,
    }
  }
}

// Facade'deki isim (sdk.records) ↔ sınıf adı eşlemesi.
const facade = readFileSync(join(ROOT, 'packages/js/src/submitcms.ts'), 'utf8')
for (const m of modules) {
  const bind = new RegExp(`readonly (\\w+): ${m.class}\\b`).exec(facade)
  m.accessor = bind?.[1] ?? null
}

const unknown = modules.flatMap((m) => m.methods.filter((x) => x.status !== 'live'))
if (unknown.length) {
  console.error('Spec ile eşleşmeyen metotlar:')
  for (const u of unknown) console.error(`  ${u.method} ${u.path}`)
  process.exit(1)
}

const doc = {
  $comment:
    'SDK kaynağından üretildi (scripts/generate-reference.mjs). Elle düzenlemeyin — kaynak değişince yeniden üretin.',
  source: SPEC.source,
  counts: {
    modules: modules.length,
    methods: modules.reduce((n, m) => n + m.methods.length, 0),
    liveEndpoints: SPEC.counts.live,
  },
  packages: {
    js: { name: '@submitcms/sdk', install: 'npm i @submitcms/sdk', registry: 'npm' },
    php: { name: 'submitcms/sdk', install: 'composer require submitcms/sdk', registry: 'Packagist' },
    swift: { name: 'SubmitCMS', install: '.package(url: "https://github.com/Pariette-Inc/submit.sdk-swift", from: "1.0.0")', registry: 'SwiftPM' },
    kotlin: { name: 'com.submitcms:sdk', install: 'implementation("com.submitcms:sdk:1.0.0")', registry: 'Maven Central' },
  },
  modules: modules.sort((a, b) => (a.accessor ?? a.class).localeCompare(b.accessor ?? b.class)),
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n')
console.log(`${OUT} yazıldı — ${doc.counts.modules} modül / ${doc.counts.methods} metot`)
