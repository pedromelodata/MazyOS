// monta a cenas.json do reel de 09/10 ("O sufoco burocrático real") a partir da cena da peça de 05/10 (v6): o mesmo
// palco (vitrine fria do Tradicional e quente do Legalizaí), o despertador detalhado, o telefone de disco, o calendário
// de mesa e o celular do app; entra o notebook com a página travada no carregando. Tempos pelas palavras da voz
// (voz/narracao.json). Uso: node provas/cena.js (na pasta da peça)
const fs = require("fs");
const path = require("path");
const PECA = path.resolve(__dirname, "..");
const BASE = path.resolve(PECA, "../2026-10-05-tradicional-vs-legalizai-v6/cenas.json");
const c = JSON.parse(fs.readFileSync(BASE, "utf8"));
const narr = JSON.parse(fs.readFileSync(path.join(PECA, "voz/narracao.json"), "utf8"));

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function iw(txt, n = 1) {
  let k = 0;
  for (const w of narr.words) if (norm(w.t) === norm(txt) && ++k === n) return w.i;
  throw new Error(`palavra não achada: "${txt}" (${n}a)`);
}
const W = (txt, d, n = 1) => (d ? { palavra: iw(txt, n), desloc: d } : { palavra: iw(txt, n) });
const S = (txt, n = 1) => narr.words[iw(txt, n)].s;
const E = (txt, n = 1) => narr.words[iw(txt, n)].e;
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;

const MESA = -0.0905, xL = 0.1365;
// a mesa inteira (mais perto e mais baixa que a câmera do Tradicional da peça de 05/10: a mesa enche o quadro)
const camT = JSON.parse(process.env.CAMT || "null") || { x: -0.138, y: 0.118, z: 0.62, tx: -0.134, ty: -0.022, tz: 0, fov: 28 };
const camL = { x: xL, y: 0.15, z: 0.56, tx: xL, ty: 0.0213, tz: 0, fov: 30 };
// a mesa do Tradicional: notebook atrás à esquerda, telefone na frente à esquerda, despertador na frente à direita e
// calendário atrás à direita; as câmeras de cada estação fecham por zoom (nunca passam da frente da vitrine, z 0,5)
const MESA_T = JSON.parse(process.env.MESA_T || "null") || { note: [-0.19, -0.06, 0.35], fone: [-0.165, 0.085, -0.25], relogio: [-0.088, 0.07], calendario: [-0.067, -0.065] };
const camNote = JSON.parse(process.env.CAMNOTE || "null") || { x: -0.235, y: 0.15, z: 0.6, tx: -0.19, ty: -0.05, tz: -0.06, fov: 19 };
// (o close do notebook vem pela esquerda: de frente, o telefone ficava na frente da tela)
const camFone = JSON.parse(process.env.CAMFONE || "null") || { x: -0.15, y: 0.112, z: 0.63, tx: -0.158, ty: -0.031, tz: 0.08, fov: 23 };
// (mais aberto e mais alto que o primeiro: o notebook, o despertador e o calendário, ao fundo, entravam na faixa da legenda)
const camEspera = { x: -0.1, y: 0.104, z: 0.6, tx: -0.085, ty: 0.003, tz: -0.01, fov: 24.5 };
const ARGILA_FRIA = { cor: "#9AA0A8", rugosidade: 0.8, metalico: 0, envMap: 0.3, semMapa: true };

c.peca = "2026-10-09-sufoco-burocratico";
c.titulo = "O sufoco burocrático real";
c.dataPost = "2026-10-09";
c._ajuda = {
  peca: "Reel 9:16 de 09/10/2026 (reel_c261009), pelo kit de motion: o sufoco de uma tarde inteira pra resolver uma coisa simples (o site trava, a ligação cai, a fila, o dia acaba e a empresa parada) no Tradicional, e a virada pro Legalizaí. Roteiro: ROTEIRO.md desta pasta.",
  mundo: "O palco da peça de 05/10 (vitrines de 0,267 m; Tradicional em x -0,1365 e Legalizaí em x 0,1365), com a mesa do Tradicional montada pra esta peça.",
  tempos: "Presos às palavras da voz (voz/narracao.json). A voz é uma tomada só do TTS, sem aceleração nem emenda, dublada inteira.",
};
c.narracao = "voz/narracao.json";
c.voz = { arquivo: "voz/narr-dylan.wav", fecho: "asset", final: "voz/voz-final.wav" };
c.camera = { ...camT };
c.camadas = [];
c.colisao = {};
c.capa = { quadro: "auto", titulo: "A tarde inteira pra resolver uma coisa simples", destaque: "tarde inteira" };
c.notas = "Reel de 09/10/2026 montado pelo kit em 06/10, a pedido do Pedro (narração e vídeo pelo kit), por provas/cena.js a partir da cena da peça de 05/10 (v6). Telas: o splash e o início do dia 1 (receitas da peça de 05/10) e a página travada do notebook (receita sufoco-site-carregando, só esqueleto).";

// telas
const PT = "pecas/2026-10-09-sufoco-burocratico/telas/";
c.telas = {
  splash: { arquivo: PT + "tela-splash.png", extras: [], conjunto: "2026-10-02" },
  homeDia1: { arquivo: PT + "tela-home-dia1.png", extras: [{ tipo: "brilhoCard", regiao: "cardAtivacao" }], conjunto: "2026-10-02" },
  siteCarregando: { arquivo: PT + "tela-site-carregando.png", extras: [], conjunto: "2026-10-02" },
};

// trilha: a batida cheia entra no "É" da virada ("É por isso que a gente tá construindo o Legalizaí")
const tVira = S("É", 2);
c.trilha.momento = { palavra: iw("É", 2) };
c.trilha.automacao = [[0, 3], [r2(tVira - 0.01), 3], [r2(tVira), 4], [r2(tVira + 1.06), 4], [r2(tVira + 1.16), 0]];
c.trilha._ajuda = `Let's Move (Mixkit 836, liberada). A batida cheia entra no "É" da virada (${tVira.toFixed(2)} s). Intro +3 dB e o primeiro compasso +4 dB, como na peça de 05/10.`;

// objetos: o celular do app, o palco, o despertador, o telefone e o notebook
const ap = c.objetos.find((o) => o.id === "aparelho");
ap.pose = { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 1, vis: 1 };
const rel = c.objetos.find((o) => o.id === "relogioT");
rel.pose = { ...rel.pose, x: MESA_T.relogio[0], z: MESA_T.relogio[1], ry: -0.32, rz: 0, vis: 1 };
const fone = c.objetos.find((o) => o.id === "telefoneT");
fone.pose = { ...fone.pose, x: MESA_T.fone[0], z: MESA_T.fone[1], ry: MESA_T.fone[2], vis: 1 };
c.objetos.push({
  id: "notebookT", modelo: "glb-notebook-grafite",
  pose: { x: MESA_T.note[0], y: r4(MESA + 0.0003), z: MESA_T.note[1], rx: 0, ry: MESA_T.note[2], rz: 0, s: 0.3, vis: 1 },
  telaInicial: "siteCarregando", sombra: 0,
});
const pal = c.objetos.find((o) => o.id === "palco");
const ct = pal.conteudo;
ct.camRepouso = { ...camL };
// palco de argila genérico (sem as peças padrão do palco da peça de 05/10, que pedem telas desta cena não tem): só o
// calendário de mesa; as vitrines, a luz e a sombra de contato continuam as da peça de 05/10
pal.modelo = "proc-palco-argila";
delete pal.tipo;
ct.pecas = { calendario: { ...ct.pecas.calendario, x: MESA_T.calendario[0], z: MESA_T.calendario[1], visivel: true } };
delete ct.fileira;
ct.textos = ["Vai, Legalizaí", "LINK DA BIO"];

// ---------- batidas ----------
const B = [];
const b = (id, params) => B.push({ id, params });
const vai = (t, para, dur = 0.55) => b("aproxima", { t: r2(t), para: { ...para }, dur, ease: "power3.inOut", riser: null });

// 1. "Você separa a tarde inteira pra resolver uma coisa simples.": a mesa inteira; a câmera chega devagar e os
// ponteiros começam a andar no "tarde"
b("aproxima", { t: 0, para: { z: r4(camT.z - 0.015) }, dur: r2(E("simples") - 0.1), ease: "power1.inOut", riser: null });
b("vitrine-luz", { t: W("tarde"), dur: 0.6 });
b("objeto-canal", { objeto: "relogioT", t: W("tarde"), canal: "corre", de: 0, para: 0.5, dur: r2(E("simples") - S("tarde")), ease: "sine.inOut", sons: [0, 0.5, 1.0, 1.5, 2.0].filter((d) => d < E("simples") - S("tarde")).map((d) => ({ som: "sint-s_tick", em: "inicio", desloc: d, ganhoDb: -40, args: [2600] })) });

// 2. "Chega no site, trava.": a câmera fecha no notebook; no "trava", um tranco seco e o clique de erro
vai(S("Chega") - 0.3, camNote);
b("pose-objeto", { alvo: "notebookT", t: W("trava", 0.02), para: { x: "+=0.0015" }, dur: 0.03, ease: "none" });
b("pose-objeto", { alvo: "notebookT", t: W("trava", 0.05), para: { x: "-=0.003" }, dur: 0.04, ease: "none" });
b("pose-objeto", { alvo: "notebookT", t: W("trava", 0.09), para: { x: "+=0.0015" }, dur: 0.05, ease: "power2.out", sons: [{ som: "mixkit-1110", em: "inicio", desloc: -0.07, ganhoDb: -26 }] });

// 3. "Liga pro telefone, cai a ligação.": a câmera vai pro telefone; disca no "Liga" e o sinal de ocupado no "ligação"
vai(S("Liga") - 0.3, camFone);
b("objeto-canal", { objeto: "telefoneT", t: W("Liga", 0.05), canal: "disca", de: 0, para: 1, dur: 0.22, ease: "power2.inOut", sons: [{ som: "mixkit-1117", em: "inicio", desloc: 0.2, ganhoDb: -30 }] });
b("objeto-canal", { objeto: "telefoneT", t: W("Liga", 0.3), canal: "disca", para: 0, dur: 0.42, ease: "power1.out", sons: [{ som: "sint-s_roll", em: "inicio", desloc: 0, ganhoDb: -35, args: [9, 0.4] }] });
b("pose-objeto", { alvo: "telefoneT", t: W("ligação", 0.05), para: { rz: 0.012 }, dur: 0.06, ease: "power2.out", sons: [0, 0.34, 0.68].map((d) => ({ som: "sint-s_tick", em: "inicio", desloc: d, ganhoDb: -30, args: [425] })) });
b("pose-objeto", { alvo: "telefoneT", t: W("ligação", 0.11), para: { rz: 0 }, dur: 0.2, ease: "power2.inOut" });

// 4. "Vai pessoalmente, fila.": a câmera atravessa a mesa até o despertador e o calendário; a primeira folha vira no "fila"
vai(S("Vai") - 0.25, camEspera, 0.7);
b("peca-move", { peca: "calendario", t: W("fila", 0.02), chaves: [{ vira: 1, dur: 0.34, ease: "power2.inOut" }], sons: [{ som: "mixkit-1105", em: "inicio", desloc: 0.08, ganhoDb: -31 }] });

// 5. "No fim do dia, nada resolvido, e sua empresa parada esperando.": as folhas viram, os ponteiros correm e o
// despertador toca no "esperando"
const t5 = S("fim");
b("peca-move", { peca: "calendario", t: r2(t5), chaves: [{ vira: 2, dur: 0.3, ease: "power2.inOut" }, { vira: 3, dur: 0.28, ease: "power2.inOut" }, { vira: 4, dur: 0.26, ease: "power2.inOut" }], sons: [0, 0.3, 0.58].map((d, i) => ({ som: "mixkit-1105", em: "inicio", desloc: r2(d + 0.08), ganhoDb: -32 - i })) });
b("objeto-canal", { objeto: "relogioT", t: r2(t5), canal: "corre", para: 2.0, dur: r2(S("esperando") - t5), ease: "power1.in", sons: [0, 0.2, 0.38, 0.54, 0.68, 0.8, 0.9, 0.98, 1.05].filter((d) => d < S("esperando") - t5).map((d, i) => ({ som: "sint-s_tick", em: "inicio", desloc: d, ganhoDb: -40 + Math.min(4, i * 0.4), args: [2600] })) });
const tToca = r2(S("esperando") + 0.05);
b("pose-objeto", { alvo: "relogioT", t: tToca, para: { rz: 0.035 }, dur: 0.034, ease: "none" });
for (let i = 1; i < 10; i++) b("pose-objeto", { alvo: "relogioT", t: r2(tToca + i * 0.034), para: { rz: i % 2 ? -0.035 : 0.035 }, dur: 0.034, ease: "none" });
b("pose-objeto", { alvo: "relogioT", t: r2(tToca + 0.34), para: { rz: 0 }, dur: 0.06, ease: "power2.out" });
for (let i = 0; i < 10; i++) b("objeto-canal", { objeto: "relogioT", t: r2(tToca + i * 0.034), canal: "toca", para: i % 2 ? -1 : 1, dur: 0.034, ease: "none", ...(i === 0 ? { sons: [{ som: "sint-s_ring", em: "inicio", desloc: 0, ganhoDb: -30, args: [0.42, 2350] }] } : {}) });
b("objeto-canal", { objeto: "relogioT", t: r2(tToca + 0.34), canal: "toca", para: 0, dur: 0.06, ease: "power2.out" });

// 6. "É por isso que a gente tá construindo o Legalizaí.": a câmera desliza pro Legalizaí; o aparelho gira de frente
// no "Legalizaí", a luz varre o vidro e o halo abre; o app abre no início do dia 1
const tX = r2(Math.max(tToca + 0.38, S("É", 2) - 0.54)); // 0,04 s antes: o topo do aparelho não passa pela faixa da legenda no chicote
b("troca-lado", { t: tX, para: { ...camL }, dur: 0.5, borrao: 30 });
// fora de quadro (câmera no Legalizaí): a mesa do Tradicional some; volta crescendo com as vitrines no fim do loop
const SOLTOS = { relogioT: 0.42, telefoneT: 0.36, notebookT: 0.3 };
for (const id of Object.keys(SOLTOS)) b("pose-objeto", { alvo: id, t: r2(tX + 0.6), para: { vis: 0 }, dur: 0.02, ease: "none" });
b("gancho-giro-varredura", { t: W("construindo", -0.1), pose: { desloc: 0.02, para: { ry: -0.07, rx: 0, rz: 0, y: -0.00073 }, dur: 1.2, ease: "lgPousa" }, camera: null, varredura: { desloc: 0.12, dur: 0.75, ease: "power2.inOut" } });
b("palco-luz", { t: W("Legalizaí"), para: { halo: 0.6, brilho: 0.16 }, dur: 0.6 });
b("mergulho-abre-app", { t: W("Legalizaí", 0.25), camera: null, giro: null, troca: { de: "splash", para: "homeDia1", modo: 0, desloc: 0.05, dur: 0.45, ease: "power2.out", fim: 0.46 } });
b("tela-canal", { alvo: "aparelho", t: W("Legalizaí", 0.8), canal: "brilhoCard", de: 0, para: 1, dur: 0.25, ease: "power2.out" });

// 7. "Segue a gente. E clica no link da bio.": o app fecha no splash e o aparelho vira o símbolo do logo
b("fecho-simbolo", { appFecha: { t: W("gente", 0, 2), de: "homeDia1", para: "splash", modo: 0, dur: 0.45, ease: "power2.out", fim: 0.47, zera: { brilhoCard: 0 }, zeraEm: "fim" }, pose: { para: { y: 0.008, s: 0.78, ry: -0.03 }, dur: 0.7, ease: "lgPousa" }, encolhe: { t: { fecho: -0.4 }, alvoMundo: null, alvoPx: [410, 818], s: 0.12, dur: 0.4, ease: "power3.in", esconde: 0.4 }, sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });
b("palco-luz", { t: W("gente", 0.1, 2), para: { brilho: 0.14, brilhoNeutro: 0 }, dur: 0.45 });
b("palco-luz", { t: W("link"), para: { halo: 0.85 }, dur: 0.3, ease: "power2.out" });
b("palco-luz", { t: { fecho: -0.6 }, para: { fusao: 1, aquece: 1 }, dur: 0.02 });
b("palco-fecha", { t: { fecho: -0.4 }, centro: [410, 818], pecas: [] });
b("link-bio", { t: { fecho: 0.3 }, dur: 0.45, ease: "lgEntra", sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });

// volta do loop: com o painel fechado, a câmera volta pra mesa do Tradicional e tudo volta pro quadro 0
// (tudo a partir de 0,84 s antes do fim: a pílula LINK DA BIO só termina de sair em fecho + 2,15 s)
b("aproxima", { t: { fim: -0.84 }, para: { ...camT }, dur: 0.02, ease: "none", riser: null });
b("pose-objeto", { alvo: "aparelho", t: { fim: -0.8 }, para: { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 1, vis: 1 }, dur: 0.02, ease: "none" });
b("objeto-canal", { objeto: "relogioT", t: { fim: -0.9 }, canal: "corre", para: 0, dur: 0.02, ease: "none" });
b("objeto-canal", { objeto: "relogioT", t: { fim: -0.9 }, canal: "toca", para: 0, dur: 0.02, ease: "none" });
for (const [id, sv] of Object.entries(SOLTOS)) {
  b("pose-objeto", { alvo: id, t: { fim: -0.83 }, para: { vis: 1, s: 0.001, rz: 0 }, dur: 0.02, ease: "none" });
  b("pose-objeto", { alvo: id, t: { fim: -0.68 }, para: { s: sv }, dur: 0.4, ease: "back.out(1.4)" });
}
b("vitrine-palco", { t: { fim: -0.83 }, cresce: { dur: 0.5, ease: "power3.out", centro: [540, 1180] }, entram: ["calendario"], sobe: { desloc: 0.16, dur: 0.4, escalona: 0.06, ease: "kitPousa5" } });

c.batidas = B;
fs.writeFileSync(path.join(PECA, "cenas.json"), JSON.stringify(c, null, 2) + "\n");
console.log("batidas:", B.length, "| virada", tVira.toFixed(2), "| esperando", S("esperando").toFixed(2));
