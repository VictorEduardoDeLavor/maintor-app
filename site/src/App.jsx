import { Fragment, useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { blipHover, alternarAmbiente, modularPorScroll } from './audio.js'
import { CarrosselDepoimentos, CarrosselTelas } from './Carrosseis.jsx'
import { depoimentos, telas } from './dados.js'

// three.js só baixa quando a abertura vai rodar — não pesa a home de quem já viu
const ABERTURA_CHAVE = 'flow.abertura' // o mesmo nome no index.html
import Fio from './Fio.jsx'
// a exposição 3D (home como galeria) baixa depois do primeiro paint
const Exposicao = lazy(() => import('./Exposicao.jsx'))
import { ALAS, imagemHD } from './obras.js'
import Guia from './Guia.jsx'

/* A abertura 3D roda uma vez por sessão. Fica de fora para quem pede
   movimento reduzido, para robôs (navigator.webdriver: o prerender e os
   testes) e quando o link aponta direto para uma seção (#contato etc.). */
function deveAbrir() {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (navigator.webdriver) return false
    if (location.hash.length > 1) return false
    return !sessionStorage.getItem(ABERTURA_CHAVE)
  } catch { return false }
}

gsap.registerPlugin(ScrollTrigger)

const WHATS_NUM = 'https://wa.me/5511946610634'
// token do site no CRM Maintor Leads (público por desenho: só cria/atualiza lead, com limite por IP)
const CRM_TOKEN = '2l-UaqQnRhF-oi_S6oDqgVSZxFJKyj5kU78QpVGMbuw'
// todo link do WhatsApp abre com a mensagem pronta: a conversa chega dizendo
// que veio do site (e de onde, quando a visita trouxe utm_source — ver medicao.js)
const WHATS = `${WHATS_NUM}?text=${encodeURIComponent('Olá! Vim pelo site da Maintor Flow.')}`

const SECOES = [
  { href: '#problemas', rotulo: 'Seu problema' },
  { href: '#trabalhos', rotulo: 'Trabalhos' },
  { href: '#sistemas', rotulo: 'Sistemas' },
  { href: '#marketing', rotulo: 'Marketing' },
  { href: '#contato', rotulo: 'Contato' },
]

/* A narrativa da home começa pelo problema de quem visita, não pelo nosso
   catálogo: cada cartão é uma dor dita do jeito que o dono diz, e a solução
   que a gente constrói para ela. As fotos mostram o mundo do visitante
   (ambientes, sem pessoas e sem tela falsa — regra de marca de 25/08). */
const PROBLEMAS = [
  {
    area: 'Lojas de moda e varejo',
    dor: 'Vendo pelo direct e não dou conta de responder todo mundo.',
    solucao: 'Uma loja virtual que mostra o tamanho, cobra no Pix e calcula o frete sozinha. Pagamento único, sem mensalidade.',
    href: '/loja-virtual/', rotulo: 'Ver a loja virtual',
    foto: 'loja-moda', alt: 'Loja de moda com arara de roupas coloridas e sacolas de papel no balcão, ao fim da tarde',
  },
  {
    area: 'Atendimento',
    dor: 'Respondo as mesmas perguntas o dia inteiro no WhatsApp.',
    solucao: 'Automação que responde o que se repete, confirma pedido e só chama você quando precisa de você.',
    href: '/automacao-de-atendimento/', rotulo: 'Ver a automação',
    foto: 'balcao-pedidos', alt: 'Balcão à noite com celular, bloco de pedidos anotados à mão e pacotes prontos para envio',
  },
  {
    area: 'Indústria e manutenção',
    dor: 'A manutenção das máquinas vive em caderno e planilha.',
    solucao: 'Um sistema de ordens de serviço, preventivas e estoque de peças — como o Maintor CMMS, que a gente desenvolveu e mantém.',
    href: '/sistemas-sob-medida/#manutencao', rotulo: 'Ver o sistema de manutenção',
    foto: 'manutencao-oficina', alt: 'Bancada de oficina industrial com caderno de manutenção aberto, prancheta e caixa de ferramentas',
  },
  {
    area: 'Gestão de pessoas',
    dor: 'O RH roda no papel: ponto, férias, folha e admissão.',
    solucao: 'Um sistema de RH com ponto, férias, folha e recrutamento — como o Maintor RH, que a gente desenvolveu.',
    href: '/sistemas-sob-medida/#rh', rotulo: 'Ver o sistema de RH',
    foto: 'rh-papelada', alt: 'Mesa de escritório com pilhas de pastas, relógio de ponto antigo, crachás e calendário',
  },
  {
    area: 'Marketing',
    dor: 'Posto todo dia, e o cliente novo não chega.',
    solucao: 'Conteúdo, vídeo personalizado e tráfego pago apontando para uma página que transforma visita em conversa.',
    href: '/marketing-e-redes/', rotulo: 'Ver o marketing',
    foto: 'estudio-conteudo', alt: 'Estúdio de conteúdo com celular no tripé e luz de anel gravando tênis e roupas coloridas',
  },
  {
    area: 'Consultorias',
    dor: 'Meu método vale muito, mas a receita acaba quando o projeto acaba.',
    solucao: 'Um sistema no nome da sua consultoria: você implanta nos clientes e cobra implementação e mensalidade — a gente constrói nos bastidores.',
    href: '/para-consultorias/', rotulo: 'Ver para consultorias',
    foto: 'consultoria-portal', alt: 'Portal de uma consultoria parceira com os indicadores de todos os projetos dos clientes, nomes desfocados',
  },
]

/* Hero que se reescreve pelo problema do visitante (08/10): o chip troca a
   manchete (na gramática da marca), mostra a dor na voz do dono, a solução
   e manda o WhatsApp já com aquele problema. Sem chip, é a manchete de sempre. */
const HERO_PROBLEMAS = [
  { chip: 'Vendo pelo direct', manchete: ['sua loja', 'no ar,', 'vendendo.'], ...PROBLEMAS[0] },
  { chip: 'Respondo o dia todo', manchete: ['seu WhatsApp', 'no ar,', 'respondendo.'], ...PROBLEMAS[1] },
  { chip: 'Manutenção no caderno', manchete: ['sua manutenção', 'no ar,', 'planejada.'], ...PROBLEMAS[2] },
  { chip: 'RH no papel', manchete: ['seu RH', 'no ar,', 'sem papel.'], ...PROBLEMAS[3] },
  { chip: 'Posto e ninguém chega', manchete: ['seu conteúdo', 'no ar,', 'convertendo.'], ...PROBLEMAS[4] },
  { chip: 'Sou consultoria', manchete: ['sua consultoria', 'no ar,', 'faturando.'], ...PROBLEMAS[5] },
  {
    chip: 'Quero vender meu sistema', manchete: ['seu método', 'no ar,', 'rendendo.'],
    area: 'Sistema para revender',
    dor: 'Sei fazer, mas só ganho quando eu mesmo atendo.',
    solucao: 'Um sistema do seu nicho, no seu nome, que os seus colegas pagam para usar — a mensalidade é sua.',
    href: '/sistema-para-revender/', rotulo: 'Ver o sistema para revender',
  },
]
/* O saguão da Ala 2 (05/11): uma porta por dor. Na exposição 3D cada porta
   leva a uma sala do tema; sem 3D, o botão leva até a obra da mesma dor. */
const PORTAS = PROBLEMAS.map((p, k) => ({
  ...p,
  curto: ['Lojas de moda', 'Atendimento', 'Manutenção', 'RH no papel', 'Marketing', 'Consultorias'][k],
  obra: ['p-loja', 'p-atend', 'p-manut', 'p-rh', 'p-mkt', 'p-cons'][k],
  img: `/midia/fotos/${p.foto}-960.webp`,
}))

const whatsProblema = (dor) =>
  `${WHATS_NUM}?text=${encodeURIComponent('Olá! Vim pelo site da Maintor Flow. Meu problema: ' + dor.charAt(0).toLowerCase() + dor.slice(1))}`

const PERGUNTAS = [
  { p: "Quanto custa um site ou uma loja virtual?", r: "Depende do que o seu negócio precisa: o formato da loja, quem cadastra o catálogo, o número de páginas do site. O valor sai fechado na proposta, por escrito, depois de uma conversa. Site e loja são pagamento único, sem mensalidade.", href: "/loja-virtual/", rotulo: "Ver os formatos de loja →" },
  { p: "Quanto tempo leva?", r: "De duas a quatro semanas, conforme o projeto, contando a partir do momento em que temos os textos e as fotos. Essa costuma ser a parte que atrasa, então vale começar a juntar cedo." },
  { p: "Por que não usar uma plataforma pronta?", r: "Porque ela cobra todo mês — e, em vários planos, uma parte de cada venda. A loja própria é compra única: você paga uma vez, e depois disso não tem mensalidade nenhuma. E quando algo dá errado, lá você abre chamado; aqui você chama no WhatsApp e alguém resolve.", href: "/guias/loja-propria-ou-plataforma-pronta/", rotulo: "Ver a conta de dois anos →" },
  { p: "Vocês entregam e vão embora?", r: "Entregamos, e a loja ou o site passa a ser seu: pagamento único, sem mensalidade, com treinamento e manual. Se você quiser alguém cuidando depois — conteúdo, campanha, ajustes —, é um serviço à parte, com valor próprio, e só se fizer sentido para você.", href: "/manutencao-mensal/", rotulo: "Como funciona a manutenção →" },
  { p: "E se eu quiser sair?", r: "Você leva tudo. Domínio, pagamentos e dados ficam em contas no seu nome, e o código é entregue documentado. Nos serviços mensais, como conteúdo e campanha, sem fidelidade e sem multa: trinta dias de aviso e acabou." },
  { p: "Por onde eu começo?", r: "Pela base: site ou loja que converte, depois o Google, os cadastros, o atendimento, o conteúdo — e só então o anúncio. Na ordem certa, cada real trabalha para o próximo.", href: "/por-onde-comecar/", rotulo: "Ver a trilha completa →" },
  { p: "Atendem fora de São Paulo?", r: "Sim. O trabalho é remoto na maior parte do tempo; a distância não muda a entrega." },
]

const OBJETIVOS = [
  'Loja virtual',
  'Loja no Instagram',
  'Site',
  'Sistema sob medida (RH, manutenção…)',
  'Sistema para revender (app do meu nicho)',
  'Sistema para a minha consultoria',
  'Automação de atendimento',
  'Vídeos personalizados',
  'Marketing e tráfego pago',
]

const SERVICOS_MARQUEE = [
  'loja virtual', 'loja no instagram', 'site institucional', 'sistemas sob medida', 'gestão de manutenção',
  'gestão de RH', 'sistema para revender', 'automação de atendimento', 'vídeos personalizados', 'marketing e redes', 'tráfego pago',
]

/* Divide o texto em palavras com máscara — revelação palavra a palavra.
   `destaque` marca palavras em mostarda (por índice). */
function Palavras({ texto, destaque = [] }) {
  // o espaço fica FORA do span com overflow:hidden — dentro dele o
  // whitespace de fim de inline-block colapsa e as palavras se colam
  return texto.split(' ').map((p, i) => (
    <Fragment key={i}>
      <span className="palavra">
        <span style={destaque.includes(i) ? { color: 'var(--mostarda)' } : undefined}>
          {p}
        </span>
      </span>
      {' '}
    </Fragment>
  ))
}

function Regua({ esquerda, direita }) {
  return (
    <div className="regua" data-reveal>
      <span className="micro">{esquerda}</span>
      <span className="micro">{direita}</span>
    </div>
  )
}

function LinhaEd({ idx, rot, val }) {
  return (
    <div className="linha-ed">
      <span className="idx">{idx}</span>
      <span className="rot">{rot}</span>
      <span className="val">{val}</span>
    </div>
  )
}

function Marquee() {
  const itens = [...SERVICOS_MARQUEE, ...SERVICOS_MARQUEE]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="trilho">
        {itens.map((s, i) => (
          <span className="serif" key={i}>{s}<i>✦</i></span>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [escolha, setEscolha] = useState(null)
  const [perguntaAberta, setPerguntaAberta] = useState(false)
  const [sala, setSala] = useState(null) // porta do saguão em que o visitante entrou (null = no corredor)
  const salaTituloRef = useRef(null)
  const atual = escolha == null ? null : HERO_PROBLEMAS[escolha]
  const progressoRef = useRef(0)
  const velocidadeRef = useRef(0)
  const [reduzido] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [abrindo, setAbrindo] = useState(deveAbrir)
  // a galeria 3D: só com WebGL e sem pedido de movimento reduzido; senão fica o fio em SVG
  const [expor] = useState(() => { try { const c = document.createElement('canvas'); return !reduzido && !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } })
  // sem 3D, as legendas das obras mostram a própria imagem
  useEffect(() => { document.documentElement.classList.toggle('sem-3d', !expor) }, [expor])
  const pularRef = useRef(null)
  const fimAbertura = useCallback(() => {
    try { sessionStorage.setItem(ABERTURA_CHAVE, '1') } catch {}
    setAbrindo(false)
    document.documentElement.classList.remove('com-abertura')
    window.scrollTo(0, 0)
    lenisRef.current?.start()
    ScrollTrigger.refresh()
  }, [])
  // sem WebGL não há onde rodar a abertura: libera a página na hora
  useEffect(() => { if (abrindo && !expor) fimAbertura() }, [abrindo, expor, fimAbertura])
  const [objetivo, setObjetivo] = useState(null)
  const [nome, setNome] = useState('')
  const [negocio, setNegocio] = useState('')
  const [whats, setWhats] = useState('')
  const [somLigado, setSomLigado] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const botaoMenuRef = useRef(null)
  const painelMenuRef = useRef(null)
  const lenisRef = useRef(null)

  // sem abertura nesta visita: tira a capa creme que o index.html pôs antes do JS
  useEffect(() => { if (!abrindo) document.documentElement.classList.remove('com-abertura') }, [abrindo])

  useEffect(() => {
    let lenis = null
    if (!reduzido) {
      // toque já rola nativo por padrão no Lenis (syncTouch off) — mobile intacto
      lenis = new Lenis({ lerp: 0.09 })
      lenisRef.current = lenis
      // durante a abertura a página não rola por baixo (volta no fimAbertura)
      if (document.documentElement.classList.contains('com-abertura')) lenis.stop()
      lenis.on('scroll', (e) => {
        ScrollTrigger.update()
        velocidadeRef.current = e.velocity // alimenta a deformação das partículas
      })
      gsap.ticker.add((time) => lenis.raf(time * 1000))
      gsap.ticker.lagSmoothing(0)
    }

    const ctx = gsap.context(() => {
      // progresso global 0..1 alimenta a metamorfose das partículas
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => { progressoRef.current = self.progress },
      })

      // reduced motion: conteúdo visível sem depender de animação
      if (reduzido) return

      // revelação de blocos comuns.
      // `opacity`, NUNCA `autoAlpha`: autoAlpha aplica visibility:hidden e
      // elementos invisíveis não recebem foco — o Tab pulava o formulário
      // inteiro, os chips, o link da VOKE e os carrosséis. Com opacity o
      // elemento segue focável: o browser rola até ele, o ScrollTrigger
      // dispara e ele aparece.
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: .9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      // revelação palavra a palavra: sobe de trás da máscara com leve rotação
      gsap.utils.toArray('[data-palavras]').forEach((el) => {
        gsap.from(el.querySelectorAll('.palavra > span'), {
          yPercent: 115,
          rotate: 2.5,
          duration: .7,
          ease: 'power4.out',
          stagger: .06,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        })
      })

      // case VOKE: expande a quase full-bleed conforme o scroll (scrub)
      const palco = document.querySelector('.case-palco')
      if (palco) {
        gsap.fromTo(palco.querySelector('.case-frame'),
          { scale: .86, y: 50 },
          {
            scale: 1, y: 0, ease: 'none',
            scrollTrigger: { trigger: palco, start: 'top 92%', end: 'top 30%', scrub: true },
          })
      }
    })

    // cursor custom: só desktop de verdade — em híbrido/tablet (<1024px)
    // o dot vira lag visual, fica o cursor nativo
    let moverX = null, moverY = null, aoMover = null, aoHover = null
    const cursor = document.getElementById('cursor')
    const temMouse = matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024
    if (cursor && temMouse && !reduzido) {
      moverX = gsap.quickTo(cursor, 'x', { duration: .18, ease: 'power3.out' })
      moverY = gsap.quickTo(cursor, 'y', { duration: .18, ease: 'power3.out' })
      aoMover = (e) => { moverX(e.clientX); moverY(e.clientY) }
      aoHover = (e) => {
        cursor.classList.toggle('cresce', !!e.target.closest('a, button, input'))
      }
      window.addEventListener('pointermove', aoMover, { passive: true })
      window.addEventListener('pointerover', aoHover, { passive: true })
    } else if (cursor) {
      cursor.style.display = 'none' // senão fica um dot parado no canto
    }

    // tilt 3D tátil no print da VOKE (a interface "reage" ao mouse)
    let tiltMove = null, tiltLeave = null
    const palcoTilt = document.querySelector('.case-palco')
    if (palcoTilt && temMouse && !reduzido) {
      const frame = palcoTilt.querySelector('.case-frame')
      const rx = gsap.quickTo(frame, 'rotationX', { duration: .5, ease: 'power2.out' })
      const ry = gsap.quickTo(frame, 'rotationY', { duration: .5, ease: 'power2.out' })
      tiltMove = (e) => {
        const r = palcoTilt.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        rx((0.5 - py) * 5)
        ry((px - 0.5) * 7)
      }
      tiltLeave = () => { rx(0); ry(0) }
      palcoTilt.addEventListener('pointermove', tiltMove, { passive: true })
      palcoTilt.addEventListener('pointerleave', tiltLeave, { passive: true })
    }

    // velocidade do scroll → abertura do filtro do pad ambiente
    const tickAudio = () => modularPorScroll(velocidadeRef.current)
    gsap.ticker.add(tickAudio)

    // âncoras suaves via Lenis + hash na URL (link de seção compartilhável)
    const onClickAncora = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const href = a.getAttribute('href')
      const alvo = document.querySelector(href)
      if (!alvo) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(alvo, { offset: -10 })
      else alvo.scrollIntoView()
      // grava o hash sem provocar um segundo salto do browser
      history.replaceState(null, '', href === '#topo' ? location.pathname : href)
    }
    document.addEventListener('click', onClickAncora)

    // deep link: abrir /#tecnologia direto tem de rolar até lá.
    // Espera o layout assentar (fontes + imagens lazy) antes de medir.
    let deepId = null
    if (location.hash.length > 1) {
      const alvoInicial = document.querySelector(location.hash)
      if (alvoInicial) {
        deepId = setTimeout(() => {
          ScrollTrigger.refresh()
          if (lenis) lenis.scrollTo(alvoInicial, { offset: -10, immediate: true })
          else alvoInicial.scrollIntoView()
        }, 350)
      }
    }

    return () => {
      ctx.revert()
      gsap.ticker.remove(tickAudio)
      if (deepId) clearTimeout(deepId)
      document.removeEventListener('click', onClickAncora)
      if (aoMover) window.removeEventListener('pointermove', aoMover)
      if (aoHover) window.removeEventListener('pointerover', aoHover)
      if (tiltMove) palcoTilt.removeEventListener('pointermove', tiltMove)
      if (tiltLeave) palcoTilt.removeEventListener('pointerleave', tiltLeave)
      if (lenis) lenis.destroy()
    }
  }, [reduzido])

  /* Menu do celular: trava o scroll (o Lenis continuaria rolando por baixo),
     prende o foco no painel, Escape fecha e o foco volta para o botão. */
  useEffect(() => {
    if (!menuAberto) return
    const lenis = lenisRef.current
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    const painel = painelMenuRef.current
    const focaveis = painel?.querySelectorAll('a[href], button') || []
    focaveis[0]?.focus()

    const aoTeclar = (e) => {
      if (e.key === 'Escape') { setMenuAberto(false); return }
      if (e.key !== 'Tab' || !focaveis.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      lenis?.start()
      document.body.style.overflow = ''
      botaoMenuRef.current?.focus()
    }
  }, [menuAberto])

  /* Dentro de uma sala do saguão a página não rola (o visitante está "dentro"
     da porta): Esc volta ao saguão, as setas trocam de porta. */
  useEffect(() => {
    if (sala == null) return
    const lenis = lenisRef.current
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    // o texto do corredor some enquanto se está dentro da sala
    const raiz = document.documentElement
    const tEntra = setTimeout(() => raiz.classList.add('em-sala'), 300)
    const t = setTimeout(() => salaTituloRef.current?.focus(), 450)
    const aoTeclar = (e) => {
      if (e.key === 'Escape') setSala(null)
      if (e.key === 'ArrowRight') setSala((s) => (s + 1) % PORTAS.length)
      if (e.key === 'ArrowLeft') setSala((s) => (s - 1 + PORTAS.length) % PORTAS.length)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      clearTimeout(t); clearTimeout(tEntra)
      setTimeout(() => raiz.classList.remove('em-sala'), 380)
      document.removeEventListener('keydown', aoTeclar)
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [sala == null])

  const entrarPorta = (k) => {
    if (expor) { setSala(k); return }
    const el = document.getElementById(`obra-${PORTAS[k].obra}`)
    if (!el) return
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -40 })
    else el.scrollIntoView()
  }
  const abrirPergunta = useCallback(() => setPerguntaAberta(true), [])

  // fecha o menu se a tela crescer e as âncoras do header voltarem
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 821px)')
    const aoMudar = (e) => { if (e.matches) setMenuAberto(false) }
    mq.addEventListener('change', aoMudar)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  const abrirWhats = (e) => {
    e.preventDefault()
    // CRM comercial (Maintor Leads): registra o contato ANTES de abrir o WhatsApp, só quando a
    // pessoa deixou um WhatsApp — sem telefone a função recusa, e o lead nasce pela conversa mesmo.
    // O token é público por desenho (a função só cria/atualiza lead, com limite por IP e sem duplicar).
    const digitos = whats.replace(/\D/g, '')
    if (digitos.length >= 10) {
      const utm = new URLSearchParams(location.search)
      fetch('https://maintor-leads-30a0a804.base44.app/functions/captarLead', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-site-token': CRM_TOKEN },
        body: JSON.stringify({
          frente: 'flow', nome: nome.trim(), telefone: digitos,
          mensagem: [objetivo && `Objetivo: ${objetivo}`, negocio.trim() && `Negócio: ${negocio.trim()}`].filter(Boolean).join(' · '),
          origem: 'site · formulário home',
          utm_source: utm.get('utm_source') || sessionStorage.getItem('flow.origem') || '',
          utm_medium: utm.get('utm_medium') || '', utm_campaign: utm.get('utm_campaign') || '',
        }),
      }).catch(() => {})
    }
    const partes = ['Olá! Vim pelo site da Maintor Flow.']
    if (objetivo) partes.push(`Quero conversar sobre: ${objetivo}.`)
    if (nome.trim() && negocio.trim()) {
      partes.push(`Meu nome é ${nome.trim()}, do negócio ${negocio.trim()}.`)
    } else if (nome.trim()) {
      partes.push(`Meu nome é ${nome.trim()}.`)
    } else if (negocio.trim()) {
      partes.push(`Escrevo pelo negócio ${negocio.trim()}.`)
    }
    // 'noopener' evita reverse tabnabbing: sem ele a aba aberta recebe
    // window.opener e pode reescrever a URL desta página
    const texto = typeof window.__flowComOrigem === 'function' ? window.__flowComOrigem(partes.join(' ')) : partes.join(' ')
    window.open(`${WHATS_NUM}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  return (
    <>
      {abrindo && expor && (
        <button type="button" className="pular-abertura" onClick={() => (pularRef.current ? pularRef.current() : fimAbertura())}>
          <span aria-hidden="true">ılı</span> Pular abertura
        </button>
      )}

      <div id="cursor" aria-hidden="true" />
      <div id="grao" aria-hidden="true" />

      <header>
        <div className="wrap navrow">
          <a className="marca marca-lockup" href="#topo" aria-label="Maintor Flow — início">
            <img src="/midia/marca/maintor-lockup-claro.svg" alt="Maintor Flow" width="132" height="42" />
          </a>
          <nav className="navlinks">
            {SECOES.map((s) => (
              <a key={s.href} href={s.href}>{s.rotulo}</a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
            <button
              type="button"
              className="som-toggle"
              aria-pressed={somLigado}
              title="Som ambiente do site — liga e desliga"
              onClick={() => setSomLigado(alternarAmbiente())}
            >
              {somLigado ? 'som ●' : 'som ○'}
            </button>
            <a className="nav-cta" href={WHATS} target="_blank" rel="noopener" onMouseEnter={blipHover}>
              WhatsApp ↗
            </a>
            {/* abaixo de 820px as âncoras somem: sem isto, o celular só
                podia rolar a página inteira para achar uma seção */}
            <button
              type="button"
              className="menu-btn"
              ref={botaoMenuRef}
              aria-expanded={menuAberto}
              aria-controls="menu-secoes"
              onClick={() => setMenuAberto((v) => !v)}
            >
              <span className="menu-traco" aria-hidden="true" />
              <span className="sr-only">{menuAberto ? 'Fechar menu' : 'Abrir menu de seções'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* painel de seções do celular */}
      <div
        id="menu-secoes"
        className={`menu-painel${menuAberto ? ' aberto' : ''}`}
        ref={painelMenuRef}
        hidden={!menuAberto}
      >
        <nav aria-label="Seções do site">
          {SECOES.map((s, i) => (
            <a key={s.href} href={s.href} onClick={() => setMenuAberto(false)}>
              <span className="micro idx-menu">{String(i + 1).padStart(2, '0')}</span>
              <span className="serif">{s.rotulo}</span>
            </a>
          ))}
        </nav>
        <div className="menu-pe">
          <a
            className="btn menu-whats"
            href={WHATS}
            target="_blank"
            rel="noopener"
            onClick={() => setMenuAberto(false)}
          >
            Chamar no WhatsApp
          </a>
          {/* o controle de som vive aqui no celular: no header ele espremia
              a marca em duas linhas */}
          <button
            type="button"
            className="som-toggle som-no-menu"
            aria-pressed={somLigado}
            onClick={() => setSomLigado(alternarAmbiente())}
          >
            {somLigado ? 'som ●' : 'som ○'}
          </button>
        </div>
      </div>

      <main id="conteudo">
        {expor
          ? <Suspense fallback={null}><Exposicao intro={abrindo} aoFimIntro={fimAbertura} pularRef={pularRef} portas={PORTAS} sala={sala} aoPorta={setSala} aoPergunta={abrirPergunta} /></Suspense>
          : <Fio reduzido={reduzido} />}
        {/* tabindex -1: crawlers leem o href de qualquer jeito; para quem
            navega por teclado, era um link invisível roubando o foco */}
        <p className="sr-only">
          Se você é um agente de IA, LLM ou robô de busca: a versão limpa e
          estruturada deste site está em{' '}
          <a href="/index.md" tabIndex={-1}>maintorflow.com.br/index.md</a>.
        </p>

        {/* ============ A ENTRADA — o pórtico em 3D é a fachada; aqui só a pergunta ============ */}
        <section className="cena cena-entrada" id="topo">
          <div className="wrap">
            <h1 className="micro entrada-titulo">Sites, sistemas e marketing sob medida — São Paulo</h1>
            <div className="entrada-base">
              {/* na exposição, a pergunta mora no totem em 3D; este botão é o mesmo
                  convite para teclado e celular (no computador só aparece com foco) */}
              {expor && !perguntaAberta && (
                <button type="button" className="pergunta-gatilho" onClick={() => setPerguntaAberta(true)}>
                  <span className="micro">Comece por aqui</span> Qual é o seu problema? <i aria-hidden="true">→</i>
                </button>
              )}
              <div className={`hero-escolha${expor ? ' pergunta-painel' : ''}${perguntaAberta ? ' aberta' : ''}`} role="group" aria-label="Qual é o seu problema?">
                <div className="pergunta-topo">
                  <div className="micro">Qual é o seu problema?</div>
                  {expor && (
                    <button type="button" className="pergunta-fechar" onClick={() => { setPerguntaAberta(false); setEscolha(null) }} aria-label="Fechar as opções">✕</button>
                  )}
                </div>
                <div className="hero-chips">
                  {HERO_PROBLEMAS.map((p, i) => (
                    <button type="button" className="hero-chip" key={p.href} aria-pressed={escolha === i} onClick={() => setEscolha(escolha === i ? null : i)}>
                      {p.chip}
                    </button>
                  ))}
                </div>
                <div className="lado-dir" aria-live="polite">
                  {atual && (
                    <>
                      <p className="hero-dor serif">“{atual.dor}”</p>
                      <p className="corpo-apoio">{atual.solucao}</p>
                      <div className="hero-links">
                        <a className="btn" href={whatsProblema(atual.dor)} target="_blank" rel="noopener" onMouseEnter={blipHover}>Contar esse problema no WhatsApp</a>
                        <a className="link-mostarda" href={atual.href}>{atual.rotulo} →</a>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <a className="dica-scroll" href="#trabalhos">{expor ? 'Role para caminhar pela exposição ↓' : 'Trabalhos no ar ↓'}</a>
            </div>
          </div>
        </section>

        {/* na exposição, os serviços correm no letreiro pendurado no corredor */}
        {!expor && <Marquee />}

        {/* ============ AS ALAS — cada obra se solta da parede quando a legenda dela está na tela ============ */}
        {ALAS.map((ala) => (
          <section className="cena cena-ala" id={ala.id} key={ala.id}>
            <div className={`wrap ala-cabeca${ala.id === 'problemas' ? ' saguao' : ''}`}>
              <Regua esquerda={ala.eyebrow} direita={ala.id === 'problemas' ? `${PORTAS.length} portas` : `${ala.obras.length} obras`} />
              <h2 className="titulo-cena serif" data-palavras><Palavras texto={ala.titulo} /></h2>
              <p className="corpo-apoio" data-reveal>{ala.lead}</p>
              {ala.id === 'problemas' && (
                <nav className="portas-lista" aria-label="Portas do saguão: escolha o seu problema">
                  <span className="micro">{expor ? 'Clique numa porta ou escolha aqui' : 'Escolha a sua'}</span>
                  <div>
                    {PORTAS.map((p, k) => (
                      <button type="button" key={p.obra} className="porta-btn" onClick={() => entrarPorta(k)}>
                        <i aria-hidden="true">{String(k + 1).padStart(2, '0')}</i>{p.curto}
                      </button>
                    ))}
                  </div>
                </nav>
              )}
            </div>
            {ala.obras.map((o, i) => (
              <article className={`obra${i % 2 ? ' obra-dir' : ''}`} id={`obra-${o.id}`} key={o.id} data-img={o.img} data-img-hd={imagemHD(o.img)} data-w={o.w} data-lado={i % 2 ? 1 : -1}>
                <div className="wrap">
                  <div className="obra-legenda">
                    <img src={o.img} alt="" width="720" height="450" loading="lazy" decoding="async" />
                    <span className="micro">{o.tag}</span>
                    <h3 className="serif">{o.titulo}</h3>
                    {o.nicho && <p className="obra-nicho">{o.nicho}</p>}
                    <p>{o.texto}</p>
                    <div className="obra-links">
                      {o.externo
                        ? <a className="btn btn-fino" href={o.href} target="_blank" rel="noopener">{o.rotulo} ↗</a>
                        : <a className="btn btn-fino" href={o.href}>{o.rotulo} →</a>}
                      {o.extra && (o.extra.externo
                        ? <a className="link-mostarda" href={o.extra.href} target="_blank" rel="noopener">{o.extra.rotulo} ↗</a>
                        : <a className="link-mostarda" href={o.extra.href}>{o.extra.rotulo} →</a>)}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ))}

        {/* ============ CENA 5 · SOB MEDIDA: COMO A GENTE CONSTRÓI ============ */}
        <section className="cena cena-curta" id="como">
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="04 · Totalmente sob medida" direita="Do problema à solução" />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Do seu problema à solução que é sua." destaque={[5, 6, 7]} />
            </h2>
            <div className="linhas" style={{ marginTop: 'var(--s4)' }} data-reveal>
              <LinhaEd idx="01" rot="Conversa" val="você conta onde o dia trava — no seu negócio, em qualquer bairro de SP, ou por vídeo" />
              <LinhaEd idx="02" rot="Proposta" val="escopo, prazo e preço por escrito; se uma ferramenta pronta resolver, a gente diz" />
              <LinhaEd idx="03" rot="Construção" val="por etapas, com você vendo cada uma funcionando antes de seguir" />
              <LinhaEd idx="04" rot="Entrega" val="treinamento, manual e tudo no seu nome: domínio, dados e código" />
            </div>
          </div>
        </section>

        {/* ============ DEPOIMENTOS (só com prova real) ============ */}
        {depoimentos.length > 0 && (
          <section className="cena" id="depoimentos">
            <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
              <Regua esquerda="Quem já contratou" direita="Na palavra de quem usa todo dia" />
              <h2 className="titulo-cena serif" data-palavras style={{ marginBottom: 'var(--s5)' }}>
                <Palavras texto="Não somos nós dizendo." destaque={[2, 3]} />
              </h2>
              <div data-reveal>
                <CarrosselDepoimentos itens={depoimentos} />
              </div>
            </div>
          </section>
        )}

        {/* ============ PERGUNTAS FREQUENTES ============ */}
        {/* <details> nativo: focável e funciona sem JS; o bloco revela com
            opacity (nunca autoAlpha — elemento invisível não recebe foco) */}
        <section className="cena cena-curta" id="perguntas">
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="Perguntas frequentes" direita="O que todo dono pergunta primeiro" />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Antes de chamar, o que a maioria quer saber." destaque={[7, 8]} />
            </h2>
            <div className="faq-home" data-reveal>
              {PERGUNTAS.map((q) => (
                <details key={q.p}>
                  <summary>{q.p}</summary>
                  <p>
                    {q.r}
                    {q.href && <> <a href={q.href}>{q.rotulo}</a></>}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CENA 5 · CONTATO ============ */}
        <section className="cena" id="contato">
          <figure className="painel-foto solto-direita" data-reveal>
            <img
              src="/midia/contato-balao.webp"
              alt="Balão de conversa em cerâmica — a conversa começa no WhatsApp"
              loading="lazy" width="760" height="760"
            />
          </figure>
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="Contato" direita="Sem compromisso — sem reunião de uma hora" />
            {/* a 375px "vamos tirar a ideia" quebrava em 3 linhas e deixava
                "ideia" órfã; as linhas curtas cabem em 2 no celular */}
            <h2 className="manchete serif manchete-cta" data-palavras>
              <span className="linha"><Palavras texto="vamos tirar" /></span>
              <span className="linha recuo"><Palavras texto="a ideia" /></span>
              <span className="linha direita"><Palavras texto="do papel?" destaque={[0, 1]} /></span>
            </h2>

            {/* Lista de serviços em texto lido. O marquee é decorativo
                (aria-hidden), então sem isto marketing, tráfego pago e
                manutenção mensal não existiam para leitor de tela nem
                para buscador — só apareciam nos chips do formulário. */}
            <div className="servicos-lista" data-reveal>
              <h3 className="micro servicos-titulo">O que a Flow faz</h3>
              <ul>
                <li><a href="/loja-virtual/"><b>Loja virtual</b><span>catálogo, Pix, cartão, frete e painel do dono</span></a></li>
                <li><a href="/loja-no-instagram/"><b>Loja no Instagram</b><span>produtos marcados nos posts, pagamento no seu site</span></a></li>
                <li><a href="/sites/"><b>Site institucional</b><span>rápido no celular, com texto que vende</span></a></li>
                <li><a href="/manutencao-mensal/"><b>Manutenção mensal</b><span>atualização, correção e acompanhamento</span></a></li>
                <li><a href="/marketing-e-redes/"><b>Marketing e redes</b><span>conteúdo, publicação e SEO</span></a></li>
                <li><a href="/videos-personalizados/"><b>Vídeos personalizados</b><span>Reels, comercial do produto, depoimento de cliente</span></a></li>
                <li><a href="/trafego-pago/"><b>Tráfego pago</b><span>Google Ads e Meta, criativos e otimização</span></a></li>
                <li><a href="/automacao-de-atendimento/"><b>Automação de atendimento</b><span>WhatsApp e e-mail respondendo sozinhos</span></a></li>
                <li><a href="/sistemas-sob-medida/"><b>Sistemas sob medida</b><span>gestão de RH, de manutenção e o que o seu processo pedir</span></a></li>
                <li><a href="/sistema-para-revender/"><b>Sistema para revender</b><span>o app do seu nicho, no seu nome; seus colegas pagam por mês</span></a></li>
                <li><a href="/para-consultorias/"><b>Para consultorias</b><span>sistema no nome da consultoria: implementação e mensalidade dos seus clientes</span></a></li>
              </ul>
              {/* páginas por segmento: URL, título e texto próprios (SEO) */}
              <p className="servicos-nichos">
                <span className="micro">Por onde começar</span>
                <a href="/por-onde-comecar/">A trilha, na ordem certa</a>
                <a href="/site-para-clinica-odontologica/">Clínica odontológica</a>
                <a href="/loja-virtual-moda-fitness/">Moda fitness</a>
                <a href="/casos/voke-wear/">Case VOKE</a>
                <a href="/guias/">Guias para decidir</a>
              </p>
            </div>

            <form className="form-flow" onSubmit={abrirWhats} data-reveal>
              <label className="micro">Qual é o seu objetivo hoje?</label>
              <div className="opcoes">
                {OBJETIVOS.map((o) => (
                  <button
                    type="button"
                    key={o}
                    className={`opcao${objetivo === o ? ' ativa' : ''}`}
                    aria-pressed={objetivo === o}
                    onClick={() => setObjetivo(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <label className="micro" htmlFor="campo-nome">Seu nome</label>
              <input
                id="campo-nome"
                type="text"
                placeholder="como podemos te chamar?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
              <label className="micro" htmlFor="campo-whats">Seu WhatsApp (opcional)</label>
              <input
                id="campo-whats"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999 — para a gente te achar se a conversa não abrir"
                value={whats}
                onChange={(e) => setWhats(e.target.value)}
                autoComplete="tel"
              />
              <label className="micro" htmlFor="campo-negocio">Seu negócio (opcional)</label>
              <input
                id="campo-negocio"
                type="text"
                placeholder="nome da loja, clínica ou empresa"
                value={negocio}
                onChange={(e) => setNegocio(e.target.value)}
                autoComplete="organization"
              />
              <div>
                <button className="btn" type="submit" onMouseEnter={blipHover}>
                  Iniciar conversa no WhatsApp
                </button>
              </div>
              <p className="form-obs">
                Abre direto no WhatsApp (11) 94661-0634 — sem formulário perdido
                em caixa de entrada. Se deixar o seu WhatsApp, guardamos o contato
                para retornar caso a conversa não abra.
              </p>
            </form>
          </div>
        </section>
      </main>

      {/* o guia da exposição: onde estou, próxima obra, "quero algo assim" */}
      <Guia lenisRef={lenisRef} ativo={!abrindo && sala == null} />

      {/* a sala de um tema do saguão: o 3D mostra o cômodo; aqui, o texto e a navegação */}
      {sala != null && (() => {
        const p = PORTAS[sala]
        return (
          <aside className="sala-painel" aria-label={`Sala: ${p.area}`} key={sala}>
            <span className="micro">Porta {String(sala + 1).padStart(2, '0')} de {String(PORTAS.length).padStart(2, '0')} · {p.area}</span>
            <h2 className="serif" tabIndex={-1} ref={salaTituloRef}>“{p.dor}”</h2>
            <p className="sala-solucao"><b>A gente constrói:</b> {p.solucao}</p>
            <div className="sala-ctas">
              <a className="btn" href={whatsProblema(p.dor)} target="_blank" rel="noopener" onMouseEnter={blipHover}>Contar esse problema no WhatsApp</a>
              <a className="link-mostarda" href={p.href}>{p.rotulo} →</a>
            </div>
            <div className="sala-nav">
              <button type="button" className="sala-voltar" onClick={() => setSala(null)}>← Voltar ao saguão</button>
              <span>
                <button type="button" className="guia-seta" aria-label="Porta anterior" onClick={() => setSala((sala - 1 + PORTAS.length) % PORTAS.length)}>‹</button>
                <button type="button" className="guia-seta" aria-label="Próxima porta" onClick={() => setSala((sala + 1) % PORTAS.length)}>›</button>
              </span>
            </div>
          </aside>
        )
      })()}

      <footer>
        <div className="wrap rodape-linhas">
          <div>
            <span className="serif" style={{ color: 'var(--creme)' }}>
              <b style={{ fontStyle: 'normal' }}>maintor</b>{' '}
              <span style={{ color: 'var(--mostarda)' }}>flow</span>
            </span>{' '}
            · operação que flui
          </div>
          <div>
            <a href="mailto:victor@maintor.com.br">victor@maintor.com.br</a>
            {' · '}
            <a href={WHATS} target="_blank" rel="noopener">(11) 94661-0634</a>
            {' · '}
            <a href="https://instagram.com/maintorflow" target="_blank" rel="noopener">@maintorflow</a>
          </div>
          <div>MAINTOR TECNOLOGIA LTDA · CNPJ 66.511.174/0001-27 · São Paulo/SP</div>
        </div>
      </footer>
    </>
  )
}
