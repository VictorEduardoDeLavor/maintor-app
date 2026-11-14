// Imagens das TELAS QUE ROLAM nos quadros da exposição (12/11/2026).
// Para cada quadro gera, em public/midia/rolagem/:
//   <nome>-720.webp e <nome>-1280.webp   a primeira tela (quadro parado na parede, legenda sem 3D, prerender)
//   <nome>-r960.webp e <nome>-r640.webp  a faixa alta que rola dentro do quadro (computador e celular)
// Dois tipos:
//   pagina  um site no ar (1440×900): antes, uma passada lenta pela página inteira (carrega as fotos sob demanda e
//           dispara as animações de entrada); depois, tela a tela e costurado — ou, em sites com seção presa
//           durante a rolagem (metodo: 'inteira'), uma foto só da página inteira tirada do topo
//   telas   telas reais de sistema empilhadas — o quadro passa de uma para a outra
// Regras da casa aplicadas na captura: preço da Maintor desfocado (páginas dos produtos), nenhum selo ou link
// com o nome da plataforma dos apps, nada de endereço de teste (localhost) à vista.
// Uso (na pasta site/): node testes/capturar-rolagem.mjs [nome1,nome2]   (sem nomes: todos)
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const SAIDA = path.join(SITE, 'public/midia/rolagem'); mkdirSync(SAIDA, { recursive: true })
const PORT = path.join(SITE, 'public/midia/portfolio'), SOC = path.join(SITE, 'public/midia/social')
// telas reais dos apps (contas de demonstração) que vivem no estúdio do JARVIS, no WSL; copiadas para uma pasta local
const ESTUDIO = '\\\\wsl.localhost\\Ubuntu\\home\\victor\\jarvis\\studio\\public'
const MAX_ALTURA = 4096 // textura: o limite seguro em qualquer celular
const FUNDO = '#0d2626'

const PAGINAS = [
  { nome: 'voke-home', url: 'https://www.vokewear.com.br' },
  { nome: 'voke-produto', url: 'https://www.vokewear.com.br/p/conjunto-aura-halter-flare-preto', maxCss: 4200 },
  { nome: 'bendita-home', url: 'https://benditaacessorios.com' },
  { nome: 'bendita-produto', url: 'https://benditaacessorios.com/product/anel-aurora-tamanho-20', maxCss: 4200 },
  { nome: 'besten-home', url: 'https://besten-site.vercel.app' },
  { nome: 'besten-servicos', url: 'https://besten-site.vercel.app/servicos' },
  // sites com seções presas durante a rolagem (GSAP/sticky): o quadro passa pelas telas que o visitante vê, uma a uma
  // escolher: as telas (a cada 900 px de rolagem) que entram, escolhidas à mão em 12/11 com RASCUNHO=<pasta> — sem telas
  // de meio de animação, sem repetidas e sem a seção de planos dos produtos
  { nome: 'techtrainer-home', url: 'https://studiotechtrainer.com.br', metodo: 'telas', escolher: [0, 2, 4, 5, 8, 12] },
  { nome: 'cmms-site', url: 'https://maintor.com.br', semPreco: true },
  { nome: 'fit-site', url: 'https://maintorfit.com', semPreco: true, metodo: 'telas', escolher: [0, 1, 2, 6, 7, 10] },
  { nome: 'horaqui-site', url: 'https://www.horaqui.com.br', semPreco: true, metodo: 'telas', escolher: [0, 1, 2, 3, 5, 9] },
]
const T = (n) => path.join(ESTUDIO, 'telas', n), FIT = (n) => path.join(ESTUDIO, 'fit', n), PF = (n) => path.join(PORT, n), PS = (n) => path.join(SOC, n)
const PILHAS = [
  { nome: 'rh-telas', aspecto: 1.6, telas: [PF('rh-painel-1280.webp'), PF('rh-relatorios-1280.webp')] },
  { nome: 'task-telas', aspecto: 1.6, telas: [PF('task-indicadores-1280.webp'), PF('task-relatorios-1280.webp')] },
  // 14/11: as telas do CMMS são 16:9 (em 1,6 o recorte comia 5% de cada lado — "ns de Serviço")
  { nome: 'cmms-telas', aspecto: 16 / 9, telas: [T('01_dashboard.png'), T('02_ordens_servico.png'), T('06_calendario_preventivas.png'), T('05_historico_ativo.png'), T('08_estoque.png')] },
  { nome: 'besten-portal', aspecto: 1.6, telas: [PF('besten-kpis-1920.webp'), PF('besten-biblioteca-1920.webp'), PF('besten-onboarding-1920.webp')] },
  // 14/11: mistura 16:9 (CMMS) com 1,6 (Task, RH, Besten): quadro em 16:9 e cada tela INTEIRA, com faixa escura dos lados
  { nome: 'sistemas-telas', aspecto: 16 / 9, conter: true, telas: [T('02_ordens_servico.png'), PF('task-indicadores-1280.webp'), PF('rh-painel-1280.webp'), PF('besten-kpis-1920.webp'), T('06_calendario_preventivas.png')] },
  // o app com a marca do profissional (conta de demonstração "CR Performance"), em formato de celular
  { nome: 'fit-app', aspecto: 1170 / 2532, telas: [FIT('c2_marca_pro.png'), FIT('c2_home_aluno.png'), FIT('c2_painel_pro.png'), FIT('c3_em_risco.png')],
    // a tela "Minha marca" mostra o endereço de teste do ambiente de desenvolvimento: coberto (coordenadas na imagem original)
    tapar: { 0: [{ x: 0, y: 2290, w: 1170, h: 150, cor: '#ffffff' }] } },
  /* posts autorais da Flow. FORA: 9 e 14 (assunto de preço), 17 (prazo de Natal vencido), 21 e 23 (R$ da Flow na arte)
     — regra da casa: nenhum preço da Flow no site, nem dentro de imagem */
  { nome: 'flow-posts', aspecto: 1080 / 1350, telas: [PS('post-24.jpg'), PS('post-25.jpg'), PS('post-13.jpg'), PS('post-26.jpg')] },
  { nome: 'flow-feed', aspecto: 1, grade: { colunas: 3, linhas: 6 }, telas: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 18, 19, 20, 22].map((k) => PS(`post-${k}.jpg`)) },
]

const SO = process.argv[2] ? process.argv[2].split(',') : null
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' })
const oficina = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage() // onde as imagens são montadas (canvas)
const gravar = (arq, dataUrl) => writeFileSync(path.join(SAIDA, arq), Buffer.from(dataUrl.split(',')[1], 'base64'))
const dataUrl = (arq) => `data:image/${arq.endsWith('.png') ? 'png' : arq.endsWith('.jpg') ? 'jpeg' : 'webp'};base64,${readFileSync(arq).toString('base64')}`

// ---------- montagem no canvas (roda dentro da página "oficina") ----------
async function montar({ fontes, tipo, aspecto, grade, tapar, fundo, maxAltura, conter }) {
  const imgs = await Promise.all(fontes.map((s) => new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = s })))
  const exp = (c, q = 0.86) => c.toDataURL('image/webp', q)
  const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h })
  // desenha a imagem cobrindo o quadro (âncora no topo), como object-fit: cover; object-position: top
  const cobrir = (g, img, x, y, w, h) => { const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s; g.drawImage(img, (img.width - sw) / 2, 0, sw, sh, x, y, w, h) }
  // conter: a tela inteira dentro do quadro, centrada, com o fundo nas sobras (como object-fit: contain)
  const encaixar = (g, img, x, y, w, h) => {
    if (!conter) return cobrir(g, img, x, y, w, h)
    const s = Math.min(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s
    g.fillStyle = fundo; g.fillRect(x, y, w, h); g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  }
  // as telas cobertas de cada imagem (o endereço de teste, por exemplo)
  const limpas = imgs.map((img, k) => {
    if (!tapar?.[k]) return img
    const c = canvas(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0)
    for (const r of tapar[k]) { g.fillStyle = r.cor; g.fillRect(r.x, r.y, r.w, r.h) }
    return c
  })
  const saida = {}
  if (tipo === 'pagina') {
    // os quadros chegam como fatias já posicionadas: { img, y } em px da página (escala da captura)
    const fonte = limpas[0]
    for (const [suf, W] of [['720', 720], ['1280', 1280]]) { const c = canvas(W, Math.round(W / aspecto)); cobrir(c.getContext('2d'), fonte, 0, 0, c.width, c.height); saida[suf] = exp(c) }
    for (const [suf, W] of [['r960', 960], ['r640', 640]]) {
      const H = Math.min(maxAltura, Math.round(fonte.height * W / fonte.width)), c = canvas(W, H), g = c.getContext('2d')
      g.drawImage(fonte, 0, 0, fonte.width, H * fonte.width / W, 0, 0, W, H); saida[suf] = exp(c, 0.82); saida[suf + 'altura'] = H
    }
    return saida
  }
  // telas: uma abaixo da outra, cada uma do tamanho exato do quadro, com uma faixa escura entre elas
  const desenharPilha = (W) => {
    if (grade) {
      // um feed: colunas de posts quadrados com um vão fino, como no perfil do Instagram
      const vao = Math.round(W * 0.012), lado = (W - vao * (grade.colunas - 1)) / grade.colunas
      const linhas = Math.ceil(limpas.length / grade.colunas), H = Math.min(maxAltura, Math.round(linhas * lado + (linhas - 1) * vao))
      const c = canvas(W, H), g = c.getContext('2d'); g.fillStyle = fundo; g.fillRect(0, 0, W, H)
      limpas.forEach((img, k) => cobrir(g, img, (k % grade.colunas) * (lado + vao), Math.floor(k / grade.colunas) * (lado + vao), lado, lado))
      return { c, passo: 0, telaAltura: W / aspecto }
    }
    const hTela = Math.round(W / aspecto), vao = Math.round(hTela * 0.06)
    const n = Math.max(1, Math.min(limpas.length, Math.floor((maxAltura + vao) / (hTela + vao))))
    const H = n * hTela + (n - 1) * vao, c = canvas(W, H), g = c.getContext('2d'); g.fillStyle = fundo; g.fillRect(0, 0, W, H)
    for (let k = 0; k < n; k++) encaixar(g, limpas[k], 0, k * (hTela + vao), W, hTela)
    return { c, n, passo: (hTela + vao) / H, telaAltura: hTela }
  }
  for (const [suf, W] of [['720', 720], ['1280', 1280]]) { const c = canvas(W, Math.round(W / aspecto)); encaixar(c.getContext('2d'), limpas[0], 0, 0, c.width, c.height); saida[suf] = exp(c) }
  for (const [suf, W0] of [['r960', 960], ['r640', 640]]) {
    // telas altas e estreitas (celular): a largura cai até as telas caberem no limite de altura
    let W = W0; if (!grade) { const porTela = 1 / aspecto * 1.06; W = Math.min(W0, Math.floor(maxAltura / (porTela * Math.min(limpas.length, 4) - 0.06 / aspecto))) }
    const r = desenharPilha(W); saida[suf] = exp(r.c, 0.84); saida[suf + 'altura'] = r.c.height; saida[suf + 'largura'] = W; saida.n = r.n || null
  }
  return saida
}

// ---------- captura de um site no ar, tela a tela ----------
async function capturarPagina(pg) {
  const ESC = 1.5, VW = 1440, VH = 900
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: ESC, locale: 'pt-BR' })
  const p = await ctx.newPage()
  try { await p.goto(pg.url, { waitUntil: 'networkidle', timeout: 60000 }) } catch (e) { console.log('aviso', pg.nome, e.message.split('\n')[0]) }
  const recusarCookies = async () => { for (const rx of [/s[óo] essenciais/i, /^recusar$/i, /rejeitar/i]) { const bt = p.getByRole('button', { name: rx }).first(); if (await bt.isVisible().catch(() => false)) { await bt.click().catch(() => {}); await p.waitForTimeout(500); break } } }
  await recusarCookies()
  const limpar = async () => p.evaluate((semPreco) => {
    // avisos de cookie; e o nome da plataforma dos apps em TEXTO VISÍVEL ou em selo/link (a regra é sobre o que se lê —
    // fotos servidas por um endereço com esse nome continuam: escondê-las apagava as fotos de produto da Bendita)
    for (const el of document.querySelectorAll('[class*=cookie],[id*=cookie],[class*=Cookie],[class*=consent],[id*=consent]')) el.style.setProperty('display', 'none', 'important')
    for (const el of document.querySelectorAll('body *')) { const folha = !el.children.length; const t = ((folha ? el.textContent || '' : '') + (el.tagName === 'A' ? el.getAttribute('href') || '' : '')).toLowerCase(); if (t.includes('base44') && (folha || el.getBoundingClientRect().height < 80)) el.style.setProperty('visibility', 'hidden', 'important') }
    // preço da Maintor: desfocado nas páginas dos produtos (regra da casa: nenhum R$ nosso no site da Flow)
    if (semPreco) for (const el of document.querySelectorAll('body *')) { if (el.children.length > 2) continue; const t = el.textContent || ''; if (/R\$\s*\d|\d+,\d{2}\s*\/\s*m[eê]s|\/m[eê]s\b/i.test(t) && t.length < 160) el.style.filter = 'blur(9px)' }
  }, !!pg.semPreco)
  await limpar()
  await p.evaluate(async () => { window.scrollTo(0, 700); await new Promise((r) => setTimeout(r, 600)); window.scrollTo(0, 0) })
  await p.waitForTimeout(2000); await recusarCookies(); await limpar()
  // passada lenta: fotos sob demanda carregam e as animações de entrada acontecem
  await p.evaluate(async (max) => {
    for (const i of document.querySelectorAll('img[loading=lazy]')) i.loading = 'eager'
    const fim = Math.min(document.documentElement.scrollHeight, max + 900)
    for (let y = 0; y <= fim; y += 350) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)) }
    await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r }))), new Promise((r) => setTimeout(r, 9000))])
    window.scrollTo(0, 0)
  }, pg.maxCss || 6144)
  await p.waitForTimeout(1800); await limpar()
  const total = Math.min(await p.evaluate(() => document.documentElement.scrollHeight), pg.maxCss || (pg.metodo === 'telas' ? 12600 : 6144))
  const fatias = []
  if (pg.metodo === 'inteira') { // (reserva: foto única da página inteira tirada do topo)
    fatias.push({ y: 0, jpg: (await p.screenshot({ type: 'jpeg', quality: 93, fullPage: true, clip: { x: 0, y: 0, width: VW, height: total } })).toString('base64') })
  } else
  for (let y = 0, n = 0; y < total; y += VH, n++) {
    if (n === 0) await p.evaluate(() => window.scrollTo(0, 0))
    const alvo = Math.min(y, total - VH)
    await p.evaluate(async (a) => { const ini = window.scrollY; for (let k = 1; k <= 6; k++) { window.scrollTo(0, ini + (a - ini) * k / 6); await new Promise((r) => setTimeout(r, 90)) } }, alvo)
    await p.waitForTimeout(1100); await limpar()
    if (n === 1) { await p.evaluate(() => { for (const el of document.querySelectorAll('*')) { const s = getComputedStyle(el); if ((s.position === 'fixed' || s.position === 'sticky') && el.getBoundingClientRect().height < 220) el.style.visibility = 'hidden' } }); await p.waitForTimeout(200) }
    const real = await p.evaluate(() => Math.round(window.scrollY))
    fatias.push({ y: real, jpg: (await p.screenshot({ type: 'jpeg', quality: 93 })).toString('base64') })
    if (alvo >= total - VH) break
  }
  await ctx.close()
  if (pg.metodo === 'telas') {
    // RASCUNHO=<pasta>: grava todas as telas capturadas, para escolher à mão quais entram (campo escolher)
    if (process.env.RASCUNHO) { mkdirSync(path.join(process.env.RASCUNHO, pg.nome), { recursive: true }); fatias.forEach((f, k) => writeFileSync(path.join(process.env.RASCUNHO, pg.nome, `tela-${String(k).padStart(2, '0')}.jpg`), Buffer.from(f.jpg, 'base64'))) }
    if (pg.escolher) return { telas: pg.escolher.map((k) => 'data:image/jpeg;base64,' + fatias[k].jpg), total, fatias: fatias.length, escolhidas: pg.escolher }
    // fica com as telas que têm conteúdo e que diferem da anterior (seções presas repetem a tela ou passam por um meio vazio)
    const escolhidas = await oficina.evaluate(async ({ fatias, max, LIMITES }) => {
      const c = Object.assign(document.createElement('canvas'), { width: 144, height: 90 }), g = c.getContext('2d', { willReadFrequently: true })
      const lum = async (jpg) => { const i = new Image(); i.src = 'data:image/jpeg;base64,' + jpg; await i.decode(); g.drawImage(i, 0, 0, 144, 90); const d = g.getImageData(0, 0, 144, 90).data, L = new Float32Array(144 * 90); for (let k = 0; k < L.length; k++) L[k] = 0.2126 * d[k * 4] + 0.7152 * d[k * 4 + 1] + 0.0722 * d[k * 4 + 2]; return L }
      const fichas = []; for (const f of fatias) fichas.push(await lum(f.jpg))
      const desvio = (L) => { let s = 0, s2 = 0; for (const v of L) { s += v; s2 += v * v } const m = s / L.length; return Math.sqrt(s2 / L.length - m * m) }
      // conteúdo: variação de luz e quantidade de detalhe (bordas) — uma tela escura quase vazia tem pouco dos dois
      const detalhe = (L) => { let n = 0; for (let y = 0; y < 89; y++) for (let x = 0; x < 143; x++) { const k = y * 144 + x; if (Math.abs(L[k + 1] - L[k]) > 18 || Math.abs(L[k + 144] - L[k]) > 18) n++ } return n / (143 * 89) }
      const dif = (A, B) => { let s = 0; for (let k = 0; k < A.length; k++) s += Math.abs(A[k] - B[k]); return s / A.length }
      const out = []; let ultima = null
      const medidas = []
      fichas.forEach((L, k) => { const m = { k, desvio: +desvio(L).toFixed(1), detalhe: +detalhe(L).toFixed(3), dif: ultima ? +dif(L, ultima).toFixed(1) : null }; medidas.push(m); if (out.length >= max) return; if (m.desvio < LIMITES.desvio || m.detalhe < LIMITES.detalhe) return; if (ultima && m.dif < LIMITES.dif) return; out.push(k); ultima = L })
      console.log(JSON.stringify(medidas))
      return { out, medidas }
    }, { fatias, max: pg.telas || 6, LIMITES: { desvio: 22, detalhe: 0.045, dif: 14, ...(pg.limites || {}) } }).then((r) => { if (process.env.MEDIDAS) console.log(pg.nome, JSON.stringify(r.medidas)); return r.out })
    return { telas: escolhidas.map((k) => 'data:image/jpeg;base64,' + fatias[k].jpg), total, fatias: fatias.length, escolhidas }
  }
  // costura numa imagem só (na escala da captura)
  const costurada = await oficina.evaluate(async ({ fatias, total, esc }) => {
    const c = Object.assign(document.createElement('canvas'), { width: 1440 * esc, height: Math.round(total * esc) }), g = c.getContext('2d')
    for (const f of fatias) { const i = new Image(); i.src = 'data:image/jpeg;base64,' + f.jpg; await i.decode(); g.drawImage(i, 0, Math.round(f.y * esc)) }
    return c.toDataURL('image/webp', 0.95)
  }, { fatias, total, esc: ESC })
  return { costurada, total, fatias: fatias.length }
}

const relatorio = []
for (const pg of PAGINAS.filter((x) => !SO || SO.includes(x.nome))) {
  const { costurada, telas, total, fatias, escolhidas } = await capturarPagina(pg)
  const s = await oficina.evaluate(montar, telas ? { fontes: telas, tipo: 'telas', aspecto: 1.6, maxAltura: MAX_ALTURA, fundo: FUNDO } : { fontes: [costurada], tipo: 'pagina', aspecto: 1.6, maxAltura: MAX_ALTURA, fundo: FUNDO })
  for (const suf of ['720', '1280', 'r960', 'r640']) gravar(`${pg.nome}-${suf}.webp`, s[suf])
  relatorio.push({ nome: pg.nome, tipo: telas ? 'telas' : 'pagina', telas: s.n || null, url: pg.url, alturaCss: total, fatias, r960: s.r960altura, r640: s.r640altura })
  console.log(`ok ${pg.nome}: ${total} px de página em ${fatias} telas${telas ? ' (escolhidas: ' + escolhidas.join(',') + ')' : ''} → faixa ${s.r960altura} px (960)`)
}
for (const pl of PILHAS.filter((x) => !SO || SO.includes(x.nome))) {
  const fontes = pl.telas.map((arq) => { if (!existsSync(arq)) throw new Error('tela não encontrada: ' + arq); return dataUrl(arq) })
  const s = await oficina.evaluate(montar, { fontes, tipo: 'telas', aspecto: pl.aspecto, grade: pl.grade, tapar: pl.tapar, conter: pl.conter, maxAltura: MAX_ALTURA, fundo: FUNDO })
  for (const suf of ['720', '1280', 'r960', 'r640']) gravar(`${pl.nome}-${suf}.webp`, s[suf])
  relatorio.push({ nome: pl.nome, tipo: pl.grade ? 'feed' : 'telas', telas: s.n, aspecto: +pl.aspecto.toFixed(4), r960: [s.r960largura, s.r960altura], r640: [s.r640largura, s.r640altura] })
  console.log(`ok ${pl.nome}: ${s.n || 'feed'} telas → ${s.r960largura}×${s.r960altura} (960) · ${s.r640largura}×${s.r640altura} (640)`)
}
const arqRel = path.join(SAIDA, '_capturas.json')
const antigo = existsSync(arqRel) ? JSON.parse(readFileSync(arqRel, 'utf8')) : {}
for (const r of relatorio) antigo[r.nome] = { ...r, capturado: new Date().toISOString().slice(0, 10) }
writeFileSync(arqRel, JSON.stringify(antigo, null, 1))
await b.close()
