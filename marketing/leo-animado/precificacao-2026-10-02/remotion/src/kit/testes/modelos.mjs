// Modelos da biblioteca no montaProps (frente MODELOS NO RENDER, 03/10; KIT/DESENHO.md, seções 4.4 e 4.9): caminho
// no public-kit, escala, rotacaoBase, pivô (caixa centrada no rig), cores e materiais do catálogo somados aos da cena,
// os erros de campo e de licença, e os objetos do guia sem nenhum campo novo. Usa o catálogo real (catalogo.py
// exporta); com KIT_SEM_K01=1 (catálogo mínimo, sem a biblioteca) pula com código 3. Nada é gravado.
// Uso: node modelos.mjs        (código de saída 0 = passou)

import { carregaNucleo } from "./esbuild-node.mjs";
import { carregaCatalogo, dormeTicker, lerCena, lerFecho, lerNarracao } from "./comum.mjs";

const kit = await carregaNucleo();
dormeTicker(kit.gsap);
const base = lerCena("cenas.json");
const narr = lerNarracao(base.cena, base.pasta).narracao;
const fecho = lerFecho().fecho;
const { catalogo, origem } = carregaCatalogo();
console.log(`catálogo: ${origem}`);
const cat = kit.normalizaCatalogo(catalogo);
if (!cat.modelos["glb-despertador"] || !cat.modelos["glb-despertador"].render || !cat.modelos["glb-despertador"].render.publicKit) {
  console.log("PULADO: o catálogo não tem o bloco render da biblioteca (catálogo mínimo); rode sem KIT_SEM_K01");
  process.exit(3);
}

const copia = (x) => JSON.parse(JSON.stringify(x));
/** cena de peça de teste com os objetos dados (o resto é o guia, sem as batidas que pedem o celular) */
function cenaCom(objetos, peca = "_teste-modelos") {
  const c = copia(base.cena);
  c.peca = peca;
  c.trilha = { id: "mixkit-04-house-one", mStart: 51.711, ganhoDb: -6.7 };
  c.objetos = objetos;
  c.batidas = [];
  c.telas = {};
  c.regioes = {};
  return c;
}
const avalia = (cena) => kit.avaliaCena(cena, { narracao: narr, fecho, catalogo });
const POSE = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 1 };
let falhas = 0;
const confere = (nome, ok, visto) => {
  if (!ok) falhas++;
  console.log(`[${ok ? "ok" : "FALHA"}] ${nome}${visto !== undefined ? ": " + visto : ""}`);
};
const quase = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

// 1) despertador: caminho, pivô centro (caixa centrada), matiz do catálogo
{
  const r = avalia(cenaCom([{ id: "d", modelo: "glb-despertador", pose: POSE }]));
  const o = r.props && r.props.objetos[0];
  confere("despertador monta sem erro", !!o && !r.erros.length, JSON.stringify(r.erros));
  if (o) {
    confere("arquivo 3d/biblioteca/glb-despertador.glb", o.arquivo === "3d/biblioteca/glb-despertador.glb", o.arquivo);
    const c = o.caixa;
    const centrada = [0, 1, 2].every((i) => quase(c.min[i] + c.max[i], 0));
    confere("pivô centro: caixa do rig centrada na origem", centrada, JSON.stringify(c));
    confere("pivô = menos o centro da caixa do catálogo", Array.isArray(o.pivo) && quase(o.pivo[1], -0.08585, 1e-6), JSON.stringify(o.pivo));
    const mz = o.materiais && o.materiais.alarm_clock_01;
    confere("materiais do catálogo (troca de matiz) nas props", !!(mz && mz.matiz && mz.matiz[0].para === "#F2643C"), JSON.stringify(o.materiais));
    confere("sombra do catálogo", o.sombra === 0.65, o.sombra);
  }
}
// 2) prancheta: rotacaoBase +π/2 (de pé), caixa na vertical
{
  const r = avalia(cenaCom([{ id: "p", modelo: "glb-prancheta", pose: POSE }]));
  const o = r.props && r.props.objetos[0];
  const t = o ? [0, 1, 2].map((i) => o.caixa.max[i] - o.caixa.min[i]) : [];
  confere("prancheta de pé (y 0,3366 e z 0,042)", !!o && quase(t[1], 0.33655, 1e-4) && quase(t[2], 0.04199, 1e-4), JSON.stringify(t));
}
// 3) pilhas de moedas: escala do bloco render (o inventário não tinha) e caixa reescalada
{
  const r = avalia(cenaCom([{ id: "m", modelo: "glb-moedas-pilhas", pose: POSE }]));
  const o = r.props && r.props.objetos[0];
  const t = o ? [0, 1, 2].map((i) => o.caixa.max[i] - o.caixa.min[i]) : [];
  confere("moedas: escala 0,1 e caixa de 4,6 x 3,4 x 6,4 cm", !!o && o.escala === 0.1 && quase(t[0], 0.0456685, 1e-6) && quase(t[2], 0.063538, 1e-6), `${o && o.escala} ${JSON.stringify(t)}`);
}
// 4) materiais e cores da cena somam com os do catálogo (a cena vence campo a campo)
{
  const r = avalia(cenaCom([
    { id: "d", modelo: "glb-despertador", pose: POSE, materiais: { alarm_clock_01: { rugosidade: 0.3 } } },
    { id: "c", modelo: "glb-caneca", pose: POSE, cores: { Corpo: "#1B1E24" } },
  ]));
  const [d, c] = r.props ? r.props.objetos : [];
  confere("materiais da cena somados (matiz do catálogo + rugosidade da cena)", !!d && d.materiais.alarm_clock_01.rugosidade === 0.3 && !!d.materiais.alarm_clock_01.matiz, JSON.stringify(d && d.materiais));
  confere("cores da cena vencem as do catálogo (e as outras ficam)", !!c && c.cores.Corpo === "#1B1E24" && c.cores.Faixas === "#FAF8F5", JSON.stringify(c && c.cores));
}
// 5) erros de campo
for (const [nome, objeto, rx] of [
  ["cor que não é hex", { cores: { Corpo: "laranja" } }, /cores\.Corpo precisa ser cor #RRGGBB/],
  ["campo de material que não existe", { materiais: { Corpo: { brilho: 1 } } }, /materiais\.Corpo\.brilho não existe/],
  ["matiz sem hex", { materiais: { Corpo: { matiz: [{ de: "verde", para: "#F2643C" }] } } }, /materiais\.Corpo\.matiz precisa ser lista/],
  ["número negativo", { materiais: { Corpo: { opacidade: -1 } } }, /materiais\.Corpo\.opacidade precisa ser número >= 0/],
]) {
  const r = avalia(cenaCom([{ id: "c", modelo: "glb-caneca", pose: POSE, ...objeto }]));
  const visto = r.erros.filter((e) => rx.test(e))[0];
  confere(`erro: ${nome}`, !!visto && r.props === null, visto || JSON.stringify(r.erros));
}
// 6) licença: decisão pendente recusa; aceito com risco fora da peça da decisão avisa
{
  const r = avalia(cenaCom([{ id: "c", modelo: "glb-camera-fotografica", pose: POSE }]));
  confere("câmera (decisão pendente) recusada", r.props === null && r.erros.some((e) => /glb-camera-fotografica está fora do padrão/.test(e)), JSON.stringify(r.erros));
  const r2 = avalia(cenaCom([{ id: "c", modelo: "glb-celular-iphone15-limpo", pose: POSE, telaInicial: "apagada" }], "2026-10-20-teste"));
  confere("celular da biblioteca fora da peça da decisão: aviso", !r2.erros.length && r2.avisos.some((a) => /glb-celular-iphone15-limpo aceito com risco .* confirmar com o Pedro/.test(a)), JSON.stringify(r2.erros));
}
// 7) os objetos do guia não ganham campo novo (as props do guia ficam iguais)
{
  const r = kit.avaliaCena(copia(base.cena), { narracao: narr, fecho, catalogo, regioes: base.cena.regioes && typeof base.cena.regioes === "object" ? base.cena.regioes : undefined });
  const objs = r.props ? r.props.objetos : [];
  const novos = objs.filter((o) => o.pivo !== undefined || o.materiais !== undefined || o.cores !== undefined);
  confere("objetos do guia sem pivo, materiais e cores", r.props !== null && novos.length === 0, novos.map((o) => o.id).join(", ") || JSON.stringify(r.erros).slice(0, 300));
}

dormeTicker(kit.gsap);
console.log(`\nresultado: ${falhas ? "FALHOU" : "PASSOU"} (${falhas} falha(s))`);
process.exit(falhas ? 1 : 0);
