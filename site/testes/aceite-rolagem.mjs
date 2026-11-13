// Aceite das TELAS QUE ROLAM (12/11/2026). Os quadros com data-rolagem mostram o site ou o sistema andando:
//   1. toda obra com rolagem tem as 4 imagens servidas (-720, -1280, -r960, -r640)
//   2. celular e computador: quadro em leitura troca para a faixa e ela ANDA (modo página e modo telas)
//   3. modo telas: cada parada cai no topo de uma tela (o passo bate com a pilha montada pelo capturar-rolagem)
//   4. memória: no máximo 2 faixas carregadas por vez; de volta ao topo, nenhuma
//   5. computador: o quadro em pé (Caminho 2) cabe na altura, entre o cabeçalho e a barra do guia
//   6. computador: nenhuma legenda em foco começa atrás do cabeçalho nem termina atrás da barra do guia
//   7. nenhum erro de página
// Uso (na pasta site/): node testes/aceite-rolagem.mjs      (ou BASE=http://localhost:4175 contra o build)
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const R = []; let falhas = 0
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++ }
let BASE = process.env.BASE, servidor = null
if (!BASE) {
  const { createServer } = await import(pathToFileURL(path.join(SITE, 'node_modules/vite/dist/node/index.js')).href)
  servidor = await createServer({ root: SITE, configFile: path.join(SITE, 'vite.config.js'), logLevel: 'error', server: { port: 4390, host: '127.0.0.1' } })
  await servidor.listen(); BASE = servidor.resolvedUrls.local[0].replace(/\/$/, '')
}
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] })
const CEL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
const PC = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
const AMOSTRA = ['voke', 'techtrainer', 'p-manut', 's-revender', 'm-trafego'] // página, telas (site), telas (sistema), em pé, página curta
const centrar = (p, id) => p.evaluate((s) => { const el = document.getElementById(s); let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; window.scrollTo(0, y + el.offsetHeight / 2 - innerHeight / 2) }, 'obra-' + id)
const estado = (p, id) => p.evaluate((id) => {
  const o = window.__expoSonda().obras.find((x) => x.el.id === 'obra-' + id), r = o.rol
  return { f: o.fs, tex: !!r.tex, faixa: !!r.tex && o.tela.material.map === r.tex, janela: r.janela, off: r.tex ? r.tex.offset.y : null, modo: r.modo, n: r.n }
}, id)
const vivas = (p) => p.evaluate(() => window.__expoSonda().obras.filter((o) => o.rol?.tex).length)

for (const [nome, opts] of [['celular', CEL], ['computador', PC]]) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const erros = []
  p.on('pageerror', (e) => erros.push(e.message))
  await p.goto(`${BASE}/?qualidade=${opts.isMobile ? 'media' : 'alta'}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 60000 })

  if (nome === 'celular') {
    // 1. arquivos
    const faltam = await p.evaluate(async () => {
      const bases = [...new Set([...document.querySelectorAll('article.obra[data-rolagem]')].map((a) => a.dataset.rolagem))], f = []
      for (const base of bases) for (const suf of ['-720.webp', '-1280.webp', '-r960.webp', '-r640.webp']) { const r = await fetch(base + suf, { method: 'HEAD' }); if (!r.ok) f.push(base + suf) }
      return { bases: bases.length, f }
    })
    ok(faltam.f.length === 0 && faltam.bases >= 15, `1. ${faltam.bases} faixas com as 4 imagens servidas${faltam.f.length ? ' — faltam: ' + faltam.f.join(', ') : ''}`)
  }

  let maxVivas = 0
  for (const id of AMOSTRA) {
    await centrar(p, id)
    const am = []
    for (let k = 0; k < 13; k++) { await p.waitForTimeout(700); am.push(await estado(p, id)); maxVivas = Math.max(maxVivas, await vivas(p)) }
    const fim = am.at(-1), offs = am.map((a) => a.off).filter((x) => x !== null)
    const anda = offs.length > 4 && Math.max(...offs) - Math.min(...offs) > 0.02
    const dentro = offs.every((o) => o >= -0.001 && o <= 1 - fim.janela + 0.001)
    ok(fim.faixa && anda && dentro, `2. ${nome} · ${id} (${fim.modo}): faixa no quadro, andou ${offs.length ? (Math.max(...offs) - Math.min(...offs)).toFixed(2) : '—'} e ficou dentro da faixa`)
    if (fim.modo === 'telas' && fim.n > 1) {
      // nas paradas (offset repetido entre duas amostras), o offset é o topo de uma das telas
      const paradas = offs.filter((o, i) => i > 0 && Math.abs(o - offs[i - 1]) < 0.0005)
      const topos = Array.from({ length: fim.n }, (_, k) => (1 - fim.janela) * (1 - k / (fim.n - 1)))
      const casam = paradas.length > 0 && paradas.every((o) => topos.some((t) => Math.abs(o - t) < 0.004))
      ok(casam, `3. ${nome} · ${id}: ${paradas.length} paradas, todas no topo de uma tela`)
    }
  }
  ok(maxVivas <= 2, `4. ${nome}: no máximo ${maxVivas} faixa(s) na memória ao mesmo tempo (limite 2)`)
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(3500)
  const noTopo = await vivas(p)
  ok(noTopo === 0, `4. ${nome}: de volta ao topo, ${noTopo} faixa(s) carregada(s)`)

  if (nome === 'computador') {
    // 5. o quadro em pé cabe na altura (projeta a tela 3D na janela)
    await centrar(p, 's-revender'); await p.waitForTimeout(4500)
    const q = await p.evaluate(() => {
      const s = window.__expoSonda(), o = s.obras.find((x) => x.el.id === 'obra-s-revender')
      const caixa = new s.T.Box3().setFromObject(o.tela), v = new s.T.Vector3(), ys = []
      for (const x of [caixa.min.x, caixa.max.x]) for (const y of [caixa.min.y, caixa.max.y]) for (const z of [caixa.min.z, caixa.max.z]) { v.set(x, y, z).project(s.cam); ys.push((1 - v.y) / 2 * innerHeight) }
      const cab = document.querySelector('header')?.getBoundingClientRect().bottom ?? 70, guia = document.querySelector('.guia')?.getBoundingClientRect().top ?? innerHeight
      return { topo: Math.min(...ys), fim: Math.max(...ys), cab, guia }
    })
    ok(q.topo >= q.cab - 2 && q.fim <= q.guia + 2, `5. computador · quadro em pé: ${Math.round(q.topo)}..${Math.round(q.fim)} px, entre o cabeçalho (${Math.round(q.cab)}) e o guia (${Math.round(q.guia)})`)
    // 6. legendas em foco fora do cabeçalho e da barra do guia
    const ids = await p.evaluate(() => [...document.querySelectorAll('article.obra')].map((a) => a.id.replace('obra-', '')))
    const ruins = []
    for (const id of ids) {
      await centrar(p, id); await p.waitForTimeout(300)
      const m = await p.evaluate((s) => { const l = document.getElementById(s).querySelector('.obra-legenda').getBoundingClientRect(); return { t: l.top, b: l.bottom, cab: document.querySelector('header')?.getBoundingClientRect().bottom ?? 70, guia: document.querySelector('.guia')?.getBoundingClientRect().top ?? innerHeight } }, 'obra-' + id)
      if (m.t < m.cab + 4 || m.b > m.guia - 4) ruins.push(`${id} ${Math.round(m.t)}..${Math.round(m.b)}`)
    }
    ok(ruins.length === 0, `6. computador: ${ids.length} legendas entre o cabeçalho e o guia${ruins.length ? ' — fora: ' + ruins.join(', ') : ''}`)
  }
  ok(erros.length === 0, `7. ${nome}: nenhum erro de página${erros.length ? ' — ' + erros.join(' | ') : ''}`)
  await ctx.close()
}
await b.close(); await servidor?.close()
console.log(R.join('\n') + `\n\n${falhas ? falhas + ' FALHA(S)' : 'tudo OK'} · ${R.length} verificações`)
process.exit(falhas ? 1 : 0)
