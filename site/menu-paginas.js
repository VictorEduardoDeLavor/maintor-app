/* O MENU DO SITE e o PRÓXIMO PASSO nas páginas internas (15/11/2026) — entram em todas pelo build.
 *
 * Por que um plugin: são 23 páginas estáticas (sem React). Antes cada uma tinha um cabeçalho escrito à mão, com
 * dois links ("Início" + um vizinho) e a marca em texto. O transformIndexHtml do Vite roda em todas: o cabeçalho
 * de cada página é trocado pelo MESMO menu da home (src/menu.js) e, antes da chamada final, entra o bloco
 * "Veja funcionando" — os projetos do tour que provam aquele serviço e a página que costuma vir depois.
 * Página nova entra coberta sem ninguém lembrar.
 *
 * O que fica de cada página: o link do WhatsApp do cabeçalho antigo (cada página tem a sua mensagem pronta).
 * A home (index.html) e o /links/ (sem cabeçalho) não são tocados: a home desenha o menu em React.
 * Sem JavaScript os grupos são links comuns para a seção da home; com JavaScript abrem o painel.
 */
import { MENU, MENU_CONTATO, TRILHAS, WHATS_NUMERO } from './src/menu.js'

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function cabecalho(caminho, whats) {
  const aqui = (href) => (href === caminho ? ' aria-current="page"' : '')
  const grupos = MENU.map((g) => `<a class="nav-grupo" href="${g.href}" data-menu="${g.id}" aria-expanded="false" aria-controls="menu-secoes">${esc(g.rotulo)}<i aria-hidden="true"></i></a>`).join('')
  const painel = MENU.map((g) => `
      <section class="mega-grupo" data-grupo="${g.id}" aria-labelledby="mega-${g.id}">
        <p class="serif mega-titulo" id="mega-${g.id}"><a href="${g.href}">${esc(g.titulo)}</a></p>
        <div class="mega-colunas">${g.colunas.map((c) => `
          <div>
            <p class="micro mega-sub">${c.href ? `<a href="${c.href}">${esc(c.titulo)}</a>` : esc(c.titulo)}</p>
            <ul>${c.links.map((l) => `<li><a href="${l.href}"${aqui(l.href)}><b>${esc(l.rotulo)}</b>${l.nota ? `<span>${esc(l.nota)}</span>` : ''}</a></li>`).join('')}</ul>
          </div>`).join('')}
        </div>
      </section>`).join('')
  return `<header>
  <div class="wrap navrow">
    <a class="marca marca-lockup" href="/" aria-label="Maintor Flow — início"><img src="/midia/marca/maintor-lockup-claro.svg" alt="Maintor Flow" width="132" height="42"></a>
    <nav class="navlinks" aria-label="Menu principal">${grupos}<a href="${MENU_CONTATO.href}">${esc(MENU_CONTATO.rotulo)}</a></nav>
    <div style="display:flex;align-items:center;gap:var(--s3)">
      <a class="nav-cta" href="${whats}" target="_blank" rel="noopener">WhatsApp ↗</a>
      <button type="button" class="menu-btn" aria-expanded="false" aria-controls="menu-secoes"><span class="menu-traco" aria-hidden="true"></span><span class="sr-only">Abrir menu</span></button>
    </div>
  </div>
</header>
<div id="menu-secoes" class="menu-painel mega" hidden>
  <nav aria-label="Tudo o que existe no site" class="mega-grupos">${painel}
  </nav>
  <div class="menu-pe">
    <a class="btn menu-whats" href="${whats}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
    <a class="btn btn-fantasma" href="${MENU_CONTATO.href}">Conversar sobre meu projeto</a>
  </div>
</div>
<script>${ABRIR}</script>`
}

/* abre e fecha o painel: botão de menu (celular), grupos do cabeçalho (computador), Esc, clique num link ou no fundo */
const ABRIR = `(function () {
  var painel = document.getElementById('menu-secoes'), botao = document.querySelector('.menu-btn');
  if (!painel || !botao) return;
  var grupos = [].slice.call(document.querySelectorAll('.nav-grupo')), aberto = null;
  function pintar(id) {
    [].forEach.call(painel.querySelectorAll('.mega-grupo'), function (s) { s.classList.toggle('em-destaque', s.getAttribute('data-grupo') === id); });
    grupos.forEach(function (g) { g.setAttribute('aria-expanded', String(!!id && g.getAttribute('data-menu') === id)); });
  }
  function abrir(id) {
    aberto = id || 'tudo'; painel.hidden = false; botao.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; pintar(id);
    var alvo = id && painel.querySelector('[data-grupo="' + id + '"]');
    if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: 'nearest' });
    var primeiro = (alvo || painel).querySelector('a'); if (primeiro) primeiro.focus({ preventScroll: true });
  }
  function fechar(devolver) {
    if (!aberto) return; aberto = null; painel.hidden = true; botao.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; pintar(null);
    if (devolver) devolver.focus();
  }
  botao.addEventListener('click', function () { if (aberto) fechar(); else abrir(null); });
  grupos.forEach(function (g) { g.addEventListener('click', function (e) { e.preventDefault(); var id = g.getAttribute('data-menu'); if (aberto === id) fechar(); else abrir(id); }); });
  painel.addEventListener('click', function (e) { if (e.target === painel || (e.target.closest && e.target.closest('a'))) fechar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aberto) fechar(botao.offsetParent ? botao : grupos[0]); });
})();`

function trilha(caminho) {
  const t = TRILHAS[caminho]
  if (!t) return ''
  return `
  <section class="pg-secao pg-trilha" aria-label="Veja funcionando">
    <div class="wrap">
      <div class="regua"><span class="micro">Veja funcionando</span><span class="micro">Projetos no ar, no tour</span></div>
      <h2 class="serif pg-h2">O que está nesta página, <em>já no ar.</em></h2>
      <div class="trilha-links">${t.projetos.map((p) => `<a class="porta-btn" href="${p.href}">${esc(p.rotulo)} <i aria-hidden="true">→</i></a>`).join('')}</div>
      <p class="trilha-depois"><a class="link-mostarda" href="/#trabalhos">Fazer o tour completo →</a><a class="link-mostarda" href="${t.depois.href}">Depois desta página: ${esc(t.depois.rotulo)} →</a></p>
    </div>
  </section>
`
}

export function menuPaginas() {
  return {
    name: 'flow-menu-paginas',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const caminho = (ctx.path || '').replace(/index\.html$/, '')
        if (caminho === '/' || !html.includes('<body class="pagina"')) return html
        const m = html.match(/<header>[\s\S]*?<\/header>/)
        if (!m) return html
        const whats = (m[0].match(/class="nav-cta" href="([^"]+)"/) || [])[1] || `https://wa.me/${WHATS_NUMERO}`
        let saida = html.replace(m[0], cabecalho(caminho, whats))
        const bloco = trilha(caminho)
        if (bloco) {
          const k = saida.lastIndexOf('<section class="pg-cta"')
          saida = k >= 0 ? saida.slice(0, k) + bloco.trimStart() + '\n  ' + saida.slice(k) : saida.replace('</main>', bloco + '</main>')
        }
        return saida
      },
    },
  }
}
