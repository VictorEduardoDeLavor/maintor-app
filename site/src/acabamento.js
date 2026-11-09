import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js'

/* ================================================================
   ACABAMENTO DE IMAGEM (09/11/2026) — o que separa "3D de site" de
   "galeria fotografada":
   · MSAA 4x no buffer de cena (bordas finas mesmo com pós-processo)
   · GTAO: o escurecido de canto/encontro (o objeto deixa de flutuar)
   · foco de câmera: quando um quadro chega na leitura, o fundo desfoca
   · tom + vinheta num passe só — e os PRINTS ficam fora do filtro de tom
     (a tela do quadro escreve alfa 0 no buffer; o passe final usa isso
     como máscara e entrega a cor exata do print)

   Qualidade adaptativa, medida em tempo real:
     2 = tudo (computador)   1 = MSAA + tom + vinheta (celular)
     0 = render direto, densidade reduzida (aparelho fraco)
   Se o quadro médio passar de ~22 ms, primeiro baixa a densidade de
   pixels, depois o nível. Só desce, nunca sobe (sem pisca-pisca).
   ?qualidade=alta na URL trava no nível 2 (para capturas e conferência).
   ================================================================ */

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    exposicao: { value: 1.05 },
    vinheta: { value: 0.28 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float exposicao; uniform float vinheta;
    varying vec2 vUv;
    // ACES (o mesmo ajuste do three.js)
    vec3 flowFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
    vec3 flowAces(vec3 color) {
      const mat3 flowEntrada = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
      const mat3 flowSaida = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
      color *= exposicao / 0.6;
      color = flowEntrada * color; color = flowFit(color); color = flowSaida * color;
      return clamp(color, 0.0, 1.0);
    }
    vec3 paraSRGB(vec3 c) { return mix(c * 12.92, pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), step(vec3(0.0031308), c)); }
    void main() {
      vec4 t = texture2D(tDiffuse, vUv);
      vec3 cena = flowAces(t.rgb);
      vec3 print = clamp(t.rgb, 0.0, 1.0);
      // alfa 0 = tela de um quadro: cor exata, sem tom
      vec3 c = mix(print, cena, clamp(t.a, 0.0, 1.0));
      vec2 d = vUv - 0.5; float v = 1.0 - vinheta * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      // um fio de grão para quebrar faixas no degradê escuro
      float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
      gl_FragColor = vec4(paraSRGB(c * v) + g / 255.0, 1.0);
    }`,
}

// a tela do quadro marca a si mesma com alfa 0 (máscara para o passe final)
export function marcarTela(mat) {
  mat.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n\tgl_FragColor.a = 0.0;')
  }
  mat.customProgramCacheKey = () => 'tela-mascara'
  return mat
}

export function criarAcabamento(renderer, cena, cam, { celular }) {
  const busca = new URLSearchParams(location.search).get('qualidade')
  const travado = busca === 'alta' ? 2 : busca === 'media' ? 1 : busca === 'baixa' ? 0 : null
  let nivel = travado ?? (celular ? 1 : 2)
  const prMax = Math.min(window.devicePixelRatio || 1, 2)
  let pr = nivel === 0 ? Math.min(prMax, 1.25) : prMax
  let w = 1, h = 1

  // buffer em meia-precisão (luz acima de 1 não estoura) com MSAA 4x
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, rt)
  const render = new RenderPass(cena, cam)
  const gtao = new GTAOPass(cena, cam, 1, 1)
  gtao.blendIntensity = 0.85
  // o AO roda em meia resolução (o resultado é suave de qualquer jeito; economiza 4x)
  const tamGtao = gtao.setSize.bind(gtao); gtao.setSize = (a, b) => tamGtao(Math.ceil(a / 2), Math.ceil(b / 2))
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 })
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 })
  const final = new ShaderPass(FinalShader)
  const bokeh = new BokehPass(cena, cam, { focus: 5, aperture: 0, maxblur: 0.008 })
  composer.addPass(render); composer.addPass(gtao); composer.addPass(final); composer.addPass(bokeh)

  function aplicarNivel() {
    gtao.enabled = nivel >= 2
    bokeh.enabled = nivel >= 2
    renderer.setPixelRatio(pr)
    composer.setPixelRatio(pr)
    composer.setSize(w, h)
    document.documentElement.dataset.qualidade = String(nivel)
  }

  // medição: média móvel do tempo de quadro, ignorando os primeiros 2,5 s (carregamento)
  let acum = 0, n = 0, desde = performance.now()
  function medir(dt) {
    if (travado !== null) return
    if (performance.now() - desde < 2500 || dt <= 0 || dt > 0.25) return
    acum += dt; n++
    if (n < 90) return
    const media = acum / n; acum = 0; n = 0
    if (media > 0.022) {
      if (pr > 1.26) pr = Math.max(1.25, pr - 0.375)
      else if (nivel > 0) nivel--
      else return
      aplicarNivel(); desde = performance.now()
    }
  }

  let focoAlvo = 0, focoDist = 5
  return {
    get nivel() { return nivel },
    setSize(nw, nh) { w = nw; h = nh; aplicarNivel() },
    // dist = distância do quadro em leitura; peso 0..1 = quanto ele está "em leitura"
    foco(dist, peso) { focoDist = dist; focoAlvo = peso },
    desenhar(dt) {
      medir(dt)
      if (nivel === 0) {
        // render direto: o tom do three, e a tela continua fora dele (toneMapped:false no material)
        renderer.setRenderTarget(null); renderer.render(cena, cam); return
      }
      if (bokeh.enabled) {
        bokeh.uniforms.focus.value = focoDist
        bokeh.uniforms.aperture.value = 0.0042 * focoAlvo
        bokeh.enabled = focoAlvo > 0.02 // sem quadro em leitura não gasta o passe
      }
      composer.render(dt)
      if (nivel >= 2) bokeh.enabled = true
    },
    dispose() { composer.dispose(); rt.dispose(); gtao.dispose?.(); bokeh.dispose?.() },
  }
}
