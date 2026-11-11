/* ================================================================
   AS OBRAS DA EXPOSIÇÃO — uma por quadro do corredor.

   10/11/2026 — a home virou portfólio comercial (o link vai pelo WhatsApp
   para quem ainda não conhece a Flow). Ordem: Ala 01 trabalhos no ar
   (primeiro os projetos de clientes, depois os produtos da Maintor) →
   Ala 02 soluções por necessidade (7 portas) → Ala 03 sistemas → Ala 04
   marketing.

   Cada ala (seção da home) tem as suas obras, na ordem em que o visitante
   as encontra. A imagem é o quadro em 3D; o resto vira a legenda em HTML
   (acessível, indexável, no prerender). Sem 3D a imagem aparece na legenda.

   Campos de uma obra:
   · selo      linha curta acima do título (grupo ou caminho)
   · objetivo  nas portas: o objetivo do visitante (vira o selo)
   · titulo    nome do projeto (ou a frase do visitante, nas portas)
   · categoria o tipo de projeto, logo abaixo do título
   · texto     descrição curta
   · acao      o botão principal { href, rotulo, externo }
   · mais      links secundários [{ href, rotulo, externo }]
   · nota      aviso pequeno sobre a imagem (ilustrativa, demonstração…)
   · assunto   o que entra na mensagem do WhatsApp ("quero conversar sobre …")

   Regras da casa: só trabalho real e no ar; cliente só com autorização
   (VOKE, Bendita, Besten); apps com telas de demonstração; nenhum preço
   da Flow (decisão de 28/10). Foto de ambiente leva a nota de imagem
   ilustrativa — não é trabalho entregue.
   ================================================================ */

const P = '/midia/portfolio/'
const F = '/midia/fotos/'
const S = '/midia/social/'

/* versão HD de cada imagem para o quadro em 3D (05/11): prints dos sites em 1920 px
   (capturados em 2x) e fotos em 960 px. RH e Task só existem na resolução da captura. */
const COM_HD = ['techtrainer-site', 'bendita-desktop', 'besten-kpis', 'cmms-painel', 'fit-site-desktop', 'horaqui-site', 'voke-desktop', 'cmms-os', 'cmms-copiloto', 'besten-biblioteca', 'besten-onboarding']
export function imagemHD(img) {
  const m = img.match(/\/midia\/portfolio\/(.+)-720\.webp$/)
  if (m) return COM_HD.includes(m[1]) ? img.replace('-720.webp', '-1920.webp') : img.replace('-720.webp', '-1280.webp')
  return img.replace(/-640\.webp$/, '-960.webp')
}

const ILUSTRATIVA = 'Imagem ilustrativa do tipo de negócio, não é um projeto entregue.'

/* Ala 01 em dois grupos com título visível. O id do grupo é âncora pública
   (/#projetos-clientes leva direto aos clientes). */
export const GRUPOS = {
  clientes: { id: 'projetos-clientes', titulo: 'Projetos para clientes', lead: 'Lojas e sites que desenvolvemos para empresas que já estão no ar.' },
  produtos: { id: 'produtos-maintor', titulo: 'Produtos da Maintor', lead: 'Sistemas e aplicativos que a Maintor criou e mantém, oferecidos por assinatura.' },
}

export const ALAS = [
  {
    id: 'trabalhos',
    eyebrow: 'Ala 01 · Trabalhos no ar',
    contagem: '9 projetos',
    titulo: 'Projetos que você pode abrir e conhecer',
    lead: 'Conheça projetos que desenvolvemos para clientes e produtos criados pela Maintor. Abra uma loja, veja as telas de um sistema ou teste uma demonstração.',
    obras: [
      {
        id: 'voke', grupo: 'clientes', selo: 'Projeto para cliente', titulo: 'VOKE WEAR', categoria: 'Loja virtual para moda fitness',
        texto: 'Loja de moda fitness com estoque por tamanho, cálculo de frete pelo CEP e aviso de reposição. A equipe gerencia os produtos em um painel próprio.',
        img: P + 'voke-desktop-720.webp', w: 5.4,
        acao: { href: '/casos/voke-wear/', rotulo: 'Ver case' },
        mais: [{ href: 'https://vokewear.com.br', rotulo: 'Visitar loja', externo: true }],
        assunto: 'uma loja virtual parecida com a VOKE WEAR',
      },
      {
        id: 'bendita', grupo: 'clientes', selo: 'Projeto para cliente', titulo: 'Bendita Acessórios', categoria: 'Loja virtual para semijoias',
        texto: 'Loja virtual de semijoias com um guia para a cliente descobrir o tamanho do anel em casa antes da compra.',
        img: P + 'bendita-desktop-720.webp', w: 5.4,
        acao: { href: 'https://benditaacessorios.com', rotulo: 'Visitar loja', externo: true },
        mais: [{ href: 'https://benditaacessorios.com/descubra-seu-aro', rotulo: 'Ver o guia de aro', externo: true }, { href: '#obra-m-video', rotulo: 'Ver o comercial da marca' }],
        assunto: 'uma loja virtual parecida com a da Bendita Acessórios',
      },
      {
        id: 'besten', grupo: 'clientes', selo: 'Projeto para cliente', titulo: 'Besten Consultoria', categoria: 'Site institucional e portal interno',
        texto: 'Site institucional e portal que reúne indicadores dos projetos, tarefas da equipe, materiais e trilha de integração dos consultores.',
        img: P + 'besten-kpis-720.webp', w: 5.4,
        nota: 'Na imagem, uma tela do portal interno com os nomes dos projetos desfocados. O portal é de uso da equipe e exige login.',
        acao: { href: 'https://besten-site.vercel.app', rotulo: 'Visitar site institucional', externo: true },
        assunto: 'um site com portal interno parecido com o da Besten Consultoria',
      },
      {
        id: 'techtrainer', grupo: 'clientes', selo: 'Projeto para cliente', titulo: 'Studio TechTrainer', categoria: 'Site com agendamento online para studio de personal',
        texto: 'Site de studio de personal com agendamento online da aula experimental, quiz que indica o formato de treino, vídeos de exercícios gravados no Studio e um vídeo que mostra o caminho até a sala.',
        img: P + 'techtrainer-site-720.webp', w: 5.4,
        acao: { href: 'https://studiotechtrainer.com.br', rotulo: 'Visitar site', externo: true },
        mais: [{ href: '#obra-m-video', rotulo: 'Ver o vídeo de como chegar' }],
        assunto: 'um site com agendamento online como o do Studio TechTrainer',
      },
      {
        id: 'cmms', grupo: 'produtos', selo: 'Produto da Maintor', titulo: 'Maintor CMMS', categoria: 'Sistema de gestão de manutenção',
        texto: 'Sistema para acompanhar ordens de serviço, programar manutenções preventivas e consultar o histórico das máquinas e o estoque de peças.',
        img: P + 'cmms-painel-720.webp', w: 5.4,
        acao: { href: 'https://maintor.com.br', rotulo: 'Conhecer o sistema', externo: true },
        assunto: 'um sistema de manutenção como o Maintor CMMS',
      },
      {
        id: 'fit', grupo: 'produtos', selo: 'Produto da Maintor', titulo: 'Maintor FIT', categoria: 'Aplicativo de treino e alimentação',
        texto: 'Aplicativo de treino e alimentação com a marca do profissional, painel de acompanhamento para personal trainers e nutricionistas e área para os alunos.',
        img: P + 'fit-site-desktop-720.webp', w: 5.4,
        acao: { href: 'https://maintorfit.com', rotulo: 'Conhecer o Maintor FIT', externo: true },
        mais: [{ href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'Quero um app com minha marca' }],
        assunto: 'um aplicativo com a minha marca, como o Maintor FIT',
      },
      {
        id: 'horaqui', grupo: 'produtos', selo: 'Produto da Maintor', titulo: 'Horaqui', categoria: 'Agenda online',
        texto: 'Agenda online para negócios que atendem com hora marcada. O cliente escolhe o serviço, o profissional e o horário pelo link de agendamento.',
        img: P + 'horaqui-site-720.webp', w: 5.4,
        acao: { href: 'https://www.horaqui.com.br/demo', rotulo: 'Testar agendamento', externo: true },
        mais: [{ href: 'https://www.horaqui.com.br', rotulo: 'Conhecer o Horaqui', externo: true }],
        assunto: 'uma agenda online como o Horaqui',
      },
      {
        id: 'rh', grupo: 'produtos', selo: 'Produto da Maintor', titulo: 'Maintor RH', categoria: 'Sistema de gestão de pessoas',
        texto: 'Sistema de gestão de pessoas que reúne documentos, ponto, férias e recrutamento, com relatórios para acompanhar a equipe.',
        img: P + 'rh-relatorios-720.webp', w: 5.4,
        nota: 'Telas de uma empresa de demonstração.',
        acao: { href: 'https://maintor-rh.base44.app', rotulo: 'Conhecer o Maintor RH', externo: true },
        assunto: 'um sistema de RH como o Maintor RH',
      },
      {
        id: 'task', grupo: 'produtos', selo: 'Produto da Maintor', titulo: 'Maintor Task', categoria: 'Sistema de processos e qualidade',
        texto: 'Sistema para acompanhar o planejado e o executado, registrar evidências e tratar não conformidades.',
        img: P + 'task-indicadores-720.webp', w: 5.4,
        nota: 'Telas de uma empresa de demonstração.',
        acao: { href: 'https://maintor-task.base44.app', rotulo: 'Conhecer o Maintor Task', externo: true },
        assunto: 'um sistema de processos como o Maintor Task',
      },
    ],
  },
  {
    id: 'problemas',
    eyebrow: 'Ala 02 · Soluções por necessidade',
    contagem: '7 portas',
    titulo: 'O que você precisa resolver hoje?',
    lead: 'Escolha uma situação parecida com a sua e veja o que podemos construir.',
    /* cada porta: objetivo → frase do visitante → o que a Flow oferece → serviço e projeto relacionado.
       `placa` é o nome curto pintado na placa da porta em 3D (cabe numa linha). */
    obras: [
      {
        id: 'p-loja', objetivo: 'Vender online', placa: 'Vender online',
        titulo: '“Vendo pelo direct e perco tempo respondendo sobre tamanho, pagamento e frete.”',
        texto: 'Loja virtual com catálogo, meios de pagamento, cálculo de frete e painel de gestão.',
        img: F + 'loja-moda-640.webp', foto: 'loja-moda', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/loja-virtual/', rotulo: 'Ver loja virtual' },
        mais: [{ href: '#obra-voke', rotulo: 'Projeto: VOKE WEAR' }, { href: '#obra-bendita', rotulo: 'Projeto: Bendita' }],
        assunto: 'vender online',
      },
      {
        id: 'p-site', objetivo: 'Apresentar minha empresa', placa: 'Minha empresa',
        titulo: '“Quando alguém pede meu site, eu só tenho o Instagram ou um PDF para enviar.”',
        texto: 'Site institucional com serviços, projetos e um caminho claro para solicitar contato.',
        img: F + 'fachada-loja-640.webp', foto: 'fachada-loja', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/sites/', rotulo: 'Ver sites institucionais' },
        mais: [{ href: '#obra-besten', rotulo: 'Projeto: Besten Consultoria' }],
        assunto: 'um site para apresentar minha empresa',
      },
      {
        id: 'p-atend', objetivo: 'Automatizar o atendimento', placa: 'Atendimento',
        titulo: '“Respondo as mesmas perguntas no WhatsApp o dia inteiro.”',
        texto: 'Automação para perguntas frequentes, confirmação de pedidos e encaminhamento para a equipe quando necessário.',
        img: F + 'balcao-pedidos-640.webp', foto: 'balcao-pedidos', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/automacao-de-atendimento/', rotulo: 'Ver automação de atendimento' },
        assunto: 'automatizar o atendimento',
      },
      {
        id: 'p-manut', objetivo: 'Organizar a manutenção', placa: 'Manutenção',
        titulo: '“As ordens de serviço e o histórico das máquinas ficam espalhados em planilhas e cadernos.”',
        texto: 'Sistema com ordens de serviço, preventivas e histórico dos ativos.',
        img: F + 'manutencao-oficina-640.webp', foto: 'manutencao-oficina', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/sistemas-sob-medida/#manutencao', rotulo: 'Ver sistemas de manutenção' },
        mais: [{ href: '#obra-cmms', rotulo: 'Projeto: Maintor CMMS' }],
        assunto: 'organizar a manutenção',
      },
      {
        id: 'p-rh', objetivo: 'Digitalizar o RH', placa: 'RH',
        titulo: '“Perco tempo procurando documentos e conferindo ponto e férias em arquivos diferentes.”',
        texto: 'Centralizar rotinas e informações do RH em um sistema.',
        img: F + 'rh-papelada-640.webp', foto: 'rh-papelada', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/sistemas-sob-medida/#rh', rotulo: 'Ver sistemas de RH' },
        mais: [{ href: '#obra-rh', rotulo: 'Projeto: Maintor RH' }],
        assunto: 'digitalizar o RH',
      },
      {
        id: 'p-mkt', objetivo: 'Atrair novos clientes', placa: 'Novos clientes',
        titulo: '“Faço posts e anúncios, mas é difícil entender o que vira contato.”',
        texto: 'Conectar conteúdo, vídeos e campanhas a uma página, loja ou canal de atendimento.',
        img: F + 'estudio-conteudo-640.webp', foto: 'estudio-conteudo', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '#marketing', rotulo: 'Ver marketing' },
        mais: [{ href: '/marketing-e-redes/', rotulo: 'Página de marketing' }],
        assunto: 'atrair novos clientes',
      },
      {
        id: 'p-cons', objetivo: 'Digitalizar minha consultoria', placa: 'Consultoria',
        titulo: '“Preciso reunir indicadores, tarefas e materiais dos projetos em um só lugar.”',
        texto: 'Portal com indicadores, acompanhamento de projetos e materiais para a equipe. Se o objetivo for comercializar o seu método como software, veja a Ala 03.',
        img: F + 'consultoria-portal-640.webp', foto: 'consultoria-portal', w: 4.6,
        nota: 'Na imagem, o portal da Besten Consultoria, com os nomes dos projetos desfocados.',
        acao: { href: '/para-consultorias/', rotulo: 'Ver para consultorias' },
        mais: [{ href: '#obra-besten', rotulo: 'Projeto: Besten Consultoria' }, { href: '#sistemas', rotulo: 'Ala 03: software com sua marca' }],
        assunto: 'digitalizar minha consultoria',
      },
    ],
  },
  {
    id: 'sistemas',
    eyebrow: 'Ala 03 · Sistemas',
    contagem: '2 caminhos',
    titulo: 'Sistemas para sua operação ou para vender com sua marca',
    lead: 'Escolha o caminho que faz sentido para você. Podemos desenvolver um sistema para organizar o trabalho da sua equipe ou criar um software para você oferecer aos seus clientes.',
    obras: [
      {
        id: 's-oficio', selo: 'Caminho 1', titulo: 'Sistema para minha operação', categoria: 'Manutenção, RH, processos e portais internos',
        texto: 'Desenvolvemos um sistema em torno do seu processo, com os controles, indicadores e permissões de que sua equipe precisa. Referências: Maintor CMMS, Maintor RH, Maintor Task e o portal da Besten.',
        img: P + 'task-relatorios-720.webp', w: 5.4,
        nota: 'Na imagem, relatórios do Maintor Task com dados de demonstração.',
        acao: { href: '/sistemas-sob-medida/', rotulo: 'Conhecer sistemas sob medida' },
        assunto: 'um sistema para a minha operação',
      },
      {
        id: 's-revender', selo: 'Caminho 2', titulo: 'Software com minha marca', categoria: 'Para oferecer aos seus clientes',
        texto: 'Transforme seu método ou a rotina do seu nicho em um aplicativo que você pode oferecer aos seus clientes com a sua marca. Referência: o Maintor FIT, app de treino com a marca do profissional. A mesma ideia pode servir a salões, consultorias e outros nichos.',
        img: F + 'personal-app-640.webp', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/sistema-para-revender/', rotulo: 'Entender como lançar meu software' },
        mais: [{ href: '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/', rotulo: 'Guia do modelo comercial' }],
        assunto: 'lançar um software com a minha marca',
      },
    ],
  },
  {
    id: 'marketing',
    eyebrow: 'Ala 04 · Marketing',
    contagem: '3 frentes',
    titulo: 'Conteúdo, vídeos e campanhas para divulgar seu negócio',
    lead: 'Criamos materiais para apresentar seu produto e direcionar o público para sua loja, seu site ou seu canal de atendimento.',
    obras: [
      {
        id: 'm-conteudo', selo: 'Marketing', titulo: 'Conteúdo e redes',
        texto: 'Planejamento, artes, legendas e publicação para apresentar sua marca e manter uma rotina de conteúdo.',
        img: S + 'post-24.jpg', w: 4.2,
        /* amostra: três peças autorais do perfil da própria Flow, cada uma com o objetivo dela */
        amostras: [
          { img: S + 'post-24.jpg', alt: 'Post da Maintor Flow: “Respondo as mesmas perguntas o dia inteiro.”', legenda: 'Apresenta uma dor comum e leva à página de automação.' },
          { img: S + 'post-25.jpg', alt: 'Post da Maintor Flow: “A manutenção das máquinas vive num caderno.”', legenda: 'Apresenta o Maintor CMMS a quem cuida de manutenção.' },
          { img: S + 'post-13.jpg', alt: 'Post da Maintor Flow: “Restam 3 no tamanho G”, com a tela real da loja VOKE WEAR', legenda: 'Mostra a loja da VOKE funcionando e leva ao case.' },
        ],
        nota: 'Amostra: peças autorais do perfil @maintorflow, a própria marca da Flow.',
        acao: { href: '/marketing-e-redes/', rotulo: 'Ver conteúdo e redes' },
        assunto: 'conteúdo e redes sociais',
      },
      {
        id: 'm-trafego', selo: 'Marketing', titulo: 'Tráfego pago',
        texto: 'Campanhas no Google e na Meta com criativos, página de destino e acompanhamento da ação que interessa ao negócio.',
        img: F + 'fachada-loja-640.webp', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/trafego-pago/', rotulo: 'Ver tráfego pago' },
        assunto: 'tráfego pago',
      },
      {
        id: 'm-video', selo: 'Marketing', titulo: 'Vídeos personalizados',
        texto: 'Reels, vídeos de produto e comerciais personalizados, do roteiro à entrega.',
        img: '/midia/video/techtrainer-como-chegar-capa.webp', w: 2.9,
        /* 10/11: dois vídeos feitos pela Flow para clientes. Só a capa carrega; o vídeo baixa e toca
           quando o visitante clica (abre num player em janela) */
        videos: [
          {
            src: '/midia/video/techtrainer-como-chegar.mp4', capa: '/midia/video/techtrainer-como-chegar-capa.webp',
            titulo: 'Studio TechTrainer · Como chegar', duracao: '1min54',
            legenda: 'Feito para o site do Studio: o caminho da rua até a sala 11, com legendas e chamada para a aula experimental.',
          },
          {
            src: '/midia/video/bendita-comercial.mp4', capa: '/midia/video/bendita-comercial-capa.webp',
            titulo: 'Bendita Acessórios · comercial', duracao: '12 s',
            legenda: 'Comercial de produto para a marca, com cenas criadas com inteligência artificial.',
          },
        ],
        nota: 'Vídeos feitos pela Maintor Flow para clientes.',
        acao: { href: '/videos-personalizados/', rotulo: 'Ver vídeos personalizados' },
        assunto: 'vídeos personalizados',
      },
    ],
  },
]

/* As portas da Ala 02 (saguão): os mesmos dados das obras, no formato da sala e do 3D. */
export const PORTAS = ALAS.find((a) => a.id === 'problemas').obras.map((o) => ({
  ...o,
  obra: o.id,
  frase: o.titulo.replace(/[“”]/g, ''),
  img: `/midia/fotos/${o.foto}-960.webp`,
}))

/* Mensagem do WhatsApp: a conversa chega dizendo de onde veio e o assunto. */
export const msgWhats = (assunto) => `Olá! Vim pelo portfólio da Maintor Flow e quero conversar sobre ${assunto || 'o meu projeto'}.`
