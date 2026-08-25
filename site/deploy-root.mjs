/* Copia site/dist para a raiz do repo (onde o GitHub Pages serve),
   preservando CNAME, .nojekyll e a pasta do próprio site/.
   Uso: npm run build && npm run deploy:root  */
import { cpSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const dist = join(aqui, 'dist')
const raiz = join(aqui, '..')

if (!existsSync(dist)) {
  console.error('site/dist não existe — rode `npm run build` antes.')
  process.exit(1)
}

const PRESERVAR = new Set(['.git', '.nojekyll', 'CNAME', 'site', 'README.md'])

// limpa a raiz (só o que é build antigo)
for (const item of readdirSync(raiz)) {
  if (PRESERVAR.has(item)) continue
  rmSync(join(raiz, item), { recursive: true, force: true })
}

// copia o build novo
for (const item of readdirSync(dist)) {
  cpSync(join(dist, item), join(raiz, item), { recursive: true })
}

console.log('Build copiado para a raiz do repo. Confira com git status.')
