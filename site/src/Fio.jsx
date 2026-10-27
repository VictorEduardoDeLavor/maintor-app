import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ================================================================
   O FIO (27/10/2026) — o fundo da home deixa de ser decoração solta.

   É o arco mostarda do logo, esticado pela página inteira: uma única
   linha que ondula pela margem esquerda, de seção em seção, e se desenha conforme a
   rolagem. Na ponta, o ponto do logo (o personagem da abertura) vai
   junto. Um fio atrás, outro tênue de eco — e mais nada se mexe sozinho.

   O traçado é recalculado pela altura real da página (as seções mudam
   de tamanho no celular), com vector-effect para a espessura não
   deformar.
   ================================================================ */

function tracar(w, h) {
  // o fio corre pela MARGEM esquerda, ondulando, sem nunca cruzar o texto:
  // a faixa útil é o espaço entre a borda e a coluna de conteúdo (.wrap)
  const wrap = document.querySelector('main#conteudo .wrap')
  const margem = wrap ? Math.max(wrap.getBoundingClientRect().left, 10) : 24
  const x0 = Math.min(margem * 0.22, 40)
  const x1 = Math.max(Math.min(margem * 0.72, 120), x0 + 6)
  const passo = 640
  const n = Math.max(2, Math.round(h / passo))
  let d = `M ${x1} 0`
  for (let i = 1; i <= n; i++) {
    const y0 = ((i - 1) / n) * h
    const y1 = (i / n) * h
    const xa = i % 2 ? x1 : x0
    const xb = i % 2 ? x0 : x1
    const dy = (y1 - y0) * 0.5
    d += ` C ${xa} ${y0 + dy}, ${xb} ${y1 - dy}, ${xb} ${y1}`
  }
  return d
}

export default function Fio({ reduzido }) {
  const svgRef = useRef(null)
  const linhaRef = useRef(null)
  const ecoRef = useRef(null)
  const pontoRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    const linha = linhaRef.current
    const eco = ecoRef.current
    const ponto = pontoRef.current
    const main = svg.parentElement
    let st = null
    let total = 0

    const montar = () => {
      const w = main.clientWidth
      const h = main.scrollHeight
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.style.height = h + 'px'
      const d = tracar(w, h)
      linha.setAttribute('d', d)
      eco.setAttribute('d', d)
      total = linha.getTotalLength()
      linha.style.strokeDasharray = `${total}`
      if (reduzido) {
        linha.style.strokeDashoffset = '0'
        ponto.style.display = 'none'
        return
      }
      st?.kill()
      // tabela comprimento → altura: a ponta do fio fica sempre a 55% da tela
      // (onde o olho está), não presa ao topo debaixo do cabeçalho
      const N = 240
      const tab = []
      for (let i = 0; i <= N; i++) { const L = (i / N) * total; tab.push([L, linha.getPointAtLength(L).y]) }
      const compPara = (y) => {
        if (y <= tab[0][1]) return 0
        for (let i = 1; i < tab.length; i++) {
          if (tab[i][1] >= y) {
            const [l0, y0] = tab[i - 1], [l1, y1] = tab[i]
            return l0 + (l1 - l0) * ((y - y0) / Math.max(y1 - y0, 1e-6))
          }
        }
        return total
      }
      const aplicar = () => {
        const topoMain = main.getBoundingClientRect().top
        const L = compPara(-topoMain + window.innerHeight * 0.55)
        linha.style.strokeDashoffset = `${total - L}`
        const pt = linha.getPointAtLength(Math.max(L, 0.01))
        ponto.setAttribute('cx', pt.x)
        ponto.setAttribute('cy', pt.y)
      }
      st = ScrollTrigger.create({
        trigger: main, start: 'top bottom', end: 'bottom top',
        onUpdate: aplicar,
      })
      aplicar()
    }

    montar()
    const ro = new ResizeObserver(() => { gsap.delayedCall(0.15, montar) })
    ro.observe(main)
    return () => { ro.disconnect(); st?.kill() }
  }, [reduzido])

  return (
    <svg className="fio" ref={svgRef} aria-hidden="true" preserveAspectRatio="none">
      <path ref={ecoRef} className="fio-eco" fill="none" />
      <path ref={linhaRef} className="fio-linha" fill="none" />
      <circle ref={pontoRef} className="fio-ponto" r="7" cx="-20" cy="-20" />
    </svg>
  )
}
