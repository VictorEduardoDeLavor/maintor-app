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
ok((estatico.match(/class="trabalho( inverso)?"/g) || []).length === 8, 'prerender com os 8 trabalhos');
ok(estatico.includes("classList.add('com-abertura')"), 'index.html tem a capa creme antes do primeiro quadro');

// 1ª visita: a abertura roda e termina sozinha
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await humano(ctx);
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(BASE + '/');
  await p.waitForSelector('#abertura canvas', { timeout: 8000 });
  ok(await p.evaluate(() => document.documentElement.classList.contains('com-abertura')), 'abertura: página travada (com-abertura) enquanto roda');
  ok((await p.locator('#abertura .pular').count()) === 1, 'abertura: botão "Pular abertura"');
  await p.waitForSelector('#abertura', { state: 'detached', timeout: 12000 });
  ok(!(await p.evaluate(() => document.documentElement.classList.contains('com-abertura'))), 'abertura termina sozinha e libera a página');
  ok(await p.evaluate(() => sessionStorage.getItem('flow.abertura') === '1'), 'abertura marcada como vista na sessão');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  ok((await p.locator('#abertura').count()) === 0, '2ª carga na mesma sessão: sem abertura');
  ok(erros.length === 0, `sem erro de JavaScript na abertura (${erros.join(' | ')})`);
  await ctx.close();
}
// pular funciona e devolve o foco à página
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await humano(ctx);
  const p = await ctx.newPage();
  await p.goto(BASE + '/');
  await p.waitForSelector('#abertura .pular');
  await p.waitForTimeout(600);
  await p.locator('#abertura .pular').click();
  await p.waitForSelector('#abertura', { state: 'detached', timeout: 4000 });
  ok(true, 'abertura: "Pular" fecha em menos de 4 s (celular)');
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
    icones: document.querySelectorAll('.icone-flutuante, .icone-vitrine, #canvas-root, .num-fantasma').length,
    fio: !!document.querySelector('svg.fio .fio-linha[d]'),
    trabalhos: [...document.querySelectorAll('#trabalhos .trabalho')].map((t) => ({
      nome: t.querySelector('h3')?.innerText, url: t.querySelector('a.btn')?.href, imgs: t.querySelectorAll('img').length,
    })),
    nav: [...document.querySelectorAll('header .navlinks a')].map((a) => a.getAttribute('href')),
    logo: document.querySelector('header .marca-lockup img')?.getAttribute('src'),
  }));
  ok(d.icones === 0, 'sem ícones flutuantes, partículas nem números-fantasma');
  ok(d.fio, 'o fio está desenhado');
  ok(d.trabalhos.length === 8 && d.trabalhos.every((t) => t.url && t.imgs >= 2), `8 trabalhos com link e prints (${d.trabalhos.map((t) => t.nome).join(', ')})`);
  ok(d.nav.includes('#trabalhos') && !d.nav.includes('#vitrine'), 'menu leva a "Trabalhos"');
  ok(!/base44/i.test(await p.evaluate(() => document.querySelector('#trabalhos').innerText)), 'trabalhos: a plataforma não aparece em texto')
  ok(d.logo === '/midia/marca/maintor-lockup-claro.svg', 'cabeçalho com o lockup oficial');
  for (let i = 0; i < 8; i++) {
    const t = p.locator('#trabalhos .trabalho').nth(i);
    await t.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
    const w = await t.evaluate((el) => [...el.querySelectorAll('img.ativa, .tela-celular img:first-child, .tela-desktop img:first-child')].map((i) => { i.loading = 'eager'; return i.naturalWidth; }));
    await p.waitForTimeout(400);
    const w2 = await t.evaluate((el) => [...el.querySelectorAll('.tela-desktop img, .tela-celular img')].filter((i) => i.classList.contains('ativa') || i === i.parentElement.firstElementChild).every((i) => i.naturalWidth > 0));
    ok(w2, `trabalho ${i + 1}: prints carregam`);
  }
  for (const u of d.trabalhos.map((t) => t.url)) {
    const s = await fetch(u, { redirect: 'follow' }).then((r) => r.status).catch(() => 0);
    ok(s === 200, `no ar: ${u} (${s})`);
  }
  // o fio acompanha a rolagem
  const o1 = await p.evaluate(() => parseFloat(document.querySelector('.fio-linha').style.strokeDashoffset));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2)); await p.waitForTimeout(600);
  const o2 = await p.evaluate(() => parseFloat(document.querySelector('.fio-linha').style.strokeDashoffset));
  ok(o2 < o1, `o fio se desenha com a rolagem (${Math.round(o1)} → ${Math.round(o2)})`);
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
