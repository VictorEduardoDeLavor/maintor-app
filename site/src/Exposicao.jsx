import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { criarAcabamento, marcarTela } from './acabamento.js'
import { criarBoneco } from './Boneco.js'

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
   · o fio mostarda é a linha-guia no chão; o boneco do Victor caminha sobre ele, à frente
     (10/11 — era uma bolinha dourada; ver src/Boneco.js)
   · alas sem quadro ganham uma peça (lâminas de vidro, laço, balão)

   v3 (05/11, à noite) — o que era HTML por cima virou parte do mundo:
   · o TOTEM da entrada pergunta "Qual é o seu problema?"; clicar nele
     abre as opções (o painel continua em HTML, acessível)
   · o LETREIRO pendurado sobre o corredor corre os serviços (era a faixa)
   · o SAGUÃO da Ala 2: uma porta por necessidade (sete), sobem do chão quando se
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
// repete a textura pelo tamanho real da superfície (uma junta a cada 2,4 m na parede, réguas de 3 m no chão)
function uvEscala(geo, sx, sy) {
  const uv = geo.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy)
  return geo
}
const F_LETREIRO = 'italic 104px "DM Serif Display"'
const SERVICOS = ['loja virtual', 'loja no Instagram', 'site institucional', 'sistemas sob medida', 'gestão de manutenção',
  'gestão de RH', 'sistema para revender', 'automação de atendimento', 'vídeos personalizados', 'marketing e redes', 'tráfego pago']

export default function Exposicao({ intro = false, aoFimIntro, pularRef, portas = [], sala = null, aoPorta, aoPergunta, pergunta = false }) {
  const hostRef = useRef(null)
  // a cena é montada uma vez; o que muda depois chega por referência
  const salaRef = useRef(sala)
  const cbRef = useRef({})
  salaRef.current = sala
  const perguntaRef = useRef(pergunta) // o painel "Qual é o seu problema?" está aberto
  perguntaRef.current = pergunta
  cbRef.current = { aoPorta, aoPergunta, aoFimIntro }
  const portasRef = useRef(portas)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let vivo = true
    const celular = window.innerWidth < 820 || matchMedia('(pointer: coarse)').matches

    // 06/11: o celular também ganha antialias e a densidade real da tela (até 2x) — o 1,5x deixava tudo borrado
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    // 09/11: o reflexo passa a ser de uma galeria de verdade (foto 360° CC0, Poly Haven) — o latão e o vidro
    // refletem luz quente em vez do estúdio cinza genérico. Até ela chegar, fica o estúdio.
    new RGBELoader().load('/midia/texturas/galeria-1k.hdr', (hdr) => {
      if (!vivo) { hdr.dispose(); return }
      const env = pmrem.fromEquirectangular(hdr).texture; hdr.dispose()
      cena.environment = env; if (introAcabou) cena.environmentIntensity = INT.env
    })
    const maxAniso = renderer.capabilities.getMaxAnisotropy()
    const texLoader = new THREE.TextureLoader()
    // textura de material (CC0, Poly Haven): repete e filtra com anisotropia máxima
    const texMaterial = (url, rx, ry, srgb = false) => {
      const t = texLoader.load(url)
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = maxAniso
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    /* 11/11: o alcance era 160 m num corredor de ~290 m. O que ficava além não era desenhado e, no lugar, aparecia
       a cor de fundo SEM névoa: um retângulo claro no ponto de fuga, atrás do texto em quase todas as telas. */
    const cam = new THREE.PerspectiveCamera(52, 1, 0.1, 340)
    const acab = criarAcabamento(renderer, cena, cam, { celular })

    const secoes = [...document.querySelectorAll('main#conteudo > section.cena')]
    const nomes = secoes.map((s) => s.id)
    const N = Math.max(secoes.length, 2)
    const ladoAla = (i) => (i % 2 ? 1 : -1)
    const pontos = []
    for (let i = 0; i < N; i++) pontos.push(new THREE.Vector3(ladoAla(i) * 1.6, OLHO, -i * PASSO))
    pontos.push(new THREE.Vector3(0, OLHO, -N * PASSO))
    const caminho = new THREE.CatmullRomCurve3(pontos, false, 'centripetal', 0.6)

    // 06/11: paredes e chão com acabamento. 09/11: materiais fotografados (CC0, Poly Haven) —
    // reboco com relevo e brilho variável; piso de taco espinha-de-peixe com veio, relevo e verniz.
    // A cor da parede continua a da marca: o reboco entra como variação por cima dela.
    const texParede = (() => {
      const W = 512, H = 2048
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const g = c.getContext('2d')
      const pintar = (reboco) => {
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
        g.fillStyle = '#1F4747'; g.fillRect(0, 0, W, H)
        if (reboco) {
          g.globalAlpha = 0.5; g.globalCompositeOperation = 'overlay'
          for (let y = 0; y < H; y += W) g.drawImage(reboco, 0, y, W, W) // um ladrilho a cada 2,4 m
          g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
        }
        const gr = g.createLinearGradient(0, 0, 0, H)
        gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.25, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)')
        g.fillStyle = gr; g.fillRect(0, 0, W, H)
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 3, H); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(3, 0, 2, H)
        const yR = H * (1 - 1.05 / ALT)
        g.fillStyle = 'rgba(212,165,116,.26)'; g.fillRect(0, yR, W, 5); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, yR + 5, W, 4)
      }
      pintar(null)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = maxAniso
      const img = new Image()
      img.onload = () => { if (vivo) { pintar(img); t.needsUpdate = true } }
      img.src = '/midia/texturas/reboco-cor-1k.webp'
      return t
    })()
    // a parede: UV = 2,4 m por 7,5 m → o relevo repete 1 x 3,1 para ficar quadrado
    const matParede = new THREE.MeshStandardMaterial({
      color: 0xffffff, map: texParede, roughness: 1,
      normalMap: texMaterial('/midia/texturas/reboco-normal-1k.webp', 1, ALT / 2.4), normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: texMaterial('/midia/texturas/reboco-rugosidade-1k.webp', 1, ALT / 2.4),
    })
    // o chão: UV = 3 m; o taco da foto cobre ~2 m → repete 1,5. Tingido para madeira escura (não briga com os quadros)
    const matChao = new THREE.MeshPhysicalMaterial({
      color: 0x2c2925, map: texMaterial('/midia/texturas/taco-cor-2k.webp', 1.5, 1.5, true),
      normalMap: texMaterial('/midia/texturas/taco-normal-2k.webp', 1.5, 1.5), normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: texMaterial('/midia/texturas/taco-rugosidade-1k.webp', 1.5, 1.5), roughness: 1.7, metalness: 0, envMapIntensity: 0.24, specularIntensity: 0.3,
    })
    const matTeto = new THREE.MeshStandardMaterial({ color: 0x0a1c1c, roughness: 1 })
    const matLatao = new THREE.MeshStandardMaterial({ color: COR.mostarda, roughness: 0.3, metalness: 0.9 })
    // rodapés e quinas das divisórias: somem no modo LER (11/11). Só escurecer não basta — metal polido visto de
    // raspão reflete o foco do boneco mesmo preto (um risco claro atrás dos rótulos pequenos); por isso esmaecem
    const matLataoArq = matLatao.clone(); matLataoArq.transparent = true
    const matLuzTeto = new THREE.MeshStandardMaterial({ color: COR.bege, emissive: COR.bege, emissiveIntensity: 1.6, roughness: 1 })
    const matFio = new THREE.MeshStandardMaterial({ color: COR.mostarda, emissive: COR.mostarda, emissiveIntensity: 1.4, roughness: 0.6 })
    const matVidro = new THREE.MeshPhysicalMaterial({ color: COR.creme, roughness: 0.08, transmission: 0.85, thickness: 0.6, ior: 1.45, transparent: true, opacity: 0.9 })
    const matCreme = new THREE.MeshPhysicalMaterial({ color: COR.creme, emissive: COR.creme, emissiveIntensity: 0.14, roughness: 0.35, metalness: 0.05, clearcoat: 0.6 })
    // o pórtico tem material próprio: no celular ele esmaece enquanto um quadro está na frente dele
    const matLataoL = matLatao.clone(); matLataoL.transparent = true; matCreme.transparent = true

    const COMP = N * PASSO + PASSO
    const zMeio = -COMP / 2 + PASSO / 2
    const chao = new THREE.Mesh(uvEscala(new THREE.PlaneGeometry(LARG, COMP), LARG / 3, COMP / 3), matChao)
    chao.rotation.x = -Math.PI / 2; chao.position.set(0, 0, zMeio); chao.receiveShadow = true; cena.add(chao)
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(LARG, COMP), matTeto)
    teto.rotation.x = Math.PI / 2; teto.position.set(0, ALT, zMeio); cena.add(teto)
    for (const lado of [-1, 1]) {
      const p = new THREE.Mesh(uvEscala(new THREE.PlaneGeometry(COMP, ALT), COMP / 2.4, 1), matParede)
      p.rotation.y = lado > 0 ? -Math.PI / 2 : Math.PI / 2
      p.position.set(lado * LARG / 2, ALT / 2, zMeio); p.receiveShadow = true; cena.add(p)
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, COMP), matLataoArq)
      r.position.set(lado * (LARG / 2 - 0.03), 0.06, zMeio); cena.add(r)
    }
    // 11/11: o fim do corredor é uma parede (antes ficava aberto para a cor de fundo)
    const paredeFim = new THREE.Mesh(uvEscala(new THREE.PlaneGeometry(LARG, ALT), LARG / 2.4, 1), matParede)
    paredeFim.position.set(0, ALT / 2, zMeio - COMP / 2 + 0.05); cena.add(paredeFim)
    // 09/11: cada luminária ganha um halo suave no teto (o brilho de luz real, sem custo de pós-processo)
    const texHalo = (() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64
      const g = c.getContext('2d'), gr = g.createRadialGradient(128, 32, 0, 128, 32, 128)
      gr.addColorStop(0, 'rgba(255,240,215,.55)'); gr.addColorStop(0.35, 'rgba(255,236,205,.16)'); gr.addColorStop(1, 'rgba(255,236,205,0)')
      g.setTransform(1, 0, 0, 0.25, 0, 24); g.fillStyle = gr; g.fillRect(0, 0, 256, 256)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
    })()
    const matHalo = new THREE.MeshBasicMaterial({ map: texHalo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true })
    // 11/11: num material ADITIVO a névoa leva ao preto, não à cor da névoa (senão cada halo distante soma um pouco de verde)
    matHalo.onBeforeCompile = (s) => {
      s.fragmentShader = s.fragmentShader.replace('#include <fog_fragment>', '#ifdef USE_FOG\n\tfloat fogHalo = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );\n\tgl_FragColor.rgb *= 1.0 - fogHalo;\n#endif')
    }
    matHalo.customProgramCacheKey = () => 'halo-nevoa-preta'
    const luzesTeto = []
    for (let i = 0; i < N * 2; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(LARG * 0.5, 0.05, 0.18), matLuzTeto)
      l.position.set(0, ALT - 0.03, -i * PASSO / 2 + 2); cena.add(l)
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(LARG * 0.95, 2.4), matHalo)
      halo.rotation.x = Math.PI / 2; halo.position.set(0, ALT - 0.06, l.position.z); cena.add(halo)
      luzesTeto.push([l, halo])
    }
    const DIV = LARG * 0.3
    for (let i = 0; i < N - 1; i++) {
      const lado = -ladoAla(i + 1)
      const d = new THREE.Mesh(new THREE.BoxGeometry(DIV, ALT, 0.35), matParede)
      d.position.set(lado * (LARG / 2 - DIV / 2), ALT / 2, -i * PASSO - 27)
      d.castShadow = !celular; d.receiveShadow = true; cena.add(d)
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.06, ALT, 0.37), matLataoArq)
      q.position.set(lado * (LARG / 2 - DIV), ALT / 2, d.position.z); cena.add(q)
    }

    const fioCurva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(p.x, 0.03, p.z)), false, 'centripetal', 0.6)
    cena.add(new THREE.Mesh(new THREE.TubeGeometry(fioCurva, 240, 0.025, 8, false), matFio))
    // 10/11: o guia do passeio é o boneco do Victor (no lugar da bolinha). Leva o brilho dela:
    // a mesma luz mostarda e um halo no chão sob os pés.
    const guia = criarBoneco({ altura: celular ? 0.9 : 1, celular })
    // a luz fica do lado de quem olha (não dentro do corpo): ilumina o rosto e o chão em volta
    const luzGuia = new THREE.PointLight(0xffe2bd, 5.5, 7, 2); cena.add(luzGuia)
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.46, 40), new THREE.MeshBasicMaterial({
      map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(212,165,116,.85)'); r.addColorStop(1, 'rgba(212,165,116,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx })(),
      transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    }))
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.012; guia.raiz.add(halo)
    guia.raiz.scale.setScalar(0.001); cena.add(guia.raiz)
    if (navigator.webdriver) window.__guia = guia.raiz // só para a bateria de aceite (robôs): conferir que ele anda
    // 11/11: sonda da limpeza visual (só robôs) — testes/aceite-limpeza.mjs lê daqui os objetos da cena e projeta os retângulos de tela.
    // Só as classes usadas, nunca o módulo THREE inteiro: passar o módulo como valor desliga o tree-shaking (+45 KB em gzip)
    if (navigator.webdriver) window.__expoSonda = () => ({ T: { Raycaster: THREE.Raycaster, Vector2: THREE.Vector2, Vector3: THREE.Vector3, Box3: THREE.Box3, AdditiveBlending: THREE.AdditiveBlending }, cam, cena, lockup, matCreme, caixaLetreiro, totem, portas3d, obras, guia, pecasAla, prog, ler, lado })
    const guiaPos = new THREE.Vector3(), guiaAnt = new THREE.Vector3(), guiaTan = new THREE.Vector3(), guiaDelta = new THREE.Vector3()
    let guiaComecou = false

    const hemi = new THREE.HemisphereLight(0xdfe9e6, 0x061515, 0.55); cena.add(hemi)
    const sol = new THREE.DirectionalLight(0xfff3e4, 0.5); cena.add(sol); cena.add(sol.target)
    const spotA = new THREE.SpotLight(0xfff1dc, 60, 26, Math.PI / 5, 0.5, 1.6)
    const spotB = new THREE.SpotLight(0xfff1dc, 42, 26, Math.PI / 5, 0.6, 1.6)
    spotA.castShadow = !celular; spotA.shadow.mapSize.set(1024, 1024); spotA.shadow.bias = -0.0005; spotA.shadow.radius = 4
    for (const s of [spotA, spotB]) { cena.add(s); cena.add(s.target) }
    const luzPortico = new THREE.SpotLight(0xfff1dc, 140, 30, Math.PI / 6, 0.5, 1.4)
    luzPortico.position.set(1.2, ALT - 0.1, -14); luzPortico.target.position.set(1.2, 5.2, -24)
    cena.add(luzPortico); cena.add(luzPortico.target)
    const retratoIni = window.innerWidth < window.innerHeight
    /* 11/11 — ABERTURA NO CELULAR (limpeza visual, Fase 1): "uma coisa por vez". Na primeira tela em pé,
       cada elemento tem a sua faixa e nenhum passa atrás do texto:
         · no alto, entre o cabeçalho e o título: o letreiro e, logo abaixo, o logo 3D (mais perto e menor)
         · no meio: título, proposta e as duas ações, sobre o corredor escurecido (modo LER)
         · embaixo, à direita: o boneco inteiro, esperando ao lado do fio
       Para isso quem chega OLHA PARA CIMA, para o pórtico (a câmera inclina ~10°); quando a rolagem
       começa, o olhar desce, o boneco vem para o fio e o passeio segue como antes. As posições são
       ângulos (frações da altura da tela), então valem de 664 a 844 px de altura. */
    const ABRE = { inclina: 0.235, nevoa: 0.03, logoD: 10, logoY: 6.19, logoLarg: 3.5, letD: 8, letY: 6.06, letLarg: 3.3, letAlt: 0.46, bonecoFrente: 0.8, bonecoLado: 0.6, bonecoProf: 6 }
    const p0 = caminho.getPointAt(0), dir0 = caminho.getPointAt(0.012).sub(p0).setY(0).normalize()
    const INT = { hemi: 0.55, sol: 0.5, spotA: 60, spotB: 42, portico: retratoIni ? 55 : 140, fio: 1.4, env: 0.42 }
    // a abertura começa no escuro: a luz da galeria (foto 360°) acende junto com as outras
    if (intro) cena.environmentIntensity = 0.04
    if (intro) { hemi.intensity = 0.06; sol.intensity = 0; spotA.intensity = 0; spotB.intensity = 0; luzPortico.intensity = 0; matFio.emissiveIntensity = 0.05 }

    // o pórtico (lockup oficial) e a abertura dentro dele
    const lockup = new THREE.Group(); cena.add(lockup)
    const esc = 8 / 940
    lockup.scale.set(esc, -esc, esc)
    lockup.position.set(-470 * esc + 1.2, 300 * esc + 3.6, -24)
    // no retrato o logo vem para perto do teto, logo depois da entrada, e encolhe: cabe na faixa livre acima do título
    let lockupCaixa = null, lockupGiro = 0
    const alvoLogo = new THREE.Vector3()
    const posicionarLockup = () => {
      // a luminária do teto que ficaria logo abaixo do logo (lida como um risco cinza) sai no retrato
      luzesTeto[1]?.forEach((o) => { o.visible = !(cam.aspect < 1) })
      if (!lockupCaixa) return
      if (cam.aspect < 1) {
        const e = ABRE.logoLarg / lockupCaixa.larg
        alvoLogo.copy(p0).addScaledVector(dir0, ABRE.logoD).setY(ABRE.logoY)
        lockupGiro = Math.atan2(-dir0.x, -dir0.z) // de frente para quem chega
        lockup.scale.set(e, -e, e)
        lockup.position.set(alvoLogo.x - lockupCaixa.cx * e * Math.cos(lockupGiro), alvoLogo.y + lockupCaixa.cy * e, alvoLogo.z + lockupCaixa.cx * e * Math.sin(lockupGiro))
        luzPortico.position.copy(alvoLogo).addScaledVector(dir0, -4.5).setY(ALT - 0.1); luzPortico.target.position.copy(alvoLogo)
      } else {
        lockupGiro = 0
        lockup.scale.set(esc, -esc, esc)
        lockup.position.set(-470 * esc + 1.2, 300 * esc + 3.6, -24)
        luzPortico.position.set(1.2, ALT - 0.1, -14); luzPortico.target.position.set(1.2, 5.2, -24)
      }
    }
    let introTl = null, renderizou = false, introAcabou = !intro, quadrosDesenhados = 0
    // o totem e o letreiro só entram depois que o logo se monta (antes disputavam a tela com a abertura)
    const entrada = { v: intro ? 0 : 1 }
    const terminarIntro = () => {
      introAcabou = true
      // pulou no meio: o logo vai direto para a forma final — a fachada fica idêntica ao fim da animação
      if (introTl) { const tl = introTl; introTl = null; tl.eventCallback('onComplete', null); tl.progress(1).kill() }
      gsap.to(hemi, { intensity: INT.hemi, duration: 0.6 }); gsap.to(sol, { intensity: INT.sol, duration: 0.6 })
      gsap.to(spotA, { intensity: INT.spotA, duration: 0.6 }); gsap.to(spotB, { intensity: INT.spotB, duration: 0.6 })
      gsap.to(luzPortico, { intensity: INT.portico, duration: 0.6 }); gsap.to(matFio, { emissiveIntensity: INT.fio, duration: 0.6 })
      gsap.to(cena, { environmentIntensity: INT.env, duration: 0.9 })
      gsap.to(entrada, { v: 1, duration: 1.3, ease: 'power3.out', delay: 0.15 })
      cbRef.current.aoFimIntro?.()
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
        const m = new THREE.Mesh(geo, ['arco', 'bolinha', 'ponto'].includes(id) ? matLataoL : matCreme)
        m.position.set(cx, base, 0); m.castShadow = !celular
        lockup.add(m); pecas[id] = m
      }
      // a caixa do logo (em unidades do SVG, com as peças no lugar final) serve para centrar e dimensionar no retrato
      const cx0 = new THREE.Box3()
      for (const m of lockup.children) cx0.union(m.geometry.boundingBox.clone().translate(m.position))
      lockupCaixa = { cx: (cx0.min.x + cx0.max.x) / 2, cy: (cx0.min.y + cx0.max.y) / 2, larg: cx0.max.x - cx0.min.x }
      posicionarLockup()
      if (!intro || introAcabou) return
      const W = (k) => pecas[k]
      for (let i = 0; i < 7; i++) { const l = W('wm-' + i); l.userData.y0 = l.position.y; l.position.y -= 420 + i * 60; l.rotation.z = (i % 2 ? 1 : -1) * 0.45 }
      W('simbolo').scale.set(1, 0.001, 1)
      W('arco').scale.set(0.001, 1, 1)
      W('bolinha').scale.setScalar(0.001)
      for (let i = 0; i < 4; i++) { const f = W('fl-' + i); f.userData.y0 = f.position.y; f.position.y += 70; f.scale.setScalar(0.001) }
      const pt = W('ponto'), bol = W('bolinha')
      const ptFinal = pt.position.clone()
      pt.position.copy(bol.position); pt.scale.setScalar(0.001)

      introTl = gsap.timeline({ paused: true, delay: 0.5, onComplete: () => { introTl = null; terminarIntro() } })
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
      introTl.to(cena, { environmentIntensity: INT.env, duration: 1.1 }, 3.0)
      introTl.to(spotA, { intensity: INT.spotA, duration: 0.7 }, 3.15)
      introTl.to(spotB, { intensity: INT.spotB, duration: 0.7 }, 3.35)
      introTl.to(matFio, { emissiveIntensity: INT.fio, duration: 1.1, ease: 'power2.out' }, 3.2)
      introTl.to({}, { duration: 0.5 }, 3.9)
    })

    // as obras
    const loader = new THREE.TextureLoader()
    const toque = matchMedia('(pointer: coarse)').matches
    const obras = [...document.querySelectorAll('article.obra[data-img]')].map((el) => ({
      // no computador a HD (1920 px); no celular a de 1280 (06/11: a de 720 ficava borrada na tela 2x)
      el, src: (celular ? el.dataset.imgHd?.replace('-1920.webp', '-1280.webp') : el.dataset.imgHd) || el.dataset.img, w: parseFloat(el.dataset.w || '5'), lado: parseInt(el.dataset.lado || '1', 10),
      hd: celular ? el.dataset.imgHd : null, tela: null, grupo: new THREE.Group(), parede: { pos: new THREE.Vector3(), quat: new THREE.Quaternion() }, topo: 0, alt: 1, f: 0, fs: 0, ws: 0, foco: false, ps: 1,
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
        const tela = new THREE.Mesh(new THREE.PlaneGeometry(o.w, h), marcarTela(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })))
        o.tela = tela
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
      g.fillStyle = hover ? '#FAF7F2' : '#E6DDD0'; g.font = '600 32px Inter'; g.fillText(toque ? 'Toque e escolha o seu  →' : 'Clique e escolha o seu  →', 64, 384)
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
    /* 10/11: no celular em pé o letreiro ficava escondido atrás do cabeçalho e cortado nas laterais
       (9,7 m de largura para uma tela que mostra ~5 m a essa distância). No retrato ele desce,
       chega mais perto e encolhe na largura — as letras ficam do mesmo tamanho na tela. */
    /* 11/11: no retrato ele sobe para junto do teto e chega ainda mais perto — fica na faixa do alto da
       primeira tela, acima do logo, e nunca atrás do título (a câmera olha para cima na abertura). */
    const LET = retratoIni ? { x: p0.x + dir0.x * ABRE.letD, y: ABRE.letY, z: p0.z + dir0.z * ABRE.letD } : { x: 0, y: 6.35, z: -15 }
    const ALTL = retratoIni ? ABRE.letAlt : 0.62, LARGL = retratoIni ? ABRE.letLarg : LARG * 0.84
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
    const caixaLetreiro = new THREE.Group(); caixaLetreiro.position.set(LET.x, LET.y, LET.z); cena.add(caixaLetreiro)
    if (retratoIni) caixaLetreiro.rotation.y = Math.atan2(-dir0.x, -dir0.z)
    telaLetreiro.position.z = 0.04; caixaLetreiro.add(telaLetreiro)
    const moldL = new THREE.Mesh(new THREE.BoxGeometry(LARGL + 0.12, ALTL + 0.12, 0.06), matLatao); caixaLetreiro.add(moldL)
    for (const x of [-LARGL / 2 + 0.4, LARGL / 2 - 0.4]) {
      const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, ALT - LET.y, 6), matLatao)
      cabo.position.set(x, (ALT - LET.y) / 2 + ALTL / 2, 0); caixaLetreiro.add(cabo)
    }

    // 3) o SAGUÃO da Ala 2: uma porta por necessidade (sete desde 10/11); sobem do chão quando se chega
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
        gc.fillText(pt.placa || pt.curto, 34, 140)
      })
      const plaq = new THREE.Mesh(new THREE.PlaneGeometry(PW + 0.18, (PW + 0.18) * 190 / 640), new THREE.MeshBasicMaterial({ map: placa.tex, transparent: true, toneMapped: false }))
      plaq.position.set(0, PH + 0.42, 0.02); plaq.userData.acao = { tipo: 'porta', k }; g.add(plaq); clicaveis.push(plaq)
      const luz = new THREE.Mesh(new THREE.PlaneGeometry(PW, 0.9), new THREE.MeshBasicMaterial({ color: COR.mostarda, transparent: true, opacity: 0.12, toneMapped: false, depthWrite: false }))
      luz.rotation.x = -Math.PI / 2; luz.position.set(0, 0.015, 0.5); g.add(luz)
      return { g, vao, placa, luz, base: new THREE.Vector3(), hover: 0 }
    })
    let saguao = { topo: 0, base: 0 }, saguaoVivo = false

    // 4) a SALA de cada tema: um cômodo fora do corredor, para onde se entra pela porta
    const SX = 140
    const salaG = new THREE.Group(); salaG.position.set(SX, 0, 0); cena.add(salaG)
    const SW = 12, SD = 14, SH = 6.6
    const chaoS = new THREE.Mesh(uvEscala(new THREE.PlaneGeometry(SW, SD), SW / 3, SD / 3), matChao); chaoS.rotation.x = -Math.PI / 2; salaG.add(chaoS)
    const tetoS = new THREE.Mesh(new THREE.PlaneGeometry(SW, SD), matTeto); tetoS.rotation.x = Math.PI / 2; tetoS.position.y = SH; salaG.add(tetoS)
    for (const [w, x, z, ry] of [[SW, 0, -SD / 2, 0], [SD, -SW / 2, 0, Math.PI / 2], [SD, SW / 2, 0, -Math.PI / 2], [SW, 0, SD / 2, Math.PI]]) {
      const p = new THREE.Mesh(uvEscala(new THREE.PlaneGeometry(w, SH), w / 2.4, 1), matParede); p.position.set(x, SH / 2, z); p.rotation.y = ry; salaG.add(p)
    }
    const FW = 6.4, FH = 4.0
    const fotoSala = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))
    fotoSala.position.set(1.2, 2.75, -SD / 2 + 0.08); salaG.add(fotoSala)
    const moldS = new THREE.Mesh(new THREE.BoxGeometry(FW + 0.22, FH + 0.22, 0.1), matLatao); moldS.position.set(1.2, 2.75, -SD / 2 + 0.02); salaG.add(moldS)
    const placaSala = placaCanvas(1400, 260, (g, c, dados) => {
      if (!dados) return
      g.fillStyle = '#D4A574'; g.font = '700 30px Inter'; g.letterSpacing = '8px'; g.fillText((dados.objetivo || dados.area || "").toUpperCase(), 8, 52); g.letterSpacing = '0px'
      // 10/11: as frases das portas ficaram mais longas — até três linhas, um pouco menores
      g.fillStyle = '#FAF7F2'; g.font = 'italic 52px "DM Serif Display"'
      quebrar(g, `“${dados.frase || dados.dor}”`, c.width - 20).slice(0, 3).forEach((l, i) => g.fillText(l, 8, 118 + i * 62))
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
    /* 11/11 — MODO LER (limpeza visual, Fase 2). As "cabeças" são os blocos de leitura do passeio: o título
       de cada ala e o painel de cada grupo. Enquanto uma cabeça está na zona de leitura, o 3D recua —
       os quadros se recolhem na parede, o corredor escurece, o olhar sobe (celular) e o boneco muda de
       faixa. Só depois que o título sai é que os quadros voltam e o primeiro se solta (o "respiro"). */
    let cabecas = []
    const yDoc = (el) => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y } // sem as transformações das animações de entrada
    const LER = { nevoa: 0.035, luz: 1, fio: 0.96, cena: 0.82, latao: 0.75, lataoArq: 1, bonecoPc: 0.34, fora: 1.55, parede: 0.7, piso: 0.85, abrePcLado: 0.1, abrePcFrente: 3.4 }
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
      // as cabeças (Fase 3: inclui a do saguão — as portas só sobem depois que ela foi lida)
      cabecas = [...document.querySelectorAll('main#conteudo .ala-cabeca, main#conteudo .grupo-painel')].map((el) => {
        const filhos = el.classList.contains('ala-cabeca') ? [...el.children] : [el]
        const ultimo = filhos[filhos.length - 1]
        return { topo: yDoc(filhos[0]), base: yDoc(ultimo) + ultimo.offsetHeight }
      })
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false); acab.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix()
      posicionarLockup()
    }
    // o saguão: as portas formam um arco à frente de quem chega na cabeça da Ala 2.
    // Recalculado também quando as portas começam a subir (aí o layout da página já assentou).
    function montarSaguao() {
      const cab = document.querySelector('#problemas .ala-cabeca')
      if (cab && portas3d.length) {
        // 11/11 (Fase 3): o que conta é o BLOCO de texto da cabeça (régua → lista), não a caixa inteira
        const filhos = [...cab.children], ultimo = filhos[filhos.length - 1]
        saguao = { topo: yDoc(filhos[0]), base: yDoc(ultimo) + ultimo.offsetHeight }
        // a fileira fica à frente de onde a câmera está no meio do "palco" das portas (o bloco já saiu por cima)
        const uS = uDe(alaDe(saguao.base + window.innerHeight * 0.72))
        const c = new THREE.Vector3()
        caminho.getPointAt(uS, c)
        /* 10/11: com sete portas o arco por ângulo batia nas paredes (11,5 m de corredor) e a última
           sumia atrás da divisória entre as alas. Agora é uma fileira com curva suave, centrada no
           caminho, à frente da divisória (5–7 m de quem chega), cada porta virada para o visitante;
           se não couberem em tamanho cheio, as portas encolhem por igual. */
        const n = portas3d.length, MEIO = 4.2
        /* 11/11 (Fase 3): com o palco depois do título, quem chega está a ~2 m de uma divisória; a regra antiga
           puxava a fileira para a frente dela e as portas ficavam a 1,5 m do rosto (uma porta enchia a tela).
           Agora a fileira fica 10 m à frente — passa da divisória, cabe mais porta na tela do celular e as sete
           aparecem no computador; se cair em cima de uma divisória, vai para logo depois dela. */
        let zFila = c.z - 10
        for (let i = 0; i < N - 1; i++) { const zd = -i * PASSO - 27; if (Math.abs(zd - zFila) < 2) zFila = zd - 2.5 }
        const cx = THREE.MathUtils.clamp(c.x, -1.2, 1.2)
        const passoX = n > 1 ? (2 * MEIO) / (n - 1) : 0
        const esc = n > 1 ? Math.min(1, passoX / 1.78) : 1
        portas3d.forEach((p, k) => {
          const x = cx + (n > 1 ? -MEIO + k * passoX : 0)
          const z = zFila + 0.5 * ((x - cx) / MEIO) ** 2
          p.base.set(x, 0, z); p.esc = esc
          p.g.position.copy(p.base); p.g.rotation.y = Math.atan2(c.x - x, c.z - z); p.g.scale.setScalar(esc)
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
    const dirOlhar = new THREE.Vector3(), dirObra = new THREE.Vector3(), ctrl = new THREE.Vector3()
    const balanco = new THREE.Quaternion(), eixoZ = new THREE.Vector3(0, 0, 1)
    let prog = 0, raf, visivel = true, primeiro = true, emFoco = false, abre = -1, bonecoSome = 0
    let fPortas = 0 // quanto as portas do saguão estão de pé (0..1), do quadro anterior
    let ler = 0, lado = -1, legendaCel = false, focoId = null, luzBaixa = false, frentePc = 0
    const guiaRumo = new THREE.Vector3()
    const aoVis = () => { visivel = document.visibilityState === 'visible'; if (visivel) quadro() }
    document.addEventListener('visibilitychange', aoVis)
    const quadro = () => {
      if (!vivo || !visivel) return
      const dt = Math.min(relogio.getDelta(), 0.05), t = relogio.elapsedTime
      const yTela = window.scrollY + window.innerHeight * 0.5
      const alvo = alaDe(yTela) / Math.max(N - 1, 1)
      prog += (alvo - prog) * Math.min(1, dt * 4.5)
      mouse.sx += (mouse.x - mouse.sx) * Math.min(1, dt * 4); mouse.sy += (mouse.y - mouse.sy) * Math.min(1, dt * 4)

      // modo LER: liga quando o topo de uma cabeça passa de 90% para 76% da altura da tela (entrando por baixo)
      // e desliga quando a base dela sobe de 26% para 12% (saindo por cima). cantoLivre: nenhuma cabeça
      // ocupa a faixa de baixo da tela (onde o boneco para, no celular).
      const vhTela = window.innerHeight, syTela = window.scrollY
      let lerAlvo = 0, cantoLivre = true
      for (const c of cabecas) {
        const tc = c.topo - syTela, bc = c.base - syTela
        if (bc < 0 || tc > vhTela) continue
        lerAlvo = Math.max(lerAlvo, suave(vhTela * 0.9, vhTela * 0.76, tc) * suave(vhTela * 0.12, vhTela * 0.26, bc))
        if (bc > vhTela * 0.77) cantoLivre = false
      }
      ler += (lerAlvo - ler) * Math.min(1, dt * 5)
      if (Math.abs(lerAlvo - ler) < 0.0005) ler = lerAlvo

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
        acab.foco(5, 0); acab.desenhar(dt)
        raf = requestAnimationFrame(quadro)
        return
      }
      const retrato = cam.aspect < 1

      // 06/11 — cada quadro tem o seu trecho de rolagem, em três tempos:
      //  1. quem anda VIRA O ROSTO para o quadro na parede (no celular a parede fica fora da tela estreita;
      //     sem isso o quadro "surgia" do nada na frente)
      //  2. o quadro SE SOLTA: sai da parede para o meio do corredor e faz uma curva até a posição de leitura
      //  3. ao seguir, ele faz o caminho de volta para a parede — e o próximo quadro repete o mesmo gesto
      // Tudo segue o scroll com amortecimento: o toque do celular rola aos trancos e o quadro não pode pular.
      let olharPeso = 0, olharObra = null
      for (const o of obras) {
        const p = (yTela - o.topo) / o.alt
        // 11/11: o quadro volta um pouco antes (0,84 em vez de 0,9) e não se solta enquanto um título está em
        // leitura — o título nunca divide a tela com um quadro em destaque
        const fAlvo = (p < -0.9 || p > 1.5 ? 0 : suave(-0.1, 0.38, p) * (1 - suave(0.56, 0.84, p))) * (1 - suave(0.05, 0.4, ler))
        o.fs += (fAlvo - o.fs) * Math.min(1, dt * 6)
        if (Math.abs(fAlvo - o.fs) < 0.0005) o.fs = fAlvo
        // o olhar para o próximo começa quando o anterior volta para a parede (os dois gestos se encadeiam)
        const wAlvo = (p < -1 || p > 1 ? 0 : suave(-0.45, -0.15, p) * (1 - suave(0, 0.3, p))) * (1 - ler) * (1 - fPortas) // (Fase 3: nem enquanto as portas estão de pé)
        o.ws += (wAlvo - o.ws) * Math.min(1, dt * 4)
        if (o.ws > olharPeso) { olharPeso = o.ws; olharObra = o }
      }

      cam.position.copy(pos)
      olhar.copy(frente); olhar.y = OLHO - 0.18 + mouse.sy * -0.35; olhar.x += mouse.sx * 1.6
      dirOlhar.copy(olhar).sub(pos).normalize()
      if (olharObra && olharPeso > 0.002) {
        dirObra.copy(olharObra.parede.pos).sub(pos); dirObra.y *= 0.5; dirObra.normalize()
        dirOlhar.lerp(dirObra, olharPeso * (retrato ? 0.8 : 0.28)).normalize()
      }
      // abertura no celular: quem chega olha para o pórtico, no alto; o olhar desce quando a rolagem começa
      // (amortecido: o toque rola aos trancos). Enquanto se lê a abertura, o fundo do corredor escurece.
      const pTopo = (yTela - window.innerHeight * 0.5) / Math.max(window.innerHeight, 1)
      const abreAlvo = retrato ? 1 - suave(0.02, 0.5, pTopo) : 0
      abre = abre < 0 ? abreAlvo : abre + (abreAlvo - abre) * Math.min(1, dt * 5)
      if (Math.abs(abreAlvo - abre) < 0.0005) abre = abreAlvo
      // no celular o olhar também sobe enquanto se lê uma cabeça: o chão (e o boneco) descem para a faixa de baixo
      const sobe = retrato ? Math.max(abre, ler) : 0
      if (sobe > 0) { dirOlhar.y += ABRE.inclina * sobe; dirOlhar.normalize() }
      // modo LER: as luzes da galeria baixam (névoa, luminárias, fio, focos) — fica aceso o foco do boneco
      cena.fog.density = 0.028 + ABRE.nevoa * abre + LER.nevoa * ler
      matLuzTeto.emissiveIntensity = 1.6 * (1 - LER.luz * ler); matHalo.opacity = 1 - 0.97 * ler
      matLuzTeto.color.setHex(COR.bege).multiplyScalar(1 - 0.98 * ler)
      // o latão (rodapés, quinas das divisórias) também apaga: riscos brilhantes atrás de rótulos pequenos
      matLatao.color.setHex(COR.mostarda).multiplyScalar(1 - LER.latao * ler); matLatao.envMapIntensity = 1 - LER.latao * ler
      matLataoArq.opacity = 1 - LER.lataoArq * ler
      matParede.color.setScalar(1 - LER.parede * ler) // a parede tem um friso pintado a 1 m do chão: escurece junto
      // o piso de taco tem desenho miúdo: escurece junto, para não vibrar atrás das letras; as partículas somem
      matChao.color.setHex(0x2c2925).multiplyScalar(1 - LER.piso * ler)
      po.material.opacity = 0.55 * (1 - ler)
      if (introAcabou && (ler > 0.001 || luzBaixa)) {
        const k = 1 - LER.cena * ler
        matFio.emissiveIntensity = INT.fio * (1 - LER.fio * ler)
        hemi.intensity = INT.hemi * k; sol.intensity = INT.sol * k; spotA.intensity = INT.spotA * k; spotB.intensity = INT.spotB * k; luzPortico.intensity = INT.portico * k
        cena.environmentIntensity = INT.env * (1 - 0.6 * ler)
        luzBaixa = ler > 0.001
      }
      olhar.copy(pos).add(dirOlhar)
      cam.lookAt(olhar)
      cam.getWorldDirection(fwd); right.crossVectors(fwd, up).normalize()

      // o letreiro corre; o totem fica na entrada e afunda quando se segue; as portas sobem no saguão
      if (letreiro.tex) letreiro.tex.offset.x += dt * 0.025
      const fTotem = (1 - suave(0.35, 0.9, pTopo)) * entrada.v * (1 - ler) // 11/11: afunda também quando um título entra em leitura
      totem.visible = fTotem > 0.01 && !retrato // 10/11: no celular em pé o totem ficava atrás do título; lá o atalho é o botão em HTML
      totem.position.y = (fTotem - 1) * 2.6
      anel.material.opacity = 1; anel.scale.setScalar(1 + Math.sin(t * 3) * 0.08)
      luzTotem.intensity = 2.2 + Math.sin(t * 3) * 0.8
      /* 11/11 (Fase 3): as portas sobem DEPOIS que o título e a lista foram lidos — quando a base do bloco passa
         de 30% para 10% da altura da tela —, ficam de pé por ~55% de tela de rolagem (o "palco" delas, sem
         texto por cima) e descem antes de o primeiro quadro da ala se soltar. Antes subiam enquanto a
         cabeça estava na tela, e as placas ficavam atrás do título e dos botões. */
      const bS = (saguao.base - syTela) / vhTela
      const fS = suave(0.3, 0.1, bS) * (1 - suave(-0.45, -0.62, bS))
      fPortas = fS
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
        p.g.scale.setScalar((p.esc || 1) * (1 + p.hover * 0.03))
      })

      // o boneco caminha no fio, à frente da câmera: a velocidade é a da câmera ao longo do fio
      // (negativa = o visitante voltou, ele se vira); olha para o quadro que se soltou da parede
      const uG = Math.min(u + 0.02, 0.999)
      fioCurva.getPointAt(uG, guiaPos); fioCurva.getTangentAt(uG, guiaTan); guiaPos.y = 0
      /* 11/11 — o boneco nunca fica atrás de texto nem de botão: quando um bloco de leitura ocupa o lugar dele,
         ele muda de faixa (o alvo é uma fração da meia-largura da tela, à direita do fio):
           celular    · canto de baixo, à direita, na abertura e nas cabeças (o olhar sobe e abre essa faixa)
                      · sai de cena pela direita quando o canto está ocupado (título entrando por baixo) ou há
                        uma legenda de obra aberta; volta para o fio quando o texto passa
           computador · anda pela faixa da direita enquanto o título está na coluna da esquerda */
      const lendo = lerAlvo > 0.3
      const foraCel = retrato && ((lendo && !cantoLivre) || legendaCel)
      // abertura no computador: ele espera mais à frente e um passo à direita do fio — fora do título e do parágrafo
      const abrePc = retrato ? 0 : 1 - suave(0.02, 0.5, pTopo)
      const ladoAlvo = retrato ? (foraCel ? LER.fora : Math.max(ABRE.bonecoLado * abre, lendo ? ABRE.bonecoLado : 0)) : Math.max(lendo ? LER.bonecoPc : 0, LER.abrePcLado * abrePc)
      lado = lado < 0 ? ladoAlvo : lado + (ladoAlvo - lado) * Math.min(1, dt * 3.2)
      if (Math.abs(ladoAlvo - lado) < 0.0005) lado = ladoAlvo
      frentePc += (LER.abrePcFrente * abrePc - frentePc) * Math.min(1, dt * 3.2)
      if (lado > 0.0005 || frentePc > 0.001) {
        guiaPos.addScaledVector(guiaTan, retrato ? ABRE.bonecoFrente * Math.min(1, lado / ABRE.bonecoLado) : frentePc).addScaledVector(right, lado * 0.4877 * cam.aspect * ABRE.bonecoProf).setY(0)
        // não atravessa parede nem divisória entre alas
        guiaPos.x = THREE.MathUtils.clamp(guiaPos.x, -(LARG / 2 - 0.7), LARG / 2 - 0.7)
        for (let i = 0; i < N - 1; i++) {
          if (Math.abs(guiaPos.z - (-i * PASSO - 27)) > 1.2) continue
          const livre = LARG / 2 - DIV - 0.55
          if (-ladoAla(i + 1) > 0) guiaPos.x = Math.min(guiaPos.x, livre); else guiaPos.x = Math.max(guiaPos.x, -livre)
        }
      }
      // a passada acompanha o deslocamento real: para a frente no fio, ou de lado quando troca de faixa
      if (!guiaComecou) { guiaAnt.copy(guiaPos); guiaComecou = true }
      guiaDelta.subVectors(guiaPos, guiaAnt); guiaAnt.copy(guiaPos)
      const vLong = dt > 0 ? guiaDelta.dot(guiaTan) / dt : 0, vLat = dt > 0 ? guiaDelta.dot(right) / dt : 0
      const deLado = Math.abs(vLat) > Math.abs(vLong)
      const vGuia = THREE.MathUtils.clamp(deLado ? Math.abs(vLat) : vLong, -6, 6)
      if (deLado) guiaRumo.copy(right).multiplyScalar(Math.sign(vLat)); else guiaRumo.copy(guiaTan)
      guia.raiz.position.copy(guiaPos)
      guiaDelta.subVectors(cam.position, guiaPos).setY(0).setLength(1.1)
      luzGuia.position.copy(guiaPos).add(guiaDelta).setY(1.5)
      // no celular ele some de cena enquanto o painel de opções está aberto (abre na faixa dele) e quando sai pela direita
      bonecoSome += (((perguntaRef.current && retrato) || foraCel ? 1 : 0) - bonecoSome) * Math.min(1, dt * 7)
      guia.raiz.scale.setScalar(Math.max(0.001, suave(0, 1, entrada.v) * (1 - bonecoSome)))
      // no modo LER o foco dele fecha: ilumina o boneco e o chão em volta, sem acender a parede atrás dos rótulos
      luzGuia.intensity = 5.5 * (1 - bonecoSome) * (1 - 0.3 * ler); luzGuia.distance = 7 - 3.5 * ler
      guia.atualizar(dt, { v: vGuia, tangente: guiaRumo, camera: cam.position, alvo: olharObra && olharPeso > 0.05 ? olharObra.grupo.position : null, t })

      let maior = 0, atual = olharPeso > 0.05 ? olharObra : null, maiorLuz = olharPeso
      const dist = retrato ? 7.2 : 4.6
      const largVisivel = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect
      // modo LER: os quadros se recolhem na parede enquanto um título é lido e voltam quando ele passa
      // (Fase 3: e enquanto as portas do saguão estão de pé — o palco é só delas)
      const presAlvo = (1 - suave(0.25, 0.75, ler)) * (1 - suave(0.05, 0.6, fPortas))
      for (const o of obras) {
        const f = o.fs
        // na abertura do computador, a parede do lado do texto (a esquerda) fica livre: os quadros dela surgem quando o passeio começa
        const presObra = !retrato && o.lado > 0 ? Math.min(presAlvo, 1 - suave(0.3, 0.8, abrePc)) : presAlvo
        o.ps += (presObra - o.ps) * Math.min(1, dt * 4); if (Math.abs(presObra - o.ps) < 0.001) o.ps = presObra
        const pe = Math.max(0.001, o.ps * o.ps * (3 - 2 * o.ps))
        o.grupo.visible = pe > 0.02
        const focoObra = f > 0.72
        if (focoObra !== o.foco) { o.foco = focoObra; o.el.classList.toggle('em-foco', focoObra) }
        // 09/11: no celular, o quadro que chega na leitura troca para a imagem grande (1920 px) — só ele
        if (f > 0.3 && o.hd && o.tela) {
          const url = o.hd; o.hd = null
          loader.load(url, (t2) => {
            if (!vivo) return
            t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = maxAniso
            const velha = o.tela.material.map; o.tela.material.map = t2; o.tela.material.needsUpdate = true; velha?.dispose()
          })
        }
        if (f <= 0.001) { if (o.f) { o.grupo.position.copy(o.parede.pos); o.grupo.quaternion.copy(o.parede.quat); o.f = 0 } o.grupo.scale.setScalar(pe); continue }
        o.f = f
        const e = easeInOut(f)
        alvoPos.copy(cam.position).addScaledVector(fwd, dist).addScaledVector(right, retrato ? 0 : -o.lado * 1.75).addScaledVector(up, (retrato ? 0.85 : 0.05) + Math.sin(t * 1.1) * 0.04)
        // a curva: da parede, primeiro para o meio do corredor (e um pouco para cima), depois para a frente de quem anda
        ctrl.copy(o.parede.pos); ctrl.x += o.lado * 2.8; ctrl.y += 0.45
        const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e
        o.grupo.position.set(0, 0, 0).addScaledVector(o.parede.pos, a).addScaledVector(ctrl, b).addScaledVector(alvoPos, c)
        // vira de frente um pouco antes de chegar, com um leve balanço de quem foi tirado da parede
        o.grupo.quaternion.slerpQuaternions(o.parede.quat, cam.quaternion, suave(0, 0.85, e))
        balanco.setFromAxisAngle(eixoZ, Math.sin(Math.PI * e) * 0.07 * o.lado); o.grupo.quaternion.multiply(balanco)
        const escAlvo = Math.min(1, (largVisivel * (retrato ? 0.9 : 0.5)) / o.w)
        o.grupo.scale.setScalar((1 + (escAlvo - 1) * e) * pe)
        if (f > maior) maior = f
        if (f > maiorLuz) { maiorLuz = f; atual = o }
      }
      // quem está em foco: o guia (barra "Quero algo assim") só aparece com obra em foco; no celular, a legenda
      // aberta ocupa a faixa do boneco
      const emLeitura = obras.find((o) => o.foco)
      legendaCel = retrato && !!emLeitura
      if ((emLeitura?.el.id || null) !== focoId) { focoId = emLeitura?.el.id || null; window.dispatchEvent(new CustomEvent('flow:obra-foco', { detail: focoId })) }
      // no celular o quadro sobe à frente do pórtico: o logo esmaece enquanto se lê
      // (11/11: e também quando o passeio começa — ele sai por cima sem virar uma mancha atrás do cabeçalho)
      // (11/11, Fase 2: no computador ele esmaece quando o título da Ala 01 entra em leitura e não volta — o logo
      // é a fachada da abertura; antes reaparecia gigante atrás das legendas das primeiras obras)
      const opPortico = retrato ? (1 - 0.85 * suave(0.2, 0.8, maior)) * suave(0.5, 0.9, abre) : (1 - suave(0.1, 0.6, ler)) * (1 - suave(0.7, 1.15, pTopo))
      // 09/11: com o buffer em alta faixa, o reflexo forte do latão atravessava a transparência —
      // o reflexo esmaece junto (e a opacidade cai em curva) para o logo sumir de verdade atrás do quadro
      matCreme.opacity = matLataoL.opacity = opPortico * opPortico
      matCreme.envMapIntensity = matLataoL.envMapIntensity = opPortico
      matCreme.emissiveIntensity = 0.14 * opPortico
      // o totem e o letreiro entram depois da abertura
      // (11/11: no retrato ele também se recolhe no teto quando o passeio começa — não passa por trás do cabeçalho)
      caixaLetreiro.position.y = LET.y + (1 - entrada.v) * 2.2 + (retratoIni && retrato ? (1 - abre) * 2 : 0)

      // com uma obra flutuando, o grão de filme quase some (ele sujava o print)
      const foco = maior > 0.35
      if (foco !== emFoco) { emFoco = foco; document.documentElement.classList.toggle('obra-em-foco', foco) }
      const ala = Math.round(prog * (N - 1)), alaZ = (i) => -i * PASSO
      if (atual) { spotA.position.copy(cam.position).addScaledVector(up, ALT - 0.2 - OLHO).addScaledVector(fwd, 1.5); spotA.target.position.copy(atual.grupo.position) }
      else { spotA.position.set(0, ALT - 0.2, alaZ(ala) - 4); spotA.target.position.set(0, 1.4, alaZ(ala) - 14) }
      const prox = Math.min(ala + 1, N - 1)
      spotB.position.set(0, ALT - 0.2, alaZ(prox) - 4); spotB.target.position.set(0, 1.4, alaZ(prox) - 14)
      sol.position.set(pos.x + 3, pos.y + 7, pos.z + 4); sol.target.position.set(pos.x, 0, pos.z - 10)

      lockup.rotation.y = lockupGiro + Math.sin(t * 0.5) * (retrato ? 0.04 : 0.08)
      for (const g of pecasAla) { const no = g.children[0]; if (no?.geometry?.type === 'TorusKnotGeometry') { no.rotation.y = t * 0.4; no.rotation.x = Math.sin(t * 0.3) * 0.3 } for (const c of g.children) if (c.userData.billboard) c.lookAt(cam.position) }
      po.position.y = Math.sin(t * 0.15) * 0.3; po.rotation.y = t * 0.01

      // foco de câmera no quadro em leitura (o fundo desfoca)
      acab.foco(retrato ? 7.2 : 4.6, suave(0.5, 0.95, maior))
      acab.desenhar(dt)
      if (primeiro) { primeiro = false; document.documentElement.classList.add('expo-pronta') }
      // a abertura só começa depois de uns quadros já desenhados: o 1º quadro compila os shaders (trava),
      // e se a queda das letras começasse ali o visitante via só o fim dela
      if (!renderizou && ++quadrosDesenhados >= 4) { renderizou = true; if (introTl && introTl.paused()) introTl.play() }
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
      acab.dispose(); pmrem.dispose(); renderer.dispose(); host.innerHTML = ''
      document.documentElement.classList.remove('obra-em-foco')
      window.dispatchEvent(new CustomEvent('flow:obra-foco', { detail: null }))
      obras.forEach((o) => o.el.classList.remove('em-foco'))
      if (pularRef) pularRef.current = null
    }
    // monta UMA vez: quando a abertura acaba, a cena segue a mesma (antes ela era desmontada e remontada
    // no fim da abertura, e o logo da fachada sumia e voltava)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div id="canvas-root" ref={hostRef} aria-hidden="true" />
}
