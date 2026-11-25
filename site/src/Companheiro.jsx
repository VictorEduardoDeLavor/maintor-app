/* COMPANHEIRO (26/11/2026) — pedido do Victor: "o personagem deve ficar vivo na tela, aparecendo em todo o momento".
   Na abertura quem recebe é o boneco do corredor (Exposicao.jsx, com o balão). Quando o passeio começa ele sai do
   corredor e passa a acompanhar a visita daqui: um boneco pequeno, num canto fixo da tela, que
     · anda no lugar enquanto a pessoa rola (para a frente ou de volta) e para quando ela para;
     · respira, pisca e olha para o quadro em destaque (ou para quem visita, parado);
     · acena quando aparece e de novo de tempos em tempos.
   Nunca bloqueia clique (pointer-events: none) e nunca fica em cima de texto: 4× por segundo ele confere o que há
   embaixo dele e, se for texto ou botão, troca de lugar — embaixo à direita, no alto à direita ou, quando os dois
   cantos têm texto (a régua de uma seção no alto, um cartão embaixo), menor, encostado na borda direita, na margem
   da página, onde não há texto.
   Tem canvas próprio e pequeno: o corredor não muda. Só monta com a exposição 3D pronta (html.expo-pronta). */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { criarBoneco } from './Boneco.js'

// a partir de quanto da primeira tela rolada ele assume (o boneco do corredor sai entre 0,12 e 0,3 — Exposicao.jsx)
export const COMPANHEIRO_DE = 0.26
// qualquer elemento com texto próprio conta (a régua de cada seção é um span comum)
const temTexto = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
const TEXTO = 'p,h1,h2,h3,h4,h5,li,a,button,label,input,textarea,select,.micro,.btn,.porta-btn,blockquote,figcaption,dt,dd'

export default function Companheiro() {
  const [pronto, setPronto] = useState(false)
  const caixa = useRef(null)

  // só com a exposição 3D montada (no modo sem 3D, num aparelho fraco, não abre um segundo WebGL)
  useEffect(() => {
    const h = document.documentElement
    const ver = () => setPronto(h.classList.contains('expo-pronta') && !h.classList.contains('sem-3d'))
    ver()
    const mo = new MutationObserver(ver); mo.observe(h, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    if (!pronto) return
    const el = caixa.current
    if (!el) return
    const celular = matchMedia('(max-width: 820px)').matches
    const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch { return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
    const cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true'); el.appendChild(cv)

    const cena = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const amb = pmrem.fromScene(new RoomEnvironment(renderer), 0.04); cena.environment = amb.texture
    cena.add(new THREE.HemisphereLight(0xfff1dc, 0x16302e, 0.7))
    const chave = new THREE.DirectionalLight(0xffe2bd, 2.2); chave.position.set(1.4, 2.6, 2.4); cena.add(chave)
    const recorte = new THREE.DirectionalLight(0xd4a574, 1.6); recorte.position.set(-2, 1.8, -1.5); cena.add(recorte)

    const ALT = 1
    const b = criarBoneco({ altura: ALT, celular })
    cena.add(b.raiz)
    const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 20)
    cam.position.set(0, ALT * 0.62, 3.9); cam.lookAt(0, ALT * 0.5, 0)
    const camMundo = cam.position.clone()
    // para onde ele olha quando há um quadro em destaque: no alto, à esquerda (o quadro fica acima/ao lado do canto)
    const alvoQuadro = new THREE.Vector3(-2.2, ALT * 1.5, 1.6)
    // rumo de quem anda: de três quartos, indo para a esquerda da tela (para dentro da página)
    const rumoAnda = new THREE.Vector3(-0.75, 0, 0.66).normalize()

    const medir = () => {
      const r = el.getBoundingClientRect()
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false)
      cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix()
    }
    medir()
    const ro = new ResizeObserver(medir); ro.observe(el)

    // ---------- canto: confere o que há embaixo dele e troca se for texto ----------
    const cantos = ['baixo', 'alto', 'borda']
    let canto = 'baixo', visivel = false, proxConferir = 0
    // tamanho da caixa em cada lugar (px). Na BORDA ele espia de lado: a caixa passa da borda da tela e só aparece a
    // faixa da margem da página (VIS px), onde não há texto — a altura é a primeira livre a partir do meio da tela
    const TAM = celular ? { baixo: [70, 104], alto: [70, 104], borda: [52, 84] } : { baixo: [118, 176], alto: [118, 176], borda: [80, 120] }
    const VIS = celular ? 19 : 34
    const MARGEM = celular ? 4 : 18
    let topoBorda = null
    const caixaDe = (lugar) => {
      const [w, h] = TAM[lugar], vw = window.innerWidth, vh = window.innerHeight
      if (lugar === 'borda') return { left: vw - VIS, top: topoBorda ?? Math.round(vh * 0.52 - h / 2), w: VIS, h }
      const topo = lugar === 'alto' ? topoAlto() : vh - baseBaixo() - h
      return { left: vw - MARGEM - w, top: topo, w, h }
    }
    const textoEm = (x, y) => {
      const alvo = document.elementFromPoint(x, y)
      return !!(alvo && !el.contains(alvo) && (alvo.closest(TEXTO) || temTexto(alvo)))
    }
    // grade fina com folga em volta (rótulos pequenos, como a régua de cada seção, não escapam entre os pontos).
    // Na borda a folga é só vertical: para fora da tela não há o que conferir.
    const contar = (r, borda) => {
      const F = 10, vw = window.innerWidth, vh = window.innerHeight
      const x0 = borda ? r.left : r.left - F, x1 = borda ? vw - 1 : r.left + r.w + F
      let hits = 0
      for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) {
        const x = Math.min(vw - 1, Math.max(0, x0 + (x1 - x0) * (i / 4)))
        const y = Math.min(vh - 1, Math.max(0, r.top - F + (r.h + 2 * F) * (j / 6)))
        if (textoEm(x, y)) hits++
      }
      return hits
    }
    const cobreTexto = (lugar) => {
      if (lugar !== 'borda') return contar(caixaDe(lugar), false)
      // procura uma altura livre na borda, do meio da tela para fora (de 24 em 24 px)
      const vh = window.innerHeight, h = TAM.borda[1], min = topoAlto(), max = vh - baseBaixo() - h
      const meio = Math.round(vh * 0.52 - h / 2)
      let menor = Infinity, melhorTopo = meio
      for (let k = 0; k < 40; k++) {
        const d = Math.ceil(k / 2) * 24 * (k % 2 ? 1 : -1), topo = meio + d
        if (topo < min || topo > max) continue
        const n = contar({ left: window.innerWidth - VIS, top: topo, w: VIS, h }, true)
        if (n < menor) { menor = n; melhorTopo = topo }
        if (n === 0) break
      }
      topoBorda = melhorTopo
      return menor
    }
    const topoAlto = () => (document.querySelector('header')?.getBoundingClientRect().bottom || 72) + 10
    const baseBaixo = () => {
      const g = document.querySelector('.guia.guia-on')
      return g ? window.innerHeight - g.getBoundingClientRect().top + 8 : (celular ? 12 : 22)
    }
    const posicionar = () => {
      const r = caixaDe(canto), [w, h] = TAM[canto]
      el.style.width = `${w}px`; el.style.height = `${h}px`
      el.style.right = `${canto === 'borda' ? VIS - w : MARGEM}px`
      el.style.top = canto === 'baixo' ? 'auto' : `${r.top}px`
      el.style.bottom = canto === 'baixo' ? `${baseBaixo()}px` : 'auto'
    }

    let ultimoY = window.scrollY, vel = 0, raf = 0, t = 0, ant = performance.now(), acenoEm = 1.2, vivo = true
    const quadro = (agora) => {
      if (!vivo) return
      raf = requestAnimationFrame(quadro)
      const dt = Math.min(0.05, (agora - ant) / 1000); ant = agora; t += dt
      const vh = window.innerHeight, y = window.scrollY
      // aparece quando o passeio começa; some no topo (lá quem recebe é o boneco do corredor)
      const deveVer = y > vh * COMPANHEIRO_DE && !document.documentElement.classList.contains('menu-aberto')
      if (deveVer !== visivel) { visivel = deveVer; el.classList.toggle('on', visivel); if (visivel) { acenoEm = 0.5; proxConferir = 0 } }
      if (!visivel) { ultimoY = y; return }
      // a cada 250 ms: o canto continua livre? (e a barra do guia pode ter aparecido ou sumido)
      // pelo relógio real (não pelo dt, que é limitado por quadro): num aparelho que desenha pouco a conferência não atrasa
      if (agora >= proxConferir) {
        proxConferir = agora + 250
        // fica onde está se ali não há texto; senão vai para o primeiro lugar livre (na ordem: embaixo, no alto,
        // na borda) ou, se nenhum estiver livre, para o que cobre menos. Da borda ele volta assim que um canto se livra.
        if (canto === 'borda' || cobreTexto(canto) > 0) {
          let melhor = canto, menor = Infinity
          for (const c of cantos) { const n = cobreTexto(c); if (n < menor) { menor = n; melhor = c } if (n === 0) break }
          canto = melhor; el.dataset.canto = canto
        }
        posicionar()
      }
      // rolagem → passada: px por segundo viram metros por segundo do boneco
      const dy = y - ultimoY; ultimoY = y
      const alvoV = THREE.MathUtils.clamp((dy / Math.max(dt, 0.001)) / 520, -2.4, 2.4)
      vel += (alvoV - vel) * Math.min(1, dt * 6)
      if (Math.abs(vel) < 0.02) vel = 0
      const emFoco = document.documentElement.classList.contains('obra-em-foco')
      if (Math.abs(vel) < 0.05 && !reduzido) { acenoEm -= dt; if (acenoEm <= 0) { b.acenar(); acenoEm = 22 + Math.random() * 10 } }
      // na borda ele fica na faixa que aparece (o resto da caixa está fora da tela): desloca o boneco para lá
      const [cw] = TAM[canto], largMundo = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect
      const xAlvo = canto === 'borda' ? ((VIS * 0.62 - cw / 2) / cw) * largMundo : 0
      b.raiz.position.x += (xAlvo - b.raiz.position.x) * Math.min(1, dt * 8)
      b.atualizar(dt, { v: vel, tangente: rumoAnda, camera: camMundo, alvo: emFoco ? alvoQuadro : null, reduzido, t })
      renderer.render(cena, cam)
    }
    el.dataset.canto = canto
    raf = requestAnimationFrame(quadro)

    // página escondida (outra aba): para de desenhar
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else { ant = performance.now(); raf = requestAnimationFrame(quadro) } }
    document.addEventListener('visibilitychange', vis)
    if (navigator.webdriver) window.__companheiro = { canto: () => canto, visivel: () => visivel } // só para os aceites

    return () => {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', vis)
      amb.texture.dispose(); pmrem.dispose(); renderer.dispose(); cv.remove(); el.classList.remove('on')
    }
  }, [pronto])

  if (!pronto) return null
  return <div className="companheiro" ref={caixa} aria-hidden="true"><span className="companheiro-chao" /></div>
}
