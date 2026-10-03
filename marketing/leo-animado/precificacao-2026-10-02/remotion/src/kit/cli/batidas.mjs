// Lista as batidas e as camadas do núcleo e das extensões (dono K07; contrato: KIT/DESENHO.md, seções 4.3, 4.10, 5).
// Uso: node batidas.mjs [--json]
// Pra cada batida: id, de onde vem (núcleo ou extensão), camada, descrição, âncoras, parâmetros padrão (os números
// do reel da guia) e sons por perfil (v2 = o aprovado). Pra cada tipo de camada das extensões: descrição,
// parâmetros e canais. Extensão com erro aparece como desligada, com a mensagem.

import { ErroCli, argumentos, carregaRuntime, principal } from "./_runtime.mjs";

const somTexto = (s) => {
  const partes = [`${s.som}`];
  if (s.args && s.args.length) partes.push(`[${s.args.join(", ")}]`);
  partes.push(`${s.em}${s.desloc ? (s.desloc > 0 ? "+" : "") + s.desloc : ""}`);
  partes.push(`${s.ganhoDb} dB`);
  if (s.inverte) partes.push("inverte");
  if (s.filtro) partes.push(`filtro ${s.filtro}`);
  if (s.transpor !== undefined) partes.push(`transpor ${s.transpor}`);
  if (s.ancora) partes.push(`âncora ${s.ancora}`);
  return partes.join(" ");
};

/** padrão em JSON compacto, com -2π e afins legíveis */
const compacto = (x) => JSON.stringify(x, (_k, v) => (typeof v === "number" && Math.abs(v + 2 * Math.PI) < 1e-12 ? "-2π" : v));

await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2), { bandeiras: ["json"] });
  if (pos.length) throw new ErroCli("uso: node batidas.mjs [--json]", 2);
  const rt = await carregaRuntime();
  const batidas = Object.keys(rt.registro).map((id) => {
    const b = rt.registro[id];
    return {
      id,
      origem: rt.donoBatida[id],
      camada: b.camada,
      descricao: b.descricao,
      ancoras: b.ancoras,
      padrao: b.padrao,
      sons: b.sons,
    };
  });
  const camadas = Object.keys(rt.metaCamadas).map((tipo) => ({ tipo, origem: rt.donoCamada[tipo], ...rt.metaCamadas[tipo] }));
  const extensoes = rt.extensoes.map((e) => ({ nome: e.nome, ok: e.ok, erro: e.erro, batidas: Object.keys(e.batidas), camadas: Object.keys(e.camadas), midia: e.midia }));
  if (op.json) {
    console.log(JSON.stringify({ versao: 1, batidas, camadas, extensoes, avisos: rt.avisos }, null, 2));
    return 0;
  }
  console.log(`${batidas.length} batidas (${batidas.filter((b) => b.origem === "núcleo").length} do núcleo), ${camadas.length} tipos de camada, ${extensoes.length} extensões\n`);
  for (const b of batidas) {
    console.log(`${b.id}  (${b.origem}, camada ${b.camada})`);
    console.log(`  ${b.descricao}`);
    console.log(`  âncoras: ${(b.ancoras || []).join(", ")}`);
    console.log(`  padrão: ${compacto(b.padrao)}`);
    for (const perfil of Object.keys(b.sons || {})) {
      const lista = b.sons[perfil] || [];
      console.log(`  sons ${perfil}: ${lista.length ? lista.map(somTexto).join("; ") : "nenhum"}`);
    }
    console.log("");
  }
  if (camadas.length) {
    console.log("camadas 2D das extensões:");
    for (const c of camadas) {
      console.log(`  ${c.tipo}  (${c.origem}): ${c.descricao || ""}`);
      console.log(`    params: ${compacto(c.params || {})}; canais: ${(c.canais || []).join(", ")}`);
    }
    console.log("");
  } else {
    console.log("camadas 2D: nenhuma (nenhuma extensão com camadas)\n");
  }
  if (extensoes.length) {
    console.log("extensões:");
    for (const e of extensoes) {
      console.log(`  ${e.nome}: ${e.ok ? "ligada" : "DESLIGADA (" + e.erro + ")"}; batidas ${e.batidas.join(", ") || "nenhuma"}; camadas ${e.camadas.join(", ") || "nenhuma"}${e.midia ? "; midia.json" : ""}`);
    }
  } else {
    console.log("extensões: nenhuma em RM/src/kit/ext/");
  }
  for (const a of rt.avisos) console.log(`AVISO: ${a}`);
  return 0;
});
