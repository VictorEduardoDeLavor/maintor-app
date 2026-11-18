/* PUBLICAR (18/11/2026) — copia site/dist para a pasta do ramo `gh-pages`, que é o ÚNICO que o GitHub Pages serve.
 *
 * Por que mudou: antes o build era copiado para a raiz do `main` e o Pages servia o repositório inteiro, então a
 * pasta de trabalho `site/` (fontes, testes, diários) respondia em maintorflow.com.br/site/... Agora o `main`
 * guarda só o código e o `gh-pages` guarda só o que vai ao ar.
 *
 * Uso (sempre nesta ordem):
 *   npm run build                      → build com prerender
 *   (aceites contra o preview em :4175)
 *   npm run publicar                   → este arquivo: travas + cópia para a pasta do ramo + resumo do que mudou
 *   git -C ../../maintor-app-publicado add -A
 *   git -C ../../maintor-app-publicado commit -m "deploy: … (build de <hash do main>)"
 *   git -C ../../maintor-app-publicado push origin gh-pages      → só com o "pode publicar" do Victor
 *
 * A pasta do ramo é uma árvore de trabalho do git (worktree) ao lado do repositório: C:\dev\maintor-app-publicado.
 * Se ela não existir (máquina nova), o script cria.
 */
import { cpSync, rmSync, readdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const aqui = dirname(fileURLToPath(import.meta.url))
const dist = join(aqui, 'dist')
const repo = resolve(aqui, '..')
const destino = resolve(repo, '..', 'maintor-app-publicado')
const RAMO = 'gh-pages', DOMINIO = 'maintorflow.com.br'
const git = (onde, ...args) => execFileSync('git', ['-C', onde, ...args], { encoding: 'utf8' }).trim()
const sair = (msg) => { console.error('\nPARADO: ' + msg + '\n'); process.exit(1) }

if (!existsSync(join(dist, 'index.html'))) sair('site/dist não existe. Rode `npm run build` antes.')
if (!readFileSync(join(dist, 'index.html'), 'utf8').includes('id="obra-')) sair('o dist está sem o prerender (use `npm run build`, nunca só `vite build`).')

/* TRAVAS DE CONTEÚDO — rodam aqui para ninguém depender de lembrar.
   1. o nome da plataforma dos apps só pode aparecer nos dois endereços dos apps e na função de captação;
   2. nenhum endereço provisório de cliente;
   3. nada de arquivo de trabalho (nome começando com "_") dentro do que vai ao ar. */
const TEXTO = /\.(html|js|css|json|md|txt|xml|svg|webmanifest)$/i
const LIBERADO = /^https:\/\/maintor-(rh|task)\.base44\.app$|\/functions\/captarLead$/
const problemas = []
;(function varrer(pasta) {
  for (const nome of readdirSync(pasta)) {
    const arq = join(pasta, nome), rel = arq.slice(dist.length + 1).split(sep).join('/')
    if (statSync(arq).isDirectory()) { varrer(arq); continue }
    if (nome.startsWith('_')) problemas.push(`arquivo de trabalho no build: ${rel}`)
    if (!TEXTO.test(nome)) continue
    const t = readFileSync(arq, 'utf8')
    for (const m of t.match(/[a-z0-9./:-]*base44[a-z0-9./-]*/gi) || []) if (!LIBERADO.test(m)) problemas.push(`plataforma citada em ${rel}: ${m}`)
    if (/higgsfield/i.test(t)) problemas.push(`endereço provisório em ${rel}`)
  }
})(dist)
if (problemas.length) sair('as travas de conteúdo pegaram:\n  - ' + [...new Set(problemas)].slice(0, 20).join('\n  - '))

/* a pasta do ramo */
if (!existsSync(join(destino, '.git'))) {
  git(repo, 'fetch', 'origin', RAMO)
  try { git(repo, 'worktree', 'add', destino, RAMO) } catch { git(repo, 'worktree', 'add', '--track', '-b', RAMO, destino, 'origin/' + RAMO) }
  console.log('Pasta do ramo criada em ' + destino)
}
if (git(destino, 'branch', '--show-current') !== RAMO) sair(`${destino} não está no ramo ${RAMO}.`)
try { git(destino, 'pull', '--ff-only', 'origin', RAMO) } catch { /* ramo ainda sem remoto, ou sem rede: segue com o local */ }

/* troca o conteúdo: sai tudo menos o .git, entra o build */
for (const item of readdirSync(destino)) if (item !== '.git') rmSync(join(destino, item), { recursive: true, force: true })
for (const item of readdirSync(dist)) cpSync(join(dist, item), join(destino, item), { recursive: true })
cpSync(join(dist, 'index.html'), join(destino, '404.html')) // rota desconhecida cai na home (GitHub Pages)
writeFileSync(join(destino, 'CNAME'), DOMINIO)               // sem isto o domínio próprio cai
writeFileSync(join(destino, '.nojekyll'), '')                // sem isto o Pages ignora pastas com "_"

const mudou = git(destino, 'status', '--short').split('\n').filter(Boolean)
console.log(`\nBuild copiado para ${destino} (ramo ${RAMO}). Travas de conteúdo: ok.`)
console.log(mudou.length ? `${mudou.length} arquivo(s) mudam:\n` + mudou.slice(0, 40).join('\n') + (mudou.length > 40 ? `\n… e mais ${mudou.length - 40}` : '') : 'Nada mudou em relação ao que já está no ramo.')
console.log(`\nBuild de: ${git(repo, 'rev-parse', '--short', 'HEAD')}. Falta: add -A, commit "deploy: … (build de <hash>)" e push origin ${RAMO} (só com o "pode publicar").`)
