import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ================================================================
   Um único organismo de partículas que se metamorfoseia ao scroll.
   O canvas vive ACIMA do conteúdo (pointer-events: none): as
   partículas passam na frente das letras — profundidade à la Noomo.

   0 nebulosa    (hero — a ideia solta, cruzando a manchete)
   1 vitrine     (lojas & sites — três planos, como telas)
   2 correnteza  (automação — fita ondulante de mensagens)
   3 malha       (tecnologia — esfera de engenharia + wireframe)
   4 núcleo      (contato — tudo converge)

   Cores: MASTER.md — mostarda/caramelo/creme sobre verde profundo.
   ================================================================ */

const FORMAS = 5
const ANEIS = 24
const RAIO_MALHA = 2.5
const CENTRO_MALHA_X = 1.8

function gerarFormacoes(count) {
  const formas = Array.from({ length: FORMAS }, () => new Float32Array(count * 3))
  const seeds = new Float32Array(count)
  const rand = (a, b) => a + Math.random() * (b - a)
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

  for (let i = 0; i < count; i++) {
    seeds[i] = Math.random()
    const i3 = i * 3

    // 0 — NEBULOSA: nuvem larga cruzando a área da manchete
    formas[0][i3 + 0] = 0.6 + gauss() * 4.2
    formas[0][i3 + 1] = gauss() * 2.8
    formas[0][i3 + 2] = gauss() * 2.4

    // 1 — VITRINE: três planos em leque, à direita
    {
      const plano = i % 3
      const px = rand(-1, 1), py = rand(-1, 1)
      const cx = [1.2, 2.6, 4.0][plano]
      const cz = [0.6, 0, -0.6][plano]
      const rot = [-0.35, 0, 0.35][plano]
      const x = px * 0.95, z = 0
      formas[1][i3 + 0] = cx + x * Math.cos(rot) - z * Math.sin(rot)
      formas[1][i3 + 1] = py * 1.7
      formas[1][i3 + 2] = cz + x * Math.sin(rot)
    }

    // 2 — CORRENTEZA: fita senoidal diagonal
    {
      const t = i / count
      const x = -6 + t * 12
      formas[2][i3 + 0] = x + gauss() * 0.15
      formas[2][i3 + 1] = Math.sin(t * Math.PI * 3) * 1.6 + x * 0.12 + gauss() * 0.3
      formas[2][i3 + 2] = Math.cos(t * Math.PI * 2) * 0.8 + gauss() * 0.3
    }

    // 3 — MALHA: esfera em anéis (o wireframe conecta estes pontos)
    {
      const anel = i % ANEIS
      const lat = (anel / (ANEIS - 1)) * Math.PI
      const lon = ((i / ANEIS) % 1) * Math.PI * 2 + anel * 0.26
      formas[3][i3 + 0] = CENTRO_MALHA_X + RAIO_MALHA * Math.sin(lat) * Math.cos(lon)
      formas[3][i3 + 1] = RAIO_MALHA * Math.cos(lat)
      formas[3][i3 + 2] = RAIO_MALHA * Math.sin(lat) * Math.sin(lon)
    }

    // 4 — NÚCLEO: esfera compacta e densa, à direita do formulário
    {
      const u = Math.random(), v = Math.random()
      const theta = u * Math.PI * 2
      const phi = Math.acos(2 * v - 1)
      const r = 1.15 * Math.cbrt(Math.random())
      formas[4][i3 + 0] = 2.6 + r * Math.sin(phi) * Math.cos(theta)
      formas[4][i3 + 1] = 0.2 + r * Math.cos(phi)
      formas[4][i3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
  }
  return { formas, seeds }
}

const vertexShader = /* glsl */ `
  attribute vec3 aPos0; attribute vec3 aPos1; attribute vec3 aPos2;
  attribute vec3 aPos3; attribute vec3 aPos4;
  attribute float aSeed;
  uniform float uProgress;   // 0..4 contínuo entre as formações
  uniform float uTime;
  uniform vec2  uMouse;      // em unidades de mundo, plano z=0
  uniform float uPixelRatio;
  uniform float uWander;     // 1 = deriva viva, 0 = quieto (reduced motion)
  uniform float uVel;        // velocidade do scroll (Lenis), amortecida
  varying float vSeed;
  varying float vDepth;

  vec3 pegar(int i) {
    if (i == 0) return aPos0;
    if (i == 1) return aPos1;
    if (i == 2) return aPos2;
    if (i == 3) return aPos3;
    return aPos4;
  }

  void main() {
    float p = clamp(uProgress, 0.0, 3.999);
    int idx = int(floor(p));
    float f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec3 alvoA = pegar(idx);
    vec3 alvoB = pegar(idx + 1);
    float atraso = clamp(f * 1.3 - aSeed * 0.3, 0.0, 1.0);
    vec3 pos = mix(alvoA, alvoB, atraso);

    float t = uTime * 0.4 + aSeed * 40.0;
    pos += uWander * vec3(
      sin(t * 1.1) * 0.06,
      cos(t * 0.9) * 0.06,
      sin(t * 0.7) * 0.06
    ) * (0.5 + aSeed);

    vec2 delta = uMouse - pos.xy;
    float d = length(delta);
    pos.xy += normalize(delta + 0.0001) * smoothstep(2.2, 0.0, d) * 0.18 * uWander;

    // arrasto pelo scroll: o fluxo estica contra o movimento, elástico,
    // cada partícula com inércia própria (padrão Lusion/Unseen)
    pos.y += -uVel * 0.05 * (0.4 + aSeed * 0.9) * uWander;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed * 2.8) * uPixelRatio * (6.0 / -mv.z);
    vSeed = aSeed;
    vDepth = smoothstep(-9.0, -3.0, mv.z);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, d);
    vec3 mostarda = vec3(0.831, 0.647, 0.455);
    vec3 caramelo = vec3(0.722, 0.537, 0.353);
    vec3 creme    = vec3(0.980, 0.969, 0.949);
    vec3 cor = mix(caramelo, mostarda, smoothstep(0.2, 0.7, vSeed));
    cor = mix(cor, creme, step(0.93, vSeed));
    gl_FragColor = vec4(cor, alpha * uOpacity * (0.35 + 0.65 * vDepth));
  }
`

/* Malha wireframe da cena Tecnologia (Terminal Industries):
   liga os pontos de cada anel da formação 3; só aparece na janela
   de progresso da cena 4, com fade suave nas bordas. */
function MalhaWireframe({ progressoRef, mouseRef }) {
  const linhasRef = useRef()

  const geometry = useMemo(() => {
    const pontos = []
    for (let anel = 0; anel < ANEIS; anel++) {
      const lat = (anel / (ANEIS - 1)) * Math.PI
      const passos = 36
      for (let s = 0; s < passos; s++) {
        for (const st of [s, s + 1]) {
          const lon = (st / passos) * Math.PI * 2 + anel * 0.26
          pontos.push(
            CENTRO_MALHA_X + RAIO_MALHA * Math.sin(lat) * Math.cos(lon),
            RAIO_MALHA * Math.cos(lat),
            RAIO_MALHA * Math.sin(lat) * Math.sin(lon),
          )
        }
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pontos), 3))
    return g
  }, [])

  useFrame((_, delta) => {
    const obj = linhasRef.current
    if (!obj) return
    // progresso 0..1 → formação 3 vive por volta de p=0.75 do total
    const p = progressoRef.current * (FORMAS - 1)
    const alvo = THREE.MathUtils.smoothstep(p, 2.55, 3.0) * (1 - THREE.MathUtils.smoothstep(p, 3.05, 3.6))
    obj.material.opacity += (alvo * 0.32 - obj.material.opacity) * Math.min(delta * 4, 1)
    obj.visible = obj.material.opacity > 0.005
    obj.rotation.y += delta * 0.06
  })

  return (
    <lineSegments ref={linhasRef} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color="#D4A574" transparent opacity={0} depthWrite={false} />
    </lineSegments>
  )
}

function Particulas({ progressoRef, mouseRef, velocidadeRef, reduzido }) {
  const materialRef = useRef()
  const { size, viewport } = useThree()
  const count = size.width < 768 ? 2400 : 4200

  const { geometry, uniforms } = useMemo(() => {
    const { formas, seeds } = gerarFormacoes(count)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(formas[0], 3))
    formas.forEach((arr, i) =>
      g.setAttribute(`aPos${i}`, new THREE.BufferAttribute(arr, 3)),
    )
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 12)
    const u = {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(99, 99) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uWander: { value: reduzido ? 0 : 1 },
      uOpacity: { value: 0.85 },
      uVel: { value: 0 },
    }
    return { geometry: g, uniforms: u }
  }, [count, reduzido])

  const mouseAlvo = useRef(new THREE.Vector2(99, 99))

  useFrame((_, delta) => {
    const u = materialRef.current.uniforms
    u.uTime.value += delta
    const alvo = progressoRef.current * (FORMAS - 1)
    u.uProgress.value += (alvo - u.uProgress.value) * Math.min(delta * 4.5, 1)
    // velocidade do Lenis: clamp + amortecimento e decaimento a zero
    const vel = THREE.MathUtils.clamp(velocidadeRef?.current ?? 0, -30, 30)
    u.uVel.value += (vel - u.uVel.value) * Math.min(delta * 6, 1)
    if (velocidadeRef) velocidadeRef.current *= Math.max(0, 1 - delta * 4)
    // mouse vem da window (o canvas não recebe eventos): NDC → mundo z=0
    mouseAlvo.current.set(
      (mouseRef.current.x * viewport.width) / 2,
      (mouseRef.current.y * viewport.height) / 2,
    )
    u.uMouse.value.lerp(mouseAlvo.current, 0.08)
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function CameraParallax({ mouseRef }) {
  useFrame(({ camera }) => {
    camera.position.x += (mouseRef.current.x * 0.35 - camera.position.x) * 0.04
    camera.position.y += (mouseRef.current.y * 0.2 - camera.position.y) * 0.04
    camera.lookAt(0.8, 0, 0)
  })
  return null
}

export default function FlowCanvas({ progressoRef, velocidadeRef, reduzido }) {
  // pointer-events: none no canvas → rastreia o mouse pela window
  const mouseRef = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const aoMover = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', aoMover, { passive: true })
    return () => window.removeEventListener('pointermove', aoMover)
  }, [])

  return (
    <div id="canvas-root" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        <Particulas
          progressoRef={progressoRef}
          mouseRef={mouseRef}
          velocidadeRef={velocidadeRef}
          reduzido={reduzido}
        />
        <MalhaWireframe progressoRef={progressoRef} mouseRef={mouseRef} />
        {!reduzido && <CameraParallax mouseRef={mouseRef} />}
      </Canvas>
    </div>
  )
}
