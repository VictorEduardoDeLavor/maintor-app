import * as THREE from 'three'

/* ================================================================
   O BONECO DO VICTOR — guia do passeio, no lugar da bolinha do fio.

   v2 (10/11/2026): escultura em código. A v1 era montada com esferas e caixas e
   não parecia a folha. Agora cada volume é uma SUPERFÍCIE contínua, ajustada sobre
   as silhuetas da referência (site/testes/boneco/folha-tecnica-A.webp — fica FORA
   de public/, não é publicada):
     · cabeça = anéis medidos na folha (largura na vista de frente, frente/nuca no perfil)
     · cabelo, barba e sobrancelhas = "cascas" que nascem da própria cabeça, onde um
       campo (função de x, altura, z) diz que há pelo; a borda é o ponto onde a casca
       mergulha na pele, então o contorno sai liso
     · degradê do corte = cor por vértice na cabeça
     · tronco, mangas, braços, pernas e sapatos = tubos de seção arredondada
   Unidades: pixels da folha (altura total 492), origem no chão entre os pés,
   frente para +z; o grupo é escalado para metros.

   Articulações (grupos com o pivô no lugar):
     pelve → tronco → cabeça          tronco → ombro (manga) → cotovelo (antebraço + mão)
     pelve → coxa → joelho → tornozelo (sapato)
   ================================================================ */

const H = 492          // altura da folha em px
const PERNA = 128      // do quadril ao chão
const COR = {
  pele: 0xcf7c40, sombra: 0xa35e2b, cabelo: 0x211c1a, roupa: 0x173228, cinto: 0x4d301b,
  labioS: 0x9a4028, labioI: 0xb65a3c, olho: 0x070707, branco: 0xf1ece2, botao: 0xe4dfcc, selo: 0xe2a024, ouro: 0xc9983a, aro: 0x735826,
  fade: [0x282220, 0x523621, 0x8e5d36],
}

const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e)
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mix = (a, b, t) => a + (b - a) * t
const angDif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d }
const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
// tabela de anéis → função(r fracionário, saída): Catmull-Rom por coluna
const tabela = (tab) => {
  const n = tab.length, m = tab[0].length
  return (r, o) => {
    const i = Math.min(n - 2, Math.max(0, Math.floor(r))), t = r - i
    const a = tab[Math.max(i - 1, 0)], b = tab[i], c = tab[i + 1], d = tab[Math.min(i + 2, n - 1)]
    for (let k = 0; k < m; k++) o[k] = cr(a[k], b[k], c[k], d[k], t)
    return o
  }
}
// curva y(x) por pontos de controle (x crescente)
const curva = (pts) => (x) => {
  const n = pts.length
  if (x <= pts[0][0]) return pts[0][1]
  if (x >= pts[n - 1][0]) return pts[n - 1][1]
  let i = 0; while (x > pts[i + 1][0]) i++
  const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
  return cr(pts[Math.max(i - 1, 0)][1], pts[i][1], pts[i + 1][1], pts[Math.min(i + 2, n - 1)][1], t)
}

/* Malha em grade: nu colunas (fecha em volta) × nv+1 linhas. Normais por diferença finita
   (lisas, sem costura). `campo` + `corte`: descarta triângulos em que o campo é todo < corte. */
function grade(nu, nv, pos, { campo = null, corte = 0, cores = null } = {}) {
  const n = nu * (nv + 1), nor = new Float32Array(n * 3)
  for (let j = 0; j <= nv; j++) {
    const jd = Math.max(j - 1, 0), ju = Math.min(j + 1, nv)
    for (let i = 0; i < nu; i++) {
      const k = (j * nu + i) * 3, l = (j * nu + (i + nu - 1) % nu) * 3, r = (j * nu + (i + 1) % nu) * 3
      const d = (jd * nu + i) * 3, u = (ju * nu + i) * 3
      const ax = pos[r] - pos[l], ay = pos[r + 1] - pos[l + 1], az = pos[r + 2] - pos[l + 2]
      const bx = pos[u] - pos[d], by = pos[u + 1] - pos[d + 1], bz = pos[u + 2] - pos[d + 2]
      let x = ay * bz - az * by, y = az * bx - ax * bz, z = ax * by - ay * bx
      const len = Math.hypot(x, y, z)
      if (len < 1e-7) { x = 0; y = j < nv / 2 ? -1 : 1; z = 0 } else { x /= len; y /= len; z /= len }
      nor[k] = x; nor[k + 1] = y; nor[k + 2] = z
    }
  }
  const idx = []
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * nu + i, b = j * nu + (i + 1) % nu, c = a + nu, d = b + nu
    if (campo && campo[a] < corte && campo[b] < corte && campo[c] < corte && campo[d] < corte) continue
    idx.push(a, b, c, b, d, c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  if (cores) g.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  g.setIndex(idx)
  return { geo: g, nor }
}

/* Tubo de seção superelíptica ao longo de y. linhas: [y, a (meia largura x), b (meia prof. z), cz, cx].
   n = expoente da seção (2 = elipse; 3+ = retângulo arredondado). */
function tubo(linhas, { n = 2, nu = 28, sub = 4 } = {}) {
  if (linhas[0][0] > linhas[linhas.length - 1][0]) linhas = [...linhas].reverse()   // de baixo para cima: faces para fora
  const T = tabela(linhas.map((l) => [l[0], l[1], l[2], l[3] || 0, l[4] || 0]))
  const nv = (linhas.length - 1) * sub, pos = new Float32Array(nu * (nv + 1) * 3), o = [], e = 2 / n
  for (let j = 0; j <= nv; j++) {
    T(j / sub, o)
    const a = Math.max(0, o[1]), b = Math.max(0, o[2])
    for (let i = 0; i < nu; i++) {
      const th = i / nu * Math.PI * 2, k = (j * nu + i) * 3
      pos[k] = o[4] + a * sp(Math.sin(th), e); pos[k + 1] = o[0]; pos[k + 2] = o[3] + b * sp(Math.cos(th), e)
    }
  }
  return grade(nu, nv, pos).geo
}

// ---------- a cabeça: anéis medidos na folha (h = altura do chão; z = 0 no centro da cabeça) ----------
//            h      a     zf     zb
const CRANIO = [
  [288.0, 0, 30, 30],
  [289.5, 22, 54, 6],
  [293, 36, 66, -12],
  [299, 47, 73, -27],
  [306, 55, 77, -40],
  [314, 61.5, 80, -51],
  [324, 67, 82.5, -62],
  [335, 72, 83.5, -72],
  [347, 75.5, 84, -80],
  [359, 77.5, 84, -86],
  [371, 78.5, 84, -90],
  [383, 79, 83.5, -92],
  [395, 79, 82, -93],
  [407, 78, 79.5, -92],
  [419, 76, 76, -88],
  [429, 72.5, 71.5, -82],
  [439, 67.5, 65, -74],
  [449, 61, 56, -65],
  [458, 52.5, 45, -54],
  [465, 42, 33, -43],
  [470.5, 30, 20, -29],
  [473.5, 16, 8, -15],
  [474.5, 0, -4, -4],
]
// envelope do cabelo (topete): mesmas linhas da cabeça; do alto da testa para cima, as medidas da silhueta
const ENV_TOPO = [[430, 77.5, 70, -89], [443, 72, 61, -83], [456, 65, 63, -75], [468, 56, 66, -65], [478, 46, 62, -50], [486, 37, 54, -39], [491.5, 25, 42, -27], [494.5, 0, 8, 8]]
const ENVELOPE = CRANIO.map((l, i) => (i < 15 ? [l[0], l[1] + 2.5, l[2], l[3] - 4] : ENV_TOPO[i - 15]))
const BASE_CABECA = 288        // a cabeça gira em torno deste ponto (queixo/pescoço)
const EXP = 2 / 2.1            // seção quase elíptica (cabeça redonda, rosto largo)

// linha do cabelo: altura da borda conforme o ângulo em volta da cabeça (0° = frente, 180° = nuca)
const BORDA = curva([[0, 444], [40, 444], [58, 440], [72, 426], [90, 420], [130, 404], [180, 388]])
// linha da bochecha: até onde a barba sobe, pela distância do centro (vista de frente). Bigode em "V" aberto.
const BOCHECHA = curva([[0, 339], [8, 338.5], [18, 335], [27, 330], [31, 326.5], [38, 328], [48, 331.5], [58, 336.5], [68, 343], [75, 351], [79.5, 366]])
const SOBRANCELHA = curva([[13, 399.5], [22, 403], [34, 405], [46, 403.5], [54, 400], [58, 396.5]])

function montarCabeca(cabeca, M, celular, detalhe) {
  const [NU, NV] = [[92, 74], [128, 104], [168, 132]][detalhe]
  const R = CRANIO.length - 1, Tc = tabela(CRANIO), Te = tabela(ENVELOPE), o = [], q = []
  const n = NU * (NV + 1)
  const pC = new Float32Array(n * 3), cores = new Float32Array(n * 3), fC = new Float32Array(n)
  const info = new Float32Array(n * 4)                     // x, h, z, ângulo (graus)
  const peleC = new THREE.Color(COR.pele), fadeC = COR.fade.map((c) => new THREE.Color(c)), c = new THREE.Color()
  const TH = (i) => { const u = i / NU * Math.PI * 2; return u - 0.45 * Math.sin(u) }  // quase 2× mais colunas na frente

  for (let j = 0; j <= NV; j++) {
    Tc(j / NV * R, o)
    const a = Math.max(0, o[1]), cz = (o[2] + o[3]) / 2, d = (o[2] - o[3]) / 2
    for (let i = 0; i < NU; i++) {
      const th = TH(i), k = j * NU + i
      const x = a * sp(Math.sin(th), EXP), z = cz + d * sp(Math.cos(th), EXP), h = o[0]
      pC[k * 3] = x; pC[k * 3 + 1] = h - BASE_CABECA; pC[k * 3 + 2] = z
      const az = Math.atan2(Math.abs(x), z - cz) * 180 / Math.PI
      info[k * 4] = x; info[k * 4 + 1] = h; info[k * 4 + 2] = z; info[k * 4 + 3] = az
      // degradê: escuro junto do cabelo, sumindo na pele ~78 px abaixo; só dos lados e atrás (z < 36)
      const dBorda = BORDA(az) - h
      const kf = Math.pow(Math.min(1, Math.max(0, 1 - dBorda / 96)), 0.8) * suave(34, 16, z)
      fC[k] = 14 + dBorda                                   // > 0 = pele à vista (o que fica sob o cabelo é descartado)
      if (kf > 0.72) c.copy(fadeC[1]).lerp(fadeC[0], (kf - 0.72) / 0.28)
      else if (kf > 0.36) c.copy(fadeC[2]).lerp(fadeC[1], (kf - 0.36) / 0.36)
      else c.copy(peleC).lerp(fadeC[2], kf / 0.36)
      c.toArray(cores, k * 3)
    }
  }
  const cranio = grade(NU, NV, pC, { cores, campo: fC, corte: 0 })
  const mCranio = new THREE.Mesh(cranio.geo, M.peleVC); mCranio.castShadow = !celular; cabeca.add(mCranio)

  // ---------- casca de pelos do rosto: barba, bigode, costeletas e sobrancelhas ----------
  const pB = new Float32Array(n * 3), fB = new Float32Array(n)
  for (let k = 0; k < n; k++) {
    const x = info[k * 4], h = info[k * 4 + 1], z = info[k * 4 + 2], ax = Math.abs(x)
    // barba: abaixo da linha da bochecha e à frente da linha do maxilar
    const zJ = h >= 326 ? 4 : 4 + (326 - h) * 0.75
    let m = Math.min(BOCHECHA(ax) - h, z - zJ)
    // abertura da boca (lábios e pele em volta): superelipse; mosca no centro, embaixo
    const boca = 1 - Math.pow(Math.pow(ax / 26, 3) + Math.pow(Math.abs(h - 318.5) / 13.5, 3), 1 / 3)
    if (z > 40) m = Math.min(m, -boca * 13)
    if (z > 40) m = Math.max(m, 3.2 - ax - Math.max(0, h - 305) * 0.9)
    // costeleta: faixa estreita na frente da orelha, do maxilar até o cabelo
    m = Math.max(m, Math.min(z - 3, 20 - Math.max(0, h - 345) * 0.36 - z, h - 332))   // a ponta afina até sumir no degradê
    const dentro = suave(0, 5, m)
    let off = 2.6 * suave(-2.4, 3.2, m)
    off += 4.2 * Math.exp(-Math.pow((h - 300) / 15, 2)) * suave(28, 62, z) * dentro            // volume do queixo
    off += 2 * Math.exp(-Math.pow((h - 334) / 6, 2)) * suave(34, 22, ax) * suave(40, 60, z) * dentro // bigode
    // sobrancelhas: faixa em arco, grossa por dentro e fina na ponta
    const t = (ax - 13) / 45
    const mS = z > 30 ? Math.min((7.4 - 3.8 * t) - Math.abs(h - SOBRANCELHA(ax)), (ax - 12) * 1.1, (56.5 - ax) * 0.9) : -9
    off = Math.max(off, 3.6 * suave(-3, 3.6, mS))
    fB[k] = Math.max(m, mS)
    const e = off - 0.9                                     // fora do pelo a casca afunda 0,9 px na pele
    pB[k * 3] = pC[k * 3] + cranio.nor[k * 3] * e; pB[k * 3 + 1] = pC[k * 3 + 1] + cranio.nor[k * 3 + 1] * e; pB[k * 3 + 2] = pC[k * 3 + 2] + cranio.nor[k * 3 + 2] * e
  }
  const mBarba = new THREE.Mesh(grade(NU, NV, pB, { campo: fB, corte: -5 }).geo, M.cabelo); mBarba.castShadow = !celular; cabeca.add(mBarba)

  // ---------- cabelo: da borda para cima a superfície sai da cabeça e vai até o envelope do topete ----------
  const pH = new Float32Array(n * 3), fH = new Float32Array(n)
  for (let j = 0; j <= NV; j++) {
    Te(j / NV * R, q)
    const a = Math.max(0, q[1]), cz = (q[2] + q[3]) / 2, d = (q[2] - q[3]) / 2
    for (let i = 0; i < NU; i++) {
      const th = TH(i), k = j * NU + i
      const ex = a * sp(Math.sin(th), EXP), ez = cz + d * sp(Math.cos(th), EXP)
      const ey = q[0] - BASE_CABECA + Math.max(0, q[0] - 440) * 0.045 * (ex / 60)
      const dB = info[k * 4 + 1] - BORDA(info[k * 4 + 3])    // px acima da linha do cabelo
      const w = suave(-1.5, 6.5, dB)
      fH[k] = dB
      const x = mix(pC[k * 3] - cranio.nor[k * 3] * 1.5, ex, w), y = mix(pC[k * 3 + 1] - cranio.nor[k * 3 + 1] * 1.5, ey, w), z = mix(pC[k * 3 + 2] - cranio.nor[k * 3 + 2] * 1.5, ez, w)
      // mechas penteadas para trás e para o lado: sulcos largos + fios finos
      const cm = ex * 0.9 + ez * 0.42 + 0.003 * ez * ez - 0.0016 * ex * ez + 0.45 * (q[0] - 450) * suave(15, -45, ez)
      const mecha = (Math.pow(Math.abs(Math.cos(Math.PI * cm / 30)), 0.85) - 0.55) * 5.4
      const rx = x, ry = y - 122, rz = z + 6, rl = Math.hypot(rx, ry, rz) || 1, km = mecha * suave(7, 24, dB)
      pH[k * 3] = x + rx / rl * km; pH[k * 3 + 1] = y + ry / rl * km; pH[k * 3 + 2] = z + rz / rl * km
    }
  }
  const mCabelo = new THREE.Mesh(grade(NU, NV, pH, { campo: fH, corte: -6 }).geo, M.cabelo); mCabelo.castShadow = !celular; cabeca.add(mCabelo)

  // z da pele na frente do rosto, para apoiar olhos, nariz, lábios e óculos
  const zRosto = (x, h) => {
    let r = 0; while (r < R - 1 && CRANIO[r + 1][0] < h) r++
    const t = (h - CRANIO[r][0]) / (CRANIO[r + 1][0] - CRANIO[r][0]); Tc(r + t, o)
    const cz = (o[2] + o[3]) / 2, d = (o[2] - o[3]) / 2
    return cz + d * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / o[1], 2.1)), 1 / 2.1)
  }
  return { zRosto }
}

export function criarBoneco({ altura = 0.8, celular = false, detalhe = celular ? 0 : 1 } = {}) {
  // vinil brilhante: verniz (clearcoat) no computador; material simples no celular
  const mat = (cor, rug = 0.38, verniz = 0.9, extra = {}) => (celular
    ? new THREE.MeshStandardMaterial({ color: cor, roughness: rug + 0.08, metalness: 0, ...extra })
    : new THREE.MeshPhysicalMaterial({ color: cor, roughness: rug, metalness: 0, clearcoat: verniz, clearcoatRoughness: 0.18, ...extra }))
  const M = {
    pele: mat(COR.pele, 0.42, 0.7), peleVC: mat(0xffffff, 0.42, 0.7, { vertexColors: true }), sombra: mat(COR.sombra, 0.5, 0.5),
    cabelo: mat(COR.cabelo, 0.4, 0.6), roupa: mat(COR.roupa, 0.3, 1), cinto: mat(COR.cinto, 0.42, 0.6),
    labioS: mat(COR.labioS, 0.4, 0.7), labioI: mat(COR.labioI, 0.36, 0.8), olho: mat(COR.olho, 0.08, 1),
    branco: mat(COR.branco, 0.3, 0.8), botao: mat(COR.botao, 0.35, 0.8), selo: mat(COR.selo, 0.35, 0.9),
    brilho: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    ouro: new THREE.MeshStandardMaterial({ color: COR.ouro, roughness: 0.2, metalness: 1 }),
    aro: new THREE.MeshStandardMaterial({ color: COR.aro, roughness: 0.42, metalness: 1 }),
  }
  const ESF = new THREE.SphereGeometry(1, [18, 28, 40][detalhe], [12, 18, 28][detalhe])
  const pendurar = (o, pai, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); o.castShadow = !celular; pai.add(o); return o }
  const malha = (geo, m, pai, x, y, z) => pendurar(new THREE.Mesh(geo, m), pai, x, y, z)
  const elipse = (m, pai, x, y, z, rx, ry, rz) => { const o = malha(ESF, m, pai, x, y, z); o.scale.set(rx, ry, rz); return o }
  const grupo = (pai, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); pai.add(g); return g }
  const haste = (a, b, r, m, pai) => {
    const v = new THREE.Vector3().subVectors(b, a), o = malha(new THREE.CylinderGeometry(r, r, v.length(), 8), m, pai, 0, 0, 0)
    o.position.copy(a).addScaledVector(v, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return o
  }
  // peça chata de cantos arredondados, a partir de um contorno 2D (gola, fivela, selo, passantes)
  const chapa = (pts, esp, bisel, m, pai, x, y, z) => {
    const s = new THREE.Shape(); pts.forEach(([px, py], i) => (i ? s.lineTo(px, py) : s.moveTo(px, py))); s.closePath()
    return malha(new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 6 }), m, pai, x, y, z)
  }
  const ret = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
  const NUc = [20, 28, 36][detalhe]

  const raiz = new THREE.Group()
  const corpo = grupo(raiz); corpo.scale.setScalar(altura / H)

  // ---------- pelve: quadril da calça e cinto ----------
  const pelve = grupo(corpo, 0, PERNA, 0)
  malha(tubo([[-16, 0, 0, -2], [-15, 30, 26, -2], [-11, 50, 39, -2], [-3, 58, 44.5, -1.5], [12, 59.5, 47, -0.5], [28, 59, 49, 1], [34, 56.5, 48, 1], [35, 0, 0, 1]], { n: 3.6, nu: NUc }), M.roupa, pelve, 0, 0, 0)
  malha(tubo([[26.5, 0, 0, 1], [27, 58, 49.5, 1], [29, 61, 52.5, 1], [37, 61.5, 53, 1], [45, 61, 52.5, 1], [47, 58, 49.5, 1], [47.5, 0, 0, 1]], { n: 3.2, nu: NUc }), M.cinto, pelve, 0, 0, 0)
  chapa(ret(27, 17), 4, 2, M.ouro, pelve, 0, 37, 53)                                     // fivela
  for (const [x, z, ry] of [[-38, 50.5, -0.2], [38, 50.5, 0.2], [-36, -49.5, Math.PI + 0.2], [36, -49.5, Math.PI - 0.2]]) {
    const p = chapa(ret(4.5, 21), 2.5, 1.2, M.roupa, pelve, x, 37, z); p.rotation.y = ry    // passantes
  }

  // ---------- tronco: camisa polo ----------
  const tronco = grupo(pelve, 0, 46, 0)
  malha(tubo([[-9, 0, 0, 0.5], [-8, 52, 45, 0.5], [-2, 58, 50.5, 1], [10, 59, 52.5, 1.5], [30, 59.5, 54.5, 1.5], [52, 60, 55, 1.5], [72, 60.5, 53.5, 1], [86, 60, 50, 0], [96, 55, 45, -1], [104, 45, 38, -2], [110, 35, 31, -3], [114, 0, 0, -3]], { n: 3, nu: NUc }), M.roupa, tronco, 0, 0, 0)
  pendurar(new THREE.Mesh(new THREE.CylinderGeometry(29, 31, 26, 24), M.pele), tronco, 0, 112, -3)   // pescoço (aparece no V da gola)
  // gola: faixa em volta do pescoço, aberta na frente, e as duas pontas dobradas sobre o peito
  const perfilGola = [[32, 0], [39, -1.5], [41.5, 3], [37.5, 17], [33.5, 19], [31, 16]].map(([r, y]) => new THREE.Vector2(r, y))
  const gola = pendurar(new THREE.Mesh(new THREE.LatheGeometry(perfilGola, 40, THREE.MathUtils.degToRad(24), THREE.MathUtils.degToRad(312)), M.roupa), tronco, 0, 100, -3)
  gola.scale.set(1, 1.12, 0.94)
  for (const s of [1, -1]) {
    const aba = chapa([[s * 6, 12], [s * 35, 9], [s * 24, -14], [s * 1.5, -6.5]], 3.2, 1.6, M.roupa, tronco, 0, 100, 40)
    aba.rotation.x = -0.62; aba.rotation.y = s * 0.16
  }
  const carcela = chapa(ret(13, 38), 1.6, 1, M.roupa, tronco, 0, 72, 55.6); carcela.rotation.x = -0.05
  for (const y of [84, 67]) elipse(M.botao, tronco, 0, y, 58.4, 4.2, 4.2, 2)
  const selo = chapa(ret(15, 15), 1.6, 1, M.selo, tronco, 34, 62, 52.6); selo.rotation.y = 0.2

  // ---------- cabeça ----------
  const cabeca = grupo(tronco, 0, BASE_CABECA - PERNA - 46, -4)
  const { zRosto } = montarCabeca(cabeca, M, celular, detalhe)
  const Y = (h) => h - BASE_CABECA
  // nariz: ponta arredondada + dorso
  elipse(M.pele, cabeca, 0, Y(350.5), zRosto(0, 350) - 1.5, 16.5, 13, 15)
  elipse(M.pele, cabeca, 0, Y(365), zRosto(0, 365) - 3.5, 9, 17, 9.5)
  // lábios dentro da abertura da barba
  elipse(M.labioS, cabeca, 0, Y(328.5), zRosto(0, 328) - 0.5, 21.5, 4.4, 4.2)
  elipse(M.labioI, cabeca, 0, Y(319.5), zRosto(0, 320) - 0.5, 18, 7, 5)
  // olhos (pupila preta brilhante, um fio de branco por fora), óculos redondos de latão, orelhas
  const olhos = []
  for (const s of [-1, 1]) {
    const olho = grupo(cabeca, s * 31.5, Y(371), zRosto(31.5, 371) - 4.5)
    olho.rotation.y = s * 0.2
    elipse(M.branco, olho, s * 2.4, -0.5, -2.4, 14.2, 13.4, 7)
    elipse(M.olho, olho, 0, 0, 0, 12.4, 12.4, 9)
    elipse(M.brilho, olho, -4, 4.6, 8, 2.8, 2.8, 1.2)
    elipse(M.brilho, olho, 4.2, -4, 8.2, 1.2, 1.2, 0.6)
    olhos.push(olho)
    const aro = malha(new THREE.TorusGeometry(26, 1.25, 10, 64), M.aro, cabeca, s * 36.5, Y(370), zRosto(36.5, 370) + 8)
    aro.rotation.y = s * 0.2
    const zAro = zRosto(36.5, 370) + 8
    haste(new THREE.Vector3(s * 62, Y(373), zAro - 5), new THREE.Vector3(s * 79.5, Y(375), 34), 1.05, M.aro, cabeca)
    haste(new THREE.Vector3(s * 79.5, Y(375), 34), new THREE.Vector3(s * 84, Y(376), -8), 1.05, M.aro, cabeca)
    // orelha: concha com a parte de dentro mais escura
    const orelha = grupo(cabeca, s * 82.5, Y(353), -15); orelha.rotation.y = s * 0.5
    elipse(M.pele, orelha, 0, 0, 0, 12.5, 26.5, 19.5)
    elipse(M.sombra, orelha, s * 7.6, -1, 3, 6, 17, 11)
    elipse(M.pele, orelha, s * 9, -9.5, -2.5, 4.6, 8.5, 6.5)
  }
  const ponte = malha(new THREE.TorusGeometry(8.5, 1.2, 8, 20, Math.PI), M.aro, cabeca, 0, Y(371.5), zRosto(8, 372) + 8.5)
  ponte.scale.y = 0.55

  // ---------- braços: manga curta (gira no ombro), antebraço (gira no cotovelo, sob a bainha) e mão ----------
  const ombros = [], cotovelos = []
  for (const s of [1, -1]) {                     // +1 = esquerdo do boneco (+x)
    const om = grupo(tronco, s * 62, 84, -2)
    malha(tubo([[9, 0, 0], [8, 12, 12], [4, 20, 20.5], [-6, 23.5, 24], [-26, 23.5, 24], [-42, 23, 23.5], [-46.5, 23.6, 24], [-48.5, 22, 22.5], [-49, 0, 0]], { n: 2.2, nu: NUc }), M.roupa, om, 0, 0, 0)
    const co = grupo(om, 0, -44, 0)
    malha(tubo([[8, 0, 0], [7, 13, 13], [2, 21.5, 21.5], [-14, 22, 22], [-29, 22.6, 22.6], [-34.4, 21.4, 21.4], [-36, 23, 23], [-42, 20, 20], [-44, 0, 0]], { n: 2.1, nu: NUc }), M.pele, co, 0, 0, 0)
    elipse(M.pele, co, s * 2, -60, 2, 24, 27.5, 20.5)                            // mão de luva
    const polegar = elipse(M.pele, co, -s * 15.5, -53, 13.5, 8.5, 14, 9.5); polegar.rotation.z = -s * 0.5; polegar.rotation.x = 0.3
    ombros.push(om); cotovelos.push(co)
  }

  // ---------- pernas: coxa, canela e sapato de latão ----------
  const coxas = [], joelhos = [], tornozelos = []
  for (const s of [1, -1]) {
    const cx = grupo(pelve, s * 31, 0, -3)
    malha(tubo([[14, 0, 0, 3], [13, 18, 27, 3], [8, 28.6, 41.5, 2.5], [-4, 30.2, 43, 2], [-24, 30.6, 40.5, 0.5], [-40, 30.8, 38.6, 0], [-46.8, 30.5, 38.2, 0], [-48.6, 29.4, 37.2, 0], [-49, 0, 0, 0]], { n: 3.6, nu: NUc }), M.roupa, cx, 0, 0, 0)
    const jo = grupo(cx, 0, -49, 0)
    malha(tubo([[4, 0, 0], [3.5, 27, 34.5], [1, 30.2, 37.8], [-3, 30.8, 38.6], [-34, 30.8, 38.6], [-41, 30.2, 38], [-43.5, 28, 35.5], [-44, 0, 0]], { n: 3.4, nu: NUc }), M.roupa, jo, 0, 0, 0)
    const to = grupo(jo, 0, -41, 0)
    // sapato: sola, vinco e bico arredondado
    malha(tubo([[-38, 0, 0, 12], [-37.6, 33, 46, 12], [-35.5, 38, 51, 12], [-31.5, 38.6, 51.6, 12], [-30, 36.8, 50, 12], [-28.5, 37.6, 50.6, 12], [-18, 38, 50.6, 12], [-8, 37.2, 49, 11.5], [0, 34.5, 45, 10.5], [6, 28.5, 37, 8.5], [10, 17, 22, 6], [11.5, 0, 0, 5]], { n: 2.25, nu: NUc }), M.ouro, to, s * 5, 0, 0)
    coxas.push(cx); joelhos.push(jo); tornozelos.push(to)
  }

  // ---------- estado da animação ----------
  const E = { fase: 0, v: 0, rumo: 0, parado: 0, piscar: 2.5, piscando: 0, acenou: false, aceno: -1, olharYaw: 0, olharPitch: 0 }
  const tmp = new THREE.Vector3()
  const ABRE = 0.34                                    // braços em "A" (16°) em repouso

  /* Avança a animação.
     dt        segundos desde o último quadro
     v         velocidade com sinal ao longo do fio (m/s; negativa = voltando)
     tangente  direção do fio em que ele está (Vector3, mundo)
     camera    posição da câmera (Vector3) — parado, ele se vira e olha para quem chega
     alvo      posição de um quadro em destaque (Vector3 | null) — ele vira a cabeça para lá
     reduzido  movimento reduzido: fica parado, só respira */
  function atualizar(dt, { v = 0, tangente = null, camera = null, alvo = null, reduzido = false, t = 0 } = {}) {
    if (reduzido) v = 0
    E.v += (v - E.v) * Math.min(1, dt * 5)
    const vel = Math.abs(E.v)
    const anda = suave(0.03, 0.18, vel)                 // 0 parado → 1 andando
    const corre = suave(0.9, 2.6, vel)                  // rolagem rápida: passada maior, corpo inclinado
    E.parado = anda < 0.05 ? E.parado + dt : 0

    // passada: o pé não escorrega enquanto dá (ciclo = 2 passos); acima da cadência máxima, ele corre
    const ciclo = altura * (0.72 + corre * 0.35)
    const cadencia = Math.min(vel / ciclo, 2.6 + corre * 0.8)
    E.fase += cadencia * dt * Math.PI * 2

    // rumo: segue o fio (de costas se voltando); parado há um tempo, vira-se para a câmera
    let alvoRumo = E.rumo
    if (tangente && anda > 0.05) alvoRumo = Math.atan2(tangente.x, tangente.z) + (E.v < 0 ? Math.PI : 0)
    if (camera && E.parado > 1.5 && !reduzido) {
      const paraCam = Math.atan2(camera.x - raiz.position.x, camera.z - raiz.position.z)
      alvoRumo = E.rumo + angDif(E.rumo, paraCam) * 0.75
    }
    E.rumo += angDif(E.rumo, alvoRumo) * Math.min(1, dt * (anda > 0.05 ? 6 : 2.5))
    raiz.rotation.y = E.rumo

    // ---------- pernas e braços (poses da folha: contato, baixa, passagem, impulso) ----------
    const A = (0.5 + corre * 0.3) * anda                 // amplitude do quadril
    for (let k = 0; k < 2; k++) {
      const p = E.fase + k * Math.PI                     // pernas em oposição
      const sn = Math.sin(p), cs = Math.cos(p)
      const quadril = -A * sn                            // negativo = perna para a frente
      const joelho = anda * (0.05 + (0.5 + corre * 0.45) * Math.pow(Math.max(0, cs), 1.4)) // dobra quando a perna vem para a frente
      coxas[k].rotation.x = quadril
      joelhos[k].rotation.x = joelho
      tornozelos[k].rotation.x = -(quadril + joelho) * 0.72 * anda
      // braço oposto à perna do mesmo lado; cotovelo dobrado como na folha
      ombros[k].rotation.x = A * 0.9 * sn
      cotovelos[k].rotation.x = -(0.75 + corre * 0.45) * anda - Math.max(0, -sn) * 0.3 * anda
      ombros[k].rotation.z = (k === 0 ? 1 : -1) * (ABRE - 0.16 * anda)
      cotovelos[k].rotation.z = 0
    }
    // a pelve desce o que a perna aberta encurta: o pé de apoio não afunda no chão
    const abertura = Math.max(Math.abs(coxas[0].rotation.x), Math.abs(coxas[1].rotation.x))
    pelve.position.y = PERNA - PERNA * (1 - Math.cos(abertura)) + anda * 3 * Math.cos(2 * E.fase)
    tronco.rotation.x = (0.05 + corre * 0.14) * anda
    tronco.rotation.y = 0.08 * anda * Math.sin(E.fase)

    // respirar
    const resp = Math.sin(t * 1.9)
    tronco.scale.set(1 + resp * 0.005, 1 + resp * 0.007, 1 + resp * 0.005)

    // ---------- acenar: uma vez por sessão, depois de ~6 s parado ----------
    if (!E.acenou && E.parado > 6 && !reduzido) { E.acenou = true; E.aceno = 0 }
    if (E.aceno >= 0) {
      E.aceno += dt
      const w = suave(0, 0.35, E.aceno) * (1 - suave(1.9, 2.4, E.aceno))
      ombros[1].rotation.z += -2.2 * w                   // braço direito sobe pela lateral
      ombros[1].rotation.x += -0.2 * w
      cotovelos[1].rotation.z = -w * (0.4 + 0.35 * Math.sin(E.aceno * 11))
      if (E.aceno > 2.4) E.aceno = -1
    }

    // ---------- cabeça: equilibra o balanço, olha para o quadro em destaque ou para a câmera ----------
    let yaw = -tronco.rotation.y, pitch = 0
    const olharPara = alvo || (E.parado > 1.5 ? camera : null)
    if (olharPara) {
      cabeca.getWorldPosition(tmp)
      const dx = olharPara.x - tmp.x, dz = olharPara.z - tmp.z
      yaw += THREE.MathUtils.clamp(angDif(E.rumo, Math.atan2(dx, dz)), -1.1, 1.1)
      pitch = THREE.MathUtils.clamp(-Math.atan2(olharPara.y - tmp.y, Math.hypot(dx, dz)), -0.35, 0.2)
    }
    E.olharYaw += (yaw - E.olharYaw) * Math.min(1, dt * 4)
    E.olharPitch += (pitch - E.olharPitch) * Math.min(1, dt * 4)
    cabeca.rotation.set(E.olharPitch + 0.03 * anda * Math.sin(2 * E.fase), E.olharYaw, 0)

    // ---------- piscar ----------
    E.piscar -= dt
    if (E.piscar <= 0) { E.piscando = 0.16; E.piscar = 2.5 + Math.random() * 3 }
    let fecha = 0
    if (E.piscando > 0) { E.piscando -= dt; fecha = Math.sin(Math.max(0, E.piscando) / 0.16 * Math.PI) }
    for (const o of olhos) o.scale.y = 1 - 0.9 * fecha
  }

  return { raiz, atualizar, altura }
}
