// monta a cenas.json da versão 5 (a v4 com o "C-R-C" soletrado, "O mesmo cuidado, mas agora..." e a cena do Tradicional
// do "O mesmo cuidado" na tela até o fim da frase; a v4 trouxe "ép" na voz, "atividade" no lugar de CNAE e a fala do
// contador com menos pausas) a partir da v2 (mundo, telas aprovadas, trilha e sons iguais; tempos pelas palavras
// da narração nova, voz/narracao.json). Uso: node provas/cena-v5.js (na pasta da peça)
const fs = require("fs");
const path = require("path");
const PECA = path.resolve(__dirname, "..");
const V2 = path.resolve(PECA, "../2026-10-05-tradicional-vs-legalizai-v2/cenas.json");
const c = JSON.parse(fs.readFileSync(V2, "utf8"));
const v2 = JSON.parse(fs.readFileSync(V2, "utf8"));
const narr = JSON.parse(fs.readFileSync(path.join(PECA, "voz/narracao.json"), "utf8"));

// ---------- palavras ----------
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** índice da n-ésima ocorrência da palavra (sem caixa, acento e pontuação); erro se não achar */
function iw(txt, n = 1) {
  let k = 0;
  for (const w of narr.words) if (norm(w.t) === norm(txt) && ++k === n) return w.i;
  throw new Error(`palavra não achada: "${txt}" (${n}a)`);
}
const W = (txt, d, n = 1) => (d ? { palavra: iw(txt, n), desloc: d } : { palavra: iw(txt, n) });
const S = (txt, n = 1) => narr.words[iw(txt, n)].s; // início da palavra, em s
const E = (txt, n = 1) => narr.words[iw(txt, n)].e; // fim
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;

// ---------- mundo ----------
const MESA = -0.0905, xT = -0.1365, xL = 0.1365;
const camT = { x: -0.142, y: 0.135, z: 0.64, tx: -0.142, ty: 0.02, tz: 0, fov: 30 };
// Legalizaí: o celular maior e no meio (pedido do Pedro, 05/10 à tarde). Câmera mais perto e um pouco mais alta,
// pra o chão da frente (onde cartões, placas, moeda e sino pousam) continuar no quadro.
const CAML = JSON.parse(process.env.CAML || "null");
const camL = CAML || { x: xL, y: 0.15, z: 0.56, tx: xL, ty: 0.0213, tz: 0, fov: 30 };
// (topo do celular uns 70 px abaixo da faixa da legenda, que vai até y 536; o chão da frente, com cartões, placas e
// moeda, fica acima de y 1800)
// a espera no Tradicional: a câmera chega no despertador e no calendário
const camEspera = JSON.parse(process.env.CAMESP || "null") || { x: -0.1, y: 0.104, z: 0.6, tx: -0.085, ty: 0.003, tz: -0.01, fov: 24.5 };
// (o close da espera é zoom, não aproximação: a câmera não pode passar da frente da vitrine, zFrente 0,5, senão a
// vitrine some e o fundo vira o papel quente; e a folha que vira no calendário não pode entrar na faixa da legenda)
// a mesa do Tradicional (a do gancho e a da segunda visita): x e z no mundo
const MESA_T = JSON.parse(process.env.MESA_T || "null") || { pilha: [-0.17, 0.0], pasta: [-0.195, -0.13], relogio: [-0.088, 0.07], calendario: [-0.067, -0.065], carimboPara: [-0.0363, 0.1018] };
// (o carimbo vai pra frente e pra esquerda da pilha, a 4,7 cm dela: atrás ele bate na pasta aberta, e à direita entra
// no close da espera)
// argila fria dos modelos detalhados (as partes que o catálogo ajusta pelo nome, como ponteiros e mostrador, ficam por cima)
const ARGILA_FRIA = { cor: "#9AA0A8", rugosidade: 0.8, metalico: 0, envMap: 0.3, semMapa: true };
const S_RELOGIO = 0.42, S_TELEFONE = 0.36;

c.peca = "2026-10-05-tradicional-vs-legalizai-v5";
c._ajuda = {
  peca: "Reel 9:16 de 05/10/2026 (reel_93834bb1), versão 5 (a v4 com o 'C-R-C' soletrado, 'O mesmo cuidado, mas agora...' e o Tradicional na tela até o fim dessa frase; a v4 trouxe 'app' dito 'ép', 'atividade' no lugar de CNAE e a fala do contador com menos pausas): abertura com a tela dividida na diagonal (o embate), a espera no Tradicional (calendário virando e ponteiros correndo), o CNAE certo e cada passo no app, o celular maior e no meio, e 'E clica no link da bio' com o E bem dito. Roteiro: ROTEIRO.md desta pasta.",
  mundo: "O mesmo da v2: vitrines de 0,267 m (borda 0,27, vão 0,003), o Tradicional centrado em x -0,1365 e o Legalizaí em x 0,1365. Câmera do Tradicional igual à da v2; a do Legalizaí mais perto (o celular com uns 55% da largura do quadro).",
  tempos: "Presos às palavras da voz nova (voz/narracao.json, alinhada pelo kit). tFecho e duração automáticos.",
};
c.narracao = "voz/narracao.json";
c.voz = { arquivo: "voz/narr-dylan.wav", fecho: "asset", final: "voz/voz-final.wav" };
c.camera = { ...camT };
c.legenda = { top: 206, altura: 330, tamanho: 68, modo: "light" };
c.ambiente = { deriva: true, flutuacao: true, poeira: 0.5, periodico: true, varredura: { x: r4(xL + 0.11), z: 0.12, largura: 0.05, altura: 0.5, intensidade: 12, yDe: 0.28, yAte: -0.28 } };
c.regioes = "telas/regioes.json";
c.camadas = [];
c.fecho = { asset: "vai-legalizai-dylan", link: { texto: "LINK DA BIO", cor: "#DD4E27" } };
c.colisao = { permitidos: [["lupa", "pilhaB"]] };
c.capa = { quadro: "auto", titulo: "Contabilidade tradicional vs Legalizaí", destaque: "Legalizaí" };
c.notas = "Versão 5 de 05/10/2026 (a v4 com o C-R-C soletrado, 'mas agora' e o Tradicional na tela até o fim do 'O mesmo cuidado...', pedido do Pedro à noite), gerada por provas/cena-v5.js a partir da v2. Telas do protótipo Next.js; receitas em telas/receitas (as da v1 sem mudança e duas novas da escolha do CNAE, liberadas na revisão de 02/10).";

// ---------- telas ----------
const P3 = "pecas/2026-10-05-tradicional-vs-legalizai-v5/telas/";
for (const k of Object.keys(c.telas)) c.telas[k].arquivo = c.telas[k].arquivo.replace(/^pecas\/[^/]+\/telas\//, P3);
c.telas.dossieAtividade = {
  arquivo: P3 + "tela-dossie-atividade.png",
  conjunto: "2026-10-02",
  extras: [{ tipo: "brilhoCard", regiao: "cardWeb" }, { tipo: "toqueCirculo", regiao: "toqueWeb" }],
};
c.telas.dossiePrincipal = { arquivo: P3 + "tela-dossie-principal.png", conjunto: "2026-10-02", extras: [] };
c.telas.dossiePrincipalVazio = { arquivo: P3 + "tela-dossie-principal-vazio.png", conjunto: "2026-10-02", extras: [] };
c.telas.homeDia1 = { ...c.telas.homeDia1, extras: [{ tipo: "brilhoCard", regiao: "cardAtivacao" }] };

// ---------- trilha ----------
// Let's Move: a batida cheia entra no "Legalizaí" do gancho (W3); automação deslocada pros tempos novos, com o vale
// de -5,5 dB no "tem um contador de verdade, com registro no CRC" (o elemento melódico disputa com a fala)
const t3 = S("Legalizaí");
const tCont0 = S("tem"), tCont1 = E("CRC");
c.trilha.automacao = [[0, 3], [r2(t3 - 0.01), 3], [r2(t3), 4], [r2(t3 + 1.06), 4], [r2(t3 + 1.16), 0], [r2(tCont0 - 0.15), 0], [r2(tCont0), -5.5], [r2(tCont1), -5.5], [r2(tCont1 + 0.15), 0]];
c.trilha._ajuda = `Let's Move (Mixkit 836, liberada), como na v2. A batida cheia entra no 'Legalizaí' do gancho (W3 = ${t3.toFixed(2)} s). Automação da v2 deslocada: intro +3 dB, primeiro compasso +4 dB, vale de -5,5 dB de ${tCont0.toFixed(2)} a ${tCont1.toFixed(2)} s no 'tem um contador de verdade, com registro no CRC'.`;

// ---------- objetos ----------
const ap = c.objetos.find((o) => o.id === "aparelho");
ap.pose = { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 1, vis: 1 };
const pal = c.objetos.find((o) => o.id === "palco");
// modelos detalhados (catálogo de 05/10, KIT/modelos/LEIA-ME.md): o despertador da espera (ponteiros e martelo por
// conteudo.nos) e o telefone de disco do "O mesmo cuidado" (o disco gira)
c.objetos.push({
  id: "relogioT", modelo: "glb-despertador-detalhado",
  pose: { x: MESA_T.relogio[0], y: r4(MESA + (0.174155 * S_RELOGIO) / 2 + 0.0002), z: MESA_T.relogio[1], rx: 0, ry: -0.32, rz: 0, s: S_RELOGIO, vis: 1 },
  sombra: 0, materiais: { "*": { ...ARGILA_FRIA } },
  conteudo: {
    nos: {
      corre: [{ no: "PonteiroMinutos", prop: "rz", por: -6.2832 }, { no: "PonteiroHoras", prop: "rz", por: -0.5236 }, { no: "PonteiroSegundos", prop: "rz", por: -18.8496 }],
      toca: [{ no: "Martelo", prop: "rz", por: 0.32 }],
    },
  },
});
c.objetos.push({
  id: "telefoneT", modelo: "glb-telefone-disco",
  pose: { x: -0.095, y: r4(MESA + 0.0804 * S_TELEFONE + 0.0002), z: 0.075, rx: 0, ry: -0.5, rz: 0, s: S_TELEFONE, vis: 0 },
  sombra: 0, materiais: { "*": { ...ARGILA_FRIA } },
  conteudo: { nos: { disca: [{ no: "Disco", prop: "rz", por: -2.5 }] } },
});
const card = (h, s, rx) => r4(MESA + ((h * s) / 2) * Math.cos(rx) + ((0.0024 * s) / 2) * Math.abs(Math.sin(rx)) + 0.0003);
const k = 0.1 / 1146; // metros por px da tela montada
const sImposto = 0.068 / (648 * k), sContrato = 0.072 / (880 * k), sPrincipal = 0.084 / (1146 * k);
const ct = pal.conteudo;
ct.camRepouso = { ...camL };
ct.pecas = {
  ...ct.pecas,
  // Tradicional, segunda visita ("Abrir empresa era papel, ida ao escritório e espera pra ser atendido"): a pilha
  // com o carimbo, a pasta aberta atrás, o despertador na frente e o calendário de mesa atrás dele
  // (o despertador de argila sai: no lugar dele entra o detalhado, objeto "relogioT")
  pilhaA: { x: MESA_T.pilha[0], z: MESA_T.pilha[1], ry: 0.12, s: 1.15 },
  pastaA: { x: MESA_T.pasta[0], z: MESA_T.pasta[1], ry: 0.1, s: 1.0, visivel: true },
  despP: { visivel: false },
  calendario: { tipo: "calendario", lado: "frio", x: MESA_T.calendario[0], y: 0, z: MESA_T.calendario[1], rx: 0, ry: -0.35, rz: 0, s: 0.9, altura: 0.08, visivel: true, opcoes: { dia: 8, folhas: 6 } },
  // Legalizaí: o card coral "Web design · Principal" sai da tela no "CNAE" e pousa em pé na frente do aparelho
  cartaoPrincipal: {
    tipo: "cartao-app", lado: "quente", x: 0, y: 0, z: 0, rx: -0.18, ry: -0.06, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "dossiePrincipal",
      regiao: { x: 72, y: 388, w: 1146, h: 192 },
      raio: 28,
      compacto: 1146,
      raioCompacto: 28,
      corCorpo: "#DD4E27",
      sombraContato: true,
      pousoMundo: { x: r4(xL - 0.002), y: card(192 * k, sPrincipal, 0.18), z: 0.062, largura: 0.084 },
    },
  },
  cartaoImposto: { ...ct.pecas.cartaoImposto, opcoes: { ...ct.pecas.cartaoImposto.opcoes, pousoMundo: { x: xL, y: card(486 * k, sImposto, 0.2), z: 0.058, largura: 0.068 } } },
  cartaoContrato: { ...ct.pecas.cartaoContrato, opcoes: { ...ct.pecas.cartaoContrato.opcoes, pousoMundo: { x: xL, y: card(188 * k, sContrato, 0.16), z: 0.06, largura: 0.072 } } },
  // o sino cai à esquerda do aparelho (à direita ele encostava no cartão do imposto, na frente)
  sino: { ...ct.pecas.sino, s: 0.62, opcoes: { ...ct.pecas.sino.opcoes, pousoMundo: { x: r4(xL - 0.06), y: r4(MESA + 0.0265 * 0.62 + 0.0003), z: 0.04 } } },
  // o "O mesmo cuidado": a pasta do contrato social à esquerda e o telefone de disco à direita, na frente dela
  pastaC: { ...(ct.pecas.pastaC || {}), x: -0.165, z: -0.02, ry: 0.2, s: 1.3 },
  moeda: { opcoes: { sombraContato: true, pousoMundo: { x: r4(xL - 0.0555), y: r4(MESA + 0.017 * 1.08 + 0.0003), z: 0.064 } } },
};
delete ct.pecas.cartaoNasceu; // a v3 não usa o cartão "Sua empresa nasceu." (fica na tela)
ct.textos = [...new Set([...(ct.textos || []), "Web design", "CNAE 6201-5/02 · Ver detalhes", "Principal", "8", "Sua ativação", "CNPJ aberto", "Certificado digital", "Acesso completo ao app"])];

// ---------- batidas ----------
const sonsV2 = (id, n = 1) => {
  let i = 0;
  for (const x of v2.batidas) if (x.id === id && x.params && x.params.sons && ++i === n) return x.params.sons;
  return undefined;
};
const B = [];
const b = (id, params) => B.push({ id, params });

// ===== gancho: a tela dividida na diagonal (o embate) =====
// A linha "/" de (720, 0) a (360, 1920): a câmera principal (o Tradicional) à esquerda e a câmera 2 (o Legalizaí) à
// direita, cada assunto no meio da sua metade (números da prova da divisão, KIT/pecas/_teste-divisao). O raio desce
// no "versus" e o VS estoura; antes do "Abrir", a divisão sai pra direita e o Tradicional toma a tela, revelando o
// despertador e o calendário, que no gancho ficam atrás da linha.
const DIV = { ang: r4((Math.atan2(1920, 720 - 360) * 180) / Math.PI), px: 540, py: 960 };
const camDivT = JSON.parse(process.env.CAMDIVT || "null") || { x: -0.124, y: 0.105, z: 0.9, tx: -0.114, ty: -0.02, tz: 0, fov: 30 };
// (a principal mais à esquerda e mais longe que na prova da divisão: o despertador, à direita da pilha, fica todo atrás
// da linha, e a pasta aberta cabe inteira à esquerda)
const camDivL = JSON.parse(process.env.CAMDIVL || "null") || { x: 0.06, y: 0.16, z: 0.975, tx: 0.06, ty: 0.036, tz: 0, fov: 30 };
const tSai = r2(S("Abrir") - 0.52);
c.camera = { ...camDivT };
const VS = JSON.parse(process.env.VS || "null") || { y: 860, tamanho: 150 }; // acima da pilha, entre o carimbo e o celular
const vsX = r4(720 - (VS.y * 360) / 1920); // o VS senta na linha
c.camadas = [{ id: "divisor", tipo: "divisor-vs", estado: {}, texto: "VS", tamanho: VS.tamanho || 160, vsX, vsY: VS.y, semente: 7 }];
b("tela-dividida", {
  t: 0, dur: 0, ang: DIV.ang, px: DIV.px, py: DIV.py, lado: "direita", cam2: { ...camDivL },
  camera2: { desloc: 0, para: { z: r4(camDivL.z - 0.03) }, dur: r2(tSai - 0.1), ease: "power1.inOut" },
  sai: { t: tSai, dur: 0.55, ease: "power3.inOut", camera: { para: { ...camT } } },
});
b("aproxima", { t: 0, para: { z: r4(camDivT.z - 0.03) }, dur: r2(tSai - 0.15), ease: "power1.inOut", riser: null });
b("vitrine-luz", { t: W("tradicional"), dur: 0.45 });
b("divisor-raio", { camada: "divisor", t: W("vs", -0.05), sai: { t: tSai, dur: 0.5, ease: "power2.in" } });
b("gancho-giro-varredura", { t: W("Legalizaí", -0.12), pose: { desloc: 0.02, para: { ry: -0.07, rx: 0, rz: 0, y: -0.00073 }, dur: 1.3, ease: "lgPousa" }, camera: null, varredura: { desloc: 0.12, dur: 0.75, ease: "power2.inOut" } });
b("palco-luz", { t: W("Legalizaí"), para: { halo: 0.55, brilho: 0.16 }, dur: 0.6 });
b("aceno", { alvo: "aparelho", t: W("você"), eixo: "rx", amp: 0.04 });

// ===== T2: "Abrir empresa era papel, ida ao escritório e espera pra ser atendido." =====
b("carimba", { t: W("papel", 0.04), sai: null, sons: sonsV2("carimba") });
// o carimbo sobe, vai pra frente e pra esquerda da pilha e desce até o chão: a folha carimbada fica livre (o lado
// direito da mesa é da espera)
const tCarSai = r2(E("papel") + 0.05);
b("peca-move", { peca: "carimbo", t: tCarSai, chaves: [{ sobe: 0.03, dur: 0.12, ease: "power2.out" }, { x: MESA_T.carimboPara[0], z: MESA_T.carimboPara[1], dur: 0.22, ease: "power2.inOut" }, { sobe: -0.0512, dur: 0.15, ease: "power2.in" }, { sobe: -0.0506, dur: 0.1, ease: "power2.out" }], sons: sonsV2("peca-move", 1) });
b("pasta-leva", { t: W("ida", 0.04) });
// "e espera pra ser atendido": a câmera chega no despertador e no calendário; as folhas viram e os ponteiros correm
b("aproxima", { t: r2(S("e", 1) - 0.1), para: { ...camEspera }, dur: 1.0, ease: "power2.inOut", riser: null });
const tVira0 = S("espera"), tVira1 = E("atendido");
b("peca-move", { peca: "calendario", t: r2(tVira0 - 0.05), chaves: [{ vira: 1, dur: 0.34, ease: "power2.inOut" }, { vira: 2, dur: 0.3, ease: "power2.inOut" }, { vira: 3, dur: 0.28, ease: "power2.inOut" }, { vira: 4, dur: 0.26, ease: "power2.inOut" }], sons: [0, 0.34, 0.64, 0.92].map((d, i) => ({ som: "mixkit-1105", em: "inicio", desloc: r2(d + 0.08), ganhoDb: -31 - i })) });
b("objeto-canal", { objeto: "relogioT", t: r2(tVira0 - 0.1), canal: "corre", de: 0, para: 1.5, dur: 1.15, ease: "power1.in", sons: [0, 0.18, 0.34, 0.48, 0.6, 0.71, 0.81, 0.9, 0.98, 1.05, 1.11].map((d, i) => ({ som: "sint-s_tick", em: "inicio", desloc: r2(d + 0.05), ganhoDb: -40 + Math.min(4, i * 0.4), args: [2600] })) });

// no "atendido" o despertador toca: o martelo bate entre os sinos e o corpo treme
const tToca = r2(S("atendido") + 0.02);
b("pose-objeto", { alvo: "relogioT", t: tToca, para: { rz: 0.035 }, dur: 0.034, ease: "none" });
for (let i = 1; i < 10; i++) b("pose-objeto", { alvo: "relogioT", t: r2(tToca + i * 0.034), para: { rz: i % 2 ? -0.035 : 0.035 }, dur: 0.034, ease: "none" });
b("pose-objeto", { alvo: "relogioT", t: r2(tToca + 0.34), para: { rz: 0 }, dur: 0.06, ease: "power2.out" });
for (let i = 0; i < 10; i++) b("objeto-canal", { objeto: "relogioT", t: r2(tToca + i * 0.034), canal: "toca", para: i % 2 ? -1 : 1, dur: 0.034, ease: "none", ...(i === 0 ? { sons: [{ som: "sint-s_ring", em: "inicio", desloc: 0, ganhoDb: -30, args: [0.42, 2350] }] } : {}) });
b("objeto-canal", { objeto: "relogioT", t: r2(tToca + 0.34), canal: "toca", para: 0, dur: 0.06, ease: "power2.out" });

// ===== L2: "Agora é tudo pelo app, com o CNAE certo e cada passo na sua tela." =====
const tX3 = r2(S("Agora") - 0.54); // 0,04 s antes do padrão: assim o topo do aparelho não passa pela faixa da legenda no chicote
b("troca-lado", { t: tX3, para: { ...camL }, dur: 0.5, borrao: 30 });
b("mergulho-abre-app", { t: W("Agora", 0.06), camera: null, giro: null, troca: { de: "splash", para: "dossieAtividade", modo: 0, desloc: 0.05, dur: 0.45, ease: "power2.out", fim: 0.46 } });
b("palco-luz", { t: r2(S("Agora") + 0.1), para: { halo: 0.65, brilho: 0.07, brilhoNeutro: 1 }, dur: 0.45 });
// "com a atividade certa": o card "Web design" (a sugestão compatível) acende no fim do "app", o toque escolhe e a tela
// abre a Principal antes da "atividade"; na "atividade" o card coral sai da tela e pousa em pé na frente do aparelho no
// "certa"
// (na v4 a fala vai direto do "app" pra "atividade", sem pausa: o brilho começa no "app")
const tBrilhoWeb = r2(S("app"));
b("tela-canal", { alvo: "aparelho", t: tBrilhoWeb, canal: "brilhoCard", para: 1, dur: 0.22, ease: "power2.out" });
b("tela-canal", { alvo: "aparelho", t: r2(tBrilhoWeb + 0.19), canal: "toque", de: 0, para: 1, dur: 0.5, ease: "none", sons: [{ som: "mixkit-1120", em: "inicio", desloc: 0, ganhoDb: -27 }] });
b("empurrar-tela", { t: r2(tBrilhoWeb + 0.32), de: "dossieAtividade", para: "dossiePrincipal", modo: 0, dur: 0.26, ease: "power2.out", zera: { brilhoCard: 0, toque: 0 }, zeraEm: "fim", fim: 0.27, camera: null });
b("cartao-sai-da-tela", { cartao: "cartaoPrincipal", sai: r2(Math.max(S("atividade") + 0.18, tBrilhoWeb + 0.6)), pousa: W("certa", 0.2), telaVazia: "dossiePrincipalVazio", arco: 0.012, compacta: { de: 0.25, ate: 0.85, ease: "power2.inOut" }, achata: null, volta: { t: W("passo", -0.24), dur: 0.24, ease: "power2.inOut", telaCheia: "dossiePrincipal" }, sons: sonsV2("cartao-sai-da-tela", 1) });
// "e cada passo na sua tela": com o card de volta, a tela empurra pro início do dia 1 (a ativação passo a passo) e o
// card da ativação acende no "sua tela"
b("empurrar-tela", { t: W("passo", 0.04), de: "dossiePrincipal", para: "homeDia1", zera: {}, camera: null });
b("tela-canal", { alvo: "aparelho", t: W("sua", -0.02), canal: "brilhoCard", de: 0, para: 1, dur: 0.25, ease: "power2.out" });
b("tela-canal", { alvo: "aparelho", t: r2(S("O", 2) - 0.25), canal: "brilhoCard", para: 0, dur: 0.25, ease: "power2.in" });

// ===== L3: "O sistema calcula, emite a guia e te avisa. Você só paga." =====
b("empurrar-tela", { t: W("O", 0.0, 2), de: "homeDia1", para: "inicio", zera: { brilhoCard: 0 }, zeraEm: "fim", camera: null });
b("cartao-sai-da-tela", { cartao: "cartaoImposto", sai: W("calcula", 0.02), pousa: W("calcula", 0.38), arco: 0.012, telaVazia: "inicioVazio", achata: null, volta: null, sons: sonsV2("cartao-sai-da-tela", 2) });
b("cartao-contador", { cartao: "cartaoImposto", brilho: { t: W("calcula", 0.38), dur: 0.25, ease: "power2.out" }, contador: { t: { desloc: 0 }, dur: 0.6, ease: "power3.out" }, varreduras: [{ t: { desloc: 0.04 }, dur: 0.55 }], apaga: { t: { desloc: 1.1 }, dur: 0.4, ease: "power2.inOut" } });
b("toque-cartao", { cartao: "cartaoImposto", palavra: iw("paga"), revela: { t: W("emite"), dur: 0.3, ease: "power2.out", brilho: 0.5 }, camera: { ida: { desloc: -0.1, para: { z: "-=0.02", y: "-=0.004", ty: "-=0.006", x: "+=0.005", tx: "+=0.007" }, dur: 0.18, ease: "power2.out" }, volta: { desloc: 0.1, para: { z: "+=0.02", y: "+=0.004", ty: "+=0.006", x: "-=0.005", tx: "-=0.007" }, dur: 0.16, ease: "power2.inOut" } } });
// o sino cai do alto ao lado do aparelho, quica no chão e balança apoiado no aro ("te avisa")
b("peca-move", { peca: "sino", t: r2(S("avisa") - 0.33), de: { vis: 1, y: 0.09, rz: 0 }, chaves: [{ y: 0, dur: 0.36, ease: "bounce.out" }], sons: sonsV2("peca-move", 2) });
b("peca-move", { peca: "sino", t: W("avisa", 0.05), chaves: [{ rz: 0.16, dur: 0.09, ease: "sine.out" }, { rz: -0.12, dur: 0.15, ease: "sine.inOut" }, { rz: 0.08, dur: 0.13, ease: "sine.inOut" }, { rz: -0.04, dur: 0.12, ease: "sine.inOut" }, { rz: 0, dur: 0.12, ease: "sine.inOut" }], sons: sonsV2("peca-move", 3) });
// fora de quadro (câmera no Legalizaí desde o "Agora"): a natureza-morta da próxima visita ao Tradicional
const tFora1 = r2(S("Agora") + 0.6);
for (const id of ["pilhaA", "carimbo", "pastaA", "calendario"]) b("peca-move", { peca: id, t: tFora1, de: { vis: 0 }, para: {} });
b("pose-objeto", { alvo: "relogioT", t: tFora1, para: { vis: 0 }, dur: 0.02, ease: "none" });
for (const id of ["pilhaB", "lupa"]) b("peca-move", { peca: id, t: tFora1, de: { vis: 1, enc: 1 }, para: {} });

// ===== T3: "Fugiu do padrão?" =====
const tX4 = r2(S("Fugiu") - 0.52);
b("troca-lado", { t: tX4, para: { ...camT }, dur: 0.5, borrao: 30 });
b("peca-move", { peca: "lupa", t: r2(S("Fugiu") + 0.2), para: { x: 0.016, z: 0.01, ry: -0.18 }, dur: 0.75, ease: "sine.inOut" });
// fora de quadro: o Legalizaí vai pras Declarações (sem o cartão e sem o sino)
const tFora2 = r2(tX4 + 0.6);
b("peca-move", { peca: "cartaoImposto", t: tFora2, de: { vis: 0, prende: 1 }, para: {} });
b("peca-move", { peca: "sino", t: tFora2, de: { vis: 0 }, para: {} });
b("empurrar-tela", { t: tFora2, de: "inicioVazio", para: "declaracoes", zera: { verif: 0, toqueBotao: 0, anel: 0, pulso: 0 }, zeraEm: "fim", dur: 0.02, camera: null });

// ===== L4: "No plano do Simples, tem um contador de verdade, com registro no CRC." =====
const tX5 = r2(S("No") - 0.5);
b("troca-lado", { t: tX5, para: { ...camL }, dur: 0.5, borrao: 30 });
b("fileira-fora-do-padrao", { sai: { t: W("plano", 0.04), dur: 0.26, escalona: 0.03, ease: "power2.out" }, salto: { t: W("Simples"), indice: 0, dur: 0.34, ease: "power2.out" }, sons: sonsV2("fileira-fora-do-padrao") });
b("moeda-pessoa", { placa: "placa1", rola: { t: W("contador", -0.45), ease: "kitChega" }, pousa: { t: W("contador") }, encosta: { t: W("verdade"), para: { x: 0.007, z: 0.008, rz: -0.38 }, dur: 0.22, volta: { dur: 0.42, ease: "kitPousa5" }, placa: { dur: 0.4, ease: "kitPousa5" }, entregue: { desloc: 0.06, dur: 0.24 } }, brilho: { t: W("CRC"), dur: 0.5 }, sons: sonsV2("moeda-pessoa") });
// a câmera chega devagar enquanto a frase se completa
b("aproxima", { t: W("registro"), para: { z: camL.z - 0.03, y: camL.y - 0.004 }, dur: 1.3, ease: "power1.inOut", riser: null });
// fora de quadro: troca pra pasta C
const tFora3 = r2(tX5 + 0.8);
for (const id of ["pilhaB", "lupa"]) b("peca-move", { peca: id, t: tFora3, de: { vis: 0 }, para: {} });
b("peca-move", { peca: "pastaC", t: tFora3, de: { vis: 1, enc: 1 }, para: {} });
b("pose-objeto", { alvo: "telefoneT", t: tFora3, para: { vis: 1 }, dur: 0.02, ease: "none" });

// ===== T4: "O mesmo cuidado, mas agora no app que tá chegando." =====
// (v5: o Pedro pediu a cena do Tradicional na tela até o fim da frase. A câmera chega no Tradicional logo depois do
// "CRC" e fica lá até o "chegando", chegando devagar; a luz fria passa no "cuidado" e alguém disca no "mesmo")
const tX6 = r2(Math.max(E("CRC") + 0.1, S("O", 3) - 0.5));
b("troca-lado", { t: tX6, para: { ...camT }, dur: 0.45, borrao: 30 });
b("aproxima", { t: r2(tX6 + 0.5), para: { x: -0.131, y: 0.13, z: 0.62, tx: -0.129, ty: 0.004, fov: 28.4 }, dur: r2(E("chegando") - tX6 - 0.3), ease: "power1.inOut", riser: { t: W("chegando", -0.32) } });
b("vitrine-luz", { t: r2(S("cuidado") - 0.05), dur: 0.5 });
// o cuidado do escritório: alguém disca (o disco vai e volta, com os estalos do retorno)
b("objeto-canal", { objeto: "telefoneT", t: r2(S("mesmo") - 0.02), canal: "disca", de: 0, para: 1, dur: 0.22, ease: "power2.inOut", sons: [{ som: "mixkit-1117", em: "inicio", desloc: 0.2, ganhoDb: -32 }] });
b("objeto-canal", { objeto: "telefoneT", t: r2(S("mesmo") + 0.24), canal: "disca", para: 0, dur: 0.42, ease: "power1.out", sons: [{ som: "sint-s_roll", em: "inicio", desloc: 0, ganhoDb: -36, args: [9, 0.4] }] });
// fora de quadro: o Legalizaí vai pros Documentos, sem placas e sem moeda
const tFora4 = r2(tX6 + 0.5);
for (const id of ["placa1", "placa2", "placa3", "placa4"]) b("peca-move", { peca: id, t: tFora4, de: { vis: 0, prende: 1, salto: 0, entregue: 0 }, para: {} });
b("peca-move", { peca: "moeda", t: tFora4, de: { vis: 0, k: 0, giro: 0, x: 0, z: 0, rz: 0 }, para: {} });
b("empurrar-tela", { t: tFora4, de: "declaracoes", para: "documentos", zera: {}, dur: 0.02, camera: null });

// ===== L5: "Segue a gente e clica no link da bio." =====
// (v5: o cartão "Contrato social" saindo da tela não cabe mais: o Legalizaí volta só no "Segue")
b("troca-lado", { t: r2(S("Segue") - 0.5), para: { ...camL }, dur: 0.5, borrao: 30 });
b("fecho-simbolo", { appFecha: { t: W("gente"), de: "documentos", para: "splash", modo: 0, dur: 0.45, ease: "power2.out", fim: 0.47, zera: { verif: 0, toqueBotao: 0, anel: 0, brilhoCard: 0 }, zeraEm: "fim" }, pose: { para: { y: 0.008, s: 0.78, ry: -0.03 }, dur: 0.7, ease: "lgPousa" }, encolhe: { t: { fecho: -0.4 }, alvoMundo: null, alvoPx: [410, 818], s: 0.12, dur: 0.4, ease: "power3.in", esconde: 0.4 }, sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });
b("palco-luz", { t: W("gente", 0.1), para: { brilho: 0.14, brilhoNeutro: 0 }, dur: 0.45 });
b("palco-luz", { t: W("link"), para: { halo: 0.85 }, dur: 0.3, ease: "power2.out" });
b("palco-luz", { t: { fecho: -0.6 }, para: { fusao: 1, aquece: 1 }, dur: 0.02 });
b("peca-move", { peca: "pastaC", t: { fecho: -0.6 }, de: { vis: 0 }, para: {} });
b("pose-objeto", { alvo: "telefoneT", t: { fecho: -0.6 }, para: { vis: 0 }, dur: 0.02, ease: "none" });
b("palco-fecha", { t: { fecho: -0.4 }, centro: [410, 818], pecas: [] });
b("link-bio", { t: { fecho: 0.3 }, dur: 0.45, ease: "lgEntra", sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });
// volta do loop: depois do fecho, o quadro volta a ser o 0 (a tela dividida, sem o raio). A divisão entra seca com as
// duas câmeras do gancho, as vitrines crescem do centro com a mesa do Tradicional subindo, e o aparelho cresce na pose
// do quadro 0 (a tela dele já é a do splash). O despertador volta atrás da linha, onde não aparece.
b("tela-dividida", { t: { fim: -0.95 }, dur: 0, ang: DIV.ang, px: DIV.px, py: DIV.py, lado: "direita", cam2: { ...camDivL }, camera: { para: { ...camDivT } }, camera2: null, sai: null });
b("pose-objeto", { alvo: "aparelho", t: { fim: -0.95 }, para: { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 0.001, vis: 1 }, dur: 0.02, ease: "none" });
b("pose-objeto", { alvo: "relogioT", t: { fim: -0.8 }, para: { vis: 1, rz: 0 }, dur: 0.02, ease: "none" });
b("objeto-canal", { objeto: "relogioT", t: { fim: -0.9 }, canal: "corre", para: 0, dur: 0.02, ease: "none" });
b("objeto-canal", { objeto: "relogioT", t: { fim: -0.9 }, canal: "toca", para: 0, dur: 0.02, ease: "none" });
b("vitrine-palco", { t: { fim: -0.86 }, cresce: { dur: 0.5, ease: "power3.out", centro: [540, 1180] }, entram: ["pilhaA", "carimbo", "pastaA", "calendario"], sobe: { desloc: 0.16, dur: 0.4, escalona: 0.06, ease: "kitPousa5" } });
b("pose-objeto", { alvo: "aparelho", t: { fim: -0.7 }, para: { s: 1 }, dur: 0.5, ease: "back.out(1.3)" });
c.batidas = B;
fs.writeFileSync(path.join(PECA, "cenas.json"), JSON.stringify(c, null, 2) + "\n");
console.log("batidas:", B.length, "| camL", JSON.stringify(camL));
console.log("trocas:", { tSai, tX3, tX4, tX5, tX6 }, "| espera", tVira0, "a", tVira1);
