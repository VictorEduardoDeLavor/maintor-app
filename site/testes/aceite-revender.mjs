// Aceite do pacote "sistema para revender" + /links/ v3 (22/10/2026).
// Uso: sirva o dist em :4175 (npx serve -l 4175 dist) e rode `node testes/aceite-revender.mjs`.
// Guardado no repo porque a bateria grande (575 itens) vivia numa pasta temporária e se perdeu.
import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs';

const BASE = process.env.BASE || 'http://localhost:4175';
const R = []; let falhas = 0;
const ok = (c, m) => { R.push((c ? 'OK  ' : 'FALHA ') + m); if (!c) falhas++; };

const NOVAS = [
  ['/sistema-para-revender/app-para-personal-trainer/', 'O seu método de treino num app — e outros personais pagando para usar.'],
  ['/sistema-para-revender/sistema-para-salao-de-beleza/', 'A agenda do seu salão num sistema seu — e os salões da região pagando para usar.'],
  ['/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/', 'Como ganhar dinheiro com um sistema do seu nicho — sem promessa e sem mágica.'],
];
const TODAS = [...NOVAS.map((n) => n[0]), '/sistema-para-revender/', '/sistemas-sob-medida/', '/links/', '/'];

const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(e.message));

// sitemap
const sm = await (await fetch(BASE + '/sitemap.xml')).text();
for (const [rota] of NOVAS) ok(sm.includes('https://maintorflow.com.br' + rota), `sitemap tem ${rota}`);
ok(!sm.includes('/links/'), 'sitemap sem /links/ (noindex)');

for (const [rota, h1] of NOVAS) {
  const r = await p.goto(BASE + rota, { waitUntil: 'networkidle' });
  ok(r.status() === 200, `${rota} responde 200`);
  const d = await p.evaluate(() => ({
    h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim(),
    nH1: document.querySelectorAll('h1').length,
    canon: document.querySelector('link[rel=canonical]')?.href,
    ogUrl: document.querySelector('meta[property="og:url"]')?.content,
    title: document.title,
    desc: document.querySelector('meta[name=description]')?.content || '',
    faqLd: (() => { for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const j = JSON.parse(s.textContent); if (j['@type'] === 'FAQPage') return j.mainEntity.length; } return -1; })(),
    bc: (() => { for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const j = JSON.parse(s.textContent); if (j['@type'] === 'BreadcrumbList') return j.itemListElement.at(-1).item; } return ''; })(),
    nFaq: document.querySelectorAll('.pg-faq details').length,
    was: [...document.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => decodeURIComponent(a.href.split('text=')[1] || '')),
    irmas: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    txt: document.body.innerText,
  }));
  ok(d.nH1 === 1 && d.h1 === h1, `${rota} h1 único e certo (${d.h1})`);
  ok(d.canon === 'https://maintorflow.com.br' + rota && d.ogUrl === d.canon && d.bc === d.canon, `${rota} canonical, og:url e breadcrumb apontam para a própria página`);
  ok(d.title.length > 20 && d.desc.length >= 120 && d.desc.length <= 230, `${rota} title e description (${d.desc.length} car.)`);
  ok(d.nFaq === 5 && d.faqLd === 5, `${rota} FAQ visível = FAQ no JSON-LD (${d.nFaq}/${d.faqLd})`);
  ok(d.was.length >= 3 && d.was.every((w) => w === d.was[0]) && !/p[aá]gina de sistema para revender\. Quero conversar sobre um sistema do meu nicho/.test(d.was[0]), `${rota} WhatsApp com mensagem própria (${d.was[0]})`);
  const outras = NOVAS.map((n) => n[0]).filter((x) => x !== rota).concat('/sistema-para-revender/');
  ok(outras.every((o) => d.irmas.includes(o)), `${rota} liga para as páginas irmãs`);
  ok(/não é promessa/i.test(d.txt), `${rota} exemplo de conta marcado como "não é promessa"`);
  ok(!/base44/i.test(d.txt) && !/Travessa Mensagem/.test(d.txt), `${rota} sem plataforma e sem endereço antigo no texto`);
  ok(!/\b\d+\s+peças\b/i.test(d.txt), `${rota} sem contagem de peças`);
  ok(!/App Store e no Google Play\?[\s\S]{0,40}Sim/i.test(d.txt), `${rota} não promete loja de apps`);
  const img = p.locator('img').first(); await img.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  ok((await img.evaluate((i) => i.naturalWidth)) > 0, `${rota} foto do topo carrega`);
}

// página-mãe: hub por nicho + Maintor FIT na prova
await p.goto(BASE + '/sistema-para-revender/', { waitUntil: 'networkidle' });
ok((await p.locator('#por-nicho a').count()) === 4, '/sistema-para-revender/ tem a seção "Por nicho" com 3 nichos + o link para consultorias');
ok((await p.locator('a[href="https://maintorfit.com"]').count()) >= 1, '/sistema-para-revender/ cita o Maintor FIT com link');
ok((await p.locator('.pg-faq details').count()) === 5, '/sistema-para-revender/ FAQ intacto');

// sistemas sob medida: FIT no lugar do cartão de automação, automação ainda linkada
await p.goto(BASE + '/sistemas-sob-medida/', { waitUntil: 'networkidle' });
ok((await p.locator('a[href="https://maintorfit.com"]').count()) === 1, '/sistemas-sob-medida/ tem o Maintor FIT');
ok((await p.locator('a[href="/automacao-de-atendimento/"]').count()) >= 1, '/sistemas-sob-medida/ ainda leva à automação');

// home: bloco do sistema para revender com os 4 caminhos
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
const hl = await p.evaluate(() => [...document.querySelectorAll('.sistema-revenda-links a')].map((a) => a.getAttribute('href')));
ok(hl.length === 4 && hl.includes('/sistema-para-revender/app-para-personal-trainer/') && hl.includes('/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/'), `home: bloco do sistema para revender com 4 links (${hl.length})`);

// /links/ v3
await p.goto(BASE + '/links/', { waitUntil: 'networkidle' });
const L = await p.evaluate(() => ({
  robots: document.querySelector('meta[name=robots]')?.content,
  h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim(),
  frentes: [...document.querySelectorAll('.frentes a')].map((a) => a.innerText),
  provas: [...document.querySelectorAll('.lista a[target=_blank]')].map((a) => a.href),
  nichos: [...document.querySelectorAll('.lista .nicho')].map((n) => n.innerText),
  novo: [...document.querySelectorAll('.novo a')].map((a) => a.getAttribute('href')),
  zap: document.querySelector('a.vidro.zap')?.href || '',
  vidro: (() => { const s = getComputedStyle(document.querySelector('a.vidro')); return (s.backdropFilter || s.webkitBackdropFilter || ''); })(),
  origem: sessionStorage.getItem('flow.origem'),
}));
ok(/noindex/.test(L.robots), '/links/ continua noindex');
ok(L.h1 === 'Sua loja, seu site, seu sistema — no seu nome.', `/links/ h1 (${L.h1})`);
ok(L.frentes.length === 9 && L.frentes.every((f) => !/R\$/.test(f)), `/links/ "O que a gente faz": 9 frentes, nenhum preço (${L.frentes.length})`);
ok(['vokewear.com.br', 'benditaacessorios.com', 'maintor.com.br', 'maintorfit.com'].every((d) => L.provas.some((u) => u.includes(d))), '/links/ provas: VOKE, Bendita, CMMS e FIT');
ok(L.nichos.length === 4, `/links/ provas separadas por nicho (${L.nichos.join(' | ')})`);
ok(L.novo.length === 5, '/links/ bloco Novo com 5 caminhos (inclui para consultorias)');
ok(L.zap.includes('wa.me/5511946610634') && /blur/.test(L.vidro), `/links/ botão do WhatsApp em vidro (${L.vidro})`);
ok(L.origem === 'instagram', '/links/ marca a origem instagram');
for (const u of ['https://vokewear.com.br', 'https://benditaacessorios.com', 'https://maintor.com.br', 'https://maintorfit.com']) {
  const s = await fetch(u, { redirect: 'follow' }).then((r) => r.status).catch(() => 0);
  ok(s === 200, `prova no ar: ${u} (${s})`);
}

// celular: sem rolagem lateral e alvos de toque ≥ 44px
const m = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
const pm = await m.newPage();
for (const rota of TODAS) {
  await pm.goto(BASE + rota, { waitUntil: 'networkidle' });
  const v = await pm.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    pequenos: [...document.querySelectorAll('main a, main button')].filter((a) => { const r = a.getBoundingClientRect(); const st = getComputedStyle(a); return r.width > 0 && st.display !== 'inline' && r.height < 44; }).map((a) => a.innerText.slice(0, 30)),
  }));
  ok(v.sw <= 375, `375px ${rota}: sem rolagem lateral (${v.sw})`);
  if (rota === '/links/' || NOVAS.some((n) => n[0] === rota)) ok(v.pequenos.length === 0, `375px ${rota}: alvos de toque ≥ 44px ${v.pequenos.join(' / ')}`);
}
await m.close();

ok(erros.length === 0, `sem erro de JavaScript (${erros.join(' | ')})`);

// guardas do deploy, no código-fonte
const fonte = TODAS.filter((r) => r !== '/').map((r) => readFileSync(new URL('..' + r + 'index.html', import.meta.url), 'utf8')).join('\n');
const b44 = (fonte.match(/[a-z0-9./:-]*base44[a-z0-9./-]*/gi) || []).filter((u) => !/^https:\/\/maintor-(rh|task)\.base44\.app$/.test(u));
ok(b44.length === 0, `fonte sem plataforma fora das 2 exceções (${b44.join(', ')})`);

await b.close();
console.log(R.join('\n'));
console.log(`\nRESUMO: ${R.length - falhas} ok · ${falhas} falhas`);
process.exit(falhas ? 1 : 0);
