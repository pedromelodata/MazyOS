// Grava as props de uma cena da peça do guia (dono K02): cenas.json, cenas-kit.json ou cenas-periodico-22s.json.
// Lê a narração da cena (sem o arquivo da peça: a RM/src/guia/narracao.json; na cenas-kit, que precisa da
// narração realinhada do K03, pula com aviso), as regiões (inline ou o arquivo do K04), o fecho.json do K03 (se
// existir) e o catálogo (o do K01, se existir; senão o mínimo do K02). Grava pelo escrita.mjs e confere os avisos
// esperados e o texto de crédito aprovado.
// Uso: node props-guia.mjs <cena> <saida.json>       código de saída: 0 ok, 1 falhou, 3 pulado

import path from "node:path";
import { carregaNucleo } from "./esbuild-node.mjs";
import { carregaCatalogo, dormeTicker, lerCena, lerFecho, lerNarracao, lerRegioes } from "./comum.mjs";
import { gravaJson } from "../lib/escrita.mjs";

export const CREDITO_APROVADO = "Modelos 3D: celular por polyman Studio e relógio por alboxer2000_ (Sketchfab, CC BY 4.0), modificados";

/** avisos que a cena do guia tem de dar (seção 4.4 e verificação do K02) */
export const AVISOS_ESPERADOS = [
  ["efeitos sem verificação", /^efeitos sem verificação: /],
  ["créditos CC BY", /^créditos CC BY/],
  ["LINK DA BIO #F2643C", /^LINK DA BIO em #F2643C: coral-500 em fill de botão sobre fundo claro, contra a regra da marca; aceito só na cena do guia$/],
  ["'prévia real' com telas do protótipo", /protótipo Next\.js, repo ab68dbc, não do app Flutter; chamar de real depende do Pedro/],
];

const [nomeCena, saida] = process.argv.slice(2);
if (!nomeCena || !saida) {
  console.error("uso: node props-guia.mjs <cenas.json | cenas-kit.json | cenas-periodico-22s.json> <saida.json>");
  process.exit(2);
}

const kit = await carregaNucleo();
dormeTicker(kit.gsap);
const { cena, pasta, caminho } = lerCena(nomeCena);
const ehKit = path.basename(caminho) === "cenas-kit.json";
const narr = lerNarracao(cena, pasta, { fallback: !ehKit });
if (!narr.narracao) {
  console.log(`AVISO: pulado: ${path.basename(caminho)} precisa de ${narr.origem} (narração realinhada pelo alinha.py do K03), que ainda não existe.`);
  dormeTicker(kit.gsap);
  process.exit(3);
}
const reg = lerRegioes(cena, pasta);
if (reg.falta) {
  console.log(`AVISO: pulado: ${path.basename(caminho)} aponta as regiões pra ${reg.origem} (do K04), que ainda não existe.`);
  dormeTicker(kit.gsap);
  process.exit(3);
}
const fecho = lerFecho();
const cat = carregaCatalogo();
console.log(`cena: ${caminho}`);
console.log(`narração: ${narr.origem}${narr.usouFallback ? " (a da peça ainda não existe: usei a do guia)" : ""}`);
console.log(`regiões: ${reg.origem}`);
console.log(`fecho: ${fecho.origem}`);
console.log(`catálogo: ${cat.origem}`);

const r = kit.avaliaCena(cena, { narracao: narr.narracao, regioes: reg.regioes, fecho: fecho.fecho, catalogo: cat.catalogo });
console.log(`\navisos (${r.avisos.length}):`);
for (const a of r.avisos) console.log(`  - ${a}`);
if (r.erros.length) {
  console.log(`\nFALHA: ${r.erros.length} erro(s):`);
  for (const e of r.erros) console.log(`  - ${e}`);
  dormeTicker(kit.gsap);
  process.exit(1);
}

const props = r.props;
const g = gravaJson(path.resolve(saida), props, { criaPasta: true });
console.log(`\ngravado: ${g.caminho} (${g.tamanho} bytes)`);
console.log(`duração ${props.duracao} s, ${props.quadros} quadros, tFecho ${props.tFecho}, periódico ${props.ambiente.periodico}, sons ${props.sons.perfil}/${props.sons.modoRuido}, ${r.eventos.length} eventos`);
console.log(`creditoLegenda: ${props.creditoLegenda}`);

const conferencias = [];
for (const [nome, re] of AVISOS_ESPERADOS) conferencias.push([`aviso esperado: ${nome}`, props.avisos.some((a) => re.test(a))]);
conferencias.push(["creditoLegenda igual ao texto aprovado", props.creditoLegenda === CREDITO_APROVADO]);
conferencias.push(["creditos com os dois trechos", JSON.stringify(props.creditos) === JSON.stringify(["celular por polyman Studio", "relógio por alboxer2000_"])]);
conferencias.push(["nenhum travessão nas props", !new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]").test(JSON.stringify(props))]);
conferencias.push(["link da bio do guia em #F2643C", !!props.fecho && props.fecho.link.cor === "#F2643C"]);
console.log("");
for (const [nome, ok] of conferencias) console.log(`[${ok ? "ok" : "FALHA"}] ${nome}`);
const passou = conferencias.every((c) => c[1]);
console.log(`\nresultado: ${passou ? "PASSOU" : "FALHOU"}`);
dormeTicker(kit.gsap);
process.exit(passou ? 0 : 1);
