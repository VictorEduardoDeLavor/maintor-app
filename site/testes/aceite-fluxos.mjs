// Aceite dos FLUXOS que a revisão independente de 12/11/2026 achou quebrados (limpeza visual, Fase 5).
// Cada verificação reproduz um cenário real — se alguma voltar a falhar, a regressão voltou:
//   1. a sala de uma porta é a galeria acesa, mesmo entrando pela lista (o modo LER não fica preso lá dentro)
//   2. com o painel "Qual é o seu problema?" aberto, o boneco só some enquanto o painel está na tela
//   3. virar o aparelho depois de abrir a página: o letreiro da orientação nova não fica atrás do título
//   4. link direto /#contato chega no formulário, mesmo com a exposição carregando depois
//   5. teclado: com o foco num link de legenda, a legenda está visível
//   6. teclado: as setas ← → andam de obra em obra também sem obra em foco
//   7. páginas de serviço: a régua não é cortada na borda do celular
//   8. tablet em pé: a barra do guia não cobre os botões da legenda em foco
// Uso (na pasta site/): node testes/aceite-fluxos.mjs      (ou BASE=http://localhost:4175 contra o build)
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url)), SITE = path.resolve(AQUI, '..')
const R = []; let falhas = 0
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++ }
let BASE = process.env.BASE, servidor = null
if (!BASE) {
  const { createServer } = await import(pathToFileURL(path.join(SITE, 'node_modules/vite/dist/node/index.js')).href)
  servidor = await createServer({ root: SITE, configFile: path.join(SITE, 'vite.config.js'), logLevel: 'error', server: { port: 4389, host: '127.0.0.1' } })
  await servidor.listen(); BASE = servidor.resolvedUrls.local[0].replace(/\/$/, '')
}
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: ['--ignore-gpu-blocklist', '--use-angle=d3d11'] })
const CEL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }
const PC = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
async function abrir(opts) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message))
  await p.goto(`${BASE}/?qualidade=${opts.isMobile ? 'media' : 'alta'}`, { waitUntil: 'networkidle' })
  return { ctx, p, erros }
}
const pronta = (p) => p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 60000 })
const rolarPara = (p, sel, frac) => p.evaluate(([s, f]) => { let el = document.querySelector(s), y = 0; for (; el; el = el.offsetParent) y += el.offsetTop; window.scrollTo(0, y - f * innerHeight) }, [sel, frac])
const centrar = (p, sel) => p.evaluate((s) => { const el = document.querySelector(s); let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; window.scrollTo(0, y + el.offsetHeight / 2 - innerHeight / 2) }, sel)
const cruza = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top

// 1. sala acesa
{
  const { ctx, p, erros } = await abrir(CEL); await pronta(p)
  await rolarPara(p, '#problemas .portas-lista', 0.2); await p.waitForTimeout(3000)
  const antes = await p.evaluate(() => window.__expoSonda().cena.fog.density)
  await p.locator('#problemas .portas-lista .porta-btn').nth(0).tap()
  await p.waitForSelector('aside.sala-painel'); await p.waitForTimeout(2500)
  const d = await p.evaluate(() => { const e = window.__expoSonda(); return { nevoa: e.cena.fog.density, env: e.cena.environmentIntensity } })
  ok(antes > 0.05, `1 · o saguão estava em modo LER ao tocar na lista (névoa ${antes.toFixed(3)})`)
  ok(Math.abs(d.nevoa - 0.028) < 0.002 && d.env > 0.38, `1 · dentro da sala a galeria está acesa (névoa ${d.nevoa.toFixed(3)}, reflexo ${d.env.toFixed(2)})`)
  await p.keyboard.press('Escape'); await p.waitForTimeout(2000)
  ok(erros.length === 0, `1 · sem erro de JavaScript (${erros.join(' | ')})`)
  await ctx.close()
}
// 2. boneco com o painel aberto
{
  const { ctx, p } = await abrir(CEL); await pronta(p); await p.waitForTimeout(2500)
  await p.locator('.pergunta-gatilho').tap(); await p.waitForTimeout(2000)
  const naAbertura = await p.evaluate(() => window.__guia.scale.x)
  await rolarPara(p, '#sistemas .regua', 0.16); await p.waitForTimeout(4000)
  const naAla03 = await p.evaluate(() => ({ esc: window.__guia.scale.x, aberto: !!document.querySelector('.pergunta-painel.aberta') }))
  ok(naAbertura < 0.1, `2 · com o painel aberto na tela, o boneco sai de cena (escala ${naAbertura.toFixed(3)})`)
  ok(naAla03.aberto && naAla03.esc > 0.5, `2 · com o painel ainda aberto mas fora da tela, o boneco volta (escala ${naAla03.esc.toFixed(2)} na Ala 03)`)
  await ctx.close()
}
// 3. virar o aparelho
for (const [de, para, nome] of [[{ width: 844, height: 390 }, { width: 390, height: 844 }, 'deitado → em pé'], [{ width: 390, height: 844 }, { width: 844, height: 390 }, 'em pé → deitado']]) {
  const { ctx, p } = await abrir({ ...CEL, viewport: de }); await pronta(p); await p.waitForTimeout(2000)
  await p.setViewportSize(para); await p.waitForTimeout(3500)
  const r = await p.evaluate(() => {
    const e = window.__expoSonda(), T = e.T, cx = new T.Box3().setFromObject(e.caixaLetreiro), v = new T.Vector3(); e.cam.updateMatrixWorld()
    let y1 = Infinity, y2 = -Infinity, x1 = Infinity, x2 = -Infinity, atras = 0
    for (let i = 0; i < 8; i++) { v.set(i & 1 ? cx.max.x : cx.min.x, i & 2 ? cx.max.y : cx.min.y, i & 4 ? cx.max.z : cx.min.z); if (v.clone().applyMatrix4(e.cam.matrixWorldInverse).z > 0) atras++; v.project(e.cam); const px = (v.x + 1) / 2 * innerWidth, py = (1 - v.y) / 2 * innerHeight; x1 = Math.min(x1, px); x2 = Math.max(x2, px); y1 = Math.min(y1, py); y2 = Math.max(y2, py) }
    const h1 = document.querySelector('.entrada-h1').getBoundingClientRect(), ap = document.querySelector('.entrada-apoio').getBoundingClientRect()
    const let_ = { left: x1, right: x2, top: y1, bottom: y2 }, naTela = atras === 0 && y2 > 0 && y1 < innerHeight
    return { naTela, sobreTexto: naTela && [h1, ap].some((t) => let_.left < t.right && let_.right > t.left && let_.top < t.bottom && let_.bottom > t.top), y: [Math.round(y1), Math.round(y2)] }
  })
  ok(!r.sobreTexto, `3 · ${nome}: o letreiro não passa atrás do título nem da proposta (faixa ${r.y.join('–')} px, ${r.naTela ? 'na tela' : 'fora da tela'})`)
  await ctx.close()
}
// 4. link direto /#contato
{
  const ctx = await b.newContext(CEL); const p = await ctx.newPage()
  await p.goto(`${BASE}/?qualidade=media#contato`, { waitUntil: 'networkidle' }); await pronta(p); await p.waitForTimeout(3500)
  const topo = await p.evaluate(() => Math.round(document.querySelector('#contato').getBoundingClientRect().top))
  ok(Math.abs(topo) < 140, `4 · /#contato chega no Contato depois que a exposição carrega (topo da seção a ${topo} px)`)
  await ctx.close()
}
// 5 e 6. teclado no computador
{
  const { ctx, p } = await abrir(PC); await pronta(p)
  // 5: foco num link de legenda com a obra ainda longe da posição de leitura (como o Tab que chega pela Ala 03)
  await rolarPara(p, '#obra-m-conteudo', 0.6); await p.waitForTimeout(2500) // o topo da obra a 60% da tela: o quadro ainda na parede
  await p.evaluate(() => document.querySelector('#obra-m-conteudo .obra-legenda a').focus({ preventScroll: true })); await p.waitForTimeout(800)
  const op = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#obra-m-conteudo .obra-legenda')).opacity))
  const emFoco = await p.evaluate(() => document.querySelector('#obra-m-conteudo').classList.contains('em-foco'))
  ok(!emFoco, '5 · (a obra ainda não está em foco nesse ponto da rolagem)')
  ok(op > 0.95, `5 · teclado: com o foco num link da legenda, a legenda fica visível (opacidade ${op.toFixed(2)})`)
  await p.evaluate(() => document.activeElement?.blur())
  // 6: setas sem obra em foco (no painel do grupo 1)
  await rolarPara(p, '#projetos-clientes .grupo-painel', 0.36); await p.waitForTimeout(2500)
  const y0 = await p.evaluate(() => scrollY)
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(2500)
  const y1 = await p.evaluate(() => scrollY)
  ok(y1 > y0 + 100, `6 · teclado: a seta → leva à próxima obra mesmo sem obra em foco (${y0} → ${y1} px)`)
  await ctx.close()
}
// 7. régua das páginas de serviço no celular
for (const pag of ['/automacao-de-atendimento/', '/loja-virtual/', '/marketing-e-redes/', '/sistema-para-revender/']) {
  const ctx = await b.newContext(CEL); const p = await ctx.newPage()
  await p.goto(BASE + pag, { waitUntil: 'networkidle' })
  const cortes = await p.evaluate(() => [...document.querySelectorAll('.regua .micro')].filter((s) => { const r = s.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 }).map((s) => s.innerText))
  ok(cortes.length === 0, `7 · ${pag}: nenhuma régua cortada na borda (${cortes.join(' | ')})`)
  await ctx.close()
}
// 8. tablet em pé: a barra do guia não cobre botões da legenda em foco
{
  const { ctx, p } = await abrir({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await pronta(p)
  for (const id of ['obra-voke', 'obra-bendita', 'obra-cmms']) {
    await centrar(p, '#' + id); await p.waitForTimeout(3500)
    const d = await p.evaluate((oid) => {
      const nav = document.querySelector('nav.guia'), on = nav?.classList.contains('guia-on'), rg = nav?.getBoundingClientRect()
      const bts = [...document.querySelectorAll(`#${oid} .obra-legenda a, #${oid} .obra-legenda button`)].map((a) => ({ t: a.innerText.trim(), r: a.getBoundingClientRect() })).filter((x) => x.r.height > 0)
      return { on, foco: document.querySelector('#' + oid).classList.contains('em-foco'), cobertos: on ? bts.filter((x) => x.r.left < rg.right && x.r.right > rg.left && x.r.top < rg.bottom && x.r.bottom > rg.top).map((x) => x.t) : [], foraDaTela: bts.filter((x) => x.r.bottom > innerHeight).map((x) => x.t) }
    }, id)
    ok(d.cobertos.length === 0 && d.foraDaTela.length === 0, `8 · tablet 768×1024 · ${id} (em foco: ${d.foco}, barra: ${d.on}): nenhum botão da legenda sob a barra ou fora da tela (${[...d.cobertos, ...d.foraDaTela].join(' | ')})`)
  }
  await ctx.close()
}
await b.close(); await servidor?.close()
console.log(R.join('\n')); console.log(`\nRESUMO: ${R.length - falhas} ok · ${falhas} falhas`)
process.exit(falhas ? 1 : 0)
