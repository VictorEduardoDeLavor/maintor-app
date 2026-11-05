import { useEffect, useMemo, useState } from 'react'
import { ALAS } from './obras.js'

/* ================================================================
   GUIA DA EXPOSIÇÃO (05/11/2026) — o visitante nunca fica perdido.

   Uma barra discreta no rodapé, que aparece quando o passeio começa:
   · onde estou: "Ala 1 · Trabalhos — obra 3 de 8" + um mapa de pontos
     (um por obra, agrupados por ala) que se acende conforme se anda
   · andar de obra em obra: ‹ › e as setas do teclado levam até a próxima;
     clicar num ponto vai direto à obra
   · converter na hora: "Quero algo assim" abre o WhatsApp dizendo qual
     obra a pessoa viu
   Some na entrada, no contato e enquanto a abertura roda.
   ================================================================ */

const WHATS = 'https://wa.me/5511946610634'

export default function Guia({ lenisRef, ativo }) {
  const obras = useMemo(() => ALAS.flatMap((ala, ia) => ala.obras.map((o, io) => ({
    ...o, ala: ala.id, ia, io, nAla: ala.obras.length, nomeAla: ala.eyebrow.replace(/^Ala \d+ · /, ''),
  }))), [])
  const [atual, setAtual] = useState(-1)
  const [visivel, setVisivel] = useState(false)

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
      setVisivel(a < window.innerHeight * 0.6 && b > window.innerHeight * 0.4)
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
      if (!visivel || e.altKey || e.ctrlKey || e.metaKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(atual - 1) }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  if (!ativo || atual < 0) return null
  const o = obras[atual]
  const msg = `Olá! Vim pelo site da Maintor Flow. Vi "${o.titulo.replace(/[“”"]/g, '')}" na exposição e quero algo assim para o meu negócio.`
  const texto = typeof window !== 'undefined' && typeof window.__flowComOrigem === 'function' ? window.__flowComOrigem(msg) : msg

  return (
    <nav className={`guia${visivel ? ' guia-on' : ''}`} aria-label="Guia da exposição" aria-hidden={!visivel}>
      <button type="button" className="guia-seta" onClick={() => irPara(atual - 1)} disabled={atual === 0} aria-label="Obra anterior" tabIndex={visivel ? 0 : -1}>‹</button>
      <div className="guia-meio">
        <div className="guia-onde" aria-live="polite">
          <span className="micro">Ala {o.ia + 1} · {o.nomeAla}</span>
          <b>{o.titulo.replace(/[“”]/g, '')}</b>
          <span className="guia-conta">obra {o.io + 1} de {o.nAla}</span>
        </div>
        <div className="guia-mapa" role="list">
          {ALAS.map((ala, ia) => (
            <span className="guia-ala" role="listitem" key={ala.id}>
              {ala.obras.map((ob) => {
                const i = obras.findIndex((x) => x.id === ob.id)
                return (
                  <button type="button" key={ob.id} className={`guia-ponto${i === atual ? ' atual' : i < atual ? ' visto' : ''}`}
                    onClick={() => irPara(i)} aria-label={`Ir para ${ob.titulo.replace(/[“”]/g, '')}`} tabIndex={visivel ? 0 : -1} />
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
