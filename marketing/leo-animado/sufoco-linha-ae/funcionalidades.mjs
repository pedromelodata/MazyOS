// As funcionalidades do reel de 09/10, versão 6: cinco cenas, uma por fala nova, depois do "construindo o
// Legalizaí". O celular 3D vai pra um lado e, do outro, entram os assets animados de cada funcionalidade, cada ação
// disparada pela palavra da fala. A linha branca sai do celular e contorna o cartão principal de cada cena.
// Tudo no tempo NOVO do vídeo (o gera.mjs liga SEM_RT antes) e em coordenadas de TELA (1080x1920): a câmera fica
// parada no celular, com o zoom de ~1,48 segurado, enquanto o trecho roda.
// Fatos (FATOS.md): linha 307 (o sistema soma o faturamento, calcula o imposto e emite a guia; a Legalizaí avisa
// prazos pelo app e pelo WhatsApp; no ME o contador entrega as declarações), linha 743 (acompanha a alíquota todo
// mês), F013 (contador com CRC no plano ME), F101/F102 (no ME o contador cuida da folha). Sem número nos assets
// (P36), sem Fator R (P15), sem "a gente paga a guia" (P21).
// v7 (07/10), a pedido do Pedro: o WhatsApp sai da fala e da cena 4 ("não vamos falar ainda que avisaremos no
// WhatsApp"), e a fala 5 diz "pra quem é prestador de serviço" no lugar de "pra quem é microempresa". Atenção ao
// P06: a Legalizaí só atende serviço (F030), então "prestador de serviço" inclui o MEI; ficou como ele pediu e o
// aviso foi pra ele.

import { simbolo, vistoSolto } from "./simbolo.mjs";

export function montaFuncionalidades(ctx) {
  const { emit, g, nv, novaTela, kf, opac, esc, rot, gPos, gEsc, gOp, gRot, gAnc, pulo, C, J, fmt, camada, sombraCartao, sombraLeve, Trac, N, CEL } = ctx;
  const sfx = [];
  const som = (t, nome, args, ganhoDb) => sfx.push({ t: Math.round(t * 1000) / 1000, som: `sint-${nome}`, args, ganhoDb });
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // ---------- tempos ----------
  const limpa = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const W = (fi, palavra) => {
    const alvo = limpa(palavra);
    for (const wi of N.phrases[fi].w) if (limpa(N.words[wi].t) === alvo) return N.words[wi].s;
    throw new Error(`funcionalidades: "${palavra}" não está na fala ${fi + 1}`);
  };
  const P = N.phrases;
  const T_FIM = N.T_INS + N.DELTA;
  const INI = [N.T_INS + 0.05, P[1].s - 0.35, P[2].s - 0.35, P[3].s - 0.35, P[4].s - 0.35];
  const FIM = [INI[1], INI[2], INI[3], INI[4], T_FIM - 0.12];
  const LADO = ["dir", "esq", "dir", "esq", "dir"];            // lado do CELULAR em cada cena
  const CELX = { dir: 762, esq: 318 };
  const ZX = (i) => (LADO[i] === "dir" ? 318 : 762);           // centro da zona dos assets
  const CY = 1185, CEL_MW = 178;                                // centro e meia largura do celular na tela

  // ---------- o celular anda de um lado pro outro (camada CEP, no mundo; zoom da câmera ~1,482) ----------
  const S = 1.482;
  const mundo = (x, y) => [540 + (x - 540) / S, CEL.y + (y - 1160) / S];
  const ESC_LADO = 30;                                          // 50 = tamanho do "construindo" (a sequência é 2x)
  {
    const pk = [[N.T_INS, [CEL.x, CEL.y], "io"]];
    const sk = [[N.T_INS, [50, 50, 100], "io"]];
    INI.forEach((t, i) => {
      const [x, y] = mundo(CELX[LADO[i]], CY);
      const t0 = i === 0 ? t : t - 0.05;
      pk.push([t0, i === 0 ? [CEL.x, CEL.y] : pk[pk.length - 1][1], "io"], [t0 + 0.5, [x, y], "io"]);
      if (i === 0) sk.push([t0, [50, 50, 100], "io"], [t0 + 0.5, [ESC_LADO, ESC_LADO, 100], "io"]);
    });
    // volta pro centro, no tamanho do "construindo", antes da câmera recuar pro perfil
    pk.push([T_FIM - 0.5, pk[pk.length - 1][1], "io"], [T_FIM - 0.02, [CEL.x, CEL.y], "io"]);
    sk.push([T_FIM - 0.5, [ESC_LADO, ESC_LADO, 100], "io"], [T_FIM - 0.02, [50, 50, 100], "io"]);
    // tira as chaves repetidas no mesmo tempo
    const uniq = (ks) => ks.filter((k, i) => i === 0 || k[0] > ks[i - 1][0] + 1e-4);
    kf(`tl(CEP).property("ADBE Position")`, uniq(pk));
    kf(`tl(CEP).property("ADBE Scale")`, uniq(sk));
    INI.forEach((t, i) => som(i === 0 ? t + 0.05 : t, "s_whoosh", [0.45, 300, 5200], -29));
  }

  // ---------- cada cena num nulo: desce e amplia o grupo de assets em volta da zona dele ----------
  let PAI = null;
  let CHEGA = 0;   // quando o celular termina de chegar no lado da cena (a linha só sai dele depois disso)
  const novaCena = (nome, x, y) => {
    const v = nv("L");
    emit(`var ${v} = novaForma(${J(nome)}, ${PAI || "null"}, ${x}, ${y});`);
    return v;
  };
  const abreCena = (i, centroY, alvoY, k) => {
    const v = nv("NC");
    const zx = ZX(i);
    emit(`var ${v} = COMP.layers.addNull(); ${v}.name = "Funcionalidade ${i + 1} (grupo)"; tl(${v}).property("ADBE Anchor Point").setValue([${zx}, ${centroY}]); tl(${v}).property("ADBE Position").setValue([${zx}, ${alvoY}]); tl(${v}).property("ADBE Scale").setValue([${k * 100}, ${k * 100}, 100]);`);
    PAI = v;
    CHEGA = (i === 0 ? INI[i] : INI[i] - 0.05) + 0.5;
    return { T: (x, y) => [zx + k * (x - zx), alvoY + k * (y - centroY)], k };
  };
  const contornoT = (i, TR, cx, cy, w, h, r) => {
    const [x, y] = TR.T(cx, cy);
    return contorno(i, x, y, w * TR.k, h * TR.k, r * TR.k);
  };

  // ---------- peças comuns ----------
  const entra = (L, t, de = 78, dur = 0.42) => {
    emit(`tl(${L}).property("ADBE Opacity").setValue(0);`);
    opac(L, [[t, 0, "o"], [t + 0.12, 100, "io"]]);
    esc(L, pulo(t, dur, de, 100, 0.07));
  };
  const sai = (L, t) => {
    opac(L, [[t, 100, "io"], [t + 0.2, 0, "io"]]);
    esc(L, [[t, 100, "io"], [t + 0.2, 86, "io"]]);
  };
  const cartao = (nome, x, y, w, h, r = 30, cor = C.branco) => {
    const L = novaCena(nome, x, y);
    sombraCartao(L);
    const gg = g(L, "cartão");
    emit(`ret(${gg}, ${w}, ${h}, ${r}, 0, 0); fil(${gg}, "${cor}");`);
    return L;
  };
  const rotulo = (nome, txt, tam, cor, x, y, pai, t0, t1, fonte = "FONTE8", just = "LEFT_JUSTIFY") => {
    emit(`var ${nome} = texto(${J(nome)}, ${J(txt)}, ${fonte}, ${tam}, "${cor}", ParagraphJustification.${just}, -10);`);
    if (pai || PAI) emit(`${nome}.parent = ${pai || PAI};`);
    if (just === "CENTER_JUSTIFY") emit(`centra(${nome}, ${x}, ${y});`);
    else emit(`tl(${nome}).property("ADBE Position").setValue([${x}, ${y}]);`);
    emit(`tl(${nome}).property("ADBE Opacity").setValue(0);`);
    opac(nome, [[t0, 0, "o"], [t0 + 0.15, 100, "io"], [t1, 100, "io"], [t1 + 0.18, 0, "io"]]);
    camada(nome, t0 - 0.02, t1 + 0.22);
    return nome;
  };
  let nRot = 0;
  const rot_ = (...a) => rotulo(`FT${nRot++}`, ...a);
  // o selo da marca: o símbolo do Legalizaí (simbolo.mjs, igual ao identidade/logos/simbolo.svg), quadrado coral com o
  // visto branco que sai pela borda direita. Sobre fundo coral vai o negativo: quadrado branco e visto coral
  const selo = (pai, x, y, tam = 60, negativo = false) => {
    const s = simbolo(tam);
    const gs = g(pai, "símbolo Legalizaí");
    emit(`ret(${gs}, ${tam}, ${tam}, ${s.raio}, 0, 0); fil(${gs}, "${negativo ? C.branco : C.coral}");`);
    const gv = g(gs, "visto");
    emit(`cam(${gv}, ${fmt(s.v)}, ${fmt(s.i)}, ${fmt(s.o)}, true); fil(${gv}, "${negativo ? C.coral : C.branco}");`);
    gPos(gs, x, y);
    return gs;
  };
  // a linha branca: sai da borda do celular e contorna o cartão (no sentido que vem do celular)
  const contorno = (i, cx, cy, w, h, r) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    const celDir = LADO[i] === "dir";
    const px = celDir ? CELX.dir - CEL_MW + 6 : CELX.esq + CEL_MW - 6;
    const py = CY - 120;
    const ex = celDir ? x1 : x0;
    const tr = new Trac(px, py);
    const meio = (px + ex) / 2;
    tr.curva(meio, py, meio, cy, ex, cy);
    if (celDir) {
      tr.reta(x1, y0 + r).arco(x1 - r, y0 + r, r, 0, -90).reta(x0 + r, y0).arco(x0 + r, y0 + r, r, -90, -180)
        .reta(x0, y1 - r).arco(x0 + r, y1 - r, r, 180, 90).reta(x1 - r, y1).arco(x1 - r, y1 - r, r, 90, 0).reta(x1, cy);
    } else {
      tr.reta(x0, y0 + r).arco(x0 + r, y0 + r, r, 180, 270).reta(x1 - r, y0).arco(x1 - r, y0 + r, r, 270, 360)
        .reta(x1, y1 - r).arco(x1 - r, y1 - r, r, 0, 90).reta(x0 + r, y1).arco(x0 + r, y1 - r, r, 90, 180).reta(x0, cy);
    }
    return tr;
  };
  const linha = (nome, tr, t0, t1, tSai) => {
    if (t0 < CHEGA) { t1 += CHEGA - t0; t0 = CHEGA; }
    const L = novaTela(nome, 0, 0);
    const gg = g(L, "linha");
    emit(`cam(${gg}, ${fmt(tr.V)}, ${fmt(tr.I)}, ${fmt(tr.O)}, false); apa(${gg}); trc(${gg}, "${C.branco}", 9);`);
    emit(`sombra(${L}, "#9E2F14", 52, 7, 16);`);
    kf(`trimDe(${gg}).property("ADBE Vector Trim End")`, [[t0, 0, "o"], [t1, 100, "io"]]);
    kf(`trimDe(${gg}).property("ADBE Vector Trim Start")`, [[tSai, 0, "i"], [tSai + 0.28, 100, "io"]]);
    camada(L, t0 - 0.02, tSai + 0.32);
    som(t0, "s_swish", [Math.max(0.2, t1 - t0)], -33);
    return L;
  };
  const gEscXY = (gg, chaves) => kf(`tfg(${gg}).property("ADBE Vector Scale")`, chaves);
  const ondas = (pai, x, y, r, t, lado) => {
    // dois arcos de vibração, que desenham e somem
    [r, r + 34].forEach((rr, k) => {
      const ga = g(pai, `onda ${k + 1}`);
      const a0 = lado > 0 ? -40 : 220, a1 = lado > 0 ? 40 : 140;
      const tr = new Trac(x + rr * Math.cos((a0 * Math.PI) / 180), y + rr * Math.sin((a0 * Math.PI) / 180)).arco(x, y, rr, a0, a1);
      emit(`cam(${ga}, ${fmt(tr.V)}, ${fmt(tr.I)}, ${fmt(tr.O)}, false); apa(${ga}); trc(${ga}, "${C.branco}", 8);`);
      kf(`trimDe(${ga}).property("ADBE Vector Trim End")`, [[t + k * 0.06, 0, "o"], [t + 0.2 + k * 0.06, 100, "io"]]);
      gOp(ga, [[t + 0.25 + k * 0.06, 100, "io"], [t + 0.55 + k * 0.06, 0, "io"]]);
    });
  };

  // ======================= cena 1: o painel fácil de entender =======================
  {
    const i = 0, zx = ZX(i), t0 = INI[i], t1 = FIM[i];
    const TR = abreCena(i, 970, 1140, 1.12);
    const tP = W(0, "painel"), tEnt = W(0, "entender"), tE = W(0, "entrou"), tI = W(0, "imposto"), tM = W(0, "mês");
    // o cartão do painel, com as barras do que entrou
    const A = cartao("Painel: cartão do faturamento", zx, 900, 420, 360);
    entra(A, tP - 0.18);
    sai(A, t1 - 0.25);
    camada(A, tP - 0.2, t1);
    selo(A, -158, -128, 46);
    const base = g(A, "base");
    emit(`ret(${base}, 350, 4, 2, 0, 128); fil(${base}, "${C.cinza2}");`);
    const alt = [70, 104, 88, 138, 120, 176];
    alt.forEach((h, k) => {
      const gb = g(A, `barra ${k + 1}`);
      emit(`ret(${gb}, 38, ${h}, 10, 0, ${-h / 2}); fil(${gb}, "${k === alt.length - 1 ? C.coral6 : C.coral}");`);
      gPos(gb, -150 + k * 60, 126);
      emit(`tfg(${gb}).property("ADBE Vector Scale").setValue([100, 0]);`);
      const tb = tE - 0.12 + k * 0.075;
      gEscXY(gb, [[tb, [100, 0], "o"], [tb + 0.2, [100, 112], "io"], [tb + 0.32, [100, 100], "io"]]);
      som(tb + 0.04, "s_tick", [1800 + k * 160], -34);
    });
    // a tendência que sobe por cima das barras
    const tend = g(A, "tendência");
    const pts = alt.map((h, k) => [-150 + k * 60, 126 - h - 26]);
    emit(`poli(${tend}, ${fmt(pts)}, false); apa(${tend}); trc(${tend}, "${C.ink}", 6);`);
    kf(`trimDe(${tend}).property("ADBE Vector Trim End")`, [[tE + 0.42, 0, "o"], [tE + 0.82, 100, "io"]]);
    const seta = g(A, "seta");
    const [sx, sy] = pts[pts.length - 1];
    emit(`poli(${seta}, ${fmt([[sx - 22, sy + 4], [sx, sy], [sx - 6, sy + 22]])}, false); trc(${seta}, "${C.ink}", 6);`);
    emit(`tfg(${seta}).property("ADBE Vector Group Opacity").setValue(0);`);
    gOp(seta, [[tE + 0.8, 0, "o"], [tE + 0.88, 100, "io"]]);
    linha("Painel: a linha contorna o cartão", contornoT(i, TR, zx, 900, 420, 360, 30), tP - 0.28, tP + 0.32, t1 - 0.32);
    som(tP - 0.18, "s_pop", [700, 300, 0.12, 24], -29);
    rot_("Entrou", 30, C.ink, zx - 122, 900 - 128 + 11, null, tP - 0.1, t1 - 0.3);

    // o cartão do imposto do mês, com a rosca que fecha
    const B = cartao("Painel: cartão do imposto", zx, 1230, 420, 210);
    entra(B, tI - 0.22);
    sai(B, t1 - 0.2);
    camada(B, tI - 0.24, t1);
    const trilho = g(B, "rosca: trilho");
    emit(`eli(${trilho}, 112, 112, -128, 0); trc(${trilho}, "${C.cinza3}", 22);`);
    const arcoR = g(B, "rosca: imposto");
    emit(`eli(${arcoR}, 112, 112, 0, 0); apa(${arcoR}); trc(${arcoR}, "${C.coral}", 22); trimDe(${arcoR}).property("ADBE Vector Trim End").setValue(0);`);
    gPos(arcoR, -128, 0);
    emit(`tfg(${arcoR}).property("ADBE Vector Rotation").setValue(-90);`);
    kf(`trimDe(${arcoR}).property("ADBE Vector Trim End")`, [[tI, 0, "o"], [tM + 0.25, 30, "io"]]);
    const ln = g(B, "linhas");
    emit(`ret(${ln}, 150, 14, 7, 60, 26); ret(${ln}, 110, 14, 7, 40, 56); fil(${ln}, "${C.cinza3}");`);
    rot_("Imposto do mês", 30, C.ink, zx - 46, 1230 - 14, null, tI - 0.16, t1 - 0.25);
    som(tI - 0.22, "s_pop", [760, 300, 0.12, 24], -29);
    som(tI, "s_swish", [0.5], -34);

    // o selo de "fácil de entender"
    const D = cartao("Painel: fácil de entender", zx, 650, 400, 92, 46);
    entra(D, tEnt - 0.08);
    sai(D, t1 - 0.3);
    camada(D, tEnt - 0.1, t1);
    selo(D, -150, 0, 54);
    rot_("Fácil de entender", 28, C.ink, zx - 110, 650 + 10, null, tEnt - 0.02, t1 - 0.35);
    som(tEnt - 0.05, "s_pop", [980, 420, 0.1, 30], -30);
  }

  // ======================= cena 2: o imposto vem calculado e a guia chega pronta =======================
  {
    const i = 1, zx = ZX(i), t0 = INI[i], t1 = FIM[i];
    const TR = abreCena(i, 1063, 1150, 1.05);
    const tImp = W(1, "imposto"), tCalc = W(1, "calculado"), tGuia = W(1, "guia"), tPr = W(1, "pronta");
    // a calculadora
    const A = cartao("Imposto: calculadora", zx, 820, 380, 320);
    entra(A, tImp - 0.2);
    sai(A, t1 - 0.28);
    camada(A, tImp - 0.22, t1);
    const vis = g(A, "visor");
    emit(`ret(${vis}, 320, 82, 18, 0, -100); fil(${vis}, "${C.ink}");`);
    // v9 (pedido do Pedro: "o imposto calculado está faltando números"): no "calculado", o visor conta de R$ 0,00 até
    // R$ 178,31, o valor de exemplo que a tela do app mostra nesta cena (valor fictício, liberado nítido em 01/10)
    const NUM = `FT${nRot++}`;
    emit(`var ${NUM} = texto(${J("Imposto: visor (o valor contando)")}, "R$ 0,00", FONTE, 38, "${C.branco}", ParagraphJustification.LEFT_JUSTIFY, 0);`);
    emit(`${NUM}.parent = ${A}; tl(${NUM}).property("ADBE Position").setValue([-138, -86]);`);
    emit(`${NUM}.property("ADBE Text Properties").property("ADBE Text Document").expression = "var a = " + RT(${r3(tCalc - 0.05)}) + ", b = " + RT(${r3(tCalc + 0.55)}) + "; var p = Math.min(1, Math.max(0, (time - a) / (b - a))); p = 1 - Math.pow(1 - p, 3); var v = Math.round(17831 * p); var c = v % 100; 'R$ ' + Math.floor(v / 100) + ',' + (c < 10 ? '0' : '') + c;";`);
    emit(`tl(${NUM}).property("ADBE Opacity").setValue(0);`);
    opac(NUM, [[tImp - 0.2, 0, "o"], [tImp - 0.08, 100, "io"], [t1 - 0.28, 100, "io"], [t1 - 0.08, 0, "io"]]);
    camada(NUM, tImp - 0.22, t1);
    // o visto do visor: o da marca, solto (sem o quadrado), desenhando quando a conta fecha
    const vs = vistoSolto(46, 124, -100);
    const vv = g(A, "visor: visto");
    emit(`poli(${vv}, ${fmt(vs.pts)}, false); apa(${vv}); trc(${vv}, "${C.branco}", ${vs.esp}); trimDe(${vv}).property("ADBE Vector Trim End").setValue(0);`);
    kf(`trimDe(${vv}).property("ADBE Vector Trim End")`, [[tCalc + 0.58, 0, "o"], [tCalc + 0.72, 100, "io"]]);
    const teclas = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) teclas.push([-123 + c * 82, 0 + r * 62, r === 2 && c === 3]);
    // os números das teclas (sem o sinal de menos: nada de barrinha que pareça travessão)
    const ROT_TECLAS = ["7", "8", "9", "+", "4", "5", "6", "×", "1", "2", "3", "="];
    teclas.forEach(([x, y, igual], k) => {
      rot_(ROT_TECLAS[k], 28, igual ? C.branco : C.ink, x, y + 6, A, tImp - 0.18, t1 - 0.3, "FONTE", "CENTER_JUSTIFY");
    });
    teclas.forEach(([x, y, igual], k) => {
      const gt = g(A, `tecla ${k + 1}`);
      emit(`ret(${gt}, 66, 48, 14, ${x}, ${y + 6}); fil(${gt}, "${igual ? C.coral : C.cinza4}");`);
      if (!igual) {
        const gl = g(A, `tecla ${k + 1}: acende`);
        emit(`ret(${gl}, 66, 48, 14, ${x}, ${y + 6}); fil(${gl}, "${C.coral1}"); tfg(${gl}).property("ADBE Vector Group Opacity").setValue(0);`);
        const ordem = [5, 2, 9, 0, 7, 4, 10, 1, 6, 3, 8][k % 11];
        if (ordem < 6) {
          const tk = tCalc - 0.12 + ordem * 0.075;
          gOp(gl, [[tk, 0, "o"], [tk + 0.04, 100, "io"], [tk + 0.16, 0, "io"]]);
          som(tk, "s_tick", [2400 + ordem * 90], -36);
        }
      }
    });
    linha("Imposto: a linha contorna a calculadora", contornoT(i, TR, zx, 820, 380, 320, 30), tImp - 0.3, tImp + 0.3, t1 - 0.32);
    som(tImp - 0.2, "s_pop", [700, 300, 0.12, 24], -29);
    som(tCalc + 0.6, "s_chime", [1567.98, 0.5], -33);
    // a guia, que sai de trás e assenta, com o código de barras desenhando
    const G = novaCena("Imposto: a guia", zx, 1250);
    sombraCartao(G);
    const papel = g(G, "papel");
    emit(`ret(${papel}, 340, 420, 20, 0, 0); fil(${papel}, "${C.branco}");`);
    const topo = g(G, "topo");
    emit(`ret(${topo}, 340, 74, 20, 0, -173); ret(${topo}, 340, 30, 0, 0, -151); fil(${topo}, "${C.coral}");`);
    selo(G, -128, -173, 40, true);   // no topo coral da guia, o símbolo em negativo
    const lin = g(G, "linhas");
    emit(`ret(${lin}, 250, 16, 8, -20, -86); ret(${lin}, 200, 16, 8, -45, -50); ret(${lin}, 230, 16, 8, -30, -14); fil(${lin}, "${C.cinza3}");`);
    const bw = [6, 3, 9, 3, 4, 8, 3, 6, 3, 10, 4, 3, 7, 3, 5, 9, 3, 4, 8, 3, 6, 3];
    let bx = -128;
    bw.forEach((w, k) => {
      const gb = g(G, `barra ${k + 1}`);
      emit(`ret(${gb}, ${w}, 92, 0, ${bx + w / 2}, 110); fil(${gb}, "${C.ink}"); tfg(${gb}).property("ADBE Vector Group Opacity").setValue(0);`);
      const tb = tGuia + 0.28 + k * 0.016;
      gOp(gb, [[tb, 0, "lin"], [tb + 0.02, 100, "hold"]]);
      bx += w + 6;
    });
    emit(`tl(${G}).property("ADBE Opacity").setValue(0); tl(${G}).property("ADBE Position").dimensionsSeparated = true;`);
    opac(G, [[tGuia - 0.12, 0, "o"], [tGuia + 0.02, 100, "io"], [t1 - 0.22, 100, "io"], [t1 - 0.02, 0, "io"]]);
    kf(`tl(${G}).property("ADBE Position_1")`, [[tGuia - 0.12, 1250 + 230, "o"], [tGuia + 0.3, 1250 - 14, "io"], [tGuia + 0.44, 1250, "io"]]);
    rot(G, [[tGuia - 0.12, -9, "o"], [tGuia + 0.44, 0, "io"]]);
    camada(G, tGuia - 0.14, t1);
    rot_("Guia do mês", 26, C.branco, zx - 92, 1250 - 173 + 9, null, tGuia + 0.05, t1 - 0.25);
    som(tGuia - 0.1, "s_whoosh", [0.4, 500, 7000], -30);
    // o carimbo de pronta: o símbolo da marca, que cai na guia
    const K = novaCena("Imposto: carimbo de pronta", zx + 118, 1250 + 150);
    const kr = g(K, "anel");
    emit(`ret(${kr}, 120, 120, ${simbolo(120).raio}, 0, 0); trc(${kr}, "${C.coral}", 6);`);
    selo(K, 0, 0, 120);
    gEsc(kr, [[tPr, 100, "o"], [tPr + 0.45, 175, "io"]]);
    gOp(kr, [[tPr, 90, "o"], [tPr + 0.45, 0, "io"]]);
    emit(`tl(${K}).property("ADBE Opacity").setValue(0);`);
    opac(K, [[tPr - 0.06, 0, "o"], [tPr + 0.02, 100, "io"], [t1 - 0.22, 100, "io"], [t1 - 0.02, 0, "io"]]);
    esc(K, [[tPr - 0.06, 190, "i"], [tPr + 0.08, 92, "io"], [tPr + 0.2, 100, "io"]]);
    rot(K, [[tPr - 0.06, -24, "o"], [tPr + 0.2, -10, "io"]]);
    camada(K, tPr - 0.08, t1);
    som(tPr, "s_thump", [120, 55, 0.25], -25);
    som(tPr + 0.02, "s_pop", [900, 420, 0.1, 34], -29);
  }

  // ======================= cena 3: a alíquota acompanhada todo mês =======================
  {
    const i = 2, zx = ZX(i), t0 = INI[i], t1 = FIM[i];
    const TR = abreCena(i, 1040, 1150, 1.15);
    const tAl = W(2, "alíquota"), tAc = W(2, "acompanhada"), tTodo = W(2, "todo"), tMes = W(2, "mês");
    const A = cartao("Alíquota: medidor", zx, 860, 420, 330);
    entra(A, Math.min(tAl - 0.2, P[2].s));
    sai(A, t1 - 0.25);
    camada(A, tAl - 0.22, t1);
    const cx = 0, cy = 70, R = 128;
    const trilho = g(A, "medidor: trilho");
    const tt = new Trac(cx - R, cy).arco(cx, cy, R, 180, 360);
    emit(`cam(${trilho}, ${fmt(tt.V)}, ${fmt(tt.I)}, ${fmt(tt.O)}, false); trc(${trilho}, "${C.cinza3}", 26);`);
    const faixa = g(A, "medidor: faixa");
    emit(`cam(${faixa}, ${fmt(tt.V)}, ${fmt(tt.I)}, ${fmt(tt.O)}, false); apa(${faixa}); trc(${faixa}, "${C.coral}", 26); trimDe(${faixa}).property("ADBE Vector Trim End").setValue(0);`);
    // o ponteiro: gira em volta do centro; ângulo 0 = pra cima
    const ang = [[tAl - 0.1, -82, "o"], [tAc - 0.05, -82, "o"], [tAc + 0.32, 26, "io"], [tAc + 0.5, 8, "io"]];
    const flips = [tTodo - 0.04, tTodo + 0.2, tMes + 0.1];
    flips.forEach((tf, k) => ang.push([tf, 10 + (k % 2 ? -6 : 7), "io"], [tf + 0.14, 10 + (k % 2 ? 3 : -2), "io"]));
    ang.sort((a, b) => a[0] - b[0]);
    for (let k = ang.length - 1; k > 0; k--) if (ang[k][0] <= ang[k - 1][0] + 0.03) ang.splice(k, 1);
    const pt = g(A, "medidor: ponteiro");
    emit(`poli(${pt}, [[-9,0],[0,${-R + 22}],[9,0]], true); fil(${pt}, "${C.ink}");`);
    gPos(pt, cx, cy);
    gRot(pt, ang);
    kf(`trimDe(${faixa}).property("ADBE Vector Trim End")`, ang.map(([t, a, e]) => [t, Math.max(0, Math.min(100, ((a + 90) / 180) * 100)), e]));
    const cubo = g(A, "medidor: centro");
    emit(`eli(${cubo}, 34, 34, ${cx}, ${cy}); fil(${cubo}, "${C.ink}");`);
    const marcas = g(A, "medidor: marcas");
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      emit(`ret(${marcas}, 6, 18, 3, ${cx + (R + 34) * Math.cos(a)}, ${cy + (R + 34) * Math.sin(a)});`);
    }
    emit(`fil(${marcas}, "${C.cinza2}");`);
    linha("Alíquota: a linha contorna o medidor", contornoT(i, TR, zx, 860, 420, 330, 30), tAl - 0.3, tAl + 0.28, t1 - 0.3);
    som(tAl - 0.2, "s_pop", [700, 300, 0.12, 24], -29);
    som(tAc, "s_swish", [0.35], -31);
    rot_("Alíquota", 30, C.ink, zx, 860 + 128, null, tAl - 0.1, t1 - 0.3, "FONTE8", "CENTER_JUSTIFY");
    // a lupa que acompanha o ponteiro
    const LU = novaCena("Alíquota: lupa", zx, 860);
    sombraLeve(LU);
    const lv = g(LU, "lupa: vidro");
    emit(`eli(${lv}, 92, 92, 0, 0); fil(${lv}, "${C.branco}", 35);`);
    const la = g(LU, "lupa: aro");
    emit(`eli(${la}, 92, 92, 0, 0); trc(${la}, "${C.ink}", 11);`);
    const lc = g(LU, "lupa: cabo");
    emit(`ret(${lc}, 18, 64, 9, 0, 0); fil(${lc}, "${C.ink}"); tfg(${lc}).property("ADBE Vector Rotation").setValue(-45); tfg(${lc}).property("ADBE Vector Position").setValue([48, 48]);`);
    emit(`tl(${LU}).property("ADBE Opacity").setValue(0); tl(${LU}).property("ADBE Position").dimensionsSeparated = true;`);
    opac(LU, [[tAc - 0.05, 0, "o"], [tAc + 0.1, 100, "io"], [t1 - 0.25, 100, "io"], [t1 - 0.05, 0, "io"]]);
    kf(`tl(${LU}).property("ADBE Position_0")`, [[tAc - 0.05, zx - 150, "o"], [tAc + 0.45, zx + 70, "io"], [tMes + 0.2, zx + 40, "io"]]);
    kf(`tl(${LU}).property("ADBE Position_1")`, [[tAc - 0.05, 860 + 80, "o"], [tAc + 0.45, 860 - 40, "io"], [tMes + 0.2, 860 - 30, "io"]]);
    camada(LU, tAc - 0.07, t1);
    // o calendário que vira o mês
    const CA = cartao("Alíquota: calendário", zx, 1250, 280, 270, 26);
    entra(CA, tAc - 0.05);
    sai(CA, t1 - 0.22);
    camada(CA, tAc - 0.07, t1);
    const argolas = g(CA, "argolas");
    emit(`ret(${argolas}, 12, 34, 6, -62, -138); ret(${argolas}, 12, 34, 6, 62, -138); fil(${argolas}, "${C.ink}");`);
    const dias = g(CA, "dias");
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) emit(`ret(${dias}, 30, 26, 7, ${-92 + c * 46}, ${-6 + r * 40});`);
    emit(`fil(${dias}, "${C.cinza4}");`);
    const MESES = ["JAN", "FEV", "MAR", "ABR"];
    // a folha de cima (com o cabeçalho) dobra pra cima a cada virada; o mês muda junto
    const cabF = g(CA, "cabeçalho de baixo");
    emit(`ret(${cabF}, 280, 70, 26, 0, -100); ret(${cabF}, 280, 30, 0, 0, -80); fil(${cabF}, "${C.coral}");`);
    [...flips.keys()].reverse().forEach((k) => {
      const tf = flips[k];
      const gf = g(CA, `folha ${k + 1}`);
      emit(`ret(${gf}, 280, 200, 26, 0, 35); fil(${gf}, "${C.branco}"); ret(${gf}, 280, 70, 26, 0, -100); ret(${gf}, 280, 30, 0, 0, -80); fil(${gf}, "${C.coral}");`);
      const gd = g(gf, "dias");
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) emit(`ret(${gd}, 30, 26, 7, ${-92 + c * 46}, ${-6 + r * 40});`);
      emit(`fil(${gd}, "${C.cinza4}");`);
      emit(`tfg(${gf}).property("ADBE Vector Anchor").setValue([0, -135]); tfg(${gf}).property("ADBE Vector Position").setValue([0, -135]);`);
      gEscXY(gf, [[tf, [100, 100], "i"], [tf + 0.14, [100, 0], "o"]]);
      gOp(gf, [[tf + 0.13, 100, "hold"], [tf + 0.14, 0, "hold"]]);
      som(tf, "s_swish", [0.16], -32);
    });
    MESES.forEach((m, k) => {
      const ta = k === 0 ? tAc : flips[k - 1] + 0.07;
      const tb = k < flips.length ? flips[k] + 0.07 : t1 - 0.22;
      rot_(`${m}`, 34, C.branco, zx, 1250 - 100 + 2, null, ta, tb - 0.15, "FONTE8", "CENTER_JUSTIFY");
    });
  }

  // ======================= cena 4: a gente avisa cada prazo no app =======================
  // (v7: sem o WhatsApp, a pedido do Pedro; o grupo fica com o sino, o prazo e a notificação do app, centrado de novo)
  {
    const i = 3, zx = ZX(i), t0 = INI[i], t1 = FIM[i];
    const TR = abreCena(i, 965, 1150, 1.15);
    const tAv = W(3, "avisa"), tPz = W(3, "prazo"), tApp = W(3, "app");
    // o sino
    const SI = novaCena("Avisos: sino", zx, 760);
    sombraLeve(SI);
    const fundo = g(SI, "fundo");
    emit(`eli(${fundo}, 210, 210, 0, 0); fil(${fundo}, "${C.branco}");`);
    const sino = g(SI, "sino");
    emit(`poli(${sino}, [[-56,34],[-46,-8],[-40,-34],[-22,-52],[0,-58],[22,-52],[40,-34],[46,-8],[56,34]], true); fil(${sino}, "${C.ink}"); ret(${sino}, 132, 16, 8, 0, 40); fil(${sino}, "${C.ink}");`);
    const bad = g(SI, "badalo");
    emit(`eli(${bad}, 30, 30, 0, 62); fil(${bad}, "${C.ink}");`);
    const pin = g(SI, "ponto");
    emit(`eli(${pin}, 40, 40, 52, -54); fil(${pin}, "${C.coral}");`);
    emit(`tfg(${pin}).property("ADBE Vector Scale").setValue([0, 0]);`);
    gEsc(pin, pulo(tAv + 0.1, 0.32, 0, 100, 0.3));
    [sino, bad].forEach((gg) => {
      gAnc(gg, 0, -58); gPos(gg, 0, -58);
      gRot(gg, [[tAv - 0.02, 0, "o"], [tAv + 0.08, -18, "io"], [tAv + 0.18, 15, "io"], [tAv + 0.28, -10, "io"], [tAv + 0.38, 7, "io"], [tAv + 0.5, -3, "io"], [tAv + 0.62, 0, "io"]]);
    });
    ondas(SI, 0, -10, 124, tAv + 0.04, 1);
    ondas(SI, 0, -10, 124, tAv + 0.04, -1);
    entra(SI, tAv - 0.3);
    sai(SI, t1 - 0.28);
    camada(SI, tAv - 0.32, t1);
    som(tAv, "s_chime", [2093, 0.7], -31);
    som(tAv + 0.16, "s_chime", [1567.98, 0.6], -34);
    // o prazo: um dia do calendário que a linha circula
    const PZ = cartao("Avisos: o prazo", zx, 1015, 300, 150, 26);
    entra(PZ, tPz - 0.2);
    sai(PZ, t1 - 0.26);
    camada(PZ, tPz - 0.22, t1);
    const dd = g(PZ, "dias");
    for (let c = 0; c < 5; c++) emit(`ret(${dd}, 40, 40, 10, ${-104 + c * 52}, 10);`);
    emit(`fil(${dd}, "${C.cinza4}");`);
    const hoje = g(PZ, "o dia");
    emit(`ret(${hoje}, 40, 40, 10, 52, 10); fil(${hoje}, "${C.coral}");`);
    const circ = g(PZ, "círculo do prazo");
    emit(`eli(${circ}, 74, 74, 52, 10); apa(${circ}); trc(${circ}, "${C.coral6}", 6); trimDe(${circ}).property("ADBE Vector Trim End").setValue(0);`);
    kf(`trimDe(${circ}).property("ADBE Vector Trim End")`, [[tPz - 0.02, 0, "o"], [tPz + 0.3, 100, "io"]]);
    const fx = g(PZ, "cabeçalho");
    emit(`ret(${fx}, 120, 14, 7, -70, -46); fil(${fx}, "${C.cinza3}");`);
    linha("Avisos: a linha contorna o prazo", contornoT(i, TR, zx, 1015, 300, 150, 26), tPz - 0.32, tPz + 0.2, t1 - 0.3);
    som(tPz, "s_swish", [0.3], -33);
    // a notificação do app, que entra deslizando no "app"
    const notif = (nome, y, t) => {
      const L = novaCena(nome, zx, y);
      sombraCartao(L);
      const c = g(L, "cartão");
      emit(`ret(${c}, 420, 124, 28, 0, 0); fil(${c}, "${C.branco}");`);
      selo(L, -150, 0, 66);
      const ls = g(L, "texto");
      emit(`ret(${ls}, 210, 14, 7, 10, 24); fil(${ls}, "${C.cinza3}");`);
      emit(`tl(${L}).property("ADBE Opacity").setValue(0); tl(${L}).property("ADBE Position").dimensionsSeparated = true;`);
      opac(L, [[t - 0.16, 0, "o"], [t, 100, "io"], [t1 - 0.24, 100, "io"], [t1 - 0.04, 0, "io"]]);
      kf(`tl(${L}).property("ADBE Position_0")`, [[t - 0.16, zx + 360, "o"], [t + 0.18, zx - 12, "io"], [t + 0.3, zx, "io"]]);
      camada(L, t - 0.18, t1);
      som(t - 0.06, "s_pop", [820, 360, 0.11, 28], -29);
      return L;
    };
    // o nome vai preso ao cartão (desliza junto) e com mais respiro depois do símbolo
    const NL = notif("Avisos: no app", 1200, tApp - 0.05);
    rot_("Legalizaí", 28, C.ink, -86, -8, NL, tApp - 0.02, t1 - 0.28);
  }

  // ======================= cena 5: um contador de verdade cuida da folha e das declarações =======================
  {
    const i = 4, zx = ZX(i), t0 = INI[i], t1 = FIM[i];
    const TR = abreCena(i, 1078, 1110, 1.0);
    // v7: "pra quem é prestador de serviço" no lugar de "pra quem é microempresa", a pedido do Pedro
    const tMi = W(4, "prestador"), tCo = W(4, "contador"), tVe = W(4, "verdade"), tFo = W(4, "folha"), tDe = W(4, "declarações");
    // a pílula do prestador de serviço (o texto mede 322 px na Sora 800 de 30 px)
    const PI = cartao("Contador: prestador de serviço", zx, 640, 430, 78, 39, C.ink);
    entra(PI, Math.min(tMi - 0.1, P[4].s + 0.15));
    sai(PI, t1 - 0.3);
    camada(PI, tMi - 0.12, t1);
    rot_("Prestador de serviço", 30, C.branco, zx, 640 + 1, null, Math.min(tMi - 0.04, P[4].s + 0.21), t1 - 0.34, "FONTE8", "CENTER_JUSTIFY");
    som(tMi - 0.08, "s_pop", [640, 300, 0.12, 24], -29);
    // o contador
    const AV = novaCena("Contador: o contador", zx, 880);
    sombraCartao(AV);
    const disco = g(AV, "disco");
    emit(`eli(${disco}, 232, 232, 0, 0); fil(${disco}, "${C.branco}");`);
    const corpo = g(AV, "corpo");
    emit(`ret(${corpo}, 124, 76, 38, 0, 56); fil(${corpo}, "${C.ink}");`);
    const gola = g(AV, "gola");
    emit(`poli(${gola}, [[-22,18],[0,52],[22,18]], true); fil(${gola}, "${C.branco}");`);
    const grav = g(AV, "gravata");
    emit(`poli(${grav}, [[-8,26],[8,26],[12,64],[0,78],[-12,64]], true); fil(${grav}, "${C.coral}");`);
    const cab = g(AV, "cabeça");
    emit(`eli(${cab}, 74, 74, 0, -28); fil(${cab}, "${C.ink}");`);
    const anel = g(AV, "anel");
    emit(`eli(${anel}, 232, 232, 0, 0); trc(${anel}, "${C.branco}", 6);`);
    gEsc(anel, [[tCo, 100, "o"], [tCo + 0.55, 150, "io"]]);
    gOp(anel, [[tCo, 90, "o"], [tCo + 0.55, 0, "io"]]);
    // v9: saiu o selo no canto do avatar (o Pedro: "tire esse meio check que tá no ícone de pessoa"); no "de verdade"
    // o avatar dá um pulso
    entra(AV, tCo - 0.16, 70, 0.48);
    esc(AV, [[tVe - 0.02, 100, "o"], [tVe + 0.1, 107, "io"], [tVe + 0.3, 100, "io"]]);
    sai(AV, t1 - 0.28);
    camada(AV, tCo - 0.18, t1);
    linha("Contador: a linha chega no contador", contornoT(i, TR, zx, 880, 232, 232, 116), tCo - 0.3, tCo + 0.3, t1 - 0.32);
    som(tCo - 0.12, "s_pop", [620, 280, 0.14, 24], -28);
    som(tVe, "s_chime", [1318.51, 0.6], -32);
    // a folha: três holerites que abrem em leque
    const folhas = [];
    [[-120, 1160, -11], [0, 1150, 0], [120, 1160, 11]].forEach(([dx, y, a], k) => {
      const F = novaCena(`Contador: folha ${k + 1}`, zx + dx * 0.2, y);
      folhas.push({ F, tk: tFo - 0.12 + k * 0.07 });
      sombraLeve(F);
      const fp = g(F, "papel");
      emit(`ret(${fp}, 156, 200, 16, 0, 0); fil(${fp}, "${C.branco}");`);
      const ft = g(F, "faixa");
      emit(`ret(${ft}, 156, 40, 16, 0, -80); ret(${ft}, 156, 20, 0, 0, -70); fil(${ft}, "${C.coral1}");`);
      const fl = g(F, "linhas");
      emit(`ret(${fl}, 110, 12, 6, -6, -22); ret(${fl}, 90, 12, 6, -16, 6); ret(${fl}, 110, 12, 6, -6, 34); ret(${fl}, 60, 12, 6, 30, 70); fil(${fl}, "${C.cinza3}");`);
      const tk = tFo - 0.12 + k * 0.07;
      emit(`tl(${F}).property("ADBE Opacity").setValue(0); tl(${F}).property("ADBE Position").dimensionsSeparated = true;`);
      opac(F, [[tk, 0, "o"], [tk + 0.1, 100, "io"], [t1 - 0.26, 100, "io"], [t1 - 0.06, 0, "io"]]);
      kf(`tl(${F}).property("ADBE Position_0")`, [[tk, zx, "o"], [tk + 0.36, zx + dx, "io"]]);
      kf(`tl(${F}).property("ADBE Position_1")`, [[tk, 1000, "o"], [tk + 0.36, y, "io"]]);
      rot(F, [[tk, 0, "o"], [tk + 0.36, a, "io"]]);
      camada(F, tk - 0.02, t1);
      som(tk, "s_swish", [0.22], -33);
    });
    // v9: "Folha" na faixa do holerite do meio, presa a ele (antes flutuava fora do lugar quando as folhas abriam)
    rot_("Folha", 26, C.coral6, 0, -80, folhas[1].F, folhas[1].tk + 0.06, t1 - 0.3, "FONTE8", "CENTER_JUSTIFY");
    // as declarações: dois formulários que recebem o visto. v9: afastados (antes um cobria o visto do outro), a
    // assinatura à esquerda e o símbolo inteiro no canto de baixo de cada um
    [[-96, 1430], [96, 1440]].forEach(([dx, y], k) => {
      const D = novaCena(`Contador: declaração ${k + 1}`, zx + dx, y);
      sombraLeve(D);
      const dp = g(D, "papel");
      emit(`ret(${dp}, 168, 210, 16, 0, 0); fil(${dp}, "${C.branco}");`);
      const dl = g(D, "linhas");
      emit(`ret(${dl}, 120, 16, 8, 0, -72); fil(${dl}, "${C.ink}"); ret(${dl}, 120, 12, 6, 0, -36); ret(${dl}, 120, 12, 6, 0, -10); ret(${dl}, 80, 12, 6, -20, 16); fil(${dl}, "${C.cinza3}");`);
      const ass = g(D, "assinatura");
      emit(`poli(${ass}, [[-62,62],[-46,48],[-32,64],[-17,50],[-4,60],[10,56]], false); apa(${ass}); trc(${ass}, "${C.ink}", 4); trimDe(${ass}).property("ADBE Vector Trim End").setValue(0);`);
      const tk = tDe - 0.1 + k * 0.12;
      kf(`trimDe(${ass}).property("ADBE Vector Trim End")`, [[tk + 0.12, 0, "o"], [tk + 0.4, 100, "io"]]);
      // o símbolo fica dentro do papel inteiro, inclusive no pico do pulo (com 30% de passagem, ele saía da borda)
      const sd = selo(D, 44, 68, 44);
      emit(`tfg(${sd}).property("ADBE Vector Scale").setValue([0, 0]);`);
      gEsc(sd, pulo(tk + 0.36, 0.3, 0, 100, 0.12));
      emit(`tl(${D}).property("ADBE Opacity").setValue(0); tl(${D}).property("ADBE Position").dimensionsSeparated = true;`);
      opac(D, [[tk, 0, "o"], [tk + 0.1, 100, "io"], [t1 - 0.24, 100, "io"], [t1 - 0.04, 0, "io"]]);
      kf(`tl(${D}).property("ADBE Position_1")`, [[tk, y + 160, "o"], [tk + 0.32, y - 10, "io"], [tk + 0.42, y, "io"]]);
      camada(D, tk - 0.02, t1);
      som(tk, "s_whoosh", [0.3, 600, 7000], -32);
      som(tk + 0.38, "s_pop", [880 + k * 140, 400, 0.1, 32], -29);
    });
  }

  PAI = null;
  // agenda pro 3D: trocas de tela e o lado do celular em cada cena (o 3D vira pro lado dos assets)
  const celular = INI.map((t, i) => ({ troca: Math.round((t + 0.12) * 1000) / 1000, lado: LADO[i], ini: t, fim: FIM[i] }));
  return { sfx, celular, INI, FIM, T_FIM };
}
