// Aceite do SAGUÃO DAS 7 PORTAS (11/11/2026, limpeza visual — Fase 3): toque em cada porta no celular.
//   · cada botão da lista abre a sala certa, com o objetivo e o WhatsApp com o assunto da porta
//   · sai da sala pelo botão "Voltar ao saguão" e pela tecla Esc; as setas trocam de porta
//   · no "palco" das portas (depois do título), tocar numa porta em 3D abre a sala dela
//   · no computador, clicar em cada uma das sete portas em 3D abre a sala dela
// Uso (na pasta site/): node testes/aceite-portas.mjs      (ou BASE=http://localhost:4175 para rodar contra o build)
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'
import { PORTAS, msgWhats } from '../src/obras.js'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const R = []; let falhas = 0
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++ }

let BASE = process.env.BASE, servidor = null
if (!BASE) {
  const { createServer } = await import(pathToFileURL(path.join(SITE, 'node_modules/vite/dist/node/index.js')).href)
  servidor = await createServer({ root: SITE, configFile: path.join(SITE, 'vite.config.js'), logLevel: 'error', server: { port: 4395, host: '127.0.0.1' } })
  await servidor.listen(); BASE = servidor.resolvedUrls.local[0].replace(/\/$/, '')
}
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] })

async function abrir(tela) {
  const ctx = await b.newContext({ viewport: { width: tela.w, height: tela.h }, deviceScaleFactor: 1, isMobile: tela.celular, hasTouch: tela.celular })
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message))
  await p.goto(`${BASE}/?qualidade=${tela.celular ? 'media' : 'alta'}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 60000 })
  return { ctx, p, erros }
}
const salaAberta = (p) => p.evaluate(() => document.querySelector('aside.sala-painel')?.getAttribute('aria-label') || null)
const esperarSala = async (p, k) => { await p.waitForFunction((r) => document.querySelector('aside.sala-painel')?.getAttribute('aria-label')?.startsWith(r), `Porta ${k + 1}:`, { timeout: 6000 }).catch(() => {}); await p.waitForTimeout(700); return salaAberta(p) }
// depois de sair, a cortina leva ~1,1 s para devolver o corredor (cliques no 3D são ignorados enquanto ela fecha e abre)
const esperarFechar = async (p) => { await p.waitForFunction(() => !document.querySelector('aside.sala-painel'), null, { timeout: 6000 }).catch(() => {}); await p.waitForTimeout(2000); return (await salaAberta(p)) === null }
// rola até a lista (topo dela a 20% da tela) ou até o palco das portas (a base do bloco 20% acima do topo da tela)
const irPara = (p, onde) => p.evaluate((onde) => {
  const y = (el) => { let s = 0; for (let e = el; e; e = e.offsetParent) s += e.offsetTop; return s }
  const lista = document.querySelector('#problemas .portas-lista')
  window.scrollTo(0, onde === 'lista' ? y(lista) - innerHeight * 0.2 : y(lista) + lista.offsetHeight + innerHeight * 0.2)
}, onde)
const portasDePe = (p) => p.waitForFunction(() => { const e = window.__expoSonda?.(); return e && e.portas3d.every((x) => x.g.visible && x.g.position.y > -0.05) }, null, { timeout: 15000 }).then(() => true).catch(() => false)
// centro de cada porta na tela (a foto do vão), só as que cabem inteiras o bastante para tocar
const centros = (p) => p.evaluate(() => {
  const e = window.__expoSonda(), v = new e.T.Vector3(); e.cam.updateMatrixWorld()
  const topo = document.querySelector('header').getBoundingClientRect().bottom
  return e.portas3d.map((x, k) => { x.vao.getWorldPosition(v); v.project(e.cam); return { k, x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight } }).filter((c) => c.x > 24 && c.x < innerWidth - 24 && c.y > topo + 20 && c.y < innerHeight - 24)
})

// ---------- celular ----------
{
  const { ctx, p, erros } = await abrir({ w: 390, h: 844, celular: true })
  await irPara(p, 'lista'); await p.waitForTimeout(3500)
  ok((await p.locator('#problemas .portas-lista .porta-btn').count()) === 7, 'celular: a lista tem 7 botões')
  const caixas = await p.evaluate(() => [...document.querySelectorAll('#problemas .portas-lista .porta-btn')].map((el) => { const r = el.getBoundingClientRect(); return { h: r.height, dentro: r.left >= 0 && r.right <= innerWidth } }))
  ok(caixas.every((c) => c.h >= 44 && c.dentro), `celular: os 7 botões têm toque ≥ 44 px e cabem na largura (menor altura ${Math.min(...caixas.map((c) => c.h)).toFixed(0)} px)`)
  for (let k = 0; k < 7; k++) {
    const pt = PORTAS[k]
    await irPara(p, 'lista'); await p.waitForTimeout(900)
    await p.locator('#problemas .portas-lista .porta-btn').nth(k).tap()
    const rotulo = await esperarSala(p, k)
    ok(rotulo === `Porta ${k + 1}: ${pt.objetivo}`, `celular · lista: o botão ${k + 1} abre a sala "${pt.objetivo}" (${rotulo})`)
    const d = await p.evaluate(() => ({ micro: document.querySelector('.sala-painel .micro')?.innerText || '', frase: document.querySelector('.sala-painel h2')?.innerText || '', whats: document.querySelector('.sala-painel a.btn')?.href || '', oculto: document.documentElement.classList.contains('em-sala') }))
    ok(d.micro.toUpperCase().includes(`PORTA 0${k + 1} DE 07`) && d.frase.includes(pt.frase.slice(0, 20)), `celular · sala ${k + 1}: mostra "Porta 0${k + 1} de 07" e a frase da porta`)
    ok(decodeURIComponent(d.whats).includes(msgWhats(pt.assunto)), `celular · sala ${k + 1}: o WhatsApp leva o assunto "${pt.assunto}"`)
    ok(d.oculto, `celular · sala ${k + 1}: o texto do corredor some enquanto se está na sala`)
    if (k % 2 === 0) await p.locator('.sala-voltar').tap(); else await p.keyboard.press('Escape')
    ok(await esperarFechar(p), `celular · sala ${k + 1}: sai ${k % 2 === 0 ? 'pelo botão "Voltar ao saguão"' : 'pela tecla Esc'}`)
  }
  // setas e botões de trocar de porta
  await irPara(p, 'lista'); await p.waitForTimeout(900)
  await p.locator('#problemas .portas-lista .porta-btn').nth(0).tap(); await esperarSala(p, 0)
  await p.keyboard.press('ArrowRight'); ok((await esperarSala(p, 1))?.startsWith('Porta 2:'), 'celular · sala: seta → passa para a porta 2')
  await p.locator('.sala-nav .guia-seta[aria-label="Próxima porta"]').tap(); ok((await esperarSala(p, 2))?.startsWith('Porta 3:'), 'celular · sala: botão › passa para a porta 3')
  await p.keyboard.press('ArrowLeft'); ok((await esperarSala(p, 1))?.startsWith('Porta 2:'), 'celular · sala: seta ← volta para a porta 2')
  await p.locator('.sala-nav .guia-seta[aria-label="Porta anterior"]').tap(); ok((await esperarSala(p, 0))?.startsWith('Porta 1:'), 'celular · sala: botão ‹ volta para a porta 1')
  await p.keyboard.press('Escape'); ok(await esperarFechar(p), 'celular · sala: Esc volta ao saguão')
  // o palco das portas: tocar numa porta em 3D
  await irPara(p, 'palco'); ok(await portasDePe(p), 'celular · palco: as 7 portas ficam de pé depois que o título e a lista saem'); await p.waitForTimeout(1500)
  const texto = await p.evaluate(() => { const lista = document.querySelector('#problemas .portas-lista').getBoundingClientRect(); return lista.bottom })
  ok(texto < 0, `celular · palco: nenhum texto da cabeça na tela enquanto as portas estão de pé (base da lista em ${Math.round(texto)} px)`)
  const cs = await centros(p)
  ok(cs.length >= 3, `celular · palco: ${cs.length} portas ao alcance do toque (${cs.map((c) => c.k + 1).join(', ')})`)
  for (const { k } of cs) {
    const c = (await centros(p)).find((x) => x.k === k); if (!c) { ok(false, `celular · palco: a porta ${k + 1} saiu do alcance`); continue }
    await p.touchscreen.tap(c.x, c.y)
    const rotulo = await esperarSala(p, c.k)
    ok(rotulo === `Porta ${c.k + 1}: ${PORTAS[c.k].objetivo}`, `celular · palco: tocar na porta ${c.k + 1} em 3D abre a sala "${PORTAS[c.k].objetivo}" (${rotulo})`)
    await p.keyboard.press('Escape'); await esperarFechar(p)
  }
  ok(erros.length === 0, `celular: sem erro de JavaScript (${erros.join(' | ')})`)
  await ctx.close()
}
// ---------- computador ----------
{
  const { ctx, p, erros } = await abrir({ w: 1440, h: 900, celular: false })
  await irPara(p, 'palco'); ok(await portasDePe(p), 'computador · palco: as 7 portas ficam de pé'); await p.waitForTimeout(1500)
  const cs = await centros(p)
  ok(cs.length === 7, `computador · palco: as 7 portas aparecem na tela (${cs.length})`)
  for (const { k } of cs) {
    const c = (await centros(p)).find((x) => x.k === k); if (!c) { ok(false, `computador · palco: a porta ${k + 1} saiu da tela`); continue }
    await p.mouse.click(c.x, c.y)
    const rotulo = await esperarSala(p, c.k)
    ok(rotulo === `Porta ${c.k + 1}: ${PORTAS[c.k].objetivo}`, `computador · palco: clicar na porta ${c.k + 1} abre a sala "${PORTAS[c.k].objetivo}" (${rotulo})`)
    await p.keyboard.press('Escape'); await esperarFechar(p)
  }
  await irPara(p, 'lista'); await p.waitForTimeout(2500)
  await p.locator('#problemas .portas-lista .porta-btn').nth(3).click()
  ok((await esperarSala(p, 3))?.startsWith('Porta 4:'), 'computador · lista: o botão 4 abre a sala da porta 4')
  await p.keyboard.press('Escape'); ok(await esperarFechar(p), 'computador · sala: Esc volta ao saguão')
  ok(erros.length === 0, `computador: sem erro de JavaScript (${erros.join(' | ')})`)
  await ctx.close()
}
await b.close(); await servidor?.close()
console.log(R.join('\n')); console.log(`\nRESUMO: ${R.length - falhas} ok · ${falhas} falhas`)
process.exit(falhas ? 1 : 0)
