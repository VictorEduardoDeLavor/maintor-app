// Captura os projetos NO AR para o portfólio da home (desktop 1440x900 @1x e celular 390x844 @2x).
// Saída em PNG numa pasta de trabalho; a conversão para webp é feita depois.
// Uso: node testes/capturar-portfolio.mjs <pasta-de-saida>
import { mkdirSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const SO = process.argv[3]; // opcional: capturar só um projeto
const HD = process.argv.includes('--hd'); // desktop em 2x (2880×1800) para os quadros da exposição
const SITES = [
  ['voke', 'https://vokewear.com.br'],
  ['bendita', 'https://benditaacessorios.com'],
  ['cmms-site', 'https://maintor.com.br'],
  ['fit-site', 'https://maintorfit.com'],
  ['besten-site', 'https://besten-site.vercel.app'],
  ['horaqui-site', 'https://www.horaqui.com.br'],
];
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
for (const [nome, url] of SITES.filter(([n]) => !SO || SO === '--hd' || n === SO)) {
  for (const [sufixo, opts] of (HD ? (a) => a.slice(0, 1) : (a) => a)([
    ['desktop', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: HD ? 2 : 1 }],
    ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ])) {
    const ctx = await b.newContext({ ...opts, locale: 'pt-BR' });
    const p = await ctx.newPage();
    try {
      await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) { console.log('aviso', nome, sufixo, e.message.split('\n')[0]); }
    // fecha o aviso de cookies escolhendo a opção mais restritiva (só essenciais / recusar)
    for (const rx of [/s[óo] essenciais/i, /^recusar$/i, /rejeitar/i]) {
      const bt = p.getByRole('button', { name: rx }).first();
      if (await bt.isVisible().catch(() => false)) { await bt.click().catch(() => {}); await p.waitForTimeout(400); break; }
    }
    // fecha banners de cookie/aviso que cobrem a vitrine, sem aceitar nada
    await p.addStyleTag({ content: '[class*=cookie],[id*=cookie],[class*=Cookie],[class*=consent],[id*=consent]{display:none!important}' }).catch(() => {});
    await p.evaluate(async () => { window.scrollTo(0, 600); await new Promise((r) => setTimeout(r, 700)); window.scrollTo(0, 0); }).catch(() => {});
    await p.waitForTimeout(2500);
    // o aviso de cookies de algumas lojas aparece com atraso: segunda passada
    for (const rx of [/s[óo] essenciais/i, /^recusar$/i, /rejeitar/i]) {
      const bt = p.getByRole('button', { name: rx }).first();
      if (await bt.isVisible().catch(() => false)) { await bt.click().catch(() => {}); await p.waitForTimeout(600); break; }
    }
    await p.screenshot({ path: `${OUT}/${nome}-${sufixo}.png` });
    console.log('ok', nome, sufixo, await p.title());
    await ctx.close();
  }
}
await b.close();
