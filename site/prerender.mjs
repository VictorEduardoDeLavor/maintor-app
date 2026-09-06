/* Pré-renderiza o HTML da home no build.
 *
 * Por quê: o conteúdo do site é montado por JavaScript. Crawler simples,
 * leitor de link e a primeira pintura viam só <div id="root"></div>.
 * Aqui o build sobe o preview, deixa o React montar, limpa o que é
 * puramente decorativo/estado de runtime e grava o HTML resultante dentro
 * do #root do dist/index.html.
 *
 * Não é hidratação: o React continua com createRoot e substitui o conteúdo
 * ao montar. O HTML estático serve a quem não executa JS e adianta o texto
 * na primeira pintura — sem risco de hydration mismatch (o app lê
 * matchMedia/innerWidth no primeiro render, o que quebraria hydrateRoot).
 *
 * Uso: npm run build (roda automaticamente depois do vite build).
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const INDEX = join(aqui, 'dist', 'index.html')
const PORTA = 4321
const CHROME = 'C:/Users/victo/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe'
const PLAYWRIGHT = 'file:///C:/Users/victo/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs'

if (!existsSync(INDEX)) {
  console.error('prerender: dist/index.html não existe — rode o build antes.')
  process.exit(1)
}

let chromium
try {
  ({ chromium } = await import(PLAYWRIGHT))
} catch {
  console.warn('prerender: Playwright indisponível — pulando (build segue válido).')
  process.exit(0)
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], {
  cwd: aqui, shell: true, stdio: 'ignore',
})
const encerrar = () => { try { preview.kill() } catch {} }
process.on('exit', encerrar)

await new Promise((r) => setTimeout(r, 4000))

let html = null
try {
  const navegador = await chromium.launch({ executablePath: CHROME })
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 } })
  await pagina.goto(`http://localhost:${PORTA}/`, { waitUntil: 'networkidle', timeout: 45000 })
  await pagina.waitForTimeout(3500) // fontes, preloader e primeiro reveal

  html = await pagina.evaluate(() => {
    const raiz = document.getElementById('root').cloneNode(true)

    // fora: só existem em runtime ou dependem de WebGL/áudio
    raiz.querySelectorAll('#canvas-root, #cursor, #grao, #preloader').forEach((n) => n.remove())

    // o GSAP deixa opacity/transform inline nos blocos ainda não revelados;
    // no HTML estático tudo precisa nascer visível e no lugar
    raiz.querySelectorAll('[style]').forEach((n) => {
      const s = n.getAttribute('style')
      if (/opacity|transform|visibility/.test(s)) {
        const limpo = s
          .split(';')
          .filter((d) => d && !/^\s*(opacity|transform|visibility|will-change)\s*:/.test(d))
          .join(';')
        limpo.trim() ? n.setAttribute('style', limpo) : n.removeAttribute('style')
      }
    })

    // o menu do celular nasce fechado
    const menu = raiz.querySelector('.menu-painel')
    if (menu) { menu.setAttribute('hidden', ''); menu.classList.remove('aberto') }

    return raiz.innerHTML
  })
  await navegador.close()
} catch (e) {
  console.warn('prerender: falhou (' + e.message.split('\n')[0] + ') — build segue válido.')
}

encerrar()

if (html) {
  const original = readFileSync(INDEX, 'utf8')
  const saida = original.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${html}</div>`,
  )
  if (saida === original) {
    console.warn('prerender: <div id="root"></div> não encontrado — nada injetado.')
  } else {
    writeFileSync(INDEX, saida)
    console.log(`prerender: ${Math.round(html.length / 1024)}KB de HTML injetados no dist/index.html`)
  }
}
