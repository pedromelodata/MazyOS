// Validações do montaProps (dono K02; KIT/DESENHO.md seção 4.4): cada erro e cada aviso provocado de propósito
// numa cópia em memória da cena do guia, mais o modelo de peça nova (pecas/_modelo/cenas.json) montado com a
// narração do guia no lugar da dele. Nada é gravado.
// Uso: node validacoes.mjs        (código de saída 0 = passou)

import fs from "node:fs";
import path from "node:path";
import { carregaNucleo } from "./esbuild-node.mjs";
import { KIT, carregaCatalogo, dormeTicker, lerCena, lerFecho, lerJson, lerNarracao } from "./comum.mjs";

const kit = await carregaNucleo();
dormeTicker(kit.gsap);
const base = lerCena("cenas.json");
const narr = lerNarracao(base.cena, base.pasta).narracao;
const fecho = lerFecho().fecho;
const { catalogo, origem } = carregaCatalogo();
console.log(`catálogo: ${origem}`);
const copia = (x) => JSON.parse(JSON.stringify(x));
const avalia = (cena, extra = {}) => kit.avaliaCena(cena, { narracao: narr, fecho, catalogo, ...extra });
const batida = (cena, id) => cena.batidas.filter((b) => b.id === id)[0];
/** o catálogo (em qualquer formato aceito) com um item a mais no tipo dado */
const comItem = (tipo, item) => {
  const n = kit.normalizaCatalogo(catalogo);
  n[tipo] = { ...n[tipo], [item.id]: item };
  return n;
};

const casos = [];
const caso = (nome, mexe, espera, extra) => casos.push({ nome, mexe, espera, extra });

// ---------- erros ----------
caso("batida inexistente", (c) => c.batidas.push({ id: "batida-que-nao-existe", params: {} }), { erro: /batida inexistente/ });
caso("camada de tipo desconhecido", (c) => c.camadas.push({ id: "c1", tipo: "tipo-novo", estado: {} }), { erro: /camada de tipo desconhecido/ }, { camadasConhecidas: ["texto-entra"] });
caso("tempo fora do vídeo", (c) => (batida(c, "mergulho-abre-app").params.t = 19.5), { erro: /tempo fora do vídeo/ });
caso("índice de palavra inválido", (c) => (batida(c, "card-contador").params.brilho.t = { palavra: 80 }), { erro: /índice de palavra inválido/ });
caso("objeto citado que não existe", (c) => (batida(c, "objeto-sai-da-tela").params.objeto = "comprovante"), { erro: /objeto citado não existe/ });
caso("tela citada que não existe", (c) => (batida(c, "empurrar-tela").params.para = "telaQueNaoExiste"), { erro: /tela citada não existe/ });
caso("objeto de tipo errado na objeto-sai-da-tela", (c) => (batida(c, "objeto-sai-da-tela").params.objeto = "relogio"), { erro: /esta batida aceita: folha, pilula, comprovante/ });
caso("trilha reprovada (Epidemic)", (c) => (c.trilha = { id: "epidemic-palmy-sway", mStart: 1, ganhoDb: -9 }), { erro: /trilha reprovada: epidemic-palmy-sway/ });
// trilha: só liberada, ou aceita com risco pela decisaoRisco do catálogo que vale pra peça (o texto da cena não libera)
caso("trilha aceita com risco em peça nova (a decisão do catálogo é só da peça de 14/10)", (c) => {
  c.peca = "2026-10-20-teste";
  c.trilha.decisaoRisco = "qualquer texto na cena";
}, { erro: /a decisão do catálogo \(Pedro, 02\/10\/2026: .*\) não vale pra peça 2026-10-20-teste/ });
caso("trilha aceita com risco sem decisaoRisco estruturada no catálogo", () => {}, { erro: /não tem decisaoRisco estruturada \(decisaoRisco em texto livre/ }, {
  catalogo: comItem("trilhas", { ...kit.normalizaCatalogo(catalogo).trilhas["mixkit-01-talent-in-the-air"], decisaoRisco: "Pedro, 02/10/2026: só nesta peça" }),
});
caso("trilha sem verificação na AudD, mesmo com decisaoRisco na cena", (c) => (c.trilha = { id: "pixabay-03-summer-fashion", mStart: 8.075, ganhoDb: -9, decisaoRisco: "teste" }), { erro: /pixabay-03-summer-fashion está "sem-verificacao"/ });
caso("prévia de audição como trilha de cena", (c) => (c.trilha = { id: "previa-mixkit-04-house-one", mStart: 1, ganhoDb: -9 }), { erro: /prévia de audição, não trilha/ });
caso("trilha aceita com risco em peça de teste passa com aviso", (c) => (c.peca = "_teste-validacoes"), { aviso: /passa só por ser peça de teste/ });
// modelos e crédito
caso("modelo com decisão pendente do Pedro (crédito que cita marca)", (c) => c.objetos.push({ id: "carteira", modelo: "glb-carteira", pose: { vis: 0 } }), { erro: /o modelo glb-carteira está fora do padrão: decisão de Pedro pendente/ });
caso("crédito de legenda que cita marca", (c) => (c.objetos[0].modelo = "glb-teste-marca"), { erro: /cita marca \(google\)/i }, {
  catalogo: comItem("modelos", {
    ...kit.normalizaCatalogo(catalogo).modelos["glb-video-iphone"],
    id: "glb-teste-marca",
    licenca: { nome: "CC BY 3.0", creditoObrigatorio: true, creditoLegenda: { trecho: "'Wallet' por Poly by Google", fonte: "Poly Pizza", licenca: "CC BY 3.0" } },
  }),
});
// a peça é a PASTA (rodada 4): op.peca é o nome da pasta, que o props.mjs passa
caso("cena do guia copiada pra outra pasta (campo peca diferente da pasta)", () => {}, { erro: /cena: "peca" é "guia-pronta-2026-10-14" e a pasta é 2026-10-20-teste-aud/ }, { peca: "2026-10-20-teste-aud" });
caso("cena do guia copiada com o campo peca trocado: a Talent cai pela pasta", (c) => (c.peca = "2026-10-20-teste-aud"), { erro: /mixkit-01-talent-in-the-air .* não vale pra peça 2026-10-20-teste-aud/ }, { peca: "2026-10-20-teste-aud" });
caso("pasta de teste renomeada (campo peca com '_', pasta sem): a Talent cai", (c) => (c.peca = "_qualquer"), { erro: /cena: "peca" é "_qualquer" e a pasta é 2026-10-20-publica/ }, { peca: "2026-10-20-publica" });
// decisão de risco (rodada 4): em peça nova, só a do Pedro com a peça escrita; agente e '*' não valem
const comDecisaoTalent = (d) => comItem("trilhas", { ...kit.normalizaCatalogo(catalogo).trilhas["mixkit-01-talent-in-the-air"], decisaoRisco: d });
caso("decisão de agente com '*' não vale pra peça nova", (c) => (c.peca = "2026-10-20-teste"), { erro: /não vale pra peça 2026-10-20-teste \(a decisão vale com '\*' \(de agente/ }, {
  catalogo: comDecisaoTalent({ quem: "agente de teste", quando: "2026-10-03", pecas: ["*"], texto: "teste" }),
});
caso("decisão do Pedro com '*' não vale pra peça nova", (c) => (c.peca = "2026-10-20-teste"), { erro: /'\*' não vale pra peça nova/ }, {
  catalogo: comDecisaoTalent({ quem: "Pedro", quando: "2026-10-03", pecas: ["*"], texto: "teste" }),
});
caso("decisão de agente com a peça escrita não vale pra peça nova", (c) => (c.peca = "2026-10-20-teste"), { erro: /decisão é de agente \(agente de teste\), não do Pedro/ }, {
  catalogo: comDecisaoTalent({ quem: "agente de teste", quando: "2026-10-03", pecas: ["2026-10-20-teste"], texto: "teste" }),
});
caso("decisão do Pedro com a peça escrita vale (aviso)", (c) => (c.peca = "2026-10-20-teste"), { aviso: /vale pela decisão de Pedro, 03\/10\/2026: teste \(vale em 2026-10-20-teste\)/ }, {
  catalogo: comDecisaoTalent({ quem: "Pedro", quando: "2026-10-03", pecas: ["2026-10-20-teste"], texto: "teste" }),
});
// trava do F063 (peça de MEI) e exemplos
caso("folha DAS sem mostraValor false em peça de MEI", (c) => (c.fatos.publico = "MEI"), { erro: /objeto guia \(folha DAS\): peça de MEI e o valor da guia aparece/ });
// F063 por padrão (rodada 4): público obrigatório; "todos" e vazio conferidos como MEI
caso("fatos.publico vazio é erro e confere como MEI", (c) => (c.fatos.publico = ""), { erro: /objeto guia \(folha DAS\): peça conferida como MEI \(público vazio\)/ });
caso("fatos.publico 'todos' confere como MEI", (c) => (c.fatos.publico = "todos"), { erro: /objeto guia \(folha DAS\): peça conferida como MEI \(público todos\)/ });
caso("fatos.publico inválido", (c) => (c.fatos.publico = "ambos-ME"), { erro: /fatos\.publico inválido: ambos-ME/ });
caso("contador com formato diferente de brl", (c) => (c.telas.inicio.extras[1].formato = "decimal"), { erro: /contador com formato "decimal": o contador sempre desenha em R\$/ });
caso("contador de valor em peça de MEI", (c) => (c.fatos.publico = "MEI"), { erro: /tela "inicio": contador de valor numa peça de MEI/ });
const palcoComImposto = (valor) => ({
  id: "palco", modelo: "proc-palco-argila", pose: {}, sombra: 0,
  conteudo: { aparelho: "aparelho", pecas: { imposto: { tipo: "cartao-imposto", lado: "quente", visivel: false, opcoes: { tela: "inicio", valor } } } },
});
caso("cartão do imposto do palco de argila em peça de MEI", (c) => {
  c.fatos.publico = "MEI";
  c.objetos.push(palcoComImposto(75.9));
}, { erro: /objeto palco, cartão do imposto imposto: peça de MEI e o cartão conta o valor da guia \(R\$ 75\.9\)/ });
caso("cartão do imposto das peças padrão do tipo de palco (registro da extensão) em peça de MEI", (c) => {
  c.fatos.publico = "MEI";
  c.objetos.push({ id: "palco", modelo: "proc-palco-argila", tipo: "palco-tvl-teste", pose: {}, sombra: 0, conteudo: {} });
}, { erro: /objeto palco, cartão do imposto cartaoImposto: peça de MEI e o cartão conta o valor da guia \(R\$ 178,31\)/ }, {
  pecasDoPalco: (o) => (o.tipo === "palco-tvl-teste" ? { cartaoImposto: { tipo: "cartao-imposto", opcoes: { valor: 178.31, valorTexto: "R$ 178,31" } } } : null),
});
caso("tela do guia como imagem 2D em peça de MEI", (c) => {
  c.fatos.publico = "MEI";
  c.camadas.push({ id: "pasta", tipo: "imagem", src: "telas/tela-inicio.png", x: 800, y: 1530, largura: 220, estado: {} });
}, { erro: /camada pasta \(imagem telas\/tela-inicio\.png\): peça de MEI e a captura de origem \(montada-tela-inicio\) não serve peça de MEI/ });
// tela sem origem no catálogo: erro em qualquer peça (rodada 4)
caso("tela sem origem no catálogo em peça de ME", (c) => (c.telas.imposto.arquivo = "telas/plano-copiado.png"), { erro: /tela "imposto": sem origem no catálogo de telas/ });
caso("imagem 2D de tela sem origem no catálogo em peça de ME", (c) => c.camadas.push({ id: "copia", tipo: "imagem", src: "pecas/2026-10-20-x/telas/plano-copiado.png", estado: {} }), { erro: /camada copia \(imagem pecas\/2026-10-20-x\/telas\/plano-copiado\.png\): sem origem no catálogo de telas/ });
caso("tela aceita com risco por decisão de agente com '*' em peça nova: aviso", (c) => {
  c.peca = "2026-10-20-teste";
  c.trilha = { id: "mixkit-04-house-one", mStart: 51.711, ganhoDb: -6.7 };
}, { aviso: /telas de captura aceitas com risco sem decisão do Pedro pra esta peça \(tela0210-welcome\)/ }, {
  origensTelas: { "telas/tela-splash.png": { conjunto: "2026-10-02", arquivo: "welcome.png", receita: "teste.json" } },
});
// licença e marca (rodada 4)
caso("crédito com marca colada a número ('iPhone15 Pro')", (c) => (c.objetos[0].modelo = "glb-teste-marca-colada"), { erro: /cita marca \(iphone\)/ }, {
  catalogo: comItem("modelos", {
    ...kit.normalizaCatalogo(catalogo).modelos["glb-video-iphone"],
    id: "glb-teste-marca-colada", status: "liberado", decisaoRisco: undefined,
    licenca: { nome: "CC BY 4.0", creditoObrigatorio: true, creditoLegenda: { trecho: "'iPhone15 Pro' por Fulano", fonte: "Sketchfab", licenca: "CC BY 4.0" } },
  }),
});
caso("licença 'CC Attribution 4.0' pede o crédito (é CC BY)", (c) => (c.objetos[0].modelo = "glb-cc-attribution"), { erro: /modelo CC BY sem licenca\.creditoLegenda: glb-cc-attribution/ }, {
  catalogo: comItem("modelos", { id: "glb-cc-attribution", status: "liberado", licenca: { nome: "CC Attribution 4.0", creditoLegenda: null }, render: { tipoObjeto: "aparelho" } }),
});
caso("licença NC (não comercial)", (c) => (c.objetos[0].modelo = "glb-cc-nc"), { erro: /tem licença NC \(CC BY-NC 4\.0\): não serve conteúdo de marca/ }, {
  catalogo: comItem("modelos", { id: "glb-cc-nc", status: "liberado", licenca: { nome: "CC BY-NC 4.0", creditoLegenda: { trecho: "x por y", fonte: "Sketchfab", licenca: "CC BY-NC 4.0" } }, render: { tipoObjeto: "aparelho" } }),
});
caso("efeito da Epidemic pela fonte (licença com outro nome)", (c) => (batida(c, "link-bio").params.sons = [{ som: "efeito-epidemic-fonte", em: "inicio", desloc: 0, ganhoDb: -20 }]), { erro: /efeito efeito-epidemic-fonte vem da Epidemic/ }, {
  catalogo: comItem("efeitos", { id: "efeito-epidemic-fonte", status: "liberado", fonte: "Epidemic Sound", licenca: { nome: "licença padrão" } }),
});
caso("comprovante sem mostraValor false em peça de MEI", (c) => {
  c.fatos.publico = "MEI";
  c.objetos.push({ id: "comp", modelo: "proc-comprovante", pose: { vis: 0 } });
}, { erro: /objeto comp \(comprovante\): peça de MEI e o valor da guia aparece \(o pintor mostra R\$ 178,31\)/ });
caso("tela do guia com valor em peça de MEI", (c) => (c.fatos.publico = "MEI"), { erro: /tela "inicio": peça de MEI e a captura de origem \(montada-tela-inicio\) não serve peça de MEI/ });
caso("tela de captura reprovada (origem pela receita)", () => {}, { erro: /tela "splash": a captura de origem tela0210-painel está reprovada/ }, {
  origensTelas: { "telas/tela-splash.png": { conjunto: "2026-10-02", arquivo: "painel.png", receita: "teste.json" } },
});
caso("exemplo de valor fictício sem origem", (c) => (c.fatos.exemplos = [{ texto: "R$ 178,31" }]), { erro: /fatos\.exemplos\[0\] \("R\$ 178,31"\): falta a origem/ });
caso("traço longo U+2015 em texto visível", (c) => (c.objetos[1].mostrador.linhas = ["Vence " + String.fromCharCode(0x2015) + " dia 20."]), { erro: /travessão em texto/ });
caso("efeito reprovado", (c) => (batida(c, "link-bio").params.sons = [{ som: "efeito-reprovado-teste", em: "inicio", desloc: 0, ganhoDb: -20 }]), { erro: /efeito reprovado: efeito-reprovado-teste/ }, {
  catalogo: comItem("efeitos", { id: "efeito-reprovado-teste", status: "reprovado" }),
});
caso("travessão em texto visível", (c) => (c.objetos[1].mostrador.linhas = ["Vence " + String.fromCharCode(0x2014) + " dia 20."]), { erro: /travessão em texto/ });
caso("APP EM CONSTRUÇÃO em texto", (c) => (c.fecho.link.texto = "APP EM CONSTRUÇÃO"), { erro: /APP EM CONSTRUÇÃO/ });
caso("Legalizai sem acento em texto visível", (c) => (c.objetos[1].mostrador.app = "LEGALIZAI"), { erro: /sem acento/ });
caso("modelo CC BY sem creditoLegenda", (c) => (c.objetos[0].modelo = "glb-cc-by-sem-credito"), { erro: /modelo CC BY sem licenca.creditoLegenda/ }, {
  catalogo: comItem("modelos", { id: "glb-cc-by-sem-credito", status: "liberado", licenca: { nome: "CC BY 4.0", creditoLegenda: null }, render: { tipoObjeto: "aparelho" } }),
});
caso("região citada que não existe", (c) => (c.telas.inicio.extras[0].regiao = "regiaoQueNaoExiste"), { erro: /região citada não existe/ });

// ---------- avisos ----------
caso("LINK DA BIO em #DD4E27", (c) => (c.fecho.link.cor = "#DD4E27"), { aviso: /^LINK DA BIO em #DD4E27: cor da regra da marca; o V4 do guia usou #F2643C; decisão final do Pedro pendente$/ });
caso("tela do conjunto 2026-09 em peça nova", (c) => {
  c.peca = "2026-10-20-teste";
  c.trilha = { id: "mixkit-04-house-one", mStart: 51.711, ganhoDb: -6.7 }; // a Talent só vale na peça de 14/10
  c.telas.splash.conjunto = "2026-09";
}, { aviso: /conjunto 2026-09: conjunto antigo, fundo papel, só histórico/ });
caso("modelo aceito com risco fora da peça da decisão (aviso pra confirmar com o Pedro)", (c) => {
  c.peca = "2026-10-20-teste";
  c.trilha = { id: "mixkit-04-house-one", mStart: 51.711, ganhoDb: -6.7 };
}, { aviso: /^modelo glb-video-iphone aceito com risco e a decisão \(.*\) não cobre esta peça: confirmar com o Pedro antes de postar$/ });
caso("tFecho a menos de 0,3 s da última palavra", (c) => (c.tFecho = 14.7), { aviso: /a menos de 0,3 s/ });
caso("fatos.publico vazio (erro desde a rodada 4)", (c) => (c.fatos.publico = ""), { erro: /fatos\.publico vazio: declare "ME", "MEI" ou "todos"/ });
caso("'tela real' com telas do protótipo (os dois conjuntos)", (c) => (c.telas.splash.conjunto = "2026-09"), { aviso: /protótipo Next\.js, repo ab68dbc/ });
caso("verso de frente menos de 4 quadros", (c) => (batida(c, "flip-troca-escondida").params.giro = { dur: 0.3 }), { aviso: /o verso fica de frente só \d quadros/ });

// ---------- peça de MEI (e pra todos) que respeita o F063: nenhuma trava de MEI ----------
// folha com mostraValor false, sem o contador de valor e as 4 telas apontadas (pela receita) pra splash, que serve MEI
for (const publico of ["MEI", "todos"]) {
  const c = copia(base.cena);
  c.fatos.publico = publico;
  c.objetos[2].conteudo = { mostraValor: false };
  c.telas.inicio.extras = c.telas.inicio.extras.filter((ex) => ex.tipo !== "contador");
  const origens = {};
  for (const k of Object.keys(c.telas)) origens[c.telas[k].arquivo] = { conjunto: "2026-10-02", arquivo: "splash.png", receita: "teste.json" };
  const r = avalia(c, { origensTelas: origens });
  const travasMei = r.erros.filter((e) => /peça de MEI|conferida como MEI|F063/.test(e));
  casos.push({ nome: `peça com público ${publico} com mostraValor false, sem contador e telas que servem MEI`, direto: { ok: travasMei.length === 0, visto: `${travasMei.length} trava(s) de MEI; erros: ${JSON.stringify(r.erros)}` } });
}
// a cena do guia na pasta dela (op.peca igual ao campo): passa, com o público ME declarado (rodada 4)
{
  const r = avalia(copia(base.cena), { peca: "guia-pronta-2026-10-14" });
  casos.push({ nome: "a cena do guia na pasta dela (público ME) passa", direto: { ok: r.erros.length === 0 && !!r.props && r.props.fatos.publico === "ME", visto: `erros: ${JSON.stringify(r.erros)}` } });
}

let falhas = 0;
for (const k of casos) {
  if (k.direto) {
    if (!k.direto.ok) falhas++;
    console.log(`[${k.direto.ok ? "ok" : "FALHA"}] direto ${k.nome}: ${k.direto.visto}`);
    continue;
  }
  const cena = copia(base.cena);
  k.mexe(cena);
  const r = avalia(cena, k.extra || {});
  let ok;
  let visto;
  if (k.espera.erro) {
    visto = r.erros.filter((e) => k.espera.erro.test(e))[0];
    ok = !!visto && r.props === null;
  } else {
    visto = r.avisos.filter((a) => k.espera.aviso.test(a))[0];
    ok = !!visto && r.erros.length === 0;
  }
  if (!ok) falhas++;
  console.log(`[${ok ? "ok" : "FALHA"}] ${k.espera.erro ? "erro " : "aviso"} ${k.nome}${visto ? ": " + visto : ""}`);
  if (!ok) console.log(`        erros: ${JSON.stringify(r.erros)}\n        avisos: ${JSON.stringify(r.avisos)}`);
}

// ---------- o modelo de peça nova ----------
const caminhoModelo = path.join(KIT, "pecas", "_modelo", "cenas.json");
const modelo = lerJson(caminhoModelo);
// o modelo nasce exigindo o público (rodada 4): como está, é recusado; com "ME" declarado, monta
const rmVazio = avalia(copia(modelo), { regioes: base.cena.regioes });
const modeloME = copia(modelo);
modeloME.fatos.publico = "ME";
modeloME.fatos.exemplos = [{ texto: "R$ 178,31", origem: "dado fictício da empresa de exemplo do app (teste)" }];
const rm = avalia(modeloME, { regioes: base.cena.regioes });
const evs = rm.eventos;
const t2867 = evs.filter((e) => e.som === "mixkit-2867")[0];
const confs = [
  ["o modelo como está (publico vazio) é recusado: o público é obrigatório", rmVazio.props === null && rmVazio.erros.some((e) => /fatos\.publico vazio/.test(e))],
  ["o modelo com publico vazio é conferido como MEI (folha DAS, contador e telas do guia recusados)", rmVazio.erros.some((e) => /folha DAS\): peça conferida como MEI/.test(e)) && rmVazio.erros.some((e) => /contador de valor/.test(e))],
  ["o modelo com publico ME monta sem erro (narração e regiões do guia no lugar das dele)", rm.erros.length === 0],
  ["mStart = ponto volta-62.011 - W(37) = 51,711", !!rm.props && Math.abs(rm.props.trilha.mStart - 51.711) < 1e-9],
  ["tFecho auto = 15,0 e duração auto = 18,0", !!rm.props && Math.abs(rm.props.tFecho - 15) < 1e-9 && Math.abs(rm.props.duracao - 18) < 1e-9],
  ["35 eventos com semente (por-evento)", evs.length === 35 && evs.every((e) => typeof e.semente === "number")],
  ["2867 com transpor 1 (o da House One)", !!t2867 && t2867.transpor === 1],
  ["aviso do LINK DA BIO #DD4E27", rm.avisos.some((a) => /^LINK DA BIO em #DD4E27/.test(a))],
  ["periodico true", !!rm.props && rm.props.ambiente.periodico === true],
  ["nenhum comentário (_ajuda) nas props", !!rm.props && JSON.stringify(rm.props).indexOf("_ajuda") < 0],
];
const guiaEv = avalia(copia(base.cena)).eventos;
const mesmosTempos = guiaEv.length === evs.length && guiaEv.every((e, i) => e.som === evs[i].som && Math.abs(e.t - evs[i].t) < 1e-6);
confs.push(["com a narração do guia os sons caem nos mesmos instantes do guia", mesmosTempos]);
console.log(`\nmodelo de peça nova (${caminhoModelo}):`);
for (const [nome, ok] of confs) {
  if (!ok) falhas++;
  console.log(`[${ok ? "ok" : "FALHA"}] ${nome}`);
}
if (rm.erros.length) console.log(`  erros: ${JSON.stringify(rm.erros)}`);
console.log(`  avisos do modelo: ${rm.avisos.length}`);
for (const a of rm.avisos) console.log(`    - ${a}`);

// travessão nos arquivos do K02 (cenas e modelo)
const arquivos = ["cenas.json", "cenas-kit.json", "cenas-periodico-22s.json"].map((n) => path.join(base.pasta, n)).concat([caminhoModelo]);
for (const a of arquivos) {
  const tem = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]").test(fs.readFileSync(a, "utf8"));
  if (tem) falhas++;
  console.log(`[${tem ? "FALHA" : "ok"}] sem travessão: ${path.basename(path.dirname(a))}/${path.basename(a)}`);
}

console.log(`\nresultado: ${falhas === 0 ? "PASSOU" : "FALHOU"} (${falhas} falha(s))`);
dormeTicker(kit.gsap);
process.exit(falhas === 0 ? 0 : 1);
