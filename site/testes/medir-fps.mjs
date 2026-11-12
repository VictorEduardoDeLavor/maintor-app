// Compara os QUADROS POR SEGUNDO do site publicado (a raiz do repositório, que é o que o GitHub Pages serve)
// com o build novo (site/dist), nas mesmas telas. Duas situações que imitam aparelho fraco:
//   · sem placa de vídeo (SwiftShader): tudo desenhado pela CPU — mede o peso do que é desenhado
//   · com placa de vídeo e CPU 6× mais lenta: mede o peso do JavaScript por quadro
// Uso (na pasta site/, depois de `npm run build`): node testes/medir-fps.mjs
//   --modos=1,2 (só essas situações, contando de 0)   --vezes=5 (repete e usa a mediana; a medida com CPU lenta oscila)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const TIPOS = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', json: 'application/json', hdr: 'application/octet-stream', woff2: 'font/woff2', mp4: 'video/mp4', md: 'text/markdown; charset=utf-8', ico: 'image/x-icon', txt: 'text/plain' }
const servir = (raiz, porta) => new Promise((ok) => {
  const s = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
    const arq = path.join(raiz, p); if (!arq.startsWith(raiz)) { res.writeHead(403); res.end(); return }
    try { const dados = await readFile(arq); res.writeHead(200, { 'content-type': TIPOS[path.extname(arq).slice(1)] || 'application/octet-stream' }); res.end(dados) } catch { res.writeHead(404); res.end() }
  }).listen(porta, '127.0.0.1', () => ok(s))
})
const VERSOES = [{ nome: 'publicado', raiz: path.resolve(SITE, '..'), porta: 4396 }, { nome: 'novo', raiz: path.join(SITE, 'dist'), porta: 4397 }]
for (const v of VERSOES) v.srv = await servir(v.raiz, v.porta)
// as mesmas três telas nas duas versões: abertura, uma obra em leitura e a entrada do saguão
const TELAS_DE_ROLAGEM = [['abertura', () => 0], ['obra em leitura (VOKE)', () => { const r = document.querySelector('#obra-voke').getBoundingClientRect(); return scrollY + r.top + r.height / 2 - innerHeight / 2 }], ['entrada da Ala 02', () => { const r = document.querySelector('#problemas').getBoundingClientRect(); return scrollY + r.top - innerHeight * 0.1 }]]
const MODOS = [
  { nome: 'sem placa de vídeo · celular 390×844', gl: 'swiftshader', cpu: 1, tela: { w: 390, h: 844, dsf: 2, celular: true }, espera: 22000, janela: 8000 },
  { nome: 'CPU 6× mais lenta · celular 390×844', gl: 'gpu', cpu: 6, tela: { w: 390, h: 844, dsf: 2, celular: true }, espera: 5000, janela: 4000 },
  { nome: 'CPU 6× mais lenta · computador 1440×900', gl: 'gpu', cpu: 6, tela: { w: 1440, h: 900, dsf: 1, celular: false }, espera: 5000, janela: 4000 },
]
const arg = (n, padrao = null) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : padrao }
const VEZES = Number(arg('vezes', 1)), mediana = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]
const linhas = []
for (const modo of MODOS.filter((_, i) => !arg('modos') || arg('modos').split(',').includes(String(i)))) {
  const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: modo.gl === 'gpu' ? ['--ignore-gpu-blocklist', '--use-angle=d3d11'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  for (const [tela, onde] of TELAS_DE_ROLAGEM) {
    const fps = {}, amostras = { publicado: [], novo: [] }
    for (let vez = 0; vez < VEZES; vez++) for (const v of VERSOES) {
      const ctx = await b.newContext({ viewport: { width: modo.tela.w, height: modo.tela.h }, deviceScaleFactor: modo.tela.dsf, isMobile: modo.tela.celular, hasTouch: modo.tela.celular })
      const p = await ctx.newPage()
      await p.goto(`http://127.0.0.1:${v.porta}/?qualidade=${modo.tela.celular ? 'media' : 'alta'}`, { waitUntil: 'networkidle', timeout: 120000 })
      await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 180000 })
      if (modo.cpu > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: modo.cpu }) }
      const y = await p.evaluate(onde); await p.evaluate((yy) => window.scrollTo(0, yy), y)
      await p.waitForTimeout(modo.espera)
      amostras[v.nome].push(await p.evaluate((ms) => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; const dt = performance.now() - t0; if (dt >= ms) ok(n / (dt / 1000)); else requestAnimationFrame(f) }; requestAnimationFrame(f) }), modo.janela))
      await ctx.close()
    }
    for (const k of Object.keys(amostras)) fps[k] = mediana(amostras[k])
    const variacao = (fps.novo / fps.publicado - 1) * 100
    linhas.push({ modo: modo.nome, tela, publicado: fps.publicado, novo: fps.novo, variacao })
    console.log(`${modo.nome} · ${tela}: publicado ${fps.publicado.toFixed(2)} → novo ${fps.novo.toFixed(2)} quadros/s (${variacao >= 0 ? '+' : ''}${variacao.toFixed(0)}%)`)
  }
  await b.close()
}
for (const v of VERSOES) v.srv.close()
console.log('\n| Situação | Tela | Publicado | Novo | Variação |\n|---|---|---|---|---|')
for (const l of linhas) console.log(`| ${l.modo} | ${l.tela} | ${l.publicado.toFixed(2)} | ${l.novo.toFixed(2)} | ${l.variacao >= 0 ? '+' : ''}${l.variacao.toFixed(0)}% |`)
