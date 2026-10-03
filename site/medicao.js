/* Origem e medição do site — entra em TODAS as páginas pelo build.
 *
 * Por que um plugin e não colar a tag em cada HTML: o build tem 16 entradas
 * (home React + 15 páginas estáticas sem JS). O transformIndexHtml do Vite
 * roda em todas, e página nova entra coberta sem ninguém lembrar. O 404.html
 * é cópia do index (deploy-root.mjs), então também.
 *
 * Duas partes:
 *
 * 1. ORIGEM (sempre ligada, zero requisição externa). Quando a visita chega com
 *    ?utm_source=gbp|instagram|facebook|whatsapp, a origem fica guardada na aba
 *    (sessionStorage) e entra na mensagem pronta de QUALQUER link do WhatsApp:
 *    "Olá! Te achei no Google. Vim pela página de loja virtual...". Assim a
 *    conversa chega dizendo de onde veio — inclusive para quem usa bloqueador,
 *    que nenhuma analítica enxerga. O formulário da home usa a mesma função
 *    (window.__flowComOrigem) porque abre o WhatsApp por window.open.
 *
 * 2. UMAMI (só com o ID preenchido). Sem cookie, sem banner, sem dado pessoal.
 *    Sem o ID o plugin não injeta nada dessa parte. data-domains: só envia em
 *    maintorflow.com.br — prerender (localhost:4321), bateria de aceite
 *    (localhost:4175) e npm run dev não geram visita falsa.
 */
export const UMAMI_ID = process.env.UMAMI_ID || '' // Umami > Websites > Edit > Website ID

const ORIGEM = `(function () {
  var ROT = { gbp: 'Te achei no Google.', google: 'Te achei no Google.',
    instagram: 'Vim pelo Instagram.', ig: 'Vim pelo Instagram.',
    facebook: 'Vim pelo Facebook.', fb: 'Vim pelo Facebook.',
    whatsapp: 'Vim por um grupo do WhatsApp.' };
  var CHAVE = 'flow.origem';
  try {
    var u = new URLSearchParams(location.search).get('utm_source');
    if (u) sessionStorage.setItem(CHAVE, u.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40));
  } catch (e) {}
  function guardada() { try { return sessionStorage.getItem(CHAVE) || ''; } catch (e) { return ''; } }
  function comOrigem(t) {
    var r = ROT[guardada()];
    if (!r || t.indexOf(r) >= 0) return t;
    return /^Olá!/.test(t) ? t.replace(/^Olá!/, 'Olá! ' + r) : r + ' ' + t;
  }
  window.__flowOrigem = guardada;
  window.__flowComOrigem = comOrigem;
  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]');
      if (!a || !ROT[guardada()]) return;
      var partes = a.href.split('?');
      var texto = new URLSearchParams(partes[1] || '').get('text') || 'Olá!';
      a.href = partes[0] + '?text=' + encodeURIComponent(comOrigem(texto));
    } catch (err) {}
  }, true);
})();`

/* Conta clique em QUALQUER link wa.me + o envio do formulário da home. Não
 * impede nada: escuta em captura, não chama preventDefault, e se o Umami não
 * carregou (bloqueador, rede) só não mede. Nome e negócio digitados NUNCA são
 * enviados — só a página, a posição do botão, a origem e o objetivo do chip.
 * #nao-medir / #medir desligam e religam a medição no aparelho do Victor. */
const RASTREIO_WHATS = `(function () {
  try {
    if (location.hash === '#nao-medir') {
      localStorage.setItem('umami.disabled', '1');
      alert('Medição desligada neste navegador. Para religar: #medir');
    } else if (location.hash === '#medir') {
      localStorage.removeItem('umami.disabled');
      alert('Medição religada neste navegador.');
    }
  } catch (e) {}
  function posicao(el) {
    if (el.closest('.form-flow')) return 'formulario';
    if (el.closest('.menu-painel')) return 'menu';
    if (el.closest('header')) return 'topo';
    if (el.closest('footer')) return 'rodape';
    if (el.closest('.pg-hero, #topo')) return 'hero';
    if (el.closest('.pg-cta, #contato')) return 'cta-final';
    return 'meio';
  }
  function origem() {
    try {
      var g = window.__flowOrigem && window.__flowOrigem();
      if (g) return g;
      if (!document.referrer) return 'direto';
      var h = new URL(document.referrer).hostname;
      return h === location.hostname ? 'interno' : h;
    } catch (e) { return 'desconhecida'; }
  }
  function medir(el) {
    try {
      if (!window.umami || typeof window.umami.track !== 'function') return;
      var dados = { pagina: location.pathname, posicao: posicao(el), origem: origem() };
      var chip = el.querySelector && el.querySelector('.opcao.ativa');
      if (chip) dados.objetivo = chip.textContent.trim().slice(0, 60);
      window.umami.track('whatsapp', dados);
    } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (a) medir(a);
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.classList && f.classList.contains('form-flow')) medir(f);
  }, true);
})();`

export function medicao() {
  return {
    name: 'origem-e-medicao',
    transformIndexHtml(html, ctx) {
      const tags = [{ tag: 'script', children: ORIGEM, injectTo: 'head' }]
      if (!UMAMI_ID) return tags
      // trava: a página /sites/ promete 'nenhuma requisição a servidor de
      // terceiro'. Ligar o Umami sem trocar essa promessa deixaria o site
      // mentindo — então o build para até o texto ser atualizado (e o rodapé
      // ganhar o aviso 'conta visitas sem cookies e sem identificar quem visita').
      if (/requisição a servidor de terceiro|sem script de terceiro/.test(html)) {
        throw new Error(`Umami ligado, mas ${ctx.filename} ainda promete zero terceiros. Troque o texto antes.`)
      }
      return tags.concat([
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://cloud.umami.is/script.js',
            'data-website-id': UMAMI_ID,
            'data-domains': 'maintorflow.com.br',
            'data-exclude-hash': 'true',
          },
          injectTo: 'head',
        },
        { tag: 'script', children: RASTREIO_WHATS, injectTo: 'body' },
      ])
    },
  }
}
