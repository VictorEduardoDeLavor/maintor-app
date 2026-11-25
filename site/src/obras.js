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
   · rolagem   (12/11) a tela que rola dentro do quadro: { base, modo: 'pagina' | 'telas', n } — imagens em
               public/midia/rolagem/, geradas por testes/capturar-rolagem.mjs (ver tela())

   Regras da casa: só trabalho real e no ar; cliente só com autorização
   (VOKE, Bendita, Besten, Studio TechTrainer e, desde 15/11, Maktub Conquista
   e Alves & Oliveira — confirmada pelo Victor); apps com telas de
   demonstração; nenhum preço da Flow (decisão de 28/10).

   15/11/2026 — a Ala 01 passou a ser organizada pelo TIPO de projeto (o
   visitante acha logo um parecido com o dele): lojas → sites → sistemas e
   aplicativos. O selo de cada quadro continua dizendo se é projeto de
   cliente ou produto da Maintor. A Ala 02 virou "você conta, a gente
   constrói": portas na ordem do que o cliente da Flow mais procura. Foto de ambiente leva a nota de imagem
   ilustrativa — não é trabalho entregue.

   25/11/2026 — pedido do Victor: Matuura Seguros e TRDD Records abrem o tour, num grupo novo, "Site com
   gestão" (com a Besten, que é site + portal). E cada projeto mostra o que existe POR TRÁS do que o
   visitante vê (campo `gestao`): quem olha a Bendita vê uma loja, mas por trás tem estúdio de fotos com
   IA, etiqueta de frete no pedido, cupons, afiliados… Só entra o que foi conferido no código ou na página
   no ar de cada projeto; tela de demonstração ou de teste leva nota.
     gestao: { rotulo, resumo: [3 frases curtas], itens: [{ t, d }], telas: [{ img, legenda }], nota }
   ================================================================ */

const P = '/midia/portfolio/'
const F = '/midia/fotos/'
const S = '/midia/social/'
const ROL = '/midia/rolagem/'
/* a tela que rola: a primeira tela vira o quadro parado (e a imagem da legenda sem 3D); a faixa alta corre quando
   a obra está em leitura. 'pagina' = um site no ar descendo; 'telas' = n telas reais passando uma a uma. */
const G = '/midia/gestao/' // telas de gestão ("Por trás"): <nome>-1280.webp e -640.webp, de testes/capturar-gestao.mjs
const tela = (nome, modo = 'pagina', n = 0) => ({ img: ROL + nome + '-720.webp', rolagem: { base: ROL + nome, modo, n } })

/* versão HD de cada imagem para o quadro em 3D (05/11): prints dos sites em 1920 px
   (capturados em 2x) e fotos em 960 px. RH e Task só existem na resolução da captura. */
const COM_HD = ['techtrainer-site', 'bendita-desktop', 'besten-kpis', 'cmms-painel', 'fit-site-desktop', 'horaqui-site', 'voke-desktop', 'cmms-os', 'cmms-copiloto', 'besten-biblioteca', 'besten-onboarding']
export function imagemHD(img) {
  if (img.startsWith(ROL)) return img.replace('-720.webp', '-1280.webp')
  const m = img.match(/\/midia\/portfolio\/(.+)-720\.webp$/)
  if (m) return COM_HD.includes(m[1]) ? img.replace('-720.webp', '-1920.webp') : img.replace('-720.webp', '-1280.webp')
  return img.replace(/-640\.webp$/, '-960.webp')
}

const ILUSTRATIVA = 'Imagem ilustrativa do tipo de negócio, não é um projeto entregue.'
const DEMO = 'Telas de uma empresa de demonstração.'

/* Ala 01 em três grupos, pelo tipo de projeto (15/11). O id do grupo é âncora pública; `alias` mantém
   as âncoras antigas (/#projetos-clientes, /#produtos-maintor) chegando num lugar que faz sentido. */
/* 26/11: obras com tela que rola (data-rolagem) são mais altas e ficam em leitura por mais tempo; o site no quadro
   desce junto com a rolagem. O tour e o guia param no COMEÇO dessa leitura (site no topo), não no meio da obra. */
export const LEITURA_ROLA = 0.26
export const alvoLeitura = (el) => {
  const r = el.getBoundingClientRect()
  return window.scrollY + r.top + r.height * (el.dataset.rolagem ? LEITURA_ROLA : 0.5) - window.innerHeight / 2
}

export const GRUPOS = {
  gestao: { id: 'site-e-gestao', titulo: 'Site com gestão', lead: 'Por fora, o site que o cliente vê. Por dentro, o painel com que a empresa toca o dia a dia: pedidos, agenda, carteira, conteúdo.' },
  lojas: { id: 'lojas-virtuais', alias: 'projetos-clientes', titulo: 'Lojas virtuais', lead: 'Lojas no ar, com pedido, pagamento e frete funcionando. O domínio, a conta e o painel ficam no nome de quem é dono.' },
  sites: { id: 'sites', titulo: 'Sites que geram contato', lead: 'Para quem vende serviço ou atende com hora marcada: o visitante entende o que você faz, confia e chama.' },
  apps: { id: 'sistemas-e-aplicativos', alias: 'produtos-maintor', titulo: 'Sistemas e aplicativos', lead: 'Sistemas que a Maintor criou e mantém em operação. É a mesma engenharia que entra no seu projeto.' },
}

export const ALAS = [
  {
    id: 'trabalhos',
    eyebrow: 'Ala 01 · Trabalhos no ar',
    eyebrowCurto: 'Ala 01 · No ar', // no celular estreito (360 px) a régua cabe em uma linha com "14 projetos"
    contagem: 'Seleção',
    titulo: 'Alguns projetos no ar. Um deles parece com o seu.',
    lead: 'Uma seleção do que construímos: abra uma loja, navegue por um site ou veja o painel que fica por trás.',
    obras: [
      {
        id: 'matuura', grupo: 'gestao', selo: 'Projeto para cliente', titulo: 'Matuura Seguros', categoria: 'Site e plataforma para corretora de seguros',
        texto: 'Site da corretora com 66 anos de história, simulador de consórcio, sinistro guiado e pedido de avaliação. Por trás, uma central para acompanhar renovações, montar cotações e atender o cliente na área dele.',
        ...tela('matuura-home'), w: 5.4,
        acao: { href: 'https://matuura-prototipo.vercel.app', rotulo: 'Visitar site', externo: true },
        mais: [{ href: 'https://matuura-prototipo.vercel.app/central/', rotulo: 'Ver a Central (demonstração)', externo: true }],
        nota: 'Endereço provisório até a publicação no domínio da corretora.',
        assunto: 'um site com gestão como o da Matuura Seguros',
        gestao: {
          rotulo: 'Por trás do site',
          resumo: ['Radar de renovação', 'Cotação Expressa', 'Área do cliente'],
          itens: [
            { t: 'Simulador de consórcio', d: 'O visitante simula pelo valor do bem ou pela parcela, em três passos, e manda o resultado pelo WhatsApp.' },
            { t: 'Sinistro guiado', d: 'Um passo a passo do que fazer na hora do sinistro, que termina no WhatsApp da corretora.' },
            { t: 'Pedido de avaliação', d: 'Página e cartão de balcão com QR para o cliente avaliar a corretora no Google.' },
            { t: 'Central Matuura', d: 'O radar de renovação mostra quem vence nos próximos dias e quem chamar hoje; cada cliente tem a carteira com apólices e prazos.' },
            { t: 'Cotação Expressa', d: 'O cliente manda a foto dos documentos, a corretora escolhe o que recomenda e o cliente recebe um link simples para comparar e aceitar.' },
            { t: 'Área do cliente', d: 'O segurado entra com o celular e um código no WhatsApp e vê apólices, documentos, datas e o caminho do sinistro.' },
          ],
          telas: [
            { img: G + 'matuura-central', legenda: 'Central Matuura: radar de renovação' },
            { img: G + 'matuura-cotacao', legenda: 'Cotação Expressa' },
            { img: G + 'matuura-carteira', legenda: 'A carteira do cliente' },
            { img: G + 'matuura-area', legenda: 'Área do cliente' },
          ],
          nota: 'Central, Cotação Expressa e área do cliente com dados de demonstração.',
        },
      },
      {
        id: 'trdd', grupo: 'gestao', selo: 'Projeto para cliente', titulo: 'TRDD Records', categoria: 'Site e painel de gestão para gravadora',
        texto: 'Site da gravadora com os artistas, o player do Spotify, os clipes e a venda de produção do TRDD Lab. Por trás, um painel em que a equipe edita tudo e recebe os pedidos de show já organizados.',
        ...tela('trdd-home'), w: 5.4,
        acao: { href: 'https://trdd-records-previa.vercel.app', rotulo: 'Visitar site', externo: true },
        nota: 'Endereço provisório até a publicação no domínio da gravadora.',
        assunto: 'um site com painel de gestão como o da TRDD Records',
        gestao: {
          rotulo: 'Por trás do site',
          resumo: ['Painel para editar o site todo', 'Pedidos de show com triagem', 'Agenda do TRDD Lab'],
          itens: [
            { t: 'Painel de edição', d: 'A equipe muda textos, fotos (com editor de recorte), artistas, músicas, clipes e números sem programador, vê a prévia e publica.' },
            { t: 'Ordem do site', d: 'Arrastar para mudar a ordem das partes da página inicial ou esconder uma delas.' },
            { t: 'Histórico', d: 'Cada publicação fica guardada; dá para abrir uma versão antiga e publicar de novo.' },
            { t: 'Pedidos de show', d: 'Cada pedido chega com formato, evento, público e verba, já com a prioridade calculada e a resposta pronta para o WhatsApp. Exporta planilha.' },
            { t: 'Família TRDD', d: 'O cadastro dos fãs que querem saber de lançamento, drop e show, com planilha para exportar.' },
            { t: 'TRDD Lab', d: 'Página de venda de produção com questionário e reserva de horário de verdade na agenda do produtor.' },
            { t: 'Acessos por convite', d: 'Dono, equipe e artista entram com o próprio login e veem só o que é seu; o artista preenche a ficha de lançamento na área dele.' },
            { t: 'Loja TRDD Supply', d: 'A loja dos drops já está pronta e fica escondida até a gravadora decidir abrir.' },
          ],
          telas: [
            { img: G + 'trdd-artistas', legenda: 'Painel: artistas' },
            { img: G + 'trdd-pedidos', legenda: 'Pedidos de show e fãs' },
            { img: G + 'trdd-producao', legenda: 'TRDD Lab: conversas marcadas e agenda' },
            { img: G + 'trdd-ordem', legenda: 'Ordem das partes do site' },
          ],
          nota: 'Telas do painel com conteúdo de teste.',
        },
      },
      {
        id: 'besten', grupo: 'gestao', selo: 'Projeto para cliente', titulo: 'Besten Consultoria', categoria: 'Site institucional e portal interno',
        texto: 'Site institucional e portal que reúne indicadores dos projetos, tarefas da equipe, materiais e trilha de integração dos consultores.',
        ...tela('besten-home'), w: 5.4,
        nota: 'Na tela, o site institucional. O portal interno é de uso da equipe e exige login.',
        acao: { href: 'https://besten-site.vercel.app', rotulo: 'Visitar site institucional', externo: true },
        assunto: 'um site com portal interno parecido com o da Besten Consultoria',
        gestao: {
          rotulo: 'Por trás do site',
          resumo: ['Indicadores dos projetos', 'Tarefas do dia da equipe', 'Trilha de integração'],
          itens: [
            { t: 'Indicadores', d: 'Os números de cada projeto e o painel geral, com o ranking de todos os projetos da consultoria.' },
            { t: 'Hoje', d: 'As tarefas do dia de cada consultor, em lista e em quadro.' },
            { t: 'Projetos e documentos', d: 'Tudo de cada cliente num lugar só.' },
            { t: 'Biblioteca', d: 'Os materiais e o padrão de e-mails da consultoria, para a equipe inteira falar do mesmo jeito.' },
            { t: 'Trilha de integração', d: 'O caminho do consultor novo, do primeiro dia até atender sozinho.' },
            { t: 'Gestão da equipe', d: 'Aprovações e time para o gerente; consultores, regras e pedidos de acesso para o administrador.' },
            { t: 'Propostas com link', d: 'A proposta vai por um link e a consultoria vê quando o cliente abriu.' },
          ],
          telas: [
            { img: '/midia/portfolio/besten-kpis', legenda: 'Indicadores de todos os projetos' },
            { img: '/midia/portfolio/besten-biblioteca', legenda: 'Biblioteca da consultoria' },
            { img: '/midia/portfolio/besten-onboarding', legenda: 'Trilha de integração' },
          ],
          nota: 'Telas do portal com os nomes dos projetos desfocados.',
        },
      },
      {
        id: 'voke', grupo: 'lojas', selo: 'Projeto para cliente', titulo: 'VOKE WEAR', categoria: 'Loja virtual para moda fitness',
        texto: 'Loja de moda fitness com estoque por tamanho, cálculo de frete pelo CEP e aviso de reposição. A equipe gerencia os produtos em um painel próprio.',
        ...tela('voke-home'), w: 5.4,
        acao: { href: '/casos/voke-wear/', rotulo: 'Ver case' },
        mais: [{ href: 'https://vokewear.com.br', rotulo: 'Visitar loja', externo: true }],
        assunto: 'uma loja virtual parecida com a VOKE WEAR',
        gestao: {
          rotulo: 'Por trás da loja',
          resumo: ['Painel da dona', 'Estoque por tamanho', 'Fila de espera'],
          itens: [
            { t: 'Painel da dona', d: 'Preço, produtos, fotos, estoque e pedidos do dia, mudados na hora, sem chamar programador.' },
            { t: 'Estoque por tamanho', d: 'Grade por tamanho com baixa automática a cada venda.' },
            { t: 'Fila de espera', d: 'Quem quis um tamanho esgotado deixa o e-mail e é avisada quando ele volta.' },
            { t: 'Pagamento', d: 'Pix com desconto automático no checkout e cartão parcelado.' },
            { t: 'Frete', d: 'Calculado sozinho pelo CEP, com frete grátis a partir de um valor.' },
            { t: 'Relacionamento', d: 'Newsletter e integração com o Instagram da marca.' },
          ],
        },
      },
      {
        id: 'maktub', fora: true, grupo: 'lojas', selo: 'Projeto para cliente', titulo: 'Maktub Conquista', categoria: 'Loja virtual de calçados femininos',
        texto: 'Loja de calçados femininos com vitrine por marca e por categoria, compra online com retirada na loja e um painel para a equipe cadastrar e publicar os produtos.',
        ...tela('maktub-home'), w: 5.4,
        acao: { href: 'https://www.maktubconquista.com.br', rotulo: 'Visitar loja', externo: true },
        mais: [{ href: '/loja-virtual/', rotulo: 'Como fica a sua loja' }],
        assunto: 'uma loja virtual parecida com a da Maktub Conquista',
      },
      {
        id: 'bendita', grupo: 'lojas', selo: 'Projeto para cliente', titulo: 'Bendita Acessórios', categoria: 'Loja virtual para semijoias',
        texto: 'Loja virtual de semijoias com um guia para a cliente descobrir o tamanho do anel em casa antes da compra.',
        ...tela('bendita-home'), w: 5.4,
        acao: { href: 'https://benditaacessorios.com', rotulo: 'Visitar loja', externo: true },
        mais: [{ href: 'https://benditaacessorios.com/descubra-seu-aro', rotulo: 'Ver o guia de aro', externo: true }, { href: '#obra-m-video', rotulo: 'Ver o comercial da marca' }],
        assunto: 'uma loja virtual parecida com a da Bendita Acessórios',
        gestao: {
          rotulo: 'Por trás da loja',
          resumo: ['Estúdio de fotos com IA', 'Etiqueta de frete no pedido', 'Cupons e afiliados'],
          itens: [
            { t: 'Estúdio de fotos com IA', d: 'A partir da foto da peça, gera a foto de catálogo em 2K, no estilo da marca, sem mudar a joia. Cada foto usa 1 crédito; se a geração falhar, o crédito volta.' },
            { t: 'Créditos e consumo', d: 'O saldo, as reservas e o histórico de cada foto, à vista no painel.' },
            { t: 'Produtos, estoque e categorias', d: 'Cadastro das peças, quantidades, reposição e as seções do catálogo.' },
            { t: 'Pedidos com etiqueta', d: 'Prepara, compra e imprime a etiqueta do Melhor Envio sem sair do pedido.' },
            { t: 'Cupons e afiliados', d: 'Promoções com limite de uso e afiliadas com comissão e as vendas atribuídas a cada uma.' },
            { t: 'Custos e margem', d: 'Os custos registrados e a receita, as comissões e a margem estimada.' },
            { t: 'Vitrine e marca', d: 'Banners, textos da vitrine, logos e as versões aprovadas da marca, editados pela loja.' },
            { t: 'Guia de aro', d: 'A cliente descobre o tamanho do anel em casa, com a tela do celular.' },
            { t: 'Acesso seguro', d: 'Login com verificação em duas etapas.' },
          ],
        },
      },
      {
        id: 'techtrainer', grupo: 'sites', selo: 'Projeto para cliente', titulo: 'Studio TechTrainer', categoria: 'Site com agendamento online para studio de personal',
        texto: 'Site de studio de personal com agendamento online da aula experimental, quiz que indica o formato de treino, vídeos de exercícios gravados no Studio e um vídeo que mostra o caminho até a sala.',
        ...tela('techtrainer-home', 'telas', 6), w: 5.4,
        acao: { href: 'https://studiotechtrainer.com.br', rotulo: 'Visitar site', externo: true },
        mais: [{ href: '#obra-m-video', rotulo: 'Ver o vídeo de como chegar' }],
        assunto: 'um site com agendamento online como o do Studio TechTrainer',
      },
      {
        id: 'ao', grupo: 'sites', selo: 'Projeto para cliente', titulo: 'Alves & Oliveira Odontologia', categoria: 'Site para clínica odontológica',
        texto: 'Site da clínica com as especialidades, o laboratório de prótese próprio, o agendamento da avaliação pelo WhatsApp e o pedido de uma prévia do sorriso.',
        ...tela('ao-site', 'telas', 6), w: 5.4,
        acao: { href: '/site-para-clinica-odontologica/', rotulo: 'Ver site para clínicas' },
        mais: [{ href: '/sites/', rotulo: 'Como fica o seu site' }],
        assunto: 'um site para clínica como o da Alves & Oliveira',
      },
      {
        id: 'horaqui', fora: true, grupo: 'apps', selo: 'Produto da Maintor', titulo: 'Horaqui', categoria: 'Agenda online',
        texto: 'Agenda online para negócios que atendem com hora marcada. O cliente escolhe o serviço, o profissional e o horário pelo link de agendamento.',
        ...tela('horaqui-site', 'telas', 6), w: 5.4,
        acao: { href: 'https://www.horaqui.com.br/demo', rotulo: 'Testar agendamento', externo: true },
        mais: [{ href: 'https://www.horaqui.com.br', rotulo: 'Conhecer o Horaqui', externo: true }],
        assunto: 'uma agenda online como o Horaqui',
      },
      {
        id: 'sorria', grupo: 'apps', selo: 'Produto da Maintor', titulo: 'SorrIA', categoria: 'Sistema para clínicas odontológicas',
        texto: 'Sistema para clínicas odontológicas: simula o novo sorriso do paciente a partir de uma foto, monta a proposta do tratamento e acompanha agenda, atendimentos e financeiro.',
        ...tela('sorria-telas', 'telas', 4), w: 5.4,
        nota: 'Na tela, a agenda, o funil de contatos, o financeiro e o estoque do SorrIA, com uma clínica de demonstração.',
        acao: { whats: true, rotulo: 'Pedir uma demonstração' },
        mais: [{ href: '/site-para-clinica-odontologica/', rotulo: 'Site para clínicas' }],
        assunto: 'uma demonstração do SorrIA para a minha clínica',
      },
      {
        id: 'fit', fora: true, grupo: 'apps', selo: 'Produto da Maintor', titulo: 'Maintor FIT', categoria: 'Aplicativo de treino e alimentação',
        texto: 'Aplicativo de treino e alimentação com a marca do profissional, painel de acompanhamento para personal trainers e nutricionistas e área para os alunos.',
        ...tela('fit-site', 'telas', 6), w: 5.4,
        acao: { href: 'https://maintorfit.com', rotulo: 'Conhecer o Maintor FIT', externo: true },
        mais: [{ href: '/sistema-para-revender/app-para-personal-trainer/', rotulo: 'Quero um app com minha marca' }],
        assunto: 'um aplicativo com a minha marca, como o Maintor FIT',
      },
      {
        id: 'cmms', grupo: 'apps', selo: 'Produto da Maintor', titulo: 'Maintor CMMS', categoria: 'Sistema de gestão de manutenção',
        texto: 'Sistema para acompanhar ordens de serviço, programar manutenções preventivas e consultar o histórico das máquinas e o estoque de peças.',
        ...tela('cmms-site'), w: 5.4,
        nota: 'Na tela, o site do Maintor CMMS. As telas do sistema estão na porta 05, da Ala 02.',
        acao: { href: 'https://maintor.com.br', rotulo: 'Conhecer o sistema', externo: true },
        assunto: 'um sistema de manutenção como o Maintor CMMS',
      },
      {
        id: 'rh', fora: true, grupo: 'apps', selo: 'Produto da Maintor', titulo: 'Maintor RH', categoria: 'Sistema de gestão de pessoas',
        texto: 'Sistema de gestão de pessoas que reúne documentos, ponto, férias e recrutamento, com relatórios para acompanhar a equipe.',
        ...tela('rh-telas', 'telas', 2), w: 5.4,
        nota: DEMO,
        acao: { href: 'https://maintor-rh.base44.app', rotulo: 'Conhecer o Maintor RH', externo: true },
        assunto: 'um sistema de RH como o Maintor RH',
      },
      {
        id: 'task', fora: true, grupo: 'apps', selo: 'Produto da Maintor', titulo: 'Maintor Task', categoria: 'Sistema de processos e qualidade',
        texto: 'Sistema para acompanhar o planejado e o executado, registrar evidências e tratar não conformidades.',
        ...tela('task-telas', 'telas', 2), w: 5.4,
        nota: DEMO,
        acao: { href: 'https://maintor-task.base44.app', rotulo: 'Conhecer o Maintor Task', externo: true },
        assunto: 'um sistema de processos como o Maintor Task',
      },
    ],
  },
  {
    id: 'problemas',
    eyebrow: 'Ala 02 · Feito para o seu caso',
    eyebrowCurto: 'Ala 02 · Seu caso', // no celular a régua cabe em uma linha
    contagem: '7 portas',
    /* 15/11 — "você conta, a gente constrói": a promessa no título, o caminho em três passos e as portas na ordem
       do que o cliente da Flow mais procura (vender, se apresentar, atrair, atender; depois a operação). Quem não
       se vê em nenhuma porta tem a saída "Meu caso é outro", direto no WhatsApp. */
    titulo: 'Você conta. A gente constrói.', // espaços sem quebra: a segunda frase fica inteira numa linha
    lead: 'Todo projeto da Ala 01 começou com uma conversa. Escolha a porta que mais parece com o seu momento e veja o que já construímos para casos assim.',
    passos: [
      { rot: 'Conversa', val: 'Você conta o que trava o seu dia.' },
      { rot: 'Proposta', val: 'Escopo, prazo e valor por escrito.' },
      { rot: 'No ar', val: 'A gente constrói, publica e ensina a usar.' },
    ],
    outro: { rotulo: 'Meu caso é outro', assunto: 'um projeto que não está na lista do site' },
    /* cada porta: objetivo → frase do visitante → o que a gente constrói → projetos no ar → página do serviço.
       `placa` é o nome curto pintado na placa da porta em 3D (cabe numa linha). */
    obras: [
      {
        id: 'p-loja', objetivo: 'Vender online', placa: 'Vender online',
        titulo: '“Vendo pelo direct e perco tempo respondendo sobre tamanho, pagamento e frete.”',
        texto: 'Uma loja sua, com catálogo, Pix, cartão e frete calculados sozinhos, e um painel para você cuidar de tudo sem depender de ninguém.',
        ...tela('bendita-produto'), foto: 'loja-moda', w: 4.6,
        nota: 'Na tela, a página de um produto da Bendita Acessórios, loja feita pela Maintor Flow.',
        acao: { href: '/loja-virtual/', rotulo: 'Ver como fica a loja' },
        mais: [{ href: '#obra-voke', rotulo: 'VOKE WEAR' }, { href: '#obra-bendita', rotulo: 'Bendita' }],
        assunto: 'vender online',
      },
      {
        id: 'p-site', objetivo: 'Apresentar minha empresa', placa: 'Minha empresa',
        titulo: '“Quando alguém pede meu site, eu só tenho o Instagram ou um PDF para enviar.”',
        texto: 'Um site que explica o que você faz, mostra o seu trabalho e leva o visitante até o seu WhatsApp ou a sua agenda.',
        ...tela('besten-servicos'), foto: 'fachada-loja', w: 4.6,
        nota: 'Na tela, o site da Besten Consultoria, feito pela Maintor Flow.',
        acao: { href: '/sites/', rotulo: 'Ver como fica o site' },
        mais: [{ href: '#obra-techtrainer', rotulo: 'Studio TechTrainer' }, { href: '#obra-ao', rotulo: 'Alves & Oliveira' }, { href: '#obra-besten', rotulo: 'Besten' }],
        assunto: 'um site para apresentar minha empresa',
      },
      {
        id: 'p-mkt', objetivo: 'Atrair novos clientes', placa: 'Novos clientes',
        titulo: '“Faço posts e anúncios, mas é difícil entender o que vira contato.”',
        texto: 'Conteúdo, vídeos e anúncios ligados a uma página, loja ou WhatsApp, para você saber de onde vem cada contato.',
        ...tela('flow-feed'), foto: 'estudio-conteudo', w: 4.0,
        nota: 'Na tela, posts autorais do perfil @maintorflow, a própria marca da Flow.',
        acao: { href: '/marketing-e-redes/', rotulo: 'Ver como funciona o marketing' },
        mais: [{ href: '#marketing', rotulo: 'Ala 04 · Marketing' }],
        assunto: 'atrair novos clientes',
      },
      {
        id: 'p-atend', objetivo: 'Automatizar o atendimento', placa: 'Atendimento',
        titulo: '“Respondo as mesmas perguntas no WhatsApp o dia inteiro.”',
        texto: 'Respostas automáticas para as perguntas de sempre, confirmação de pedido e passagem para uma pessoa quando precisa.',
        img: F + 'balcao-pedidos-640.webp', foto: 'balcao-pedidos', w: 4.6, nota: ILUSTRATIVA,
        acao: { href: '/automacao-de-atendimento/', rotulo: 'Ver como funciona a automação' },
        assunto: 'automatizar o atendimento',
      },
      {
        id: 'p-manut', objetivo: 'Organizar a manutenção', placa: 'Manutenção',
        titulo: '“As ordens de serviço e o histórico das máquinas ficam espalhados em planilhas e cadernos.”',
        texto: 'Um sistema com ordens de serviço, preventivas programadas e o histórico de cada máquina.',
        ...tela('cmms-telas', 'telas', 5), foto: 'manutencao-oficina', w: 4.6,
        nota: 'Na tela, o Maintor CMMS com uma empresa de demonstração.',
        acao: { href: '/sistemas-sob-medida/#manutencao', rotulo: 'Ver sistemas de manutenção' },
        mais: [{ href: '#obra-cmms', rotulo: 'Maintor CMMS' }],
        assunto: 'organizar a manutenção',
      },
      {
        id: 'p-rh', objetivo: 'Digitalizar o RH', placa: 'RH',
        titulo: '“Perco tempo procurando documentos e conferindo ponto e férias em arquivos diferentes.”',
        texto: 'Um sistema que junta documentos, ponto, férias e recrutamento num lugar só.',
        ...tela('rh-telas', 'telas', 2), foto: 'rh-papelada', w: 4.6,
        nota: 'Na tela, o Maintor RH com uma empresa de demonstração.',
        acao: { href: '/sistemas-sob-medida/#rh', rotulo: 'Ver sistemas de RH' },
        mais: [{ href: 'https://maintor-rh.base44.app', rotulo: 'Maintor RH', externo: true }],
        assunto: 'digitalizar o RH',
      },
      {
        id: 'p-cons', objetivo: 'Digitalizar minha consultoria', placa: 'Consultoria',
        titulo: '“Preciso reunir indicadores, tarefas e materiais dos projetos em um só lugar.”',
        texto: 'Um portal com os indicadores, as tarefas e os materiais dos seus projetos. Para vender o seu método como software, veja a Ala 03.',
        ...tela('besten-portal', 'telas', 3), foto: 'consultoria-portal', w: 4.6,
        nota: 'Na tela, o portal da Besten Consultoria, com os nomes dos projetos desfocados.',
        acao: { href: '/para-consultorias/', rotulo: 'Ver para consultorias' },
        mais: [{ href: '#obra-besten', rotulo: 'Besten' }, { href: '#sistemas', rotulo: 'Ala 03 · Software com sua marca' }],
        assunto: 'digitalizar minha consultoria',
      },
    ],
  },
  {
    id: 'sistemas',
    eyebrow: 'Ala 03 · Sistemas',
    contagem: '2 caminhos',
    titulo: 'Sistemas para sua operação ou para vender com sua marca',
    lead: 'Organize o trabalho da sua equipe ou ofereça aos seus clientes um software com a sua marca.',
    obras: [
      {
        id: 's-oficio', selo: 'Caminho 1', titulo: 'Sistema para minha operação', categoria: 'Manutenção, RH, processos e portais internos',
        texto: 'Sistemas feitos em torno do processo da equipe, com controles, indicadores e permissões. Foi assim que nasceram o Maintor CMMS, o Maintor RH, o Maintor Task e o portal da Besten.',
        ...tela('sistemas-telas', 'telas', 5), w: 5.4,
        nota: 'Na tela, o Maintor CMMS, o Maintor Task, o Maintor RH e o portal da Besten, com dados de demonstração.',
        acao: { href: '/sistemas-sob-medida/', rotulo: 'Conhecer sistemas sob medida' },
        assunto: 'um sistema para a minha operação',
      },
      {
        id: 's-revender', selo: 'Caminho 2', titulo: 'Software com minha marca', categoria: 'Para oferecer aos seus clientes',
        texto: 'Seu método vira um aplicativo com a sua marca, para oferecer aos seus clientes. É o modelo do Maintor FIT: cada profissional usa o app com o próprio nome e as próprias cores.',
        ...tela('fit-app', 'telas', 4), w: 2.4,
        nota: 'Na tela, o Maintor FIT de um personal de demonstração, com a marca e as cores dele.',
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
    lead: 'Conteúdo, vídeos e campanhas que levam o público até a sua loja, o seu site ou o seu WhatsApp.',
    obras: [
      {
        id: 'm-conteudo', selo: 'Marketing', titulo: 'Conteúdo e redes',
        texto: 'Planejamento, artes, legendas e publicação: uma rotina de conteúdo para a sua marca.',
        ...tela('flow-posts', 'telas', 4), w: 4.2,
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
        texto: 'Campanhas no Google e na Meta, com criativos, uma página de destino preparada e o acompanhamento do que vira contato.',
        ...tela('voke-produto'), w: 4.6,
        nota: 'Exemplo de página de destino: um produto da VOKE WEAR, loja feita pela Maintor Flow.',
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
/* 26/11: a Ala 01 mostra uma SELEÇÃO (pedido do Victor). Quem tem `fora: true` continua aqui, com os dados, mas não
   entra na home — os links das páginas internas para esses projetos vão para o site deles. Para voltar um projeto ao
   tour, é só tirar o `fora`. */
for (const a of ALAS) a.obras = a.obras.filter((o) => !o.fora)

export const PORTAS = ALAS.find((a) => a.id === 'problemas').obras.map((o) => ({
  ...o,
  obra: o.id,
  frase: o.titulo.replace(/[“”]/g, ''),
  img: `/midia/fotos/${o.foto}-960.webp`,
}))

/* Mensagem do WhatsApp: a conversa chega dizendo de onde veio e o assunto. */
export const msgWhats = (assunto) => `Olá! Vim pelo portfólio da Maintor Flow e quero conversar sobre ${assunto || 'o meu projeto'}.`
