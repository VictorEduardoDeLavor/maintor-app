import { useEffect, useRef, useState } from 'react'

/* ================================================================
   TRABALHOS NO AR — o site como portfólio (27/10/2026).

   Só entra o que existe e está no ar:
   - prints dos sites capturados em 27/10 por testes/capturar-portfolio.mjs
   - telas dos apps vindas das contas de DEMONSTRAÇÃO (CMMS: empresa fictícia
     Metalúrgica Aurora; FIT: profissional e alunos fictícios) — nada de
     dado de cliente real.
   Cliente só aparece com autorização (VOKE: case público; Bendita: pedido
   do Victor em 22/10). Maktub e A&O só depois do "pode" por escrito.
   ================================================================ */

const P = '/midia/portfolio/'

export const TRABALHOS = [
  {
    id: 'voke',
    nome: 'VOKE WEAR',
    tipo: 'Loja virtual',
    nicho: 'Moda fitness feminina',
    de: 'Cliente',
    texto: 'Loja própria com Pix com desconto, cartão em 12x, frete pelo CEP, estoque por tamanho e fila de espera. A dona opera tudo por um painel dela.',
    url: 'https://vokewear.com.br',
    dominio: 'vokewear.com.br',
    desktop: 'voke-desktop',
    celulares: ['voke-celular'],
    extra: { href: '/casos/voke-wear/', rotulo: 'Ver o case' },
  },
  {
    id: 'bendita',
    nome: 'Bendita Acessórios',
    tipo: 'Loja virtual',
    nicho: 'Semijoias e acessórios',
    de: 'Cliente',
    texto: 'Vitrine editorial de semijoias, com guia para a cliente descobrir o tamanho do aro em casa antes de comprar o anel.',
    url: 'https://benditaacessorios.com',
    dominio: 'benditaacessorios.com',
    desktop: 'bendita-desktop',
    celulares: ['bendita-celular'],
  },
  {
    id: 'cmms',
    nome: 'Maintor CMMS',
    tipo: 'Sistema por assinatura',
    nicho: 'Indústria · manutenção',
    de: 'Produto nosso',
    texto: 'Ordens de serviço, histórico de cada máquina, estoque de peças e um copiloto de manutenção com inteligência artificial. Telas da conta de demonstração.',
    url: 'https://maintor.com.br',
    dominio: 'maintor.com.br',
    desktop: 'cmms-os',
    desktops: ['cmms-os', 'cmms-ativo', 'cmms-copiloto', 'cmms-estoque'],
    celulares: ['cmms-site-celular'],
    app: true,
  },
  {
    id: 'fit',
    nome: 'Maintor FIT',
    tipo: 'App por assinatura',
    nicho: 'Personal e nutricionista',
    de: 'Produto nosso',
    texto: 'O app de treino e dieta com a marca do profissional: painel do personal, treino do aluno, plano alimentar e mensalidade que se cobra sozinha.',
    url: 'https://maintorfit.com',
    dominio: 'maintorfit.com',
    desktop: 'fit-site-desktop',
    celulares: ['fit-painel', 'fit-treino', 'fit-dieta'],
    extra: { href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'Quero um app assim no meu nome' },
  },
]

/* troca a imagem a cada poucos segundos, só quando visível e sem pedido de movimento reduzido */
function useRodizio(n, visivel, ms = 2600) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (n < 2 || !visivel || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((v) => (v + 1) % n), ms)
    return () => clearInterval(id)
  }, [n, visivel, ms])
  return i
}

function useVisivel(ref) {
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return v
}

function Telas({ nomes, largura, altura, sizes, alt, visivel }) {
  const i = useRodizio(nomes.length, visivel)
  return nomes.map((n, k) => (
    <img
      key={n}
      className={k === i ? 'ativa' : ''}
      src={`${P}${n}-${largura}.webp`}
      srcSet={largura === 390 ? undefined : `${P}${n}-720.webp 720w, ${P}${n}-1280.webp 1280w`}
      sizes={sizes}
      width={largura === 390 ? 390 : 1280}
      height={altura}
      alt={k === 0 ? alt : ''}
      aria-hidden={k === 0 ? undefined : 'true'}
      loading="lazy"
      decoding="async"
    />
  ))
}

function Projeto({ t, idx }) {
  const ref = useRef(null)
  const visivel = useVisivel(ref)
  const desks = t.desktops || [t.desktop]
  return (
    <article className={`trabalho${idx % 2 ? ' inverso' : ''}`} ref={ref} data-reveal>
      <div className="trabalho-palco">
        <div className="tela-desktop">
          <div className="browser-bar">
            <span className="bolinha" /><span className="bolinha" /><span className="bolinha" />
            <span className="url">{t.app ? 'app · ' + t.dominio : t.dominio}</span>
          </div>
          <div className="tela-janela">
            <Telas nomes={desks} largura={720} altura={t.app ? 800 : 800} sizes="(max-width: 900px) 92vw, 760px"
              alt={`${t.nome} — ${t.app ? 'tela do sistema (conta de demonstração)' : 'página inicial no ar'}`} visivel={visivel} />
          </div>
        </div>
        <div className="tela-celular">
          <div className="tela-janela">
            <Telas nomes={t.celulares} largura={390} altura={844} sizes="180px"
              alt={`${t.nome} no celular`} visivel={visivel} />
          </div>
        </div>
      </div>
      <div className="trabalho-texto">
        <div className="trabalho-tags">
          <span className="micro">{t.tipo}</span>
          <span className="trabalho-de">{t.de}</span>
        </div>
        <h3 className="serif">{t.nome}</h3>
        <p className="trabalho-nicho">{t.nicho}</p>
        <p>{t.texto}</p>
        <div className="trabalho-links">
          <a className="btn btn-fino" href={t.url} target="_blank" rel="noopener">Abrir no ar ↗</a>
          {t.extra && <a className="link-mostarda" href={t.extra.href}>{t.extra.rotulo} →</a>}
        </div>
      </div>
    </article>
  )
}

export default function Trabalhos() {
  return (
    <div className="trabalhos-lista">
      {TRABALHOS.map((t, i) => <Projeto t={t} idx={i} key={t.id} />)}
    </div>
  )
}
