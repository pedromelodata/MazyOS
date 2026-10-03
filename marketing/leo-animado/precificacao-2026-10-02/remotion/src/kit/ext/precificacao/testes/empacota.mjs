// Prova de empacotamento da extensão "precificacao" em memória (dono K14; contrato: KIT/DESENHO.md, 4.10 e 4.11).
// Uso: node empacota.mjs [--saida <relatorio.json absoluto>]
//
// Erro de sintaxe ou de import numa extensão derruba o bundle de todas as composições; por isso, antes de
// entregar:
// - render.tsx empacotado como o bundle do Remotion o veria (plataforma browser, jsx automatic, tudo embutido);
// - batidas.ts empacotado nas plataformas browser e node com o plugin "puro" (React, Remotion, three,
//   @react-three, SplitText e DrawSVGPlugin recusados): prova que as batidas rodam em Node, como o K07 carrega;
// - nada de efeito colateral no import: o texto dos pacotes não registra plugin, não cria ease, não mexe nos padrões
//   do gsap nem no gancho global de textura do img2three; importar o pacote das batidas não cria global;
// - o contrato da seção 4.10: batidas.ts exporta batidas e camadas; render.tsx exporta render.camadas com os mesmos
//   tipos de camada (os 23 componentes do kit.tsx, mais p2d-grupo e p2d-legenda).
// Nada vai pro disco (só o relatório, quando pedido).

import { EXT, argSaida, arquivoExt, empacota, esbuild, gravaRelatorio, pluginCalcos, pluginPuro, RM } from "./comum.mjs";
import fs from "node:fs";
import path from "node:path";

// os nomes procurados são montados aqui (assim a busca por eles nas pastas da extensão dá zero)
const GANCHO = ["__img2three", "TexLoad"].join("");
const T = {
  gancho: GANCHO,
  ganchoGlobal: ["globalThis", GANCHO].join("."),
  plugin: ["register", "Plugin"].join(""),
  ease: ["Custom", "Ease"].join(""),
  easeNova: ["Custom", "Ease.create"].join(""),
  padroes: ["gsap", "defaults"].join("."),
  padroesChamada: [".", "defaults("].join(""),
  easeKit: ["cria", "EaseKit"].join(""),
};

const rel = { versao: 1, geradoEm: new Date().toISOString(), pacotes: {}, checagens: [] };
let ok = true;
const confere = (nome, cond, detalhe = "") => {
  rel.checagens.push({ nome, passou: !!cond, detalhe });
  if (!cond) ok = false;
};

/** empacota sem importar e devolve o texto (ou o erro) */
async function so(entrada, plataforma, plugins) {
  try {
    const r = await empacota(entrada, { plataforma, plugins, importa: false });
    return { ok: true, bytes: r.bytes, avisos: r.avisos.length, codigo: r.codigo };
  } catch (e) {
    return { ok: false, erro: (e.errors || []).map((x) => `${x.location ? x.location.file + ":" + x.location.line + " " : ""}${x.text}`).join("; ") || e.message };
  }
}

// 1. render.tsx como o bundle do Remotion veria
const render = await so(`export { render } from "./render";`, "browser", []);
rel.pacotes.renderBrowser = { ok: render.ok, bytes: render.bytes, avisos: render.avisos, erro: render.erro || null };
confere("render.tsx empacota em memória (browser, jsx automatic)", render.ok, render.erro || `${render.bytes} bytes, ${render.avisos} avisos do esbuild`);

// 2. batidas.ts puro, nas duas plataformas
for (const plataforma of ["browser", "node"]) {
  const b = await so(`export { batidas, camadas } from "./batidas";`, plataforma, [pluginPuro]);
  rel.pacotes[`batidas-${plataforma}`] = { ok: b.ok, bytes: b.bytes, avisos: b.avisos, erro: b.erro || null };
  confere(`batidas.ts empacota puro (${plataforma}: sem React, Remotion, three, SplitText e DrawSVG)`, b.ok, b.erro || `${b.bytes} bytes`);
  if (b.ok) {
    const proibidos = [T.plugin, T.ease, T.gancho, T.padroesChamada, "GreenSock"];
    const achados = proibidos.filter((p) => b.codigo.indexOf(p) >= 0);
    confere(`pacote das batidas (${plataforma}) sem plugin, ease, padrões do gsap e gancho global`, achados.length === 0, achados.join(", "));
  }
}
if (render.ok) {
  const achados = [T.gancho, T.plugin, T.easeNova, T.padroes].filter((p) => render.codigo.indexOf(p) >= 0);
  confere("pacote do render sem gancho global, plugin, ease nova e padrões do gsap", achados.length === 0, achados.join(", "));
  confere("o render não puxa o gsap (só lê o estado)", render.codigo.indexOf("GreenSock") < 0);
}

// 3. as fontes da extensão (texto): nada de efeito colateral nem de travessão
{
  const arquivos = ["batidas.ts", "render.tsx", "transicoes.ts", "cortes.ts", "curvas.ts"];
  const ruins = [];
  for (const a of arquivos) {
    const t = fs.readFileSync(arquivoExt(a), "utf8");
    for (const p of [T.ganchoGlobal, T.easeNova, T.padroes, T.plugin, T.easeKit, String.fromCharCode(0x2014), String.fromCharCode(0x2013)]) {
      if (t.indexOf(p) >= 0) ruins.push(`${a}: ${p.length === 1 ? "U+" + p.charCodeAt(0).toString(16).toUpperCase() : p}`);
    }
  }
  confere("fontes sem gancho global, ease nova, padrões do gsap, plugin e travessão", ruins.length === 0, ruins.join("; "));
}

// 4. importar o pacote das batidas não cria global; os exports seguem a seção 4.10
{
  const antes = new Set(Object.keys(globalThis));
  const gancho = globalThis[GANCHO];
  const { modulo } = await empacota(`export { batidas, camadas, COMPONENTES, TIPO_GRUPO, TIPO_LEGENDA, PREFIXO } from "./batidas";`, { plataforma: "node", plugins: [pluginPuro] });
  const novos = Object.keys(globalThis).filter((k) => !antes.has(k));
  confere("importar as batidas não cria nem troca global", novos.length === 0 && globalThis[GANCHO] === gancho, novos.join(", "));
  const ids = Object.keys(modulo.batidas).sort();
  const esperadas = ["p2d-canal", "p2d-corte", "p2d-entra", "p2d-mola", "p2d-sai", "p2d-transicao", "p2d-treme"];
  confere("batidas: p2d-entra, p2d-sai, p2d-mola, p2d-treme, p2d-canal, p2d-transicao e p2d-corte", ids.join(",") === esperadas.join(","), ids.join(", "));
  const tipos = Object.keys(modulo.camadas);
  const esperados = modulo.COMPONENTES.map((n) => modulo.PREFIXO + n).concat([modulo.TIPO_GRUPO, modulo.TIPO_LEGENDA]);
  confere("camadas: os 23 componentes do kit.tsx, p2d-grupo e p2d-legenda", tipos.length === 25 && esperados.every((t) => tipos.indexOf(t) >= 0), `${tipos.length} tipos`);
  const semMeta = tipos.filter((t) => !modulo.camadas[t].descricao || !Array.isArray(modulo.camadas[t].canais) || typeof modulo.camadas[t].params !== "object");
  confere("cada camada tem descricao, params e canais", semMeta.length === 0, semMeta.join(", "));
  rel.batidas = ids;
  rel.camadas = tipos;
  // render.camadas com os mesmos tipos (o pacote do render roda em Node com o calço do Remotion)
  const r = await empacota(`export { render } from "./render";`, { plataforma: "node", plugins: [pluginCalcos] });
  const tiposRender = Object.keys(r.modulo.render.camadas || {}).sort();
  confere("render.camadas com os mesmos 25 tipos do batidas.ts", tiposRender.join(",") === tipos.slice().sort().join(","), `${tiposRender.length} tipos`);
  confere("render sem objetos 3D (a biblioteca 2D é só camada)", !r.modulo.render.objetos);
}

// 5. o mesmo empacotamento que o K07 faz em Node (extensão isolada, gsap do núcleo injetado)
if (path.dirname(arquivoExt("batidas.ts")).toLowerCase() !== EXT.toLowerCase()) {
  rel.checagens.push({ nome: "batidas.ts empacota como o _runtime.mjs do K07 (entrada direta)", passou: true, detalhe: "pulado no rascunho (só vale com o arquivo no lugar)" });
} else {
  const ext = arquivoExt("batidas.ts");
  try {
    const r = await esbuild.build({ bundle: true, write: false, platform: "node", format: "esm", target: "node20", absWorkingDir: RM, logLevel: "silent", entryPoints: [ext], plugins: [] });
    confere("batidas.ts empacota como o _runtime.mjs do K07 (entrada direta)", r.outputFiles.length === 1, `${r.outputFiles[0].text.length} bytes`);
  } catch (e) {
    confere("batidas.ts empacota como o _runtime.mjs do K07 (entrada direta)", false, (e.errors || []).map((x) => x.text).join("; ") || e.message);
  }
}

for (const r of rel.checagens) console.log(`${r.passou ? "ok   " : "FALHA"} ${r.nome}${r.detalhe ? ` (${r.detalhe})` : ""}`);
rel.passou = ok;
console.log(ok ? "\nRESULTADO: a extensão empacota sem erro e sem efeito colateral" : "\nRESULTADO: FALHOU");
const saida = argSaida(process.argv);
if (saida) {
  const g = await gravaRelatorio(saida, rel);
  console.log(`relatório: ${g.caminho} (${g.tamanho} bytes)`);
}
process.exit(ok ? 0 : 1);
