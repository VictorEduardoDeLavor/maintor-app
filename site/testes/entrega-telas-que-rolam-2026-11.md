# Telas que rolam + imagens e textos das Alas 01 a 04 — relatório de entrega (12/11/2026)

Pedido do Victor: "melhorar as imagens e conteúdos que aparecem a partir da Ala 3", "as telas que vamos ajustar são da Ala 1 e 2 também" e "as páginas dos sites que criamos tenham uma rolagem automática nas telas mostrando eles".

Decisões dele (12/11):

- **Ala 02:** a porta e a sala continuam com a foto do problema. O quadro mostra a solução real, rolando.
- **Ala 03:** telas reais. Caminho 1 com os sistemas; Caminho 2 com o Maintor FIT de um profissional, com a marca dele.
- **Tráfego pago:** página real de produto, marcada como "exemplo de página de destino". Nenhum resultado de campanha inventado.
- **Textos:** mais curtos da Ala 03 em diante, com a prova real primeiro.

Base publicada antes do trabalho: deploy `a3829cd`. Publicado em 13/11/2026, com o "pode publicar" do Victor.

## 1. Como funciona

Cada quadro com tela real tem duas imagens:

- **Primeira tela:** fica na parede.
- **Faixa alta:** só baixa quando quem anda começa a virar o rosto para o quadro.

Em leitura, a faixa corre dentro do quadro de dois jeitos:

- **Página:** um site no ar desce devagar, para no topo e no fim, e volta.
- **Telas:** passa de uma tela para a outra, como um carrossel, com 2,6 s em cada uma.

Longe, a faixa é descartada e volta a primeira tela. Nunca há mais de 2 faixas na memória, nem no celular.

A imagem é decodificada fora da tela principal antes de virar textura, para não dar tranco quando chega. Celular: faixa de 640 px de largura. Computador: 960 px.

As imagens são geradas por `testes/capturar-rolagem.mjs`, que entra no site no ar, rola, costura e salva em `public/midia/rolagem/`. Regras da captura:

- Esconde banners de cookie.
- Esconde selos da plataforma dos apps.
- Desfoca os preços dos produtos da Maintor (CMMS, FIT, Horaqui).

Sites com seções presas na rolagem (TechTrainer, FIT, Horaqui) viram "telas": 6 telas escolhidas à mão, sem repetir seção.

## 2. O que mudou em cada quadro

| Ala · quadro | Antes | Depois |
|---|---|---|
| 01 · VOKE WEAR | print parado da home | home da loja rolando |
| 01 · Bendita | print parado da home | home da loja rolando |
| 01 · Besten | tela do portal interno | site institucional rolando (o portal está na porta 07) |
| 01 · Studio TechTrainer | print parado | 6 telas do site |
| 01 · Maintor CMMS | painel do sistema | site do CMMS rolando, sem preço (as telas do sistema estão na porta 04) |
| 01 · Maintor FIT | print parado do site | 6 telas do site, sem preço |
| 01 · Horaqui | print parado | 6 telas do site, sem preço |
| 01 · Maintor RH / Task | 1 tela de demonstração cada | 2 telas de demonstração cada |
| 02 · Porta 01 Vender online | foto ilustrativa | página de produto da Bendita rolando |
| 02 · Porta 02 Minha empresa | foto ilustrativa | página de serviços da Besten rolando |
| 02 · Porta 03 Atendimento | foto ilustrativa | **sem mudança**: não há projeto real de atendimento para mostrar |
| 02 · Porta 04 Manutenção | foto ilustrativa | 5 telas do Maintor CMMS (painel, OS, calendário, histórico, estoque) |
| 02 · Porta 05 RH | foto ilustrativa | 2 telas do Maintor RH |
| 02 · Porta 06 Novos clientes | foto ilustrativa | feed de posts autorais do @maintorflow rolando |
| 02 · Porta 07 Consultoria | 1 tela do portal da Besten | 3 telas do portal (nomes de projeto desfocados, como antes) |
| 03 · Caminho 1 | relatório do Task | 5 telas: CMMS, Task, RH, portal da Besten, calendário do CMMS |
| 03 · Caminho 2 | foto ilustrativa (homem com celular) | 4 telas do app do FIT de um personal de demonstração, em pé |
| 04 · Conteúdo e redes | 1 post parado | 4 posts autorais passando |
| 04 · Tráfego pago | foto ilustrativa | página de produto da VOKE rolando, como "exemplo de página de destino" |
| 04 · Vídeos | — | sem mudança |

Nas Alas 02, 03 e 04, a porta e a sala continuam com a foto do problema. Só o quadro em leitura mostra a solução real.

Posts deixados de fora do feed e do carrossel:

- 9 e 14: o assunto é preço.
- 17: Natal já passou.
- 21 e 23: têm R$ da Flow.

## 3. Textos (antes → depois)

| Onde | Antes | Depois |
|---|---|---|
| Ala 03 · abertura | Escolha o caminho que faz sentido para você. Podemos desenvolver um sistema para organizar o trabalho da sua equipe ou criar um software para você oferecer aos seus clientes. | Organize o trabalho da sua equipe ou ofereça aos seus clientes um software com a sua marca. |
| Caminho 1 | Desenvolvemos um sistema em torno do seu processo, com os controles, indicadores e permissões de que sua equipe precisa. Referências: Maintor CMMS, Maintor RH, Maintor Task e o portal da Besten. | Sistemas feitos em torno do processo da equipe, com controles, indicadores e permissões. Foi assim que nasceram o Maintor CMMS, o Maintor RH, o Maintor Task e o portal da Besten. |
| Caminho 2 | Transforme seu método ou a rotina do seu nicho em um aplicativo que você pode oferecer aos seus clientes com a sua marca. Referência: o Maintor FIT, app de treino com a marca do profissional. A mesma ideia pode servir a salões, consultorias e outros nichos. | Seu método vira um aplicativo com a sua marca, para oferecer aos seus clientes. É o modelo do Maintor FIT: cada profissional usa o app com o próprio nome e as próprias cores. |
| Ala 04 · abertura | Criamos materiais para apresentar seu produto e direcionar o público para sua loja, seu site ou seu canal de atendimento. | Conteúdo, vídeos e campanhas que levam o público até a sua loja, o seu site ou o seu WhatsApp. |
| Conteúdo e redes | Planejamento, artes, legendas e publicação para apresentar sua marca e manter uma rotina de conteúdo. | Planejamento, artes, legendas e publicação: uma rotina de conteúdo para a sua marca. |
| Tráfego pago | Campanhas no Google e na Meta com criativos, página de destino e acompanhamento da ação que interessa ao negócio. | Campanhas no Google e na Meta, com criativos, uma página de destino preparada e o acompanhamento do que vira contato. |

As notas abaixo dos quadros trocaram "Imagem ilustrativa" por "Na tela, …", dizendo o que está sendo mostrado. Exemplo: "Na tela, o Maintor CMMS com uma empresa de demonstração."

## 4. Dois defeitos antigos corrigidos de passagem (computador)

1. **Legendas longas atrás do cabeçalho.** A legenda era centrada duas vezes e terminava sempre no meio da tela. As longas subiam para baixo do cabeçalho:
   - Porta 07 Consultoria: começava em −89 px, com o título fora da tela.
   - Porta 01 Vender online: começava em −20 px.
   - Caminho 2: começava em 32 px.

   Agora sobem no máximo até 84 px do topo. As curtas não mudaram de lugar. A produção atual tem esse defeito.
2. **Quadro em pé estourando a altura.** Antes não havia quadro em pé. O do Caminho 2 passou a caber entre o cabeçalho e a barra do guia, com um limite de altura que só afeta quadros em pé.

## 5. Verificação

Todos os aceites rodaram contra o build de produção (`npm run build`, com prerender):

| Aceite | Resultado |
|---|---|
| `aceite-rolagem.mjs` (novo) | 25/25 |
| `aceite-home.mjs` | 99/99 |
| `aceite-limpeza.mjs` | 0 telas com falha em 48 (16 telas × 3 tamanhos) |
| `aceite-portas.mjs` | 65/65 |
| `aceite-fluxos.mjs` | 18/18 |
| `aceite-revender.mjs` | 71/71 |

O `aceite-rolagem` confere:

- as 4 imagens servidas em cada uma das 18 faixas;
- que a faixa anda no celular e no computador, nos modos página e telas;
- que cada parada do modo telas cai no topo de uma tela;
- que há no máximo 2 faixas na memória, e nenhuma depois de voltar ao topo;
- que o quadro em pé cabe entre o cabeçalho e a barra do guia;
- as 21 legendas entre o cabeçalho e a barra do guia;
- que não há erro de página.
