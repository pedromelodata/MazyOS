// Prova de equivalência das transições, dos cortes e das curvas da extensão "precificacao" contra os originais
// (dono K14; contrato: KIT/DESENHO.md, seções 4.10 e 4.11).
// Uso: node equivalencia-2d.mjs [--saida <relatorio.json absoluto>]
//
// Os originais (RM/src/Motion.tsx, RM/src/Broll.tsx e RM/src/motion/kit.tsx) são empacotados em memória com um
// plugin que só acrescenta "export { ... }" dos nomes internos ao texto (o arquivo em disco não muda) e com o
// calço mínimo do Remotion; o port (transicoes.ts, cortes.ts e curvas.ts) entra no mesmo pacote. Comparação, em
// 200 instantes por tipo (as janelas do reel de 02/10, com uma folga de 0,05 s antes e depois):
// - transições: Scene(i) contra cenaT (estilo do invólucro com o zIndex, estilo do conteúdo e visibilidade);
// - câmera: Camera(i) contra estiloCamera(cameraT(...)) nas 8 cenas;
// - íris do fim: a camada zIndex 300 do Motion() contra irisFimT;
// - cortes: trOf(k, t) contra corteT (estilo, z e hide), mais o clarão do flash (camada zIndex 295 do Broll()) e
//   a volta do loop (camada zIndex 120 do Broll());
// - curvas: spring, shake e inn do kit.tsx contra mola, tremida e entrada.
// Critério: números com diferença até 1e-9, textos iguais, mesmas chaves e mesma visibilidade.

import { argSaida, comparaEstilo, empacota, gravaRelatorio, novoResumo, passou, pluginCalcos, pluginExporta } from "./comum.mjs";

const TOL = 1e-9;
const N = 200;

const ENTRADA = `
export { Scene, Camera, TR, SHAKES, Motion } from "../../../Motion";
export { trOf, SEG, BND, TD, KIND, END0, Broll } from "../../../Broll";
export { SCENES, PUNCH_I, TI } from "../../../lib/tli";
export { spring, shake, inn } from "../../../motion/kit";
export * as transicoes from "./transicoes";
export * as cortes from "./cortes";
export * as curvas from "./curvas";
`;

const amostras = (de, ate, n) => {
  const r = [];
  for (let i = 0; i < n; i++) r.push(de + ((ate - de) * i) / (n - 1));
  return r;
};

/** as amostras de um tipo, divididas entre as janelas dele (somando n), com as bordas exatas de cada janela */
function instantesDoTipo(janelas, n) {
  const r = [];
  janelas.forEach((j, k) => {
    const cota = Math.floor(n / janelas.length) + (k < n % janelas.length ? 1 : 0);
    const base = amostras(j[0], j[1], cota - j.extras.length);
    r.push(...base, ...j.extras);
  });
  return r;
}

const m = (await empacota(ENTRADA, { nome: "equivalencia-k14.tsx", plugins: [pluginExporta, pluginCalcos] })).modulo;
const { Scene, Camera, TR, SHAKES, Motion, trOf, SEG, BND, TD, KIND, END0, Broll, SCENES, PUNCH_I, TI, spring, shake, inn, transicoes, cortes, curvas } = m;

const relatorio = { versao: 1, geradoEm: new Date().toISOString(), tolerancia: TOL, instantesPorTipo: N, transicoes: {}, camera: null, irisFim: null, cortes: {}, clarao: null, loopEntrada: null, curvas: {} };
// o original lê t = quadro / fps: o port é avaliado no mesmo t (t·fps/fps pode diferir de t no último bit)
const quadro = (t) => {
  globalThis.__QUADRO_K14__ = t * TI.fps;
  return globalThis.__QUADRO_K14__ / TI.fps;
};

// ---------- transições (Scene) ----------
const trDe = (k) => (k >= 0 && k < TR.length ? { tipo: TR[k].kind, d: TR[k].d, ox: TR[k].ox, oy: TR[k].oy } : null);
const janelaCena = (i) => ({ t0: SCENES[i].t0, t1: SCENES[i].t1, entra: i > 0 ? trDe(i - 1) : null, sai: i < SCENES.length - 1 ? trDe(i) : null, zBase: i * 2 });

for (const tipo of transicoes.TIPOS_TRANSICAO) {
  const res = novoResumo();
  const janelas = [];
  TR.forEach((tr, k) => {
    if (tr.kind !== tipo) return;
    const b = SCENES[k].t1;
    janelas.push({ k, b, d: tr.d, 0: b - tr.d / 2 - 0.05, 1: b + tr.d / 2 + 0.05, extras: [b - tr.d / 2, b, b + tr.d / 2] });
  });
  const lista = [];
  janelas.forEach((j) => {
    const cota = N / janelas.length;
    for (const t of instantesDoTipo([j], cota)) lista.push([j.k, t]);
  });
  for (const [k, t] of lista) {
    res.instantes++;
    for (const i of [k, k + 1]) {
      const orig = Scene({ i, t, children: null });
      const port = transicoes.cenaT(t, janelaCena(i));
      if (!orig !== !port.visivel) {
        res.visibilidadeDiferente++;
        if (res.exemplos.length < 8) res.exemplos.push(`cena ${i} em ${t}: original ${orig ? "visível" : "escondida"}, port ${port.visivel ? "visível" : "escondida"}`);
        continue;
      }
      if (!orig) continue;
      comparaEstilo(orig.props.style, port.wrap, TOL, `cena ${i} t=${t} wrap`, res);
      comparaEstilo(orig.props.children[1].props.style, port.cont, TOL, `cena ${i} t=${t} cont`, res);
    }
  }
  res.janelas = janelas.map((j) => ({ cena: j.k, borda: j.b, d: j.d }));
  res.passou = passou(res, TOL);
  relatorio.transicoes[tipo] = res;
}

// ---------- câmera (Camera) ----------
{
  const res = novoResumo();
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    const fim = Math.min(s.t1, TI.dur);
    for (const t of amostras(s.t0 - 0.2, fim + 0.2, N)) {
      res.instantes++;
      const orig = Camera({ i, t, children: null });
      const port = transicoes.estiloCamera(transicoes.cameraT(t, s.t0, s.t1, PUNCH_I, SHAKES));
      comparaEstilo(orig.props.style, port, TOL, `câmera ${i} t=${t}`, res);
    }
  }
  res.passou = passou(res, TOL);
  relatorio.camera = res;
}

// ---------- íris do fim (Motion, zIndex 300) ----------
{
  const res = novoResumo();
  for (const t of amostras(TI.endT0 - 0.05, TI.dur, N)) {
    res.instantes++;
    const tq = quadro(t);
    const raiz = Motion();
    const filhos = [].concat(...raiz.props.children.map((c) => (Array.isArray(c) ? c : [c])));
    const fim = filhos.filter((c) => c && c.props && c.props.style && c.props.style.zIndex === 300)[0];
    const port = transicoes.irisFimT(tq, TI.endT0, TI.dur);
    if (!fim !== !port) {
      res.visibilidadeDiferente++;
      continue;
    }
    if (!fim) continue;
    comparaEstilo({ clipPath: fim.props.style.clipPath }, port, TOL, `íris do fim t=${t}`, res);
  }
  res.passou = passou(res, TOL);
  relatorio.irisFim = res;
}

// ---------- cortes (trOf) ----------
const corteDe = (k) => (k >= 0 && k < BND.length ? { tipo: KIND[k], b: BND[k], d: TD[k] } : null);
const janelaCorte = (k) => ({
  t0: SEG[k].t0, t1: SEG[k].t1, entra: k > 0 ? corteDe(k - 1) : null, sai: k < SEG.length - 1 ? corteDe(k) : null, zBase: k * 2,
  fim: k === SEG.length - 1 ? { inicio: END0, fim: TI.dur } : null,
});
const comparaTr = (k, t, res) => {
  const o = trOf(k, t);
  const p = cortes.corteT(t, janelaCorte(k));
  if (o.hide !== p.hide) {
    res.visibilidadeDiferente++;
    if (res.exemplos.length < 8) res.exemplos.push(`segmento ${k} t=${t}: hide ${o.hide} contra ${p.hide}`);
  }
  comparaEstilo(o.style, p.style, TOL, `segmento ${k} t=${t}`, res);
  comparaEstilo({ z: o.z }, { z: p.z }, TOL, `segmento ${k} t=${t} z`, res);
};

for (const tipo of ["whipL", "whipUp", "zoomBlur", "flash"]) {
  const res = novoResumo();
  const janelas = [];
  KIND.forEach((kd, k) => {
    if (kd !== tipo) return;
    const b = BND[k];
    const d = TD[k];
    janelas.push({ k, b, d, 0: b - d / 2 - 0.05, 1: b + d / 2 + 0.05, extras: [b - d / 2, b, b + d / 2] });
  });
  for (const j of janelas) {
    for (const t of instantesDoTipo([j], N / janelas.length)) {
      res.instantes++;
      comparaTr(j.k, t, res);
      comparaTr(j.k + 1, t, res);
    }
  }
  res.janelas = janelas.map((j) => ({ corte: j.k, borda: j.b, d: j.d }));
  res.passou = passou(res, TOL);
  relatorio.cortes[tipo] = res;
}
{
  // loop: a última cena saindo no fim (bloco "fim" do trOf)
  const res = novoResumo();
  const k = SEG.length - 1;
  for (const t of amostras(END0 - 0.05, TI.dur, N)) {
    res.instantes++;
    comparaTr(k, t, res);
  }
  res.passou = passou(res, TOL);
  relatorio.cortes.loop = res;
}

// ---------- clarão do flash (Broll, zIndex 295) e volta do loop (Broll, zIndex 120) ----------
const filhosBroll = (t) => {
  const tq = quadro(t);
  const raiz = Broll();
  return { tq, filhos: [].concat(...raiz.props.children.map((c) => (Array.isArray(c) ? c : [c]))).filter((c) => c && c.props && c.props.style) };
};
{
  const res = novoResumo();
  const bordas = BND.filter((_b, k) => KIND[k] === "flash");
  const lista = [];
  for (const b of bordas) lista.push(...amostras(b - 0.12, b + 0.25, N / bordas.length));
  for (const t of lista) {
    res.instantes++;
    const fb = filhosBroll(t);
    const cam = fb.filhos.filter((c) => c.props.style.zIndex === 295)[0];
    const port = cortes.claraoT(fb.tq, bordas);
    const orig = cam ? cam.props.style.opacity : 0;
    comparaEstilo({ opacidade: orig }, { opacidade: port > 0 ? cortes.CLARAO.opacidade * port : 0 }, TOL, `clarão t=${t}`, res);
    if (!!cam !== port > 0) res.visibilidadeDiferente++;
  }
  res.passou = passou(res, TOL);
  relatorio.clarao = res;
}
{
  const res = novoResumo();
  for (const t of amostras(END0 - 0.05, TI.dur, N)) {
    res.instantes++;
    const fb = filhosBroll(t);
    const el = fb.filhos.filter((c) => c.props.style.zIndex === 120)[0];
    const port = cortes.loopEntradaT(fb.tq, END0, TI.dur);
    if (!el !== !Object.keys(port).length) {
      res.visibilidadeDiferente++;
      continue;
    }
    if (!el) continue;
    const { zIndex, ...resto } = el.props.style;
    comparaEstilo(resto, port, TOL, `volta do loop t=${t}`, res);
  }
  res.passou = passou(res, TOL);
  relatorio.loopEntrada = res;
}

// ---------- curvas do kit.tsx ----------
{
  const conjuntos = {
    mola: [[0.1, 2.6, 6.5], [0.055, 2.4, 6], [1.2, 2.4, 6], [-60, 1.6, 5], [1, 13, 3.2]],
    tremida: [[14, 0], [16, 0], [10, 1.7], [22, 3.4], [7, 3.3]],
    entrada: [[0.34, 0.4, 1.8], [0.55, 0.6, 1.4], [0.6, 1.25, 1.2], [0.42, 0.6, 1.5], [0.4, 0.3, 2]],
  };
  const t0 = 1.0;
  for (const nomeCurva of Object.keys(conjuntos)) {
    const res = novoResumo();
    for (const params of conjuntos[nomeCurva]) {
      for (const t of amostras(t0 - 0.1, t0 + 1.4, N)) {
        res.instantes++;
        if (nomeCurva === "mola") comparaEstilo({ v: spring(t, t0, ...params) }, { v: curvas.mola(t, t0, ...params) }, TOL, `mola ${params} t=${t}`, res);
        if (nomeCurva === "tremida") comparaEstilo({ v: shake(t, t0, ...params) }, { v: curvas.tremida(t, t0, ...params) }, TOL, `tremida ${params} t=${t}`, res);
        if (nomeCurva === "entrada") comparaEstilo(inn(t, t0, ...params), curvas.entrada(t, t0, ...params), TOL, `entrada ${params} t=${t}`, res);
      }
    }
    res.passou = passou(res, TOL);
    relatorio.curvas[nomeCurva] = res;
  }
}

// ---------- resumo ----------
const linhas = [];
const todos = [];
const mostra = (rotulo, r) => {
  todos.push(r.passou);
  linhas.push(`${r.passou ? "ok   " : "FALHA"} ${rotulo}: ${r.instantes} instantes, ${r.comparacoes} comparações, diferença máxima ${r.difMax.toExponential(2)}, textos diferentes ${r.textosDiferentes}, chaves diferentes ${r.chavesDiferentes}, visibilidade diferente ${r.visibilidadeDiferente}`);
  for (const e of r.exemplos) linhas.push(`      ${e}`);
};
for (const k of Object.keys(relatorio.transicoes)) mostra(`transição ${k}`, relatorio.transicoes[k]);
mostra("câmera (8 cenas)", relatorio.camera);
mostra("íris do fim", relatorio.irisFim);
for (const k of Object.keys(relatorio.cortes)) mostra(`corte ${k}`, relatorio.cortes[k]);
mostra("clarão do flash", relatorio.clarao);
mostra("volta do loop (entrada)", relatorio.loopEntrada);
for (const k of Object.keys(relatorio.curvas)) mostra(`curva ${k}`, relatorio.curvas[k]);
relatorio.passou = todos.every(Boolean);
console.log(linhas.join("\n"));
console.log(relatorio.passou ? "\nRESULTADO: todas as comparações passaram (diferença até 1e-9, textos e visibilidade iguais)" : "\nRESULTADO: FALHOU");
const saida = argSaida(process.argv);
if (saida) {
  const g = await gravaRelatorio(saida, relatorio);
  console.log(`relatório: ${g.caminho} (${g.tamanho} bytes)`);
}
process.exit(relatorio.passou ? 0 : 1);
