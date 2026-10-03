// Quadros de QC de uma peça (dono K07; contrato: KIT/DESENHO.md, seções 4.2, 5, 7.1, 7.7 e 7.8).
// Uso: node quadros.mjs <pasta da peça> [--cena <arquivo>]
// Lê as props<sufixo>.json, monta a timeline como o render (useTimelineKit: registraEases, novaTimeline,
// montaTimeline e seek(0)) e avalia todos os quadros com tl.seek(quadro / fps + 1e-4, false). Por quadro grava a
// câmera do render (estado mais a deriva, pelo nucleo/pose.ts) e, por objeto, a pose do render (estado mais a
// flutuação por tipo) e, nos visíveis com caixa, os 8 cantos da caixa projetados em px (nucleo/projecao.ts).
// Grava qc/quadros<sufixo>.json com:
//   quadros: [{q, t, cam, obj: {id: {pose, visivel, cantos?, atras?}}}]  (uma linha por quadro; o quadro 0 traz
//            também "estado": a câmera e as poses da timeline, sem a camada ambiente)
//   tFim: o quadro avaliado em t = duração (a camada ambiente em t = duração vai em "amb"; "estado" como no 0),
//         pro teste do loop;
//   amb0: a camada ambiente em t = 0; ancoras: o instante de cada âncora de cada batida (stills "auto").
// Os números vão com 9 casas (px com 3); a camada ambiente de amb0 e tFim vai sem arredondar.

import path from "node:path";
import { gravaTexto } from "../lib/escrita.mjs";
import {
  ErroCli, argumentos, carregaRuntime, lePeca, leProps, m3, m9, preparaGsap, principal, saidaDaPeca,
} from "./_runtime.mjs";

/** registro que anota as âncoras que cada batida passa pro ctx.som (sem mudar nada do que ela faz) */
function registroComAncoras(registro, ancoras) {
  const r = {};
  const vezes = {};
  for (const id of Object.keys(registro)) {
    const b = registro[id];
    r[id] = {
      ...b,
      aplica(tl, st, p, ctx) {
        vezes[id] = (vezes[id] || 0) + 1;
        const rotulo = vezes[id] === 1 ? id : `${id}:${vezes[id]}`;
        const ctx2 = {
          ...ctx,
          som(anc, valores) {
            for (const k of Object.keys(anc || {})) {
              const t = anc[k];
              if (typeof t === "number" && isFinite(t)) ancoras.push({ batida: rotulo, ancora: k, t: Math.round(t * 1e6) / 1e6 });
            }
            return ctx.som(anc, valores);
          },
        };
        return b.aplica(tl, st, p, ctx2);
      },
    };
  }
  return r;
}

const camObj = (c) => ({ x: m9(c.x), y: m9(c.y), z: m9(c.z), tx: m9(c.tx), ty: m9(c.ty), tz: m9(c.tz), fov: m9(c.fov) });
const poseObj = (p) => ({ x: m9(p.x), y: m9(p.y), z: m9(p.z), rx: m9(p.rx), ry: m9(p.ry), rz: m9(p.rz), s: m9(p.s), vis: m9(p.vis) });

await principal(async () => {
  const { pos, op } = argumentos(process.argv.slice(2));
  if (pos.length !== 1) throw new ErroCli("uso: node quadros.mjs <pasta da peça> [--cena <arquivo>]", 2);
  const peca = lePeca(pos[0], op.cena);
  const { props, caminho, avisos } = leProps(peca);
  const rt = await carregaRuntime();
  for (const a of rt.avisos.concat(avisos)) console.log(`AVISO: ${a}`);
  const N = rt.nucleo;
  const g = rt.gsap;
  const largura = props.largura || 1080;
  const altura = props.altura || 1920;
  const fps = props.fps || 30;
  const total = props.quadros;
  const D = props.duracao;
  const opProj = { largura, altura };

  const ancoras = [];
  N.registraEases(g, rt.CustomEase);
  const tl = N.novaTimeline(g);
  const st = N.novoEstado(props);
  const erros = [];
  N.montaTimeline(tl, st, props, registroComAncoras(rt.registro, ancoras), { avisos: [], aoErro: (_o, e) => erros.push(e.message) });
  if (erros.length) {
    tl.kill();
    preparaGsap(g);
    console.log(`ERRO: a timeline das props tem ${erros.length} erro(s):`);
    for (const e of erros) console.log(`  - ${e}`);
    return 1;
  }
  tl.seek(0, false);

  /** estado do quadro no instante t (o seek é t + 1e-4, como no render; a camada ambiente usa t) */
  const avalia = (t, q) => {
    tl.seek(t + 1e-4, false);
    const cam = N.cameraRender(st.cam, t, props);
    const obj = {};
    for (const o of props.objetos) {
      const s = st.obj[o.id];
      if (!s) continue;
      const pose = N.poseRender(s, o, t, props);
      const rig = N.matrizRig(pose);
      const item = { pose: poseObj(pose), visivel: rig.visivel };
      if (rig.visivel && o.caixa) {
        const pc = N.projetaCaixa(o, pose, cam, opProj);
        if (pc) {
          item.cantos = pc.pontos.map(([x, y]) => [m3(x), m3(y)]);
          if (pc.atras) item.atras = true;
        }
      }
      obj[o.id] = item;
    }
    const r = { q, t: m9(t), cam: camObj(cam), obj };
    if (q === 0 || q === "tFim") {
      // estado da timeline sem a camada ambiente (pra conferência do loop: a volta-loop devolve a pose 0)
      const est = {};
      for (const id of Object.keys(st.obj)) est[id] = poseObj(st.obj[id]);
      r.estado = { cam: camObj(st.cam), obj: est };
    }
    return r;
  };

  const linhas = [];
  let visiveis = 0;
  for (let q = 0; q < total; q++) {
    const f = avalia(q / fps, q);
    for (const id of Object.keys(f.obj)) if (f.obj[id].cantos) visiveis++;
    linhas.push(JSON.stringify(f));
  }
  // estado em t = duração (a volta-loop termina antes; a camada ambiente é avaliada em t = D)
  const fim = avalia(D, "tFim");
  const amb0 = N.ambienteEm(0, props);
  const ambFim = N.ambienteEm(D, props);
  tl.kill();
  preparaGsap(g);

  const cabeca = {
    versao: 1,
    peca: props.peca,
    cena: path.basename(peca.caminhoCena),
    props: path.basename(caminho),
    fps,
    largura,
    altura,
    duracao: D,
    total,
    periodico: !!props.ambiente.periodico,
    legenda: props.legenda,
    objetos: props.objetos.map((o) => ({ id: o.id, tipo: o.tipo, caixa: o.caixa || null, flutuacao: N.flutuacaoDe(o) })),
    ancoras,
    amb0,
  };
  // JSON com uma linha por quadro (fica pequeno e ainda legível)
  const partes = [];
  partes.push("{");
  const chaves = Object.keys(cabeca);
  for (const k of chaves) partes.push(`  ${JSON.stringify(k)}: ${JSON.stringify(cabeca[k])},`);
  partes.push(`  "tFim": ${JSON.stringify({ ...fim, t: D, amb: ambFim })},`);
  partes.push('  "quadros": [');
  partes.push(linhas.map((l, i) => `    ${l}${i < linhas.length - 1 ? "," : ""}`).join("\n"));
  partes.push("  ]");
  partes.push("}");
  const saida = saidaDaPeca(peca, "quadros", ".json", "qc");
  const gr = gravaTexto(saida, partes.join("\n") + "\n", { criaPasta: true });
  console.log(`${total} quadros (${fps} fps, ${D} s), ${visiveis} caixas projetadas, ${ancoras.length} âncoras de batida`);
  console.log(`tFim: t = ${D}; ambiente em t = D contra t = 0: câmera dx ${(ambFim.cam.x - amb0.cam.x).toExponential(3)}, dy ${(ambFim.cam.y - amb0.cam.y).toExponential(3)} (periódico ${cabeca.periodico})`);
  console.log(`gravado: ${gr.caminho} (${gr.tamanho} bytes)`);
  return 0;
});
