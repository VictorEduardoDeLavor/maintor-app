// Captura a landing "como um visitante vê": rola tela a tela, fotografa cada tela e devolve
// as fotos para costurar (seções presas/animadas por rolagem saem vazias num fullPage).
// Uso: node testes/capturar-pagina-inteira.mjs <pasta> <nome> <url> [telas]
import { mkdirSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs';
const [OUT, NOME, URL, TELAS = '10'] = process.argv.slice(2);
mkdirSync(`${OUT}/${NOME}`, { recursive: true });
const b = await chromium.launch({ executablePath: 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
for (const rx of [/s[óo] essenciais/i, /^recusar$/i, /rejeitar/i]) {
  const bt = p.getByRole('button', { name: rx }).first();
  if (await bt.isVisible().catch(() => false)) { await bt.click().catch(() => {}); break; }
}
await p.addStyleTag({ content: '[class*=cookie],[id*=cookie],[class*=consent]{display:none!important}' });
await p.waitForTimeout(1500);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let n = 0;
for (let y = 0; y < total && n < Number(TELAS); y += 900, n++) {
  // rola em passos pequenos até y (as animações por rolagem precisam ver o caminho)
  await p.evaluate(async (alvo) => { const ini = window.scrollY; for (let k = 1; k <= 6; k++) { window.scrollTo(0, ini + (alvo - ini) * k / 6); await new Promise((r) => setTimeout(r, 90)); } }, y);
  await p.waitForTimeout(900);
  if (n === 1) {
    // a partir da 2ª tela, cabeçalho e botões fixos saem (senão repetem em cada emenda)
    await p.evaluate(() => { for (const el of document.querySelectorAll('*')) { const s = getComputedStyle(el); if (s.position === 'fixed' && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; } });
    await p.waitForTimeout(200);
  }
  await p.screenshot({ path: `${OUT}/${NOME}/${String(n).padStart(2, '0')}.png` });
}
console.log('ok', NOME, n, 'telas de', total, 'px');
await b.close();
