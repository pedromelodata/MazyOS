// monta a cenas.json da versão 2 do reel de 09/10 ("O sufoco burocrático real"): uma cena 2D animada por frase da
// narração, na linguagem do reel de 02/10 (biblioteca 2D do kit, extensão precificacao, com os elementos novos do
// sufoco.tsx). Pedido do Pedro em 06/10: "exemplifique em animação cada parte da narração, uma a uma".
// Tempos presos às palavras da voz (voz/narracao.json, a mesma da versão 1). Uso: node provas/cena.js (na pasta da peça)
const fs = require("fs");
const path = require("path");
const PECA = path.resolve(__dirname, "..");
const V1 = path.resolve(PECA, "../2026-10-09-sufoco-burocratico/cenas.json");
const v1 = JSON.parse(fs.readFileSync(V1, "utf8"));
const narr = JSON.parse(fs.readFileSync(path.join(PECA, "voz/narracao.json"), "utf8"));

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function iw(txt, n = 1) {
  let k = 0;
  for (const w of narr.words) if (norm(w.t) === norm(txt) && ++k === n) return w.i;
  throw new Error(`palavra não achada: "${txt}" (${n}a)`);
}
const S = (txt, n = 1) => narr.words[iw(txt, n)].s;
const E = (txt, n = 1) => narr.words[iw(txt, n)].e;
const r2 = (x) => Math.round(x * 100) / 100;
const r3 = (x) => Math.round(x * 1000) / 1000;

const camadas = [];
const batidas = [];
const L = (id, tipo, params) => camadas.push({ id, tipo, ...params });
const b = (id, params) => batidas.push({ id, params });
// atalhos das batidas 2D
const entra = (camada, t, o = {}) => b("p2d-entra", { camada, t: r3(t), ...o });
const sai = (camada, t, o = {}) => b("p2d-sai", { camada, t: r3(t), ...o });
const canal = (camada, nome, t, para, dur, ease = "power2.out", o = {}) => b("p2d-canal", { camada, t: r3(t), canal: nome, para, dur: r3(dur), ease, ...o });
const mola = (camada, nome, t, amp, o = {}) => b("p2d-mola", { camada, t: r3(t), canal: nome, amp, ...o });
const treme = (camada, t, ax, ay, o = {}) => b("p2d-treme", { camada, t: r3(t), x: { amp: ax, semente: 0 }, y: { amp: ay, semente: 1 }, ...o });
const transicao = (tipo, de, para, t, o = {}) => b("p2d-transicao", { tipo, de, para, t: r3(t), ...o });
const corte = (tipo, de, para, t, o = {}) => b("p2d-corte", { tipo, de, para, t: r3(t), ...o });
const som = (nome, desloc, ganhoDb, args) => ({ som: nome, em: "inicio", desloc: r3(desloc), ganhoDb, ...(args ? { args } : {}) });
// clique: aperta, solta e a onda
function clique(cursor, t, sons = []) {
  canal(cursor, "aperta", t, 1, 0.06, "power2.out", { de: 0, sons });
  canal(cursor, "aperta", t + 0.06, 0, 0.12, "power2.out");
  canal(cursor, "onda", t + 0.01, 1, 0.4, "power1.out", { de: 0 });
}

// ---------- grupos (na ordem em que aparecem) ----------
const G = { tarde: "g-tarde", site: "g-site", ligacao: "g-ligacao", fila: "g-fila", noite: "g-noite", empresa: "g-empresa", obra: "g-obra", perfil: "g-perfil", fim: "g-fim" };
L(G.tarde, "p2d-grupo", { fundo: "paper" });
L(G.site, "p2d-grupo", { fundo: "dark" });
L(G.ligacao, "p2d-grupo", { fundo: "paper" });
L(G.fila, "p2d-grupo", { fundo: "paper", estado: { s: 1.25 } });
L(G.noite, "p2d-grupo", { fundo: null });
L(G.empresa, "p2d-grupo", { fundo: "dark" });
L(G.obra, "p2d-grupo", { fundo: "coral" });
L(G.perfil, "p2d-grupo", { fundo: "paper" });
L(G.fim, "p2d-grupo", { fundo: "paper" });

// ---------- 1. "Você separa a tarde inteira pra resolver uma coisa simples." (papel) ----------
L("relogio", "p2d-RelogioTarde", { grupo: G.tarde, x: 540, y: 1080, d: 700, de: 13, ate: 18, flutua: { amp: 5, freq: 0.9, fase: 0 } });
L("bilhete", "p2d-Bilhete", { grupo: G.tarde, x: 880, y: 1500, w: 230, rot: 9 });
L("brilho-a1", "p2d-Sparkle", { grupo: G.tarde, x: 170, y: 760, color: "#F2643C", pulso: { base: 0.9, amp: 0.35, freq: 5, fase: 0 } });
L("brilho-a2", "p2d-Sparkle", { grupo: G.tarde, x: 925, y: 800, color: "#F5A184", pulso: { base: 0.7, amp: 0.3, freq: 6, fase: 1.3 } });
canal(G.tarde, "s", 0, 1.045, 3.6, "power1.inOut", { de: 1 });
// o gancho: os ponteiros correm da manhã até 13h no primeiro segundo, com um pulinho do relógio
canal("relogio", "hora", 0.05, 13, r2(S("tarde") - 0.12), "power2.inOut", { de: 9, sons: [0.15, 0.4, 0.62, 0.82].map((d) => som("sint-s_tick", d, -40, [2600])) });
mola("relogio", "s", 0.05, 0.045, { f: 2.2, amort: 5 });
const tTarde = S("tarde");
const durTarde = r2(E("coisa") - tTarde);
canal("relogio", "fatia", tTarde, 1, durTarde, "power2.inOut", {
  de: 0,
  sons: [som("sint-s_swish", 0, -34, [0.4]), ...[0, 0.16, 0.3, 0.42, 0.53, 0.63, 0.72, 0.8, 0.88, 0.96, 1.04, 1.12, 1.2].filter((d) => d < durTarde).map((d, i) => som("sint-s_tick", d, -39 + Math.min(5, i * 0.4), [2600]))],
});
canal("relogio", "hora", tTarde, 18, durTarde, "power2.inOut");
mola("relogio", "s", tTarde, 0.06, { f: 2.4, amort: 6 });
entra("brilho-a1", tTarde + durTarde - 0.1, { semSom: true });
entra("brilho-a2", tTarde + durTarde, { semSom: true });
entra("bilhete", S("simples") - 0.04, { dur: 0.42, s0: 0.3, de: { y: -300, rot: -40 }, easeDe: "power2.out" });
mola("bilhete", "rot", S("simples") + 0.38, 7, { f: 2.2, amort: 5.5 });

// ---------- 2. "Chega no site, trava." (escuro) ----------
const tB = S("Chega") - 0.11;
corte("whipL", G.tarde, G.site, tB);
// a janela tem 900 de largura (escala 1,1842): o endereço fica em (445, 781) e o anel em (540, 1007)
L("site", "p2d-Navegador", { grupo: G.site, x: 540, y: 1090, w: 900 });
L("seta", "p2d-Cursor", { grupo: G.site, x: 445, y: 781, modo: "seta" });
canal("site", "gira", tB - 0.15, 3.6, r3(S("trava") - tB + 0.15), "none", { de: 0 });
mola("site", "s", tB + 0.12, 0.05);
canal("seta", "x", tB + 0.1, 0, 0.42, "power2.inOut", { de: 420 });
canal("seta", "y", tB + 0.1, 0, 0.42, "power2.inOut", { de: 720 });
const tClique = tB + 0.56;
clique("seta", tClique, [som("mixkit-1109", 0, -24)]);
canal("site", "carrega", tClique + 0.06, 0.82, r3(S("trava") - tClique - 0.06), "power2.out", { de: 0 });
canal("seta", "x", tClique + 0.3, 135, 0.32, "power2.inOut");
canal("seta", "y", tClique + 0.3, 266, 0.32, "power2.inOut");
const tTrava = S("trava");
canal("site", "trava", tTrava, 1, 0.4, "power2.out", { de: 0, sons: [som("sint-s_burst", 0, -30, [12, 0.32]), som("mixkit-1110", 0.01, -27)] });
canal("site", "falha", tTrava, 1, 0.05, "none", { de: 0 });
canal("site", "falha", tTrava + 0.05, 0, 0.1, "power1.out");
canal("site", "falha", tTrava + 0.19, 0.7, 0.04, "none");
canal("site", "falha", tTrava + 0.23, 0, 0.12, "power1.out");
treme(G.site, tTrava + 0.01, 18, 12);
[0.36, 0.54, 0.72].forEach((d) => clique("seta", tTrava + d, [som("mixkit-1109", 0, -29)]));

// ---------- 3. "Liga pro telefone, cai a ligação." (papel) ----------
const tC = S("Liga") - 0.2;
transicao("push", G.site, G.ligacao, tC);
L("fone", "p2d-Telefone", { grupo: G.ligacao, x: 540, y: 1150, w: 640 });
canal("fone", "toca", tC + 0.12, 1, 0.25, "power2.out", { de: 0 });
canal("fone", "vibra", S("Liga") + 0.04, 1, 0.1, "power2.out", { de: 0, sons: [som("sint-s_ring", 0.04, -32, [0.42, 2350]), som("sint-s_ring", 0.52, -33, [0.42, 2350])] });
canal("fone", "vibra", S("cai") - 0.2, 0, 0.15, "power2.out");
mola("fone", "s", S("Liga"), 0.05);
const tCai = S("cai") - 0.02;
const DUR_QUEDA = 0.8;
canal("fone", "cai", tCai, 1, DUR_QUEDA, "none", {
  de: 0,
  sons: [som("sint-s_swish", 0, -34, [0.2]), som("sint-s_thump", DUR_QUEDA * 0.364, -25, [120, 55, 0.25]), som("sint-s_thump", DUR_QUEDA * 0.727, -32, [130, 60, 0.16]), som("sint-s_thump", DUR_QUEDA * 0.909, -37, [140, 65, 0.1])],
});
treme(G.ligacao, tCai + DUR_QUEDA * 0.364, 10, 7, { semSom: true });
b("p2d-mola", { camada: "fone", t: r3(tCai + 0.37), canal: "s", amp: -0.03, sons: [0, 0.34, 0.68].map((d) => som("sint-s_tick", d + 0.03, -30, [425])) });

// ---------- 4. "Vai pessoalmente, fila." (papel) ----------
const tD = S("Vai") - 0.13;
corte("whipUp", G.ligacao, G.fila, tD);
// a fila: o fim (onde você para) fica em x 200 com a câmera em 1; a porta, à direita, aparece quando a câmera abre
L("fila", "p2d-Fila", { grupo: G.fila, x: 548, y: 1150, n: 8, passo: 106, w: 1500 });
const tAnda = tD + 0.06;
const durAnda = r2(S("fila") - 0.1 - tAnda);
canal("fila", "anda", tAnda, 1, durAnda, "none", { de: 0, sons: Array.from({ length: 7 }).map((_, i) => som("sint-s_thump", (i + 0.5) * (durAnda / 7), -40, [150, 90, 0.05])) });
canal(G.fila, "s", S("fila") - 0.04, 0.8, 0.7, "power3.inOut", { de: 1.25, sons: [som("sint-s_whoosh", 0, -31, [0.6, 300, 5000])] });
canal(G.fila, "x", S("fila") - 0.04, -180, 0.7, "power3.inOut", { de: 0 });
canal("fila", "suspira", S("fila") + 0.4, 1, 0.8, "power1.inOut", { de: 0 });

// ---------- 5. "No fim do dia, nada resolvido," (o céu) ----------
const tE = S("No", 2) - 0.1; // o "No" de "No fim do dia" (o primeiro "no" é o de "Chega no site")
transicao("wipeUp", G.fila, G.noite, tE);
L("ceu", "p2d-Entardecer", { grupo: G.noite, x: 540, y: 960, estado: { sol: 0.1, noite: 0.42, luzes: 0 } });
L("bilhete2", "p2d-Bilhete", { grupo: G.noite, x: 540, y: 1060, w: 330, rot: -4 });
canal("ceu", "sol", tE - 0.07, 1, 1.25, "power1.in", { de: 0.1, sons: [som("sint-s_whoosh", 0.2, -37, [1.1, 2600, 300])] });
canal("ceu", "noite", tE + 0.03, 1, 1.3, "power1.inOut", { de: 0.42 });
canal("ceu", "luzes", tE + 0.5, 1, 0.9, "none", { de: 0 });
const tNada = S("nada");
entra("bilhete2", tNada - 0.07, { dur: 0.36, s0: 0.5, de: { y: 140 } });
canal("bilhete2", "marca", tNada + 0.23, 0.45, 0.2, "power2.out", { de: 0, sons: [som("sint-s_swish", 0, -38, [0.18])] });
canal("bilhete2", "marca", tNada + 0.48, 0, 0.16, "power2.in");
treme("bilhete2", tNada + 0.5, 16, 6);
canal("bilhete2", "rot", tNada + 0.63, -9, 0.3, "power2.out", { de: 0 });

// ---------- 6. "e sua empresa parada esperando." (escuro) ----------
const tF = E("resolvido") - 0.04;
transicao("zoom", G.noite, G.empresa, tF);
L("empresa", "p2d-Empresa", { grupo: G.empresa, x: 480, y: 1140, w: 700, estado: { gira: 0, luz: 1, pausa: 0 } });
L("ampulheta", "p2d-Ampulheta", { grupo: G.empresa, x: 900, y: 1390, w: 180 });
const tParada = S("parada");
canal("empresa", "gira", tF - 0.23, 2.6, r3(tParada - tF + 0.23), "none", { de: 0, sons: [som("sint-s_roll", 0.05, -38, [14, 1.1])] });
canal("empresa", "gira", tParada, 2.95, 0.5, "power3.out", { sons: [som("sint-s_thump", 0.38, -28, [110, 50, 0.22])] });
mola("empresa", "s", tParada + 0.05, -0.035);
canal("empresa", "luz", tParada + 0.08, 0.15, 0.05, "none", { de: 1, sons: [som("sint-s_tick", 0, -36, [1800])] });
canal("empresa", "luz", tParada + 0.16, 0.75, 0.05, "none");
canal("empresa", "luz", tParada + 0.24, 0, 0.18, "power1.out");
canal("empresa", "pausa", tParada + 0.2, 1, 0.55, "none", { de: 0, sons: [som("sint-s_swish", 0, -34, [0.24])] });
const tEsp = S("esperando");
entra("ampulheta", tEsp - 0.04, { dur: 0.34, de: { y: 70, rot: -14 } });
canal("ampulheta", "vira", tEsp + 0.18, 1, 0.45, "power2.inOut", { de: 0, sons: [som("sint-s_swish", 0, -36, [0.3])] });
canal("ampulheta", "areia", tEsp + 0.66, 1, 0.6, "none", { de: 0 });

// ---------- 7. "É por isso que a gente tá construindo o Legalizaí." (coral) ----------
const tG = S("É", 2) - 0.05;
transicao("iris", G.empresa, G.obra, tG, { ox: 540, oy: 1110 });
L("raios", "p2d-Rays", { grupo: G.obra, x: 540, y: 1110, n: 20, len: 1500, color: "255,255,255", a1: 0.06, a2: 0.13, giro: 14, estado: { op: 0 } });
L("obra", "p2d-Construcao", { grupo: G.obra, x: 540, y: 1110, w: 380, estado: { molde: 0, blocos: 0, liga: 0 } });
L("brilho-g1", "p2d-Sparkle", { grupo: G.obra, x: 300, y: 820, color: "#FFFFFF", pulso: { base: 1.1, amp: 0.4, freq: 6, fase: 0 } });
L("brilho-g2", "p2d-Sparkle", { grupo: G.obra, x: 800, y: 930, color: "#FFFFFF", pulso: { base: 0.9, amp: 0.35, freq: 5, fase: 1.1 } });
L("brilho-g3", "p2d-Sparkle", { grupo: G.obra, x: 280, y: 1390, color: "#FBDDD1", pulso: { base: 0.8, amp: 0.3, freq: 7, fase: 2 } });
canal("obra", "molde", tG - 0.1, 1, 0.75, "power2.inOut", { de: 0, sons: [som("sint-s_swish", 0, -38, [0.6])] });
const tConstr = S("construindo") - 0.1;
const durBlocos = r2(S("Legalizaí") - 0.06 - tConstr);
canal("obra", "blocos", tConstr, 8, durBlocos, "none", { de: 0, sons: Array.from({ length: 8 }).map((_, i) => som("sint-s_pop", (i + 0.55) * (durBlocos / 8), -30 - (i % 2), [600 + i * 55, 260, 0.1, 24])) });
mola("obra", "s", S("construindo"), 0.03);
const tLeg = S("Legalizaí");
canal("obra", "liga", tLeg - 0.03, 1, 0.3, "power2.out", { de: 0, sons: [som("sint-s_chime", 0.02, -30, [1975.5, 0.6]), som("sint-s_brilho", 0.05, -35, [0.6])] });
canal("raios", "op", tLeg - 0.03, 1, 0.35, "power2.out", { de: 0 });
mola(G.obra, "s", tLeg, 0.06);
entra("brilho-g1", tLeg + 0.05, { semSom: true });
entra("brilho-g2", tLeg + 0.13, { semSom: true });
entra("brilho-g3", tLeg + 0.21, { semSom: true });

// ---------- 8. "Segue a gente. E clica no link da bio." (papel) ----------
const tH = S("Segue") - 0.17;
transicao("push", G.obra, G.perfil, tH);
// o cartão tem 900 de largura em y 1080: o botão fica em y 1133 e a pílula do link em y 1261
const Y_BOTAO = 1133;
const Y_LINK = 1261;
L("perfil", "p2d-Perfil", { grupo: G.perfil, x: 540, y: 1080, w: 900, estado: { segue: 0, link: 0 } });
L("toque", "p2d-Cursor", { grupo: G.perfil, x: 560, y: Y_BOTAO, modo: "toque", estado: { op: 0 } });
L("confete", "p2d-Confetti", { grupo: G.perfil, x: 540, y: Y_BOTAO, n: 64, power: 0.9, cols: ["#F2643C", "#F5A184", "#FBDDD1", "#DD4E27", "#FFFFFF"] });
canal("toque", "op", tH + 0.08, 1, 0.15, "power2.out", { de: 0 });
canal("toque", "y", tH + 0.08, 0, 0.34, "power2.out", { de: 430 });
canal("toque", "x", tH + 0.08, 0, 0.34, "power2.out", { de: 160 });
const tSegue = S("Segue") + 0.08;
clique("toque", tSegue, [som("mixkit-1109", 0, -24)]);
canal("perfil", "segue", tSegue - 0.02, 1, 0.3, "power2.out", { de: 0, sons: [som("sint-s_pop", 0.15, -28, [700, 300, 0.14, 24]), som("sint-s_brilho", 0.17, -36, [0.5])] });
canal("confete", "voo", tSegue + 0.14, 1, 1.6, "none", { de: 0 });
mola("perfil", "s", tSegue + 0.14, 0.035);
canal("toque", "y", S("E", 3) - 0.25, Y_LINK - Y_BOTAO, 0.3, "power2.inOut"); // o "E" de "E clica" (o segundo "e" é o "É" da virada)
canal("toque", "x", S("E", 3) - 0.25, -20, 0.3, "power2.inOut");
const tClica = S("clica") + 0.04;
clique("toque", tClica, [som("mixkit-1109", 0, -24)]);
canal("perfil", "link", tClica - 0.02, 1, 0.3, "power2.out", { de: 0, sons: [som("sint-s_chime", 0.12, -33, [1318.5, 0.5])] });
mola("perfil", "s", tClica + 0.12, 0.025);
canal("toque", "op", S("bio") + 0.2, 0, 0.2, "power2.out");

// ---------- fecho e volta do loop ----------
const tFim = narr.tFecho - 0.18;
transicao("zoom", G.perfil, G.fim, tFim);
L("legenda2d", "p2d-legenda", { modos: ["light", "dark", "light", "light", "dark", "dark", "coral", "light"], fecho: true });
b("fecho-simbolo", { alvo: "aparelho", appFecha: null, encolhe: { t: { fecho: -0.4 }, alvoMundo: null } });
b("link-bio", { t: { fecho: 0.3 }, sai: { t: { fecho: 1.95 } } });
const DUR = narr.duracao;
sai("legenda2d", DUR - 0.42, { dur: 0.2 });
corte("loop", G.fim, G.tarde, DUR - 0.18);
// a cena 1 volta pro quadro 0 enquanto está fora de quadro (o loop emenda no relógio parado às 13h)
const tZera = 9.4;
canal("relogio", "fatia", tZera, 0, 0.01, "none");
canal("relogio", "hora", tZera, 9, 0.01, "none");
canal(G.tarde, "s", tZera, 1, 0.01, "none");
sai("bilhete", tZera, { dur: 0.01 });
sai("brilho-a1", tZera, { dur: 0.01 });
sai("brilho-a2", tZera, { dur: 0.01 });

// ---------- a cena ----------
const c = {
  _ajuda: {
    peca: "Reel 9:16 de 09/10/2026 (reel_c261009), versão 2: uma cena 2D animada por frase (o relógio da tarde, o site que trava, a ligação que cai, a fila, o fim do dia, a empresa parada, o celular em montagem e o perfil), na linguagem do reel de 02/10. Roteiro: ROTEIRO.md desta pasta.",
    mundo: "Só 2D (biblioteca da extensão precificacao, com os elementos do sufoco.tsx). O aparelho 3D fica invisível: só dá o símbolo do fecho.",
    tempos: "Presos às palavras da voz (voz/narracao.json, a mesma da versão 1): uma tomada só do TTS, sem aceleração nem emenda, dublada inteira.",
  },
  versao: 1,
  peca: "2026-10-09-sufoco-burocratico-v2",
  titulo: "O sufoco burocrático real",
  dataPost: "2026-10-09",
  fps: 30,
  largura: 1080,
  altura: 1920,
  duracao: "auto",
  tFecho: "auto",
  narracao: "voz/narracao.json",
  voz: { arquivo: "voz/narr-dylan.wav", fecho: "asset", final: "voz/voz-final.wav" },
  trilha: v1.trilha,
  legenda: { top: 206, altura: 330, tamanho: 68, modo: "light" },
  camera: { x: 0, y: 0.03, z: 0.9, tx: 0, ty: 0, tz: 0, fov: 30 },
  ambiente: { deriva: false, flutuacao: false, poeira: 0, periodico: true },
  marcas: {},
  fecho: v1.fecho,
  sons: { perfil: "v2", modoRuido: "por-evento", extras: [], remover: [] },
  fatos: { publico: "ME", exemplos: [] },
  capa: { quadro: 72, titulo: "A tarde inteira pra resolver uma coisa simples", destaque: "tarde inteira" },
  notas: "Versão 2 do reel de 09/10, montada pelo kit em 06/10 a pedido do Pedro (cada frase com a sua animação), por provas/cena.js. Elementos novos do kit em RM/src/kit/ext/precificacao/sufoco.tsx.",
  objetos: [{ id: "aparelho", modelo: "glb-video-iphone", pose: { x: 0, y: -0.012, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 0 }, telaInicial: "apagada" }],
  telas: {},
  regioes: {},
  camadas,
  batidas,
  colisao: {},
};
fs.writeFileSync(path.join(PECA, "cenas.json"), JSON.stringify(c, null, 1));
console.log(`camadas: ${camadas.length} | batidas: ${batidas.length} | fecho ${narr.tFecho} | duração ${narr.duracao}`);
