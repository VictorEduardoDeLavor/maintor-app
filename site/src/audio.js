/* Som procedural de 0KB (Web Audio API) — um toque sutil no hover dos
   botões principais. Ganho baixíssimo de propósito: é textura, não fanfarra.
   O contexto só nasce após o primeiro gesto do usuário (regra dos browsers). */

let ctx = null

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
