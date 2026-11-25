/* ================================================================
   MENU DO SITE (15/11/2026) — uma fonte só para a home e para todas as
   páginas internas.

   Antes: a home tinha cinco âncoras e cada página interna um menu
   próprio de dois links ("Início" + um vizinho). Quem entrava por uma
   página de serviço não via o resto do que a Flow constrói, e guias,
   trilha, case e páginas de nicho só eram achados pelo rodapé.

   Agora: quatro grupos + Contato, iguais em todo lugar. Cada grupo abre
   o mesmo painel, com tudo o que existe no site:
   · Projetos       o tour — os 12 trabalhos no ar, por tipo, e o case
   · O que fazemos  cada coisa que a gente constrói, pelo objetivo de quem compra
   · Marketing      as três frentes de divulgação
   · Guias          o que ler antes de decidir, e como é trabalhar com a gente

   Quem usa: src/App.jsx (home, em React) e menu-paginas.js (plugin do
   Vite, que escreve o mesmo cabeçalho em cada página interna no build).
   Os endereços são sempre absolutos ("/#trabalhos"); a home tira a barra
   para a rolagem suave funcionar.
   ================================================================ */

export const WHATS_NUMERO = '5511946610634'

export const MENU = [
  {
    id: 'projetos', rotulo: 'Projetos', href: '/#trabalhos',
    titulo: 'O tour pelos projetos no ar',
    colunas: [
      {
        // 25/11: o tour abre com os projetos de site + gestão (Matuura, TRDD, Besten)
        titulo: 'Site com gestão', href: '/#site-e-gestao',
        links: [
          { href: '/#trabalhos', rotulo: 'Começar o tour', nota: 'Os projetos selecionados, um a um' },
          { href: '/#obra-matuura', rotulo: 'Matuura Seguros', nota: 'Corretora: site, central e área do cliente' },
          { href: '/#obra-trdd', rotulo: 'TRDD Records', nota: 'Gravadora: site e painel da equipe' },
          { href: '/#obra-besten', rotulo: 'Besten Consultoria', nota: 'Site e portal interno' },
        ],
      },
      {
        titulo: 'Lojas virtuais', href: '/#lojas-virtuais',
        links: [
          { href: '/casos/voke-wear/', rotulo: 'Case VOKE WEAR', nota: 'A loja por dentro, do pedido à entrega' },
          { href: '/#obra-voke', rotulo: 'VOKE WEAR', nota: 'Moda fitness' },
          { href: '/#obra-bendita', rotulo: 'Bendita Acessórios', nota: 'Semijoias' },
        ],
      },
      {
        titulo: 'Sites que geram contato', href: '/#sites',
        links: [
          { href: '/#obra-techtrainer', rotulo: 'Studio TechTrainer', nota: 'Studio de personal, com agendamento' },
          { href: '/#obra-ao', rotulo: 'Alves & Oliveira', nota: 'Clínica odontológica' },
        ],
      },
      {
        titulo: 'Sistemas e aplicativos', href: '/#sistemas-e-aplicativos',
        links: [
          { href: '/#obra-sorria', rotulo: 'SorrIA', nota: 'Clínicas odontológicas' },
          { href: '/#obra-cmms', rotulo: 'Maintor CMMS', nota: 'Manutenção' },
        ],
      },
    ],
  },
  {
    id: 'fazemos', rotulo: 'O que fazemos', href: '/#problemas',
    titulo: 'O que a gente constrói',
    colunas: [
      {
        titulo: 'Para vender', href: '/#obra-p-loja',
        links: [
          { href: '/loja-virtual/', rotulo: 'Loja virtual', nota: 'Catálogo, Pix, cartão e frete' },
          { href: '/loja-no-instagram/', rotulo: 'Loja no Instagram', nota: 'Produtos marcados nos posts' },
          { href: '/loja-virtual-moda-fitness/', rotulo: 'Loja de moda fitness', nota: 'Para marcas do nicho' },
        ],
      },
      {
        titulo: 'Para se apresentar e atender', href: '/#obra-p-site',
        links: [
          { href: '/sites/', rotulo: 'Site institucional', nota: 'Rápido no celular, com caminho até o contato' },
          { href: '/site-para-clinica-odontologica/', rotulo: 'Site para clínica odontológica', nota: 'O primeiro atendimento da clínica' },
          { href: '/automacao-de-atendimento/', rotulo: 'Automação de atendimento', nota: 'WhatsApp e e-mail respondendo' },
        ],
      },
      {
        titulo: 'Para organizar a operação', href: '/#sistemas',
        links: [
          { href: '/sistemas-sob-medida/', rotulo: 'Sistemas sob medida', nota: 'Manutenção, RH, processos' },
          { href: '/para-consultorias/', rotulo: 'Para consultorias', nota: 'Portal e sistema para os seus clientes' },
          { href: '/manutencao-mensal/', rotulo: 'Manutenção mensal', nota: 'Cuidar do projeto depois da entrega' },
        ],
      },
      {
        titulo: 'Para vender com a sua marca', href: '/#obra-s-revender',
        links: [
          { href: '/sistema-para-revender/', rotulo: 'Software com a sua marca', nota: 'O seu método vira um sistema' },
          { href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'App para personal trainer', nota: 'Treino no seu nome' },
          { href: '/sistema-para-revender/sistema-para-salao-de-beleza/', rotulo: 'Sistema para salão de beleza', nota: 'Agenda, lembrete e caixa' },
        ],
      },
    ],
  },
  {
    id: 'marketing', rotulo: 'Marketing', href: '/#marketing',
    titulo: 'Divulgação que leva até o contato',
    colunas: [
      {
        titulo: 'As três frentes', href: '/#marketing',
        links: [
          { href: '/marketing-e-redes/', rotulo: 'Conteúdo e redes', nota: 'Planejamento, artes e publicação' },
          { href: '/trafego-pago/', rotulo: 'Tráfego pago', nota: 'Google e Meta, com página de destino' },
          { href: '/videos-personalizados/', rotulo: 'Vídeos personalizados', nota: 'Reels, produto e comerciais' },
        ],
      },
      {
        titulo: 'Veja no tour',
        links: [
          { href: '/#obra-m-conteudo', rotulo: 'Posts do @maintorflow', nota: 'Peças autorais' },
          { href: '/#obra-m-video', rotulo: 'Vídeos de clientes', nota: 'Studio TechTrainer e Bendita' },
        ],
      },
    ],
  },
  {
    id: 'guias', rotulo: 'Guias', href: '/guias/',
    titulo: 'Para decidir antes de gastar',
    colunas: [
      {
        titulo: 'Por onde começar',
        links: [
          { href: '/por-onde-comecar/', rotulo: 'Seu negócio na internet, na ordem certa', nota: 'Em que etapa você está' },
          { href: '/guias/', rotulo: 'Todos os guias', nota: 'Leitura curta, sem venda no meio' },
        ],
      },
      {
        titulo: 'Guias',
        links: [
          { href: '/guias/quanto-custa-uma-loja-virtual/', rotulo: 'Quanto custa uma loja virtual', nota: 'A conta aberta' },
          { href: '/guias/loja-propria-ou-plataforma-pronta/', rotulo: 'Loja própria ou plataforma pronta', nota: 'A conta de dois anos' },
          { href: '/guias/se-o-desenvolvedor-sumir/', rotulo: 'E se o desenvolvedor sumir?', nota: 'O que fica no seu nome' },
          { href: '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/', rotulo: 'Ganhar com um sistema do seu nicho', nota: 'Preço e primeiros clientes' },
        ],
      },
      {
        titulo: 'Como é trabalhar com a gente',
        links: [
          { href: '/#como', rotulo: 'Como trabalhamos', nota: 'Da conversa à entrega' },
          { href: '/#perguntas', rotulo: 'Perguntas frequentes', nota: 'Valores, prazos e condições' },
        ],
      },
    ],
  },
]

export const MENU_CONTATO = { href: '/#contato', rotulo: 'Contato' }

/* O PRÓXIMO PASSO de cada página interna: os projetos do tour que mostram aquilo funcionando e a página que
   costuma vir depois. Entra no fim de cada página (menu-paginas.js) — ninguém fica num beco sem saída. */
// 26/11: maktub, horaqui, fit, rh e task saíram do tour (seleção): o link vai para o site do projeto
const P = {
  voke: { href: '/#obra-voke', rotulo: 'VOKE WEAR' }, maktub: { href: 'https://www.maktubconquista.com.br', rotulo: 'Maktub Conquista' }, bendita: { href: '/#obra-bendita', rotulo: 'Bendita Acessórios' },
  techtrainer: { href: '/#obra-techtrainer', rotulo: 'Studio TechTrainer' }, ao: { href: '/#obra-ao', rotulo: 'Alves & Oliveira' }, besten: { href: '/#obra-besten', rotulo: 'Besten Consultoria' },
  horaqui: { href: 'https://www.horaqui.com.br', rotulo: 'Horaqui' }, sorria: { href: '/#obra-sorria', rotulo: 'SorrIA' }, fit: { href: 'https://maintorfit.com', rotulo: 'Maintor FIT' },
  cmms: { href: '/#obra-cmms', rotulo: 'Maintor CMMS' }, rh: { href: 'https://maintor-rh.base44.app', rotulo: 'Maintor RH' }, task: { href: 'https://maintor-task.base44.app', rotulo: 'Maintor Task' },
  posts: { href: '/#obra-m-conteudo', rotulo: 'Posts do @maintorflow' }, videos: { href: '/#obra-m-video', rotulo: 'Vídeos de clientes' }, destino: { href: '/#obra-m-trafego', rotulo: 'Página de destino' },
}
export const TRILHAS = {
  '/loja-virtual/': { projetos: [P.voke, P.maktub, P.bendita], depois: { href: '/guias/quanto-custa-uma-loja-virtual/', rotulo: 'O que pesa no valor de uma loja' } },
  '/loja-no-instagram/': { projetos: [P.voke, P.maktub, P.bendita], depois: { href: '/loja-virtual/', rotulo: 'A loja virtual completa' } },
  '/loja-virtual-moda-fitness/': { projetos: [P.voke], depois: { href: '/casos/voke-wear/', rotulo: 'O case da VOKE WEAR' } },
  '/casos/voke-wear/': { projetos: [P.voke, P.maktub, P.bendita], depois: { href: '/loja-virtual/', rotulo: 'Como fica a sua loja' } },
  '/sites/': { projetos: [P.techtrainer, P.ao, P.besten], depois: { href: '/automacao-de-atendimento/', rotulo: 'Automatizar o atendimento' } },
  '/site-para-clinica-odontologica/': { projetos: [P.ao, P.sorria, P.horaqui], depois: { href: '/sites/', rotulo: 'Como fica um site institucional' } },
  '/automacao-de-atendimento/': { projetos: [P.techtrainer, P.horaqui], depois: { href: '/marketing-e-redes/', rotulo: 'Atrair mais contatos' } },
  '/sistemas-sob-medida/': { projetos: [P.cmms, P.rh, P.task, P.sorria], depois: { href: '/sistema-para-revender/', rotulo: 'Vender um sistema com a sua marca' } },
  '/para-consultorias/': { projetos: [P.besten, P.task], depois: { href: '/sistema-para-revender/', rotulo: 'Software com a sua marca' } },
  '/sistema-para-revender/': { projetos: [P.fit, P.horaqui, P.sorria], depois: { href: '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/', rotulo: 'O guia do modelo comercial' } },
  '/sistema-para-revender/app-para-personal-trainer/': { projetos: [P.fit, P.techtrainer], depois: { href: '/sistema-para-revender/', rotulo: 'Como funciona o software com a sua marca' } },
  '/sistema-para-revender/sistema-para-salao-de-beleza/': { projetos: [P.horaqui, P.fit], depois: { href: '/sistema-para-revender/', rotulo: 'Como funciona o software com a sua marca' } },
  '/manutencao-mensal/': { projetos: [P.voke, P.techtrainer], depois: { href: '/guias/se-o-desenvolvedor-sumir/', rotulo: 'O que precisa ficar no seu nome' } },
  '/marketing-e-redes/': { projetos: [P.posts, P.videos], depois: { href: '/trafego-pago/', rotulo: 'Quando vale anunciar' } },
  '/trafego-pago/': { projetos: [P.destino, P.posts], depois: { href: '/videos-personalizados/', rotulo: 'Vídeos para os anúncios' } },
  '/videos-personalizados/': { projetos: [P.videos, P.posts], depois: { href: '/marketing-e-redes/', rotulo: 'Conteúdo e redes' } },
  '/por-onde-comecar/': { projetos: [P.voke, P.techtrainer, P.cmms], depois: { href: '/guias/', rotulo: 'Os guias para decidir' } },
  '/guias/': { projetos: [P.voke, P.maktub, P.techtrainer], depois: { href: '/por-onde-comecar/', rotulo: 'Por onde começar' } },
  '/guias/quanto-custa-uma-loja-virtual/': { projetos: [P.voke, P.maktub, P.bendita], depois: { href: '/loja-virtual/', rotulo: 'Como fica a sua loja' } },
  '/guias/loja-propria-ou-plataforma-pronta/': { projetos: [P.voke, P.maktub, P.bendita], depois: { href: '/loja-virtual/', rotulo: 'Como fica a sua loja' } },
  '/guias/se-o-desenvolvedor-sumir/': { projetos: [P.voke, P.besten], depois: { href: '/manutencao-mensal/', rotulo: 'Manutenção mensal' } },
  '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/': { projetos: [P.fit, P.horaqui], depois: { href: '/sistema-para-revender/', rotulo: 'Software com a sua marca' } },
}
