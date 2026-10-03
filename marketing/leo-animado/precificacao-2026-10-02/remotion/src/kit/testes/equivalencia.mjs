// Prova de equivalência (dono K02; KIT/DESENHO.md seções 4.2, 5 e 11, rodada 1, passo 2).
// Empacota (a) a coreografia original do guia (RM/src/guia/coreografia.ts e estado.ts, com o calço no lugar do
// useMasterTimeline) e (b) o núcleo do kit com as 13 batidas e a cena da regressão (cenas.json). Monta as duas
// timelines (pausadas, mesmos defaults), dá seek(0, false) e compara o estado nos 540 quadros
// (seek k/30 + 1e-4): primeiro em ordem, depois embaralhado com semente fixa. Tolerância 1e-9.
// Confere também o instante "verso" calculado: 9,3586 ± 0,001 s.
// Uso: node equivalencia.mjs            (código de saída 0 = passou)

import { carregaNucleo, carregaOriginal } from "./esbuild-node.mjs";
import {
  carregaCatalogo, dormeTicker, embaralha, lerCena, lerFecho, lerNarracao, md5Arquivo, MD5_NARRACAO_REF, NARRACAO_ORIGINAL,
} from "./comum.mjs";

const TOL = 1e-9;
const FPS = 30;
const QUADROS = 540;
const SEMENTE = 20261014;

const original = await carregaOriginal();
const kit = await carregaNucleo();
dormeTicker(original.gsap, kit.gsap); // antes de tudo

const { cena, pasta, caminho } = lerCena("cenas.json");
const narr = lerNarracao(cena, pasta);
const fecho = lerFecho();
const cat = carregaCatalogo();
console.log(`cena: ${caminho}`);
console.log(`narração: ${narr.origem}${narr.usouFallback ? " (a da peça ainda não existe: usei a do guia)" : ""}, md5 ${narr.md5}${narr.md5 === MD5_NARRACAO_REF ? " (igual ao REF)" : " (DIFERENTE do REF " + MD5_NARRACAO_REF + ")"}`);
console.log(`fecho: ${fecho.origem}`);
console.log(`catálogo: ${cat.origem}`);
if (md5Arquivo(NARRACAO_ORIGINAL) !== MD5_NARRACAO_REF) console.log("ATENÇÃO: RM/src/guia/narracao.json mudou desde o REF");

const avisosProps = [];
const props = kit.montaProps(cena, { narracao: narr.narracao, fecho: fecho.fecho, catalogo: cat.catalogo });
avisosProps.push(...props.avisos);

function montaOriginal() {
  const st = original.novoEstado();
  const tl = original.gsap.timeline({ paused: true, defaults: { ease: "lgEntra", duration: 0.32 } });
  original.coreografia(tl, st);
  tl.seek(0, false);
  return { st, tl };
}

function montaKit(p) {
  kit.registraEases(kit.gsap, kit.CustomEase);
  const st = kit.novoEstado(p);
  const tl = kit.novaTimeline(kit.gsap);
  const avisos = [];
  const eventos = kit.montaTimeline(tl, st, p, kit.BATIDAS_NUCLEO, { avisos });
  tl.seek(0, false);
  return { st, tl, eventos, avisos };
}

const OBJ = ["x", "y", "z", "rx", "ry", "rz", "s", "vis"];
const TELA = ["a", "b", "p", "modo", "luz", "brilhoCard", "conta", "calc", "toque", "toqueBotao", "pulso", "verif", "anel", "verifTexto"];

/** pares [campo, original, kit] pelo mapeamento da seção 4.2 */
function pares(o, k) {
  const L = [];
  for (const c of ["x", "y", "z", "tx", "ty", "tz", "fov"]) L.push([`cam.${c}`, o.cam[c], k.cam[c]]);
  for (const c of OBJ) L.push([`obj.aparelho.${c} (phone)`, o.phone[c], k.obj.aparelho[c]]);
  for (const c of OBJ.concat(["buzz"])) L.push([`obj.relogio.${c} (watch)`, o.watch[c], k.obj.relogio[c]]);
  for (const c of OBJ) L.push([`obj.guia.${c} (folha)`, o.folha[c], k.obj.guia[c]]);
  for (const c of TELA) L.push([`telas.aparelho.${c} (tela)`, o.tela[c], k.telas.aparelho[c]]);
  for (const c of ["notif", "luz"]) L.push([`mostradores.relogio.${c} (relogio)`, o.relogio[c], k.mostradores.relogio[c]]);
  L.push(["luz.varre", o.luz.varre, k.luz.varre]);
  for (const c of ["assina", "ai", "link"]) L.push([`ui.${c}`, o.ui[c], k.ui[c]]);
  return L;
}

function rodada(nome, ordem, A, B) {
  let maxDif = 0;
  let campoMax = "";
  let primeiro = null;
  let desvios = 0;
  let comparados = 0;
  for (const q of ordem) {
    const t = q / FPS + 1e-4;
    A.tl.seek(t, false);
    B.tl.seek(t, false);
    for (const [campo, a, b] of pares(A.st, B.st)) {
      comparados++;
      let ruim;
      if (typeof a === "string" || typeof b === "string") ruim = a !== b;
      else {
        const d = Math.abs(a - b);
        ruim = !(d <= TOL);
        if (d > maxDif) {
          maxDif = d;
          campoMax = `${campo} no quadro ${q}`;
        }
      }
      if (ruim) {
        desvios++;
        if (!primeiro) primeiro = { quadro: q, t, campo, original: a, kit: b };
      }
    }
  }
  const ok = desvios === 0;
  console.log(`\n[${ok ? "ok" : "FALHA"}] ${nome}: ${ordem.length} quadros, ${comparados} comparações, ${desvios} desvio(s) acima de ${TOL}`);
  console.log(`      maior diferença: ${maxDif.toExponential(3)}${campoMax ? " (" + campoMax + ")" : ""}`);
  if (primeiro) {
    console.log(`      primeiro desvio: quadro ${primeiro.quadro} (t ${primeiro.t.toFixed(4)} s), campo ${primeiro.campo}: original ${JSON.stringify(primeiro.original)} contra kit ${JSON.stringify(primeiro.kit)}`);
  }
  return ok;
}

const emOrdem = Array.from({ length: QUADROS }, (_, i) => i);
const embaralhado = embaralha(emOrdem, SEMENTE);
const resultados = [];

// 1 e 2: as timelines montadas uma vez; em ordem e depois embaralhado
const O1 = montaOriginal();
const K1 = montaKit(props);
avisosProps.push(...K1.avisos);
resultados.push(rodada("em ordem", emOrdem, O1, K1));
resultados.push(rodada(`embaralhado (semente ${SEMENTE})`, embaralhado, O1, K1));

// 3 (a mais): timelines novas e o primeiro seek já embaralhado (os tweens iniciam fora de ordem)
const O2 = montaOriginal();
const K2 = montaKit(props);
resultados.push(rodada("embaralhado com timelines novas (extra)", embaralha(emOrdem, SEMENTE + 1), O2, K2));

// 4: o instante "verso" calculado, contra o cruzamento de ry = -π medido na própria timeline original
const giro = kit.flipTrocaEscondida.padrao;
const verso = kit.calculaVerso({
  t0: 8.98 + giro.giro.desloc,
  dur: giro.giro.dur,
  ease: giro.giro.ease,
  ry0: giro.antecipacao.para.ry,
  ryFim: giro.giro.para.ry,
  fps: FPS,
  durVideo: props.duracao,
});
const O4 = montaOriginal();
let lo = 9.18;
let hi = 9.96;
for (let i = 0; i < 80; i++) {
  const m = (lo + hi) / 2;
  O4.tl.seek(m, false);
  if (O4.st.phone.ry > -Math.PI) lo = m;
  else hi = m;
}
const cruzamento = (lo + hi) / 2;
const quadrosVerso = [];
for (let k = 270; k <= 292; k++) {
  O4.tl.seek(k / FPS + 1e-4, false);
  if (Math.cos(O4.st.phone.ry) * Math.cos(O4.st.phone.rx) < 0) quadrosVerso.push(k);
}
const versoOk = !!verso && Math.abs(verso.t - cruzamento) <= 0.001 && verso.quadros === quadrosVerso.length;
const p3 = kit.gsap.parseEase("power3.out");
const eAlvo = (Math.PI + 0.57) / (2 * Math.PI + 0.57);
const cubico = 9.18 + (1 - Math.cbrt(1 - eAlvo)) * 0.78;
console.log(`\n[${versoOk ? "ok" : "FALHA"}] instante "verso": ${verso ? verso.t.toFixed(6) : "nulo"} s (quadro ${verso ? verso.quadro.toFixed(2) : "?"}); medido na timeline original: ry cruza -π em ${cruzamento.toFixed(6)} s (quadro ${(cruzamento * FPS).toFixed(2)}); tolerância 0,001`);
if (verso) {
  console.log(`      verso de frente de ${verso.entra.toFixed(4)} a ${verso.sai.toFixed(4)} s: ${verso.quadros} quadros pelo cálculo; na timeline original: ${quadrosVerso.length} quadros (${quadrosVerso[0]} a ${quadrosVerso[quadrosVerso.length - 1]}); o mínimo é 4`);
  console.log(`      a troca com "verso" entra em ${verso.troca.toFixed(6)} s (meio quadro antes do quadro ${Math.round(verso.troca * FPS + 0.5)}); o original usa 9,35 (troca no quadro 281); as duas ficam escondidas no verso`);
}
console.log(`      nota: o DESENHO (seção 5) espera 9,3586 s e 6 quadros (279 a 284). Essa conta usa power3.out cúbico (dá ${cubico.toFixed(6)} s);`);
console.log(`      no GSAP o power3 é quártico: power3.out(0,5) = ${p3(0.5)} (cúbico daria 0,875). Desvio do contrato registrado no relatório do K02.`);
resultados.push(versoOk);

// 5 (a mais): a mesma cena com troca.instante "verso" no lugar do 9,35: o estado fica igual, menos a tela (a/b)
// nos quadros entre a troca nova e a do original, que têm de estar todos com o verso de frente (troca escondida)
const cenaVerso = JSON.parse(JSON.stringify(cena));
for (const b of cenaVerso.batidas) if (b.id === "flip-troca-escondida") b.params.troca = { instante: "verso" };
const propsVerso = kit.montaProps(cenaVerso, { narracao: narr.narracao, fecho: fecho.fecho, catalogo: cat.catalogo });
const O3 = montaOriginal();
const K3 = montaKit(propsVerso);
const troca = K3.tl.getChildren(true, true, false).filter((tw) => tw.vars && tw.vars.a === "inicioPagar" && tw.vars.b === "inicioPagar")[0];
let foraDoVerso = 0;
let outros = 0;
const quadrosDiferentes = [];
for (const q of emOrdem) {
  const t = q / FPS + 1e-4;
  O3.tl.seek(t, false);
  K3.tl.seek(t, false);
  let difTela = false;
  for (const [campo, a, b] of pares(O3.st, K3.st)) {
    const igual = typeof a === "string" || typeof b === "string" ? a === b : Math.abs(a - b) <= TOL;
    if (igual) continue;
    if (/^telas\.aparelho\.[ab] /.test(campo)) difTela = true;
    else outros++;
  }
  if (difTela) {
    quadrosDiferentes.push(q);
    if (!(Math.cos(O3.st.phone.ry) * Math.cos(O3.st.phone.rx) < 0)) foraDoVerso++;
  }
}
const extraOk = outros === 0 && foraDoVerso === 0;
console.log(`\n[${extraOk ? "ok" : "FALHA"}] cena com troca.instante "verso" (extra): set da troca em ${troca ? troca.startTime().toFixed(7) : "?"} s; tela diferente do original só nos quadros [${quadrosDiferentes.join(", ")}], todos com o verso de frente (${foraDoVerso} fora); outros campos diferentes: ${outros}`);
resultados.push(extraOk);

console.log(`\navisos do montaProps e das batidas (${avisosProps.length}):`);
for (const a of Array.from(new Set(avisosProps))) console.log(`  - ${a}`);

const passou = resultados.every(Boolean);
console.log(`\nresultado: ${passou ? "PASSOU" : "FALHOU"} (${resultados.filter(Boolean).length} de ${resultados.length} conferências)`);
dormeTicker(original.gsap, kit.gsap);
process.exit(passou ? 0 : 1);
