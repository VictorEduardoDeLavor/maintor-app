import { Fragment, useEffect, useMemo, useState } from 'react'
import { ALAS, GRUPOS, msgWhats } from './obras.js'

/* ================================================================
   GUIA DA EXPOSIÇÃO (05/11/2026) — o visitante nunca fica perdido.

   Uma barra discreta no rodapé, que aparece quando o passeio começa:
   · onde estou: "Ala 1 · Projetos para clientes — 2 de 3" + um mapa de pontos
     (um por obra, agrupados por ala) que se acende conforme se anda
   · andar de obra em obra: ‹ › e as setas do teclado levam até a próxima;
     clicar num ponto vai direto à obra
   · converter na hora: "Quero algo assim" abre o WhatsApp dizendo qual
     obra a pessoa viu (10/11: o assunto de cada obra vem de obras.js)
   Na Ala 01 o guia mostra o grupo (clientes ou produtos da Maintor), e o
   mapa separa os dois grupos — a categoria atual fica sempre à vista.
   Some na entrada, no contato e enquanto a abertura roda.
   ================================================================ */

const WHATS = 'https://wa.me/5511946610634'

export default function Guia({ lenisRef, ativo }) {
  const obras = useMemo(() => ALAS.flatMap((ala, ia) => ala.obras.map((o, io) => {
    // dentro de um grupo (Ala 01), a contagem é do grupo: "2 de 3" nos projetos para clientes
    const doGrupo = o.grupo ? ala.obras.filter((x) => x.grupo === o.grupo) : ala.obras
    return {
      ...o, ala: ala.id, ia, io: doGrupo.indexOf(o), nAla: doGrupo.length,
      nomeAla: o.grupo ? GRUPOS[o.grupo].titulo : ala.eyebrow.replace(/^Ala \d+ · /, ''),
      curto: o.objetivo || o.titulo.replace(/[“”]/g, ''),
    }
  })), [])
  const [atual, setAtual] = useState(-1)
  const [naFaixa, setNaFaixa] = useState(false) // a rolagem está entre a Ala 01 e o processo
  /* 11/11 (limpeza visual): a barra só aparece quando há uma OBRA EM FOCO — nunca na abertura nem nas
     cabeças de ala, onde cobria botões. Quem avisa é a exposição 3D (evento flow:obra-foco, com o id da
     obra que chegou na posição de leitura, ou null). Sem 3D não há foco: vale a faixa de rolagem. */
  const [foco, setFoco] = useState(null)
  useEffect(() => {
    const aoFoco = (e) => setFoco(e.detail || null)
    window.addEventListener('flow:obra-foco', aoFoco)
    return () => window.removeEventListener('flow:obra-foco', aoFoco)
  }, [])
  const sem3d = typeof document !== 'undefined' && document.documentElement.classList.contains('sem-3d')
  // 12/11: com o foco do teclado dentro da barra ela continua à vista (nunca aria-hidden com foco dentro)
  const [focoDentro, setFocoDentro] = useState(false)
  const visivel = naFaixa && (sem3d || !!foco || focoDentro)

  useEffect(() => {
    if (!ativo) return
    const els = obras.map((o) => document.getElementById(`obra-${o.id}`))
    const inicio = document.getElementById('trabalhos')
    const fim = document.getElementById('como') || document.getElementById('contato')
    let raf = 0
    const medir = () => {
      raf = 0
      const meio = window.innerHeight * 0.5
      let melhor = -1, dist = Infinity
      els.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const d = Math.abs(r.top + r.height / 2 - meio)
        if (d < dist) { dist = d; melhor = i }
      })
      setAtual(melhor)
      const a = inicio?.getBoundingClientRect().top ?? 0
      const b = fim?.getBoundingClientRect().top ?? Infinity
      setNaFaixa(a < window.innerHeight * 0.6 && b > window.innerHeight * 0.4)
    }
    const agendar = () => { if (!raf) raf = requestAnimationFrame(medir) }
    window.addEventListener('scroll', agendar, { passive: true })
    window.addEventListener('resize', agendar)
    medir()
    return () => { window.removeEventListener('scroll', agendar); window.removeEventListener('resize', agendar); cancelAnimationFrame(raf) }
  }, [ativo, obras])

  const irPara = (i) => {
    const o = obras[Math.max(0, Math.min(obras.length - 1, i))]
    const el = document.getElementById(`obra-${o.id}`)
    if (!el) return
    const alvo = window.scrollY + el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - window.innerHeight / 2
    const lenis = lenisRef?.current
    if (lenis) lenis.scrollTo(alvo, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 3) })
    else window.scrollTo({ top: alvo, behavior: 'smooth' })
  }

  // setas do teclado: ← → andam de obra em obra (fora de campos de texto)
  useEffect(() => {
    if (!ativo) return
    const tecla = (e) => {
      // 12/11: as setas valem em toda a faixa das obras, com ou sem obra em foco (antes dependiam da barra à vista)
      if (!naFaixa || e.altKey || e.ctrlKey || e.metaKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(atual - 1) }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  if (!ativo || atual < 0) return null
  const o = obras[atual]
  const msg = msgWhats(o.assunto)
  const texto = typeof window !== 'undefined' && typeof window.__flowComOrigem === 'function' ? window.__flowComOrigem(msg) : msg

  return (
    <nav className={`guia${visivel ? ' guia-on' : ''}`} aria-label="Guia da exposição" aria-hidden={!visivel}
      onFocus={() => setFocoDentro(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocoDentro(false) }}>
      <button type="button" className="guia-seta" onClick={() => irPara(atual - 1)} disabled={atual === 0} aria-label="Obra anterior" tabIndex={visivel ? 0 : -1}>‹</button>
      <div className="guia-meio">
        <div className="guia-onde" aria-live="polite">
          <span className="micro">Ala {o.ia + 1} · {o.nomeAla}</span>
          <b>{o.curto}</b>
          <span className="guia-conta">{o.io + 1} de {o.nAla}</span>
        </div>
        <div className="guia-mapa" role="list">
          {ALAS.map((ala, ia) => (
            <span className="guia-ala" role="listitem" key={ala.id}>
              {ala.obras.map((ob, k) => {
                const i = obras.findIndex((x) => x.id === ob.id)
                const x = obras[i]
                return (
                  <Fragment key={ob.id}>
                    {/* na Ala 01, um traço curto separa clientes de produtos */}
                    {k > 0 && ob.grupo && ob.grupo !== ala.obras[k - 1].grupo && <i className="guia-grupo" aria-hidden="true" />}
                    <button type="button" className={`guia-ponto${i === atual ? ' atual' : i < atual ? ' visto' : ''}`}
                      onClick={() => irPara(i)} aria-label={`Ir para ${x.curto} (${x.nomeAla})`} tabIndex={visivel ? 0 : -1} />
                  </Fragment>
                )
              })}
              {ia < ALAS.length - 1 && <i aria-hidden="true" />}
            </span>
          ))}
        </div>
      </div>
      <a className="guia-quero" href={`${WHATS}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener" tabIndex={visivel ? 0 : -1}>Quero algo assim</a>
      <button type="button" className="guia-seta" onClick={() => irPara(atual + 1)} disabled={atual === obras.length - 1} aria-label="Próxima obra" tabIndex={visivel ? 0 : -1}>›</button>
    </nav>
  )
}
