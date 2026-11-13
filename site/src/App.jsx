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
import { ALAS, GRUPOS, PORTAS, imagemHD, msgWhats } from './obras.js'
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
// que veio do portfólio e o assunto (e de onde, quando a visita trouxe utm_source — ver medicao.js)
const whatsDe = (assunto) => `${WHATS_NUM}?text=${encodeURIComponent(msgWhats(assunto))}`
const WHATS = whatsDe()

/* Menu (10/11): o mesmo para o cabeçalho e para o painel do celular. Os ids
   das seções são os de antes — links já compartilhados (/#trabalhos,
   /#problemas…) continuam chegando no mesmo lugar. */
const SECOES = [
  { href: '#trabalhos', rotulo: 'Portfólio' },
  { href: '#problemas', rotulo: 'Serviços' },
  { href: '#sistemas', rotulo: 'Sistemas' },
  { href: '#marketing', rotulo: 'Marketing' },
  { href: '#contato', rotulo: 'Contato' },
]

/* "Qual é o seu problema?" virou atalho opcional (10/11): as opções são as
   sete portas da Ala 02, mais o atalho direto para a Ala 03. O percurso
   principal (abertura → portfólio → contato) não depende dele. */
const HERO_ATALHOS = [
  ...PORTAS.map((p) => ({ chip: p.objetivo, dor: p.frase, solucao: p.texto, href: p.acao.href, rotulo: p.acao.rotulo, assunto: p.assunto })),
  {
    chip: 'Quero vender meu sistema',
    dor: 'Quero oferecer aos meus clientes um software com a minha marca.',
    solucao: 'Transformamos o seu método ou a rotina do seu nicho em um aplicativo com a sua marca.',
    href: '#sistemas', rotulo: 'Ver a Ala 03 · Sistemas', assunto: 'lançar um software com a minha marca',
  },
]

/* Perguntas frequentes (10/11): cada resposta diz a condição de cada tipo
   de projeto — sob medida, serviço contínuo e produto por assinatura não
   têm as mesmas regras. O mesmo texto vai no FAQPage do index.html. */
const PERGUNTAS = [
  { p: 'Quanto custa?', r: 'Depende do escopo: o tipo de projeto, as páginas ou funções, quem prepara o conteúdo e as integrações necessárias. O valor é formalizado na proposta, por escrito, depois de uma conversa.', href: '/guias/quanto-custa-uma-loja-virtual/', rotulo: 'O que pesa no valor de uma loja →' },
  { p: 'Quanto tempo leva?', r: 'Sites e lojas virtuais costumam ficar prontos em duas a quatro semanas. O prazo começa a contar quando recebemos os materiais — textos, fotos e acessos —, que costumam ser a parte que mais atrasa. Sistemas sob medida recebem o prazo na proposta, conforme o escopo.' },
  { p: 'Existe mensalidade?', r: 'Pelo desenvolvimento de um site ou de uma loja virtual, não: você paga o projeto, sem mensalidade da Maintor Flow pelo desenvolvimento. Custos de terceiros, como o registro do domínio e as taxas do meio de pagamento, são pagos diretamente a quem presta o serviço. Serviços contínuos, como conteúdo, campanhas e manutenção, são contratados à parte. Produtos por assinatura, como o Maintor CMMS, o Maintor FIT e o Horaqui, seguem as condições de cada produto.' },
  { p: 'Quem fica com o domínio, os acessos, os dados e o código?', r: 'Em sites, lojas e sistemas sob medida, o domínio, as contas e os dados ficam no nome do cliente, e o que entra na entrega — inclusive o código — fica descrito na proposta. Nos produtos por assinatura, você contrata o uso do sistema: o código continua com a Maintor, e o acesso aos seus dados segue as condições de cada produto.' },
  { p: 'Existe suporte depois da entrega?', r: 'Na entrega, a gente orienta a sua equipe a usar a solução, conforme o escopo contratado. O suporte previsto depois disso, quando houver, fica descrito na proposta. Cuidar do projeto no dia a dia — atualizações, conteúdo, campanhas — é um serviço recorrente, contratado à parte.', href: '/manutencao-mensal/', rotulo: 'Como funciona a manutenção mensal →' },
  { p: 'Atendem fora de São Paulo?', r: 'Sim. O trabalho é remoto na maior parte do tempo; a distância não muda a entrega.' },
  { p: 'Por onde começo?', r: 'Pense no que você precisa agora: vender ou se apresentar na internet (site ou loja), organizar a operação (sistema) ou atrair mais clientes (divulgação). Se ainda não tiver certeza, conte a sua situação no WhatsApp e a gente ajuda a definir.', href: WHATS, rotulo: 'Conversar no WhatsApp ↗', externo: true },
]

/* Contato (10/11): quatro opções e o assunto que cada uma põe na mensagem. */
const OBJETIVOS = [
  { rotulo: 'Site ou loja', assunto: 'um site ou uma loja virtual' },
  { rotulo: 'Sistema', assunto: 'um sistema' },
  { rotulo: 'Marketing', assunto: 'marketing e divulgação' },
  { rotulo: 'Ainda estou definindo', assunto: 'o meu projeto (ainda estou definindo o formato)' },
]

/* O catálogo completo saiu da área de contato e mora no rodapé. */
const CATALOGO = [
  { href: '/loja-virtual/', rotulo: 'Loja virtual' },
  { href: '/loja-no-instagram/', rotulo: 'Loja no Instagram' },
  { href: '/sites/', rotulo: 'Site institucional' },
  { href: '/automacao-de-atendimento/', rotulo: 'Automação de atendimento' },
  { href: '/sistemas-sob-medida/', rotulo: 'Sistemas sob medida' },
  { href: '/sistema-para-revender/', rotulo: 'Software com sua marca' },
  { href: '/para-consultorias/', rotulo: 'Para consultorias' },
  { href: '/marketing-e-redes/', rotulo: 'Marketing e redes' },
  { href: '/trafego-pago/', rotulo: 'Tráfego pago' },
  { href: '/videos-personalizados/', rotulo: 'Vídeos personalizados' },
  { href: '/manutencao-mensal/', rotulo: 'Manutenção mensal' },
]
const CATALOGO_APOIO = [
  { href: '/por-onde-comecar/', rotulo: 'Por onde começar' },
  { href: '/site-para-clinica-odontologica/', rotulo: 'Site para clínica odontológica' },
  { href: '/loja-virtual-moda-fitness/', rotulo: 'Loja de moda fitness' },
  { href: '/casos/voke-wear/', rotulo: 'Case VOKE WEAR' },
  { href: '/guias/', rotulo: 'Guias para decidir' },
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

/* 11/11 (limpeza visual): no celular a régua cabe em UMA linha. Quando o rótulo inteiro não cabe em
   360 px, entra a versão curta (só muda o que aparece; o rótulo inteiro continua no computador). */
function Regua({ esquerda, direita, esquerdaCurta, direitaCurta }) {
  const rotulo = (cheio, curto) => (curto ? <><span className="so-largo">{cheio}</span><span className="so-estreito">{curto}</span></> : cheio)
  return (
    <div className="regua" data-reveal>
      <span className="micro">{rotulo(esquerda, esquerdaCurta)}</span>
      <span className="micro">{rotulo(direita, direitaCurta)}</span>
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
  /* 10/11: vídeo de cliente aberto no player em janela (null = fechado). Nada baixa antes do clique. */
  const [video, setVideo] = useState(null)
  const videoDialogoRef = useRef(null)
  const atual = escolha == null ? null : HERO_ATALHOS[escolha]
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
    let deepId = null, refazer = null, mexeu = false
    const marcarMexeu = () => { mexeu = true }
    if (location.hash.length > 1) {
      const alvoInicial = document.querySelector(location.hash)
      if (alvoInicial) {
        const pular = () => {
          ScrollTrigger.refresh()
          if (lenis) lenis.scrollTo(alvoInicial, { offset: -10, immediate: true })
          else alvoInicial.scrollIntoView()
        }
        deepId = setTimeout(pular, 350)
        /* 12/11: quando a exposição desenha o 1º quadro (classe expo-pronta), a aparência da página ainda muda um
           pouco; se a pessoa ainda não rolou, o salto é refeito — /#contato chega no formulário, e não acima */
        refazer = () => { if (!mexeu) setTimeout(pular, 60) }
        window.addEventListener('flow:expo-pronta', refazer)
        for (const ev of ['wheel', 'touchstart', 'keydown']) window.addEventListener(ev, marcarMexeu, { passive: true })
      }
    }

    return () => {
      ctx.revert()
      gsap.ticker.remove(tickAudio)
      if (deepId) clearTimeout(deepId)
      if (refazer) window.removeEventListener('flow:expo-pronta', refazer)
      for (const ev of ['wheel', 'touchstart', 'keydown']) window.removeEventListener(ev, marcarMexeu)
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
  // o player usa <dialog> nativo: prende o foco, fecha no Esc e devolve o foco ao botão da capa
  useEffect(() => {
    const d = videoDialogoRef.current
    if (!d) return
    if (video) { if (!d.open) d.showModal(); lenisRef.current?.stop() }
    else { if (d.open) d.close(); lenisRef.current?.start() }
  }, [video])
  /* link de dentro da sala para outra parte da página (#obra-voke, #marketing):
     sai da sala primeiro — lá dentro a página está parada — e depois anda até o destino */
  const irDaSala = (e, href) => {
    e.preventDefault(); e.stopPropagation()
    setSala(null)
    setTimeout(() => {
      const alvo = document.querySelector(href); if (!alvo) return
      if (lenisRef.current) lenisRef.current.scrollTo(alvo, { offset: -10 })
      else alvo.scrollIntoView()
      history.replaceState(null, '', href)
    }, 650)
  }

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
          mensagem: [objetivo && `Objetivo: ${objetivo.rotulo}`, negocio.trim() && `Negócio: ${negocio.trim()}`].filter(Boolean).join(' · '),
          origem: 'site · formulário home',
          utm_source: utm.get('utm_source') || sessionStorage.getItem('flow.origem') || '',
          utm_medium: utm.get('utm_medium') || '', utm_campaign: utm.get('utm_campaign') || '',
        }),
      }).catch(() => {})
    }
    // "Olá! Vim pelo portfólio da Maintor Flow e quero conversar sobre [objetivo]." + nome e negócio, se houver
    const partes = [msgWhats(objetivo?.assunto)]
    if (nome.trim()) partes.push(`Meu nome é ${nome.trim()}.`)
    if (negocio.trim()) partes.push(`Meu negócio: ${negocio.trim()}.`)
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
          ? <Suspense fallback={null}><Exposicao intro={abrindo} aoFimIntro={fimAbertura} pularRef={pularRef} portas={PORTAS} sala={sala} aoPorta={setSala} aoPergunta={abrirPergunta} pergunta={perguntaAberta} /></Suspense>
          : <Fio reduzido={reduzido} />}
        {/* tabindex -1: crawlers leem o href de qualquer jeito; para quem
            navega por teclado, era um link invisível roubando o foco */}
        <p className="sr-only">
          Se você é um agente de IA, LLM ou robô de busca: a versão limpa e
          estruturada deste site está em{' '}
          <a href="/index.md" tabIndex={-1}>maintorflow.com.br/index.md</a>.
        </p>

        {/* ============ A ABERTURA (10/11) — a oferta e o caminho até os projetos, antes de qualquer pergunta ============ */}
        <section className="cena cena-entrada" id="topo">
          <div className="wrap">
            <div className="entrada-oferta">
              <p className="micro entrada-selo">Maintor Flow · portfólio</p>
              <h1 className="serif entrada-h1">Sites, lojas virtuais e sistemas sob medida para o seu negócio</h1>
              <p className="entrada-apoio">
                A Maintor Flow desenvolve projetos para vender online, automatizar o atendimento e organizar a operação.
                Veja o que já está no ar e encontre um projeto parecido com o seu.
              </p>
              <div className="entrada-ctas">
                <a className="btn" href="#trabalhos" onMouseEnter={blipHover}>Ver projetos realizados</a>
                <a className="btn btn-fantasma" href="#contato">Conversar sobre meu projeto</a>
              </div>
            </div>
            <div className="entrada-base">
              {/* atalho opcional: na exposição a pergunta também mora no totem em 3D */}
              {expor && !perguntaAberta && (
                <button type="button" className="pergunta-gatilho" onClick={() => setPerguntaAberta(true)}>
                  <span className="micro">Atalho</span> Qual é o seu problema? <i aria-hidden="true">→</i>
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
                  {HERO_ATALHOS.map((p, i) => (
                    <button type="button" className="hero-chip" key={p.chip} aria-pressed={escolha === i} onClick={() => setEscolha(escolha === i ? null : i)}>
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
                        <a className="btn" href={whatsDe(atual.assunto)} target="_blank" rel="noopener" onMouseEnter={blipHover}>Conversar sobre isso no WhatsApp</a>
                        <a className="link-mostarda" href={atual.href}>{atual.rotulo} →</a>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {expor && <p className="dica-scroll" aria-hidden="true">Role para caminhar pela exposição</p>}
            </div>
          </div>
        </section>

        {/* na exposição, os serviços correm no letreiro pendurado no corredor */}
        {!expor && <Marquee />}

        {/* ============ AS ALAS — cada obra se solta da parede quando a legenda dela está na tela ============ */}
        {ALAS.map((ala) => {
          let grupoAtual = null
          return (
            <section className="cena cena-ala" id={ala.id} key={ala.id}>
              <div className={`wrap ala-cabeca${ala.id === 'problemas' ? ' saguao' : ''}`}>
                <Regua esquerda={ala.eyebrow} direita={ala.contagem} esquerdaCurta={ala.eyebrowCurto} />
                <h2 className="titulo-cena serif" data-palavras><Palavras texto={ala.titulo} /></h2>
                <p className="corpo-apoio" data-reveal>{ala.lead}</p>
                {ala.id === 'trabalhos' && (
                  <nav className="grupos-atalhos" aria-label="Grupos de projetos">
                    {Object.values(GRUPOS).map((g) => (
                      <a key={g.id} href={`#${g.id}`} className="porta-btn">{g.titulo} <i aria-hidden="true">↓</i></a>
                    ))}
                  </nav>
                )}
                {ala.id === 'problemas' && (
                  <nav className="portas-lista" aria-label="Portas: escolha a sua necessidade">
                    <span className="micro">{expor ? 'Escolha aqui ou nas portas, logo à frente' : 'Escolha a sua'}</span>
                    <div>
                      {PORTAS.map((p, k) => (
                        <button type="button" key={p.obra} className="porta-btn" onClick={() => entrarPorta(k)}>
                          <i aria-hidden="true">{String(k + 1).padStart(2, '0')}</i>{p.objetivo}
                        </button>
                      ))}
                    </div>
                  </nav>
                )}
              </div>
              {ala.obras.map((o, i) => {
                const grupo = o.grupo && o.grupo !== grupoAtual ? GRUPOS[(grupoAtual = o.grupo)] : null
                const Titulo = o.grupo ? 'h4' : 'h3' // na Ala 01 o título do grupo é o h3
                const lnk = (l, cls) => (l.externo
                  ? <a key={l.href} className={cls} href={l.href} target="_blank" rel="noopener">{l.rotulo} ↗</a>
                  : <a key={l.href} className={cls} href={l.href}>{l.rotulo} {l.href.startsWith('#') ? '↓' : '→'}</a>)
                return (
                  <Fragment key={o.id}>
                    {grupo && (
                      <div className="obra-grupo" id={grupo.id}>
                        <div className="wrap">
                          <div className="grupo-painel">
                            <span className="micro">{grupo === GRUPOS.clientes ? 'Grupo 1 de 2' : 'Grupo 2 de 2'}</span>
                            <h3 className="serif">{grupo.titulo}</h3>
                            <p>{grupo.lead}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <article className={`obra${i % 2 ? ' obra-dir' : ''}`} id={`obra-${o.id}`} data-img={o.img} data-img-hd={imagemHD(o.img)} data-w={o.w} data-lado={i % 2 ? 1 : -1}
                      data-rolagem={o.rolagem?.base} data-rolagem-modo={o.rolagem?.modo} data-rolagem-n={o.rolagem?.n}>
                      <div className="wrap">
                        <div className="obra-legenda">
                          <img src={o.img} className={o.amostras || o.videos ? 'so-3d' : undefined} alt={o.grupo ? `Tela do projeto ${o.titulo}` : ''} width="720" height="450" loading="lazy" decoding="async" />
                          <span className="micro">{o.objetivo ? `Porta ${String(i + 1).padStart(2, '0')} · ${o.objetivo}` : o.selo}</span>
                          <Titulo className="serif">{o.titulo}</Titulo>
                          {o.categoria && <p className="obra-nicho">{o.categoria}</p>}
                          <p>{o.objetivo ? <><b>O que a Maintor Flow oferece:</b> {o.texto}</> : o.texto}</p>
                          {o.amostras && (
                            <ul className="obra-amostras">
                              {o.amostras.map((a) => (
                                <li key={a.img}>
                                  <img src={a.img} alt={a.alt} width="1080" height="1350" loading="lazy" decoding="async" />
                                  <span>{a.legenda}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {o.videos && (
                            <ul className="obra-videos">
                              {o.videos.map((v) => (
                                <li key={v.src}>
                                  <button type="button" className="video-capa" onClick={() => setVideo(v)} aria-label={`Assistir ao vídeo ${v.titulo} (${v.duracao})`}>
                                    <img src={v.capa} alt="" width="720" height="1280" loading="lazy" decoding="async" />
                                    <span className="video-play" aria-hidden="true">▶</span>
                                    <span className="video-dur" aria-hidden="true">{v.duracao}</span>
                                  </button>
                                  <b>{v.titulo}</b>
                                  <span>{v.legenda}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {o.nota && <p className="obra-nota">{o.nota}</p>}
                          <div className="obra-links">
                            {lnk(o.acao, 'btn btn-fino')}
                            {(o.mais || []).map((l) => lnk(l, 'link-mostarda'))}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Fragment>
                )
              })}
            </section>
          )
        })}

        {/* ============ COMO TRABALHAMOS — o processo, depois de Marketing ============ */}
        <section className="cena cena-curta" id="como">
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="Como trabalhamos" direita="Processo em quatro etapas" direitaCurta="4 etapas" />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Da primeira conversa à entrega." destaque={[3, 4]} />
            </h2>
            <ol className="linhas linhas-processo" style={{ marginTop: 'var(--s4)' }} data-reveal>
              <li><LinhaEd idx="01" rot="Conversa" val="Você conta o que precisa resolver. A gente entende sua rotina, seu objetivo e o que já existe." /></li>
              <li><LinhaEd idx="02" rot="Proposta" val="Você recebe por escrito o escopo, o prazo, o investimento e o que cada parte precisa fornecer." /></li>
              <li><LinhaEd idx="03" rot="Desenvolvimento" val="Você acompanha as etapas e valida as principais telas ou entregas durante o desenvolvimento." /></li>
              <li><LinhaEd idx="04" rot="Entrega" val="Publicamos ou disponibilizamos o projeto e orientamos sua equipe a usar a solução, conforme o escopo contratado." /></li>
            </ol>
            {/* as condições mudam com o tipo de projeto: nada de prometer código ou dados de forma genérica */}
            <div className="modalidades" data-reveal>
              <h3 className="micro">O que muda conforme o tipo de projeto</h3>
              <dl>
                <div><dt>Projeto sob medida</dt><dd>Site, loja ou sistema. Você paga pelo desenvolvimento; domínio, contas e dados ficam no seu nome, e o que é entregue — código, treinamento, manual — fica descrito na proposta.</dd></div>
                <div><dt>Serviço contínuo</dt><dd>Conteúdo, campanhas e manutenção mensal. Contratado à parte, com escopo e valor próprios.</dd></div>
                <div><dt>Produto por assinatura</dt><dd>Maintor CMMS, Maintor FIT, Horaqui, Maintor RH e Maintor Task. Seguem as condições de cada produto.</dd></div>
              </dl>
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
            <Regua esquerda="Perguntas frequentes" direita="Valores, prazos e condições" direitaCurta={`${PERGUNTAS.length} respostas`} />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Antes de chamar, o que a maioria quer saber." destaque={[7, 8]} />
            </h2>
            <div className="faq-home" data-reveal>
              {PERGUNTAS.map((q) => (
                <details key={q.p}>
                  <summary>{q.p}</summary>
                  <p>
                    {q.r}
                    {q.href && <> {q.externo
                      ? <a href={q.href} target="_blank" rel="noopener">{q.rotulo}</a>
                      : <a href={q.href}>{q.rotulo}</a>}</>}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTATO — a conversa em primeiro lugar ============ */}
        <section className="cena" id="contato">
          <figure className="painel-foto solto-direita" data-reveal>
            <img
              src="/midia/contato-balao.webp"
              alt=""
              loading="lazy" width="760" height="760"
            />
          </figure>
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="Contato" direita="Primeira conversa sem compromisso" direitaCurta="Sem compromisso" />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Conte o que você quer colocar no ar" destaque={[5, 6, 7]} />
            </h2>
            <p className="corpo-apoio contato-apoio" data-reveal>
              Diga o que seu negócio faz e o que você precisa resolver. A gente conversa sobre o formato do projeto e os próximos passos.
            </p>

            <form className="form-flow" onSubmit={abrirWhats} data-reveal>
              <fieldset className="form-objetivo">
                <legend className="micro">O que você quer conversar?</legend>
                <div className="opcoes">
                  {OBJETIVOS.map((o) => (
                    <button
                      type="button"
                      key={o.rotulo}
                      className={`opcao${objetivo === o ? ' ativa' : ''}`}
                      aria-pressed={objetivo === o}
                      onClick={() => setObjetivo(objetivo === o ? null : o)}
                    >
                      {o.rotulo}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="micro" htmlFor="campo-nome">Seu nome</label>
              <input
                id="campo-nome"
                type="text"
                placeholder="como podemos te chamar?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
              />
              <label className="micro" htmlFor="campo-negocio">O que o seu negócio faz (opcional)</label>
              <input
                id="campo-negocio"
                type="text"
                placeholder="ex.: loja de roupas, clínica, indústria"
                value={negocio}
                onChange={(e) => setNegocio(e.target.value)}
                autoComplete="organization"
              />
              <label className="micro" htmlFor="campo-whats">Seu WhatsApp (opcional)</label>
              <input
                id="campo-whats"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                aria-describedby="obs-whats"
                value={whats}
                onChange={(e) => setWhats(e.target.value)}
                autoComplete="tel"
              />
              <div>
                <button className="btn" type="submit" onMouseEnter={blipHover}>
                  Conversar no WhatsApp
                </button>
              </div>
              <p className="form-obs" id="obs-whats">
                Abre a conversa no WhatsApp (11) 94661-0634 com a mensagem pronta. Se deixar o seu número,
                guardamos o contato só para retornar caso a conversa não abra.
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
          <aside className="sala-painel" aria-label={`Porta ${sala + 1}: ${p.objetivo}`} key={sala}>
            <span className="micro">Porta {String(sala + 1).padStart(2, '0')} de {String(PORTAS.length).padStart(2, '0')} · {p.objetivo}</span>
            <h2 className="serif" tabIndex={-1} ref={salaTituloRef}>“{p.frase}”</h2>
            <p className="sala-solucao"><b>O que a Maintor Flow oferece:</b> {p.texto}</p>
            <div className="sala-ctas">
              <a className="btn" href={whatsDe(p.assunto)} target="_blank" rel="noopener" onMouseEnter={blipHover}>Conversar sobre isso no WhatsApp</a>
              {[p.acao, ...(p.mais || [])].map((l) => (l.href.startsWith('#')
                ? <a key={l.href} className="link-mostarda" href={l.href} onClick={(e) => irDaSala(e, l.href)}>{l.rotulo} ↓</a>
                : <a key={l.href} className="link-mostarda" href={l.href}>{l.rotulo} →</a>))}
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

      {/* player dos vídeos de clientes: só monta o <video> depois do clique; toca porque a pessoa pediu */}
      <dialog
        className="video-dialogo"
        ref={videoDialogoRef}
        aria-label={video ? `Vídeo: ${video.titulo}` : 'Vídeo'}
        onClose={() => setVideo(null)}
        onClick={(e) => { if (e.target === e.currentTarget) setVideo(null) }}
      >
        {video && (
          <div className="video-corpo">
            <div className="video-topo">
              <span className="micro">{video.titulo}</span>
              <button type="button" className="pergunta-fechar" onClick={() => setVideo(null)} aria-label="Fechar o vídeo">✕</button>
            </div>
            <video src={video.src} poster={video.capa} controls autoPlay playsInline preload="metadata" width="720" height="1280" />
            <p>{video.legenda}</p>
          </div>
        )}
      </dialog>

      <footer>
        {/* o catálogo completo de serviços: saiu da área de contato (10/11) e mora aqui */}
        <nav className="wrap rodape-servicos" aria-label="Todos os serviços">
          <div>
            <h2 className="micro">Serviços</h2>
            <ul>{CATALOGO.map((s) => <li key={s.href}><a href={s.href}>{s.rotulo}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="micro">Para decidir</h2>
            <ul>{CATALOGO_APOIO.map((s) => <li key={s.href}><a href={s.href}>{s.rotulo}</a></li>)}</ul>
          </div>
        </nav>
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
