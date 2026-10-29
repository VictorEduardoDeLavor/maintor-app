"""Página /para-consultorias/ (29/10/2026): consultoria contrata a construção e ganha com
revenda ou com implementação + mensalidade. Montada sobre o HTML de /sistema-para-revender/
(mesmo cabeçalho, rodapé e CSS). Rodar de novo regrava a página.
Regras: nenhum preço da Flow (valor na proposta); números de exemplo são do CLIENTE e vêm
marcados "não é promessa"; provas reais (Besten, Task, CMMS) com nomes desfocados."""
import io, os, re, json
from urllib.parse import quote

SITE = "C:/dev/maintor-app/site/"
BASE = io.open(SITE + "sistema-para-revender/index.html", encoding="utf-8").read()
WA_MAE = "Ol%C3%A1!%20Vim%20pela%20p%C3%A1gina%20de%20sistema%20para%20revender.%20Quero%20conversar%20sobre%20um%20sistema%20do%20meu%20nicho."
ROTA = "/para-consultorias/"
URL = "https://maintorflow.com.br" + ROTA
WA = "https://wa.me/5511946610634?text=" + quote("Olá! Sou de uma consultoria e vim pela página para consultorias. Quero conversar sobre um sistema para os meus clientes.", safe="")

cab = BASE[:BASE.index('<script type="application/ld+json">')]
header = BASE[BASE.index('<body class="pagina">'):BASE.index('<main id="conteudo">')]
footer = BASE[BASE.index("</main>"):]

TITULO = "Sistema para consultoria: venda tecnologia ao seu cliente com implementação e mensalidade | Maintor Flow"
DESC = "A gente constrói o sistema da sua consultoria, no seu nome: você implanta nos clientes e cobra implementação e mensalidade — ou revende os nossos sistemas. Construção em compra única."
OG_T = "Para consultorias — Maintor Flow"
OG_D = "Sua consultoria vende tecnologia; a gente constrói nos bastidores. Implementação e mensalidade são suas."

FAQ = [
 ("O meu cliente vai saber que quem construiu foi a Maintor?", "Não precisa saber. O sistema sai com a marca, o domínio e as cores da sua consultoria. Se você quiser sigilo sobre quem construiu, isso entra no contrato."),
 ("Quem atende o meu cliente quando der problema?", "Você, no primeiro contato — é a sua relação com ele. A parte técnica fica com a gente, no serviço contínuo de operação, que é opcional e tem valor próprio."),
 ("Preciso entender de tecnologia?", "Não. Você entende do método e do cliente; a gente entende do sistema. Entregamos treinamento e um roteiro de implantação para a sua equipe aplicar em cada cliente."),
 ("Posso começar com um cliente só?", "Pode — e é o jeito mais seguro. O sistema nasce pronto para muitos clientes, cada um no seu espaço, mas a primeira implantação é a que mostra o que ajustar antes de escalar."),
 ("Quanto custa?", "A construção é compra única, com o valor fechado na proposta, depois de uma conversa — depende do que o sistema precisa fazer. Na revenda dos nossos sistemas, as condições são combinadas na parceria."),
]

def faq_ld():
    return json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}, ensure_ascii=False)

def img(nome, alt, sizes="(max-width: 900px) 92vw, 600px", eager=False):
    return ('<figure class="pg-fig pg-foto"><img src="/midia/portfolio/%s-720.webp" srcset="/midia/portfolio/%s-720.webp 720w, /midia/portfolio/%s-1280.webp 1280w" '
            'sizes="%s" width="1280" height="800" alt="%s" loading="%s" decoding="async"></figure>') % (nome, nome, nome, sizes, alt, "eager" if eager else "lazy")

MAIN = f'''  <section class="pg-hero">
    <div class="wrap pg-duas">
      <div>
        <p class="micro pg-eyebrow">Para consultorias · parceria</p>
        <h1 class="serif pg-h1">Sua consultoria vende tecnologia — <em>e a gente constrói nos bastidores.</em></h1>
        <p class="pg-lead">O seu cliente já confia em você para arrumar a gestão. Com um sistema no nome da sua consultoria, você cobra a implementação, recebe uma mensalidade de cada cliente — e o seu método deixa de depender só das suas horas.</p>
        <div class="pg-acoes">
          <a class="btn" href="{WA}" target="_blank" rel="noopener">Conversar no WhatsApp</a>
          <span class="nota">Primeira conversa sem compromisso · (11) 94661-0634</span>
        </div>
      </div>
      {img("besten-kpis", "Portal de uma consultoria parceira: indicadores de todos os projetos dos clientes, com os nomes desfocados", eager=True)}
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap">
      <div class="regua"><span class="micro">01 · Três jeitos de ganhar</span><span class="micro">Escolha um — ou combine</span></div>
      <h2 class="serif pg-h2">A consultoria acaba quando o projeto acaba. <em>O sistema continua cobrando.</em></h2>
      <div class="pg-tres">
        <div><span class="micro">Implementação + mensalidade</span><b>O sistema da sua consultoria</b><p>Indicadores, processos, manutenção, RH — o método que você aplica vira um sistema com a sua marca. Você implanta em cada cliente, cobra a implementação e uma mensalidade para ele seguir usando.</p></div>
        <div><span class="micro">Revenda</span><b>Os nossos sistemas, com a sua implantação</b><p>Maintor CMMS, Task e RH para os seus clientes, com a sua consultoria fazendo a implantação e o acompanhamento. As condições da revenda são combinadas na parceria.</p></div>
        <div><span class="micro">Projeto sob encomenda</span><b>O sistema que o seu cliente pediu</b><p>O cliente precisa de um portal, um controle ou um site? Você vende e entrega; a gente constrói nos bastidores, no prazo combinado com você.</p></div>
      </div>
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap">
      <div class="regua"><span class="micro">02 · O que você recebe</span><span class="micro">Para implantar em muitos clientes</span></div>
      <h2 class="serif pg-h2">Um sistema da sua consultoria, <em>com um espaço para cada cliente.</em></h2>
      <div class="linha-ed"><span class="idx">01</span><span class="rot">No nome da consultoria</span><span class="val">Marca, domínio e cores suas. O cliente vê a sua consultoria — não a nossa.</span></div>
      <div class="linha-ed"><span class="idx">02</span><span class="rot">Um espaço por cliente</span><span class="val">Cada empresa atendida com os próprios usuários e dados, sem ver as outras.</span></div>
      <div class="linha-ed"><span class="idx">03</span><span class="rot">Painel da consultoria</span><span class="val">Os indicadores de todos os clientes numa tela: quem está no prazo, quem atrasou, onde agir primeiro.</span></div>
      <div class="linha-ed"><span class="idx">04</span><span class="rot">Cobrança da mensalidade</span><span class="val">Pix ou cartão caindo na conta da consultoria, com aviso de vencimento para o cliente.</span></div>
      <div class="linha-ed"><span class="idx">05</span><span class="rot">Roteiro de implantação</span><span class="val">Treinamento para a sua equipe e um passo a passo para repetir a implantação em cada cliente novo.</span></div>
      <div class="linha-ed"><span class="idx">06</span><span class="rot">Código entregue</span><span class="val">Documentado, no nome da consultoria. É a regra da casa, em todo projeto.</span></div>
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap pg-duas">
      <div class="pg-texto">
        <div class="regua"><span class="micro">03 · A conta</span><span class="micro">O preço para o cliente é seu</span></div>
        <h2 class="serif pg-h2">Implementação paga o começo. <em>A mensalidade paga o resto.</em></h2>
        <p>Hoje a sua receita para quando o projeto termina. Com o sistema, cada cliente implantado vira uma mensalidade que continua — e o cliente segue perto da consultoria, olhando os indicadores que você montou.</p>
        <p><strong>Ninguém sério promete quantos clientes você vai fechar.</strong> O que dá para garantir é o sistema pronto para receber o primeiro — e o décimo, sem ser refeito.</p>
      </div>
      <aside class="pg-resumo">
        <span class="micro">Exemplo de conta — não é promessa</span>
        <ul>
          <li>Você cobra R$ 6.000 de implementação por cliente.</li>
          <li>E R$ 450 por mês para ele seguir usando.</li>
          <li>8 clientes: R$ 48.000 de implementação e R$ 3.600 por mês.</li>
          <li>Os valores para o seu cliente são decisão sua. Os números são só a multiplicação.</li>
        </ul>
      </aside>
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap pg-duas">
      <div class="pg-texto">
        <div class="regua"><span class="micro">04 · Como a gente cobra</span><span class="micro">Compra única, operação opcional</span></div>
        <h2 class="serif pg-h2">A construção é sua de uma vez. <em>O que você recebe é seu para sempre.</em></h2>
        <p><strong>A construção é compra única</strong>, com o valor fechado na proposta, depois de uma conversa. O sistema, o código e a documentação ficam com a consultoria.</p>
        <p><strong>Operar junto é opcional:</strong> hospedagem, suporte técnico e melhorias num serviço contínuo com valor próprio — mensal, porque você também recebe mensal. Na revenda dos nossos sistemas, as condições são combinadas na parceria.</p>
      </div>
      <figure class="pg-fig"><img src="/midia/gatekeeper-chave.webp" width="900" height="900" alt="Chave de latão com cabeça de cerâmica verde" loading="lazy" decoding="async"></figure>
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap">
      <div class="regua"><span class="micro">05 · Já está rodando</span><span class="micro">Não é maquete</span></div>
      <h2 class="serif pg-h2">Construímos para consultoria <em>— e para quem atende consultoria.</em></h2>
      <div class="pg-tres">
        <div><b>Portal da Besten Consultoria</b><p>O portal dos consultores: indicadores de todos os projetos em tempo real, tarefas do dia, biblioteca e trilha de onboarding. Uma consultoria de reestruturação operando o próprio método num sistema. <a class="link-mostarda pg-link" href="/#trabalhos">Ver no portfólio →</a></p></div>
        <div><b>Maintor Task</b><p>Gestão de processos feita com consultores: POPs, checklists, não conformidade com plano de ação e indicadores por unidade — o que a consultoria implanta e o cliente executa.</p></div>
        <div><b>Maintor CMMS</b><p>Manutenção industrial por assinatura: ordens de serviço, preventivas, estoque de peças e um copiloto com inteligência artificial. <a class="link-mostarda pg-link" href="https://maintor.com.br" target="_blank" rel="noopener">maintor.com.br ↗</a></p></div>
      </div>
      {img("task-indicadores", "Indicadores de processo: planejado × executado, cumprimento no prazo, evidências e não conformidades por causa raiz", sizes="(max-width: 1240px) 100vw, 1240px").replace('pg-fig pg-foto', 'pg-foto-larga pg-foto-print')}
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap">
      <div class="regua"><span class="micro">06 · Perguntas frequentes</span><span class="micro">O que toda consultoria pergunta primeiro</span></div>
      <div class="pg-faq">
{chr(10).join('        <details><summary>%s</summary><p>%s</p></details>' % qa for qa in FAQ)}
      </div>
    </div>
  </section>

  <section class="pg-secao">
    <div class="wrap">
      <div class="regua"><span class="micro">Continue lendo</span><span class="micro">Ganhar com sistema</span></div>
      <div class="pg-tres">
        <div><b>Sistema para revender</b><p>Para quem sabe um ofício e quer vender o sistema dele para os colegas. <a class="link-mostarda pg-link" href="/sistema-para-revender/">Abrir →</a></p></div>
        <div><b>Sistemas sob medida</b><p>Manutenção, RH, processos: o que a gente já construiu e mantém. <a class="link-mostarda pg-link" href="/sistemas-sob-medida/">Abrir →</a></p></div>
        <div><b>Guia: a conta real de um sistema</b><p>Preço, primeiros clientes, cancelamento — e quando não vale a pena. <a class="link-mostarda pg-link" href="/guias/como-ganhar-dinheiro-com-um-sistema-do-seu-nicho/">Abrir →</a></p></div>
      </div>
    </div>
  </section>

  <section class="pg-cta">
    <div class="wrap">
      <h2 class="serif pg-h2">Me conta o método da sua consultoria <em>e o que hoje vive em planilha.</em></h2>
      <p class="pg-lead">Eu te digo o que vira sistema primeiro — e como transformar em implementação e mensalidade. Sem compromisso.</p>
      <div class="pg-acoes">
        <a class="btn" href="{WA}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
      </div>
      <p class="pg-contatos"><a href="mailto:victor@maintor.com.br">victor@maintor.com.br</a> · <a href="{WA}" target="_blank" rel="noopener">(11) 94661-0634</a></p>
    </div>
  </section>'''

c = re.sub(r"<title>.*?</title>", lambda m: "<title>" + TITULO + "</title>", cab)
c = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + DESC, c)
c = c.replace('"https://maintorflow.com.br/sistema-para-revender/"', '"' + URL + '"')
for k, v in (("og:title", OG_T), ("og:description", OG_D)):
    c = re.sub(r'(<meta property="' + k + '" content=")[^"]*', lambda m: m.group(1) + v, c)
for k, v in (("twitter:title", OG_T), ("twitter:description", OG_D)):
    c = re.sub(r'(<meta name="' + k + '" content=")[^"]*', lambda m: m.group(1) + v, c)
bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Maintor Flow", "item": "https://maintorflow.com.br/"},
    {"@type": "ListItem", "position": 2, "name": "Para consultorias", "item": URL}]}
ld = '<script type="application/ld+json">\n' + faq_ld() + '\n</script>\n<script type="application/ld+json">\n' + json.dumps(bc, ensure_ascii=False) + '\n</script>\n</head>\n'
wa_q = WA.split("text=")[1]
html = c + ld + header.replace(WA_MAE, wa_q) + '<main id="conteudo">\n' + MAIN + "\n" + footer.replace(WA_MAE, wa_q)
assert WA_MAE not in html
assert not re.search(r"R\$ ?(1\.500|2\.200|3\.500)|a partir de R\$", html)
os.makedirs(SITE + "para-consultorias", exist_ok=True)
io.open(SITE + "para-consultorias/index.html", "w", encoding="utf-8", newline="\n").write(html)
print("ok", ROTA, len(html))
