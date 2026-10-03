// Props do KitProvaModelo pra modelos do catálogo, montadas pelo montaProps (frente MODELOS NO RENDER, 03/10;
// contrato: KIT/DESENHO.md, seções 1 (item 7), 4.4 e 4.9). O objeto sai exatamente como numa peça: escala,
// rotacaoBase, pivô, materiais, cores, sombra e o caminho no public-kit do catálogo; o KitProvaModelo só enquadra.
// Uso: node prova-modelos.mjs <saida.json> <id> [<id> ...] [--sem-decisao]
//   --sem-decisao: modelo aceito com risco com a decisão do Pedro pendente (ou CC BY sem crédito sem marca) é montado
//   com uma decisão de mentira, só em memória e só pra prova de render (a saída marca semDecisao: true; o catálogo
//   não muda e o kit continua recusando o modelo numa peça).
// Grava {versao, geradoEm, vistas, modelos: [{id, ok, erros, avisos, semDecisao, objeto, caixaProps, telas,
// trabalhos: [{vista, props}]}]} pelo escrita.mjs. Código 0 se todos montaram; 1 se algum falhou (a saída é gravada
// assim mesmo, com os erros).

import fs from "node:fs";
import path from "node:path";
import { gravaJson } from "../lib/escrita.mjs";
import { ErroCli, KIT, argumentos, carregaCatalogo, carregaRuntime, lerJson, preparaGsap, principal } from "./_runtime.mjs";

export const PECA_PROVA = "_prova-modelos";
export const VISTAS = [
  { nome: "frente", angulo: 0, elevacao: 8 },
  { nome: "3/4", angulo: 34.3775, elevacao: 14.3239 },
];
const TELA_SPLASH = "telas/tela-splash.png"; // fixa no public-kit (tela legada do guia)
const TELA_NOTEBOOK = `pecas/${PECA_PROVA}/telas/tela-teste-notebook.png`; // ligada pelo prova_modelos.py
const POSE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 1 };

function narracaoDoGuia() {
  const c = path.join(KIT, "pecas", "guia-pronta-2026-10-14", "voz", "narracao.json");
  if (!fs.existsSync(c)) throw new ErroCli(`a narração do guia não existe: ${c}`);
  return lerJson(c);
}

/** cena mínima de uma peça de teste com um objeto só */
function cenaDe(id, item) {
  const render = (item && item.render) || {};
  const tipo = render.tipoObjeto || "glb";
  const objeto = { id: "modelo", modelo: id, pose: { ...POSE } };
  const telas = {};
  if (tipo === "aparelho") {
    const notebook = /notebook/.test(id);
    telas.tela = { arquivo: notebook ? TELA_NOTEBOOK : TELA_SPLASH, extras: [] };
    objeto.telaInicial = "tela";
  }
  if (tipo === "relogio") objeto.mostrador = { hora: "9:41", app: "LEGALIZAÍ", quando: "agora", linhas: ["Vence", "dia 20."] };
  if (tipo === "pilula") objeto.conteudo = { texto: "dia 20" };
  if (tipo === "calendario-clay") objeto.conteudo = { mes: 10, etiqueta: "dia 20", estado: { virada: 1, pagina: 0, marca: 1 } };
  return {
    versao: 1, peca: PECA_PROVA, titulo: "prova de modelo", dataPost: "2026-10-03",
    trilha: { id: "mixkit-04-house-one", momento: { palavra: 37 }, ponto: "volta-62.011", ganhoDb: "auto" },
    regioes: {}, telas, objetos: [objeto], batidas: [], camadas: [],
    fatos: { publico: "ME", exemplos: [] },
  };
}

/** cópia do catálogo com uma decisão de mentira pro modelo (só em memória, só pra prova de render) */
function catalogoSemDecisao(catalogo, id) {
  const c = JSON.parse(JSON.stringify(catalogo));
  const lista = c.tipos && c.tipos.modelos && Array.isArray(c.tipos.modelos.itens) ? c.tipos.modelos.itens : [];
  for (const it of lista) {
    if (it.id !== id) continue;
    it.status = "aceito-com-risco";
    it.decisaoRisco = { quem: "prova de render", quando: "2026-10-03", pecas: [PECA_PROVA], texto: "só pra prova de render; a decisão do Pedro continua pendente" };
    delete it.notaLicenca;
    const l = it.licenca || {};
    if ((l.creditoObrigatorio === true || /CC[\s-]*BY/i.test(l.nome || "")) && !(l.creditoLegenda && l.creditoLegenda.trecho)) {
      l.creditoLegenda = { trecho: "prova de render", fonte: "prova", licenca: l.nome || "CC BY" };
      it.licenca = l;
    }
  }
  return c;
}

const LICENCA = /fora do padrão|aceito-com-risco|nota de licença|sem licenca\.creditoLegenda|cita marca/;

await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2), { bandeiras: ["sem-decisao"] });
  if (pos.length < 2) throw new ErroCli("uso: node prova-modelos.mjs <saida.json> <id> [<id> ...] [--sem-decisao]", 2);
  const saida = path.resolve(pos[0]);
  const ids = pos.slice(1);
  const rt = await carregaRuntime();
  const bruto = carregaCatalogo().catalogo;
  const cat = rt.nucleo.normalizaCatalogo(bruto);
  const narracao = narracaoDoGuia();
  const fecho = (() => {
    const f = path.join(KIT, "voz", "fecho", "fecho.json");
    return fs.existsSync(f) ? lerJson(f) : null;
  })();
  const modelos = [];
  let falhas = 0;
  for (const id of ids) {
    const item = cat.modelos[id];
    const cena = cenaDe(id, item);
    // o cartão de teste do notebook não tem origem no catálogo de telas (é um teste de orientação, nunca vira peça):
    // fica fora da conferência de origem, que desde a rodada 4 recusa tela sem origem em qualquer peça
    const opcoes = { narracao, regioes: {}, fecho, catalogo: bruto, camadasConhecidas: rt.camadasConhecidas, batidas: rt.registro, telasDeTeste: [TELA_NOTEBOOK] };
    let r = rt.nucleo.avaliaCena(cena, opcoes);
    let semDecisao = false;
    if (r.erros.length && op["sem-decisao"] && r.erros.every((e) => LICENCA.test(e))) {
      const r2 = rt.nucleo.avaliaCena(cena, { ...opcoes, catalogo: catalogoSemDecisao(bruto, id) });
      if (!r2.erros.length) {
        r = { ...r2, erros: [], avisos: r.erros.map((e) => `(licença, fora da prova) ${e}`).concat(r2.avisos) };
        semDecisao = true;
      }
    }
    preparaGsap(rt.gsap);
    const ok = !r.erros.length && r.props && r.props.objetos && r.props.objetos.length === 1;
    if (!ok) falhas++;
    const objeto = ok ? r.props.objetos[0] : null;
    const telas = ok ? r.props.telas : {};
    const avisos = r.avisos.filter((a) => !/LINK DA BIO|sem dataPost|efeito .* sem verificação|prévia real/.test(a));
    modelos.push({
      id, ok, erros: r.erros, avisos, semDecisao,
      objeto, caixaProps: objeto ? objeto.caixa || null : null, telas,
      trabalhos: ok ? VISTAS.map((v) => ({
        vista: v.nome,
        props: { objeto: { ...objeto, pose: { ...POSE } }, angulo: v.angulo, elevacao: v.elevacao, margem: 0.18, telas, regioes: {}, rotulo: id },
      })) : [],
    });
    console.log(`${ok ? "ok  " : "ERRO"} ${id}${semDecisao ? " (prova sem a decisão do Pedro)" : ""}${ok ? "" : ": " + r.erros.join(" | ")}`);
  }
  gravaJson(saida, { versao: 1, geradoEm: new Date().toISOString(), peca: PECA_PROVA, vistas: VISTAS, modelos }, { criaPasta: true });
  console.log(`gravado: ${saida} (${modelos.length} modelo(s), ${falhas} com erro)`);
  return falhas ? 1 : 0;
});
