import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

/* ================================================================
   A EXPOSIÇÃO (05/11/2026) — a home é uma galeria em 3D que o visitante
   percorre rolando. Cada <section class="cena"> da home é uma ALA do
   salão; o scroll move a câmera por um caminho que passa de ala em ala,
   como quem anda numa exposição. O texto continua em HTML por cima
   (acessível e indexável); aqui fica só o mundo.

   O que há no salão:
   · o lockup OFICIAL em 3D na entrada (mesmas peças da abertura)
   · o fio mostarda do logo vira a linha-guia no chão, com o ponto
     (o personagem) sempre um passo à frente do visitante
   · quadros com os PRINTS REAIS dos trabalhos e as fotos do site,
     emoldurados em latão, iluminados por spots
   · alas sem quadro ganham uma peça: as 4 etapas (como a gente constrói),
     o laço (perguntas) e o balão da conversa (contato)

   Custo: 1 luz hemisférica + 1 direcional + 2 spots (só a ala atual e a
   próxima); sombra só no spot da ala atual; DPR limitado; partículas
   reduzidas no celular. Sem WebGL ou com movimento reduzido o App não
   monta este componente (fica o fio em SVG).
   ================================================================ */

const COR = { abismo: 0x0d2626, profundo: 0x143535, petroleo: 0x1f4747, mostarda: 0xd4a574, caramelo: 0xb8895a, creme: 0xfaf7f2, bege: 0xe6ddd0 }
const PASSO = 34          // distância entre alas, em metros
const LARG = 11.5         // largura do salão (estreito o bastante para os quadros entrarem no quadro)
const ALT = 7.5           // pé-direito
const OLHO = 1.7          // altura dos olhos

/* Quadros por ala, na ordem das seções da home. `src` em /midia/…; `lado`
   -1 = parede esquerda, 1 = direita, 0 = parede de fundo da ala. */
const ALAS = {
  topo: [],
  trabalhos: [
    { src: '/midia/portfolio/voke-desktop-720.webp', lado: -1, w: 5.2, pos: 0.25 },
    { src: '/midia/portfolio/bendita-desktop-720.webp', lado: 1, w: 5.2, pos: 0.25 },
    { src: '/midia/portfolio/cmms-painel-720.webp', lado: -1, w: 5.2, pos: 0.68 },
    { src: '/midia/portfolio/fit-site-desktop-720.webp', lado: 1, w: 5.2, pos: 0.68 },
  ],
  problemas: [
    { src: '/midia/fotos/loja-moda-640.webp', lado: -1, w: 4.4, pos: 0.3 },
    { src: '/midia/fotos/balcao-pedidos-640.webp', lado: 1, w: 4.4, pos: 0.3 },
    { src: '/midia/fotos/manutencao-oficina-640.webp', lado: -1, w: 4.4, pos: 0.72 },
    { src: '/midia/fotos/consultoria-portal-640.webp', lado: 1, w: 4.4, pos: 0.72 },
  ],
  sistemas: [
    { src: '/midia/portfolio/cmms-os-720.webp', lado: -1, w: 5.2, pos: 0.3 },
    { src: '/midia/portfolio/task-indicadores-720.webp', lado: 1, w: 5.2, pos: 0.3 },
    { src: '/midia/portfolio/rh-relatorios-720.webp', lado: -1, w: 5.2, pos: 0.72 },
    { src: '/midia/portfolio/horaqui-site-720.webp', lado: 1, w: 5.2, pos: 0.72 },
  ],
  marketing: [
    { src: '/midia/fotos/estudio-conteudo-640.webp', lado: -1, w: 4.6, pos: 0.4 },
    { src: '/midia/fotos/personal-app-640.webp', lado: 1, w: 4.6, pos: 0.4 },
  ],
  como: [],
  depoimentos: [],
  perguntas: [],
  contato: [],
}

function temWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

export function podeExpor() {
  return typeof window !== 'undefined' && temWebGL()
}

export default function Exposicao({ aoPronto }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let vivo = true
    const celular = window.innerWidth < 820 || matchMedia('(pointer: coarse)').matches

    // ---------- renderer / cena ----------
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

    // ---------- as alas = as seções da home ----------
    const secoes = [...document.querySelectorAll('main#conteudo > section.cena')]
    const nomes = secoes.map((s) => s.id)
    const N = Math.max(secoes.length, 2)

    // caminho: desce o salão em -z, serpenteando de leve (como quem vira de ala em ala)
    const pontos = []
    const ladoAla = (i) => (i % 2 ? 1 : -1)
    for (let i = 0; i < N; i++) pontos.push(new THREE.Vector3(ladoAla(i) * 1.6, OLHO, -i * PASSO))
    pontos.push(new THREE.Vector3(0, OLHO, -N * PASSO))
    const caminho = new THREE.CatmullRomCurve3(pontos, false, 'centripetal', 0.6)

    // ---------- materiais ----------
    const matParede = new THREE.MeshStandardMaterial({ color: COR.petroleo, roughness: 0.96, metalness: 0 })
    const matChao = new THREE.MeshStandardMaterial({ color: 0x0b1f1f, roughness: 0.42, metalness: 0.08, envMapIntensity: 0.9 })
    const matTeto = new THREE.MeshStandardMaterial({ color: 0x0a1c1c, roughness: 1 })
    const matLatao = new THREE.MeshStandardMaterial({ color: COR.mostarda, roughness: 0.3, metalness: 0.9 })
    const matLuzTeto = new THREE.MeshStandardMaterial({ color: COR.bege, emissive: COR.bege, emissiveIntensity: 1.6, roughness: 1 })
    const matFio = new THREE.MeshStandardMaterial({ color: COR.mostarda, emissive: COR.mostarda, emissiveIntensity: 1.4, roughness: 0.6 })
    const matVidro = new THREE.MeshPhysicalMaterial({ color: COR.creme, roughness: 0.08, metalness: 0, transmission: 0.85, thickness: 0.6, ior: 1.45, transparent: true, opacity: 0.9 })

    // ---------- o salão ----------
    const COMP = N * PASSO + PASSO
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(LARG, COMP), matChao)
    chao.rotation.x = -Math.PI / 2; chao.position.set(0, 0, -COMP / 2 + PASSO / 2); chao.receiveShadow = true
    cena.add(chao)
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(LARG, COMP), matTeto)
    teto.rotation.x = Math.PI / 2; teto.position.set(0, ALT, chao.position.z)
    cena.add(teto)
    for (const lado of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(COMP, ALT), matParede)
      p.rotation.y = lado > 0 ? -Math.PI / 2 : Math.PI / 2
      p.position.set(lado * LARG / 2, ALT / 2, chao.position.z)
      p.receiveShadow = true
      cena.add(p)
    }
    // rodapé de latão nas duas paredes
    for (const lado of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, COMP), matLatao)
      r.position.set(lado * (LARG / 2 - 0.03), 0.06, chao.position.z)
      cena.add(r)
    }
    // réguas de luz no teto, uma por ala, mais uma entre alas
    for (let i = 0; i < N * 2; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(LARG * 0.5, 0.05, 0.18), matLuzTeto)
      l.position.set(0, ALT - 0.03, -i * PASSO / 2 + 2)
      cena.add(l)
    }
    // divisórias parciais no fim de cada ala (depois dos quadros, antes da ala seguinte), sempre do
    // lado OPOSTO ao que a câmera vai passar — dá a sensação de salas sem nunca atravessar parede
    const DIV = LARG * 0.3
    for (let i = 0; i < N - 1; i++) {
      const lado = -ladoAla(i + 1)
      const d = new THREE.Mesh(new THREE.BoxGeometry(DIV, ALT, 0.35), matParede)
      d.position.set(lado * (LARG / 2 - DIV / 2), ALT / 2, -i * PASSO - 27)
      d.castShadow = !celular; d.receiveShadow = true
      cena.add(d)
      // filete de latão na quina da divisória
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.06, ALT, 0.37), matLatao)
      q.position.set(lado * (LARG / 2 - DIV), ALT / 2, d.position.z)
      cena.add(q)
    }

    // ---------- o fio no chão ----------
    const pontosFio = pontos.map((p) => new THREE.Vector3(p.x, 0.03, p.z))
    const fioCurva = new THREE.CatmullRomCurve3(pontosFio, false, 'centripetal', 0.6)
    const fio = new THREE.Mesh(new THREE.TubeGeometry(fioCurva, 240, 0.025, 8, false), matFio)
    cena.add(fio)
    const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), matFio)
    cena.add(ponto)
    const luzPonto = new THREE.PointLight(COR.mostarda, 2.2, 6, 2)
    ponto.add(luzPonto)

    // ---------- o lockup na entrada ----------
    const lockup = new THREE.Group()
    cena.add(lockup)
    fetch('/midia/marca/maintor-lockup-pecas.svg').then((r) => r.text()).then((txt) => {
      if (!vivo) return
      const dados = new SVGLoader().parse(txt)
      const matVerde = new THREE.MeshPhysicalMaterial({ color: COR.creme, emissive: COR.creme, emissiveIntensity: 0.14, roughness: 0.35, metalness: 0.05, clearcoat: 0.6 })
      for (const p of dados.paths) {
        const id = p.userData?.node?.id
        if (!id || id === 'divisor') continue
        const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), { depth: 18, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1, bevelSegments: 2, curveSegments: 8 })
        const m = new THREE.Mesh(geo, ['arco', 'bolinha', 'ponto'].includes(id) ? matLatao : matVerde)
        m.castShadow = !celular
        lockup.add(m)
      }
      // pórtico da entrada: 940×300 un. do SVG → ~9 m de largura, suspenso alto no corredor,
      // o visitante passa POR BAIXO dele ao começar a andar (nunca atravessa o logo)
      const esc = 8 / 940
      lockup.scale.set(esc, -esc, esc)
      lockup.position.set(-470 * esc + 1.2, 300 * esc + 3.6, -24)
      // o pórtico tem luz própria, senão fica escuro contra a névoa
      const luzPortico = new THREE.SpotLight(0xfff1dc, 140, 30, Math.PI / 6, 0.5, 1.4)
      luzPortico.position.set(1.2, ALT - 0.1, -14); luzPortico.target.position.set(1.2, 5.2, -24)
      cena.add(luzPortico); cena.add(luzPortico.target)
    })

    // ---------- quadros ----------
    const loader = new THREE.TextureLoader()
    const quadros = []
    const molduraDe = (w, h) => {
      const g = new THREE.Group()
      const moldura = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.09), matLatao)
      moldura.position.z = -0.045; moldura.castShadow = !celular
      g.add(moldura)
      const passe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x0b1f1f, roughness: 0.9 }))
      passe.position.z = -0.02
      g.add(passe)
      return g
    }
    nomes.forEach((nome, i) => {
      const lista = ALAS[nome] || []
      for (const q of lista) {
        // os quadros ficam À FRENTE de quem está no centro da ala (a câmera para em -i*PASSO)
        const z = -i * PASSO - 3 - q.pos * 20
        const g = new THREE.Group()
        g.position.set(q.lado * (LARG / 2 - 0.2), 2.6, z)
        // viradas 14° para quem vem andando, como numa exposição de verdade
        g.rotation.y = (q.lado > 0 ? -Math.PI / 2 : Math.PI / 2) + q.lado * 0.25
        cena.add(g)
        quadros.push({ grupo: g, ala: i, q })
        loader.load(q.src, (tex) => {
          if (!vivo) return
          tex.colorSpace = THREE.SRGBColorSpace
          tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
          const h = q.w * (tex.image.height / tex.image.width)
          g.add(molduraDe(q.w, h))
          const tela = new THREE.Mesh(new THREE.PlaneGeometry(q.w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 }))
          tela.position.z = 0.012
          g.add(tela)
          // placa pequena embaixo, como em museu
          const placa = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.02), matLatao)
          placa.position.set(0, -h / 2 - 0.32, 0)
          g.add(placa)
        })
      }
    })

    // ---------- peças das alas sem quadro ----------
    const pecas = []
    const idxDe = (n) => nomes.indexOf(n)
    const zAla = (i) => -i * PASSO - 9
    if (idxDe('como') >= 0) {
      // quatro lâminas de vidro que sobem em escada: conversa → proposta → construção → entrega
      const i = idxDe('como'); const g = new THREE.Group(); g.position.set(3.4, 0, zAla(i)); cena.add(g); pecas.push(g)
      for (let k = 0; k < 4; k++) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9 + k * 0.55, 0.12), matVidro)
        l.position.set(k * 1.25 - 1.9, (0.9 + k * 0.55) / 2, 0)
        l.castShadow = !celular
        g.add(l)
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.5), matLatao)
        base.position.set(l.position.x, 0.04, 0)
        g.add(base)
      }
    }
    if (idxDe('perguntas') >= 0) {
      const i = idxDe('perguntas'); const g = new THREE.Group(); g.position.set(-3.4, 2.1, zAla(i)); cena.add(g); pecas.push(g)
      const no = new THREE.Mesh(new THREE.TorusKnotGeometry(0.75, 0.22, 160, 24, 2, 3), new THREE.MeshPhysicalMaterial({ color: COR.mostarda, roughness: 0.25, metalness: 0.85, clearcoat: 0.5 }))
      no.castShadow = !celular; g.add(no)
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.1, 32), matParede)
      ped.position.y = -1.05 - 1.05; g.add(ped)
    }
    if (idxDe('contato') >= 0) {
      const i = idxDe('contato'); const g = new THREE.Group(); g.position.set(3.2, 0, zAla(i)); cena.add(g); pecas.push(g)
      loader.load('/midia/contato-balao.webp', (tex) => {
        if (!vivo) return
        tex.colorSpace = THREE.SRGBColorSpace
        const b = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2 }))
        b.position.y = 2.2; b.userData.billboard = true; g.add(b)
      })
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.9, 32), matParede)
      ped.position.y = 0.45; g.add(ped)
    }

    // ---------- luzes ----------
    cena.add(new THREE.HemisphereLight(0xdfe9e6, 0x061515, 0.55))
    const sol = new THREE.DirectionalLight(0xfff3e4, 0.5)
    sol.position.set(3, 9, 4)
    cena.add(sol)
    const spotA = new THREE.SpotLight(0xfff1dc, 60, 26, Math.PI / 5, 0.5, 1.6)
    const spotB = new THREE.SpotLight(0xfff1dc, 42, 26, Math.PI / 5, 0.6, 1.6)
    spotA.castShadow = !celular
    spotA.shadow.mapSize.set(1024, 1024); spotA.shadow.bias = -0.0005; spotA.shadow.radius = 4
    for (const s of [spotA, spotB]) { cena.add(s); cena.add(s.target) }

    // ---------- partículas (pó de luz) ----------
    const nP = celular ? 240 : 700
    const pg = new THREE.BufferGeometry()
    const pa = new Float32Array(nP * 3)
    for (let i = 0; i < nP; i++) { pa[i * 3] = (Math.random() - 0.5) * LARG; pa[i * 3 + 1] = Math.random() * ALT; pa[i * 3 + 2] = -Math.random() * COMP }
    pg.setAttribute('position', new THREE.BufferAttribute(pa, 3))
    const po = new THREE.Points(pg, new THREE.PointsMaterial({ color: COR.mostarda, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }))
    cena.add(po)

    // ---------- scroll → posição no caminho ----------
    // o progresso vai de ala em ala pelo centro da tela: no centro da seção i, a câmera está
    // exatamente na ala i; entre duas seções, caminha de uma para a outra
    let centros = []
    const medir = () => {
      const topoPag = window.scrollY
      centros = secoes.map((s) => { const r = s.getBoundingClientRect(); return topoPag + r.top + r.height / 2 })
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false)
      cam.aspect = w / h; cam.updateProjectionMatrix()
    }
    const progressoAlvo = () => {
      const y = window.scrollY + window.innerHeight * 0.5
      if (!centros.length) return 0
      if (y <= centros[0]) return 0
      for (let i = 1; i < centros.length; i++) {
        if (y <= centros[i]) return (i - 1 + (y - centros[i - 1]) / Math.max(centros[i] - centros[i - 1], 1)) / (N - 1)
      }
      return 1
    }
    let prog = 0, alvo = 0
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 }
    const temMouse = matchMedia('(pointer: fine)').matches
    const aoMover = (e) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1 }
    if (temMouse) window.addEventListener('pointermove', aoMover, { passive: true })
    window.addEventListener('resize', medir)
    const ro = new ResizeObserver(medir); ro.observe(document.querySelector('main#conteudo'))
    medir()

    // ---------- quadro a quadro ----------
    const relogio = new THREE.Clock()
    const pos = new THREE.Vector3(), frente = new THREE.Vector3(), olhar = new THREE.Vector3()
    let raf, visivel = true
    const aoVis = () => { visivel = document.visibilityState === 'visible'; if (visivel) quadro() }
    document.addEventListener('visibilitychange', aoVis)
    let primeiro = true
    const quadro = () => {
      if (!vivo || !visivel) return
      const dt = Math.min(relogio.getDelta(), 0.05)
      const t = relogio.elapsedTime
      alvo = progressoAlvo()
      prog += (alvo - prog) * Math.min(1, dt * 4.5)
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4)
      mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4)

      // câmera no caminho, olhando um passo à frente; respira de leve como quem anda
      const u = THREE.MathUtils.clamp(prog * (N - 1) / N, 0, 0.995)
      caminho.getPointAt(u, pos)
      caminho.getPointAt(Math.min(u + 0.012, 0.999), frente)
      pos.y = OLHO + Math.sin(t * 1.4) * 0.025
      cam.position.copy(pos)
      olhar.copy(frente); olhar.y = OLHO - 0.18 + mouse.sy * -0.35; olhar.x += mouse.sx * 1.6
      cam.lookAt(olhar)

      // o ponto (personagem) vai dois passos à frente, no chão
      fioCurva.getPointAt(Math.min(u + 0.02, 0.999), ponto.position)
      ponto.position.y = 0.14 + Math.abs(Math.sin(t * 2.2)) * 0.08

      // os spots acompanham: ala atual e a próxima
      const ala = Math.round(prog * (N - 1))
      const alaZ = (i) => -i * PASSO
      spotA.position.set(0, ALT - 0.2, alaZ(ala) - 4); spotA.target.position.set(0, 1.4, alaZ(ala) - 14)
      spotB.position.set(0, ALT - 0.2, alaZ(Math.min(ala + 1, N - 1)) - 4); spotB.target.position.set(0, 1.4, alaZ(Math.min(ala + 1, N - 1)) - 14)
      sol.position.set(pos.x + 3, pos.y + 7, pos.z + 4); sol.target.position.set(pos.x, 0, pos.z - 10); sol.target.updateMatrixWorld()

      // peças vivas
      lockup.rotation.y = Math.sin(t * 0.5) * 0.08
      for (const g of pecas) { const no = g.children[0]; if (no?.geometry?.type === 'TorusKnotGeometry') { no.rotation.y = t * 0.4; no.rotation.x = Math.sin(t * 0.3) * 0.3 } for (const c of g.children) if (c.userData.billboard) c.lookAt(cam.position) }
      po.position.y = Math.sin(t * 0.15) * 0.3
      po.rotation.y = t * 0.01

      renderer.render(cena, cam)
      if (primeiro) { primeiro = false; aoPronto?.() }
      raf = requestAnimationFrame(quadro)
    }
    quadro()

    return () => {
      vivo = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', medir)
      if (temMouse) window.removeEventListener('pointermove', aoMover)
      document.removeEventListener('visibilitychange', aoVis)
      pmrem.dispose()
      renderer.dispose()
      host.innerHTML = ''
    }
  }, [aoPronto])

  return <div id="canvas-root" ref={hostRef} aria-hidden="true" />
}
