# MASTER — Design System · maintorflow.com.br v2
### Fonte única de verdade. Todo token do site vem daqui. Criado 21/08/2026.

## Teses (validadas pelo Victor em 21/08/2026)

**Visual:** Editorial dark premium — verde profundo como papel de revista;
DM Serif Display itálico em escala de manchete full-bleed (Noomo), partículas
mostarda atravessando o tipo; réguas hairline bege estruturando seções (Epic);
micro-labels caps ultra-espaçado em mostarda; números de cena fantasma em
outline; listas editoriais no lugar de cards; mostarda só acento (60-30-10).

**Interação:** Scroll como fio narrativo — títulos revelam palavra a palavra
com máscara (400-700ms, power4.out); case VOKE expande a quase full-bleed no
scroll (Active Theory); cena SorrIA alterna partículas→malha wireframe
(Terminal Industries); marquee lento de serviços entre cenas; cursor dot
mostarda que cresce sobre interativos.
**Proibido:** bounce, elastic, neon fora da paleta, glassmorphism dominante,
mostarda como fundo.

## Cores (manual da marca v1.0 — imutável)

| Token | Hex | Papel |
|---|---|---|
| `--abismo` | `#0D2626` | fundo do site (papel) |
| `--profundo` | `#143535` | superfícies elevadas |
| `--petroleo` | `#1F4747` | superfícies claras do dark |
| `--mostarda` | `#D4A574` | acento — fio, label, destaque de palavra |
| `--caramelo` | `#B8895A` | acento 2, hover do acento |
| `--creme` | `#FAF7F2` | texto display e corpo forte |
| `--bege` | `#E6DDD0` | base das hairlines (com alpha) |
| `--cinza-claro` | `#A9BCB8` | corpo de apoio |

Hairline: `1px solid rgba(230,221,208,.16)`. Ghost outline: `1px rgba(230,221,208,.14)`.

## Tipografia

| Token | Fonte | Tamanho | Uso |
|---|---|---|---|
| `--f-manchete` | DM Serif Display itálico | `clamp(58px, 11.5vw, 176px)` · lh .96 · ls -0.02em | manchete hero/CTA |
| `--f-titulo` | DM Serif Display itálico | `clamp(38px, 5.6vw, 88px)` · lh 1.02 | título de cena |
| `--f-corpo` | Inter 400 | 16.5px · lh 1.65 | parágrafo |
| `--f-micro` | Inter 700 caps | 11px · ls .22em | labels, réguas, índices |
| `--f-num-fantasma` | DM Serif itálico outline | `clamp(180px, 28vw, 400px)` | 01/02/03 de fundo |

## Espaço
Base 8px. Escala: 8 · 16 · 24 · 40 · 64 · 104 · 168. Cena: `min-height 100vh`,
respiro vertical `104px+`. Wrap: `1240px` / margem `clamp(20px, 4vw, 56px)`.

## Motion

| Token | Valor |
|---|---|
| `--t-rapido` | 180ms · ease-out (hover) |
| `--t-medio` | 450ms · power3.out (UI) |
| `--t-revelacao` | 700ms · power4.out · stagger 60ms (palavras) |
| scrub | case VOKE e metamorfose 3D seguem o scroll com damping ~4.5 |

Reduced motion: sem Lenis, sem marquee, sem cursor custom, partículas quietas,
conteúdo visível sem depender de reveal.

## Componentes-chave
- **Régua-label:** hairline full-width com micro-label esquerda + meta direita.
- **Linha editorial:** grid `[índice | rótulo | valor]`, border-top hairline, 18px v-pad.
- **Selo case:** pill hairline mostarda caps — fronteira VOKE≠Flow (obrigatório).
- **Pill CTA:** mostarda/profundo, hover caramelo + translateY(-2px).
- **Ghost number:** outline bege 14%, ancora o canto da cena, `aria-hidden`.
