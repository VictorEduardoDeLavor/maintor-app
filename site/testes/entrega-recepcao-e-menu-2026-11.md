# Abertura com o Victor, tour, Ala 02 nova e menu único — relatório de entrega (15/11/2026)

Pedido do Victor (15/11):

- o boneco recebe o visitante na abertura e convida para o tour;
- tirar a placa "Qual é o seu problema?";
- repensar quais projetos aparecem primeiro;
- reformular a narrativa do começo da Ala 02, para captar clientes;
- cada página que se abre precisa ser estratégica, do primeiro clique ao último;
- menu de cima com tudo o que a Flow constrói, inclusive o que estava escondido.

Decisões dele no mesmo dia:

| Decisão | Escolha |
|---|---|
| Como o boneco se apresenta | Como Victor: "Oi! Eu sou o Victor." |
| Ala 01 | 3 grupos por tipo de projeto |
| Ala 02 | "Você conta, a gente constrói" |
| Trabalhos que estavam fora do site | Entram Maktub Conquista, Alves & Oliveira e SorrIA (em operação). Autorização de todos confirmada por ele. |

Base publicada antes do trabalho: deploy `38ece42`. Publicado em 15/11/2026, com o "pode publicar" do Victor.

## 1. Abertura: o Victor recebe

- A placa em 3D "Qual é o seu problema?" saiu, junto com o botão e a lista de 8 opções que ela abria.
- O boneco fica de pé na abertura, de frente para quem chega, e acena quando aparece e de novo a cada 9 segundos.
  - Computador: à direita do texto, em primeiro plano. Antes ficava no fundo do corredor, quase invisível.
  - Celular: no canto de baixo, à direita, como antes.
- Ao lado da cabeça dele há um balão de fala: "Oi! Eu sou o Victor. Vem comigo ver o que a gente já construiu?", com o botão "Começar o tour".
- O balão é clicável e faz o mesmo que o botão do texto: leva ao primeiro projeto (VOKE WEAR) já em posição de leitura, com a barra do guia para seguir de obra em obra.
- O balão é posicionado pelo espaço livre da tela. Se a tela for baixa demais para um balão legível, ele não aparece e fica só o botão.
- Texto da abertura: "Aqui você tem alguém, não só uma ferramenta: quem constrói é quem atende. Faça o tour pelos projetos que já estão no ar e encontre um parecido com o seu."
- Botões: "Começar o tour" e "Conversar sobre meu projeto".

## 2. Ala 01: 12 projetos em 3 grupos

Título novo: "Doze projetos no ar. Um deles parece com o seu."

A ordem segue o que o cliente ideal da Flow mais procura: primeiro loja, depois site, depois sistema.

| Grupo | Projetos, na ordem |
|---|---|
| Lojas virtuais | VOKE WEAR · **Maktub Conquista** (novo) · Bendita Acessórios |
| Sites que geram contato | Studio TechTrainer · **Alves & Oliveira Odontologia** (novo) · Besten Consultoria |
| Sistemas e aplicativos | Horaqui · **SorrIA** (novo) · Maintor FIT · Maintor CMMS · Maintor RH · Maintor Task |

- O selo de cada quadro continua dizendo se é "Projeto para cliente" ou "Produto da Maintor".
- As âncoras antigas (`/#projetos-clientes`, `/#produtos-maintor`) continuam funcionando.
- Os três quadros novos mostram telas reais, rolando:
  - **Maktub:** a home da loja no ar (maktubconquista.com.br).
  - **Alves & Oliveira:** 6 telas do site da clínica. As telas de antes e depois, com fotos de pacientes, ficaram de fora.
  - **SorrIA:** a entrada do sistema e o pedido de prévia do sorriso no site da clínica.

## 3. Ala 02: "Você conta. A gente constrói."

| Item | Antes | Depois |
|---|---|---|
| Régua | Ala 02 · Soluções por necessidade | Ala 02 · Feito para o seu caso |
| Título | O que você precisa resolver hoje? | Você conta. A gente constrói. |
| Apoio | Escolha uma situação parecida com a sua e veja o que podemos construir. | Todo projeto da Ala 01 começou com uma conversa. Escolha a porta que mais parece com o seu momento e veja o que já construímos para casos assim. |
| Caminho | — | 3 passos: Conversa → Proposta por escrito → No ar |
| Ordem das portas | loja, site, atendimento, manutenção, RH, novos clientes, consultoria | loja, site, **novos clientes, atendimento**, manutenção, RH, consultoria |
| Quem não se vê na lista | — | Botão "Meu caso é outro", direto no WhatsApp |

Em cada porta:

- "O que a Maintor Flow oferece" virou "O que a gente constrói", com o texto reescrito pelo resultado para o dono do negócio.
- Os projetos reais que provam aquela solução aparecem sob o rótulo "Já no ar". Exemplo, porta 01: VOKE WEAR, Maktub Conquista e Bendita.
- O botão principal leva à página do serviço: "Ver como fica a loja", "Ver como fica o site".

## 4. Menu único, na home e nas 22 páginas internas

Antes, a home tinha cinco âncoras e cada página interna tinha um menu próprio de dois links ("Início" e um vizinho). Guias, trilha, case e páginas de nicho só eram achados pelo rodapé.

Agora há uma fonte só (`src/menu.js`), com quatro grupos e Contato. Cada grupo abre o mesmo painel, com os 39 links do site:

| Grupo | O que tem |
|---|---|
| Projetos | Começar o tour, case VOKE e os 12 projetos, por tipo |
| O que fazemos | Para vender · Para se apresentar e atender · Para organizar a operação · Para vender com a sua marca (12 páginas) |
| Marketing | Conteúdo e redes, tráfego pago, vídeos, e os exemplos no tour |
| Guias | Por onde começar, os 4 guias, como trabalhamos e perguntas frequentes |

O que estava escondido e agora está no menu: loja no Instagram, loja de moda fitness, site para clínica odontológica, app para personal, sistema para salão, para consultorias, manutenção mensal, por onde começar, os 4 guias e o case VOKE.

Nas páginas internas, o cabeçalho é escrito pelo build (`menu-paginas.js`). Cada página mantém o WhatsApp dela, com a mensagem pronta própria.

## 5. Páginas internas: do primeiro clique ao último

O texto das páginas já seguia um roteiro (para quem é → o que vem → case → como funciona → perguntas → chamada). Faltavam duas coisas, que entraram em todas:

- **Primeiro clique:** o menu do site e a marca em imagem.
- **Último clique:** o bloco "Veja funcionando", logo antes da chamada final. Ele mostra os projetos do tour que provam aquele serviço e a página que costuma vir depois. Exemplo, em Loja virtual: VOKE WEAR, Maktub Conquista e Bendita → "O que pesa no valor de uma loja".

## 6. Outras correções

- A fileira das portas em 3D passou a ficar centrada para onde a câmera olha. No celular ela aparecia deslocada para a direita.
- `index.md` (a versão em texto do site, para buscadores e IAs) foi atualizado com a nova estrutura.
- O SorrIA entrou na lista de produtos por assinatura do "Como trabalhamos".

## 7. Verificação

Todos os aceites rodaram contra o build de produção (`npm run build`, com prerender):

| Aceite | Resultado |
|---|---|
| `aceite-home.mjs` | 104/104 |
| `aceite-menu.mjs` (novo) | 20/20 |
| `aceite-fluxos.mjs` | 25/25 |
| `aceite-portas.mjs` | 65/65 |
| `aceite-revender.mjs` | 71/71 |
| `aceite-rolagem.mjs` | 25/25 |
| `aceite-limpeza.mjs` | 0 telas com falha em 51 (17 telas × 3 tamanhos) |

Testes novos ou reescritos nesta rodada:

- **Recepção:** o boneco de pé na abertura; o balão cabe na tela sem cobrir texto nem botões no celular, no celular baixo (360×640) e no computador; some quando o passeio começa; clicar nele começa o tour.
- **Tour:** "Começar o tour" leva ao primeiro projeto em leitura, com a barra do guia.
- **Ala 02:** ordem nova das portas, os três passos e a saída "Meu caso é outro".
- **Menu:** as 22 páginas internas com o menu do site; o painel lista os 39 links; nada fica fora; abre e fecha no celular e no computador; área de toque de 40 px ou mais.
- **Próximo passo:** o bloco "Veja funcionando" existe em todas as páginas e só aponta para obras e páginas que existem.

### Quadros por segundo (`testes/medir-fps.mjs --vezes=3`, publicado × novo)

| Situação | Abertura | VOKE em leitura | Entrada da Ala 02 | Porta de manutenção (telas) |
|---|---|---|---|---|
| Celular, CPU 6× mais lenta | 49,2 → 40,7 (−17%) | 126,7 → 125,2 | 107,8 → 102,9 (−5%) | 71,2 → 67,8 (−5%) |
| Computador, CPU 6× mais lenta | 30,2 → 32,9 (+9%) | 29,2 → 25,2 (−14%) | 41,2 → 33,4 (−19%) | 20,9 → 19,6 (−6%) |
| Celular sem placa de vídeo (caso extremo) | 2,08 → 2,07 | 2,31 → 2,40 | 2,73 → 2,84 | 1,08 → 1,11 |

O desenho não ficou mais pesado (sem placa de vídeo, igual ou melhor). Com a CPU freada, alguns pontos caíram até 19%. Parte é custo real: são 3 quadros a mais no corredor e o balão é posicionado a cada quadro. Parte é ruído: esta rodada inteira mediu abaixo da de 13/11 na mesma máquina, que estava ocupada.

Dois problemas que os testes pegaram e foram corrigidos antes do checkpoint:

- A régua da Ala 01 quebrava em duas linhas no celular de 360 px (o texto "12 projetos" é mais longo).
- Os títulos clicáveis do painel do menu tinham menos de 40 px de altura para o toque.

## 7b. Rodada de 15–16/11: narrativa das páginas internas

Li as 22 páginas. O corpo já seguia um roteiro (dor → o que vem → como funciona → regra da casa → perguntas → chamada). Reescrevi onde a narrativa perdia o visitante:

| Frente | Antes | Depois |
|---|---|---|
| Abertura das 16 páginas de serviço | Botão único "Conversar no WhatsApp" e a nota "Primeira conversa sem compromisso" | O botão diz o que a pessoa faz, a nota diz o que ela recebe de volta, e um segundo botão leva a um projeto no ar. Exemplo em Sites: "Mandar o que eu tenho hoje" · "Eu devolvo três coisas que mudaria primeiro" · "Ver três sites no ar" |
| Prova em Loja virtual | Só a VOKE | Três lojas: VOKE WEAR, Maktub Conquista e Bendita |
| Prova em Sites | "Este site" | Três clientes (Studio TechTrainer, Alves & Oliveira, Besten) e este site |
| Página de clínicas | SorrIA como promessa, sem cliente | Alves & Oliveira como site no ar e SorrIA como sistema em operação |
| Sistemas, automação e marketing | Sem exemplo no ar | SorrIA e Horaqui em sistemas; agendamento do TechTrainer e Horaqui em automação; vídeos de clientes em marketing |
| Índice de guias | "Três guias" | Quatro guias (faltava o do sistema do nicho) |
| Primeira tela no computador | Título em seis linhas, botões fora da tela | Botão principal à vista sem rolar, em 1440×900 e 1366×768 |

Não mexi em "Como funciona", "A regra da casa", perguntas frequentes nem nas chamadas finais: já eram específicas de cada serviço. O endereço e a mensagem do WhatsApp de cada página não mudaram.

O `aceite-menu.mjs` passou a ter 22 verificações: as 16 aberturas com duas ações e a oferta na nota, e o botão principal na primeira tela.

Bateria completa no build desta rodada (16/11): home 104/104 · menu 22/22 · fluxos 25/25 · portas 65/65 · revender 71/71 · rolagem 25/25 · limpeza 0 falhas em 51. Publicado em 16/11/2026, com o "pode publicar" do Victor.

## 7c. Rodada de 18/11: o SorrIA por dentro

Decisões do Victor (17/11): capturar as telas rodando o SorrIA em local, com uma clínica de demonstração; e **não afirmar** que a Alves & Oliveira usa o SorrIA.

- O SorrIA não subia em local: as chaves do `.env.local` continuam por preencher. Em vez de usar chaves de produção, subi um banco local só para a demonstração (Supabase no WSL, pasta `~/sorria-demo`, portas 58321 e 58322) e um `.env.development.local` no projeto, que só vale no `npm run dev`.
- Criei a clínica fictícia "Clínica Aurora Odontologia", com 8 pacientes, 7 consultas, 5 contatos, 7 lançamentos e 8 materiais, todos inventados. Nenhum dado de clínica real foi aberto e nada foi gravado no banco de produção.
- O quadro do SorrIA passou a mostrar quatro telas do sistema: agenda, funil de contatos, financeiro e estoque. Antes mostrava a tela de entrada e um trecho do site da Alves & Oliveira, que saiu.
- O quadro da Alves & Oliveira deixou de ter o link "Ver o SorrIA".
- O banco local foi desligado no fim (os dados ficam guardados). Para religar: no WSL, `cd ~/sorria-demo && supabase start`; no Claude, o servidor `sorria-demo` (porta 3900).

Aceites no build: home 104/104 · menu 22/22 · rolagem 25/25.

**Publicado em 18/11/2026**, com o "pode publicar" do Victor (deploy `a483c06`, build de `2cc8e22`).

- Bateria completa no build publicado: home 104/104 · menu 22/22 · fluxos 25/25 · portas 65/65 · revender 71/71 · rolagem 25/25 · limpeza 0 falhas em 51.
- Em produção (maintorflow.com.br): home 104/104 · menu 22/22 · revender 71/71 · rolagem 25/25.
- A trava do deploy pegou o `_capturas.json` (diário do `capturar-rolagem.mjs`) dentro de `public/midia/rolagem/`: ele ia para o site desde 16/11 com o endereço provisório de um site capturado. Passou para `testes/rolagem-capturas.json` e o endereço antigo responde 404.
- Fica em aberto: o GitHub Pages serve o repositório inteiro, então a pasta de trabalho `site/` (fontes e testes) também responde em `maintorflow.com.br/site/...`. Nada no site aponta para lá, mas é acessível por quem souber o caminho. Tirar isso pede mudar a forma de publicar (ramo ou Actions só com o build).

## 8. Pontos para o Victor conferir

1. **Frase da Alves & Oliveira.** Decidido em 17/11: não afirmar que a clínica usa o SorrIA. O site descreve só o que aparece no site dela.
2. **Telas de dentro do SorrIA.** Resolvido em 18/11 (seção 7c). Falta só a tela da simulação de sorriso, que gasta crédito de IA e precisa de foto.
3. **Site da Alves & Oliveira sem link externo.** Ele ainda está num endereço provisório. O botão do quadro leva à página "Site para clínicas". Quando o domínio da clínica estiver no ar, entra o "Visitar site".
4. **Textos das páginas internas.** Reescritos na rodada de 15–16/11 (seção 7b).
