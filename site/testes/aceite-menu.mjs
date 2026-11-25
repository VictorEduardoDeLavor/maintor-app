// Aceite do MENU DO SITE e do PRÓXIMO PASSO (15/11/2026). Fonte única: src/menu.js.
//   1. as 22 páginas internas com cabeçalho usam o mesmo menu da home: 4 grupos + Contato, a marca em imagem
//   2. o painel lista TODAS as páginas do site e os 14 projetos (nada escondido); a página atual vem marcada
//   3. cada página guarda o WhatsApp dela (mensagem pronta própria) no cabeçalho
//   4. o painel abre pelo grupo (computador) e pelo botão (celular), fecha com Esc e devolve a rolagem
//   5. toda página tem o bloco "Veja funcionando" antes da chamada final, com projetos do tour e o passo seguinte;
//      todo link do bloco aponta para algo que existe (obra da home ou página do site)
//   6. os títulos do painel não entram na hierarquia de títulos (a página continua começando no h1)
//   7. home: o painel abre, fecha e um link de seção leva até a seção
//   8. abertura das páginas de serviço: duas ações (o WhatsApp da página + um projeto ou página que existe), a nota
//      diz o que a pessoa recebe de volta (não é mais a frase genérica) e o botão principal cabe na primeira tela
// Uso (na pasta site/, depois de `npm run build`, com o dist servido em :4175): node testes/aceite-menu.mjs
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'
import { MENU, TRILHAS } from '../src/menu.js'
import { ALAS } from '../src/obras.js'

const BASE = process.env.BASE || 'http://localhost:4175'
const R = []; let falhas = 0
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++ }
const PAGINAS = Object.keys(TRILHAS)
const linksMenu = MENU.flatMap((g) => g.colunas.flatMap((c) => c.links.map((l) => l.href)))
const obras = new Set(ALAS.flatMap((a) => a.obras.map((o) => '/#obra-' + o.id)))
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' })

// a fonte: todas as páginas no menu, todos os projetos no menu
const foraMenu = PAGINAS.filter((p) => !linksMenu.includes(p))
ok(foraMenu.length === 0, `fonte: as ${PAGINAS.length} páginas internas estão no menu${foraMenu.length ? ' — fora: ' + foraMenu.join(', ') : ''}`)
const projFora = [...obras].filter((o) => o.startsWith('/#obra-') && ALAS[0].obras.some((x) => '/#obra-' + x.id === o) && !linksMenu.includes(o))
ok(projFora.length === 0, `fonte: os ${ALAS[0].obras.length} projetos da Ala 01 estão no menu${projFora.length ? ' — fora: ' + projFora.join(', ') : ''}`)

const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
const erros = []; p.on('pageerror', (e) => erros.push(e.message))
const ruins = { menu: [], painel: [], whats: [], trilha: [], links: [], titulos: [], atual: [], abertura: [], dobra: [] }
let comAbertura = 0
for (const pg of PAGINAS) {
  const r = await p.goto(BASE + pg, { waitUntil: 'domcontentloaded' })
  const d = await p.evaluate(() => ({
    grupos: [...document.querySelectorAll('header .navlinks a')].map((a) => a.textContent.trim()),
    marca: !!document.querySelector('header .marca-lockup img'),
    painel: [...document.querySelectorAll('#menu-secoes .mega-colunas li a')].map((a) => a.getAttribute('href')),
    atual: [...document.querySelectorAll('#menu-secoes a[aria-current="page"]')].map((a) => a.getAttribute('href')),
    whats: document.querySelector('header .nav-cta')?.href || '',
    whatsCorpo: document.querySelector('main a[href*="wa.me/"]')?.href || '',
    trilha: (() => { const t = document.querySelector('.pg-trilha'); if (!t) return null; const cta = document.querySelector('.pg-cta'); return { links: [...t.querySelectorAll('a')].map((a) => a.getAttribute('href')), antesDaChamada: !cta || !!(t.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING) } })(),
    titulos: [...document.querySelectorAll('h1, h2, h3, h4')].map((h) => +h.tagName[1]),
    abertura: (() => { const a = [...document.querySelectorAll('.pg-hero .pg-acoes a')]; if (!a.length) return null; return { hrefs: a.map((x) => x.getAttribute('href')), rotulos: a.map((x) => x.textContent.trim()), nota: document.querySelector('.pg-hero .pg-acoes .nota')?.textContent.trim() || '', base: Math.round(a[0].getBoundingClientRect().bottom), vh: innerHeight } })(),
  }))
  // 8. a abertura (guias e trilha têm abertura própria, sem a nota: ficam fora)
  if (d.abertura && d.abertura.nota) {
    comAbertura++
    const [wa, ver] = d.abertura.hrefs
    const verOk = !!ver && (obras.has(ver) || PAGINAS.includes(ver) || ['/#site-e-gestao', '/#lojas-virtuais', '/#sites', '/#sistemas-e-aplicativos', '/#trabalhos'].includes(ver))
    if (d.abertura.hrefs.length !== 2 || !wa.includes('wa.me/5511946610634') || !verOk || d.abertura.nota.startsWith('Primeira conversa sem compromisso') || d.abertura.rotulos[0] === 'Conversar no WhatsApp' || !d.abertura.nota.endsWith('Sem compromisso · (11) 94661-0634')) ruins.abertura.push(pg)
    if (d.abertura.base > d.abertura.vh) ruins.dobra.push(`${pg} (${d.abertura.base} px)`)
  }
  if (r.status() !== 200 || JSON.stringify(d.grupos) !== JSON.stringify(['Projetos', 'O que fazemos', 'Marketing', 'Guias', 'Contato']) || !d.marca) ruins.menu.push(pg)
  if (linksMenu.some((l) => !d.painel.includes(l))) ruins.painel.push(pg)
  if (!d.atual.includes(pg)) ruins.atual.push(pg)
  if (!/wa\.me\/5511946610634\?text=/.test(d.whats) || d.whats !== d.whatsCorpo) ruins.whats.push(pg)
  if (!d.trilha || !d.trilha.antesDaChamada || d.trilha.links.length < 3) ruins.trilha.push(pg)
  else for (const l of d.trilha.links) { if (!(obras.has(l) || l === '/#trabalhos' || PAGINAS.includes(l))) ruins.links.push(`${pg} → ${l}`) }
  if (d.titulos[0] !== 1) ruins.titulos.push(pg)
}
ok(ruins.menu.length === 0, `1 · ${PAGINAS.length} páginas com o menu do site (4 grupos + Contato) e a marca em imagem${ruins.menu.length ? ' — falham: ' + ruins.menu.join(', ') : ''}`)
ok(ruins.painel.length === 0, `2 · o painel de cada página lista os ${linksMenu.length} links do site${ruins.painel.length ? ' — falham: ' + ruins.painel.join(', ') : ''}`)
ok(ruins.atual.length === 0, `2 · a página atual vem marcada no painel${ruins.atual.length ? ' — falham: ' + ruins.atual.join(', ') : ''}`)
ok(ruins.whats.length === 0, `3 · o WhatsApp do cabeçalho é o da própria página${ruins.whats.length ? ' — falham: ' + ruins.whats.join(', ') : ''}`)
ok(ruins.trilha.length === 0, `5 · bloco "Veja funcionando" antes da chamada final em todas${ruins.trilha.length ? ' — falham: ' + ruins.trilha.join(', ') : ''}`)
ok(ruins.links.length === 0, `5 · todo link do bloco aponta para uma obra ou página que existe${ruins.links.length ? ' — ' + ruins.links.join('; ') : ''}`)
ok(comAbertura === 16 && ruins.abertura.length === 0, `8 · ${comAbertura} páginas de serviço com duas ações na abertura e a oferta na nota${ruins.abertura.length ? ' — falham: ' + ruins.abertura.join(', ') : ''}`)
ok(ruins.dobra.length === 0, `8 · computador (1440×900): o botão principal da abertura cabe na primeira tela${ruins.dobra.length ? ' — fora: ' + ruins.dobra.join(', ') : ''}`)
ok(ruins.titulos.length === 0, `6 · a hierarquia de títulos continua começando no h1${ruins.titulos.length ? ' — falham: ' + ruins.titulos.join(', ') : ''}`)

// 4. abrir e fechar numa página interna — computador
await p.goto(BASE + '/sites/', { waitUntil: 'networkidle' })
await p.locator('header .nav-grupo', { hasText: 'Guias' }).click(); await p.waitForTimeout(300)
const a1 = await p.evaluate(() => ({ aberto: !document.getElementById('menu-secoes').hidden, destaque: document.querySelector('#menu-secoes .mega-grupo.em-destaque')?.getAttribute('data-grupo'), exp: document.querySelector('header .nav-grupo[data-menu="guias"]').getAttribute('aria-expanded'), trava: document.body.style.overflow }))
ok(a1.aberto && a1.destaque === 'guias' && a1.exp === 'true' && a1.trava === 'hidden', '4 · computador: clicar em "Guias" abre o painel nesse grupo e trava a rolagem')
await p.keyboard.press('Escape'); await p.waitForTimeout(200)
const a2 = await p.evaluate(() => ({ aberto: !document.getElementById('menu-secoes').hidden, trava: document.body.style.overflow }))
ok(!a2.aberto && a2.trava === '', '4 · computador: Esc fecha e devolve a rolagem')
await p.locator('header .nav-grupo', { hasText: 'O que fazemos' }).click(); await p.waitForTimeout(200)
await p.locator('#menu-secoes a[href="/loja-virtual/"]').click(); await p.waitForLoadState('domcontentloaded')
ok(new URL(p.url()).pathname === '/loja-virtual/', '4 · computador: um link do painel leva à página')
await ctx.close()
// celular
{
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const q = await c.newPage()
  await q.goto(BASE + '/guias/', { waitUntil: 'networkidle' })
  const antes = await q.evaluate(() => ({ grupos: getComputedStyle(document.querySelector('header .navlinks')).display, botao: getComputedStyle(document.querySelector('.menu-btn')).display }))
  ok(antes.grupos === 'none' && antes.botao !== 'none', '4 · celular: os grupos saem do cabeçalho e fica o botão de menu')
  await q.locator('.menu-btn').tap(); await q.waitForTimeout(300)
  const m = await q.evaluate(() => { const pn = document.getElementById('menu-secoes'); const fora = [...pn.querySelectorAll('a')].filter((a) => { const r = a.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth + 1 || r.height < 40 }).length; return { aberto: !pn.hidden, fora, rola: pn.scrollHeight > pn.clientHeight } })
  ok(m.aberto && m.fora === 0, `4 · celular: o botão abre o painel; todos os links cabem na largura e têm 40 px ou mais de altura (${m.fora} fora)`)
  await q.locator('.menu-btn').tap(); await q.waitForTimeout(200)
  ok(await q.evaluate(() => document.getElementById('menu-secoes').hidden), '4 · celular: o botão fecha o painel')
  await c.close()
}
// 7. home
{
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const q = await c.newPage(); const er = []; q.on('pageerror', (e) => er.push(e.message))
  await q.goto(BASE + '/', { waitUntil: 'networkidle' }); await q.waitForTimeout(2500)
  await q.locator('header .nav-grupo', { hasText: 'Projetos' }).click(); await q.waitForTimeout(400)
  ok(await q.evaluate(() => !document.getElementById('menu-secoes').hidden && !!document.querySelector('#menu-secoes .mega-grupo.em-destaque')), '7 · home: clicar em "Projetos" abre o painel')
  await q.locator('#menu-secoes a[href="#obra-maktub"]').click(); await q.waitForTimeout(3800)
  const h = await q.evaluate(() => ({ fechado: document.getElementById('menu-secoes').hidden, topo: Math.round(document.getElementById('obra-maktub').getBoundingClientRect().top), trava: document.body.style.overflow }))
  ok(h.fechado && Math.abs(h.topo) < 160 && h.trava === '', `7 · home: o link "Maktub Conquista" fecha o painel e leva até o quadro (topo ${h.topo} px)`)
  await q.locator('header .nav-grupo', { hasText: 'Marketing' }).click(); await q.waitForTimeout(300); await q.keyboard.press('Escape'); await q.waitForTimeout(300)
  ok(await q.evaluate(() => document.getElementById('menu-secoes').hidden), '7 · home: Esc fecha o painel')
  ok(er.length === 0, `7 · home sem erro de JavaScript (${er.join(' | ')})`)
  await c.close()
}
ok(erros.length === 0, `páginas internas sem erro de JavaScript (${erros.join(' | ')})`)
await b.close()
console.log(R.join('\n') + `\n\nRESUMO: ${R.length - falhas} ok · ${falhas} falhas`)
process.exit(falhas ? 1 : 0)
