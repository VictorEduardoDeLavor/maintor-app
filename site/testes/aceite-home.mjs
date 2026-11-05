// Aceite da home reformulada (27/10/2026): abertura 3D, o fio e os trabalhos no ar.
// Uso: sirva o dist em :4175 e rode `node testes/aceite-home.mjs`.
import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:4175';
const R = []; let falhas = 0;
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++; };
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
// o Playwright marca navigator.webdriver=true (a home pula a abertura para robôs); aqui simulamos uma pessoa
const humano = (ctx) => ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));

// HTML pré-renderizado: sem abertura nem fio, com os trabalhos
const estatico = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
ok(!estatico.includes('id="abertura"') && !/<svg[^>]*class="fio"/.test(estatico), 'prerender sem a abertura e sem o fio');
ok((estatico.match(/class="obra( obra-dir)?"/g) || []).length === 20, `prerender com as 20 obras (${(estatico.match(/class="obra( obra-dir)?"/g) || []).length})`);
ok(estatico.includes("classList.add('com-abertura')") && estatico.includes('background:#0D2626'), 'index.html tem a capa escura antes do primeiro quadro');

// 1ª visita: a abertura roda DENTRO da exposição e termina sozinha
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await humano(ctx);
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(BASE + '/');
  ok(await p.evaluate(() => document.documentElement.classList.contains('com-abertura')), 'abertura: página travada (com-abertura) enquanto roda');
  ok((await p.locator('.pular-abertura').count()) === 1, 'abertura: botão "Pular abertura"');
  await p.waitForFunction(() => document.documentElement.classList.contains('expo-pronta'), null, { timeout: 30000 });
  const t0 = Date.now();
  await p.waitForFunction(() => !document.documentElement.classList.contains('com-abertura'), null, { timeout: 20000 });
  const dur = (Date.now() - t0) / 1000;
  ok(dur > 3.5 && dur < 12, `abertura termina sozinha depois do 1º quadro (${dur.toFixed(1)} s) e libera a página`);
  ok(await p.evaluate(() => sessionStorage.getItem('flow.abertura') === '1'), 'abertura marcada como vista na sessão');
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  ok(!(await p.evaluate(() => document.documentElement.classList.contains('com-abertura'))) && (await p.locator('.pular-abertura').count()) === 0, '2ª carga na mesma sessão: sem abertura');
  ok(erros.length === 0, `sem erro de JavaScript na abertura (${erros.join(' | ')})`);
  await ctx.close();
}
// pular funciona e devolve o foco à página
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await humano(ctx);
  const p = await ctx.newPage();
  await p.goto(BASE + '/');
  await p.waitForSelector('.pular-abertura'); await p.waitForTimeout(600);
  await p.locator('.pular-abertura').click();
  await p.waitForFunction(() => !document.documentElement.classList.contains('com-abertura'), null, { timeout: 4000 });
  ok(true, 'abertura: "Pular" libera a página em menos de 4 s (celular)');
  ok((await p.evaluate(() => window.scrollY)) === 0, 'depois de pular, a página começa no topo');
  await ctx.close();
}
// sem abertura: link de seção e movimento reduzido
for (const [nome, opts, url] of [['link #contato', {}, '/#contato'], ['movimento reduzido', { reducedMotion: 'reduce' }, '/']]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, ...opts }); await humano(ctx);
  const p = await ctx.newPage();
  await p.goto(BASE + url, { waitUntil: 'networkidle' }); await p.waitForTimeout(700);
  ok((await p.locator('#abertura').count()) === 0 && !(await p.evaluate(() => document.documentElement.classList.contains('com-abertura'))), `sem abertura com ${nome}`);
  await ctx.close();
}

// a home nova
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const d = await p.evaluate(() => ({
    icones: document.querySelectorAll('.icone-flutuante, .icone-vitrine, .num-fantasma').length, // #canvas-root agora é a exposição 3D (05/11)
    fio: !!document.querySelector('svg.fio .fio-linha[d]'),
    obras: [...document.querySelectorAll('article.obra')].map((t) => ({
      id: t.id, ala: t.closest('section')?.id, img: t.dataset.img, url: t.querySelector('a.btn')?.href, titulo: t.querySelector('h3')?.innerText,
    })),
    nav: [...document.querySelectorAll('header .navlinks a')].map((a) => a.getAttribute('href')),
    logo: document.querySelector('header .marca-lockup img')?.getAttribute('src'),
  }));
  ok(d.icones === 0, 'sem ícones flutuantes nem números-fantasma');
  ok(d.fio || !!(await p.evaluate(() => document.querySelector('#canvas-root canvas'))), 'o fio está desenhado (ou a exposição 3D está montada)');
  ok(d.obras.length === 20 && d.obras.every((o) => o.url && o.img && o.titulo), `20 obras com quadro, título e link (${d.obras.length})`);
  ok(d.obras.filter((o) => o.ala === 'trabalhos').length === 8 && d.obras.filter((o) => o.ala === 'problemas').length === 6, 'ala trabalhos com 8 obras e ala do problema com 6');
  ok(d.nav.includes('#trabalhos') && !d.nav.includes('#vitrine'), 'menu leva a "Trabalhos"');
  ok(!/base44/i.test(await p.evaluate(() => document.querySelector('#trabalhos').innerText)), 'trabalhos: a plataforma não aparece em texto')
  ok(d.logo === '/midia/marca/maintor-lockup-claro.svg', 'cabeçalho com o lockup oficial');
  // os quadros existem como imagem (HEAD 200) — no 3D são textura, no fallback aparecem na legenda
  for (const o of d.obras) {
    const st = await p.evaluate(async (u) => (await fetch(u, { method: 'HEAD' })).status, o.img);
    if (st !== 200) ok(false, `quadro ${o.id}: imagem ${o.img} responde ${st}`);
  }
  ok(true, 'todos os quadros têm imagem servida');
  for (const u of [...new Set(d.obras.filter((o) => o.ala === 'trabalhos').map((o) => o.url))]) {
    const s = await fetch(u, { redirect: 'follow' }).then((r) => r.status).catch(() => 0);
    ok(s === 200, `no ar: ${u} (${s})`);
  }
  // o fio acompanha a rolagem (só no fallback em SVG; com WebGL quem anda é a câmera 3D)
  if (await p.locator('svg.fio .fio-linha').count()) {
    const o1 = await p.evaluate(() => parseFloat(document.querySelector('.fio-linha').style.strokeDashoffset));
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await p.waitForTimeout(600);
    const o2 = await p.evaluate(() => parseFloat(document.querySelector('.fio-linha').style.strokeDashoffset));
    ok(o2 < o1, `o fio se desenha com a rolagem (${Math.round(o1)} → ${Math.round(o2)})`);
  } else {
    ok(await p.evaluate(() => !!document.querySelector('#canvas-root canvas')), 'com WebGL, a exposição 3D substitui o fio');
  }
  await ctx.close();
}
// celular
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 375, '375px: sem rolagem lateral');
  const links = await p.evaluate(() => [...document.querySelectorAll('#trabalhos a')].filter((a) => a.getBoundingClientRect().height < 44).map((a) => a.innerText));
  ok(links.length === 0, `375px: links dos trabalhos com toque ≥ 44px ${links.join(' / ')}`);
  await ctx.close();
}
// 29/10: consultorias — página própria, cartão no "problema" e chip no hero
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const r = await p.goto(BASE + '/para-consultorias/', { waitUntil: 'networkidle' });
  const d = await p.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim(),
    canon: document.querySelector('link[rel=canonical]')?.href,
    faqLd: (() => { for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const j = JSON.parse(s.textContent); if (j['@type'] === 'FAQPage') return j.mainEntity.length; } return -1; })(),
    faq: document.querySelectorAll('.pg-faq details').length,
    wa: decodeURIComponent((document.querySelector('a.btn[href^="https://wa.me/"]')?.href || '').split('text=')[1] || ''),
    promessa: /não é promessa/i.test(document.body.innerText),
    imgs: [...document.querySelectorAll('main img')].length,
  }));
  ok(r.status() === 200 && d.h1 === 'Sua consultoria vende tecnologia — e a gente constrói nos bastidores.', `/para-consultorias/ no ar com o h1 certo (${d.h1})`);
  ok(d.canon === 'https://maintorflow.com.br/para-consultorias/' && d.faq === 5 && d.faqLd === 5, '/para-consultorias/: canonical e FAQ (5 visíveis = 5 no JSON-LD)');
  ok(/consultoria/i.test(d.wa) && d.promessa, '/para-consultorias/: WhatsApp próprio e exemplo marcado "não é promessa"');
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const h = await p.evaluate(() => ({
    card: !!document.querySelector('#problemas article.obra a[href="/para-consultorias/"]'),
    chips: [...document.querySelectorAll('#topo .hero-chip')].map((c) => c.innerText),
    contato: !!document.querySelector('#contato a[href="/para-consultorias/"]'),
  }));
  ok(h.card && h.contato && h.chips.includes('Sou consultoria') && h.chips.length === 7, `home: cartão, chip "Sou consultoria" e serviço no contato (${h.chips.length} chips)`);
  await p.locator('#topo .hero-chip', { hasText: 'Sou consultoria' }).click();
  await p.waitForTimeout(300);
  ok((await p.locator('#topo .hero-links a[href="/para-consultorias/"]').count()) === 1 && (await p.locator('#topo .hero-dor').count()) === 1, 'chip "Sou consultoria" abre a dor e leva à página');
  ok((await p.locator('#topo .manchete').count()) === 0 && (await p.locator('#topo h1').count()) === 1, 'entrada sem o texto da frente, com um h1 discreto');
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  ok(sm.includes('/para-consultorias/'), 'sitemap com /para-consultorias/');
  await ctx.close();
}
// 05/11: a exposição 3D — canvas atrás do conteúdo com WebGL; fio em SVG sem WebGL/movimento reduzido
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const e = await p.evaluate(() => ({ canvas: !!document.querySelector('#canvas-root canvas'), fio: !!document.querySelector('svg.fio'), z: getComputedStyle(document.querySelector('#canvas-root')).zIndex, dica: document.querySelector('#topo .dica-scroll')?.innerText }));
  ok(e.canvas && !e.fio && e.z === '0', `exposição 3D montada atrás do conteúdo (canvas=${e.canvas}, fio=${e.fio}, z=${e.z})`);
  ok(/exposição/i.test(e.dica || ''), 'hero convida a caminhar pela exposição');
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await p.waitForTimeout(1500);
  ok(erros.length === 0, `exposição sem erro de JavaScript ao rolar (${erros.join(' | ')})`);
  await ctx.close();
  const ctxR = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pr = await ctxR.newPage(); await pr.goto(BASE + '/', { waitUntil: 'networkidle' }); await pr.waitForTimeout(800);
  const r = await pr.evaluate(() => ({ canvas: !!document.querySelector('#canvas-root canvas'), fio: !!document.querySelector('svg.fio') }));
  ok(!r.canvas && r.fio, 'movimento reduzido: sem 3D, com o fio em SVG');
  await ctxR.close();
}
// decisão de 28/10: nenhum preço da Flow no site (o valor sai fechado na proposta)
{
  const { readdirSync, statSync } = await import('node:fs');
  const raiz = new URL('../dist/', import.meta.url);
  const arqs = [];
  const andar = (u) => { for (const n of readdirSync(u)) { const f = new URL(n, u); if (statSync(f).isDirectory()) andar(new URL(n + '/', u)); else if (/\.(html|md)$/.test(n)) arqs.push(f); } };
  andar(raiz);
  const achados = arqs.filter((f) => /R\$ ?(1\.500|2\.200|3\.500)|a partir de R\$|sai mais barata/i.test(readFileSync(f, 'utf8'))).map((f) => f.pathname.split('/dist/')[1]);
  ok(achados.length === 0, `nenhum preço da Flow no site (${arqs.length} páginas lidas${achados.length ? ': ' + achados.join(', ') : ''})`);
}
await b.close();
console.log(R.join('\n'));
console.log(`\nRESUMO: ${R.length - falhas} ok · ${falhas} falhas`);
process.exit(falhas ? 1 : 0);
