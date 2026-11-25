// TELAS DE GESTÃO dos projetos (25/11/2026): o que existe por trás do site — painel, central, área do cliente.
// Gera, em public/midia/gestao/: <nome>-1280.webp (janela "Por trás") e <nome>-640.webp (celular).
//
// Fontes:
//   TRDD     painel rodando NO COMPUTADOR (node C:\dev\trdd-records\servidor-local.mjs → localhost:3710), com o acesso
//            de TESTE gravado pelo próprio servidor em dados-locais/ACESSO-LOCAL.txt. Nada de conta real nem dado de fã
//            real: o servidor local só tem conteúdo e cadastros de teste.
//   Matuura  páginas de demonstração da prévia pública (dados fictícios): Central, carteira do cliente, Cotação Expressa
//            e área do cliente.
// Uso (na pasta site/): node testes/capturar-gestao.mjs [trdd|matuura]
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const SAIDA = path.join(SITE, 'public/midia/gestao'); mkdirSync(SAIDA, { recursive: true })
const SO = process.argv[2]
const TRDD_LOCAL = 'http://localhost:3710', ACESSO = 'C:/dev/trdd-records/dados-locais/ACESSO-LOCAL.txt'
const MATUURA = 'https://matuura-prototipo.vercel.app'

const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' })
const oficina = await b.newPage()
async function gravar(nome, jpg) {
  const r = await oficina.evaluate(async (src) => {
    const i = new Image(); i.src = src; await i.decode()
    const out = {}
    for (const w of [1280, 640]) { const c = Object.assign(document.createElement('canvas'), { width: w, height: Math.round(i.height * w / i.width) }); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); out[w] = c.toDataURL('image/webp', 0.9) }
    return out
  }, 'data:image/jpeg;base64,' + jpg.toString('base64'))
  for (const w of [1280, 640]) writeFileSync(path.join(SAIDA, `${nome}-${w}.webp`), Buffer.from(r[w].split(',')[1], 'base64'))
  console.log('ok', nome)
}
const foto = (p) => p.screenshot({ type: 'jpeg', quality: 92 })

if (!SO || SO === 'trdd') {
  if (!existsSync(ACESSO)) throw new Error('Suba o painel local da TRDD antes (node C:\\dev\\trdd-records\\servidor-local.mjs).')
  const txt = readFileSync(ACESSO, 'utf8')
  const email = txt.match(/E-mail:\s*(\S+)/)[1], senha = txt.match(/Senha:\s*(\S+)/)[1]
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage()
  await p.goto(TRDD_LOCAL + '/admin.html', { waitUntil: 'networkidle' })
  await p.fill('#login-email', email); await p.fill('#login-senha', senha); await p.press('#login-senha', 'Enter')
  await p.waitForSelector('#abas button', { timeout: 20000 }); await p.waitForTimeout(1500)
  const aba = async (rotulo) => { await p.locator('#abas button', { hasText: rotulo }).first().click(); await p.waitForTimeout(1600) }
  for (const [nome, rotulo] of [['trdd-artistas', 'Artistas'], ['trdd-ordem', 'Ordem do site'], ['trdd-producao', 'Produção'], ['trdd-pedidos', 'Pedidos e fãs']]) { await aba(rotulo); await gravar(nome, await foto(p)) }
  await ctx.close()
}

if (!SO || SO === 'matuura') {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage()
  for (const [nome, rota] of [['matuura-central', '/central/'], ['matuura-carteira', '/central/cliente?c=c01'], ['matuura-cotacao', '/cotacao/'], ['matuura-area', '/area/']]) {
    await p.goto(MATUURA + rota, { waitUntil: 'networkidle' }); await p.waitForTimeout(2200)
    await gravar(nome, await foto(p))
  }
  await ctx.close()
}
await b.close()
