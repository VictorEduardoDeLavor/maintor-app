import { useEffect, useRef, useState } from 'react'

/* ================================================================
   TRABALHOS NO AR — o site como portfólio (27/10/2026).

   Só entra o que existe e está no ar:
   - prints dos sites capturados em 27/10 por testes/capturar-portfolio.mjs
   - telas dos apps vindas das contas de DEMONSTRAÇÃO (CMMS: empresa fictícia
     Metalúrgica Aurora; FIT: profissional e alunos fictícios) — nada de
     dado de cliente real.
   Cliente só aparece com autorização (VOKE: case público; Bendita: pedido
   do Victor em 22/10; Besten: pedido do Victor em 27/10; Horaqui: produto nosso, 28/10). Maktub e A&O só
   depois do "pode" por escrito.
   Indicadores em primeiro (pedido do Victor, 27/10). Nomes de pessoas e de
   clientes que aparecem nas telas reais foram desfocados antes de salvar;
   RH e Task: empresa de demonstração / colaboradores desfocados.
   ================================================================ */

const P = '/midia/portfolio/'

export const TRABALHOS = [
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
    id: 'besten',
    nome: 'Besten Consultoria',
    tipo: 'Site + portal interno',
    nicho: 'Consultoria de reestruturação',
    de: 'Cliente',
    texto: 'Site institucional e o portal dos consultores: KPIs de todos os projetos em tempo real, tarefas do dia, biblioteca e trilha de onboarding. Nomes de clientes e pessoas desfocados.',
    url: 'https://besten-site.vercel.app',
    dominio: 'portal dos consultores',
    app: true,
    desktop: 'besten-kpis',
    desktops: ['besten-kpis', 'besten-biblioteca', 'besten-onboarding'],
    celulares: ['besten-site-celular'],
  },
  {
    id: 'cmms',
    nome: 'Maintor CMMS',
    tipo: 'Sistema por assinatura',
    nicho: 'Indústria · manutenção',
    de: 'Produto nosso',
    texto: 'Painel com OS abertas, horas de parada e criticidade; ordens de serviço, histórico de cada máquina, estoque de peças e um copiloto de manutenção com inteligência artificial. Telas da conta de demonstração.',
    url: 'https://maintor.com.br',
    dominio: 'maintor.com.br',
    desktop: 'cmms-painel',
    desktops: ['cmms-painel', 'cmms-os', 'cmms-copiloto', 'cmms-ativo', 'cmms-estoque'],
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
    rolagem: 'fit-rolagem', // a landing inteira rolando na moldura (28/10)
    celulares: ['fit-painel', 'fit-financeiro', 'fit-treino', 'fit-dieta'],
    extra: { href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'Quero um app assim no meu nome' },
  },
  {
    id: 'horaqui',
    nome: 'Horaqui',
    tipo: 'App por assinatura',
    nicho: 'Quem atende com hora marcada',
    de: 'Produto nosso',
    texto: 'Agenda online com link da bio: o cliente escolhe serviço, profissional e horário, paga na hora e recebe lembrete. Barbearia, salão, clínica, pet shop, pilates. As páginas de exemplo dá para testar agendando.',
    url: 'https://www.horaqui.com.br',
    dominio: 'horaqui.com.br',
    desktop: 'horaqui-site',
    rolagem: 'horaqui-rolagem',
    celulares: ['horaqui-vila-navalha', 'horaqui-salao', 'horaqui-clinica'],
    extra: { href: 'https://www.horaqui.com.br/demo', rotulo: 'Agendar na demonstração', externo: true },
  },
  {
    id: 'rh',
    nome: 'Maintor RH',
    tipo: 'Sistema por assinatura',
    nicho: 'Gestão de pessoas',
    de: 'Produto nosso',
    texto: 'Relatórios de headcount, folha, recrutamento e demografia; documentos e conformidade, ponto, férias e trilhas. Telas da empresa de demonstração.',
    url: 'https://maintor-rh.base44.app',
    dominio: 'maintor rh',
    app: true,
    desktop: 'rh-relatorios',
    desktops: ['rh-relatorios', 'rh-painel'],
    celulares: [],
    extra: { href: '/sistemas-sob-medida/#rh', rotulo: 'Como funciona' },
  },
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
    id: 'task',
    nome: 'Maintor Task',
    tipo: 'Sistema por assinatura',
    nicho: 'Processos e qualidade',
    de: 'Produto nosso',
    texto: 'Indicadores de processo: planejado × executado, cumprimento no prazo, evidências, não conformidades por origem e causa raiz. Nomes de colaboradores desfocados.',
    url: 'https://maintor-task.base44.app',
    dominio: 'maintor task',
    app: true,
    desktop: 'task-indicadores',
    desktops: ['task-indicadores', 'task-relatorios'],
    celulares: [],
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

/* A landing do projeto rolando sozinha dentro da moldura, como se alguém
   estivesse navegando: desce devagar, segura no fim e volta ao topo.
   Para quando o mouse está em cima (dá para ler) e quando sai da tela;
   sem movimento para quem pede movimento reduzido (fica no topo). */
function Rolagem({ nome, alt, visivel }) {
  const janela = useRef(null)
  const img = useRef(null)
  useEffect(() => {
    const j = janela.current, im = img.current
    if (!j || !im) return
    const medir = () => {
      const d = Math.max(0, im.getBoundingClientRect().height - j.getBoundingClientRect().height)
      j.style.setProperty('--desloc', `-${Math.round(d)}px`)
      // ~110 px por segundo, nunca menos de 18 s
      j.style.setProperty('--dur', `${Math.max(18, Math.round(d / 110))}s`)
    }
    if (im.complete) medir(); else im.addEventListener('load', medir, { once: true })
    const ro = new ResizeObserver(medir); ro.observe(j)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={`tela-rolagem${visivel ? ' rodando' : ''}`} ref={janela}>
      <img
        ref={img}
        src={`${P}${nome}-960.webp`}
        srcSet={`${P}${nome}-640.webp 640w, ${P}${nome}-960.webp 960w`}
        sizes="(max-width: 900px) 92vw, 760px"
        width="960" height="5400" alt={alt} loading="lazy" decoding="async"
      />
    </div>
  )
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
            <span className="url">{t.app && t.dominio.includes('.') ? 'app · ' + t.dominio : t.dominio}</span>
          </div>
          <div className="tela-janela">
            {t.rolagem
              ? <Rolagem nome={t.rolagem} alt={`${t.nome} — o site no ar, rolando`} visivel={visivel} />
              : <Telas nomes={desks} largura={720} altura={t.app ? 800 : 800} sizes="(max-width: 900px) 92vw, 760px"
                  alt={`${t.nome} — ${t.app ? 'tela do sistema (conta de demonstração)' : 'página inicial no ar'}`} visivel={visivel} />}
          </div>
        </div>
        {t.celulares.length > 0 && (
          <div className="tela-celular">
            <div className="tela-janela">
              <Telas nomes={t.celulares} largura={390} altura={844} sizes="180px"
                alt={`${t.nome} no celular`} visivel={visivel} />
            </div>
          </div>
        )}
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
          {t.extra && (t.extra.externo
            ? <a className="link-mostarda" href={t.extra.href} target="_blank" rel="noopener">{t.extra.rotulo} ↗</a>
            : <a className="link-mostarda" href={t.extra.href}>{t.extra.rotulo} →</a>)}
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
