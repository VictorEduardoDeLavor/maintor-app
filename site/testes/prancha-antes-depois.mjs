// Prancha ANTES × DEPOIS da limpeza visual: põe lado a lado os prints de duas rodadas do aceite-limpeza.
// Uso (na pasta site/):
//   node testes/prancha-antes-depois.mjs --de=antes --para=fase1 --pontos=abertura --so=c390,c360
//   --extra="Opção B: com selo=fase1-opc-selo" (repetível com ;) acrescenta colunas de outras rodadas
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.join(AQUI, 'limpeza')
const arg = (n, padrao = null) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : padrao }
const DE = arg('de', 'antes'), PARA = arg('para')
if (!PARA) { console.error('faltou --para=<rodada>'); process.exit(2) }
const ler = (r) => JSON.parse(readFileSync(path.join(RAIZ, r, 'resultado.json'), 'utf8'))
const colunas = [{ titulo: 'Antes', rodada: DE }, { titulo: 'Depois', rodada: PARA }, ...(arg('extra') || '').split(';').filter(Boolean).map((x) => { const [titulo, rodada] = x.split('='); return { titulo, rodada } })]
  .map((c) => ({ ...c, R: ler(c.rodada) }))
const telas = (arg('so') || Object.keys(colunas[1].R.telas).join(',')).split(',')
const pontos = arg('pontos') ? arg('pontos').split(',') : [...new Set(Object.values(colunas[1].R.telas)[0].estados.map((e) => e.ponto))]
const posicoes = (arg('pos') || 'leitura,transicao').split(',')
const NOME = { 1: 'fundo calmo', 2: 'contraste', 3: 'colisão', 4: 'guia' }

let html = `<!doctype html><meta charset="utf-8"><title>Antes × depois</title><style>
body{margin:0;padding:28px 32px 36px;background:#0b1616;color:#e9e4da;font:14px/1.4 Inter,Segoe UI,Arial,sans-serif;width:max-content}
h1{font-size:24px;margin:0 0 4px}p.leg{margin:0 0 4px;color:#9fb1ad}h2{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#d4a574;margin:28px 0 12px}
.fila{display:flex;gap:18px;align-items:flex-start}figure{margin:0}.img{position:relative;overflow:hidden;border-radius:8px;outline:1px solid rgba(230,221,208,.18)}img{display:block}
.img i{position:absolute;box-sizing:border-box;border:2px solid #ff5a4f;background:rgba(255,90,79,.14);border-radius:3px}.img i.c1{border:1.5px dashed #ffb347;background:rgba(255,179,71,.07)}
figcaption{display:flex;flex-direction:column;gap:2px;padding:8px 2px 0;font-size:13px}figcaption span{font-size:12px}.ruim{color:#ff8a80}.bom{color:#7fd69b}
</style><h1>Limpeza visual · antes × depois <small style="font-weight:400;color:#9fb1ad;font-size:14px">${DE} → ${PARA} · ${new Date().toLocaleDateString('pt-BR')}</small></h1>
<p class="leg">Vermelho cheio: boneco ou texto 3D atrás do bloco. Laranja tracejado: fundo agitado ou contraste abaixo de 4,5:1. Sem marca: bloco limpo.</p>`
for (const id of telas) for (const ponto of pontos) for (const pos of posicoes) {
  const celulas = colunas.map((c) => ({ c, T: c.R.telas[id], e: c.R.telas[id]?.estados.find((x) => x.ponto === ponto && x.pos === pos) })).filter((x) => x.e)
  if (celulas.length < 2) continue
  const [w, h] = celulas[0].T.nome.split('×').map(Number), lw = w > 800 ? 620 : 300, esc = lw / w, lh = Math.round(h * esc)
  html += `<h2>${celulas[0].T.nome} · ${celulas[0].e.nome} · ${pos === 'leitura' ? 'leitura' : 'transição'}</h2><div class="fila">`
  for (const { c, e } of celulas) html += `<figure><div class="img" style="width:${lw}px;height:${lh}px"><img src="${pathToFileURL(path.join(RAIZ, c.rodada, e.print)).href}" width="${lw}" height="${lh}">${e.blocos.filter((x) => x.f.length).map((x) => `<i class="${x.f.includes(3) ? 'c3' : 'c1'}" style="left:${x.rc.x * esc}px;top:${x.rc.y * esc}px;width:${x.rc.w * esc}px;height:${x.rc.h * esc}px"></i>`).join('')}</div><figcaption><b>${c.titulo}</b><span class="${e.falhas.length ? 'ruim' : 'bom'}">${e.falhas.length ? 'falha: ' + e.falhas.map((k) => NOME[k]).join(', ') : 'limpa: 0 falhas'}</span></figcaption></figure>`
  html += '</div>'
}
// a primeira tela real do iPhone (com as barras do navegador à vista), quando as duas rodadas têm o recorte
const recortes = colunas.map((c) => ({ c, arq: ['abertura-390x664-corte664.jpg', 'abertura-390x790-corte666.jpg'].map((f) => path.join(RAIZ, c.rodada, f)).find(existsSync) })).filter((x) => x.arq)
if (pontos.includes('abertura') && recortes.length >= 2) {
  html += `<h2>Primeira tela no iPhone, com as barras do navegador à vista (≈ 390×664)</h2><div class="fila">`
  for (const { c, arq } of recortes) html += `<figure><div class="img" style="width:300px"><img src="${pathToFileURL(arq).href}" width="300"></div><figcaption><b>${c.titulo}</b><span>${(c.R.abertura700?.ok ? 'os dois botões inteiros' : 'botão cortado')}</span></figcaption></figure>`
  html += '</div>'
}
const arq = path.join(RAIZ, PARA, 'antes-depois.html'); writeFileSync(arq, html)
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' })
const p = await b.newPage({ viewport: { width: 1200, height: 800 } })
await p.goto(pathToFileURL(arq).href); await p.waitForLoadState('networkidle')
await p.screenshot({ path: path.join(RAIZ, PARA, 'antes-depois.jpg'), type: 'jpeg', quality: 86, fullPage: true })
await b.close()
console.log('prancha:', path.join(RAIZ, PARA, 'antes-depois.jpg'))
