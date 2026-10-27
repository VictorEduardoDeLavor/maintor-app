import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import gsap from 'gsap'

/* ================================================================
   ABERTURA (27/10/2026) — o lockup OFICIAL da Maintor Flow montado em 3D.

   As peças vêm de /midia/marca/maintor-lockup-pecas.svg, gerado pelo
   maintor-brand-3d/svg/gerar_pecas.py com a MESMA geometria do lockup:
   nenhuma letra é redesenhada aqui, só extrudada e animada.

   Roteiro (~4,5 s):
     0,0  o divisor se desenha de cima para baixo
     0,2  as letras de "Maintor" caem uma a uma e quicam no chão
     0,4  o M do símbolo sobe do chão
     1,0  o arco mostarda corre por baixo do M
     1,2  o PONTO é o personagem: nasce na ponta do arco e salta por cima
          das letras até o lugar dele, depois de "Maintor"; a bolinha
          do arco aparece quando ele sai
     2,1  FLOW sobe letra a letra
     2,6  a frase e o botão; 4,3 a cortina sobe e mostra o site

   Uma vez por sessão; "Pular abertura" sempre visível; sem animação
   para quem pede movimento reduzido (o App nem monta este componente).
   ================================================================ */

const VERDE = 0x1f4747
const MOSTARDA = 0xd4a574
const CREME = 0xfaf7f2
const PROF = 22 // profundidade da extrusão, em unidades do SVG (o lockup tem 940×300)

export const ABERTURA_CHAVE = 'flow.abertura'

function carregarPecas(texto) {
  const dados = new SVGLoader().parse(texto)
  const pecas = {}
  for (const p of dados.paths) {
    const id = p.userData?.node?.id
    if (!id) continue
    const formas = SVGLoader.createShapes(p)
    const geo = new THREE.ExtrudeGeometry(formas, {
      depth: id === 'divisor' ? 4 : PROF,
      bevelEnabled: id !== 'divisor',
      bevelThickness: 2.2, bevelSize: 1.4, bevelSegments: 3, curveSegments: 10,
    })
    geo.computeBoundingBox()
    const bb = geo.boundingBox
    // cada peça gira e escala em torno do próprio centro (base, no caso das letras)
    const cx = (bb.min.x + bb.max.x) / 2
    const base = bb.max.y // SVG: y cresce para baixo; a base da letra é o maior y
    geo.translate(-cx, -base, 0)
    pecas[id] = { geo, x: cx, y: base, alt: bb.max.y - bb.min.y, larg: bb.max.x - bb.min.x }
  }
  return pecas
}

export default function Abertura({ aoTerminar }) {
  const palcoRef = useRef(null)
  const canvasRef = useRef(null)
  const fraseRef = useRef(null)
  const [saindo, setSaindo] = useState(false)
  const terminarRef = useRef(null)

  useEffect(() => {
    let vivo = true
    let renderer, raf, tl, aoRedimensionar
    const palco = palcoRef.current

    const encerrar = () => {
      if (!vivo) return
      try { sessionStorage.setItem(ABERTURA_CHAVE, '1') } catch {}
      setSaindo(true)
      gsap.to(palco, {
        yPercent: -100, duration: 0.9, ease: 'power4.inOut',
        onComplete: () => { vivo = false; aoTerminar?.() },
      })
    }
    terminarRef.current = encerrar

    const montar = async () => {
      let texto
      try {
        texto = await fetch('/midia/marca/maintor-lockup-pecas.svg').then((r) => r.text())
      } catch { encerrar(); return }
      if (!vivo) return
      const pecas = carregarPecas(texto)

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(CREME, 1)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05

      const cena = new THREE.Scene()
      cena.fog = new THREE.Fog(CREME, 1400, 3200)
      const cam = new THREE.PerspectiveCamera(30, 1, 10, 5000)

      cena.add(new THREE.HemisphereLight(0xffffff, 0xe6ddd0, 1.6))
      const sol = new THREE.DirectionalLight(0xffffff, 2.4)
      sol.position.set(-160, 1500, 420) // luz alta: a sombra cai curta, logo atrás das letras
      sol.castShadow = true
      sol.shadow.mapSize.set(2048, 2048)
      Object.assign(sol.shadow.camera, { left: -700, right: 700, top: 500, bottom: -500, near: 10, far: 3000 })
      sol.shadow.radius = 6
      cena.add(sol)
      const contra = new THREE.DirectionalLight(0xd4a574, 0.9)
      contra.position.set(600, 200, -500)
      cena.add(contra)

      // chão creme que só recebe sombra — as letras "pousam" num estúdio claro
      const chao = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.ShadowMaterial({ opacity: 0.11 }))
      chao.rotation.x = -Math.PI / 2
      chao.receiveShadow = true
      cena.add(chao)

      const matVerde = new THREE.MeshPhysicalMaterial({ color: VERDE, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 })
      const matMostarda = new THREE.MeshPhysicalMaterial({ color: MOSTARDA, roughness: 0.28, metalness: 0.35, clearcoat: 0.6 })
      const matDivisor = new THREE.MeshStandardMaterial({ color: VERDE, transparent: true, opacity: 0.25, roughness: 0.6 })

      // o lockup fica "em pé" sobre o chão: y do SVG vira altura (invertida)
      const logo = new THREE.Group()
      cena.add(logo)
      const CHAO_SVG = 262 // y do SVG que encosta no chão (abaixo do arco e do FLOW)
      const malhas = {}
      for (const [id, p] of Object.entries(pecas)) {
        const mat = ['arco', 'bolinha', 'ponto'].includes(id) ? matMostarda : id === 'divisor' ? matDivisor : matVerde
        const m = new THREE.Mesh(p.geo, mat)
        m.scale.y = -1 // SVG desce, o mundo sobe
        m.castShadow = id !== 'divisor'
        const pivo = new THREE.Group()
        pivo.position.set(p.x - 470, CHAO_SVG - p.y, -PROF / 2)
        pivo.add(m)
        logo.add(pivo)
        malhas[id] = { pivo, malha: m, ...p }
      }
      const W = (k) => malhas[k]

      const enquadrar = () => {
        const w = palco.clientWidth, h = palco.clientHeight
        renderer.setSize(w, h, false)
        cam.aspect = w / h
        // distância para o lockup caber na LARGURA (campo de visão horizontal)
        // e na altura, com folga embaixo para a frase e o botão
        const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
        const tanH = tanV * cam.aspect
        const larguraAlvo = 940 * (cam.aspect < 1 ? 1.06 : 1.35)
        const alturaAlvo = 300 * 2.6
        const dist = Math.max((larguraAlvo / 2) / tanH, (alturaAlvo / 2) / tanV)
        cam.userData.dist = dist
        // névoa e plano de corte acompanham a distância: no celular em pé a
        // câmera fica a ~4.300 unidades e uma névoa fixa apagava o logo inteiro
        cena.fog.near = dist * 1.4
        cena.fog.far = dist * 3.2
        cam.far = dist * 4
        cam.updateProjectionMatrix()
      }
      aoRedimensionar = enquadrar
      window.addEventListener('resize', enquadrar)
      enquadrar()

      // câmera: começa baixa e perto, sobe e se afasta até enquadrar
      // a câmera mira abaixo do centro do logo: ele fica no terço de cima e a frase cabe embaixo
      const alvo = new THREE.Vector3(0, 40, 0)
      const camEstado = { ang: -0.32, alt: 40, k: 0.78 }
      const posicionarCam = () => {
        const d = cam.userData.dist * camEstado.k
        cam.position.set(Math.sin(camEstado.ang) * d, alvo.y + camEstado.alt, Math.cos(camEstado.ang) * d)
        cam.lookAt(alvo)
      }

      // ---------- estado inicial ----------
      for (let i = 0; i < 7; i++) {
        const l = W('wm-' + i).pivo
        l.userData.y0 = l.position.y
        l.position.y += 900 + i * 60
        l.rotation.z = (i % 2 ? 1 : -1) * 0.5
      }
      W('simbolo').pivo.scale.set(1, 0.001, 1)
      W('arco').pivo.scale.set(0.001, 1, 1)
      // o arco cresce da esquerda: move o pivô para a ponta esquerda
      {
        const a = W('arco')
        const esq = -a.larg / 2
        a.malha.position.x = -esq
        a.pivo.position.x += esq
      }
      W('bolinha').pivo.scale.setScalar(0.001)
      W('divisor').pivo.scale.set(1, 0.001, 1)
      for (let i = 0; i < 4; i++) {
        const f = W('fl-' + i).pivo
        f.userData.y0 = f.position.y
        f.position.y -= 60
        f.scale.setScalar(0.001)
      }
      // o ponto (personagem) nasce onde fica a bolinha do arco
      const ponto = W('ponto').pivo
      const bol = W('bolinha').pivo
      const pontoFinal = ponto.position.clone()
      ponto.position.copy(bol.position)
      ponto.position.y += 0
      ponto.scale.setScalar(0.001)

      // ---------- linha do tempo ----------
      tl = gsap.timeline({ delay: 0.15, onComplete: () => setTimeout(encerrar, 1400) })
      tl.to(camEstado, { ang: 0.06, alt: 150, k: 1, duration: 3.6, ease: 'power3.inOut' }, 0)
      tl.to(W('divisor').pivo.scale, { y: 1, duration: 0.6, ease: 'power3.out' }, 0)
      for (let i = 0; i < 7; i++) {
        const l = W('wm-' + i).pivo
        tl.to(l.position, { y: l.userData.y0, duration: 0.95, ease: 'bounce.out' }, 0.2 + i * 0.075)
        tl.to(l.rotation, { z: 0, duration: 0.8, ease: 'back.out(2)' }, 0.2 + i * 0.075)
      }
      tl.to(W('simbolo').pivo.scale, { y: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' }, 0.4)
      tl.to(W('arco').pivo.scale, { x: 1, duration: 0.55, ease: 'power3.out' }, 1.0)

      // o ponto ganha vida na ponta do arco e salta: 3 parábolas até o fim de "Maintor"
      tl.to(ponto.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'back.out(3)' }, 1.4)
      const saltos = [
        { x: -40, y: 175 },
        { x: 300, y: 185 },
        { x: pontoFinal.x, y: pontoFinal.y },
      ]
      let t0 = 1.65
      let de = { x: bol.position.x, y: bol.position.y }
      saltos.forEach((s, i) => {
        const dur = 0.42
        const altura = [150, 120, 120][i] // baixos o bastante para não sair do quadro; o último passa por cima do r
        const estado = { t: 0 }
        const ini = { ...de }
        tl.to(estado, {
          t: 1, duration: dur, ease: 'none',
          onUpdate: () => {
            const t = estado.t
            ponto.position.x = ini.x + (s.x - ini.x) * t
            ponto.position.y = ini.y + (s.y - ini.y) * t + Math.sin(Math.PI * t) * altura
            ponto.rotation.z = -t * Math.PI * 2
          },
        }, t0)
        // amassa ao pousar e estica ao sair
        tl.to(ponto.scale, { x: 1.35, y: 0.7, duration: 0.08, ease: 'power2.out' }, t0 + dur - 0.02)
        tl.to(ponto.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' }, t0 + dur + 0.06)
        de = { x: s.x, y: s.y }
        t0 += dur + 0.12
      })
      // quando o ponto sai, a bolinha do arco aparece no lugar dele
      tl.to(bol.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(3)' }, 1.9)

      for (let i = 0; i < 4; i++) {
        const f = W('fl-' + i).pivo
        tl.to(f.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' }, 2.1 + i * 0.07)
        tl.to(f.position, { y: f.userData.y0, duration: 0.55, ease: 'power3.out' }, 2.1 + i * 0.07)
      }
      tl.to(logo.rotation, { y: 0, duration: 0.01 }, 0) // garante zero no fim
      tl.fromTo(fraseRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 2.7)

      const relogio = new THREE.Clock()
      const quadro = () => {
        if (!vivo) return
        const t = relogio.getElapsedTime()
        // respiração: depois de montado, o lockup gira de leve
        logo.rotation.y = Math.sin(t * 0.6) * 0.05
        posicionarCam()
        renderer.render(cena, cam)
        raf = requestAnimationFrame(quadro)
      }
      quadro()
    }
    montar()

    const aoTecla = (e) => { if (e.key === 'Escape' || e.key === 'Enter') encerrar() }
    window.addEventListener('keydown', aoTecla)

    return () => {
      vivo = false
      cancelAnimationFrame(raf)
      tl?.kill()
      window.removeEventListener('keydown', aoTecla)
      if (aoRedimensionar) window.removeEventListener('resize', aoRedimensionar)
      renderer?.dispose()
    }
  }, [aoTerminar])

  return (
    <div id="abertura" ref={palcoRef} className={saindo ? 'saindo' : ''} role="dialog" aria-label="Abertura da Maintor Flow">
      <canvas ref={canvasRef} aria-hidden="true" />
      <button type="button" className="pular" onClick={() => terminarRef.current?.()}>
        <span aria-hidden="true">ılı</span> Pular abertura
      </button>
      <div className="abertura-frase" ref={fraseRef} style={{ opacity: 0 }}>
        <p>Lojas, sites e sistemas — no seu nome.</p>
        <button type="button" className="abertura-entrar" onClick={() => terminarRef.current?.()}>
          Conhecer o nosso trabalho
        </button>
      </div>
      <span className="sr-only">Maintor Flow</span>
    </div>
  )
}
