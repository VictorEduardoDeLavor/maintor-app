# Site da Maintor Flow — maintorflow.com.br

Site da marca de **serviços** da MAINTOR TECNOLOGIA LTDA: sites, lojas
virtuais, marketing, automação de atendimento e sistemas sob medida para
pequenos negócios.

> ⚠️ Este repositório é público. Nada de segredo, preço fechado, dado de
> cliente ou informação interna aqui.

## Como mexer

A fonte fica em **`site/`** (Vite + React + React Three Fiber + GSAP + Lenis),
no ramo `main`. O que vai ao ar fica no ramo **`gh-pages`**, que guarda só o
build e é o único que o GitHub Pages serve. Não edite o `gh-pages` à mão: ele
é sobrescrito a cada publicação.

```bash
cd site
npm install
npm run dev            # servidor de desenvolvimento
npm run build          # gera site/dist (com prerender)
npm run publicar       # travas de conteúdo + cópia para a pasta do ramo gh-pages
                       # (../maintor-app-publicado, criada na primeira vez)
git -C ../../maintor-app-publicado add -A
git -C ../../maintor-app-publicado commit -m "deploy: … (build de <hash>)"
git -C ../../maintor-app-publicado push origin gh-pages   # GitHub Pages publica
```

## Design system

`site/MASTER.md` é a fonte única de verdade: paleta (verde petróleo `#1F4747`
e profundo `#143535`, mostarda `#D4A574` só como acento pela regra 60-30-10,
creme `#FAF7F2`), tipografia (DM Serif Display itálico + Inter), espaçamento
e tokens de movimento. Nada de valor mágico fora dele.

## Conteúdo com regra

`site/src/dados.js` guarda depoimentos e telas dos sistemas. **Lista vazia =
seção não renderiza.** Nunca preencher com exemplo ou texto fictício: só
entra prova real e autorizada.

## Armadilhas já pagas (não repetir)

- O `manualChunks` como objeto arrastava o React para o chunk do three.js e
  ~958KB entravam no caminho crítico. Hoje é função: `vendor` (React/GSAP) e
  `three` (3D, carregado só quando o canvas monta).
- O React Three Fiber escreve `pointer-events: auto` inline no canvas e no seu
  wrapper. Sem `#canvas-root, #canvas-root * { pointer-events: none !important }`
  o canvas cobre a página e **engole os cliques do formulário**.
- `og:image` é **JPG** de propósito: o WhatsApp não renderiza WebP em preview,
  e o link é compartilhado por lá.
- O certificado HTTPS do domínio já falhou uma vez; o conserto é rebater o
  domínio custom na API do Pages.
