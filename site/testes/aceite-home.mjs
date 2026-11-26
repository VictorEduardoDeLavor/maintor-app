// Aceite da home reformulada (27/10/2026): abertura 3D, o fio e os trabalhos no ar.
// 10/11/2026: home virou portfólio comercial — oferta na abertura, Ala 01 em dois grupos, 7 portas, contato simplificado.
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
ok((estatico.match(/class="obra( obra-dir)?"/g) || []).length === 21, `prerender com as 21 obras (${(estatico.match(/class="obra( obra-dir)?"/g) || []).length})`);
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
      id: t.id, ala: t.closest('section')?.id, img: t.dataset.img, url: t.querySelector('a.btn')?.href, titulo: t.querySelector('h3, h4')?.innerText, // 10/11: na Ala 01 o card é h4 (o h3 é o grupo)
    })),
    nav: [...document.querySelectorAll('header .navlinks a')].map((a) => a.getAttribute('href')),
    logo: document.querySelector('header .marca-lockup img')?.getAttribute('src'),
  }));
  ok(d.icones === 0, 'sem ícones flutuantes nem números-fantasma');
  ok(d.fio || !!(await p.evaluate(() => document.querySelector('#canvas-root canvas'))), 'o fio está desenhado (ou a exposição 3D está montada)');
  ok(d.obras.length === 21 && d.obras.every((o) => o.url && o.img && o.titulo), `21 obras com quadro, título e link (${d.obras.length})`);
  ok(d.obras.filter((o) => o.ala === 'trabalhos').length === 9 && d.obras.filter((o) => o.ala === 'problemas').length === 7, 'ala trabalhos com 9 obras (seleção) e ala de soluções com 7 portas');
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
    porta: [...document.querySelectorAll('#problemas button.porta-btn')].some((b) => /Digitalizar minha consultoria/.test(b.innerText)),
    menu: !!document.querySelector('#menu-secoes a[href="/para-consultorias/"]'),
    contato: !!document.querySelector('footer a[href="/para-consultorias/"]'), // 10/11: o catálogo foi para o rodapé
  }));
  ok(h.card && h.contato && h.porta && h.menu, 'home: porta "Digitalizar minha consultoria", cartão, menu e serviço no rodapé');
  ok((await p.locator('#topo h1').count()) === 1, 'entrada com um único h1');
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
// 05/11 (v3): o letreiro no lugar da faixa, o saguão com portas e as salas · 15/11: o boneco recebe e o balão dele começa o tour
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  const e0 = await p.evaluate(() => ({ marquee: !!document.querySelector('.marquee'), pergunta: document.querySelectorAll('#topo .hero-chip, #topo .pergunta-painel, #topo .pergunta-gatilho').length, texto: document.querySelector('#topo').innerText }));
  ok(!e0.marquee, 'com 3D, a faixa de serviços sai do site (corre no letreiro dentro da exposição)');
  ok(e0.pergunta === 0 && !/Qual é o seu problema/i.test(e0.texto), 'abertura sem a placa nem a lista "Qual é o seu problema?"');
  // o boneco recebe: de pé, na abertura, com o balão de fala à vista (posição lida do 3D)
  await p.waitForTimeout(1500);
  const rec = await p.evaluate(() => {
    const s = window.__expoSonda(), v = new s.T.Vector3()
    const tela = (o) => { o.getWorldPosition(v); v.project(s.cam); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight } }
    return { boneco: tela(s.guia.raiz), balao: tela(s.balao), balaoVisivel: s.balao.visible, escala: s.guia.raiz.scale.x }
  });
  ok(rec.balaoVisivel && rec.escala > 0.9 && rec.boneco.x > 720 && rec.boneco.x < 1400 && rec.boneco.y > 450 && rec.boneco.y < 900, `o boneco recebe na abertura, à direita do texto (x ${Math.round(rec.boneco.x)}, y ${Math.round(rec.boneco.y)}), com o balão de fala`);
  await p.mouse.click(rec.balao.x, rec.balao.y); await p.waitForTimeout(4200);
  ok(await p.evaluate(() => !!document.querySelector('#obra-matuura.em-foco')), 'clicar no balão do boneco começa o tour: o primeiro projeto chega em leitura');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
  const portas = await p.evaluate(() => [...document.querySelectorAll('#problemas button.porta-btn')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()));
  ok(portas.length === 7 && portas[0] === '01 Vender online' && portas[2] === '03 Atrair novos clientes', `saguão da Ala 2 com 7 portas, na ordem nova (${portas.join(' | ')})`);
  const outro = await p.evaluate(() => { const a = document.querySelector('#problemas a.porta-outro'); return a ? decodeURIComponent(a.href) : '' });
  ok(/wa\.me\/5511946610634/.test(outro) && /um projeto que não está na lista do site/.test(outro), 'saída "Meu caso é outro" abre o WhatsApp com o assunto');
  const passos = await p.evaluate(() => [...document.querySelectorAll('#problemas .ala-passos b')].map((b) => b.textContent));
  ok(JSON.stringify(passos) === JSON.stringify(['Conversa', 'Proposta', 'No ar']), `Ala 02 com os três passos (${passos.join(' → ')})`);
  await p.locator('#problemas button.porta-btn').nth(3).click(); await p.waitForTimeout(1200);
  const s1 = await p.evaluate(() => ({ painel: document.querySelector('.sala-painel')?.innerText || '', trava: document.documentElement.style.overflow, guia: document.querySelector('.guia')?.classList.contains('guia-on') || false, emSala: document.documentElement.classList.contains('em-sala') }));
  ok(/Porta 04 de 07/i.test(s1.painel) && /atendimento/i.test(s1.painel) && /O que a gente constrói/.test(s1.painel) && s1.trava === 'hidden' && !s1.guia && s1.emSala, `porta 04 leva à sala de atendimento, com a página parada e o corredor escondido (${JSON.stringify({ ...s1, painel: s1.painel.slice(0, 60) })})`);
  const zapSala = decodeURIComponent(await p.evaluate(() => document.querySelector('.sala-painel a.btn').href));
  ok(/wa\.me\/5511946610634/.test(zapSala) && /portfólio da Maintor Flow e quero conversar sobre automatizar o atendimento\./.test(zapSala), 'a sala abre o WhatsApp comercial com o objetivo da porta');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900);
  ok(/Porta 05 de 07/i.test(await p.evaluate(() => document.querySelector('.sala-painel')?.innerText || '')), 'seta → passa para a porta seguinte sem voltar ao corredor');
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  const s2 = await p.evaluate(() => ({ painel: !!document.querySelector('.sala-painel'), trava: document.documentElement.style.overflow, emSala: document.documentElement.classList.contains('em-sala') }));
  ok(!s2.painel && s2.trava === '' && !s2.emSala, 'Esc volta ao saguão e devolve a rolagem');
  ok(erros.length === 0, `saguão e salas sem erro de JavaScript (${erros.join(' | ')})`);
  await ctx.close();
  // sem 3D: a faixa volta, as opções aparecem direto e a porta leva até a obra da dor
  const ctxR = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const pr = await ctxR.newPage(); await pr.goto(BASE + '/', { waitUntil: 'networkidle' }); await pr.waitForTimeout(800);
  const r0 = await pr.evaluate(() => ({ marquee: !!document.querySelector('.marquee'), tour: [...document.querySelectorAll('#topo .entrada-ctas a')].some((a) => /Começar o tour/.test(a.innerText)) }));
  ok(r0.marquee && r0.tour, 'sem 3D: faixa de serviços visível e o convite para o tour na abertura');
  await pr.locator('#problemas button.porta-btn').nth(3).click(); await pr.waitForTimeout(900);
  const topo = await pr.evaluate(() => document.getElementById('obra-p-atend').getBoundingClientRect().top);
  ok(Math.abs(topo) < 200 && !(await pr.locator('.sala-painel').count()), `sem 3D: a porta leva até a obra da dor (topo ${Math.round(topo)})`);
  await ctxR.close();
}
// 05/11: guia da exposição — aparece no passeio, anda de obra em obra, WhatsApp com a obra
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  ok(!(await p.evaluate(() => document.querySelector('.guia')?.classList.contains('guia-on'))), 'guia escondido na entrada');
  await p.evaluate(() => { const el = document.getElementById('obra-bendita'); window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + el.offsetHeight / 2 - innerHeight / 2); }); await p.waitForTimeout(900);
  const g1 = await p.evaluate(() => ({ on: document.querySelector('.guia').classList.contains('guia-on'), titulo: document.querySelector('.guia-onde b').innerText, pontos: document.querySelectorAll('.guia-ponto').length, zap: decodeURIComponent(document.querySelector('.guia-quero').href) }));
  ok(g1.on && g1.titulo === 'Bendita Acessórios' && g1.pontos === 21, `guia aparece no passeio e diz onde estou (${g1.titulo}, ${g1.pontos} pontos)`);
  ok(/Bendita Acessórios/.test(g1.zap) && /Vim pelo portfólio da Maintor Flow/.test(g1.zap), '"Quero algo assim" leva a obra na mensagem do WhatsApp');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(2600);
  const t2 = await p.evaluate(() => document.querySelector('.guia-onde b').innerText);
  ok(t2 === 'Studio TechTrainer', `seta → anda para a próxima obra (${t2})`);
  await p.locator('.guia-seta[aria-label="Próxima obra"]').click(); await p.waitForTimeout(2600);
  ok((await p.evaluate(() => document.querySelector('.guia-onde b').innerText)) === 'Alves & Oliveira Odontologia', 'botão › anda para a próxima obra');
  await p.evaluate(() => document.getElementById('contato').scrollIntoView()); await p.waitForTimeout(900);
  ok(!(await p.evaluate(() => document.querySelector('.guia').classList.contains('guia-on'))), 'guia some no fim do passeio');
  await ctx.close();
}
// 10/11: portfólio comercial — abertura, grupos, menu, mensagens, metadados, FAQ e títulos
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  // nenhum WhatsApp é aberto de verdade: o window.open vira um registro
  await ctx.addInitScript(() => { window.__abertos = []; window.open = (u) => { window.__abertos.push(u); return null } });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const d = await p.evaluate(() => ({
    h1: document.querySelector('#topo h1')?.innerText.replace(/\s+/g, ' ').trim(),
    apoio: document.querySelector('#topo .entrada-apoio')?.innerText.replace(/\s+/g, ' ').trim(),
    ctas: [...document.querySelectorAll('#topo .entrada-ctas a')].map((a) => [a.innerText.trim(), a.getAttribute('href')]),
    menu: [...document.querySelectorAll('header .navlinks a')].map((a) => [a.textContent.trim(), a.getAttribute('href')]),
    painel: { grupos: [...document.querySelectorAll('#menu-secoes .mega-titulo')].map((h) => h.textContent.trim()), links: [...document.querySelectorAll('#menu-secoes .mega-colunas li a')].map((a) => a.getAttribute('href')) },
    ordem: [...document.querySelectorAll('#trabalhos article.obra')].map((a) => a.id.replace('obra-', '')),
    grupos: [...document.querySelectorAll('#trabalhos .obra-grupo')].map((g) => [g.id, g.querySelector('h3')?.textContent.trim()]),
    selos: [...document.querySelectorAll('#trabalhos article.obra .obra-legenda > .micro')].map((s) => s.textContent.trim().toLowerCase()),
    secoes: [...document.querySelectorAll('main#conteudo > section')].map((s) => s.id),
    titulos: [...document.querySelectorAll('h1, h2, h3, h4')].filter((h) => !h.closest('.sala-painel')).map((h) => +h.tagName[1]),
    regua: [...document.querySelectorAll('#como .regua .micro')].map((m) => m.textContent.trim()),
    faq: document.querySelectorAll('#perguntas details').length,
    faqLd: (() => { for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const j = JSON.parse(s.textContent); if (j['@type'] === 'FAQPage') return j.mainEntity.map((q) => q.name); } return [] })(),
    faqVis: [...document.querySelectorAll('#perguntas summary')].map((s) => s.textContent.trim()),
    contatoH2: document.querySelector('#contato h2')?.textContent.replace(/\s+/g, ' ').trim(),
    opcoes: [...document.querySelectorAll('#contato .opcao')].map((o) => o.textContent.trim()),
    servicosNoContato: document.querySelectorAll('#contato .servicos-lista').length,
    rodape: document.querySelectorAll('footer .rodape-servicos a').length,
    meta: {
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content,
      ogt: document.querySelector('meta[property="og:title"]')?.content,
      ogd: document.querySelector('meta[property="og:description"]')?.content,
      ogi: document.querySelector('meta[property="og:image"]')?.content,
      canon: document.querySelector('link[rel=canonical]')?.href,
    },
  }));
  ok(d.h1 === 'Sites, lojas virtuais e sistemas sob medida', `abertura: título da oferta (${d.h1})`);
  ok(/^Quem constrói é quem atende/.test(d.apoio || '') && /projetos que já estão no ar/.test(d.apoio || ''), 'abertura: texto de apoio convida para o tour');
  ok(JSON.stringify(d.ctas) === JSON.stringify([['Começar o tour', '#trabalhos'], ['Conversar sobre meu projeto', '#contato']]), `abertura: as duas ações e destinos (${JSON.stringify(d.ctas)})`);
  const MENU = [['Projetos', '#trabalhos'], ['O que fazemos', '#problemas'], ['Marketing', '#marketing'], ['Guias', '/guias/'], ['Contato', '#contato']];
  ok(JSON.stringify(d.menu) === JSON.stringify(MENU), `menu do cabeçalho: ${d.menu.map((m) => m[0]).join(', ')}`);
  // o painel do menu: quatro grupos e todas as páginas do site (nenhuma fica escondida)
  const PAGINAS = ['/casos/voke-wear/', '/loja-virtual/', '/loja-no-instagram/', '/loja-virtual-moda-fitness/', '/sites/', '/site-para-clinica-odontologica/', '/automacao-de-atendimento/', '/sistemas-sob-medida/', '/para-consultorias/', '/manutencao-mensal/', '/sistema-para-revender/', '/sistema-para-revender/app-para-personal-trainer/', '/sistema-para-revender/sistema-para-salao-de-beleza/', '/marketing-e-redes/', '/trafego-pago/', '/videos-personalizados/', '/por-onde-comecar/', '/guias/', '/guias/quanto-custa-uma-loja-virtual/', '/guias/loja-propria-ou-plataforma-pronta/', '/guias/se-o-desenvolvedor-sumir/', '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/'];
  const foraDoMenu = PAGINAS.filter((x) => !d.painel.links.includes(x));
  ok(d.painel.grupos.length === 4 && foraDoMenu.length === 0, `painel do menu com 4 grupos e as ${PAGINAS.length} páginas do site (${d.painel.links.length} links)${foraDoMenu.length ? ' — fora: ' + foraDoMenu.join(', ') : ''}`);
  const projetosNoMenu = ['matuura', 'trdd', 'besten', 'voke', 'bendita', 'techtrainer', 'ao', 'sorria', 'cmms'].filter((x) => !d.painel.links.includes('#obra-' + x));
  ok(projetosNoMenu.length === 0, `os 9 projetos da seleção estão no menu ${projetosNoMenu.join(', ')}`);
  ok(JSON.stringify(d.secoes) === JSON.stringify(['topo', 'trabalhos', 'problemas', 'sistemas', 'marketing', 'como', 'perguntas', 'contato']), `ordem da página: ${d.secoes.join(' → ')}`);
  ok(JSON.stringify(d.ordem) === JSON.stringify(['matuura', 'trdd', 'besten', 'voke', 'bendita', 'techtrainer', 'ao', 'sorria', 'cmms']), `Ala 01 na ordem: ${d.ordem.join(', ')}`);
  ok(JSON.stringify(d.grupos) === JSON.stringify([['site-e-gestao', 'Site com gestão'], ['lojas-virtuais', 'Lojas virtuais'], ['sites', 'Sites que geram contato'], ['sistemas-e-aplicativos', 'Sistemas e aplicativos']]), 'Ala 01 com os quatro grupos visíveis, por tipo de projeto');
  ok(d.selos.slice(0, 7).every((s) => s === 'projeto para cliente') && d.selos.slice(7).every((s) => s === 'produto da maintor'), 'cada card diz se é projeto de cliente ou produto da Maintor');
  ok(d.titulos[0] === 1 && d.titulos.every((n, i) => i === 0 || n <= d.titulos[i - 1] + 1), `títulos sem pular nível (${d.titulos.join('')})`);
  ok(d.regua[0] === 'Como trabalhamos', 'processo identificado como "Como trabalhamos"');
  ok(d.faq === 7 && JSON.stringify(d.faqLd) === JSON.stringify(d.faqVis), 'FAQ: 7 perguntas, JSON-LD igual ao visível');
  ok(d.contatoH2 === 'Conte o que você quer colocar no ar' && JSON.stringify(d.opcoes) === JSON.stringify(['Site ou loja', 'Sistema', 'Marketing', 'Ainda estou definindo']), 'contato: título e as quatro opções');
  ok(d.servicosNoContato === 0 && d.rodape >= 11, `catálogo de serviços no rodapé (${d.rodape} links)`);
  ok(d.meta.title === 'Maintor Flow | Portfólio de sites, lojas e sistemas' && d.meta.ogt === d.meta.title, 'title e og:title novos');
  ok(/^Conheça lojas virtuais, sites e sistemas/.test(d.meta.desc) && d.meta.ogd === d.meta.desc, 'description e og:description novas');
  ok(d.meta.canon === 'https://maintorflow.com.br/' && /^https:\/\/maintorflow\.com\.br\/midia\/og-portfolio\.jpg$/.test(d.meta.ogi), 'canonical mantida e og:image absoluta');
  ok((await fetch(BASE + '/midia/og-portfolio.jpg')).status === 200, 'a imagem de compartilhamento existe no build');
  // "Começar o tour" leva ao primeiro projeto, em posição de leitura, com a barra do guia
  await p.locator('#topo .entrada-ctas a', { hasText: 'Começar o tour' }).click(); await p.waitForTimeout(4200);
  const tour = await p.evaluate(() => ({ foco: !!document.querySelector('#obra-matuura.em-foco'), guia: document.querySelector('.guia')?.classList.contains('guia-on') }));
  ok(tour.foco && tour.guia, '"Começar o tour" leva ao primeiro projeto em leitura, com a barra do guia');
  // links de compatibilidade e atalho para clientes
  const faltam = []
  for (const id of ['trabalhos', 'problemas', 'sistemas', 'marketing', 'como', 'perguntas', 'contato', 'projetos-clientes', 'produtos-maintor', 'site-e-gestao', 'lojas-virtuais', 'sites', 'sistemas-e-aplicativos']) {
    if (!(await p.evaluate((x) => !!document.getElementById(x), id))) faltam.push(id);
  }
  ok(faltam.length === 0, `âncoras antigas e novas existem ${faltam.join(', ')}`);
  // formulário: mensagem e número certos, sem enviar nada
  await p.evaluate(() => document.getElementById('contato').scrollIntoView()); await p.waitForTimeout(600);
  await p.locator('#contato .opcao', { hasText: 'Sistema' }).click();
  await p.fill('#campo-nome', 'Teste');
  await p.locator('#contato button[type=submit]').click(); await p.waitForTimeout(300);
  const aberto = decodeURIComponent((await p.evaluate(() => window.__abertos[0])) || '');
  ok(/^https:\/\/wa\.me\/5511946610634\?text=Olá! Vim pelo portfólio da Maintor Flow e quero conversar sobre um sistema\. Meu nome é Teste\.$/.test(aberto), `formulário: WhatsApp comercial com o objetivo (${aberto})`);
  ok(erros.length === 0, `portfólio sem erro de JavaScript (${erros.join(' | ')})`);
  await ctx.close();
  const md = await (await fetch(BASE + '/index.md')).text();
  ok(/Portfólio de sites, lojas e sistemas/.test(md) && md.indexOf('Ala 01') < md.indexOf('Ala 02') && md.indexOf('Ala 04') < md.indexOf('Como trabalhamos'), '/index.md com a nova ordem');
  ok(!/base44/i.test(md), '/index.md sem o nome da plataforma');
}
// 10/11: celular — abertura legível, descrição inteira nos cards, atalho visível
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const m = await p.evaluate(() => {
    const vis = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 };
    return {
      h1: vis(document.querySelector('#topo h1')), cta: vis(document.querySelector('#topo .entrada-ctas .btn')),
      ctaDentro: [...document.querySelectorAll('#topo .entrada-ctas .btn')].every((x) => x.getBoundingClientRect().right <= innerWidth),
      clamp: [...document.querySelectorAll('.obra-legenda > p')].filter((x) => { const c = getComputedStyle(x).webkitLineClamp; return c && c !== 'none' }).length,
      largura: document.documentElement.scrollWidth,
    };
  });
  ok(m.h1 && m.cta && m.ctaDentro, '375px: título e ação principal na primeira tela, sem sair da largura');
  ok(m.clamp === 0, `375px: descrições dos cards sem corte (${m.clamp} cortadas)`);
  ok(m.largura <= 375, `375px: sem rolagem lateral (${m.largura})`);
  await ctx.close();
}
// 10/11: vídeos de clientes — só a capa carrega; o player abre no clique e fecha no Esc
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  const pedidos = []; p.on('request', (r) => { if (/\.mp4/.test(r.url())) pedidos.push(r.url()) });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  await p.evaluate(() => { const el = document.getElementById('obra-m-video'); window.scrollTo(0, scrollY + el.getBoundingClientRect().top + el.offsetHeight / 2 - innerHeight / 2) }); await p.waitForTimeout(1500);
  const v0 = await p.evaluate(() => ({ capas: document.querySelectorAll('#obra-m-video .video-capa').length, videos: document.querySelectorAll('video[src*="techtrainer"], video[src*="bendita"]').length }));
  ok(v0.capas === 2 && v0.videos === 0 && pedidos.filter((u) => /techtrainer|bendita/.test(u)).length === 0, `vídeos: 2 capas e nenhum vídeo baixado antes do clique (${v0.capas} capas)`);
  await p.locator('#obra-m-video .video-capa').first().click(); await p.waitForTimeout(1200);
  const v1 = await p.evaluate(() => { const d = document.querySelector('.video-dialogo'); const v = d?.querySelector('video'); return { aberto: !!d?.open, src: v?.getAttribute('src'), controles: v?.controls } });
  ok(v1.aberto && v1.src === '/midia/video/techtrainer-como-chegar.mp4' && v1.controles, 'clicar na capa abre o player com o vídeo do TechTrainer');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => document.querySelector('.video-dialogo').open)) && (await p.evaluate(() => document.querySelectorAll('.video-dialogo video').length)) === 0, 'Esc fecha o player e o vídeo sai da página');
  for (const u of ['/midia/video/techtrainer-como-chegar.mp4', '/midia/video/bendita-comercial.mp4', '/midia/video/techtrainer-como-chegar-capa.webp', '/midia/video/bendita-comercial-capa.webp']) {
    const s = (await fetch(BASE + u, { method: 'HEAD' })).status; if (s !== 200) ok(false, `${u} responde ${s}`);
  }
  ok(true, 'vídeos e capas servidos');
  ok(erros.length === 0, `vídeos sem erro de JavaScript (${erros.join(' | ')})`);
  await ctx.close();
}
// 10/11: o boneco do Victor no lugar da bolinha — anda com a rolagem; a folha de referência não é publicada
{
  const { existsSync, readdirSync } = await import('node:fs');
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const z0 = await p.evaluate(() => window.__guia ? window.__guia.position.z : null);
  await p.evaluate(() => { const el = document.getElementById('obra-bendita'); window.scrollTo(0, scrollY + el.getBoundingClientRect().top) }); await p.waitForTimeout(2500);
  const g = await p.evaluate(() => ({ z: window.__guia?.position.z, malhas: (() => { let n = 0; window.__guia?.traverse((o) => { if (o.isMesh) n++ }); return n })(), escala: window.__guia?.scale.x, comp: !!window.__companheiro?.visivel(), compEl: document.querySelector('.companheiro.on canvas') ? document.querySelector('.companheiro').getBoundingClientRect().toJSON() : null }));
  ok(z0 !== null && g.z < z0 - 1, `boneco anda pelo corredor com a rolagem (z ${z0?.toFixed(1)} → ${g.z?.toFixed(1)})`);
  // 26/11: depois da abertura o boneco do corredor sai e quem acompanha é o companheiro, num canto fixo da tela
  ok(g.malhas > 30 && g.malhas <= 60 && g.escala < 0.05, `boneco montado (${g.malhas} peças) e fora do corredor depois da abertura (escala ${g.escala?.toFixed(2)})`);
  ok(g.comp && g.compEl && g.compEl.height >= 200 && g.compEl.left < 1440 && g.compEl.right > 0 && g.compEl.top >= 60 && g.compEl.bottom <= 900, `companheiro visível na tela durante o passeio (${Math.round(g.compEl?.height)} px de altura)`);
  ok(erros.length === 0, `boneco sem erro de JavaScript (${erros.join(' | ')})`);
  const dist = new URL('../dist/', import.meta.url);
  const nomes = []; const andar = (u) => { for (const n of readdirSync(u, { withFileTypes: true })) { if (n.isDirectory()) andar(new URL(n.name + '/', u)); else nomes.push(n.name) } }; andar(dist);
  ok(!existsSync(new URL('testes/', dist)) && !nomes.some((n) => /folha-tecnica|boneco.*\.(webp|png|jpe?g)$/i.test(n)), 'a folha de referência do boneco não entra no site publicado');
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
