import { useCallback, useEffect, useRef, useState } from 'react'

/* ================================================================
   Dois carrosséis na linguagem da Maintor Flow.

   O padrão de interação vem da referência enviada (retrato grande +
   cartão sobreposto, setas e dots embaixo, transição por fade), mas
   reescrito no stack do site: React + CSS próprio, sem Tailwind,
   sem framer-motion, sem next/image — e na paleta do MASTER.md.

   Ambos retornam null com lista vazia: sem conteúdo real, sem seção.
   ================================================================ */

/* navegação compartilhada: índice, próximo/anterior, teclado */
function useCarrossel(total) {
  const [i, setI] = useState(0)
  const proximo = useCallback(() => setI((v) => (v + 1) % total), [total])
  const anterior = useCallback(() => setI((v) => (v - 1 + total) % total), [total])
  const aoTeclar = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); proximo() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); anterior() }
    },
    [proximo, anterior],
  )
  return { i, setI, proximo, anterior, aoTeclar }
}

function Navegacao({ total, i, setI, proximo, anterior, rotulo }) {
  if (total < 2) return null
  return (
    <div className="carrossel-nav">
      <button type="button" className="seta" onClick={anterior} aria-label={`${rotulo} anterior`}>
        <span aria-hidden="true">←</span>
      </button>
      <div className="pontos">
        {Array.from({ length: total }, (_, n) => (
          <button
            key={n}
            type="button"
            className={`ponto${n === i ? ' ativo' : ''}`}
            onClick={() => setI(n)}
            aria-label={`Ir para ${rotulo.toLowerCase()} ${n + 1} de ${total}`}
            aria-current={n === i ? 'true' : undefined}
          />
        ))}
      </div>
      <button type="button" className="seta" onClick={proximo} aria-label={`${rotulo} seguinte`}>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  )
}

/* ---- 1. DEPOIMENTOS ------------------------------------------ */
export function CarrosselDepoimentos({ itens = [] }) {
  const total = itens.length
  const { i, setI, proximo, anterior, aoTeclar } = useCarrossel(total || 1)
  if (!total) return null // sem depoimento real, a seção não existe

  const d = itens[i]
  return (
    <div
      className="depo-palco"
      tabIndex={0}
      onKeyDown={aoTeclar}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Depoimentos de clientes"
    >
      <div className="depo-corpo" key={i}>
        {d.foto && (
          <figure className="depo-retrato">
            <img src={d.foto} alt={`${d.nome}, ${d.papel}`} loading="lazy" width="560" height="560" />
          </figure>
        )}
        <blockquote className={`depo-cartao${d.foto ? '' : ' sem-foto'}`}>
          <p className="depo-texto serif">“{d.texto}”</p>
          <footer>
            <div className="depo-nome">{d.nome}</div>
            <div className="micro depo-papel">{d.papel}</div>
            {d.link && (
              <a className="link-mostarda" href={d.link} target="_blank" rel="noopener">
                {d.linkRotulo || 'Ver o trabalho'} →
              </a>
            )}
          </footer>
        </blockquote>
      </div>
      <Navegacao {...{ total, i, setI, proximo, anterior }} rotulo="Depoimento" />
    </div>
  )
}

/* ---- 2. TELAS DOS SISTEMAS ----------------------------------- */
export function CarrosselTelas({ itens = [] }) {
  const total = itens.length
  const { i, setI, proximo, anterior, aoTeclar } = useCarrossel(total || 1)
  const trilhoRef = useRef(null)

  // pré-carrega o próximo slide para a troca não piscar
  useEffect(() => {
    if (total < 2) return
    const prox = itens[(i + 1) % total]
    if (prox?.src) new Image().src = prox.src
  }, [i, itens, total])

  if (!total) return null

  const t = itens[i]
  return (
    <div
      className="telas-palco"
      tabIndex={0}
      onKeyDown={aoTeclar}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Telas dos sistemas desenvolvidos pela Maintor"
    >
      <figure className="telas-moldura" ref={trilhoRef}>
        <figcaption className="browser-bar">
          <span className="bolinha" /><span className="bolinha" /><span className="bolinha" />
          <span className="url">{t.sistema}</span>
        </figcaption>
        <img
          key={t.src}
          src={t.src}
          alt={t.alt}
          loading={i === 0 ? 'eager' : 'lazy'}
          width={t.largura || 1440}
          height={t.altura || 900}
        />
      </figure>
      <div className="telas-legenda" aria-live="polite">
        <div>
          <div className="micro telas-sistema">{t.sistema}</div>
          <h3 className="serif telas-titulo">{t.titulo}</h3>
          {t.nota && <p className="telas-nota">{t.nota}</p>}
        </div>
        <span className="telas-contador micro">
          {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
      <Navegacao {...{ total, i, setI, proximo, anterior }} rotulo="Tela" />
    </div>
  )
}
