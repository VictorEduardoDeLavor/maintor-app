/* COMPANHEIRO — o Victor (boneco) acompanha a visita depois da abertura.
   26/11: nasceu pequeno, num canto fixo. 27/11 (pedido do Victor: "ficou muito escondido… precisa ter protagonismo
   nas cenas, e interações… tem trechos que sobram espaço"): agora ele tem PALCO.
     · PALCO   com um título em leitura (html.lendo: o 3D está calmo e metade da tela sobra) ele entra grande no
               espaço vazio, de frente, com um balão de fala sobre aquela parte do site, e aponta para o conteúdo;
     · MÉDIO   andando entre as partes ou com um quadro em leitura, fica num canto livre (do lado da legenda), bem
               maior que antes, olhando para o quadro;
     · BORDA   se não houver lugar livre nenhum, espia pela borda direita.
   Interações: anda quando a página rola e quando troca de lugar; a cabeça segue o mouse; clicar nele faz acenar e
   abre o balão com o convite para o WhatsApp.
   Nunca fica em cima de texto nem de peça 3D: 4× por segundo confere o que há embaixo dele (e do balão) — texto do
   site pelo DOM, portas/esculturas/quadro em leitura por window.__expoOcupado (Exposicao.jsx) — e troca de lugar.
   Tem canvas próprio: o corredor não muda. Só monta com a exposição 3D pronta (html.expo-pronta). */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { criarBoneco } from './Boneco.js'
import { GRUPOS } from './obras.js'

// a partir de quanto da primeira tela rolada ele assume (o boneco do corredor sai entre 0,12 e 0,3 — Exposicao.jsx)
export const COMPANHEIRO_DE = 0.26
// qualquer elemento com texto próprio conta (a régua de cada seção é um span comum)
const temTexto = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
const TEXTO = 'p,h1,h2,h3,h4,h5,li,a,button,label,input,textarea,select,.micro,.btn,.porta-btn,blockquote,figcaption,dt,dd,summary,img,video'

/* O que ele diz em cada parte (só afirmações que o site já faz naquela parte). A fala é a do bloco de texto que
   está no meio da tela. */
const FALAS = [
  ['#trabalhos .ala-cabeca', 'Essa é a Ala 01. Tudo aqui a gente construiu e está no ar.'],
  [`#${GRUPOS.gestao.id} .grupo-painel`, 'Nesses, o site é só a parte que aparece. Abre o “Por trás” para ver o painel.'],
  [`#${GRUPOS.lojas.id} .grupo-painel`, 'Loja de verdade: pedido, pagamento e frete rodando. E o painel fica com quem é dono.'],
  [`#${GRUPOS.sites.id} .grupo-painel`, 'Site bom faz o visitante entender, confiar e chamar.'],
  [`#${GRUPOS.apps.id} .grupo-painel`, 'Esses sistemas são nossos. A mesma engenharia entra no seu projeto.'],
  ['#problemas .ala-cabeca', 'Me conta o seu momento: escolhe uma porta que eu te mostro o caminho.'],
  ['#sistemas .ala-cabeca', 'Sistema para organizar a operação ou para vender com a sua marca. Os dois a gente faz.'],
  ['#marketing .ala-cabeca', 'Depois de pronto, precisa aparecer: conteúdo, vídeo e campanha a gente também faz.'],
  ['#como > .wrap', 'Sem mistério: conversa, proposta por escrito e projeto no ar.'],
  ['#perguntas > .wrap', 'Ficou alguma dúvida? As mais comuns estão aqui.'],
  ['#contato > .wrap', 'Agora é com você. Me conta o que quer colocar no ar.'],
]
const FALA_CLIQUE = 'Quer um projeto assim? Fala comigo, eu mesmo respondo.'

export default function Companheiro({ whats }) {
  const [pronto, setPronto] = useState(false)
  const caixa = useRef(null), balaoRef = useRef(null), falaRef = useRef(null), toqueRef = useRef(null)

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
    const el = caixa.current, balao = balaoRef.current, falaEl = falaRef.current, toque = toqueRef.current
    if (!el || !balao) return
    const raizDoc = document.documentElement
    const celular = matchMedia('(max-width: 820px)').matches
    const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouseFino = matchMedia('(pointer: fine)').matches
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch { return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
    const cv = renderer.domElement; cv.setAttribute('aria-hidden', 'true'); el.prepend(cv)

    const cena = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const amb = pmrem.fromScene(new RoomEnvironment(renderer), 0.04); cena.environment = amb.texture
    cena.add(new THREE.HemisphereLight(0xfff1dc, 0x16302e, 0.7))
    const chave = new THREE.DirectionalLight(0xffe2bd, 2.2); chave.position.set(1.4, 2.6, 2.4); cena.add(chave)
    const recorte = new THREE.DirectionalLight(0xd4a574, 1.6); recorte.position.set(-2, 1.8, -1.5); cena.add(recorte)

    const ALT = 1
    const b = criarBoneco({ altura: ALT, celular })
    cena.add(b.raiz)
    /* A caixa tem sempre a mesma proporção (0,85 de largura por 1 de altura) e a câmera enquadra 1,22 m de altura:
       o boneco ocupa ~82% da altura e ~44% da largura da caixa (FIG), com folga dos lados para o braço que aponta. */
    const PROP = 0.85, FOV = 24, VISTA = 1.22
    const FIG = { larg: 0.44, alt: 0.86, base: 0.05 } // frações da ALTURA da caixa (largura e altura da figura, folga embaixo)
    const cam = new THREE.PerspectiveCamera(FOV, PROP, 0.1, 20)
    cam.position.set(0, 0.6, (VISTA / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))); cam.lookAt(0, 0.52, 0)
    const camMundo = cam.position.clone()
    const alvoOlhar = new THREE.Vector3()
    const rumo = new THREE.Vector3(-0.75, 0, 0.66).normalize()

    const medir = () => {
      const r = el.getBoundingClientRect()
      renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false)
    }
    medir()
    const ro = new ResizeObserver(medir); ro.observe(el)

    // ---------- lugares ----------
    const topoAlto = () => (document.querySelector('header')?.getBoundingClientRect().bottom || 72) + 10
    const baseBaixo = () => {
      const g = document.querySelector('.guia.guia-on')
      return g ? window.innerHeight - g.getBoundingClientRect().top + 8 : (celular ? 12 : 22)
    }
    const VIS = celular ? 19 : 34 // quanto dele aparece quando espia pela borda
    let topoBorda = null
    /* cada lugar devolve a caixa (px) e o retângulo da FIGURA (o que não pode cobrir nada). classe: 0 palco, 1 médio, 2 borda */
    const lugar = (nome) => {
      const vw = window.innerWidth, vh = window.innerHeight
      const palco = nome.startsWith('palco'), borda = nome === 'borda'
      const H = borda ? (celular ? 84 : 120) : palco ? THREE.MathUtils.clamp(vh * (celular ? 0.3 : 0.46), celular ? 200 : 300, celular ? 270 : 480) : (celular ? 128 : 220)
      const W = H * PROP, fw = H * FIG.larg
      const mg = celular ? 8 : 18
      let cx, topo
      // na borda o corpo começa onde a margem da página começa (metade dele fica para fora da tela): não encosta no texto
      if (borda) { cx = vw - VIS + fw / 2; topo = topoBorda ?? Math.round(vh * 0.52 - H / 2) }
      else {
        const dir = nome.endsWith('dir')
        cx = palco && !celular ? vw * (dir ? 0.72 : 0.28) : dir ? vw - mg - fw / 2 : mg + fw / 2
        topo = nome.startsWith('alto') ? topoAlto() : vh - (palco ? Math.max(baseBaixo(), vh * (celular ? 0.02 : 0.06)) : baseBaixo()) - H
      }
      const fig = borda ? { x0: vw - VIS, y0: topo, x1: vw, y1: topo + H } : { x0: cx - fw / 2, y0: topo + H * (1 - FIG.alt - FIG.base), x1: cx + fw / 2, y1: topo + H * (1 - FIG.base) }
      return { nome, classe: palco ? 0 : borda ? 2 : 1, H, W, cx, left: cx - W / 2, top: topo, fig }
    }
    const textoEm = (x, y) => {
      const a = document.elementFromPoint(x, y)
      return !!(a && !el.contains(a) && !balao.contains(a) && (a.closest(TEXTO) || temTexto(a)))
    }
    let ocupado = []
    /* o retângulo está livre? Nada de peça 3D nem de texto do site embaixo. Grade fina — uma linha a cada 9 px e uma
       coluna a cada ~22 px, com folga F em volta: um rótulo de 12 px de altura (a régua de cada seção) não escapa
       entre duas linhas. Sai no primeiro ponto ocupado. */
    const livre = (r, F = 8) => {
      const vw = window.innerWidth, vh = window.innerHeight
      if (r.x0 < -1 || r.y0 < topoAlto() - 12 || r.y1 > vh + 1 || r.x1 > vw + 1) return false // fora da tela (ou atrás do cabeçalho)
      for (const o of ocupado) if (r.x0 - F < o.x1 && r.x1 + F > o.x0 && r.y0 - F < o.y1 && r.y1 + F > o.y0) return false
      const x0 = Math.max(0, r.x0 - F), x1 = Math.min(vw - 1, r.x1 + F), y0 = Math.max(0, r.y0 - F), y1 = Math.min(vh - 1, r.y1 + F)
      const nx = Math.max(2, Math.ceil((x1 - x0) / 22) + 1), ny = Math.max(2, Math.ceil((y1 - y0) / 9) + 1)
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (textoEm(x0 + (x1 - x0) * (i / (nx - 1)), y0 + (y1 - y0) * (j / (ny - 1)))) return false
      return true
    }
    // a borda procura uma altura livre, do meio da tela para fora; se não houver, fica no meio
    const borda = () => {
      const vh = window.innerHeight, H = celular ? 84 : 120, vw = window.innerWidth
      const min = topoAlto(), max = vh - baseBaixo() - H, meio = Math.round(vh * 0.52 - H / 2)
      topoBorda = meio
      for (let k = 0; k < 28; k++) {
        const topo = meio + Math.ceil(k / 2) * 30 * (k % 2 ? 1 : -1)
        if (topo < min || topo > max) continue
        if (livre({ x0: vw - VIS, y0: topo, x1: vw, y1: topo + H }, 0)) { topoBorda = topo; break }
      }
      return lugar('borda')
    }

    // ---------- balão ----------
    const BW = celular ? 196 : 264
    let falaAuto = null, falaClique = 0, balaoOn = false, ultimaFala = null
    /* onde o balão cabe, para um lugar: acima da cabeça, ao lado (para o meio da tela) ou do outro lado.
       Devolve a primeira posição livre de texto e de peça 3D — ou null. `forcar`: a que couber na tela (clique). */
    const posBalao = (L, forcar) => {
      const vw = window.innerWidth, bh = balao.offsetHeight || 96, f = L.fig, paraEsq = L.cx > vw / 2
      const cabecaY = f.y0 + (f.y1 - f.y0) * 0.16
      const prende = (x) => Math.min(vw - BW - 10, Math.max(10, x))
      const ops = [
        { cauda: 'baixo', x: prende(L.cx - BW / 2), y: f.y0 - bh - 12 },
        { cauda: paraEsq ? 'dir' : 'esq', x: paraEsq ? f.x0 - BW - 16 : f.x1 + 16, y: cabecaY - bh * 0.5 },
        { cauda: paraEsq ? 'esq' : 'dir', x: paraEsq ? f.x1 + 16 : f.x0 - BW - 16, y: cabecaY - bh * 0.5 },
      ]
      for (const o of ops) {
        const r = { x0: o.x, y0: o.y, x1: o.x + BW, y1: o.y + bh }
        if (r.x0 < 6 || r.x1 > vw - 6 || r.y0 < topoAlto() || r.y1 > window.innerHeight - 6) continue
        if (forcar || livre(r, 6)) return { ...o, cx: L.cx }
      }
      return null
    }
    const mostrarBalao = (texto, pos, comLink) => {
      if (texto !== ultimaFala) { falaEl.textContent = texto; ultimaFala = texto }
      balao.classList.toggle('com-link', !!comLink)
      balao.style.left = `${Math.round(pos.x)}px`; balao.style.top = `${Math.round(pos.y)}px`
      balao.dataset.cauda = pos.cauda
      balao.style.setProperty('--cauda-x', `${Math.round(THREE.MathUtils.clamp(pos.cx - pos.x, 26, BW - 26))}px`)
      if (!balaoOn) { balaoOn = true; balao.classList.add('on') }
    }
    const esconderBalao = () => { if (balaoOn) { balaoOn = false; balao.classList.remove('on') } }
    // o bloco de texto que está no meio da tela diz o que ele fala
    const falaDaTela = () => {
      const meio = window.innerHeight * 0.5
      let melhor = null, dist = Infinity
      for (const [sel, texto] of FALAS) {
        const e = document.querySelector(sel); if (!e) continue
        const r = e.getBoundingClientRect(); if (r.bottom < 60 || r.top > window.innerHeight - 60) continue
        const d = r.top <= meio && r.bottom >= meio ? 0 : Math.min(Math.abs(r.top - meio), Math.abs(r.bottom - meio))
        if (d < dist) { dist = d; melhor = texto }
      }
      return melhor
    }

    // ---------- escolha do lugar ----------
    let atual = lugar('baixo-dir'), visivel = false, proxConferir = 0, proxCheio = 0, chaveAnt = '', andarAte = 0, andarDir = 1, apontarAte = 0
    const aplicar = (L, agora) => {
      if (L.nome !== atual.nome && visivel) { andarAte = agora + 650; andarDir = Math.sign(L.cx - atual.cx) || 1 }
      atual = L; el.dataset.lugar = L.nome; el.dataset.classe = L.classe
      el.style.width = `${Math.round(L.W)}px`; el.style.height = `${Math.round(L.H)}px`
      el.style.left = `${Math.round(L.left)}px`; el.style.top = `${Math.round(L.top)}px`
    }
    const conferir = (agora) => {
      // enquanto confere, ele e o balão ficam transparentes ao toque: senão o próprio botão dele escondia o texto de baixo
      toque.style.pointerEvents = 'none'; balao.style.pointerEvents = 'none'
      ocupado = window.__expoOcupado?.() || []
      const lendo = raizDoc.classList.contains('lendo'), emFoco = raizDoc.classList.contains('obra-em-foco')
      // com um quadro em leitura, o canto do lado da legenda vem primeiro (o quadro fica do outro lado)
      const legendaDir = !!document.querySelector('.obra.em-foco.obra-dir')
      const cantos = emFoco && !celular ? (legendaDir ? ['baixo-dir', 'baixo-esq', 'alto-dir'] : ['baixo-esq', 'baixo-dir', 'alto-dir']) : ['baixo-dir', 'alto-dir', 'baixo-esq']
      const ordem = [...(lendo && !emFoco ? ['palco-dir', 'palco-esq'] : []), ...cantos, 'borda']
      const fala = lendo && !emFoco ? falaDaTela() : null
      if (fala && fala !== ultimaFala && agora > falaClique) { falaEl.textContent = fala; ultimaFala = fala } // mede o balão com o texto certo
      // o lugar atual vale enquanto estiver livre e não houver lugar livre de classe melhor (não fica pulando)
      let escolhido = null
      for (const nome of ordem) {
        if (nome === 'borda') { if (!escolhido) escolhido = { L: borda(), pb: null }; break }
        const L = lugar(nome)
        if (escolhido && L.classe > escolhido.L.classe) break
        if (escolhido && L.nome !== atual.nome) continue // já há um livre desta classe; só o atual o desbanca
        if (!livre(L.fig)) continue
        let pb = null
        if (L.classe === 0) { pb = fala ? posBalao(L) : null; if (fala && !pb) continue } // palco só com o balão cabendo
        escolhido = { L, pb }
      }
      const e = escolhido
      aplicar(e.L, agora)
      // balão: o do clique vale por alguns segundos; senão, a fala da parte (só no palco)
      if (agora < falaClique) { const p = posBalao(e.L, true); if (p) mostrarBalao(FALA_CLIQUE, p, true); else esconderBalao() }
      else if (e.pb && fala) {
        if (fala !== falaAuto) { falaAuto = fala; apontarAte = agora + 2800 }
        mostrarBalao(fala, e.pb, false)
      } else { falaAuto = null; esconderBalao() }
      toque.style.pointerEvents = e.L.classe === 2 ? 'none' : 'auto'; balao.style.pointerEvents = ''
    }

    // ---------- interações ----------
    const mouse = { x: 0, y: 0, em: -1e9 }
    const aoMover = (ev) => { mouse.x = ev.clientX; mouse.y = ev.clientY; mouse.em = performance.now() }
    if (mouseFino) window.addEventListener('pointermove', aoMover, { passive: true })
    const aoTocar = () => { b.acenar(); falaClique = performance.now() + 7000; proxConferir = 0; proxCheio = 0 }
    toque.addEventListener('click', aoTocar)

    let ultimoY = window.scrollY, vel = 0, raf = 0, t = 0, ant = performance.now(), acenoEm = 1.2, vivo = true
    const quadro = (agora) => {
      if (!vivo) return
      raf = requestAnimationFrame(quadro)
      const dt = Math.min(0.05, (agora - ant) / 1000); ant = agora; t += dt
      const vh = window.innerHeight, vw = window.innerWidth, y = window.scrollY
      // aparece quando o passeio começa; some no topo (lá quem recebe é o boneco do corredor)
      const deveVer = y > vh * COMPANHEIRO_DE && !raizDoc.classList.contains('menu-aberto')
      if (deveVer !== visivel) {
        if (deveVer) { el.classList.add('sem-trans'); conferir(agora); void el.offsetWidth; el.classList.remove('sem-trans'); acenoEm = 0.5; proxConferir = agora + 250 } else esconderBalao()
        visivel = deveVer
        el.classList.toggle('on', visivel)
      }
      if (!visivel) { ultimoY = y; return }
      // 4× por segundo (pelo relógio real): o lugar continua livre? a fala mudou?
      // (com a página parada e nada mudando, 1× por segundo basta)
      if (agora >= proxConferir) {
        const chave = `${Math.round(y)}|${raizDoc.className}|${document.querySelector('.guia.guia-on') ? 1 : 0}|${agora < falaClique ? 1 : 0}`
        if (chave !== chaveAnt || agora >= proxCheio) { chaveAnt = chave; proxCheio = agora + 1000; conferir(agora) }
        proxConferir = agora + 250
      }

      // passada: troca de lugar (anda de lado até lá) ou a rolagem da página
      const dy = y - ultimoY; ultimoY = y
      let alvoV
      if (agora < andarAte && !reduzido) { alvoV = 1.25; rumo.set(andarDir * 0.96, 0, 0.28).normalize() }
      else { alvoV = THREE.MathUtils.clamp((dy / Math.max(dt, 0.001)) / 520, -2.4, 2.4); rumo.set(-0.75, 0, 0.66).normalize() }
      vel += (alvoV - vel) * Math.min(1, dt * 6)
      if (Math.abs(vel) < 0.02) vel = 0
      const parado = Math.abs(vel) < 0.05
      if (parado && !reduzido) { acenoEm -= dt; if (acenoEm <= 0) { b.acenar(); acenoEm = 20 + Math.random() * 10 } }

      // para onde ele olha: o mouse (se mexeu há pouco), o quadro em leitura, ou quem visita
      const emFoco = raizDoc.classList.contains('obra-em-foco'), palco = atual.classe === 0
      const upp = VISTA / atual.H // metros por px, no plano do boneco
      let alvo = null
      if (mouseFino && agora - mouse.em < 2600) {
        const cabY = atual.fig.y0 + (atual.fig.y1 - atual.fig.y0) * 0.16
        alvo = alvoOlhar.set(THREE.MathUtils.clamp((mouse.x - atual.cx) * upp * 0.5, -2.4, 2.4), 0.84 + THREE.MathUtils.clamp((cabY - mouse.y) * upp * 0.5, -0.7, 0.9), 2.2)
      } else if (emFoco) {
        // o quadro fica acima (celular) ou para o meio da tela (computador)
        alvo = alvoOlhar.set(celular ? (atual.cx > vw / 2 ? -0.6 : 0.6) : (atual.cx > vw / 2 ? -2.2 : 2.2), celular ? 1.9 : 1.25, 1.6)
      }
      // aponta para o conteúdo por alguns segundos quando a fala muda (o conteúdo fica para o meio da tela)
      b.apontar(palco && agora < apontarAte && parado ? (atual.cx > vw / 2 ? 'esq' : 'dir') : null)
      b.atualizar(dt, { v: vel, tangente: rumo, camera: camMundo, alvo, reduzido, t, receber: palco || agora < falaClique })
      renderer.render(cena, cam)
    }
    raf = requestAnimationFrame(quadro)

    // página escondida (outra aba): para de desenhar
    const vis = () => { if (document.hidden) cancelAnimationFrame(raf); else { ant = performance.now(); raf = requestAnimationFrame(quadro) } }
    document.addEventListener('visibilitychange', vis)
    if (navigator.webdriver) window.__companheiro = { lugar: () => atual.nome, classe: () => atual.classe, visivel: () => visivel, balao: () => balaoOn, fala: () => ultimaFala } // só para os aceites

    return () => {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('pointermove', aoMover); toque.removeEventListener('click', aoTocar)
      amb.texture.dispose(); pmrem.dispose(); renderer.dispose(); cv.remove(); el.classList.remove('on'); balao.classList.remove('on')
    }
  }, [pronto])

  if (!pronto) return null
  return (
    <>
      <div className="companheiro" ref={caixa}>
        <span className="companheiro-chao" aria-hidden="true" />
        <button type="button" className="comp-toque" ref={toqueRef} aria-label="Falar com o Victor, o guia do tour" />
      </div>
      <div className="comp-balao" ref={balaoRef} role="status">
        <span className="micro">Victor</span>
        <p ref={falaRef} />
        <a className="comp-link" href={whats} target="_blank" rel="noopener">Chamar no WhatsApp ↗</a>
      </div>
    </>
  )
}
