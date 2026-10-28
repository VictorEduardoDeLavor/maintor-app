"""Tira do site os PREÇOS da Maintor Flow (decisão do Victor, 28/10/2026: "para a gente
não ficar preso e amarrado a esses custos"). O valor passa a sair fechado na proposta.

Fica: preço de concorrente (com fonte e data), regra de frete da VOKE, exemplos de quanto
o CLIENTE cobra no sistema para revender, "o sobrinho por R$ 800" (referência de mercado).
Uso: python testes/tirar-precos.py   (idempotente: falha se um trecho não for achado)
"""
import io, re, sys

RAIZ = "C:/dev/maintor-app/site/"
PROPOSTA = "o valor sai fechado na proposta, depois de uma conversa"

TROCAS = {
 "index.html": [
  ('content="Loja virtual a partir de R$ 1.500, pagamento único e sem mensalidade. Também sites, automação de atendimento e sistemas sob medida para pequenos negócios em São Paulo."',
   'content="Loja virtual própria, pagamento único e sem mensalidade. Também sites, automação de atendimento e sistemas sob medida para pequenos negócios em São Paulo."'),
  ('content="Loja virtual a partir de R$ 1.500, sem mensalidade e sem comissão. Veja uma loja nossa no ar: VOKE WEAR."',
   'content="Loja virtual própria, sem mensalidade e sem comissão. Veja os nossos trabalhos no ar."'),
  ('content="Loja virtual a partir de R$ 1.500, sem mensalidade. Também sites, automação e sistemas sob medida."',
   'content="Loja virtual própria, sem mensalidade. Também sites, automação e sistemas sob medida."'),
  ('"Loja virtual: R$ 1.500, R$ 2.200 ou R$ 3.500, conforme quem cadastra as peças e se entra o estúdio de fotos. O site institucional sai fechado na proposta, pelo número de páginas. Nos dois casos, pagamento único, sem mensalidade."',
   '"Depende do que o seu negócio precisa: o formato da loja, quem cadastra o catálogo, o número de páginas do site. O valor sai fechado na proposta, por escrito, depois de uma conversa. Site e loja são pagamento único, sem mensalidade."'),
  ("A loja própria é compra única: em cerca de dois anos sai mais barata, e depois disso não tem mensalidade nenhuma.",
   "A loja própria é compra única: você paga uma vez, e depois disso não tem mensalidade nenhuma."),
  ('<p>Lojas virtuais a partir de R$ 1.500, pagamento único e sem mensalidade,',
   '<p>Lojas virtuais próprias, pagamento único e sem mensalidade,'),
 ],
 "src/App.jsx": [
  ("solucao: 'Uma loja virtual que mostra o tamanho, cobra no Pix e calcula o frete sozinha. A partir de R$ 1.500, pagamento único.',",
   "solucao: 'Uma loja virtual que mostra o tamanho, cobra no Pix e calcula o frete sozinha. Pagamento único, sem mensalidade.',"),
  ('r: "Loja virtual: R$ 1.500, R$ 2.200 ou R$ 3.500, conforme quem cadastra as peças e se entra o estúdio de fotos. O site institucional sai fechado na proposta, pelo número de páginas. Nos dois casos, pagamento único, sem mensalidade."',
   'r: "Depende do que o seu negócio precisa: o formato da loja, quem cadastra o catálogo, o número de páginas do site. O valor sai fechado na proposta, por escrito, depois de uma conversa. Site e loja são pagamento único, sem mensalidade."'),
  ("A loja própria é compra única: em cerca de dois anos sai mais barata, e depois disso não tem mensalidade nenhuma.",
   "A loja própria é compra única: você paga uma vez, e depois disso não tem mensalidade nenhuma."),
  ("solução: loja virtual a partir de R$ 1.500, sistema de RH ou",
   "solução: loja virtual sem mensalidade, sistema de RH ou"),
 ],
 "loja-virtual/index.html": [
  ("<title>Loja virtual a partir de R$ 1.500, sem mensalidade | Maintor Flow</title>",
   "<title>Loja virtual própria, sem mensalidade e sem comissão | Maintor Flow</title>"),
  ('content="Loja virtual no seu domínio por R$ 1.500, R$ 2.200 ou R$ 3.500, pagamento único. Pix com desconto,',
   'content="Loja virtual no seu domínio, com pagamento único. Pix com desconto,'),
  ('content="Catálogo, Pix, cartão, frete e um painel que é seu. A partir de R$ 1.500, pagamento único, sem mensalidade."',
   'content="Catálogo, Pix, cartão, frete e um painel que é seu. Pagamento único, sem mensalidade."', 2),
  ("A partir de R$ 1.500, pagamento único: sem mensalidade e sem comissão sobre as suas vendas.",
   "Pagamento único: sem mensalidade e sem comissão sobre as suas vendas."),
  ('<span class="micro">Essencial · R$ 1.500</span>', '<span class="micro">Essencial</span>'),
  ('<span class="micro">Completo · R$ 2.200</span>', '<span class="micro">Completo</span>'),
  ('<span class="micro">Estúdio · R$ 3.500</span>', '<span class="micro">Estúdio</span>'),
  ("A loja própria é compra única: <strong>em cerca de dois anos sai mais barata, e depois disso não tem mensalidade nenhuma.</strong>",
   "A loja própria é compra única: <strong>você paga uma vez, e depois disso não tem mensalidade nenhuma.</strong>"),
 ],
 "guias/loja-propria-ou-plataforma-pronta/index.html": [
  ("<li>Maintor Flow é compra única: de R$ 1.500 a R$ 3.500, uma vez.</li>",
   "<li>Maintor Flow é compra única: um pagamento, com o valor fechado na proposta.</li>"),
  ('<tr class="nossa"><td>Maintor Flow Essencial</td><td>R$ 1.500, uma vez</td><td>nenhuma</td></tr>\n            <tr class="nossa"><td>Maintor Flow Completo <small>(a gente cadastra o catálogo de lançamento)</small></td><td>R$ 2.200, uma vez</td><td>nenhuma</td></tr>',
   '<tr class="nossa"><td>Maintor Flow</td><td>Uma vez só, com o valor fechado na proposta</td><td>nenhuma</td></tr>'),
  ("Em cerca de dois anos a conta vira — e depois disso a plataforma continua cobrando e a sua loja não.",
   "Só que a mensalidade não para: a plataforma continua cobrando todo mês, e a sua loja, depois de paga, não.", 2),
 ],
 "guias/quanto-custa-uma-loja-virtual/index.html": [
  ("A loja, o checkout e os e-mails automáticos são os mesmos nos três: <strong>R$ 1.500</strong> se você cadastra, <strong>R$ 2.200</strong> com o catálogo de lançamento cadastrado por nós e <strong>R$ 3.500</strong> com o estúdio de fo",
   "A loja, o checkout e os e-mails automáticos são os mesmos nos três: muda se você cadastra, se o catálogo de lançamento é cadastrado por nós ou se entra o estúdio de fo"),
 ],
 "public/index.md": [
  ("pagamento único para site e loja (loja virtual por\nR$ 1.500, R$ 2.200 ou R$ 3.500, conforme quem cadastra as peças).",
   "pagamento único para site e loja, com o valor fechado na proposta\n(conforme o formato, quem cadastra as peças e o número de páginas)."),
  ("Loja virtual: R$ 1.500, R$ 2.200 ou R$ 3.500, conforme quem cadastra as peças e se entra o estúdio de fotos. O site institucional sai fechado na proposta, pelo número de páginas. Nos dois casos, pagamento único, sem mensalidade.",
   "Depende do que o negócio precisa: o formato da loja, quem cadastra o catálogo, o número de páginas do site. O valor sai fechado na proposta, por escrito, depois de uma conversa. Site e loja são pagamento único, sem mensalidade."),
  ("A loja própria é compra única: em cerca de dois anos sai mais barata, e depois disso não tem mensalidade nenhuma.",
   "A loja própria é compra única: paga uma vez, e depois disso não tem mensalidade nenhuma."),
 ],
}

# a resposta "Quanto custa uma loja virtual?" (JSON-LD + visível) em duas páginas: troca por regex
FAQ_LOJA = re.compile(r"Três formatos, todos com pagamento único e sem mensalidade: R\$ 1\.500 se você monta o catálogo pelo painel, R\$ 2\.200 se a gente entrega a loja pronta,[^\"<]*?R\$ 3\.500 com o estúdio de fotos no painel[^\"<]*?\.")
NOVA_FAQ = ("Depende do formato — se você cadastra o catálogo, se a gente entrega a loja pronta com o catálogo de lançamento, "
            "ou se entra o estúdio de fotos no painel — e do tamanho do catálogo. O valor sai fechado na proposta, depois de uma conversa, "
            "sempre como pagamento único, sem mensalidade e sem comissão sobre as vendas.")

erros = []
for arq, trocas in TROCAS.items():
    p = RAIZ + arq
    t = io.open(p, encoding="utf-8").read()
    for tr in trocas:
        a, b = tr[0], tr[1]
        n = tr[2] if len(tr) > 2 else 1
        if t.count(a) != n:
            erros.append(f"{arq}: esperava {n}, achei {t.count(a)} — {a[:70]}")
            continue
        t = t.replace(a, b)
    io.open(p, "w", encoding="utf-8", newline="\n").write(t)
for arq in ["loja-virtual/index.html", "loja-virtual-moda-fitness/index.html"]:
    p = RAIZ + arq
    t = io.open(p, encoding="utf-8").read()
    t, n = FAQ_LOJA.subn(NOVA_FAQ, t)
    if n != 2:
        erros.append(f"{arq}: FAQ 'Quanto custa' trocada {n} vezes (esperava 2)")
    io.open(p, "w", encoding="utf-8", newline="\n").write(t)
# moda fitness: o "dois anos" da objeção à Nuvemshop
p = RAIZ + "loja-virtual-moda-fitness/index.html"
t = io.open(p, encoding="utf-8").read()
t2 = t.replace("A loja própria é compra única: em cerca de dois anos sai mais barata, e depois disso não tem mensalidade nenhuma.",
               "A loja própria é compra única: você paga uma vez, e depois disso não tem mensalidade nenhuma.")
if t2 == t:
    erros.append("moda-fitness: frase dos dois anos não achada")
io.open(p, "w", encoding="utf-8", newline="\n").write(t2)

if erros:
    print("\n".join(erros)); sys.exit(1)
print("preços da Flow retirados")
