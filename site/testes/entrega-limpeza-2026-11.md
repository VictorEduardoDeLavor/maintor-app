# Limpeza visual da exposição 3D — relatório de entrega (novembro de 2026)

Pedido: seção 3 de `prompt-melhoria-site-flow-fable52.md` (limpeza visual, fases 0 a 5).
Base publicada antes do trabalho: deploy `df0f817`. Trabalho em commits locais, **sem push e sem deploy**: a publicação depende do "pode publicar" do Victor.

## 1. Resultado em números

### Aceite da limpeza (`testes/aceite-limpeza.mjs`, contra o build de produção)

As 11 telas do pedido foram medidas em três tamanhos e em três posições de rolagem:

- **Leitura:** o bloco na zona de leitura.
- **Transição:** o título entrando, a 58% da tela.
- **Entrada:** o título surgindo pela borda de baixo, a ~88%.

Depois da revisão independente, entraram mais 5 telas de obra em leitura, com o quadro em foco e a barra do guia à vista. São 16 telas e 34 estados por tamanho.

| Verificação | 390×844 antes → depois | 360×740 antes → depois | 1440×900 antes → depois |
|---|---|---|---|
| As 11 telas do pedido com alguma falha | 11 → 0 | 11 → 0 | 11 → 0 |
| As 5 obras em leitura com alguma falha | — → 0 | — → 0 | — → 0 |
| 1. Fundo calmo (blocos com falha, 11 telas) | 60 → 0 | 64 → 0 | 60 → 0 |
| 2. Contraste abaixo de 4,5:1 (11 telas) | 60 → 0 | 61 → 0 | 46 → 0 |
| 3. Colisão com boneco ou texto 3D (11 telas) | 52 → 0 | 53 → 0 | 46 → 0 |
| 4. Barra do guia fora de hora (estados) | 14 → 0 | 14 → 0 | 14 → 0 |
| 4. Barra do guia sobre botão (5 estados com a barra à vista) | — → 0 | — → 0 | — → 0 |
| 5. Réguas em duas linhas | 4 → 0 | 4 → 0 | 0 → 0 |
| 6. Botões da abertura na primeira tela do iPhone | 2º botão cortado → inteiros | — | — |

A coluna "antes" vem da linha de base da Fase 0 (11 telas, duas posições). Nessa época as obras e a posição de entrada ainda não eram medidas.

Folga no depois, nos 48 casos (16 telas × 3 tamanhos):

| Medida | Pior valor | Limite |
|---|---|---|
| Contraste | 5,17:1 | 4,5:1 |
| Desvio do fundo | 8,5 | 12,7 (no 390) |
| Densidade de bordas | 0,09% | 1,2% |

O item 6 cobre quatro casos: 390×700; 390×664, a tela visível com as barras do navegador; o Safari do iPhone (página de 750 px, 664 visíveis); e o Chrome do iPhone (790 px, 666 visíveis), medido no print do Victor.

### Os outros testes (contra o build)

| Teste | Resultado |
|---|---|
| `aceite-home.mjs` | 99 de 99 |
| `aceite-revender.mjs` | 71 de 71 |
| `aceite-portas.mjs` (novo) | 65 de 65 |
| `aceite-fluxos.mjs` (novo) | 18 de 18; contra a versão anterior às correções, 13 falhas |
| Trava de preço (R$, "a partir de") no texto visível da home | 0 ocorrências |
| Trava da plataforma dos apps no texto visível da home | 0 ocorrências |
| Versão sem 3D (movimento reduzido), celular e computador | completa: 21 obras, 7 portas, 7 perguntas, formulário, sem erro de JavaScript |

O `aceite-portas.mjs` toca nas 7 portas no celular e no computador:

- confere sala, "Porta 0X de 07", frase e WhatsApp com o assunto de cada porta;
- confere a saída por Voltar e por Esc, as setas e os botões ‹ ›, e o toque ou clique nas portas em 3D;
- confere que nenhuma placa passa atrás do texto enquanto as portas sobem.

O `aceite-fluxos.mjs` refaz os oito cenários que a revisão independente achou quebrados (seção 3).

### Peso e desempenho

| Medida | Publicado (`df0f817`) | Depois | Variação |
|---|---|---|---|
| JS do 3D em gzip (three + Exposicao) | 169,7 KB | 172,6 KB | +1,7% (teto do pedido: +10%) |

Quadros por segundo (`testes/medir-fps.mjs`). As duas versões são medidas intercaladas, na mesma rodada, com a mesma qualidade e nos mesmos pontos:

| Situação · tela | Publicado | Depois | Variação |
|---|---|---|---|
| CPU 6× mais lenta · celular · abertura | 61,4 | 59,1 | −4% |
| CPU 6× mais lenta · celular · obra em leitura (VOKE) | 64,0 | 140,7 | +120% |
| CPU 6× mais lenta · celular · entrada da Ala 02 | 51,4 | 148,0 | +188% |
| CPU 6× mais lenta · computador · abertura | 33,4 | 36,2 | +8% |
| CPU 6× mais lenta · computador · obra em leitura (VOKE) | 25,6 | 27,9 | +9% |
| CPU 6× mais lenta · computador · entrada da Ala 02 | 27,6 | 44,6 | +62% |
| Sem placa de vídeo · celular · abertura | 1,9 | 2,2 | +16% |
| Sem placa de vídeo · celular · obra em leitura (VOKE) | 2,0 | 2,4 | +22% |
| Sem placa de vídeo · celular · entrada da Ala 02 | 1,1 | 3,1 | +184% |

- **Como ler:** com a CPU lenta vale a mediana de 5 rodadas; sem placa de vídeo, uma rodada. Os valores absolutos mudam com a carga da máquina, mas a comparação na mesma rodada se mantém.
- **A queda:** a única é a abertura do celular (−4%), dentro da oscilação de cerca de ±10% de uma rodada isolada.
- **De onde vêm os ganhos:** do modo LER, do saguão e das paredes que se recolhem com uma obra em leitura. Em todos esses casos o 3D desenha menos enquanto o texto está na tela.
- **A faixa da abertura do celular:** uma primeira versão, com desfoque, custava −7%. Ficou opaca, sem desfoque.
## 2. O que mudou, por fase

| Fase | Commit | O que mudou |
|---|---|---|
| 0 · Medir | `f676eba` | `aceite-limpeza.mjs` e a linha de base (33 de 33 telas com falha) |
| 1 · Abertura no celular | `4e822c3` | Três faixas na primeira tela: no alto o letreiro e o logo 3D (a câmera olha para o pórtico); no meio o texto ancorado pelo topo sobre fundo calmo; embaixo, à direita, o boneco. O selo sai. Os dois botões cabem com as barras do navegador à vista. |
| 2 · Transições entre alas | `abff163` | Modo LER: enquanto um título de ala ou de grupo é lido, os quadros se recolhem na parede, as luzes baixam e o boneco muda de faixa. Respiro: o quadro anterior volta antes do título e o próximo só se solta depois. Barra do guia só com obra em foco. Réguas com rótulo curto no celular. Abertura do computador sem selo e com fundo calmo. |
| 3 · Saguão das 7 portas | `3c4f959`, `a7bb58f` | Título e lista lidos em fundo calmo. As portas sobem depois, num trecho de rolagem só delas, a 10 m de quem chega. Lista em grade de 2 colunas em painel de vidro no celular. No computador a legenda acompanha o quadro em foco. O segundo commit dá folga às medidas que passavam rente ao limite. |
| 4 · Como trabalhamos, Perguntas, Contato | `92e7b06` | As três seções em modo LER. No computador, texto e régua numa coluna de 700 px; à direita o boneco e a peça da ala, com foco próprio. No celular as peças se recolhem durante a leitura. |
| 5 · Verificação final | (este commit) | Objetos que a névoa já apagou deixam de ser desenhados (além de 150 m). A faixa da abertura do celular ficou opaca, sem desfoque. Correções da revisão independente (seção 3). O medidor ficou mais rigoroso. Novos `aceite-fluxos.mjs` e `medir-fps.mjs`, prancha final e este relatório. |

## 3. Revisão independente (Fase 5)

Quatro revisores, só leitura, cobriram quatro frentes: lógica da cena 3D, layout e acessibilidade, regras da casa, e os próprios testes. Cada achado passou por um verificador encarregado de refutá-lo. Resultado: 16 confirmados e 17 descartados. Os 16 foram resolvidos:

| Achado confirmado | Gravidade | Correção |
|---|---|---|
| Entrando numa sala pela lista de portas, a sala ficava presa no modo LER: escura e enevoada | alta · regressão | O modo LER virou a função `aplicarLer`; a sala sempre a chama com os valores da galeria acesa |
| `.regua { white-space: nowrap }` valia para o site todo e cortava a régua das páginas de serviço no celular | alta · regressão | A regra saiu; os rótulos curtos bastam. Abaixo de 360 px a régua volta a quebrar, legível |
| Link direto `/#contato` podia parar ~1,4 tela acima do formulário: as margens novas só entravam depois que o 3D carregava | média · regressão | As regras de layout passam a valer desde o primeiro quadro (`html:not(.sem-3d)`), e o salto é refeito quando a cena fica pronta, se a pessoa ainda não rolou |
| Com o painel "Qual é o seu problema?" aberto, o boneco sumia no passeio inteiro | média · regressão | Ele só sai de cena enquanto o painel está na tela |
| No computador, o Tab podia focar um link dentro de uma legenda invisível | média · regressão | Com o foco dentro, a legenda aparece (`:focus-within`) |
| Virar o aparelho depois de abrir a página deixava o letreiro do outro modo atrás do título | baixa · regressão | Dois letreiros, um por orientação. Letreiro, totem e foco do pórtico seguem a orientação atual |
| As setas ← → do guia só funcionavam com obra em foco, e a barra ficava `aria-hidden` com o foco dentro | baixa · regressão | As setas valem em toda a faixa das obras; com o foco dentro, a barra continua à vista |
| Mouse do lado direito girava a câmera e levava o boneco para trás do texto | baixa · já existia | Na abertura e no modo LER o mouse quase não gira o olhar |
| Entre 821 e ~1250 px de largura, a coluna de 700 px chegava à faixa do boneco | baixa · já existia | A coluna é no máximo 56% da tela |
| No tablet em pé, a barra do guia cobria os botões da legenda | baixa · já existia | Recuo para a barra também entre 701 e 820 px |
| O medidor não contava as obras em leitura (em 360×740 a legenda cobria a base do quadro) | teste | Cinco obras em leitura entram no veredito. No celular o quadro cabe entre o cabeçalho e a legenda; as paredes atrás da legenda se recolhem |
| A barra do guia nunca era medida visível; faltava a rampa de entrada dos títulos | teste | Obras em foco e a posição "entrada" (título a ~88% da tela) foram acrescentadas. A entrada mostrou que o modo LER ligava tarde e o título surgia sobre o chão aceso; agora liga quando o título encosta na borda de baixo |
| Um teste do saguão era tautológico | teste | `aceite-portas` amostra a subida das portas (base da lista a 30, 22, 15 e 10% da tela) e confere que nenhuma placa passa atrás do texto |
| A calibração do fundo calmo podia usar blocos ruins da referência | teste | Só calibra com os blocos que passam em contraste e colisão |

Cada regressão ganhou um teste em `testes/aceite-fluxos.mjs`. Rodado contra a versão anterior às correções (`92e7b06`), ele acusa 13 falhas; na versão atual, nenhuma.

## 4. Decisões tomadas (escolhidas pelo Victor nos checkpoints)

| Regra | Escolha | Alternativa descartada |
|---|---|---|
| R5 · uma marca por tela | Tirar o selo "Maintor Flow · portfólio"; o logo 3D assina a abertura | Manter o selo (em 360×740 o 2º botão ficava sobre o boneco) |
| R3 · boneco fora do texto | Celular: canto de baixo, à direita, na abertura e nas cabeças de ala; sai de cena quando o canto está ocupado ou há legenda aberta. Computador: faixa da direita. | Sair de cena em toda leitura |
| R8 · lista das 7 portas | Grade de 2 colunas em painel de vidro | Uma coluna sem painel (o último botão encostava no fim da tela) |

## 5. Mudanças que vão além do pedido

Foram feitas porque eram a causa de uma falha medida, e precisam do olhar do Victor.

| Mudança | Por quê |
|---|---|
| Alcance da câmera de 160 para 340 m e parede no fim do corredor | Além de 160 m nada era desenhado; aparecia a cor de fundo sem névoa, um retângulo claro atrás do texto em quase todas as telas |
| Névoa dos halos das luminárias leva ao preto | Num material aditivo a névoa somava verde; os 16 halos empilhados formavam um borrão claro no fundo |
| Logo 3D do computador some depois da abertura | Reaparecia gigante atrás das legendas das primeiras obras |
| Legenda das obras no computador só com a obra em foco | Antes entrava rolando sozinha, sobre as portas ou sobre os quadros da parede (no celular já era assim) |
| Abertura do computador sem selo | Mesma regra R5 aplicada ao computador |
| Rótulo da lista de portas: "Escolha aqui ou nas portas, logo à frente" | O texto anterior, "Clique numa porta ou escolha aqui", pressupunha as portas já de pé |
| Rótulos curtos de régua no celular: "Ala 02 · Soluções", "4 etapas", "7 respostas", "Sem compromisso" | R7: a régua cabe em uma linha em 360 px. O rótulo inteiro continua no computador. |
| Rolagem a mais: ~1,2 tela no saguão e respiros de 14 a 16% de tela entre título e obras | É o tempo para o 3D sair antes do título e entrar depois dele |
| No celular, o quadro em leitura encolhe para caber inteiro entre o cabeçalho e a legenda | Nas legendas altas (portas, em 360×740) o quadro fica pequeno, mas a legenda não cobre mais a base dele |
| Com uma obra em leitura, os quadros da parede atrás da legenda se recolhem (celular: as duas paredes) | Antes a legenda ficava sobre outras telas de sistema penduradas na parede |
| Na abertura do celular, a faixa escura atrás do texto ficou opaca, sem desfoque | O desfoque custava ~7% dos quadros por segundo num aparelho de CPU lenta |

## 6. Pendências

1. **Peças das alas no celular:** degraus, nó e balão não aparecem durante a leitura de Como trabalhamos, Perguntas e Contato, porque não há faixa livre. A alternativa é meia tela de rolagem só com a peça, antes de cada seção.
2. **Computadores menores:** o aceite mede 1440×900; 1366×768 e 1280×720 não foram medidos. O tablet em pé (768×1024) é conferido pelo ceite-fluxos.
3. **Aparelho real:** desempenho e aparência do modo LER (bem escuro) foram vistos só em navegador automatizado. Vale abrir no celular antes de divulgar.
4. **Cliques depois da sala:** são ignorados por ~1,1 s depois de sair de uma sala, enquanto a cortina abre. Já era assim antes do trabalho.

## 7. Como rodar de novo (na pasta `site/`)

```bash
npm run build
node testes/aceite-limpeza.mjs --dist=1 --rotulo=depois
node testes/aceite-portas.mjs
node testes/aceite-fluxos.mjs
node testes/medir-fps.mjs --vezes=5
node testes/prancha-antes-depois.mjs --de=antes --para=depois --grade=1
node testes/gravar-rolagem.mjs --rotulo=depois --ate=#problemas
```

`aceite-home.mjs`, `aceite-revender.mjs`, `aceite-portas.mjs` e `aceite-fluxos.mjs` rodam contra o build servido em `localhost:4175` (variável `BASE`). As saídas ficam em `testes/limpeza/`, fora do git.

## 8. Para publicar (só com "pode publicar")

1. `git status` limpo.
2. Porta 4321 livre.
3. `npm run build`, conferindo "prerender: … KB injetados".
4. `node deploy-root.mjs`.
5. Conferir que as outras páginas só trocam o hash do CSS.
6. Commit "deploy: … (build de <hash>)" e push. O GitHub Pages publica em cerca de 1 minuto.
