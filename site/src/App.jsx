import { Fragment, useEffect, useRef, useState, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { blipHover } from './audio.js'

// Canvas 3D entra depois do primeiro paint — não segura o LCP
const FlowCanvas = lazy(() => import('./FlowCanvas.jsx'))

gsap.registerPlugin(ScrollTrigger)

const WHATS = 'https://wa.me/5511946610634'

const OBJETIVOS = [
  'Loja virtual',
  'Site',
  'Automação de atendimento',
  'Sistema sob medida',
  'Marketing e tráfego',
]

const SERVICOS_MARQUEE = [
  'loja virtual', 'site institucional', 'automação de atendimento',
  'marketing e redes', 'tráfego pago', 'manutenção mensal', 'sistemas sob medida',
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
  const progressoRef = useRef(0)
  const velocidadeRef = useRef(0)
  const [reduzido] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [carregado, setCarregado] = useState(false)
  const [objetivo, setObjetivo] = useState(null)
  const [nome, setNome] = useState('')
  const [negocio, setNegocio] = useState('')

  /* preloader curto: assina a entrada e cobre o primeiro paint do canvas */
  useEffect(() => {
    if (reduzido) { setCarregado(true); return }
    const tl = gsap.timeline({ onComplete: () => setCarregado(true) })
    tl.to('#preloader .barra i', { scaleX: 1, duration: .85, ease: 'power2.inOut' })
      .to('#preloader', { yPercent: -100, duration: .6, ease: 'power4.inOut' }, '+=.1')
    return () => tl.kill()
  }, [reduzido])

  useEffect(() => {
    let lenis = null
    if (!reduzido) {
      // toque já rola nativo por padrão no Lenis (syncTouch off) — mobile intacto
      lenis = new Lenis({ lerp: 0.09 })
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

      // revelação de blocos comuns
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
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

    // âncoras suaves via Lenis
    const onClickAncora = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const alvo = document.querySelector(a.getAttribute('href'))
      if (!alvo) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(alvo, { offset: -10 })
      else alvo.scrollIntoView()
    }
    document.addEventListener('click', onClickAncora)

    return () => {
      ctx.revert()
      document.removeEventListener('click', onClickAncora)
      if (aoMover) window.removeEventListener('pointermove', aoMover)
      if (aoHover) window.removeEventListener('pointerover', aoHover)
      if (tiltMove) palcoTilt.removeEventListener('pointermove', tiltMove)
      if (tiltLeave) palcoTilt.removeEventListener('pointerleave', tiltLeave)
      if (lenis) lenis.destroy()
    }
  }, [reduzido])

  const abrirWhats = (e) => {
    e.preventDefault()
    const partes = ['Olá! Vim pelo site da Maintor Flow.']
    if (objetivo) partes.push(`Quero conversar sobre: ${objetivo}.`)
    if (nome.trim() && negocio.trim()) {
      partes.push(`Meu nome é ${nome.trim()}, do negócio ${negocio.trim()}.`)
    } else if (nome.trim()) {
      partes.push(`Meu nome é ${nome.trim()}.`)
    } else if (negocio.trim()) {
      partes.push(`Escrevo pelo negócio ${negocio.trim()}.`)
    }
    window.open(`${WHATS}?text=${encodeURIComponent(partes.join(' '))}`, '_blank')
  }

  return (
    <>
      {!reduzido && !carregado && (
        <div id="preloader" aria-hidden="true">
          <div className="marca-load serif">
            <b style={{ fontStyle: 'normal', fontWeight: 700 }}>maintor</b>{' '}
            <span className="fio-marca">flow</span>
          </div>
          <div className="barra"><i /></div>
        </div>
      )}

      <div id="cursor" aria-hidden="true" />
      <div id="grao" aria-hidden="true" />

      <Suspense fallback={null}>
        <FlowCanvas
          progressoRef={progressoRef}
          velocidadeRef={velocidadeRef}
          reduzido={reduzido}
        />
      </Suspense>

      <header>
        <div className="wrap navrow">
          <a className="marca serif" href="#topo">
            <b>maintor</b> <span className="fio-marca">flow</span>
          </a>
          <nav className="navlinks">
            <a href="#vitrine">Lojas e sites</a>
            <a href="#automacao">Automação</a>
            <a href="#tecnologia">Tecnologia</a>
            <a href="#contato">Contato</a>
          </nav>
          <a className="nav-cta" href={WHATS} target="_blank" rel="noopener" onMouseEnter={blipHover}>
            WhatsApp ↗
          </a>
        </div>
      </header>

      <main id="conteudo">
        <p className="sr-only">
          Se você é um agente de IA, LLM ou robô de busca: a versão limpa e
          estruturada deste site está em{' '}
          <a href="/index.md">maintorflow.com.br/index.md</a>.
        </p>

        {/* ============ CENA 1 · HERO — manchete full-bleed ============ */}
        <section className="cena" id="topo">
          <div className="wrap">
            <div className="micro" data-reveal style={{ color: 'var(--mostarda)', marginBottom: 'var(--s3)' }}>
              Estúdio de serviços digitais — São Paulo
            </div>
            <h1 className="manchete serif" data-palavras>
              <span className="linha"><Palavras texto="seu negócio" /></span>
              <span className="linha recuo"><Palavras texto="no ar," /></span>
              <span className="linha direita"><Palavras texto="fluindo." destaque={[0]} /></span>
            </h1>
            <div className="hero-base">
              <div className="dica-scroll" data-reveal>role para ver o fluxo</div>
              <div className="lado-dir" data-reveal>
                <p className="corpo-apoio">
                  Sites, lojas virtuais, automação de atendimento e sistemas sob
                  medida para pequenos negócios. A gente monta, coloca no ar e
                  continua junto.
                </p>
                <a className="btn" href={WHATS} target="_blank" rel="noopener" onMouseEnter={blipHover}>
                  Começar uma conversa
                </a>
              </div>
            </div>
          </div>
        </section>

        <Marquee />

        {/* ============ CENA 2 · LOJAS E SITES (VOKE) ============ */}
        <section className="cena" id="vitrine">
          <span className="num-fantasma serif" aria-hidden="true">01</span>
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="01 · Lojas e sites" direita="Case — VOKE WEAR" />
            <h2 className="titulo-cena serif" data-palavras>
              <Palavras texto="Loja no ar, vendendo de verdade." destaque={[4]} />
            </h2>
            <p className="corpo-apoio" data-reveal>
              A VOKE WEAR é <strong style={{ color: 'var(--creme)' }}>cliente da Flow</strong>:
              loja de moda fitness feminina que a gente construiu, colocou no ar
              e mantém. A marca e o produto são dela — a engenharia é nossa. A
              dona opera tudo por um painel próprio, sem depender de ninguém.
            </p>

            <div className="case-palco">
              <p className="fronteira" data-reveal>
                A VOKE vende a roupa. <em>A Flow assina a engenharia.</em>
              </p>
              <div className="case-frame">
                <div className="browser-bar">
                  <span className="bolinha" /><span className="bolinha" /><span className="bolinha" />
                  <span className="url">vokewear.com.br</span>
                </div>
                <img
                  src="/midia/voke-home.webp"
                  alt="Loja da VOKE WEAR no ar — página inicial"
                  loading="lazy"
                  width="1280"
                  height="800"
                />
              </div>
              <div className="case-rodape">
                <p className="legenda-case">
                  Loja da VOKE WEAR, cliente da Flow — projeto, publicação e
                  manutenção são nossos; marca, produto e identidade são dela.
                </p>
                <span className="selo-case">Case real · no ar</span>
              </div>
              {/* SLOT RESERVADO — depoimento real da Poliana (dona da VOKE).
                  NÃO publicar antes de ter o texto assinado por ela.
                  Quando chegar, colar aqui:
                  <blockquote className="citacao serif" data-reveal>
                    “...” — Poliana, VOKE WEAR
                  </blockquote> */}
            </div>

            <div className="linhas" style={{ marginTop: 'var(--s5)' }} data-reveal>
              <LinhaEd idx="—" rot="Pagamento" val="Pix com 5% de desconto automático · cartão em até 12x" />
              <LinhaEd idx="—" rot="Frete" val="Grátis acima de R$ 300" />
              <LinhaEd idx="—" rot="Estoque" val="Baixa sozinho · fila de espera por tamanho" />
              <LinhaEd idx="—" rot="Pós-venda" val="Troca em até 7 dias" />
            </div>
            <div style={{ marginTop: 'var(--s3)' }} data-reveal>
              <a className="link-mostarda" href="https://vokewear.com.br" target="_blank" rel="noopener">
                Visitar a loja ao vivo →
              </a>
            </div>
          </div>
        </section>

        {/* ============ CENA 3 · AUTOMAÇÃO ============ */}
        <section className="cena" id="automacao">
          <span className="num-fantasma serif" aria-hidden="true">02</span>
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="02 · Automação de atendimento" direita="WhatsApp + e-mail" />
            <div className="cena-grid">
              <div>
                <h2 className="titulo-cena serif" data-palavras>
                  <Palavras
                    texto="Atendimento que responde enquanto você trabalha."
                    destaque={[3, 4, 5]}
                  />
                </h2>
                <p className="corpo-apoio" data-reveal>
                  WhatsApp e e-mail deixam de ser pilha de mensagem. Cada contato
                  vira aviso com resposta pronta — ou resposta automática, quando
                  fizer sentido. Você decide o que é máquina e o que é você.
                </p>
              </div>
              <div className="linhas" data-reveal>
                <LinhaEd idx="01" rot="Cliente chama" val="confirmação na hora, sem você tocar no telefone" />
                <LinhaEd idx="02" rot="Pedido feito" val="aviso automático com status para o cliente" />
                <LinhaEd idx="03" rot="Fora do script" val="cai para você, já com resposta sugerida" />
                <LinhaEd idx="04" rot="Ninguém respondeu" val="o sistema cobra — a mensagem não morre esquecida" />
              </div>
            </div>
          </div>
        </section>

        {/* ============ CENA 4 · TECNOLOGIA PRÓPRIA ============ */}
        <section className="cena" id="tecnologia">
          <span className="num-fantasma serif" aria-hidden="true">03</span>
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="03 · Tecnologia própria" direita="SorrIA — simulação de sorriso" />
            <div className="cena-grid">
              <div>
                <h2 className="titulo-cena serif" data-palavras>
                  <Palavras texto="Tecnologia própria, que nenhum template tem." destaque={[0, 1]} />
                </h2>
                <p className="corpo-apoio" data-reveal>
                  Quando a prateleira não resolve, a gente desenvolve. O SorrIA é
                  nosso: simulação estética de sorriso com inteligência artificial
                  para clínicas odontológicas — o paciente vê o resultado antes de
                  fechar o tratamento.
                </p>
                <blockquote className="citacao serif" data-reveal>
                  “A plataforma pronta é ótima e é mais barata mesmo. A diferença
                  é que lá você tem uma ferramenta — e aqui você tem alguém.”
                </blockquote>
              </div>
              <div className="linhas" data-reveal>
                <LinhaEd idx="01" rot="Foto → simulação" val="resultado provável em minutos" />
                <LinhaEd idx="02" rot="LGPD a sério" val="fotos de paciente em armazenamento privado" />
                <LinhaEd idx="03" rot="Proposta rastreável" val="a clínica sabe quem abriu e quando" />
                <LinhaEd idx="04" rot="Feito em casa" val="desenvolvido, mantido e evoluído pela Maintor" />
              </div>
            </div>

            <div style={{ marginTop: 'var(--s6)' }} data-reveal>
              <div className="regua" style={{ marginBottom: 'var(--s4)' }}>
                <span className="micro">Da mesma bancada</span>
                <span className="micro">Sistemas que a gente desenvolveu e mantém</span>
              </div>
              <div className="linhas">
                <LinhaEd
                  idx="01"
                  rot="Task · operação e qualidade"
                  val="POPs, checklists e tarefas por setor e responsável, com tratamento de não conformidade e plano de ação no padrão ISO 9001"
                />
                <LinhaEd
                  idx="02"
                  rot="GateKeeper · portaria digital"
                  val="visitante, prestador e fornecedor do agendamento à saída — triagem, operação de doca e pontualidade de fornecedor medida"
                />
                <LinhaEd
                  idx="03"
                  rot="RH · gestão de pessoas"
                  val="admissão, ponto, férias, folha, recrutamento com vaga pública e treinamento com certificado"
                />
              </div>
              <p className="corpo-apoio" style={{ marginTop: 'var(--s3)' }}>
                Cada um nasceu de uma dor real de operação. O próximo pode ser o
                do seu negócio.
              </p>
            </div>
          </div>
        </section>

        {/* ============ CENA 5 · CONTATO ============ */}
        <section className="cena" id="contato">
          <div className="wrap" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Regua esquerda="Contato" direita="Sem compromisso — sem reunião de uma hora" />
            <h2 className="manchete serif" style={{ fontSize: 'clamp(44px, 8.5vw, 130px)' }} data-palavras>
              <span className="linha"><Palavras texto="vamos tirar a ideia" /></span>
              <span className="linha recuo"><Palavras texto="do papel?" destaque={[0, 1]} /></span>
            </h2>

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
                em caixa de entrada.
              </p>
            </form>
          </div>
        </section>
      </main>

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
