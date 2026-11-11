// Aceite da LIMPEZA VISUAL da exposição 3D (11/11/2026) — "uma coisa por vez": texto HTML nunca
// disputa a tela com o 3D (logo, letreiro, placas das portas, quadros, boneco).
//
// Mede 11 telas (abertura; cabeça da Ala 01; grupos 1 e 2; entrada da Ala 02; lista das portas;
// cabeças das Alas 03 e 04; Como trabalhamos; Perguntas; Contato) em 390×844, 360×740 e 1440×900.
// Cada tela é fotografada em duas posições de rolagem: LEITURA (o bloco na zona de leitura) e
// TRANSIÇÃO (o título entrando, com o 3D da ala anterior ainda na tela).
//
//   1. FUNDO CALMO  o texto é escondido, a tela é fotografada e, atrás de cada bloco, mede-se o
//                   desvio-padrão da luminância e a densidade de bordas. O limite vem de uma tela
//                   que lê bem: a legenda de uma obra em painel de vidro (VOKE), medida na hora.
//   2. CONTRASTE    cor do texto contra o ponto mais claro (ou mais escuro) do fundo real ≥ 4,5:1.
//   3. SEM COLISÃO  raios lançados da câmera pelos pixels de cada bloco: se o primeiro objeto
//                   atingido é o boneco ou um texto 3D (logo, letreiro, totem, placa, quadro), falha.
//   4. GUIA         a barra não aparece sem obra em foco e não cruza botão nem link.
//   5. RÉGUA        nenhuma régua de seção com mais de uma linha.
//   6. ABERTURA     os dois botões principais inteiros dentro de 390×700.
//
// Uso (na pasta site/):
//   node testes/aceite-limpeza.mjs                    → roda tudo, grava em testes/limpeza/antes/
//   node testes/aceite-limpeza.mjs --rotulo=depois    → outra pasta (para comparar)
//   node testes/aceite-limpeza.mjs --so=c390 --pontos=abertura,ala02   → só um recorte
//   BASE=http://localhost:4175 node testes/aceite-limpeza.mjs          → contra um servidor já no ar
//
// Sem BASE, o teste sobe o Vite sozinho e injeta a SONDA (os retângulos do 3D, só para robôs) no
// módulo da exposição em tempo de teste — o arquivo em disco não muda. Quando a sonda estiver no
// próprio Exposicao.jsx (window.__expoSonda), a injeção é pulada e o teste roda também contra o build.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(AQUI, '..')
const arg = (n, padrao = null) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : padrao }
const ROTULO = arg('rotulo', 'antes')
const SAIDA = path.join(AQUI, 'limpeza', ROTULO)
const CONSULTA = arg('consulta', '') // parâmetros extras na URL (ex.: --consulta=selo=1), para fotografar opções
let GL = arg('gl', 'gpu') // gpu (placa de vídeo real, ~100× mais rápido) | swiftshader (sem placa de vídeo); sem WebGL na gpu, cai para swiftshader

const TELAS = [
  { id: 'c390', nome: '390×844', w: 390, h: 844, dsf: 2, celular: true },
  { id: 'c360', nome: '360×740', w: 360, h: 740, dsf: 2, celular: true },
  { id: 'pc', nome: '1440×900', w: 1440, h: 900, dsf: 1, celular: false },
].filter((t) => !arg('so') || arg('so').split(',').includes(t.id))

// âncora = primeiro elemento do bloco; leitura/transicao = a que fração da altura da tela fica o topo dele
const PONTOS = [
  { id: 'abertura', nome: 'Abertura', topo: true },
  { id: 'ala01', nome: 'Cabeça da Ala 01', ancora: '#trabalhos .regua', secao: 'trabalhos', leitura: 0.16, transicao: 0.58 },
  { id: 'grupo1', nome: 'Grupo 1 · Projetos para clientes', ancora: '#projetos-clientes .grupo-painel', leitura: 0.36, transicao: 0.66 },
  { id: 'grupo2', nome: 'Grupo 2 · Produtos da Maintor', ancora: '#produtos-maintor .grupo-painel', leitura: 0.36, transicao: 0.66 },
  { id: 'ala02', nome: 'Entrada da Ala 02', ancora: '#problemas .regua', secao: 'problemas', leitura: 0.16, transicao: 0.58 },
  { id: 'portas', nome: 'Lista das 7 portas', ancora: '#problemas .portas-lista', leitura: 0.2 },
  { id: 'ala03', nome: 'Cabeça da Ala 03', ancora: '#sistemas .regua', secao: 'sistemas', leitura: 0.16, transicao: 0.58 },
  { id: 'ala04', nome: 'Cabeça da Ala 04', ancora: '#marketing .regua', secao: 'marketing', leitura: 0.16, transicao: 0.58 },
  { id: 'como', nome: 'Como trabalhamos', ancora: '#como .regua', secao: 'como', leitura: 0.16, transicao: 0.58 },
  { id: 'perguntas', nome: 'Perguntas frequentes', ancora: '#perguntas .regua', secao: 'perguntas', leitura: 0.16, transicao: 0.58 },
  { id: 'contato', nome: 'Contato', ancora: '#contato .regua', secao: 'contato', leitura: 0.16, transicao: 0.58 },
].filter((p) => !arg('pontos') || arg('pontos').split(',').includes(p.id))
const REFERENCIA = '#obra-voke' // a tela que hoje lê bem: legenda de obra em painel de vidro

// limites: a referência com folga, e um piso (um degradê escuro e desfocado também é fundo calmo)
const LIM = { contraste: 4.5, borda: 10, desvioFator: 1.5, desvioPiso: 7, bordasFator: 1.5, bordasPiso: 0.012, nevoa: 0.2 }
const NOME = { 1: 'Fundo calmo', 2: 'Contraste', 3: 'Sem colisão', 4: 'Guia', 5: 'Régua', 6: 'Botões da abertura' }

/* ------------------------------------------------------------------ a sonda (só em tempo de teste) */
const MARCA = 'if (navigator.webdriver) window.__guia = guia.raiz'
const SONDA = `
    if (navigator.webdriver) window.__expoSonda = () => ({ T: { Raycaster: THREE.Raycaster, Vector2: THREE.Vector2, Vector3: THREE.Vector3, Box3: THREE.Box3, AdditiveBlending: THREE.AdditiveBlending }, cam, cena, lockup, matCreme, caixaLetreiro, totem, portas3d, obras, guia, pecasAla, prog })`
const pluginSonda = () => ({
  name: 'limpeza-sonda', enforce: 'pre',
  transform(code, id) {
    if (!id.replace(/\\/g, '/').split('?')[0].endsWith('/src/Exposicao.jsx') || code.includes('__expoSonda')) return null
    if (!code.includes(MARCA)) throw new Error('aceite-limpeza: não achei o ponto de injeção da sonda em Exposicao.jsx')
    return { code: code.replace(MARCA, MARCA + SONDA), map: null }
  },
})

/* ------------------------------------------------------------------ o que roda dentro da página */
// topo do elemento no layout (sem as transformações das animações de entrada)
const topoLayout = (sel) => { let el = document.querySelector(sel), y = 0; if (!el) return null; const alt = el.offsetHeight; for (; el; el = el.offsetParent) y += el.offsetTop; return { y, alt, vh: innerHeight } }

// blocos de texto e botões visíveis na área de leitura (abaixo do cabeçalho)
function coletar() {
  const vw = innerWidth, vh = innerHeight
  const topoUtil = Math.max(0, Math.round(document.querySelector('header')?.getBoundingClientRect().bottom || 0))
  const main = document.querySelector('main#conteudo')
  const opac = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity) } return o }
  const recorte = (r) => { const x = Math.max(0, r.left), y = Math.max(topoUtil, r.top), x2 = Math.min(vw, r.right), y2 = Math.min(vh, r.bottom); return { x, y, w: x2 - x, h: y2 - y } }
  const BLOCO = 'h1,h2,h3,h4,p,dt,dd,label,legend,.micro,.val,.rot,.idx,li'
  const grupos = new Map()
  const tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
  for (let n; (n = tw.nextNode());) {
    if (!n.nodeValue.trim()) continue
    const pai = n.parentElement
    if (!pai || pai.closest('.sr-only, #canvas-root, script, style')) continue
    if (pai.checkVisibility && !pai.checkVisibility()) continue // resposta de pergunta fechada (<details>) não está na tela
    const g = pai.closest('a,button,summary') || pai.closest(BLOCO) || pai
    const rg = document.createRange(); rg.selectNodeContents(n)
    // só o que é pintado: o texto é cortado pelas caixas com overflow dos ancestrais (botão escondido em 1 px não conta)
    const rs = [...rg.getClientRects()].map((r) => {
      let { left, top, right, bottom } = r
      for (let e = pai; e && e !== main; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue; const c = e.getBoundingClientRect(); left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom) }
      return { left, top, right, bottom, width: right - left, height: bottom - top }
    }).filter((r) => r.width > 0.5 && r.height > 0.5)
    if (!rs.length) continue
    if (!grupos.has(g)) grupos.set(g, { rs: [], cores: new Set(), fonte: 0 })
    const G = grupos.get(g), cs = getComputedStyle(pai)
    G.rs.push(...rs); G.cores.add(cs.color); G.fonte = Math.max(G.fonte, parseFloat(cs.fontSize))
  }
  for (const el of main.querySelectorAll('input, textarea, select')) grupos.set(el, { rs: [], cores: new Set(), fonte: 0, campo: true })
  const blocos = []
  for (const [g, G] of grupos) {
    const op = opac(g); if (op < 0.6) continue
    const caixa = g.getBoundingClientRect()
    const uniao = G.rs.length
      ? { left: Math.min(...G.rs.map((r) => r.left)), top: Math.min(...G.rs.map((r) => r.top)), right: Math.max(...G.rs.map((r) => r.right)), bottom: Math.max(...G.rs.map((r) => r.bottom)) }
      : { left: caixa.left + 4, top: caixa.top + 4, right: caixa.right - 4, bottom: caixa.bottom - 4 }
    const interativo = g.matches('a,button,summary,input,textarea,select')
    const rt = recorte(uniao), rc = recorte(interativo ? caixa : uniao)
    const areaCheia = (uniao.right - uniao.left) * (uniao.bottom - uniao.top)
    if (rt.w < 8 || rt.h < 8 || rt.w * rt.h < areaCheia * 0.35) continue
    blocos.push({
      tipo: interativo ? 'botao' : 'texto', campo: !!G.campo, secao: g.closest('section')?.id || '', obra: g.closest('.obra-legenda')?.closest('article')?.id || '',
      rotulo: (G.campo ? `campo ${g.id || g.name || ''}` : g.innerText).replace(/\s+/g, ' ').trim().slice(0, 46),
      marca: g.tagName.toLowerCase() + (g.classList[0] ? '.' + g.classList[0] : ''),
      rt, rc, cores: [...G.cores], fonte: G.fonte, opac: op,
    })
  }
  // a barra do guia
  const nav = document.querySelector('nav.guia')
  let guia = { existe: !!nav, visivel: false, cruza: [] }
  if (nav) {
    const r = nav.getBoundingClientRect(), cs = getComputedStyle(nav)
    guia.visivel = nav.classList.contains('guia-on') && parseFloat(cs.opacity) > 0.5 && r.top < vh
    guia.rect = { x: r.left, y: r.top, w: r.width, h: r.height }
    if (guia.visivel) guia.cruza = blocos.filter((b) => b.tipo === 'botao' && b.rc.x < r.right && b.rc.x + b.rc.w > r.left && b.rc.y < r.bottom && b.rc.y + b.rc.h > r.top).map((b) => b.rotulo)
  }
  guia.obraEmFoco = [...document.querySelectorAll('article.obra.em-foco')].map((a) => a.id)
  return { vw, vh, topoUtil, scrollY: Math.round(scrollY), blocos, guia, qualidade: document.documentElement.dataset.qualidade }
}

// retângulos de tela do 3D e, para cada bloco, o que a câmera vê primeiro atrás dele
function sondar({ rects, nevoaMin }) {
  const e = window.__expoSonda?.(); if (!e) return null
  const T = e.T, cam = e.cam, vw = innerWidth, vh = innerHeight
  cam.updateMatrixWorld()
  const alvos = []
  const add = (nome, tipo, raiz, extra = {}) => { if (raiz) alvos.push({ nome, tipo, raiz, ...extra }) }
  add('logo 3D', 'texto3d', e.lockup, { opacidade: e.matCreme.opacity })
  add('letreiro', 'texto3d', e.caixaLetreiro)
  add('totem', 'texto3d', e.totem)
  e.portas3d.forEach((p, k) => { add(`porta ${k + 1} (foto)`, 'foto', p.g); add(`placa da porta ${k + 1}`, 'texto3d', p.g.children.find((c) => c.material?.map === p.placa.tex)) })
  e.obras.forEach((o) => add(`quadro ${o.el.id.replace('obra-', '')}`, 'texto3d', o.grupo, { foco: o.foco }))
  add('boneco', 'boneco', e.guia.raiz)
  ;['degraus de vidro', 'nó', 'balão'].forEach((n, i) => add(`escultura: ${n}`, 'escultura', e.pecasAla[i]))
  const dono = new Map()
  alvos.forEach((a, i) => a.raiz.traverse((o) => dono.set(o, i)))
  // o que a câmera enxerga: só o que está visível; brilhos aditivos e peças quase transparentes não contam
  const malhas = []
  e.cena.traverseVisible((o) => { const m = o.material; if (!o.isMesh || !m || Array.isArray(m)) return; if (m.blending === T.AdditiveBlending || (m.transparent && m.opacity < 0.3)) return; malhas.push(o) })
  const k = e.cena.fog?.density || 0
  const ray = new T.Raycaster(), ndc = new T.Vector2()
  const tiro = (x, y) => {
    ndc.set((x / vw) * 2 - 1, -(y / vh) * 2 + 1); ray.setFromCamera(ndc, cam)
    const vistos = []
    for (const h of ray.intersectObjects(malhas, false)) {
      const i = dono.get(h.object)
      if (i != null && Math.exp(-((k * h.distance) ** 2)) >= nevoaMin && !vistos.includes(i)) vistos.push(i)
      if (!(h.object.material.transmission > 0)) break // vidro deixa ver o que vem atrás
    }
    return vistos
  }
  const colisoes = rects.map(({ x, y, w, h }) => {
    const passo = Math.min(12, Math.max(3, Math.sqrt((w * h) / 160))), cont = new Map(); let total = 0
    for (let py = y + passo / 2; py < y + h; py += passo) for (let px = x + passo / 2; px < x + w; px += passo) { total++; for (const i of tiro(px, py)) cont.set(i, (cont.get(i) || 0) + 1) }
    return [...cont].filter(([, n]) => n >= 2).map(([i, n]) => ({ alvo: alvos[i].nome, tipo: alvos[i].tipo, cobertura: +(n / total).toFixed(3), foco: !!alvos[i].foco }))
  })
  // os retângulos de tela (caixa do objeto projetada), para o relatório
  const caixa = new T.Box3(), v = new T.Vector3(), centro = new T.Vector3()
  const telas3d = []
  for (const a of alvos) {
    let vis = true; for (let p = a.raiz; p; p = p.parent) if (!p.visible) vis = false
    if (!vis || (a.opacidade != null && a.opacidade < 0.3)) continue
    caixa.setFromObject(a.raiz); if (caixa.isEmpty()) continue
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, n = 0
    for (let c = 0; c < 8; c++) {
      v.set(c & 1 ? caixa.max.x : caixa.min.x, c & 2 ? caixa.max.y : caixa.min.y, c & 4 ? caixa.max.z : caixa.min.z)
      if (v.clone().applyMatrix4(cam.matrixWorldInverse).z > -cam.near) continue
      v.project(cam); const px = (v.x + 1) / 2 * vw, py = (1 - v.y) / 2 * vh
      x1 = Math.min(x1, px); y1 = Math.min(y1, py); x2 = Math.max(x2, px); y2 = Math.max(y2, py); n++
    }
    if (!n) continue
    const X = Math.max(0, x1), Y = Math.max(0, y1), W = Math.min(vw, x2) - X, H = Math.min(vh, y2) - Y
    if (W <= 1 || H <= 1) continue
    const d = caixa.getCenter(centro).distanceTo(cam.position), nev = Math.exp(-((k * d) ** 2))
    if (nev < nevoaMin) continue
    telas3d.push({ nome: a.nome, tipo: a.tipo, rect: { x: Math.round(X), y: Math.round(Y), w: Math.round(W), h: Math.round(H) }, distancia: +d.toFixed(1), nevoa: +nev.toFixed(2), foco: !!a.foco })
  }
  return { colisoes, telas3d }
}

// estatísticas do fundo, em cada retângulo da foto sem texto
async function analisar({ b64, rects, dsf, limBorda }) {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
  const c = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight })
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0)
  const LINEAR = new Float32Array(256); for (let i = 0; i < 256; i++) { const s = i / 255; LINEAR[i] = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return rects.map(({ x, y, w, h }) => {
    const X = Math.max(0, Math.round(x * dsf)), Y = Math.max(0, Math.round(y * dsf))
    const W = Math.min(c.width - X, Math.round(w * dsf)), H = Math.min(c.height - Y, Math.round(h * dsf))
    if (W < 4 || H < 4) return null
    const d = g.getImageData(X, Y, W, H).data, n = W * H
    const L = new Float32Array(n), R = new Float32Array(n)
    let s = 0, s2 = 0, sr = 0, sg = 0, sb = 0
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const l = 0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2]
      L[i] = l; s += l; s2 += l * l; sr += d[j]; sg += d[j + 1]; sb += d[j + 2]
      R[i] = 0.2126 * LINEAR[d[j]] + 0.7152 * LINEAR[d[j + 1]] + 0.0722 * LINEAR[d[j + 2]]
    }
    const media = s / n
    let bordas = 0, claro = 0, escuro = 1
    for (let yy = 0; yy < H - 1; yy++) for (let xx = 0; xx < W - 1; xx++) { const i = yy * W + xx; if (Math.max(Math.abs(L[i + 1] - L[i]), Math.abs(L[i + W] - L[i])) >= limBorda) bordas++ }
    // ponto mais claro / mais escuro: média de 3×3 pixels (um pixel solto de grão não conta)
    for (let yy = 1; yy < H - 1; yy++) for (let xx = 1; xx < W - 1; xx++) {
      const i = yy * W + xx
      const m = (R[i - W - 1] + R[i - W] + R[i - W + 1] + R[i - 1] + R[i] + R[i + 1] + R[i + W - 1] + R[i + W] + R[i + W + 1]) / 9
      if (m > claro) claro = m; if (m < escuro) escuro = m
    }
    return { desvio: +Math.sqrt(Math.max(0, s2 / n - media * media)).toFixed(2), bordas: +(bordas / ((W - 1) * (H - 1))).toFixed(4), claro, escuro, rgb: [sr / n, sg / n, sb / n] }
  })
}

const CSS_SEM_TEXTO = `
html.medindo main#conteudo, html.medindo main#conteudo *, html.medindo main#conteudo *::before, html.medindo main#conteudo *::after {
  color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important;
  text-decoration-color: transparent !important; caret-color: transparent !important; transition: none !important; }
html.medindo main#conteudo *::placeholder { color: transparent !important; }
html.medindo nav.guia, html.medindo #cursor, html.medindo #grao { visibility: hidden !important; }` // o grão de filme cobre a tela toda por igual: não é "fundo"

/* ------------------------------------------------------------------ contas no Node */
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const razao = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
const corDe = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { rgb: [r, g, b], a } }
function contraste(bloco, fundo) {
  let pior = Infinity
  for (const c of bloco.cores) {
    const k = corDe(c); if (!k) continue
    const a = k.a * bloco.opac, rgb = k.rgb.map((v, i) => v * a + fundo.rgb[i] * (1 - a))
    pior = Math.min(pior, razao(lum(rgb), fundo.claro), razao(lum(rgb), fundo.escuro))
  }
  return pior === Infinity ? null : +pior.toFixed(2)
}
const curto = (s, n = 30) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const pct = (v) => (v * 100).toFixed(v < 0.1 ? 1 : 0).replace('.', ',') + '%'
const num = (v, d = 1) => v.toFixed(d).replace('.', ',')

/* ------------------------------------------------------------------ servidor e navegador */
let BASE = process.env.BASE || arg('base'), servidor = null
if (!BASE) {
  const { createServer } = await import(pathToFileURL(path.join(SITE, 'node_modules/vite/dist/node/index.js')).href)
  servidor = await createServer({ root: SITE, configFile: path.join(SITE, 'vite.config.js'), logLevel: 'error', plugins: [pluginSonda()], server: { port: 4391, host: '127.0.0.1' } })
  await servidor.listen()
  BASE = servidor.resolvedUrls.local[0].replace(/\/$/, '')
}
mkdirSync(SAIDA, { recursive: true })
const lancar = (gl) => chromium.launch({
  executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
  args: gl === 'gpu' ? ['--ignore-gpu-blocklist', '--use-angle=d3d11'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
let b = await lancar(GL)
if (GL === 'gpu') {
  const pg = await b.newPage()
  const temGl = await pg.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const x = g?.getExtension('WEBGL_debug_renderer_info'); return g ? String(x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'webgl2') : '' })
  await pg.close()
  if (!temGl || /swiftshader|basic render/i.test(temGl)) { await b.close(); GL = 'swiftshader'; b = await lancar(GL) }
}
const laboratorio = await (await b.newContext()).newPage() // página em branco onde as fotos são medidas
const log = (...a) => console.log(...a)
const erros = []

async function abrir(tela, altura = tela.h) {
  const ctx = await b.newContext({ viewport: { width: tela.w, height: altura }, deviceScaleFactor: tela.dsf, isMobile: tela.celular, hasTouch: tela.celular })
  const p = await ctx.newPage()
  await p.addInitScript(() => { window.__quadros = 0; const f = () => { window.__quadros++; requestAnimationFrame(f) }; requestAnimationFrame(f) })
  p.on('pageerror', (e) => erros.push(`${tela.id}: ${e.message}`))
  // a qualidade fica travada na que o aparelho real usa (o robô sem placa de vídeo cairia para a mais baixa)
  await p.goto(`${BASE}/?qualidade=${tela.celular ? 'media' : 'alta'}${CONSULTA ? '&' + CONSULTA : ''}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 90000 })
  await p.addStyleTag({ content: CSS_SEM_TEXTO })
  return { ctx, p }
}
// a câmera "anda" até a posição da rolagem: espera ela, os quadros e as portas pararem.
// A comparação é feita a cada 3 quadros DESENHADOS (o robô sem placa de vídeo desenha ~1 quadro/s:
// comparar por tempo veria o mesmo quadro duas vezes e daria a cena por parada cedo demais).
async function assentar(p) {
  await p.waitForTimeout(500)
  const ler = () => p.evaluate(() => { const e = window.__expoSonda?.(); if (!e) return null; let q = 0; for (const o of e.obras) q += o.fs * 10 + o.grupo.position.x + o.grupo.position.z * 0.02; let d = 0; for (const x of e.portas3d) d += x.g.position.y; for (const o of e.obras) q += o.grupo.scale.x; return [window.__quadros, e.cam.position.x, e.cam.position.z, q, d, e.prog * 100, e.guia.raiz.position.x, e.guia.raiz.position.z, e.guia.raiz.scale.x, (e.ler || 0) * 10, e.cam.rotation.x * 10] })
  let ant = await ler(), estavel = 0
  if (!ant) { await p.waitForTimeout(6000); return false }
  const fim = Date.now() + 120000
  while (Date.now() < fim) {
    await p.waitForFunction((q) => window.__quadros >= q + 3, ant[0], { timeout: 30000, polling: 100 }).catch(() => {})
    const s = await ler()
    if (s.slice(1).every((v, k) => Math.abs(v - ant[k + 1]) < 3e-3)) { if (++estavel >= 2) break } else estavel = 0
    ant = s
  }
  await p.waitForTimeout(700) // as transições do HTML (legenda, barra do guia) terminam
  return true
}
async function rolarAte(p, y) { await p.evaluate((yy) => window.scrollTo(0, Math.max(0, yy)), y); return assentar(p) }

// mede a tela como está: foto com texto (print), foto sem texto (fundo), raios (colisão)
async function medir(p, tela, arquivo) {
  const dom = await p.evaluate(coletar)
  if (arquivo) await p.screenshot({ path: arquivo, type: 'jpeg', quality: 84 })
  await p.evaluate(() => document.documentElement.classList.add('medindo')); await p.waitForTimeout(250)
  const fundo = await p.screenshot({ type: 'png' }); if (arquivo && arg('guardar-fundo')) writeFileSync(arquivo.replace(/\.jpg$/, '-fundo.png'), fundo) // --guardar-fundo=1: guarda a foto sem texto (depuração)
  const b64 = fundo.toString('base64')
  await p.evaluate(() => document.documentElement.classList.remove('medindo'))
  const fundos = await laboratorio.evaluate(analisar, { b64, rects: dom.blocos.map((x) => x.rt), dsf: tela.dsf, limBorda: LIM.borda })
  const s3d = await p.evaluate(sondar, { rects: dom.blocos.map((x) => x.rc), nevoaMin: LIM.nevoa })
  dom.blocos.forEach((bl, i) => {
    const f = fundos[i]
    bl.desvio = f?.desvio ?? null; bl.bordas = f?.bordas ?? null
    bl.contraste = f && !bl.campo ? contraste(bl, f) : null
    bl.colisoes = s3d ? s3d.colisoes[i] : []
  })
  return { ...dom, telas3d: s3d?.telas3d || [], temSonda: !!s3d }
}
function julgar(m, lim) {
  const falhas = []
  for (const bl of m.blocos) {
    bl.f = []
    if (bl.desvio != null && (bl.desvio > lim.desvio || bl.bordas > lim.bordas)) bl.f.push(1)
    if (bl.contraste != null && bl.contraste < LIM.contraste) bl.f.push(2)
    if (bl.colisoes.some((c) => c.tipo === 'boneco' || c.tipo === 'texto3d')) bl.f.push(3)
  }
  for (const k of [1, 2, 3]) if (m.blocos.some((bl) => bl.f.includes(k))) falhas.push(k)
  m.guia.semFoco = m.guia.visivel && m.guia.obraEmFoco.length === 0
  if (m.guia.semFoco || m.guia.cruza.length) falhas.push(4)
  m.falhas = falhas
  return m
}

/* ------------------------------------------------------------------ a medição */
const R = { quando: new Date().toISOString(), rotulo: ROTULO, base: BASE, gl: GL, limites: LIM, telas: {}, erros }
try { R.commit = execSync('git rev-parse --short HEAD', { cwd: SITE }).toString().trim() } catch {}

for (const tela of TELAS) {
  const pasta = path.join(SAIDA, tela.id); mkdirSync(pasta, { recursive: true })
  const T = R.telas[tela.id] = { nome: tela.nome, estados: [] }
  const { ctx, p } = await abrir(tela)
  T.render = await p.evaluate(() => { const g = document.querySelector('#canvas-root canvas')?.getContext('webgl2'); const x = g?.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'desconhecido' }).catch(() => 'desconhecido')
  log(`\n== ${tela.nome} == (${T.render})`)
  // passeio de aquecimento: dispara as revelações de texto e carrega as imagens de todas as alas
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += tela.h * 0.8) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(140) }
  await p.waitForTimeout(600)

  // 5. RÉGUA (propriedade do layout: vale para a página inteira)
  T.reguas = await p.evaluate(() => [...document.querySelectorAll('main#conteudo .regua')].map((r) => {
    const sp = [...r.querySelectorAll('.micro')].map((s) => { const g = document.createRange(); g.selectNodeContents(s); const tops = [...new Set([...g.getClientRects()].map((q) => Math.round(q.top)))]; return { texto: s.innerText, linhas: tops.length, topo: tops[0] } })
    const linhas = Math.max(...sp.map((s) => s.linhas)) + (sp.length > 1 && Math.abs(sp[0].topo - sp[sp.length - 1].topo) > 8 && sp.every((s) => s.linhas === 1) ? 1 : 0)
    return { secao: r.closest('section')?.id, texto: sp.map((s) => s.texto).join(' | '), linhas }
  }))

  // a referência: legenda de obra em painel de vidro → limites desta tela
  const ref = await p.evaluate(topoLayout, REFERENCIA)
  await rolarAte(p, ref.y + ref.alt / 2 - ref.vh / 2)
  const mRef = await medir(p, tela, path.join(pasta, '00-referencia.jpg'))
  const blocosRef = mRef.blocos.filter((x) => x.obra === REFERENCIA.slice(1) && x.desvio != null)
  if (!blocosRef.length) erros.push(`${tela.id}: a legenda de referência (${REFERENCIA}) não apareceu — limites ficaram no piso`)
  const refDesvio = Math.max(0, ...blocosRef.map((x) => x.desvio)), refBordas = Math.max(0, ...blocosRef.map((x) => x.bordas))
  T.limite = { desvio: +Math.max(LIM.desvioPiso, refDesvio * LIM.desvioFator).toFixed(2), bordas: +Math.max(LIM.bordasPiso, refBordas * LIM.bordasFator).toFixed(4), refDesvio, refBordas, blocosRef: blocosRef.length }
  T.referencia = julgar(mRef, T.limite)
  T.fps = +(await p.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; const dt = performance.now() - t0; if (dt >= 3000) ok(n / (dt / 1000)); else requestAnimationFrame(f) }; requestAnimationFrame(f) }))).toFixed(1)
  log(`referência (legenda VOKE): desvio ${refDesvio} · bordas ${pct(refBordas)} → limite desvio ${T.limite.desvio} · bordas ${pct(T.limite.bordas)} · ${T.fps} quadros/s no robô`)

  let n = 0
  for (const ponto of PONTOS) {
    n++
    for (const pos of ponto.topo ? ['leitura'] : ['leitura', 'transicao']) {
      if (ponto[pos] == null && !ponto.topo) continue
      let y = 0
      if (!ponto.topo) { const a = await p.evaluate(topoLayout, ponto.ancora); if (!a) { erros.push(`${tela.id}: âncora ${ponto.ancora} não existe`); continue } y = a.y - ponto[pos] * a.vh }
      await rolarAte(p, y)
      const print = `${String(PONTOS.indexOf(ponto) + 1).padStart(2, '0')}-${ponto.id}-${pos}.jpg`
      const m = julgar(await medir(p, tela, path.join(pasta, print)), T.limite)
      T.estados.push({ ponto: ponto.id, nome: ponto.nome, pos, print: `${tela.id}/${print}`, ...m })
      log(`${ponto.nome.padEnd(34)} ${pos.padEnd(9)} ${m.falhas.length ? 'FALHA ' + m.falhas.join('·') : 'ok'}  (${m.blocos.length} blocos${m.temSonda ? '' : ', SEM SONDA 3D'})`)
    }
  }
  await ctx.close()
}

// 6. ABERTURA: os dois botões principais inteiros em 390×700 (iPhone com a barra do navegador à vista)
if (PONTOS.some((x) => x.id === 'abertura')) {
  /* No iPhone a página é montada pela altura GRANDE da tela (100vh), mas com as barras do navegador à
     vista só a parte de cima aparece. Três casos: o literal do pedido (390×700); o Safari do iPhone
     (100vh = 750, visível 664); e o Chrome do iPhone, medido no print do Victor (100vh ≈ 790, visível 666). */
  R.abertura700 = { montagens: [], ok: true }
  for (const caso of [{ nome: '390×700 (literal)', alt: 700, corte: 700 }, { nome: 'iPhone com as barras à vista (390×664)', alt: 664, corte: 664 }, { nome: 'Safari do iPhone (página 750, visível 664)', alt: 750, corte: 664 }, { nome: 'Chrome do iPhone (página 790, visível 666)', alt: 790, corte: 666 }]) {
    const { ctx, p } = await abrir({ id: `c390x${caso.alt}`, w: 390, h: caso.alt, dsf: 2, celular: true })
    await assentar(p)
    const bts = await p.evaluate((corte) => { const topo = document.querySelector('header')?.getBoundingClientRect().bottom || 0; return [...document.querySelectorAll('.entrada-ctas .btn')].map((a) => { const r = a.getBoundingClientRect(); return { texto: a.innerText.trim(), topo: Math.round(r.top), base: Math.round(r.bottom), inteiro: r.top >= topo && r.bottom <= corte && r.left >= 0 && r.right <= innerWidth } }) }, caso.corte)
    await p.screenshot({ path: path.join(SAIDA, `abertura-390x${caso.alt}-corte${caso.corte}.jpg`), type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: 390, height: caso.corte } })
    const ok = bts.length >= 2 && bts.every((x) => x.inteiro)
    R.abertura700.montagens.push({ ...caso, botoes: bts, ok }); if (!ok) R.abertura700.ok = false
    log(`Abertura · ${caso.nome}: ${bts.map((x) => `"${x.texto}" ${x.topo}–${x.base}px ${x.inteiro ? 'inteiro' : 'CORTADO'}`).join(' · ')}`)
    await ctx.close()
  }
}
// peso do JavaScript publicado (linha de base da Fase 5): o 3D = three + Exposicao
try {
  const dir = [path.join(SITE, '..', 'assets'), path.join(SITE, 'dist', 'assets')].find((d) => existsSync(d))
  R.js = { pasta: path.relative(SITE, dir).replace(/\\/g, '/'), arquivos: readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => ({ arquivo: f, gzip: gzipSync(readFileSync(path.join(dir, f))).length })) }
  R.js.gzip3d = R.js.arquivos.filter((a) => /^(three|Exposicao)-/.test(a.arquivo)).reduce((s, a) => s + a.gzip, 0)
} catch {}

/* ------------------------------------------------------------------ relatório */
const codigos = (telaId, ponto) => {
  const T = R.telas[telaId]; if (!T) return null
  const set = new Set(T.estados.filter((e) => e.ponto === ponto.id).flatMap((e) => e.falhas))
  if (ponto.secao && T.reguas.some((r) => r.secao === ponto.secao && r.linhas > 1)) set.add(5)
  if (ponto.id === 'abertura' && telaId === 'c390' && R.abertura700 && !R.abertura700.ok) set.add(6)
  return [...set].sort()
}
const detalhe = (telaId, ponto, k) => {
  const T = R.telas[telaId]; if (!T) return '—'
  const est = T.estados.filter((e) => e.ponto === ponto.id)
  const bl = est.flatMap((e) => e.blocos.filter((x) => x.f.includes(k)).map((x) => ({ ...x, pos: e.pos })))
  if (k === 1) { if (!bl.length) return '✅'; const p = bl.reduce((a, x) => (x.bordas > a.bordas ? x : a)); return `❌ ${bl.length} bloco(s). Pior: «${curto(p.rotulo)}» desvio ${num(p.desvio)}, bordas ${pct(p.bordas)}` }
  if (k === 2) { if (!bl.length) return '✅'; const p = bl.reduce((a, x) => (x.contraste < a.contraste ? x : a)); return `❌ ${bl.length} bloco(s). Pior: ${num(p.contraste, 2)}:1 em «${curto(p.rotulo)}»` }
  if (k === 3) {
    if (!bl.length) return '✅'
    const por = new Map()
    for (const x of bl) for (const c of x.colisoes.filter((c) => c.tipo === 'boneco' || c.tipo === 'texto3d')) { const a = por.get(c.alvo) || { n: new Set(), max: 0 }; a.n.add(x.rotulo); a.max = Math.max(a.max, c.cobertura); por.set(c.alvo, a) }
    return '❌ ' + [...por].sort((a, c) => c[1].max - a[1].max).slice(0, 5).map(([alvo, a]) => `${alvo} atrás de ${a.n.size} bloco(s) (até ${pct(a.max)})`).join('; ')
  }
  if (k === 4) { const sem = est.some((e) => e.guia.semFoco), cr = [...new Set(est.flatMap((e) => e.guia.cruza))]; return !sem && !cr.length ? '✅' : '❌ ' + [sem && 'aparece sem obra em foco', cr.length && `cobre ${cr.length} botão(ões): ${cr.slice(0, 3).map((x) => `«${curto(x, 24)}»`).join(', ')}`].filter(Boolean).join('; ') }
  return '—'
}
const ids = TELAS.map((t) => t.id)
let md = `# Limpeza visual da exposição 3D — linha de base (${ROTULO})\n\n`
md += `Medido em ${new Date().toLocaleString('pt-BR')} · commit \`${R.commit || '?'}\` · \`node testes/aceite-limpeza.mjs\` · 3D desenhado por ${Object.values(R.telas)[0]?.render || '?'}.\n\n`
md += `Cada tela é medida em duas posições de rolagem: **leitura** (o bloco na zona de leitura) e **transição** (o título entrando). A tabela mostra a união das duas.\n\n`
md += `## Resumo — verificações que falham em cada tela\n\n| # | Tela | ${TELAS.map((t) => t.nome).join(' | ')} |\n|---|---|${ids.map(() => '---').join('|')}|\n`
PONTOS.forEach((pt, i) => { md += `| ${i + 1} | ${pt.nome} | ${ids.map((id) => { const c = codigos(id, pt); return c.length ? '❌ ' + c.join(' · ') : '✅' }).join(' | ')} |\n` })
md += `\nLegenda: ${Object.entries(NOME).map(([k, v]) => `**${k}** ${v}`).join(' · ')}.\n\n`
md += `## Totais\n\n| Verificação | ${TELAS.map((t) => t.nome).join(' | ')} |\n|---|${ids.map(() => '---').join('|')}|\n`
for (const k of [1, 2, 3]) md += `| ${k}. ${NOME[k]} (blocos que falham / medidos) | ${ids.map((id) => { const bl = R.telas[id].estados.flatMap((e) => e.blocos); return `${bl.filter((x) => x.f.includes(k)).length} / ${bl.length}` }).join(' | ')} |\n`
md += `| 4. Guia (estados com falha / medidos) | ${ids.map((id) => `${R.telas[id].estados.filter((e) => e.falhas.includes(4)).length} / ${R.telas[id].estados.length}`).join(' | ')} |\n`
md += `| 5. Régua (com mais de uma linha / total) | ${ids.map((id) => `${R.telas[id].reguas.filter((r) => r.linhas > 1).length} / ${R.telas[id].reguas.length}`).join(' | ')} |\n`
if (R.abertura700) md += `| 6. Abertura: os dois botões inteiros | ${ids.map((id) => (id === 'c390' ? (R.abertura700.ok ? '✅' : '❌ ' + R.abertura700.montagens.filter((m) => !m.ok).map((m) => `${m.nome}: ${m.botoes.filter((x) => !x.inteiro).map((x) => `«${x.texto}» termina em ${x.base}px`).join(', ')}`).join('; ')) : '—')).join(' | ')} |\n`
md += `| Telas com alguma falha | ${ids.map((id) => `${PONTOS.filter((pt) => codigos(id, pt).length).length} / ${PONTOS.length}`).join(' | ')} |\n`
md += `\n## Limite de "fundo calmo" (calibrado na legenda da VOKE, em painel de vidro)\n\n| Tela | Referência: desvio | Referência: bordas | Limite: desvio | Limite: bordas | Quadros/s no robô |\n|---|---|---|---|---|---|\n`
for (const id of ids) { const L = R.telas[id].limite; md += `| ${R.telas[id].nome} | ${num(L.refDesvio)} | ${pct(L.refBordas)} | ${num(L.desvio)} | ${pct(L.bordas)} | ${num(R.telas[id].fps)} |\n` }
md += `\nDesvio = desvio-padrão da luminância (0–255) atrás do bloco, com o texto escondido. Bordas = fração de pixels com salto de luminância ≥ ${LIM.borda}. Limite = o maior entre o piso (${LIM.desvioPiso} / ${pct(LIM.bordasPiso)}) e ${LIM.desvioFator}× a referência. Contraste mínimo ${num(LIM.contraste)}:1 contra o ponto mais claro (ou mais escuro) do fundo.\n`
md += `\n## Detalhe por tela\n`
PONTOS.forEach((pt, i) => {
  md += `\n### ${i + 1}. ${pt.nome}\n\n| Verificação | ${TELAS.map((t) => t.nome).join(' | ')} |\n|---|${ids.map(() => '---').join('|')}|\n`
  for (const k of [1, 2, 3, 4]) md += `| ${k}. ${NOME[k]} | ${ids.map((id) => detalhe(id, pt, k)).join(' | ')} |\n`
  if (pt.secao) md += `| 5. Régua | ${ids.map((id) => { const r = R.telas[id].reguas.find((x) => x.secao === pt.secao); return !r ? '—' : r.linhas > 1 ? `❌ ${r.linhas} linhas` : '✅' }).join(' | ')} |\n`
})
if (R.js) md += `\n## Peso do JavaScript publicado (gzip)\n\n| Arquivo | gzip |\n|---|---|\n${R.js.arquivos.map((a) => `| ${a.arquivo} | ${num(a.gzip / 1024)} KB |`).join('\n')}\n| **3D (three + Exposicao)** | **${num(R.js.gzip3d / 1024)} KB** |\n`
if (erros.length) md += `\n## Erros de JavaScript durante a medição\n\n${erros.map((e) => `- ${e}`).join('\n')}\n`
writeFileSync(path.join(SAIDA, 'linha-de-base.md'), md)
writeFileSync(path.join(SAIDA, 'resultado.json'), JSON.stringify(R, null, 1))

/* ------------------------------------------------------------------ prancha de prints */
for (const tela of TELAS) {
  const T = R.telas[tela.id], lw = tela.celular ? 250 : 470, esc = lw / tela.w, lh = Math.round(tela.h * esc)
  const cel = (e) => `<figure><div class="img" style="width:${lw}px;height:${lh}px"><img src="${e.print}" width="${lw}" height="${lh}">${e.blocos.filter((x) => x.f.length).map((x) => `<i class="${x.f.includes(3) ? 'c3' : 'c1'}" style="left:${x.rc.x * esc}px;top:${x.rc.y * esc}px;width:${x.rc.w * esc}px;height:${x.rc.h * esc}px"></i>`).join('')}</div><figcaption><b>${String(PONTOS.findIndex((q) => q.id === e.ponto) + 1).padStart(2, '0')} · ${e.nome}</b><span class="${e.falhas.length ? 'ruim' : 'bom'}">${e.falhas.length ? 'falha: ' + e.falhas.map((k) => NOME[k].toLowerCase()).join(', ') : 'limpa'}</span></figcaption></figure>`
  const fila = (pos, titulo) => { const es = T.estados.filter((e) => e.pos === pos); return es.length ? `<h2>${titulo}</h2><div class="fila">${es.map(cel).join('')}</div>` : '' }
  const html = `<!doctype html><meta charset="utf-8"><title>Prancha ${ROTULO} ${tela.nome}</title><style>
body{margin:0;padding:28px 32px 36px;background:#0b1616;color:#e9e4da;font:14px/1.4 Inter,Segoe UI,Arial,sans-serif;width:max-content}
h1{font-size:26px;margin:0 0 4px}h1 small{font-weight:400;color:#9fb1ad;font-size:15px}p.leg{margin:0 0 6px;color:#9fb1ad}
h2{font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#d4a574;margin:26px 0 12px}
.fila{display:grid;grid-template-columns:repeat(${tela.celular ? 11 : 4},${lw}px);gap:18px 16px}
figure{margin:0}.img{position:relative;overflow:hidden;border-radius:8px;outline:1px solid rgba(230,221,208,.18)}img{display:block}
.img i{position:absolute;box-sizing:border-box;border:2px solid #ff5a4f;background:rgba(255,90,79,.14);border-radius:3px}
.img i.c1{border:1.5px dashed #ffb347;background:rgba(255,179,71,.07)}
figcaption{display:flex;flex-direction:column;gap:2px;padding:8px 2px 0;font-size:12.5px}figcaption span{font-size:11.5px}
.ruim{color:#ff8a80}.bom{color:#7fd69b}
</style><h1>Prancha "${ROTULO}" · ${tela.nome} <small>commit ${R.commit || '?'} · ${new Date().toLocaleDateString('pt-BR')}</small></h1>
<p class="leg">Vermelho cheio: bloco de texto ou botão com boneco ou texto 3D atrás (colisão). Laranja tracejado: fundo agitado ou contraste abaixo de 4,5:1.</p>
${fila('leitura', 'Leitura — o bloco na zona de leitura')}${fila('transicao', 'Transição — o título entrando na tela')}`
  const arq = path.join(SAIDA, `prancha-${tela.id}.html`); writeFileSync(arq, html)
  const pg = await (await b.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })).newPage()
  await pg.goto(pathToFileURL(arq).href); await pg.waitForLoadState('networkidle')
  await pg.screenshot({ path: path.join(SAIDA, `prancha-${tela.id}.jpg`), type: 'jpeg', quality: 86, fullPage: true })
  await pg.context().close()
}

await b.close(); await servidor?.close()
const comFalha = TELAS.reduce((s, t) => s + PONTOS.filter((pt) => codigos(t.id, pt).length).length, 0)
log(`\n${comFalha} tela(s) com falha em ${TELAS.length * PONTOS.length} (${PONTOS.length} telas × ${TELAS.length} tamanhos). Relatório: ${path.join(SAIDA, 'linha-de-base.md')}`)
if (erros.length) log('Erros de JavaScript:', erros.join(' | '))
process.exit(comFalha || erros.length ? 1 : 0)
