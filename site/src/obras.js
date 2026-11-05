/* ================================================================
   AS OBRAS DA EXPOSIÇÃO (05/11/2026) — uma por quadro do corredor.

   Cada ala (seção da home) tem as suas obras, na ordem em que o visitante
   as encontra. A imagem é o quadro em 3D; o resto vira a legenda em HTML
   (acessível, indexável, no prerender). Sem 3D a imagem aparece na legenda.

   Regras da casa: só trabalho real e no ar; cliente só com autorização
   (VOKE, Bendita, Besten); apps com telas de demonstração; nenhum preço.
   ================================================================ */

const P = '/midia/portfolio/'
const F = '/midia/fotos/'

export const ALAS = [
  {
    id: 'trabalhos',
    eyebrow: 'Ala 01 · Trabalhos no ar',
    titulo: 'Não precisa acreditar. Dá para abrir.',
    lead: 'Lojas de clientes vendendo de verdade e sistemas nossos rodando por assinatura. Cada obra leva ao que está no ar.',
    obras: [
      { id: 'bendita', tag: 'Loja virtual · cliente', titulo: 'Bendita Acessórios', nicho: 'Semijoias e acessórios', texto: 'Vitrine editorial de semijoias, com guia para a cliente descobrir o tamanho do aro em casa antes de comprar o anel.', img: P + 'bendita-desktop-720.webp', w: 5.4, href: 'https://benditaacessorios.com', rotulo: 'Abrir no ar', externo: true },
      { id: 'besten', tag: 'Site + portal · cliente', titulo: 'Besten Consultoria', nicho: 'Consultoria de reestruturação', texto: 'Site institucional e o portal dos consultores: KPIs de todos os projetos em tempo real, tarefas do dia, biblioteca e trilha de onboarding.', img: P + 'besten-kpis-720.webp', w: 5.4, href: 'https://besten-site.vercel.app', rotulo: 'Abrir no ar', externo: true },
      { id: 'cmms', tag: 'Sistema por assinatura · nosso', titulo: 'Maintor CMMS', nicho: 'Indústria · manutenção', texto: 'Painel com OS abertas, horas de parada e criticidade; ordens de serviço, histórico de cada máquina, estoque de peças e um copiloto com inteligência artificial.', img: P + 'cmms-painel-720.webp', w: 5.4, href: 'https://maintor.com.br', rotulo: 'Abrir no ar', externo: true },
      { id: 'fit', tag: 'App por assinatura · nosso', titulo: 'Maintor FIT', nicho: 'Personal e nutricionista', texto: 'O app de treino e dieta com a marca do profissional: painel do personal, treino do aluno, plano alimentar e mensalidade que se cobra sozinha.', img: P + 'fit-site-desktop-720.webp', w: 5.4, href: 'https://maintorfit.com', rotulo: 'Abrir no ar', externo: true, extra: { href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'Quero um app assim no meu nome' } },
      { id: 'horaqui', tag: 'App por assinatura · nosso', titulo: 'Horaqui', nicho: 'Quem atende com hora marcada', texto: 'Agenda online com link da bio: o cliente escolhe serviço, profissional e horário, paga na hora e recebe lembrete. Dá para testar agendando na demonstração.', img: P + 'horaqui-site-720.webp', w: 5.4, href: 'https://www.horaqui.com.br', rotulo: 'Abrir no ar', externo: true, extra: { href: 'https://www.horaqui.com.br/demo', rotulo: 'Agendar na demonstração', externo: true } },
      { id: 'rh', tag: 'Sistema por assinatura · nosso', titulo: 'Maintor RH', nicho: 'Gestão de pessoas', texto: 'Relatórios de headcount, folha, recrutamento e demografia; documentos e conformidade, ponto, férias e trilhas. Telas da empresa de demonstração.', img: P + 'rh-relatorios-720.webp', w: 5.4, href: 'https://maintor-rh.base44.app', rotulo: 'Abrir no ar', externo: true, extra: { href: '/sistemas-sob-medida/#rh', rotulo: 'Como funciona' } },
      { id: 'voke', tag: 'Loja virtual · cliente', titulo: 'VOKE WEAR', nicho: 'Moda fitness feminina', texto: 'Loja própria com Pix com desconto, cartão em 12x, frete pelo CEP, estoque por tamanho e fila de espera. A dona opera tudo por um painel dela.', img: P + 'voke-desktop-720.webp', w: 5.4, href: 'https://vokewear.com.br', rotulo: 'Abrir no ar', externo: true, extra: { href: '/casos/voke-wear/', rotulo: 'Ver o case' } },
      { id: 'task', tag: 'Sistema por assinatura · nosso', titulo: 'Maintor Task', nicho: 'Processos e qualidade', texto: 'Indicadores de processo: planejado × executado, cumprimento no prazo, evidências, não conformidades por origem e causa raiz.', img: P + 'task-indicadores-720.webp', w: 5.4, href: 'https://maintor-task.base44.app', rotulo: 'Abrir no ar', externo: true },
    ],
  },
  {
    id: 'problemas',
    eyebrow: 'Ala 02 · O ponto de partida',
    titulo: 'Tudo começa pelo problema do seu negócio.',
    lead: 'Não tem pacote pronto aqui. A gente escuta onde o seu dia trava e constrói a solução que resolve aquilo — do tamanho do seu negócio, no seu nome.',
    obras: [
      { id: 'p-loja', tag: 'Lojas de moda e varejo', titulo: '“Vendo pelo direct e não dou conta de responder todo mundo.”', texto: 'A gente constrói: uma loja virtual que mostra o tamanho, cobra no Pix e calcula o frete sozinha. Pagamento único, sem mensalidade.', img: F + 'loja-moda-640.webp', w: 4.6, href: '/loja-virtual/', rotulo: 'Ver a loja virtual' },
      { id: 'p-atend', tag: 'Atendimento', titulo: '“Respondo as mesmas perguntas o dia inteiro no WhatsApp.”', texto: 'A gente constrói: automação que responde o que se repete, confirma pedido e só chama você quando precisa de você.', img: F + 'balcao-pedidos-640.webp', w: 4.6, href: '/automacao-de-atendimento/', rotulo: 'Ver a automação' },
      { id: 'p-manut', tag: 'Indústria e manutenção', titulo: '“A manutenção das máquinas vive em caderno e planilha.”', texto: 'A gente constrói: um sistema de ordens de serviço, preventivas e estoque de peças — como o Maintor CMMS, que a gente desenvolveu e mantém.', img: F + 'manutencao-oficina-640.webp', w: 4.6, href: '/sistemas-sob-medida/#manutencao', rotulo: 'Ver o sistema de manutenção' },
      { id: 'p-rh', tag: 'Gestão de pessoas', titulo: '“O RH roda no papel: ponto, férias, folha e admissão.”', texto: 'A gente constrói: um sistema de RH com ponto, férias, folha e recrutamento — como o Maintor RH, que a gente desenvolveu.', img: F + 'rh-papelada-640.webp', w: 4.6, href: '/sistemas-sob-medida/#rh', rotulo: 'Ver o sistema de RH' },
      { id: 'p-mkt', tag: 'Marketing', titulo: '“Posto todo dia, e o cliente novo não chega.”', texto: 'A gente constrói: conteúdo, vídeo personalizado e tráfego pago apontando para uma página que transforma visita em conversa.', img: F + 'estudio-conteudo-640.webp', w: 4.6, href: '/marketing-e-redes/', rotulo: 'Ver o marketing' },
      { id: 'p-cons', tag: 'Consultorias', titulo: '“Meu método vale muito, mas a receita acaba quando o projeto acaba.”', texto: 'A gente constrói: um sistema no nome da sua consultoria. Você implanta nos clientes e cobra implementação e mensalidade — a gente constrói nos bastidores.', img: F + 'consultoria-portal-640.webp', w: 4.6, href: '/para-consultorias/', rotulo: 'Ver para consultorias' },
    ],
  },
  {
    id: 'sistemas',
    eyebrow: 'Ala 03 · O sistema como produto',
    titulo: 'Quando o pronto não serve, a gente constrói — e, se for o seu produto, você vende.',
    lead: 'Software pronto obriga você a trabalhar do jeito dele. Sistema sob medida trabalha do seu. E pode virar o que você vende para os seus colegas.',
    obras: [
      { id: 's-revender', tag: 'Sistema para revender', titulo: 'O que você sabe fazer vira um sistema — e os seus colegas pagam para usar.', texto: 'O personal com o app de treino, a cabeleireira com a agenda do salão: a gente constrói o sistema do seu nicho, no seu nome. A mensalidade é sua.', img: F + 'personal-app-640.webp', w: 4.6, href: '/sistema-para-revender/', rotulo: 'Ver como funciona', extra: { href: '/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/', rotulo: 'Guia: a conta real' } },
      { id: 's-salao', tag: 'Sistema para revender · salão', titulo: 'A agenda do seu salão num sistema seu — e os salões da região pagando para usar.', texto: 'Agendamento, lembrete, caixa do dia e comissão por profissional. Funciona no seu salão; depois você oferece para as colegas.', img: F + 'salao-agenda-640.webp', w: 4.6, href: '/sistema-para-revender/sistema-para-salao-de-beleza/', rotulo: 'Ver o sistema para salão' },
      { id: 's-oficio', tag: 'Sistemas sob medida', titulo: 'O controle que hoje vive no caderno.', texto: 'Manutenção, RH, processos, portaria: cada sistema nosso nasceu de uma dor real de operação e está rodando. O próximo pode ser o do seu negócio.', img: F + 'manutencao-oficina-640.webp', w: 4.6, href: '/sistemas-sob-medida/', rotulo: 'Ver os sistemas sob medida' },
    ],
  },
  {
    id: 'marketing',
    eyebrow: 'Ala 04 · Marketing que traz cliente',
    titulo: 'Ser encontrado dá trabalho. A gente faz.',
    lead: 'Site pronto não chama cliente sozinho. Conteúdo no padrão da sua marca, vídeo que mostra o seu produto de verdade e anúncio que leva para uma página feita para virar conversa.',
    obras: [
      { id: 'm-conteudo', tag: 'Conteúdo e redes', titulo: 'Posts no padrão da sua marca, no ritmo do seu dia.', texto: 'Planejamento, artes, legendas e publicação — com relatório de onde veio cada contato.', img: F + 'estudio-conteudo-640.webp', w: 4.6, href: '/marketing-e-redes/', rotulo: 'Ver conteúdo e redes' },
      { id: 'm-trafego', tag: 'Tráfego pago', titulo: 'Anúncio com destino certo.', texto: 'Google e Instagram com a verba na sua conta, criativos e otimização — apontando para uma página que converte.', img: F + 'fachada-loja-640.webp', w: 4.6, href: '/trafego-pago/', rotulo: 'Ver o tráfego pago' },
      { id: 'm-video', tag: 'Vídeos personalizados', titulo: 'Reels, comercial do produto e depoimento de cliente.', texto: 'Feitos para o seu negócio, com a sua marca — do roteiro à entrega.', img: F + 'recepcao-clinica-640.webp', w: 4.6, href: '/videos-personalizados/', rotulo: 'Ver os vídeos' },
    ],
  },
]
