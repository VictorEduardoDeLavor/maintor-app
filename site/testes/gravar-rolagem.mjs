// Grava a ROLAGEM da home (vídeo .webm + tira de quadros), para conferir as transições entre alas.
// Uso (na pasta site/):
//   node testes/gravar-rolagem.mjs --rotulo=fase2 --ate=#problemas            → da abertura até o fim da Ala 01
//   node testes/gravar-rolagem.mjs --rotulo=fase3 --de=#problemas --ate=#sistemas --so=c390
// Saída: testes/limpeza/<rotulo>/rolagem-<tela>.webm e rolagem-<tela>-tira.jpg
import { mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const arg = (n, padrao = null) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : padrao }
const SAIDA = path.join(AQUI, 'limpeza', arg('rotulo', 'rolagem')); mkdirSync(SAIDA, { recursive: true })
const VEL = Number(arg('velocidade', 340)) // px por segundo
const QUADROS = Number(arg('quadros', 28))
const TELAS = [
  { id: 'c390', nome: '390×844', w: 390, h: 844, celular: true },
  { id: 'pc', nome: '1440×900', w: 1440, h: 900, celular: false },
].filter((t) => !arg('so') || arg('so').split(',').includes(t.id))

let BASE = process.env.BASE || arg('base'), servidor = null
if (!BASE) {
  const { createServer } = await import(pathToFileURL(path.join(SITE, 'node_modules/vite/dist/node/index.js')).href)
  servidor = await createServer({ root: SITE, configFile: path.join(SITE, 'vite.config.js'), logLevel: 'error', server: { port: 4394, host: '127.0.0.1' } })
  await servidor.listen(); BASE = servidor.resolvedUrls.local[0].replace(/\/$/, '')
}
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] })
const topo = (sel) => { let el = document.querySelector(sel), y = 0; if (!el) return null; for (; el; el = el.offsetParent) y += el.offsetTop; return y }

for (const tela of TELAS) {
  const tmp = path.join(SAIDA, `_video-${tela.id}`)
  const ctx = await b.newContext({ viewport: { width: tela.w, height: tela.h }, deviceScaleFactor: 1, isMobile: tela.celular, hasTouch: tela.celular, recordVideo: { dir: tmp, size: { width: tela.w, height: tela.h } } })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/?qualidade=${tela.celular ? 'media' : 'alta'}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 60000 })
  const de = arg('de') ? await p.evaluate(topo, arg('de')) : 0
  const ate = arg('ate') ? (await p.evaluate(topo, arg('ate'))) - tela.h * 0.25 : await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  await p.evaluate((y) => window.scrollTo(0, y), de); await p.waitForTimeout(2500)
  // rolagem em velocidade constante, um passo por quadro desenhado
  const dur = (ate - de) / VEL, fotos = []
  const inicio = Date.now()
  const rolando = p.evaluate(({ de, ate, dur }) => new Promise((ok) => { const t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0) / (dur * 1000)); window.scrollTo(0, de + (ate - de) * k); if (k < 1) requestAnimationFrame(f); else ok() }; requestAnimationFrame(f) }), { de, ate, dur })
  for (let i = 0; i < QUADROS; i++) {
    const quando = inicio + ((i + 0.5) / QUADROS) * dur * 1000
    await p.waitForTimeout(Math.max(0, quando - Date.now()))
    fotos.push({ img: (await p.screenshot({ type: 'jpeg', quality: 70 })).toString('base64'), y: await p.evaluate(() => Math.round(scrollY)) })
  }
  await rolando; await p.waitForTimeout(1500)
  const video = p.video(); await ctx.close()
  const destino = path.join(SAIDA, `rolagem-${tela.id}.webm`); renameSync(await video.path(), destino); rmSync(tmp, { recursive: true, force: true })
  // a tira de quadros (para conferir sem abrir o vídeo)
  const lw = tela.celular ? 190 : 400, lh = Math.round(tela.h * lw / tela.w)
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:20px;background:#0b1616;color:#9fb1ad;font:11px Arial;width:max-content"><div style="display:grid;grid-template-columns:repeat(${tela.celular ? 14 : 7},${lw}px);gap:10px 8px">${fotos.map((f) => `<figure style="margin:0"><img src="data:image/jpeg;base64,${f.img}" width="${lw}" height="${lh}" style="display:block;border-radius:6px"><figcaption>${f.y}px</figcaption></figure>`).join('')}</div></body>`
  const arq = path.join(SAIDA, `rolagem-${tela.id}-tira.html`); writeFileSync(arq, html)
  const pg = await b.newPage({ viewport: { width: 1200, height: 800 } })
  await pg.goto(pathToFileURL(arq).href); await pg.waitForLoadState('networkidle')
  await pg.screenshot({ path: path.join(SAIDA, `rolagem-${tela.id}-tira.jpg`), type: 'jpeg', quality: 80, fullPage: true }); await pg.close(); rmSync(arq)
  console.log(`${tela.nome}: ${Math.round(dur)} s de rolagem (${Math.round(ate - de)} px) → ${destino}`)
}
await b.close(); await servidor?.close()
