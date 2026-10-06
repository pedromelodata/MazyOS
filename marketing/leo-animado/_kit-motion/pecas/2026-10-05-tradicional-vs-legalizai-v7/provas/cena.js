// monta a cenas.json da versão 7 do reel de 05/10 ("Contabilidade tradicional vs Legalizaí"): a linha que desce
// (camada p2d-LinhaDescendo, RM/src/kit/ext/precificacao/linha.tsx). Pedido do Pedro em 06/10: "uma linha que desça
// de cima para baixo e, conforme ela vai descendo, os motions vão acontecendo... tudo conectado nessa linha".
// A voz é a gravação do Pedro (a mesma da v6, fecho embutido); todos os tempos saem das palavras dela.
// Uso: node provas/cena.js (na pasta da peça)
const fs = require("fs");
const path = require("path");
const PECA = path.resolve(__dirname, "..");
const NOME = path.basename(PECA);
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
const DUR = narr.duracao;
const TF = narr.tFecho;

// ---- os gatilhos das cenas (palavras da voz) ----
const iAi = iw("aí");
const tempos = {
  tradicional: S("tradicional"), vs: S("vs"), legalizai: S("Legalizaí"), voce: S("você"),
  abrir: S("Abrir"), papel: S("papel"), ida: S("ida"), escritorio: S("escritório"), escritorioFim: r2(E("escritório") - 0.07),
  espera: S("espera"), atendido: S("atendido"), agora: S("Agora"), com: S("com"), atividade: S("atividade"),
  passo: S("passo"), sistema: S("sistema"), calcula: S("calcula"), calculaFim: E("calcula"), emite: S("emite"),
  avisa: S("avisa"), paga: S("paga"), e2: narr.words[iAi - 1].s, fugiu: S("fugiu"), no2: S("No"), simples: S("Simples"),
  contador: S("contador"), verdade: S("verdade"), crc: S("CRC"), mas: S("mas"), chegando: S("chegando"),
  segue: S("Segue"), link: S("link"), fecho: TF, fimLinha: r2(TF + 0.35), foneSaiT: r2(E("app") - 0.1),
};

// ---- a ponta da linha: [marca do traçado, tempo, deslocamento em px] ----
const chaves = [
  ["a0", 0], ["pilha0", r2(S("tradicional") + 0.04)], ["raio0", r2(S("vs") - 0.17)], ["raio1", r2(S("vs") + 0.12)],
  ["visto0a", r2(S("Legalizaí") - 0.02)], ["visto0b", r2(S("Legalizaí") + 0.42)],
  ["q0", r2(S("O") - 0.18)], ["q1", r2(S("você") + 0.08)], ["posq", r2(S("Abrir") - 0.23)],
  ["costura0", r2(S("Abrir") + 0.02)], ["costura1", r2(S("papel") - 0.06)], ["casa", r2(S("ida") - 0.2)],
  ["escritorio", r2(E("escritório") - 0.07)], ["espiral0", r2(S("espera") + 0.01)], ["espiral1", r2(E("atendido") + 0.03)],
  ["fone0", r2(S("Agora") + 0.22)], ["foneFecha", r2(E("app") - 0.27)], ["foneSai", r2(E("app") + 0.03)],
  ["foneSai", r2(S("cada") - 0.14), 40], ["passo1", r2(S("cada") + 0.11)], ["passo2", r2(S("cada") + 0.31)],
  ["passo3", r2(S("cada") + 0.51)], ["passo4", r2(S("cada") + 0.71)],
  ["guia0", r2(S("calcula") - 0.04)], ["guia1", r2(E("calcula") + 0.03)], ["guia2", r2(S("emite") + 0.3)], ["guia3", r2(E("paga") + 0.02)],
  ["padrao0", r2(narr.words[iAi - 1].s - 0.16)], ["padrao1", S("fugiu")], ["padrao2", E("padrão")],
  ["cartao0", r2(S("No") - 0.04)], ["cartao1", r2(S("verdade") + 0.06)],
  ["coracao0", r2(S("O", 3) - 0.02)], ["coracao1", E("cuidado")], ["saiCoracao", r2(S("mas") + 0.31)],
  ["fone2a", r2(S("chegando") - 0.51)], ["fone2b", r2(S("chegando") + 0.44)],
  ["pilula1a", r2(S("Segue") - 0.07)], ["pilula1b", r2(E("gente") - 0.04)], ["pilula2a", r2(S("clique") - 0.15)], ["pilula2b", r2(S("link") - 0.04)],
  ["visto1a", r2(TF - 0.43)], ["visto1b", r2(TF - 0.03)],
];
for (let i = 1; i < chaves.length; i++) if (!(chaves[i][1] > chaves[i - 1][1])) throw new Error(`chaves fora de ordem em ${chaves[i][0]} (${chaves[i][1]} depois de ${chaves[i - 1][1]})`);

// ---- a câmera: [t, y do topo do quadro no mundo] ----
const CAM_FECHO = 8240;
const camera = [
  [0, -560], [S("vs"), -470], [r2(S("Legalizaí") + 0.6), -380], [r2(S("você") - 0.1), 450], [r2(S("Abrir") - 0.4), 700],
  [r2(S("papel") - 0.35), 1080], [r2(S("ida") - 0.1), 1500], [r2(E("escritório") - 0.1), 1800], [r2(S("espera") + 0.25), 2280],
  [r2(S("Agora") - 0.15), 2320], [r2(S("Agora") + 0.55), 3050], [r2(S("cada") - 0.25), 3080], [r2(S("passo") + 0.65), 3300],
  [r2(S("sistema") - 0.14), 4130], [r2(E("paga") - 0.1), 4180], [r2(S("fugiu") - 0.15), 4780], [r2(S("No") - 0.3), 5230],
  [r2(S("No") + 0.3), 5450], [r2(S("CRC") + 0.66), 5480], [r2(S("cuidado") - 0.04), 5880], [r2(S("mas") + 0.4), 6400],
  [r2(S("chegando") + 0.04), 6580], [r2(S("Segue") - 0.02), 7180], [r2(S("link") + 0.36), 7230], [r2(TF - 0.08), CAM_FECHO], [DUR, CAM_FECHO],
];
for (let i = 1; i < camera.length; i++) if (!(camera[i][0] > camera[i - 1][0])) throw new Error(`câmera fora de ordem em ${camera[i][0]}`);

// ---- os sons, presos às cenas ----
const ex = (t, som, ganhoDb, args) => ({ t: r2(t), som, ganhoDb, ...(args ? { args } : {}) });
const tP = (n) => chaves.find((c) => c[0] === n)[1];
const extras = [
  ex(0.02, "sint-s_swish", -36, [0.5]),
  ex(S("tradicional"), "mixkit-1105", -31),
  ex(S("vs"), "sint-s_thump", -24, [160, 48, 0.36]), ex(S("vs") + 0.01, "sint-s_burst", -31, [12, 0.32]),
  ex(tP("visto0b") - 0.05, "sint-s_chime", -31, [1975.5, 0.6]),
  ex(tP("q0") + 0.05, "sint-s_swish", -37, [0.6]), ex(S("você"), "sint-s_pop", -29, [700, 300, 0.12, 24]),
  ...[0.12, 0.26, 0.4, 0.54].map((d) => ex(tP("costura0") + d, "sint-s_tick", -38, [2600])),
  ex(tempos.papel - 0.009, "mixkit-2995", -28), ex(tempos.papel, "sint-s_thump", -22, [150, 60, 0.3]),
  ...[0, 0.18, 0.36, 0.54].map((d) => ex(tempos.ida + d, "sint-s_thump", -40, [150, 90, 0.05])),
  ex(tempos.escritorioFim + 0.25, "sint-s_pop", -30, [520, 260, 0.12, 24]),
  ...[0, 0.24, 0.45, 0.63, 0.79, 0.93, 1.05, 1.15, 1.24, 1.32].map((d, i) => ex(tempos.espera - 0.1 + d, "sint-s_tick", -40 + Math.min(4, i * 0.4), [2600])),
  ex(tempos.atendido, "sint-s_ring", -30, [0.42, 2350]),
  ex(tempos.agora - 0.02, "sint-s_whoosh", -28, [0.5, 300, 6000]), ex(tempos.agora + 0.01, "sint-s_brilho", -32, [0.7]),
  ex(tP("fone0") + 0.05, "sint-s_swish", -34, [0.7]), ex(tP("foneFecha") + 0.04, "sint-s_pop", -28, [900, 420, 0.1, 34]),
  ex(tempos.atividade - 0.03, "mixkit-3005", -29), ex(tempos.atividade + 0.72, "sint-s_swish", -35, [0.3]),
  ...["passo1", "passo2", "passo3", "passo4"].map((n, i) => ex(tP(n) + 0.02, "sint-s_pop", -31 - (i % 2), [600 + i * 80, 280, 0.1, 24])),
  ex(tempos.calcula, "sint-s_conta", 0, [tempos.calcula, r2(tempos.calculaFim - tempos.calcula), 16]),
  ex(tempos.emite, "mixkit-1105", -30),
  ex(tempos.avisa + 0.08, "mixkit-766", -30),
  ex(tempos.paga - 0.01, "mixkit-1109", -22), ex(tempos.paga + 0.12, "mixkit-2867", -26),
  ex(tempos.fugiu - 0.04, "sint-s_whoosh", -31, [0.4, 500, 7000]), ex(tempos.fugiu + 0.05, "sint-s_pop", -30, [500, 900, 0.12, 30]),
  ex(tempos.simples, "sint-s_pop", -31, [700, 300, 0.12, 24]), ex(tempos.contador, "sint-s_pop", -30, [620, 240, 0.16, 22]),
  ex(tempos.verdade + 0.35, "sint-s_thump", -32, [120, 55, 0.2]), ex(tempos.crc + 0.02, "sint-s_brilho", -32, [0.6]),
  ex(tP("coracao1") - 0.02, "sint-s_chime", -31, [1318.5, 0.6]),
  ex(tempos.mas + 0.05, "sint-s_whoosh", -30, [0.9, 300, 5000]), ex(tempos.chegando, "sint-s_thump", -27, [110, 50, 0.22]),
  ex(tempos.segue + 0.56, "mixkit-1109", -24), ex(tempos.segue + 0.66, "sint-s_pop", -29, [700, 300, 0.14, 24]),
  ex(tempos.link, "mixkit-1109", -24), ex(tempos.link + 0.1, "sint-s_chime", -33, [1318.5, 0.5]),
  ex(tP("visto1a"), "sint-s_swish", -34, [0.4]),
  ex(DUR - 0.42, "sint-s_whoosh", -31, [0.4, 500, 7000]),
];

// ---- a cena ----
const PT = `pecas/${NOME}/telas/`;
const c = {
  _ajuda: {
    peca: "Reel 9:16 de 05/10/2026 (reel_93834bb1), versão 7: a linha que desce. Uma linha só, contínua, que a câmera acompanha sem corte; cada frase da voz acontece presa a ela. Roteiro: ROTEIRO.md desta pasta.",
    mundo: "Só 2D: a camada p2d-LinhaDescendo desenha o mundo inteiro (1080 de largura, uns 9.000 px de altura). O aparelho 3D fica invisível: só dá o símbolo do fecho.",
    tempos: "Presos às palavras da gravação do Pedro (voz/narracao.json, a mesma da v6, fecho embutido).",
  },
  versao: 1,
  peca: NOME,
  titulo: "Contabilidade tradicional vs Legalizaí",
  dataPost: "2026-10-05",
  fps: 30,
  largura: 1080,
  altura: 1920,
  duracao: DUR,
  tFecho: TF,
  narracao: "voz/narracao.json",
  voz: { arquivo: "voz/narr-pedro-gravada.wav", fecho: "embutido" },
  trilha: {
    _ajuda: "Let's Move (Mixkit 836, liberada). A batida cheia entra no \"Agora\", quando a linha acende em coral; a intro filtrada sobe 8 dB até lá, e o vale de -5,5 dB fica no contador.",
    id: "mixkit-05-lets-move", momento: { palavra: iw("Agora") }, ponto: "entrada-16.035", ganhoDb: "auto",
    automacao: [[0, 8], [r2(S("Agora") - 0.01), 8], [S("Agora"), 0], [r2(S("tem") - 0.15), 0], [r2(S("tem")), -5.5], [E("CRC"), -5.5], [r2(E("CRC") + 0.15), 0]],
    abaixamento: 0.55, fadeIn: 0.03, fadeOut: 0.5, decisaoRisco: null,
  },
  legenda: { top: 206, altura: 330, tamanho: 68, modo: "light" },
  camera: { x: 0, y: 0.03, z: 0.9, tx: 0, ty: 0, tz: 0, fov: 30 },
  ambiente: { deriva: false, flutuacao: false, poeira: 0, periodico: true },
  marcas: {},
  fecho: { asset: "vai-legalizai-dylan", link: { texto: "LINK DA BIO", cor: "#DD4E27" } },
  sons: { perfil: "v2", modoRuido: "por-evento", extras, remover: [] },
  fatos: {
    publico: "ME",
    exemplos: [{ texto: "R$ 178,31", origem: "dado fictício da empresa de exemplo do app (ME); o Pedro liberou nítido em 01/10; não é guia de MEI" }],
  },
  capa: { quadro: "auto", titulo: "Contabilidade tradicional vs Legalizaí", destaque: "Legalizaí" },
  notas: "Versão 7 do reel de 05/10, montada pelo kit em 06/10 a pedido do Pedro (a linha que desce), por provas/cena.js. Camada nova: RM/src/kit/ext/precificacao/linha.tsx.",
  objetos: [{ id: "aparelho", modelo: "glb-video-iphone", pose: { x: 0, y: -0.012, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 0 }, telaInicial: "apagada" }],
  telas: {},
  regioes: {},
  camadas: [
    {
      id: "linha", tipo: "p2d-LinhaDescendo", x: 540, y: 960, dur: DUR, tempos, chaves, camera,
      telas: { splash: { src: PT + "tela-splash.png" }, atividade: { src: PT + "tela-dossie-atividade.png" }, home: { src: PT + "tela-home-dia1.png" } },
    },
    { id: "legenda2d", tipo: "p2d-legenda", modos: narr.phrases.map(() => "light"), fecho: true },
  ],
  batidas: [
    { id: "fecho-simbolo", params: { alvo: "aparelho", appFecha: null, encolhe: { t: { fecho: -0.4 }, alvoMundo: null } } },
    { id: "link-bio", params: { t: { fecho: 0.3 }, sai: { t: { fecho: 1.95 } } } },
    { id: "p2d-sai", params: { camada: "legenda2d", t: r2(DUR - 0.42), dur: 0.2 } },
  ],
  colisao: {},
};
fs.writeFileSync(path.join(PECA, "cenas.json"), JSON.stringify(c, null, 1));
console.log(`chaves ${chaves.length} | câmera ${camera.length} | sons ${extras.length} | fecho ${TF} | duração ${DUR}`);
