import { defineConfig } from 'tsup'

export default defineConfig({
  // Tek entry: modüller `sdk.records`, `sdk.delivery` gibi facade üzerinden
  // erişilir. Alt yol (subpath) export'ları CJS'te ortak kodu her entry'ye
  // kopyaladığı için tercih edilmedi.
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
})
