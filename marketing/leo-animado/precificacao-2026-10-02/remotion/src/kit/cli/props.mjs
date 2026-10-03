// Props do KitMotion de uma peça (dono K07; contrato: KIT/DESENHO.md, seções 4.4, 4.5, 4.10 e 7.1).
// Uso: node props.mjs <pasta da peça> [--cena <arquivo>]
//   <pasta da peça>: nome em KIT/pecas ou caminho absoluto. --cena: outra cena da peça (padrão cenas.json); o
//   sufixo das saídas vem do nome dela (cenas-kit.json grava props-kit.json).
// Lê a cena (recusa "peca" diferente do nome da pasta: as travas valem pela pasta), a narração, as regiões
// (telas/regioes.json ou inline), o KIT/voz/fecho/fecho.json, o catálogo e a captura de origem de cada tela e de cada
// imagem de camada 2D (as receitas da peça, pro montaProps conferir origem, status e servePecaMei); passa o nome da
// pasta e as peças do palco de argila (o registro da extensão comum, pro cartão do imposto no F063);
// chama o montaProps (núcleo do K02) com camadasConhecidas das extensões e o registro de batidas do núcleo mais
// as extensões; confere que cada tela (e o GLB de cada objeto) existe no RM/public-kit; grava props<sufixo>.json
// pelo escrita.mjs. Erro: nada é gravado e o código de saída é 1. Avisos: impressos e gravados em props.avisos.

import fs from "node:fs";
import path from "node:path";
import { gravaJson } from "../lib/escrita.mjs";
import {
  ErroCli, KIT, PUBLIC_KIT, argumentos, carregaCatalogo, carregaRuntime, confereExtensoesDaCena, leEntradas, lePeca,
  preparaGsap, principal, saidaDaPeca,
} from "./_runtime.mjs";

const TIPOS_COM_GLB = ["aparelho", "relogio", "glb"];

/** captura de origem de cada tela montada por receita: lê KIT/pecas/<peça>/telas/receitas/*.json (menos os que
 * começam com "_") das peças citadas nas telas da cena (pecas/<peça>/telas/<png>) e devolve
 * {"pecas/<peça>/telas/<saida>": {conjunto, arquivo, receita}}; o montaProps confere status e servePecaMei no catálogo */
function origensDasTelas(cena) {
  const origens = {};
  const lidas = {};
  const telas = cena && typeof cena.telas === "object" && cena.telas ? cena.telas : {};
  // os caminhos das telas do aparelho e das imagens das camadas 2D (src): as duas passam pela mesma regra de origem
  const caminhos = Object.keys(telas).map((k) => (telas[k] && typeof telas[k].arquivo === "string" ? telas[k].arquivo : null));
  const srcs = (x) => {
    if (Array.isArray(x)) x.forEach(srcs);
    else if (x && typeof x === "object") for (const k of Object.keys(x)) (k === "src" && typeof x[k] === "string" ? caminhos.push(x[k]) : srcs(x[k]));
  };
  srcs(cena && Array.isArray(cena.camadas) ? cena.camadas : []);
  for (const arquivo of caminhos) {
    const m = typeof arquivo === "string" ? /^pecas\/([^/]+)\/telas\/([^/]+)$/.exec(arquivo) : null;
    if (!m || lidas[m[1]]) continue;
    lidas[m[1]] = true;
    const pasta = path.join(KIT, "pecas", m[1], "telas", "receitas");
    if (!fs.existsSync(pasta)) continue;
    for (const nome of fs.readdirSync(pasta)) {
      if (!/\.json$/i.test(nome) || nome.charAt(0) === "_") continue;
      try {
        const r = JSON.parse(fs.readFileSync(path.join(pasta, nome), "utf8"));
        if (r && typeof r.saida === "string" && r.fonte && typeof r.fonte.conjunto === "string" && typeof r.fonte.arquivo === "string") {
          origens[`pecas/${m[1]}/telas/${r.saida}`] = { conjunto: r.fonte.conjunto, arquivo: r.fonte.arquivo, receita: nome };
        }
      } catch {
        // receita ilegível: o kit.py telas já recusa; aqui a tela fica sem origem (em peça de MEI, o montaProps recusa)
      }
    }
  }
  return origens;
}

/** as peças de um objeto palco já mescladas com as do tipo de palco registrado pela extensão comum (o registro mora em
 *  globalThis.__kitComumPalcos; a mesma mescla do palcoDe do ext/comum/palco/modelo.ts: peça a peça, opcoes campo a
 *  campo). null quando o tipo do objeto não é palco registrado. O montaProps usa pra achar o cartão do imposto (F063) */
function pecasDoPalco(o) {
  const reg = globalThis.__kitComumPalcos;
  const modelo = reg && o && typeof o.tipo === "string" ? reg[o.tipo] : null;
  if (!modelo) return null;
  const daCena = (o.conteudo && typeof o.conteudo === "object" && o.conteudo.pecas) || {};
  const ids = Object.keys(modelo.pecas || {});
  for (const k of Object.keys(daCena)) if (k.charAt(0) !== "_" && ids.indexOf(k) < 0) ids.push(k);
  const out = {};
  for (const k of ids) {
    const base = (modelo.pecas || {})[k] || {};
    const extra = daCena[k] || {};
    out[k] = { ...base, ...extra, opcoes: { ...(base.opcoes || {}), ...(extra.opcoes || {}) } };
  }
  return out;
}

/** AAAA-MM-DD e uma data que existe (o dataPost vira o começo do nome da pasta final) */
function dataValida(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** título e data da proposta: com eles o kit.py entregar monta a pasta FINAL/<dataPost> <titulo>/ (verificação da
 * peça nova, 02/10: título vazio só travava no último passo e "AAAA-MM-DD" não travava em lugar nenhum) */
function confereProposta(cena, erros, avisos) {
  if (typeof cena.titulo === "string" && !cena.titulo.trim()) {
    erros.push('titulo vazio: preencha "titulo" da cena com o título da proposta (com o dataPost, vira a pasta FINAL/<dataPost> <titulo>/)');
  }
  if (cena.dataPost === undefined || cena.dataPost === null) {
    avisos.push('sem dataPost: a peça não pode ser entregue (o kit.py entregar recusa); preencha "dataPost": "AAAA-MM-DD" com a data do post');
  } else if (!dataValida(cena.dataPost)) {
    erros.push(`dataPost "${cena.dataPost}" não é uma data AAAA-MM-DD que existe: preencha com a data do post (vira o começo do nome da pasta final)`);
  }
}

/** a janela da trilha no catálogo tem automação (a Let's Move sobe a intro +8 dB sob a voz até o drop) e a cena não
 * trouxe trilha.automacao: devolve o aviso com a automação deslocada pro momento da peça, ou null */
function avisoAutomacao(catalogo, trilha) {
  if (!trilha || (Array.isArray(trilha.automacao) && trilha.automacao.length)) return null;
  const c = catalogo || {};
  let bruto = c.trilhas || (c.tipos && c.tipos.trilhas) || (c.itens && c.itens.trilhas) || [];
  if (bruto && !Array.isArray(bruto) && Array.isArray(bruto.itens)) bruto = bruto.itens; // catalogo.py exporta
  const itens = Array.isArray(bruto) ? bruto : Object.values(bruto);
  const it = itens.find((x) => x && x.id === trilha.id);
  if (!it || !Array.isArray(it.janelas) || !it.janelas.length) return null;
  const ponto = (Array.isArray(it.pontos) ? it.pontos : []).find((p) => p && p.id === trilha.ponto);
  const jan =
    it.janelas.find((j) => j && ((ponto && j.nome === ponto.janela) || (trilha.ponto && j.ponto === trilha.ponto))) ||
    (it.janelas.length === 1 ? it.janelas[0] : null);
  if (!jan || !Array.isArray(jan.automacao) || !jan.automacao.length) return null;
  const base = `a janela "${jan.nome}" da trilha ${trilha.id} sobe a trilha por automação (${JSON.stringify(jan.automacao)}, medida com o ponto em ${jan.pontoNoVideo} s do vídeo) e a cena não tem trilha.automacao`;
  if (typeof jan.mStart !== "number" || typeof trilha.mStart !== "number") return `${base}: copie com os tempos deslocados pro seu momento`;
  // a música anda junto: deslocar pela diferença de mStart (com momento e ponto, é o momento menos o pontoNoVideo)
  const desloc = jan.mStart - trilha.mStart;
  const sugerida = jan.automacao.map((p) => [Math.max(0, Math.round((Number(p[0]) + desloc) * 1000) / 1000), Number(p[1])]);
  const pontoAqui = typeof jan.pontoNoVideo === "number" ? `${(jan.pontoNoVideo + desloc).toFixed(2)} s` : "outro instante";
  return `${base}; na sua peça o ponto cai em ${pontoAqui} do vídeo, então a mesma automação é "automacao": ${JSON.stringify(sugerida)} (copie pra trilha.automacao; sem automação de propósito: [[0, 0]])`;
}

await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2));
  if (pos.length !== 1) throw new ErroCli("uso: node props.mjs <pasta da peça> [--cena <arquivo>]", 2);
  const peca = lePeca(pos[0], op.cena);
  const ent = leEntradas(peca);
  const rt = await carregaRuntime();
  const cat = carregaCatalogo();
  console.log(`peça: ${peca.pasta}`);
  console.log(`cena: ${peca.caminhoCena}`);
  console.log(`narração: ${ent.caminhoNarr}`);
  console.log(`regiões: ${ent.origemRegioes}`);
  console.log(`fecho: ${ent.origemFecho}`);
  console.log(`catálogo: ${cat.origem}`);
  const nomesExt = rt.extensoes.map((e) => `${e.nome}${e.ok ? "" : " (desligada)"}`);
  console.log(`extensões: ${nomesExt.length ? nomesExt.join(", ") : "nenhuma"}; camadas conhecidas: ${rt.camadasConhecidas.length ? rt.camadasConhecidas.join(", ") : "nenhuma"}`);
  for (const a of rt.avisos) console.log(`AVISO: ${a}`);

  const r = rt.nucleo.avaliaCena(peca.cena, {
    narracao: ent.narracao,
    regioes: ent.regioes,
    fecho: ent.fecho,
    catalogo: cat.catalogo,
    camadasConhecidas: rt.camadasConhecidas,
    batidas: rt.registro,
    origensTelas: origensDasTelas(peca.cena),
    // a peça é a PASTA (rodada 4): as travas de trilha, de modelo e a exceção da peça de teste valem por ela
    peca: peca.nome,
    pecasDoPalco,
  });
  preparaGsap(rt.gsap);

  const erros = r.erros.slice();
  for (const e of confereExtensoesDaCena(rt, peca.cena)) erros.push(e);

  // arquivos que o render busca no public-kit (a composição KitMotion renderiza com --public-dir=public-kit)
  if (r.props) {
    for (const chave of Object.keys(r.props.telas || {})) {
      const arq = r.props.telas[chave].arquivo;
      const abs = path.join(PUBLIC_KIT, arq);
      if (!fs.existsSync(abs)) {
        erros.push(`tela "${chave}": ${arq} não existe no RM/public-kit (${abs}); nas peças novas, rode kit.py telas ${peca.nome}`);
      }
    }
    for (const o of r.props.objetos || []) {
      if (TIPOS_COM_GLB.indexOf(o.tipo) < 0) continue;
      if (!o.arquivo) erros.push(`objeto ${o.id} (${o.tipo}): o modelo ${o.modelo} não tem render.publicKit no catálogo (o render não acha o GLB; kit.py modelos ${peca.nome} mostra o motivo)`);
      else if (!fs.existsSync(path.join(PUBLIC_KIT, o.arquivo))) {
        erros.push(`objeto ${o.id}: ${o.arquivo} não existe no RM/public-kit (modelo ${o.modelo}); rode pelo kit.py props (que liga os GLB da cena) ou kit.py modelos ${peca.nome}`);
      }
    }
  }

  // o r.avisos é o mesmo array de props.avisos: estes avisos também vão pro props.json
  confereProposta(peca.cena || {}, erros, r.avisos);
  if (r.props) {
    const aviso = avisoAutomacao(cat.catalogo, r.props.trilha);
    if (aviso) r.avisos.push(aviso);
  }

  console.log(`\navisos (${r.avisos.length}):`);
  for (const a of r.avisos) console.log(`  - ${a}`);
  if (erros.length) {
    console.log(`\nERRO: ${erros.length} erro(s); nada foi gravado:`);
    for (const e of erros) console.log(`  - ${e}`);
    return 1;
  }

  const saida = saidaDaPeca(peca, "props", ".json");
  const g = gravaJson(saida, r.props);
  const p = r.props;
  console.log(`\ngravado: ${g.caminho} (${g.tamanho} bytes)`);
  console.log(
    `duração ${p.duracao} s, ${p.quadros} quadros, tFecho ${p.tFecho}, periódico ${p.ambiente.periodico}, ` +
      `sons ${p.sons.perfil}/${p.sons.modoRuido}, ${r.eventos.length} eventos no ensaio, ${p.objetos.length} objetos, ` +
      `${Object.keys(p.telas).length} telas, ${p.batidas.length} batidas`,
  );
  console.log(`creditoLegenda: ${p.creditoLegenda === null ? "(nenhum modelo pede crédito)" : p.creditoLegenda}`);
  return 0;
});
