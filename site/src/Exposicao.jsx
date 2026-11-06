import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/* ================================================================
   A EXPOSIÇÃO (05/11/2026, v2) — a home é uma galeria em 3D que o
   visitante percorre rolando. Cada <section class="cena"> é uma ALA;
   cada <article class="obra"> é um QUADRO pendurado na parede.

   · a abertura acontece AQUI DENTRO: as peças do lockup oficial caem e
     se montam no pórtico da entrada, com a câmera já na posição da hero —
     o fim da animação é o próprio logo da fachada
   · rolando, a câmera anda pelo corredor; quando a legenda de uma obra
     está na tela, o quadro dela SE SOLTA DA PAREDE, flutua na frente de
     quem anda, virado para a câmera, e volta à parede quando se segue —
     uma de cada vez
   · o fio mostarda é a linha-guia no chão; o ponto vai à frente
   · alas sem quadro ganham uma peça (lâminas de vidro, laço, balão)

   v3 (05/11, à noite) — o que era HTML por cima virou parte do mundo:
   · o TOTEM da entrada pergunta "Qual é o seu problema?"; clicar nele
     abre as opções (o painel continua em HTML, acessível)
   · o LETREIRO pendurado sobre o corredor corre os serviços (era a faixa)
   · o SAGUÃO da Ala 2: seis portas, uma por dor, sobem do chão quando se
     chega; clicar numa porta leva para a SALA daquele tema (cômodo fora do
     corredor, com cortina de transição), de onde se volta ao saguão ou se
     passa para a porta seguinte — o estado da sala vive no React
   ================================================================ */

const COR = { abismo: 0x0d2626, petroleo: 0x1f4747, mostarda: 0xd4a574, creme: 0xfaf7f2, bege: 0xe6ddd0 }
const PASSO = 34
const LARG = 11.5
const ALT = 7.5
const OLHO = 1.7
const suave = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/* texto desenhado num canvas vira textura (placas, totem, letreiro).
   Repinta quando as fontes do site terminam de carregar. */
function placaCanvas(w, h, desenhar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8
  let ultimos = []
  const pintar = (...a) => { if (a.length) ultimos = a; const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); desenhar(g, c, ...ultimos); tex.needsUpdate = true }
  pintar()
  if (document.fonts) Promise.all([
    document.fonts.load('italic 80px "DM Serif Display"'), document.fonts.load('700 30px Inter'), document.fonts.load('400 30px Inter'),
  ]).then(() => pintar()).catch(() => {})
  return { tex, pintar, canvas: c }
}
function quebrar(g, texto, larg) {
  const linhas = []; let atual = ''
  for (const p of texto.split(' ')) { const t = atual ? atual + ' ' + p : p; if (g.measureText(t).width > larg && atual) { linhas.push(atual); atual = p } else atual = t }
  if (atual) linhas.push(atual)
  return linhas
}
// a foto "cobre" o retângulo (como object-fit: cover)
function cobrir(tex, aspectoAlvo) {
  const a = tex.image.width / tex.image.height
  if (a > aspectoAlvo) { tex.repeat.set(aspectoAlvo / a, 1); tex.offset.set((1 - aspectoAlvo / a) / 2, 0) }
  else { tex.repeat.set(1, a / aspectoAlvo); tex.offset.set(0, (1 - a / aspectoAlvo) / 2) }
}
const F_LETREIRO = 'italic 104px "DM Serif Display"'
const SERVICOS = ['loja virtual', 'loja no Instagram', 'site institucional', 'sistemas sob medida', 'gestão de manutenção',
  'gestão de RH', 'sistema para revender', 'automação de atendimento', 'vídeos personalizados', 'marketing e redes', 'tráfego pago']

export default function Exposicao({ intro = false, aoFimIntro, pularRef, portas = [], sala = null, aoPorta, aoPergunta }) {
  const hostRef = useRef(null)
  // a cena é montada uma vez; o que muda depois chega por referência
  const salaRef = useRef(sala)
  const cbRef = useRef({})
  salaRef.current = sala
  cbRef.current = { aoPorta, aoPergunta }
  const portasRef = useRef(portas)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let vivo = true
    const celular = window.innerWidth < 820 || matchMedia('(pointer: coarse)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: !celular, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, celular ? 1.5 : 2))
    renderer.setClearColor(COR.abismo, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = !celular
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(renderer.domElement)

    const cena = new THREE.Scene()
    cena.fog = new THREE.FogExp2(COR.abismo, 0.028)
    const pmrem = new THREE.PMREMGenerator(renderer)
    cena.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture
    cena.environmentIntensity = 0.35
    const cam = new THREE.PerspectiveCamera(52, 1, 0.1, 160)

    const secoes = [...document.querySelectorAll('main#conteudo > section.cena')]
    const nomes = secoes.map((s) => s.id)
    const N = Math.max(secoes.length, 2)
    const ladoAla = (i) => (i % 2 ? 1 : -1)
    const pontos = []
    for (let i = 0; i < N; i++) pontos.push(new THREE.Vector3(ladoAla(i) * 1.6, OLHO, -i * PASSO))
    pontos.push(new THREE.Vector3(0, OLHO, -N * PASSO))
    const caminho = new THREE.CatmullRomCurve3(pontos, false, 'centripetal', 0.6)

    const matParede = new THREE.MeshStandardMaterial({ color: COR.petroleo, roughness: 0.96 })
    const matChao = new THREE.MeshStandardMaterial({ color: 0x0b1f1f, roughness: 0.42, metalness: 0.08, envMapIntensity: 0.9 })
    const matTeto = new THREE.MeshStandardMaterial({ color: 0x0a1c1c, roughness: 1 })
    const matLatao = new THREE.MeshStandardMaterial({ color: COR.mostarda, roughness: 0.3, metalness: 0.9 })
    const matLuzTeto = new THREE.MeshStandardMaterial({ color: COR.bege, emissive: COR.bege, emissiveIntensity: 1.6, roughness: 1 })
    const matFio = new THREE.MeshStandardMaterial({ color: COR.mostarda, emissive: COR.mostarda, emissiveIntensity: 1.4, roughness: 0.6 })
    const matVidro = new THREE.MeshPhysicalMaterial({ color: COR.creme, roughness: 0.08, transmission: 0.85, thickness: 0.6, ior: 1.45, transparent: true, opacity: 0.9 })
    const matCreme = new THREE.MeshPhysicalMaterial({ color: COR.creme, emissive: COR.creme, emissiveIntensity: 0.14, roughness: 0.35, metalness: 0.05, clearcoat: 0.6 })

    const COMP = N * PASSO + PASSO
    const zMeio = -COMP / 2 + PASSO / 2
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(LARG, COMP), matChao)
    chao.rotation.x = -Math.PI / 2; chao.position.set(0, 0, zMeio); chao.receiveShadow = true; cena.add(chao)
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(LARG, COMP), matTeto)
    teto.rotation.x = Math.PI / 2; teto.position.set(0, ALT, zMeio); cena.add(teto)
    for (const lado of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(COMP, ALT), matParede)
      p.rotation.y = lado > 0 ? -Math.PI / 2 : Math.PI / 2
      p.position.set(lado * LARG / 2, ALT / 2, zMeio); p.receiveShadow = true; cena.add(p)
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, COMP), matLatao)
      r.position.set(lado * (LARG / 2 - 0.03), 0.06, zMeio); cena.add(r)
    }
    for (let i = 0; i < N * 2; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(LARG * 0.5, 0.05, 0.18), matLuzTeto)
      l.position.set(0, ALT - 0.03, -i * PASSO / 2 + 2); cena.add(l)
    }
    const DIV = LARG * 0.3
    for (let i = 0; i < N - 1; i++) {
      const lado = -ladoAla(i + 1)
      const d = new THREE.Mesh(new THREE.BoxGeometry(DIV, ALT, 0.35), matParede)
      d.position.set(lado * (LARG / 2 - DIV / 2), ALT / 2, -i * PASSO - 27)
      d.castShadow = !celular; d.receiveShadow = true; cena.add(d)
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.06, ALT, 0.37), matLatao)
      q.position.set(lado * (LARG / 2 - DIV), ALT / 2, d.position.z); cena.add(q)
    }

    const fioCurva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(p.x, 0.03, p.z)), false, 'centripetal', 0.6)
    cena.add(new THREE.Mesh(new THREE.TubeGeometry(fioCurva, 240, 0.025, 8, false), matFio))
    const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), matFio)
    ponto.add(new THREE.PointLight(COR.mostarda, 2.2, 6, 2)); cena.add(ponto)

    const hemi = new THREE.HemisphereLight(0xdfe9e6, 0x061515, 0.55); cena.add(hemi)
    const sol = new THREE.DirectionalLight(0xfff3e4, 0.5); cena.add(sol); cena.add(sol.target)
    const spotA = new THREE.SpotLight(0xfff1dc, 60, 26, Math.PI / 5, 0.5, 1.6)
    const spotB = new THREE.SpotLight(0xfff1dc, 42, 26, Math.PI / 5, 0.6, 1.6)
    spotA.castShadow = !celular; spotA.shadow.mapSize.set(1024, 1024); spotA.shadow.bias = -0.0005; spotA.shadow.radius = 4
    for (const s of [spotA, spotB]) { cena.add(s); cena.add(s.target) }
    const luzPortico = new THREE.SpotLight(0xfff1dc, 140, 30, Math.PI / 6, 0.5, 1.4)
    luzPortico.position.set(1.2, ALT - 0.1, -14); luzPortico.target.position.set(1.2, 5.2, -24)
    cena.add(luzPortico); cena.add(luzPortico.target)
    const INT = { hemi: 0.55, sol: 0.5, spotA: 60, spotB: 42, portico: 140, fio: 1.4 }
    if (intro) { hemi.intensity = 0.06; sol.intensity = 0; spotA.intensity = 0; spotB.intensity = 0; luzPortico.intensity = 0; matFio.emissiveIntensity = 0.05 }

    // o pórtico (lockup oficial) e a abertura dentro dele
    const lockup = new THREE.Group(); cena.add(lockup)
    const esc = 8 / 940
    lockup.scale.set(esc, -esc, esc)
    lockup.position.set(-470 * esc + 1.2, 300 * esc + 3.6, -24)
    let introTl = null, renderizou = false
    const terminarIntro = () => {
      if (introTl) { introTl.kill(); introTl = null }
      gsap.to(hemi, { intensity: INT.hemi, duration: 0.6 }); gsap.to(sol, { intensity: INT.sol, duration: 0.6 })
      gsap.to(spotA, { intensity: INT.spotA, duration: 0.6 }); gsap.to(spotB, { intensity: INT.spotB, duration: 0.6 })
      gsap.to(luzPortico, { intensity: INT.portico, duration: 0.6 }); gsap.to(matFio, { emissiveIntensity: INT.fio, duration: 0.6 })
      aoFimIntro?.()
    }
    if (pularRef) pularRef.current = terminarIntro
    fetch('/midia/marca/maintor-lockup-pecas.svg').then((r) => r.text()).then((txt) => {
      if (!vivo) return
      const pecas = {}
      for (const p of new SVGLoader().parse(txt).paths) {
        const id = p.userData?.node?.id
        if (!id || id === 'divisor') continue
        const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), { depth: 18, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1, bevelSegments: 2, curveSegments: 8 })
        geo.computeBoundingBox()
        const bb = geo.boundingBox, cx = (bb.min.x + bb.max.x) / 2, base = bb.max.y
        geo.translate(-cx, -base, 0)
        const m = new THREE.Mesh(geo, ['arco', 'bolinha', 'ponto'].includes(id) ? matLatao : matCreme)
        m.position.set(cx, base, 0); m.castShadow = !celular
        lockup.add(m); pecas[id] = m
      }
      if (!intro) return
      const W = (k) => pecas[k]
      for (let i = 0; i < 7; i++) { const l = W('wm-' + i); l.userData.y0 = l.position.y; l.position.y -= 420 + i * 60; l.rotation.z = (i % 2 ? 1 : -1) * 0.45 }
      W('simbolo').scale.set(1, 0.001, 1)
      W('arco').scale.set(0.001, 1, 1)
      W('bolinha').scale.setScalar(0.001)
      for (let i = 0; i < 4; i++) { const f = W('fl-' + i); f.userData.y0 = f.position.y; f.position.y += 70; f.scale.setScalar(0.001) }
      const pt = W('ponto'), bol = W('bolinha')
      const ptFinal = pt.position.clone()
      pt.position.copy(bol.position); pt.scale.setScalar(0.001)

      introTl = gsap.timeline({ paused: true, delay: 0.3, onComplete: () => { introTl = null; terminarIntro() } })
      if (renderizou) introTl.play()
      introTl.to(luzPortico, { intensity: INT.portico, duration: 0.8, ease: 'power2.out' }, 0)
      for (let i = 0; i < 7; i++) {
        const l = W('wm-' + i)
        introTl.to(l.position, { y: l.userData.y0, duration: 0.95, ease: 'bounce.out' }, 0.2 + i * 0.075)
        introTl.to(l.rotation, { z: 0, duration: 0.8, ease: 'back.out(2)' }, 0.2 + i * 0.075)
      }
      introTl.to(W('simbolo').scale, { y: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' }, 0.4)
      introTl.to(W('arco').scale, { x: 1, duration: 0.55, ease: 'power3.out' }, 1.0)
      introTl.to(pt.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'back.out(3)' }, 1.4)
      const saltos = [{ x: -40, y: 175 }, { x: 300, y: 185 }, { x: ptFinal.x, y: ptFinal.y }]
      let t0 = 1.65, de = { x: bol.position.x, y: bol.position.y }
      saltos.forEach((s, i) => {
        const dur = 0.42, altura = [150, 120, 120][i], est = { t: 0 }, ini = { ...de }
        introTl.to(est, { t: 1, duration: dur, ease: 'none', onUpdate: () => { pt.position.x = ini.x + (s.x - ini.x) * est.t; pt.position.y = ini.y + (s.y - ini.y) * est.t - Math.sin(Math.PI * est.t) * altura; pt.rotation.z = -est.t * Math.PI * 2 } }, t0)
        introTl.to(pt.scale, { x: 1.35, y: 0.7, duration: 0.08 }, t0 + dur - 0.02)
        introTl.to(pt.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' }, t0 + dur + 0.06)
        de = { x: s.x, y: s.y }; t0 += dur + 0.12
      })
      introTl.to(bol.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'back.out(3)' }, 1.9)
      for (let i = 0; i < 4; i++) {
        const f = W('fl-' + i)
        introTl.to(f.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' }, 2.1 + i * 0.07)
        introTl.to(f.position, { y: f.userData.y0, duration: 0.55, ease: 'power3.out' }, 2.1 + i * 0.07)
      }
      introTl.to(hemi, { intensity: INT.hemi, duration: 0.9, ease: 'power2.inOut' }, 3.0)
      introTl.to(sol, { intensity: INT.sol, duration: 0.9 }, 3.0)
      introTl.to(spotA, { intensity: INT.spotA, duration: 0.7 }, 3.15)
      introTl.to(spotB, { intensity: INT.spotB, duration: 0.7 }, 3.35)
      introTl.to(matFio, { emissiveIntensity: INT.fio, duration: 1.1, ease: 'power2.out' }, 3.2)
      introTl.to({}, { duration: 0.5 }, 3.9)
    })

    // as obras
    const loader = new THREE.TextureLoader()
    const obras = [...document.querySelectorAll('article.obra[data-img]')].map((el) => ({
      // no computador, a versão HD (1920 px); no celular, a de 720 basta e pesa menos
      el, src: (!celular && el.dataset.imgHd) || el.dataset.img, w: parseFloat(el.dataset.w || '5'), lado: parseInt(el.dataset.lado || '1', 10),
      grupo: new THREE.Group(), parede: { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, topo: 0, alt: 1, f: 0,
    }))
    for (const o of obras) {
      cena.add(o.grupo)
      loader.load(o.src, (tex) => {
        if (!vivo) return
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter
        const h = o.w * (tex.image.height / tex.image.width)
        const moldura = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.18, h + 0.18, 0.09), matLatao)
        moldura.position.z = -0.045; moldura.castShadow = !celular
        const passe = new THREE.Mesh(new THREE.BoxGeometry(o.w + 0.08, h + 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x0b1f1f, roughness: 0.9 }))
        passe.position.z = -0.02
        // a tela mostra a cor EXATA do print: sem luz da cena e sem o filtro de tom (ACES lavava o contraste)
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(o.w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))
        tela.position.z = 0.012
        const placa = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.02), matLatao)
        placa.position.set(0, -h / 2 - 0.32, 0)
        o.grupo.add(moldura, passe, tela, placa)
      })
    }

    const pecasAla = []
    const idx = (n) => nomes.indexOf(n)
    const zAla = (i) => -i * PASSO - 9
    if (idx('como') >= 0) {
      const g = new THREE.Group(); g.position.set(3.4, 0, zAla(idx('como'))); cena.add(g); pecasAla.push(g)
      for (let k = 0; k < 4; k++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9 + k * 0.55, 0.12), matVidro)
        l.position.set(k * 1.25 - 1.9, (0.9 + k * 0.55) / 2, 0); l.castShadow = !celular; g.add(l)
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.5), matLatao); base.position.set(l.position.x, 0.04, 0); g.add(base)
      }
    }
    if (idx('perguntas') >= 0) {
      const g = new THREE.Group(); g.position.set(-3.4, 2.1, zAla(idx('perguntas'))); cena.add(g); pecasAla.push(g)
      const no = new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.22, 160, 24, 2, 3), new THREE.MeshPhysicalMaterial({ color: COR.mostarda, roughness: 0.25, metalness: 0.85, clearcoat: 0.5 }))
      no.castShadow = !celular; g.add(no)
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.1, 32), matParede); ped.position.y = -2.1; g.add(ped)
    }
    if (idx('contato') >= 0) {
      const g = new THREE.Group(); g.position.set(3.2, 0, zAla(idx('contato'))); cena.add(g); pecasAla.push(g)
      loader.load('/midia/contato-balao.webp', (tex) => {
        if (!vivo) return
        tex.colorSpace = THREE.SRGBColorSpace
        const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2 }))
        b.position.y = 2.2; b.userData.billboard = true; g.add(b)
      })
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.9, 32), matParede); ped.position.y = 0.45; g.add(ped)
    }

    // ---------- o que se clica dentro do 3D ----------
    const clicaveis = []   // meshes com userData.acao
    const matBase = (cor) => new THREE.MeshBasicMaterial({ color: cor, toneMapped: false })

    // 1) o TOTEM da entrada: "Qual é o seu problema?" — clicar abre as opções
    const retratoIni = window.innerWidth < window.innerHeight
    const totem = new THREE.Group(); cena.add(totem)
    const totemPos = retratoIni ? new THREE.Vector3(0.35, 0, -9.5) : new THREE.Vector3(2.05, 0, -7)
    totem.position.copy(totemPos)
    totem.rotation.y = Math.atan2(-1.6 - totemPos.x, -totemPos.z)
    const placaTotem = placaCanvas(1024, 440, (g, c, hover = false) => {
      g.fillStyle = 'rgba(9, 27, 27, 0.94)'; g.beginPath(); g.roundRect(6, 6, c.width - 12, c.height - 12, 34); g.fill()
      g.lineWidth = hover ? 7 : 4; g.strokeStyle = '#D4A574'; g.stroke()
      g.fillStyle = '#D4A574'; g.font = '700 28px Inter'; g.letterSpacing = '7px'; g.fillText('COMECE POR AQUI', 64, 92)
      g.letterSpacing = '0px'; g.font = 'italic 96px "DM Serif Display"'
      g.fillStyle = '#FAF7F2'; g.fillText('Qual é o seu', 64, 205)
      g.fillStyle = '#D4A574'; g.fillText('problema?', 64, 300)
      g.fillStyle = hover ? '#FAF7F2' : '#E6DDD0'; g.font = '600 32px Inter'; g.fillText('Clique e escolha o seu  →', 64, 384)
    })
    const telaTotem = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 1.95 * 440 / 1024), new THREE.MeshBasicMaterial({ map: placaTotem.tex, transparent: true, toneMapped: false }))
    telaTotem.position.set(0, 1.55, 0.03); telaTotem.userData.acao = { tipo: 'pergunta' }
    totem.add(telaTotem); clicaveis.push(telaTotem)
    const costas = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.88, 0.04), matLatao); costas.position.set(0, 1.55, 0); totem.add(costas)
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.12, 16), matLatao); haste.position.y = 0.56; totem.add(haste)
    const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.05, 32), matLatao); pe.position.y = 0.025; totem.add(pe)
    const anel = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 48), matBase(COR.mostarda))
    anel.rotation.x = -Math.PI / 2; anel.position.y = 0.012; totem.add(anel)
    const luzTotem = new THREE.PointLight(COR.mostarda, 3, 4, 2); luzTotem.position.set(0, 1.6, 0.8); totem.add(luzTotem)

    // 2) o LETREIRO dos serviços, pendurado sobre o corredor (era a faixa que passava no site)
    const ALTL = 0.62, LARGL = LARG * 0.84
    // a textura é recriada quando a fonte carrega (a largura do texto muda e o WebGL não redimensiona textura já enviada)
    const telaLetreiro = new THREE.Mesh(new THREE.PlaneGeometry(LARGL, ALTL), new THREE.MeshBasicMaterial({ color: 0x081a1a, toneMapped: false }))
    const letreiro = { tex: null }
    const montarLetreiro = () => {
      if (!vivo) return
      const c = document.createElement('canvas'), H = 160, F = 'italic 104px "DM Serif Display"'
      let g = c.getContext('2d'); g.font = F
      const pedacos = SERVICOS.flatMap((s) => [[s, '#FAF7F2'], ['   ✦   ', '#D4A574']])
      const larg = pedacos.reduce((s, [t]) => s + g.measureText(t).width, 0)
      c.width = Math.min(16000, Math.ceil(larg)); c.height = H
      g = c.getContext('2d'); g.font = F; g.fillStyle = '#081a1a'; g.fillRect(0, 0, c.width, H)
      let x = 0
      for (const [t, cor] of pedacos) { g.fillStyle = cor; g.fillText(t, x, 112); x += g.measureText(t).width }
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.wrapS = THREE.RepeatWrapping
      tex.repeat.x = LARGL / ((c.width / H) * ALTL)
      if (letreiro.tex) { tex.offset.x = letreiro.tex.offset.x; letreiro.tex.dispose() }
      letreiro.tex = tex
      telaLetreiro.material.map = tex; telaLetreiro.material.color.set(0xffffff); telaLetreiro.material.needsUpdate = true
    }
    montarLetreiro()
    document.fonts?.load(F_LETREIRO).then(montarLetreiro).catch(() => {})
    const caixaLetreiro = new THREE.Group(); caixaLetreiro.position.set(0, 6.35, -15); cena.add(caixaLetreiro)
    telaLetreiro.position.z = 0.04; caixaLetreiro.add(telaLetreiro)
    const moldL = new THREE.Mesh(new THREE.BoxGeometry(LARGL + 0.12, ALTL + 0.12, 0.06), matLatao); caixaLetreiro.add(moldL)
    for (const x of [-LARGL / 2 + 0.4, LARGL / 2 - 0.4]) {
      const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, ALT - 6.35, 6), matLatao)
      cabo.position.set(x, (ALT - 6.35) / 2 + ALTL / 2, 0); caixaLetreiro.add(cabo)
    }

    // 3) o SAGUÃO da Ala 2: seis portas, uma por dor; sobem do chão quando se chega
    const portas3d = portasRef.current.map((pt, k) => {
      const g = new THREE.Group(); g.visible = false; cena.add(g)
      const PW = 1.5, PH = 2.6
      const vao = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ color: 0x3a4a48, toneMapped: false }))
      vao.position.y = PH / 2; vao.userData.acao = { tipo: 'porta', k }; g.add(vao); clicaveis.push(vao)
      loader.load(pt.img, (tex) => {
        if (!vivo) return
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); cobrir(tex, PW / PH)
        vao.material.map = tex; vao.material.color.setScalar(0.72); vao.material.needsUpdate = true
      })
      for (const [w, h, x, y] of [[0.09, PH + 0.09, -PW / 2 - 0.045, PH / 2], [0.09, PH + 0.09, PW / 2 + 0.045, PH / 2], [PW + 0.18, 0.09, 0, PH + 0.045]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), matLatao); b.position.set(x, y, 0); g.add(b)
      }
      const placa = placaCanvas(640, 190, (gc, c, hover = false) => {
        gc.fillStyle = hover ? '#D4A574' : 'rgba(9, 27, 27, 0.95)'; gc.beginPath(); gc.roundRect(4, 4, c.width - 8, c.height - 8, 22); gc.fill()
        gc.fillStyle = hover ? '#0D2626' : '#D4A574'; gc.font = '700 24px Inter'; gc.letterSpacing = '6px'
        gc.fillText(`PORTA ${String(k + 1).padStart(2, '0')}`, 34, 58); gc.letterSpacing = '0px'
        gc.fillStyle = hover ? '#0D2626' : '#FAF7F2'; gc.font = 'italic 58px "DM Serif Display"'
        gc.fillText(pt.curto, 34, 140)
      })
      const plaq = new THREE.Mesh(new THREE.PlaneGeometry(PW + 0.18, (PW + 0.18) * 190 / 640), new THREE.MeshBasicMaterial({ map: placa.tex, transparent: true, toneMapped: false }))
      plaq.position.set(0, PH + 0.42, 0.02); plaq.userData.acao = { tipo: 'porta', k }; g.add(plaq); clicaveis.push(plaq)
      const luz = new THREE.Mesh(new THREE.PlaneGeometry(PW, 0.9), new THREE.MeshBasicMaterial({ color: COR.mostarda, transparent: true, opacity: 0.12, toneMapped: false, depthWrite: false }))
      luz.rotation.x = -Math.PI / 2; luz.position.set(0, 0.015, 0.5); g.add(luz)
      return { g, vao, placa, luz, base: new THREE.Vector3(), hover: 0 }
    })
    const ANG = [-20, -11, -2, 7, 16, 25].map((a) => THREE.MathUtils.degToRad(a))
    let saguao = { topo: 0, alt: 1 }, saguaoVivo = false

    // 4) a SALA de cada tema: um cômodo fora do corredor, para onde se entra pela porta
    const SX = 140
    const salaG = new THREE.Group(); salaG.position.set(SX, 0, 0); cena.add(salaG)
    const SW = 12, SD = 14, SH = 6.6
    const chaoS = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), matChao); chaoS.rotation.x = -Math.PI / 2; salaG.add(chaoS)
    const tetoS = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), matTeto); tetoS.rotation.x = Math.PI / 2; tetoS.position.y = SH; salaG.add(tetoS)
    for (const [w, x, z, ry] of [[SW, 0, -SD / 2, 0], [SD, -SW / 2, 0, Math.PI / 2], [SD, SW / 2, 0, -Math.PI / 2], [SW, 0, SD / 2, Math.PI]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, SH), matParede); p.position.set(x, SH / 2, z); p.rotation.y = ry; salaG.add(p)
    }
    const FW = 6.4, FH = 4.0
    const fotoSala = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))
    fotoSala.position.set(1.2, 2.75, -SD / 2 + 0.08); salaG.add(fotoSala)
    const moldS = new THREE.Mesh(new THREE.BoxGeometry(FW + 0.22, FH + 0.22, 0.1), matLatao); moldS.position.set(1.2, 2.75, -SD / 2 + 0.02); salaG.add(moldS)
    const placaSala = placaCanvas(1400, 260, (g, c, dados) => {
      if (!dados) return
      g.fillStyle = '#D4A574'; g.font = '700 30px Inter'; g.letterSpacing = '8px'; g.fillText(dados.area.toUpperCase(), 8, 52); g.letterSpacing = '0px'
      g.fillStyle = '#FAF7F2'; g.font = 'italic 64px "DM Serif Display"'
      quebrar(g, `“${dados.dor}”`, c.width - 20).slice(0, 2).forEach((l, i) => g.fillText(l, 8, 140 + i * 78))
    })
    const plaqSala = new THREE.Mesh(new THREE.PlaneGeometry(FW, FW * 260 / 1400), new THREE.MeshBasicMaterial({ map: placaSala.tex, transparent: true, toneMapped: false }))
    plaqSala.position.set(1.2, 2.75 + FH / 2 + 0.75, -SD / 2 + 0.06); salaG.add(plaqSala)
    for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.5, 0.05, 0.18), matLuzTeto); l.position.set(0, SH - 0.03, 3 - i * 4); salaG.add(l) }
    const fioSala = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, SD - 1), matFio); fioSala.position.set(-1.2, 0.02, 0); salaG.add(fioSala)
    const spotSala = new THREE.SpotLight(0xfff1dc, 90, 22, Math.PI / 5, 0.5, 1.4)
    spotSala.position.set(SX + 1.2, SH - 0.2, 1); spotSala.target.position.set(SX + 1.2, 2.6, -SD / 2); cena.add(spotSala); cena.add(spotSala.target)
    const texFotos = {}
    const mostrarSala = (k) => {
      const pt = portasRef.current[k]; if (!pt) return
      placaSala.pintar(pt)
      const usar = (tex) => { fotoSala.material.map = tex; fotoSala.material.needsUpdate = true }
      if (texFotos[k]) usar(texFotos[k])
      else loader.load(pt.img, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); cobrir(tex, FW / FH); texFotos[k] = tex; if (salaVista === k) usar(tex) })
    }

    // a cortina: escurece a tela para trocar de lugar (corredor ↔ sala)
    const cortina = document.createElement('div')
    cortina.style.cssText = 'position:absolute;inset:0;background:#0D2626;opacity:0;pointer-events:none'
    host.appendChild(cortina)
    let modo = 'passeio', salaVista = null, trocando = false
    const trocar = (destino) => {
      trocando = true
      gsap.to(cortina, { opacity: 1, duration: 0.38, ease: 'power2.in', onComplete: () => {
        if (destino == null) { modo = 'passeio'; salaVista = null }
        else { modo = 'sala'; salaVista = destino; mostrarSala(destino) }
        gsap.to(cortina, { opacity: 0, duration: 0.7, ease: 'power2.out', delay: 0.05, onComplete: () => { trocando = false } })
      } })
    }

    // cliques e passagem do mouse sobre o que é clicável
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
    const acima = (x, y) => {
      ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1)
      ray.setFromCamera(ndc, cam)
      const vis = clicaveis.filter((m) => { let o = m; while (o) { if (!o.visible) return false; o = o.parent } return true })
      const h = ray.intersectObjects(vis, false)[0]
      return h && h.distance < 30 ? h.object.userData.acao : null
    }
    const interativo = (el) => el?.closest?.('a, button, input, textarea, select, label, .obra-legenda, .guia, header, .sala-painel, .pergunta-painel, .portas-lista')
    let hoverAcao = null
    const aoClicar = (e) => {
      if (modo !== 'passeio' || trocando || interativo(e.target)) return
      const a = acima(e.clientX, e.clientY)
      if (!a) return
      if (a.tipo === 'pergunta') cbRef.current.aoPergunta?.()
      if (a.tipo === 'porta') cbRef.current.aoPorta?.(a.k)
    }
    const aoPairar = (e) => {
      if (modo !== 'passeio' || interativo(e.target)) { if (hoverAcao) { hoverAcao = null; document.body.style.cursor = '' } return }
      const a = acima(e.clientX, e.clientY)
      const mudou = JSON.stringify(a) !== JSON.stringify(hoverAcao)
      if (!mudou) return
      hoverAcao = a
      document.body.style.cursor = a ? 'pointer' : ''
      document.getElementById('cursor')?.classList.toggle('cresce', !!a)
      placaTotem.pintar(a?.tipo === 'pergunta')
      portas3d.forEach((p, k) => p.placa.pintar(a?.tipo === 'porta' && a.k === k))
    }
    window.addEventListener('click', aoClicar)
    if (matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', aoPairar, { passive: true })

    const nP = celular ? 240 : 700
    const pa = new Float32Array(nP * 3)
    for (let i = 0; i < nP; i++) { pa[i * 3] = (Math.random() - 0.5) * LARG; pa[i * 3 + 1] = Math.random() * ALT; pa[i * 3 + 2] = -Math.random() * COMP }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pa, 3))
    const po = new THREE.Points(pg, new THREE.PointsMaterial({ color: COR.mostarda, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })); cena.add(po)

    let centros = []
    const alaDe = (y) => {
      if (!centros.length || y <= centros[0]) return 0
      for (let i = 1; i < centros.length; i++) if (y <= centros[i]) return i - 1 + (y - centros[i - 1]) / Math.max(centros[i] - centros[i - 1], 1)
      return N - 1
    }
    const uDe = (a) => THREE.MathUtils.clamp(a / N, 0, 0.995)
    const tmp = new THREE.Vector3()
    const medir = () => {
      const sy = window.scrollY
      centros = secoes.map((s) => { const r = s.getBoundingClientRect(); return sy + r.top + r.height / 2 })
      for (const o of obras) {
        const r = o.el.getBoundingClientRect(); o.topo = sy + r.top; o.alt = Math.max(r.height, 1)
        caminho.getPointAt(uDe(alaDe(o.topo + o.alt / 2)), tmp)
        o.parede.pos.set(-o.lado * (LARG / 2 - 0.2), 2.6, tmp.z - 3.4)
        o.parede.quat.setFromEuler(new THREE.Euler(0, (o.lado < 0 ? -Math.PI / 2 : Math.PI / 2) - o.lado * 0.25, 0))
        o.grupo.position.copy(o.parede.pos); o.grupo.quaternion.copy(o.parede.quat); o.grupo.scale.setScalar(1)
      }
      montarSaguao()
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix()
    }
    // o saguão: as portas formam um arco à frente de quem chega na cabeça da Ala 2.
    // Recalculado também quando as portas começam a subir (aí o layout da página já assentou).
    function montarSaguao() {
      const cab = document.querySelector('#problemas .ala-cabeca')
      if (cab && portas3d.length) {
        const r = cab.getBoundingClientRect(); saguao = { topo: window.scrollY + r.top, alt: Math.max(r.height, 1) }
        // o arco nasce de onde a câmera está e para onde ela olha quando o saguão está no meio da tela
        const uS = uDe(alaDe(saguao.topo + saguao.alt * 0.45))
        const c = new THREE.Vector3(), f = new THREE.Vector3()
        caminho.getPointAt(uS, c); caminho.getPointAt(Math.min(uS + 0.012, 0.999), f)
        const dir = Math.atan2(f.x - c.x, f.z - c.z) // ângulo do olhar no plano do chão
        const R = 10.5
        portas3d.forEach((p, k) => {
          const a = dir + (ANG[k] ?? 0) * -1
          const x = THREE.MathUtils.clamp(c.x + Math.sin(a) * R, -LARG / 2 + 1, LARG / 2 - 1), z = c.z + Math.cos(a) * R
          p.base.set(x, 0, z)
          p.g.position.copy(p.base); p.g.rotation.y = Math.atan2(c.x - x, c.z - z)
        })
      }
    }
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
    const temMouse = matchMedia('(pointer: fine)').matches
    const aoMover = (e) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1 }
    if (temMouse) window.addEventListener('pointermove', aoMover, { passive: true })
    window.addEventListener('resize', medir)
    const ro = new ResizeObserver(() => medir()); ro.observe(document.querySelector('main#conteudo'))
    medir()
    // fontes e imagens mudam a altura das seções depois do primeiro quadro: mede de novo
    document.fonts?.ready.then(() => vivo && medir())
    const remedir = setTimeout(() => vivo && medir(), 1800)

    const relogio = new THREE.Clock()
    const pos = new THREE.Vector3(), frente = new THREE.Vector3(), olhar = new THREE.Vector3()
    const fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), alvoPos = new THREE.Vector3()
    let prog = 0, raf, visivel = true, primeiro = true, emFoco = false
    const aoVis = () => { visivel = document.visibilityState === 'visible'; if (visivel) quadro() }
    document.addEventListener('visibilitychange', aoVis)
    const quadro = () => {
      if (!vivo || !visivel) return
      const dt = Math.min(relogio.getDelta(), 0.05), t = relogio.elapsedTime
      const yTela = window.scrollY + window.innerHeight * 0.5
      const alvo = alaDe(yTela) / Math.max(N - 1, 1)
      prog += (alvo - prog) * Math.min(1, dt * 4.5)
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4)

      // a porta escolhida no site (estado do React) chega por referência: entra, troca ou sai da sala
      const pedida = salaRef.current
      if (!trocando && pedida !== salaVista) trocar(pedida)

      const u = uDe(prog * (N - 1))
      caminho.getPointAt(u, pos); caminho.getPointAt(Math.min(u + 0.012, 0.999), frente)
      pos.y = OLHO + Math.sin(t * 1.4) * 0.025
      if (modo === 'sala') {
        // dentro da sala: parado diante da obra do tema, olhando com o mouse
        const retr = cam.aspect < 1
        // no celular, de mais longe e olhando um pouco para baixo: a obra fica na metade de cima, acima do painel
        cam.position.set(SX + (retr ? 1.2 : -1.6) + mouse.sx * 0.3, OLHO + 0.1 + Math.sin(t * 1.2) * 0.02, retr ? 6.9 : 3.6)
        cam.lookAt(SX + (retr ? 1.2 : -0.2) + mouse.sx * 1.2, (retr ? 0.6 : 2.9) - mouse.sy * 0.4, -SD / 2)
        letreiro.tex && (letreiro.tex.offset.x += dt * 0.025)
        renderer.render(cena, cam)
        raf = requestAnimationFrame(quadro)
        return
      }
      cam.position.copy(pos)
      olhar.copy(frente); olhar.y = OLHO - 0.18 + mouse.sy * -0.35; olhar.x += mouse.sx * 1.6
      cam.lookAt(olhar)
      cam.getWorldDirection(fwd); right.crossVectors(fwd, up).normalize()

      // o letreiro corre; o totem fica na entrada e afunda quando se segue; as portas sobem no saguão
      if (letreiro.tex) letreiro.tex.offset.x += dt * 0.025
      const pTopo = (yTela - window.innerHeight * 0.5) / Math.max(window.innerHeight, 1)
      const fTotem = 1 - suave(0.35, 0.9, pTopo)
      totem.visible = fTotem > 0.01
      totem.position.y = (fTotem - 1) * 2.6
      anel.material.opacity = 1; anel.scale.setScalar(1 + Math.sin(t * 3) * 0.08)
      luzTotem.intensity = 2.2 + Math.sin(t * 3) * 0.8
      const pS = (yTela - saguao.topo) / saguao.alt
      const fS = suave(-0.55, 0.05, pS) * (1 - suave(0.95, 1.45, pS))
      if (fS > 0 && !saguaoVivo) montarSaguao() // as portas vão começar a subir: posiciona com o layout final
      saguaoVivo = fS > 0
      portas3d.forEach((p, k) => {
        const fk = suave(0, 1, fS * 1.6 - k * 0.1)
        p.g.visible = fk > 0.01
        p.g.position.y = (fk - 1) * 3.4
        const alvoH = hoverAcao?.tipo === 'porta' && hoverAcao.k === k ? 1 : 0
        p.hover += (alvoH - p.hover) * Math.min(1, dt * 8)
        if (p.vao.material.map) p.vao.material.color.setScalar(0.72 + p.hover * 0.28)
        p.luz.material.opacity = 0.1 + p.hover * 0.25
        p.g.scale.setScalar(1 + p.hover * 0.03)
      })

      fioCurva.getPointAt(Math.min(u + 0.02, 0.999), ponto.position)
      ponto.position.y = 0.14 + Math.abs(Math.sin(t * 2.2)) * 0.08

      let maior = 0, atual = null
      const retrato = cam.aspect < 1
      const dist = retrato ? 7.2 : 4.6
      const largVisivel = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect
      for (const o of obras) {
        const p = (yTela - o.topo) / o.alt
        const f = p < -0.3 || p > 1.3 ? 0 : suave(0.06, 0.34, p) * (1 - suave(0.66, 0.94, p))
        if (f <= 0.001) { if (o.f) { o.grupo.position.copy(o.parede.pos); o.grupo.quaternion.copy(o.parede.quat); o.grupo.scale.setScalar(1); o.f = 0 } continue }
        o.f = f
        const e = easeInOut(f)
        alvoPos.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(right, retrato ? 0 : -o.lado * 1.75).addScaledVector(up, (retrato ? 0.9 : 0.05) + Math.sin(t * 1.1) * 0.04)
        o.grupo.position.lerpVectors(o.parede.pos, alvoPos, e)
        o.grupo.quaternion.slerpQuaternions(o.parede.quat, cam.quaternion, e)
        const escAlvo = Math.min(1, (largVisivel * (retrato ? 0.9 : 0.5)) / o.w)
        o.grupo.scale.setScalar(1 + (escAlvo - 1) * e)
        if (f > maior) { maior = f; atual = o }
      }

      // com uma obra flutuando, o grão de filme quase some (ele sujava o print)
      const foco = maior > 0.35
      if (foco !== emFoco) { emFoco = foco; document.documentElement.classList.toggle('obra-em-foco', foco) }
      const ala = Math.round(prog * (N - 1)), alaZ = (i) => -i * PASSO
      if (atual) { spotA.position.copy(cam.position).addScaledVector(up, ALT - 0.2 - OLHO).addScaledVector(fwd, 1.5); spotA.target.position.copy(atual.grupo.position) }
      else { spotA.position.set(0, ALT - 0.2, alaZ(ala) - 4); spotA.target.position.set(0, 1.4, alaZ(ala) - 14) }
      const prox = Math.min(ala + 1, N - 1)
      spotB.position.set(0, ALT - 0.2, alaZ(prox) - 4); spotB.target.position.set(0, 1.4, alaZ(prox) - 14)
      sol.position.set(pos.x + 3, pos.y + 7, pos.z + 4); sol.target.position.set(pos.x, 0, pos.z - 10)

      lockup.rotation.y = Math.sin(t * 0.5) * 0.08
      for (const g of pecasAla) { const no = g.children[0]; if (no?.geometry?.type === 'TorusKnotGeometry') { no.rotation.y = t * 0.4; no.rotation.x = Math.sin(t * 0.3) * 0.3 } for (const c of g.children) if (c.userData.billboard) c.lookAt(cam.position) }
      po.position.y = Math.sin(t * 0.15) * 0.3; po.rotation.y = t * 0.01

      renderer.render(cena, cam)
      if (primeiro) { primeiro = false; renderizou = true; document.documentElement.classList.add('expo-pronta'); if (introTl && introTl.paused()) introTl.play() }
      raf = requestAnimationFrame(quadro)
    }
    quadro()

    return () => {
      vivo = false
      cancelAnimationFrame(raf); introTl?.kill(); ro.disconnect(); clearTimeout(remedir)
      window.removeEventListener('resize', medir)
      if (temMouse) window.removeEventListener('pointermove', aoMover)
      window.removeEventListener('click', aoClicar); window.removeEventListener('pointermove', aoPairar)
      document.body.style.cursor = ''
      document.removeEventListener('visibilitychange', aoVis)
      pmrem.dispose(); renderer.dispose(); host.innerHTML = ''
      document.documentElement.classList.remove('obra-em-foco')
      if (pularRef) pularRef.current = null
    }
  }, [intro, aoFimIntro, pularRef])

  return <div id="canvas-root" ref={hostRef} aria-hidden="true" />
}
