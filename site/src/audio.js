/* Som procedural de 0KB (Web Audio API) — nenhum arquivo de áudio.
   1) blipHover: toque sutil no hover dos botões principais.
   2) Ambiente opt-in: pad sintetizado (acorde grave em Lá com detune) por
      trás de um filtro passa-baixo que ABRE com a velocidade do scroll —
      rolar rápido soa brilhante, parar abafa. Só liga no botão "som".
   O contexto nasce após o primeiro gesto do usuário (regra dos browsers). */

let ctx = null
let ambiente = null

function garantirContexto() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

// destrava o áudio no primeiro gesto, uma vez só
if (typeof window !== 'undefined') {
  const destravar = () => {
    const c = garantirContexto()
    if (c && c.state === 'suspended') c.resume()
    window.removeEventListener('pointerdown', destravar)
  }
  window.addEventListener('pointerdown', destravar, { once: true })
}

export function blipHover() {
  const c = garantirContexto()
  if (!c || c.state !== 'running') return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(620, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1100, c.currentTime + 0.07)
  gain.gain.setValueAtTime(0.018, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + 0.09)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.09)
}

/* ---- pad ambiente ------------------------------------------------ */

const CORTE_BASE = 240 // Hz — filtro quase fechado em repouso

function criarAmbiente(c) {
  const master = c.createGain()
  master.gain.value = 0.0001

  const filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = CORTE_BASE
  filtro.Q.value = 0.8

  filtro.connect(master)
  master.connect(c.destination)

  // Lá1 + Lá2 + Mi3 + Lá3, com detune leve para o pad "bater" devagar
  const notas = [55, 110, 164.81, 220]
  const pesos = [0.5, 0.32, 0.22, 0.14]
  const osciladores = notas.map((f, i) => {
    const o = c.createOscillator()
    o.type = i === 0 ? 'triangle' : 'sine'
    o.frequency.value = f * (1 + (i % 2 ? 0.0015 : -0.0015))
    const g = c.createGain()
    g.gain.value = pesos[i]
    o.connect(g)
    g.connect(filtro)
    o.start()
    return o
  })

  // respiração lenta do filtro, para o pad nunca ficar parado
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGanho = c.createGain()
  lfoGanho.gain.value = 40
  lfo.connect(lfoGanho)
  lfoGanho.connect(filtro.frequency)
  lfo.start()

  return { master, filtro, osciladores, lfo, ligado: false }
}

/* Liga/desliga com fade (sem clique). Retorna o novo estado. */
export function alternarAmbiente() {
  const c = garantirContexto()
  if (!c) return false
  if (c.state === 'suspended') c.resume()
  if (!ambiente) ambiente = criarAmbiente(c)
  ambiente.ligado = !ambiente.ligado
  ambiente.master.gain.cancelScheduledValues(c.currentTime)
  ambiente.master.gain.setTargetAtTime(
    ambiente.ligado ? 0.045 : 0.0001,
    c.currentTime,
    0.6,
  )
  return ambiente.ligado
}

/* Velocidade do Lenis → abertura do filtro (chamar num ticker). */
export function modularPorScroll(velocidade) {
  if (!ctx || !ambiente || !ambiente.ligado) return
  const v = Math.min(Math.abs(velocidade) / 25, 1)
  ambiente.filtro.frequency.setTargetAtTime(
    CORTE_BASE + v * 1400,
    ctx.currentTime,
    0.25,
  )
}
