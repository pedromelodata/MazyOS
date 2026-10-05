// monta a cenas.json da versão 2 a partir da v1 (telas, regiões, trilha, sons e fatos iguais)
const fs = require("fs");
const V1 = process.argv[2], V2 = process.argv[3];
const c = JSON.parse(fs.readFileSync(V1, "utf8"));
const v1 = JSON.parse(fs.readFileSync(V1, "utf8"));
const MESA = -0.0905, xT = -0.1365, xL = 0.1365;
const camT = { x: xT, y: 0.135, z: 0.64, tx: xT, ty: 0.02, tz: 0, fov: 30 };
const camL = { x: xL, y: 0.135, z: 0.64, tx: xL, ty: 0.02, tz: 0, fov: 30 };
const r4 = (x) => Math.round(x * 10000) / 10000;

c.peca = "2026-10-05-tradicional-vs-legalizai-v2";
c._ajuda = {
  peca: "Reel 9:16 de 05/10/2026 (reel_93834bb1), versão 2: um lado de cada vez (a câmera desliza entre a vitrine Tradicional, à esquerda, e a Legalizaí, à direita), objetos com contato e sem atravessar nada, fecho com LINK DA BIO. Roteiro: ROTEIRO.md desta pasta.",
  mundo: "Vitrines de 0,267 m cada (borda 0,27, vão 0,003): o Tradicional centrado em x -0,1365, o Legalizaí em x 0,1365. Câmeras de repouso camT e camL: mesma altura e distância, 10 graus de elevação; a troca de lado é só o deslocamento em x.",
  tempos: "Presos às palavras da voz (voz/narracao.json: as 10 primeiras frases com os tempos corrigidos da v1, a 11a nova). tFecho 24,88 s, duração 27,88 s.",
};
c.camera = { ...camT };
c.legenda = { top: 206, altura: 330, tamanho: 68, modo: "light" };
c.ambiente = { deriva: true, flutuacao: true, poeira: 0.5, periodico: true, varredura: { x: r4(xL + 0.11), z: 0.12, largura: 0.05, altura: 0.5, intensidade: 12, yDe: 0.28, yAte: -0.28 } };
c.regioes = "telas/regioes.json";
c.camadas = [];
c.fecho = { asset: "vai-legalizai-dylan", link: { texto: "LINK DA BIO", cor: "#DD4E27" } };
c.capa = { quadro: "auto", titulo: "Contabilidade tradicional vs Legalizaí", destaque: "Legalizaí" };

// ---------- objetos ----------
const ap = c.objetos.find((o) => o.id === "aparelho");
ap.pose = { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 1, vis: 1 };
ap._ajuda = "O iPhone do kit (CC BY: o crédito vai sozinho pra legenda do post, sem marca), no centro da vitrine Legalizaí, 1 cm acima do chão. No quadro 0 ele está fora de quadro (a câmera está no Tradicional).";
c.objetos = c.objetos.filter((o) => o.id !== "guia");
const pal = c.objetos.find((o) => o.id === "palco");
const card = (h, s, rx) => r4(MESA + ((h * s) / 2) * Math.cos(rx) + ((0.0024 * s) / 2) * Math.abs(Math.sin(rx)) + 0.0003);
const k = 0.1 / 1146; // metros por px da tela montada (LARGURA_CARTAO / largura da vaga)
const sNasceu = 0.075 / (1064 * k), sImposto = 0.068 / (648 * k), sContrato = 0.072 / (880 * k);
pal.conteudo = {
  aparelho: "aparelho",
  vitrine: { borda: 0.27, vao: 0.003, yTopo: 0.6, zFundo: -0.07, zFrente: 0.5, raio: 24, yAncora: 0.02, luzFria: { x: xT, raio: 0.11 }, varre: { de: -0.27, ate: -0.02 } },
  sombraContato: { largura: 0.62, profundidade: 0.42, x: 0 },
  camRepouso: { ...camL },
  fileira: { mundo: { x: xL, z: 0.05, passo: 0.023, largura: 0.02, dz: 0.002, noChao: true } },
  pecas: {
    // Tradicional (argila fria, 1,3 vez): cada visita tem a sua natureza-morta, trocada fora de quadro
    pilhaA: { x: -0.17, z: -0.005, ry: 0.12, s: 1.15 },
    carimbo: { x: 0.006, z: 0.004 },
    despP: { x: -0.095, z: 0.08, ry: 0.35, s: 1.1 },
    pastaA: { x: -0.185, z: -0.105, ry: 0.1, s: 1.0 },
    pilhaB: { x: -0.148, z: -0.005, ry: 0.1, s: 1.25 },
    // a lupa deitada em cima da pilha B (aro pra cima, cabo pra câmera, sem afundar no papel)
    lupa: { x: -0.15, y: r4(0.051 * 1.25 + 0.0045 * 0.95 + 0.0003), z: -0.012, rx: -1.5708, ry: 0.35, rz: 0, s: 0.95, opcoes: { pivo: [0, 0, 0] } },
    pastaC: { x: xT, z: -0.02, ry: 0.2, s: 1.3 },
    // Legalizaí: os cartões pousam EM PÉ no chão, na frente do aparelho (sem flutuar e sem encostar nele)
    cartaoNasceu: { rx: -0.2, ry: -0.08, opcoes: { sombraContato: true, pousoMundo: { x: r4(xL - 0.004), y: card(637 * k, sNasceu, 0.2), z: 0.056, largura: 0.075 } } },
    cartaoImposto: { rx: -0.2, ry: -0.06, opcoes: { sombraContato: true, pousoMundo: { x: xL, y: card(486 * k, sImposto, 0.2), z: 0.056, largura: 0.068 } } },
    cartaoContrato: { rx: -0.16, ry: -0.06, opcoes: { sombraContato: true, pousoMundo: { x: xL, y: card(188 * k, sContrato, 0.16), z: 0.058, largura: 0.072 } } },
    moeda: { opcoes: { sombraContato: true, pousoMundo: { x: r4(xL - 0.066), y: r4(MESA + 0.017 * 1.08 + 0.0003), z: 0.064 } } },
    sino: { rx: 0, ry: 0, rz: 0, s: 0.7, opcoes: { sombraContato: true, pousoMundo: { x: r4(xL + 0.068), y: r4(MESA + 0.0265 * 0.7 + 0.0003), z: 0.03 }, noChao: true } },
  },
  _textos: pal.conteudo._textos,
  textos: pal.conteudo.textos,
};

// ---------- batidas ----------
const W = (i, d) => (d ? { palavra: i, desloc: d } : { palavra: i });
const sonsV1 = (id) => {
  const x = v1.batidas.find((y) => y.id === id && y.params && y.params.sons);
  return x ? x.params.sons : undefined;
};
const sonsCartao = v1.batidas.filter((x) => x.id === "cartao-sai-da-tela").map((x) => x.params.sons);
const B = [];
const b = (id, params) => B.push({ id, params });

// T1: "Contabilidade tradicional" (o conjunto da capa: pilha com o carimbo e o despertador)
b("aproxima", { t: 0, para: { z: 0.622 }, dur: 1.85, ease: "power1.inOut", riser: null });
b("vitrine-luz", { t: W(1), dur: 0.5 });
// X1 no "versus": passa pro Legalizaí
b("troca-lado", { t: 1.85, para: { ...camL }, dur: 0.55, borrao: 30 });
// L1: "Legalizaí. O que muda pra você?"
b("gancho-giro-varredura", { t: W(3, -0.12), pose: { desloc: 0.02, para: { ry: -0.07, rx: 0, rz: 0, y: -0.00073 }, dur: 1.3, ease: "lgPousa" }, camera: { desloc: 0.15, para: { z: 0.618 }, dur: 1.85, ease: "power1.inOut" }, varredura: { desloc: 0.12, dur: 0.75, ease: "power2.inOut" } });
b("palco-luz", { t: W(3), para: { halo: 0.55, brilho: 0.16 }, dur: 0.6 });
b("aceno", { alvo: "aparelho", t: W(8), eixo: "rx", amp: 0.04 });
// fora de quadro: a pasta aberta da "ida ao escritório" já está atrás da pilha quando a câmera volta
b("peca-move", { peca: "pastaA", t: 3.0, de: { vis: 1, enc: 1 }, para: {} });
b("peca-move", { peca: "despP", t: 3.0, de: { vis: 0 }, para: {} });
// X2 antes do "Abrir"
b("troca-lado", { t: 4.48, para: { ...camT }, dur: 0.52, borrao: 30 });
// T2: "Abrir empresa era papel e ida ao escritório."
b("carimba", { t: W(12, 0.04), sai: null, sons: sonsV1("carimba") });
// o carimbo sobe, vai pro lado (atrás e à direita da pilha) e desce até o chão: a folha carimbada fica livre
b("peca-move", { peca: "carimbo", t: 6.3, chaves: [{ sobe: 0.03, dur: 0.12, ease: "power2.out" }, { x: 0.07, z: 0.03, dur: 0.18, ease: "power2.inOut" }, { sobe: -0.0512, dur: 0.15, ease: "power2.in" }, { sobe: -0.0506, dur: 0.1, ease: "power2.out" }], sons: [{ som: "sint-s_thump", em: "inicio", desloc: 0.45, ganhoDb: -32, args: [140, 60, 0.18] }] });
b("pasta-leva", { t: W(14, 0.06) });
// X3 no "Agora"
b("troca-lado", { t: 7.5, para: { ...camL }, dur: 0.5, borrao: 30 });
// L2: "Agora, tudo pelo app. O sistema calcula, emite a guia e te avisa. Você só paga."
b("mergulho-abre-app", { t: W(17, 0.1), camera: null, giro: null, troca: { de: "splash", para: "homeDia1", modo: 0, desloc: 0.05, dur: 0.45, ease: "power2.out", fim: 0.46 } });
b("palco-luz", { t: 8.0, para: { halo: 0.65, brilho: 0.07, brilhoNeutro: 1 }, dur: 0.45 });
b("cartao-sai-da-tela", { cartao: "cartaoNasceu", sai: W(18), pousa: W(20, 0.02), telaVazia: "homeDia1Vazio", achata: null, volta: { t: W(21, -0.12), dur: 0.22, ease: "power2.inOut", telaCheia: "homeDia1" }, sons: sonsCartao[0] });
b("empurrar-tela", { t: W(22, 0.07), de: "homeDia1", para: "inicio", zera: {}, camera: null });
b("cartao-sai-da-tela", { cartao: "cartaoImposto", sai: W(22, 0.49), pousa: W(23, 0.36), arco: 0.012, telaVazia: "inicioVazio", achata: null, volta: null, sons: sonsCartao[1] });
b("cartao-contador", { cartao: "cartaoImposto", brilho: { t: W(23, 0.36), dur: 0.25, ease: "power2.out" }, contador: { t: { desloc: 0 }, dur: 0.6, ease: "power3.out" }, varreduras: [{ t: { desloc: 0.04 }, dur: 0.55 }], apaga: { t: { desloc: 1.1 }, dur: 0.4, ease: "power2.inOut" } });
b("toque-cartao", { cartao: "cartaoImposto", palavra: 32, revela: { t: W(24), dur: 0.3, ease: "power2.out", brilho: 0.5 }, camera: { ida: { desloc: -0.1, para: { z: "-=0.02", y: "-=0.004", ty: "-=0.006", x: "+=0.005", tx: "+=0.007" }, dur: 0.18, ease: "power2.out" }, volta: { desloc: 0.1, para: { z: "+=0.02", y: "+=0.004", ty: "+=0.006", x: "-=0.005", tx: "-=0.007" }, dur: 0.16, ease: "power2.inOut" } } });
// o sino cai do alto ao lado do aparelho, quica no chão e balança apoiado no aro ("te avisa")
b("peca-move", { peca: "sino", t: 11.3, de: { vis: 1, y: 0.09, rz: 0 }, chaves: [{ y: 0, dur: 0.36, ease: "bounce.out" }], sons: [{ som: "sint-s_thump", em: "inicio", desloc: 0.13, ganhoDb: -32, args: [140, 60, 0.18] }] });
b("peca-move", { peca: "sino", t: W(29), chaves: [{ rz: 0.16, dur: 0.09, ease: "sine.out" }, { rz: -0.12, dur: 0.15, ease: "sine.inOut" }, { rz: 0.08, dur: 0.13, ease: "sine.inOut" }, { rz: -0.04, dur: 0.12, ease: "sine.inOut" }, { rz: 0, dur: 0.12, ease: "sine.inOut" }], sons: [{ som: "mixkit-766", em: "inicio", desloc: 0, ganhoDb: -30, ancora: "sincronia" }] });
// fora de quadro (câmera no Legalizaí): a natureza-morta da próxima visita ao Tradicional (pilha B com a lupa)
for (const id of ["pilhaA", "carimbo", "despP", "pastaA"]) b("peca-move", { peca: id, t: 9.0, de: { vis: 0 }, para: {} });
for (const id of ["pilhaB", "lupa"]) b("peca-move", { peca: id, t: 9.0, de: { vis: 1, enc: 1 }, para: {} });
// X4 antes do "Fugiu"
b("troca-lado", { t: 12.82, para: { ...camT }, dur: 0.5, borrao: 30 });
// T3: "Fugiu do padrão?": a lupa desliza pela folha de cima
b("peca-move", { peca: "lupa", t: 13.3, para: { x: 0.016, z: 0.01, ry: -0.18 }, dur: 0.75, ease: "sine.inOut" });
// fora de quadro: o Legalizaí vai pras Declarações (sem o cartão e sem o sino)
b("peca-move", { peca: "cartaoImposto", t: 13.45, de: { vis: 0, prende: 1 }, para: {} });
b("peca-move", { peca: "sino", t: 13.45, de: { vis: 0 }, para: {} });
b("empurrar-tela", { t: 13.45, de: "inicioVazio", para: "declaracoes", zera: { verif: 0, toqueBotao: 0, anel: 0, pulso: 0 }, zeraEm: "fim", dur: 0.02, camera: null });
// X5 no "No plano ME"
b("troca-lado", { t: 14.0, para: { ...camL }, dur: 0.5, borrao: 30 });
// L3: "No plano ME, tem gente de verdade. Um contador com registro no CRC."
b("fileira-fora-do-padrao", { sai: { t: 14.5, dur: 0.26, escalona: 0.03, ease: "power2.out" }, salto: { t: W(38, 0.12), indice: 2, dur: 0.34, ease: "power2.out" }, sons: sonsV1("fileira-fora-do-padrao") });
b("moeda-pessoa", { rola: { t: W(40, -0.55), ease: "kitChega" }, pousa: { t: W(40), achata: 0 }, encosta: { t: W(44), para: { x: 0.05, z: 0.012, rz: -2.72 }, dur: 0.3, volta: { dur: 0.42, ease: "kitPousa5" }, placa: { dur: 0.4, ease: "kitPousa5" }, entregue: { desloc: 0.06, dur: 0.24 } }, sons: sonsV1("moeda-pessoa") });
// fora de quadro (câmera no Legalizaí): troca pra pasta C
for (const id of ["pilhaB", "lupa"]) b("peca-move", { peca: id, t: 16.0, de: { vis: 0 }, para: {} });
b("peca-move", { peca: "pastaC", t: 16.0, de: { vis: 1, enc: 1 }, para: {} });
// X6 no "O mesmo cuidado"
b("troca-lado", { t: 19.25, para: { ...camT }, dur: 0.5, borrao: 30 });
// T4: "O mesmo cuidado,": luz fria passa pela pasta do contrato social
b("vitrine-luz", { t: 19.7, dur: 0.55 });
// fora de quadro: o Legalizaí vai pros Documentos, sem placas e sem moeda
for (const id of ["placa1", "placa2", "placa3", "placa4"]) b("peca-move", { peca: id, t: 19.8, de: { vis: 0, prende: 1, salto: 0, entregue: 0 }, para: {} });
b("peca-move", { peca: "moeda", t: 19.8, de: { vis: 0, k: 0, giro: 0, x: 0, z: 0, rz: 0 }, para: {} });
b("empurrar-tela", { t: 19.8, de: "declaracoes", para: "documentos", zera: {}, dur: 0.02, camera: null });
// X7 no "agora"
b("troca-lado", { t: 20.25, para: { ...camL }, dur: 0.5, borrao: 30 });
// L4: "agora no app que tá chegando." e "Segue a gente e clica no link da bio."
b("cartao-sai-da-tela", { cartao: "cartaoContrato", sai: W(54), pousa: W(57, 0.06), telaVazia: "documentosVazio", arco: 0.012, compacta: { de: 0.25, ate: 0.85, ease: "power2.inOut" }, achata: null, volta: { t: W(58, -0.04), dur: 0.24, ease: "power2.inOut", telaCheia: "documentos" }, sons: sonsCartao[2] });
b("aproxima", { t: W(52, 0.3), para: { z: 0.6, y: 0.13, ty: 0.018 }, dur: 1.6, ease: "power2.inOut", riser: { t: W(57, -0.32) } });
b("fecho-simbolo", { appFecha: { t: W(60), de: "documentos", para: "splash", modo: 0, dur: 0.45, ease: "power2.out", fim: 0.47, zera: { verif: 0, toqueBotao: 0, anel: 0 }, zeraEm: "fim" }, pose: { para: { y: 0.008, s: 0.78, ry: -0.03 }, dur: 0.7, ease: "lgPousa" }, encolhe: { t: { fecho: -0.4 }, alvoMundo: null, alvoPx: [410, 818], s: 0.12, dur: 0.4, ease: "power3.in", esconde: 0.4 }, sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });
b("palco-luz", { t: W(60, 0.1), para: { brilho: 0.14, brilhoNeutro: 0 }, dur: 0.45 });
b("palco-luz", { t: W(64), para: { halo: 0.85 }, dur: 0.3, ease: "power2.out" });
// as vitrines viram um painel quente só, fora de quadro, antes de o painel fechar no símbolo
b("palco-luz", { t: 24.2, para: { fusao: 1, aquece: 1 }, dur: 0.02 });
// fora de quadro: a pasta C sai antes de a câmera voltar pro Tradicional (o loop começa com o papel limpo)
b("peca-move", { peca: "pastaC", t: 24.2, de: { vis: 0 }, para: {} });
b("palco-fecha", { t: { fecho: -0.4 }, centro: [410, 818], pecas: [] });
b("link-bio", { t: { fecho: 0.3 }, dur: 0.45, ease: "lgEntra", sai: { t: { fecho: 1.85 }, dur: 0.3, ease: "lgSai" } });
// volta do loop: com o painel fechado (só papel), a câmera vai pro Tradicional, o aparelho volta pra pose do quadro 0
// fora de quadro e as vitrines crescem com o conjunto da capa
b("aproxima", { t: { fim: -0.95 }, para: { ...camT }, dur: 0.02, ease: "none", riser: null });
b("pose-objeto", { alvo: "aparelho", t: { fim: -0.8 }, para: { x: xL, y: -0.00073, z: 0, rx: 0, ry: -0.62, rz: 0, s: 1, vis: 1 }, dur: 0.02, ease: "none" });
b("vitrine-palco", { t: { fim: -0.86 }, cresce: { dur: 0.5, ease: "power3.out", centro: [540, 1180] }, entram: ["pilhaA", "despP"], sobe: { desloc: 0.16, dur: 0.4, escalona: 0.06, ease: "kitPousa5" } });
c.batidas = B;
fs.writeFileSync(V2, JSON.stringify(c, null, 2) + "\n");
console.log("batidas:", B.length, "| sNasceu", sNasceu.toFixed(3), "sImposto", sImposto.toFixed(3), "sContrato", sContrato.toFixed(3));
console.log("y cartões:", pal.conteudo.pecas.cartaoNasceu.opcoes.pousoMundo.y, pal.conteudo.pecas.cartaoImposto.opcoes.pousoMundo.y, pal.conteudo.pecas.cartaoContrato.opcoes.pousoMundo.y);
