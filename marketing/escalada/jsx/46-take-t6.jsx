// 46-take-t6.jsx — T6 "A VIRADA: Belo Horizonte" v2 (idempotente)
// Ajustes Pedro 17/08: MAPA REAL de MG+SP (GeoJSON simplificado, 46-mapa-dados.jsx)
// em BRANCO destacado do coral; barras em ESCADA ASCENDENTE (BH 3ª -> RJ -> SP);
// 9.29 "Se funcionar": estrelinha coral ORBITANDO São Paulo;
// 12.47 "funciona em qualquer lugar": estrela maior coral QUICANDO em BH
// (bounce explicitamente pedido pelo diretor).
// Requer: $.global.MAPA_MG/MAPA_SP/MAPA_BH/MAPA_SPC (rodar 46-mapa-dados.jsx antes).

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];
    var BRANCO = [1, 1, 1];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];

    var proj = app.project;
    function findComp(n) {
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it.name === n) return it;
        }
        return null;
    }
    function easeK(prop, ki) {
        var dims = 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) dims = 2;
        else if (t === PropertyValueType.ThreeD) dims = 3;
        var arr = [];
        for (var d = 0; d < dims; d++) arr.push(new KeyframeEase(0, 66));
        prop.setTemporalEaseAtKey(ki, arr, arr);
    }
    function texto(comp, str, fonte, tam, cor, x, y, tracking, just) {
        var ly = comp.layers.addText(str);
        var tdoc = ly.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tdoc.value;
        td.resetCharStyle();
        td.font = fonte;
        td.fontSize = tam;
        td.fillColor = cor;
        td.applyStroke = false;
        td.tracking = tracking || 0;
        td.justification = just || ParagraphJustification.CENTER_JUSTIFY;
        tdoc.setValue(td);
        ly.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        return ly;
    }
    function fadeIn(ly, t0, dfr) {
        var op = ly.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(t0, 0);
        op.setValueAtTime(t0 + (dfr || 6) / FPS, 100);
    }
    function popIn(ly, t0, escFinal) {
        var e = escFinal || 100;
        var sc = ly.property("ADBE Transform Group").property("ADBE Scale");
        sc.setValueAtTime(t0, [e * 1.2, e * 1.2]);
        sc.setValueAtTime(t0 + 5 / FPS, [e, e]);
        easeK(sc, 2);
        fadeIn(ly, t0, 3);
    }

    var MG = $.global.MAPA_MG, SPP = $.global.MAPA_SP;
    var BH0 = $.global.MAPA_BH, SPC0 = $.global.MAPA_SPC;
    if (!MG || !SPP) { $.global.ESCALADA_RESULT = { erro: "rodar 46-mapa-dados.jsx antes" }; return; }

    // encolhe o mapa 90% em torno do centro (libera faixa da legenda no topo)
    var ACX = 1250, ACY = 1120, ME = 0.9;
    function W(pt) { return [(pt[0] - ACX) * ME + ACX, (pt[1] - ACY) * ME + ACY]; }
    var BH = W(BH0), SPC = W(SPC0);

    var t6 = findComp("T6");
    if (!t6) { $.global.ESCALADA_RESULT = { erro: "T6 não existe" }; return; }
    var dur = t6.duration; // 15.6667
    t6.time = 0; // parent-preserve usa o playhead

    for (var L = t6.numLayers; L >= 1; L--) {
        if (t6.layer(L).name.indexOf("T6V-") === 0) t6.layer(L).remove();
    }

    // ---- base papel + inundação coral ----
    var fundoPapel = t6.layers.addSolid(PAPEL, "T6V-fundo-papel", 3840, 2160, 1, dur);
    var flood = t6.layers.addSolid(CORAL600, "T6V-coral-flood", 3840, 2160, 1, dur);
    var fmk = flood.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var fs = new Shape();
    var R0 = 60, k = 0.5523;
    fs.vertices = [[1920, 2300 - R0], [1920 + R0, 2300], [1920, 2300 + R0], [1920 - R0, 2300]];
    fs.inTangents = [[-R0 * k, 0], [0, -R0 * k], [R0 * k, 0], [0, R0 * k]];
    fs.outTangents = [[R0 * k, 0], [0, R0 * k], [-R0 * k, 0], [0, -R0 * k]];
    fs.closed = true;
    fmk.property("ADBE Mask Shape").setValue(fs);
    fmk.property("ADBE Mask Feather").setValue([40, 40]);
    var mexp = fmk.property("ADBE Mask Offset");
    mexp.setValueAtTime(0.15, 0);
    mexp.setValueAtTime(0.75, 4400);
    easeK(mexp, 2);

    // ---- MAPA REAL: MG + SP em branco ----
    var mapa = t6.layers.addShape();
    mapa.name = "T6V-mapa-mgsp";
    function poeEstado(nomeGrp, pts) {
        var g = mapa.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.name = nomeGrp;
        var gc = g.property("ADBE Vectors Group");
        var pth = gc.addProperty("ADBE Vector Shape - Group");
        var sh = new Shape();
        var vs = [];
        for (var i = 0; i < pts.length; i++) vs.push(W(pts[i]));
        sh.vertices = vs;
        sh.closed = true;
        pth.property("ADBE Vector Shape").setValue(sh);
        var st = gc.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(CORAL600);
        st.property("ADBE Vector Stroke Width").setValue(5);
        st.property("ADBE Vector Stroke Opacity").setValue(70);
        var fl = gc.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(BRANCO);
        return g;
    }
    poeEstado("MG", MG);
    poeEstado("SP", SPP);
    poeEstado("RJ", $.global.MAPA_RJ);
    mapa.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([ACX, ACY]);
    mapa.property("ADBE Transform Group").property("ADBE Position").setValue([ACX, ACY]);
    var mSc = mapa.property("ADBE Transform Group").property("ADBE Scale");
    mSc.setValueAtTime(1.27, [92, 92]);
    mSc.setValueAtTime(1.27 + 12 / FPS, [100, 100]);
    easeK(mSc, 2);
    fadeIn(mapa, 1.27, 8);

    // ---- PINO coral cai em BH ----
    var pino = t6.layers.addShape();
    pino.name = "T6V-pino";
    var pg = pino.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var pgc = pg.property("ADBE Vectors Group");
    var cab = pgc.addProperty("ADBE Vector Shape - Ellipse");
    cab.property("ADBE Vector Ellipse Size").setValue([60, 60]);
    cab.property("ADBE Vector Ellipse Position").setValue([0, -62]);
    var tri = pgc.addProperty("ADBE Vector Shape - Group");
    var tsh = new Shape();
    tsh.vertices = [[-24, -44], [24, -44], [0, 0]];
    tsh.closed = true;
    tri.property("ADBE Vector Shape").setValue(tsh);
    var pfl = pgc.addProperty("ADBE Vector Graphic - Fill");
    pfl.property("ADBE Vector Fill Color").setValue(CORAL600);
    var pg2 = pino.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var pg2c = pg2.property("ADBE Vectors Group");
    var furo = pg2c.addProperty("ADBE Vector Shape - Ellipse");
    furo.property("ADBE Vector Ellipse Size").setValue([24, 24]);
    furo.property("ADBE Vector Ellipse Position").setValue([0, -62]);
    var ffl = pg2c.addProperty("ADBE Vector Graphic - Fill");
    ffl.property("ADBE Vector Fill Color").setValue(BRANCO);
    var pPos = pino.property("ADBE Transform Group").property("ADBE Position");
    pPos.setValueAtTime(1.9, [BH[0], BH[1] - 260]);
    pPos.setValueAtTime(1.9 + 10 / FPS, [BH[0], BH[1]]);
    easeK(pPos, 2);
    fadeIn(pino, 1.9, 4);
    var bhTxt = texto(t6, "BH", "Sora-Bold", 50, CORAL600, BH[0] + 100, BH[1] - 36, 20);
    bhTxt.name = "T6V-bh-label";
    fadeIn(bhTxt, 2.15, 6);

    // ---- GRÁFICO em ESCADA ASCENDENTE: BH (3ª, branca) -> RJ -> SP ----
    var GX = 2790, GBASE = 1620, GW = 220, GGAP = 140;
    // a LINHA cria o ranking: cada barra nasce quando a bolinha passa nela
    // (Pedro 18/08) — bolinha: P0/BH 3.7, P1/RJ 4.3, P2/SP 4.9
    var BARRAS = [
        { nome: "BH", h: 360, op: 100, t: 3.62 },
        { nome: "RJ", h: 455, op: 34, t: 4.22 },
        { nome: "SP", h: 580, op: 34, t: 4.82 }
    ];
    for (var bi = 0; bi < BARRAS.length; bi++) {
        var B = BARRAS[bi];
        var bx = GX + (bi - 1) * (GW + GGAP);
        var barra = t6.layers.addShape();
        barra.name = "T6V-barra-" + B.nome;
        var bg2 = barra.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var bgc = bg2.property("ADBE Vectors Group");
        var br = bgc.addProperty("ADBE Vector Shape - Rect");
        br.property("ADBE Vector Rect Size").setValue([GW, B.h]);
        br.property("ADBE Vector Rect Position").setValue([0, -B.h / 2]);
        br.property("ADBE Vector Rect Roundness").setValue(24);
        var bfl = bgc.addProperty("ADBE Vector Graphic - Fill");
        bfl.property("ADBE Vector Fill Color").setValue(BRANCO);
        bfl.property("ADBE Vector Fill Opacity").setValue(B.op);
        barra.property("ADBE Transform Group").property("ADBE Position").setValue([bx, GBASE]);
        var bSc = barra.property("ADBE Transform Group").property("ADBE Scale");
        bSc.setValueAtTime(B.t, [100, 0]);
        bSc.setValueAtTime(B.t + 14 / FPS, [100, 100]);
        easeK(bSc, 2);
        fadeIn(barra, B.t, 3);
        var blab = texto(t6, B.nome, "Sora-SemiBold", 54, BRANCO, bx, GBASE + 80, 30);
        blab.name = "T6V-barra-label-" + B.nome;
        fadeIn(blab, B.t + 0.2, 6);
    }
    // linha de tendencia com bolinha (dashboard pro: desenha com trim)
    var tend = t6.layers.addShape();
    tend.name = "T6V-linha-tendencia";
    var tg2 = tend.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var tg2c = tg2.property("ADBE Vectors Group");
    var tpth = tg2c.addProperty("ADBE Vector Shape - Group");
    var tsh2 = new Shape();
    var P0 = [GX - (GW + GGAP), GBASE - 430], P1 = [GX, GBASE - 530], P2 = [GX + (GW + GGAP), GBASE - 660];
    // vertices em espaco do LAYER (origem = centro do comp)
    tsh2.vertices = [[P0[0] - 1920, P0[1] - 1080], [P1[0] - 1920, P1[1] - 1080], [P2[0] - 1920, P2[1] - 1080]];
    // tangentes Catmull-Rom: curva macia sem quina (Pedro 18/08: "torta" antes)
    tsh2.inTangents = [[0, 0], [-(P2[0] - P0[0]) / 6, -(P2[1] - P0[1]) / 6], [-(P2[0] - P1[0]) / 3, -(P2[1] - P1[1]) / 3]];
    tsh2.outTangents = [[(P1[0] - P0[0]) / 3, (P1[1] - P0[1]) / 3], [(P2[0] - P0[0]) / 6, (P2[1] - P0[1]) / 6], [0, 0]];
    tsh2.closed = false;
    tpth.property("ADBE Vector Shape").setValue(tsh2);
    var tst2 = tg2c.addProperty("ADBE Vector Graphic - Stroke");
    tst2.property("ADBE Vector Stroke Color").setValue(BRANCO);
    tst2.property("ADBE Vector Stroke Width").setValue(22);
    tst2.property("ADBE Vector Stroke Line Cap").setValue(2);
    try { tst2.property("ADBE Vector Stroke Line Join").setValue(2); } catch (eJ) {}
    var ttrim = tg2c.addProperty("ADBE Vector Filter - Trim");
    var tEnd2 = ttrim.property("ADBE Vector Trim End");
    tEnd2.setValueAtTime(3.7, 0);
    tEnd2.setValueAtTime(4.9, 100);
    easeK(tEnd2, 2);
    // depois de terminar, a linha SOME de tras pra frente (Pedro 18/08)
    var tStart2 = ttrim.property("ADBE Vector Trim Start");
    tStart2.setValueAtTime(5.35, 0);
    tStart2.setValueAtTime(6.05, 100);
    easeK(tStart2, 2);
    fadeIn(tend, 3.7, 4);
    // (sem glow proprio: lavava a linha contra o bloom das barras)
    var bola = t6.layers.addShape();
    bola.name = "T6V-bolinha";
    var bg3 = bola.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var bg3c = bg3.property("ADBE Vectors Group");
    var bel = bg3c.addProperty("ADBE Vector Shape - Ellipse");
    bel.property("ADBE Vector Ellipse Size").setValue([42, 42]);
    var bfl3 = bg3c.addProperty("ADBE Vector Graphic - Fill");
    bfl3.property("ADBE Vector Fill Color").setValue(BRANCO);
    var bpos = bola.property("ADBE Transform Group").property("ADBE Position");
    bpos.setValueAtTime(3.7, P0);
    bpos.setValueAtTime(4.3, P1);
    bpos.setValueAtTime(4.9, P2);
    var eB = [new KeyframeEase(0, 70)];
    bpos.setTemporalEaseAtKey(3, eB, eB);
    var bsc3 = bola.property("ADBE Transform Group").property("ADBE Scale");
    bsc3.setValueAtTime(4.9, [100, 100]);
    bsc3.setValueAtTime(5.05, [145, 145]);
    bsc3.setValueAtTime(5.2, [100, 100]);
    bsc3.setValueAtTime(5.95, [100, 100]);
    bsc3.setValueAtTime(6.12, [0, 0]);
    easeK(bsc3, 5);
    fadeIn(bola, 3.7, 4);
    try {
        var bfx = bola.property("ADBE Effect Parade").addProperty("ADBE Glo2");
        bfx.property("ADBE Glo2-0002").setValue(55);
        bfx.property("ADBE Glo2-0003").setValue(46);
        bfx.property("ADBE Glo2-0004").setValue(0.9);
    } catch (eB2) {}

    // badge "3ª" sobre a barra BH (agora à esquerda)
    var bBX = GX - (GW + GGAP);
    var badge = t6.layers.addShape();
    badge.name = "T6V-badge-3a";
    var bag = badge.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var bagc = bag.property("ADBE Vectors Group");
    var bar2 = bagc.addProperty("ADBE Vector Shape - Rect");
    bar2.property("ADBE Vector Rect Size").setValue([120, 84]);
    bar2.property("ADBE Vector Rect Roundness").setValue(42);
    var bafl = bagc.addProperty("ADBE Vector Graphic - Fill");
    bafl.property("ADBE Vector Fill Color").setValue(BRANCO);
    badge.property("ADBE Transform Group").property("ADBE Position").setValue([bBX, GBASE - 360 - 74]);
    popIn(badge, 4.92); // so quando a linha chega la em cima (Pedro 18/08)
    var badgeTxt = texto(t6, "3ª", "Sora-Bold", 48, CORAL600, bBX, GBASE - 360 - 58, 0);
    badgeTxt.name = "T6V-badge-3a-txt";
    fadeIn(badgeTxt, 4.98, 4);

    // ---- pill "nasce em 11 horas" (área livre, sob o gráfico) ----
    var pill = t6.layers.addShape();
    pill.name = "T6V-pill-11h";
    var pig = pill.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var pigc = pig.property("ADBE Vectors Group");
    var pir = pigc.addProperty("ADBE Vector Shape - Rect");
    pir.property("ADBE Vector Rect Size").setValue([440, 150]);
    pir.property("ADBE Vector Rect Roundness").setValue(75);
    var pifl = pigc.addProperty("ADBE Vector Graphic - Fill");
    pifl.property("ADBE Vector Fill Color").setValue(BRANCO);
    pill.property("ADBE Transform Group").property("ADBE Position").setValue([2180, 990]);
    popIn(pill, 7.91);
    var pillTxt = texto(t6, "11 horas", "Sora-Bold", 64, CORAL600, 2180, 1012, 0);
    pillTxt.name = "T6V-pill-11h-txt";
    fadeIn(pillTxt, 7.98, 4);

    // ---- 9.29 "Se funcionar no lugar mais rápido": estrelinha ORBITA São Paulo ----
    // (pontinho de SP removido - a propria estrela marca a capital)
    // (label "SP" removido - Pedro 18/08: sem sigla nenhuma em SP)

    var estrelinha = t6.layers.addShape();
    estrelinha.name = "T6V-estrela-sp";
    var eg = estrelinha.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var egc = eg.property("ADBE Vectors Group");
    var est = egc.addProperty("ADBE Vector Shape - Star");
    est.property("ADBE Vector Star Type").setValue(1);
    est.property("ADBE Vector Star Points").setValue(5);
    est.property("ADBE Vector Star Outer Radius").setValue(72);
    est.property("ADBE Vector Star Inner Radius").setValue(32);
    var efl = egc.addProperty("ADBE Vector Graphic - Fill");
    efl.property("ADBE Vector Fill Color").setValue([255 / 255, 233 / 255, 35 / 255]); // AMARELO VIVO #FFE923 (amostrado do v083 aprovado)
    var SPX = SPC[0] - 45; // pouso deslocado pra ESQUERDA, em cima da capital (Pedro 18/08)
    estrelinha.property("ADBE Transform Group").property("ADBE Position").setValue([SPX, SPC[1] - 6]);
    // CAI de cima em SP e INCORPORA (como a de BH)
    var apPosIn = estrelinha.property("ADBE Transform Group").property("ADBE Position");
    apPosIn.setValueAtTime(9.29, [SPX, SPC[1] - 420]);
    apPosIn.setValueAtTime(9.62, [SPX, SPC[1] - 6]);
    var apSc = estrelinha.property("ADBE Transform Group").property("ADBE Scale");
    apSc.setValueAtTime(9.62, [100, 100]);
    apSc.setValueAtTime(9.68, [112, 88]);
    apSc.setValueAtTime(9.74, [96, 105]);
    apSc.setValueAtTime(9.82, [100, 100]);
    fadeIn(estrelinha, 9.29, 4);

    // ---- 12.47 "funciona em qualquer lugar": estrela MAIOR quicando em BH ----
    var T_Q = 13.1;
    var pOp = pino.property("ADBE Transform Group").property("ADBE Opacity");
    pOp.setValueAtTime(T_Q + 8 / FPS, 100);
    pOp.setValueAtTime(T_Q + 12 / FPS, 0);
    var estrelona = t6.layers.addShape();
    estrelona.name = "T6V-estrela-bh";
    var e2g = estrelona.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var e2gc = e2g.property("ADBE Vectors Group");
    var e2s = e2gc.addProperty("ADBE Vector Shape - Star");
    e2s.property("ADBE Vector Star Type").setValue(1);
    e2s.property("ADBE Vector Star Points").setValue(5);
    e2s.property("ADBE Vector Star Outer Radius").setValue(72);
    e2s.property("ADBE Vector Star Inner Radius").setValue(32);
    var e2f = e2gc.addProperty("ADBE Vector Graphic - Fill");
    e2f.property("ADBE Vector Fill Color").setValue([255 / 255, 233 / 255, 35 / 255]); // AMARELO VIVO #FFE923 (amostrado do v083 aprovado)
    var qPos = estrelona.property("ADBE Transform Group").property("ADBE Position");
    // quicando (bounce decrescente — pedido explícito do Pedro)
    qPos.setValueAtTime(T_Q, [BH[0], BH[1] - 520]);
    qPos.setValueAtTime(T_Q + 9 / FPS, [BH[0], BH[1] - 20]);
    qPos.setValueAtTime(T_Q + 15 / FPS, [BH[0], BH[1] - 170]);
    qPos.setValueAtTime(T_Q + 21 / FPS, [BH[0], BH[1] - 20]);
    qPos.setValueAtTime(T_Q + 25 / FPS, [BH[0], BH[1] - 70]);
    qPos.setValueAtTime(T_Q + 29 / FPS, [BH[0], BH[1] - 20]);
    qPos.setValueAtTime(T_Q + 32 / FPS, [BH[0], BH[1] - 38]);
    qPos.setValueAtTime(T_Q + 35 / FPS, [BH[0], BH[1] - 20]);
    var qRot = estrelona.property("ADBE Transform Group").property("ADBE Rotate Z");
    qRot.setValueAtTime(T_Q, -30);
    qRot.setValueAtTime(T_Q + 15 / FPS, 0);
    easeK(qRot, 2);
    fadeIn(estrelona, T_Q, 4);

    // brilho varrendo a estrela dourada (grupo clipado por mascara em estrela)
    var brilho = estrelona.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    brilho.name = "brilho";
    var brc = brilho.property("ADBE Vectors Group");
    var brr = brc.addProperty("ADBE Vector Shape - Rect");
    brr.property("ADBE Vector Rect Size").setValue([46, 240]);
    var brf = brc.addProperty("ADBE Vector Graphic - Fill");
    brf.property("ADBE Vector Fill Color").setValue(BRANCO);
    var brT = brilho.property("ADBE Vector Transform Group");
    brT.property("ADBE Vector Rotation").setValue(28);
    var brOp = brT.property("ADBE Vector Group Opacity");
    brOp.setValueAtTime(13.95, 72);
    brOp.setValueAtTime(14.2, 0); // some antes do mergulho
    var brP = brT.property("ADBE Vector Position");
    brP.setValueAtTime(13.05, [-150, 0]);
    brP.setValueAtTime(13.5, [150, 0]);
    brP.setValueAtTime(14.2, [-150, 0]);
    brP.setValueAtTime(14.65, [150, 0]);
    // mascara em forma de estrela clipa o brilho
    var emk = estrelona.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var esh = new Shape();
    var emv = [];
    for (var ei = 0; ei < 10; ei++) {
        var ang = -Math.PI / 2 + ei * Math.PI / 5;
        var rr = (ei % 2 === 0) ? 86 : 38;
        emv.push([Math.cos(ang) * rr, Math.sin(ang) * rr]);
    }
    esh.vertices = emv;
    esh.closed = true;
    emk.property("ADBE Mask Shape").setValue(esh);

    // glow da estrela com KEYS: acende no pouso, APAGA no zoom (o add
    // saturava ambar+ambar = amarelo-limao com a estrela em tela cheia)
    try {
        var gfx = estrelona.property("ADBE Effect Parade").addProperty("ADBE Glo2");
        gfx.property("ADBE Glo2-0002").setValue(78);
        gfx.property("ADBE Glo2-0003").setValue(34);
        var gInt = gfx.property("ADBE Glo2-0004");
        gInt.setValueAtTime(T_Q, 0);
        gInt.setValueAtTime(T_Q + 0.3, 0.32);
        gInt.setValueAtTime(13.9, 0.32);
        gInt.setValueAtTime(14.35, 0);
    } catch (eG) {}

    // no "funciona em qualquer lugar": pill 11h apaga...
    var pilOp = pill.property("ADBE Transform Group").property("ADBE Opacity");
    pilOp.setValueAtTime(T_Q, 100);
    pilOp.setValueAtTime(T_Q + 5 / FPS, 0);
    var piltOp = pillTxt.property("ADBE Transform Group").property("ADBE Opacity");
    piltOp.setValueAtTime(T_Q, 100);
    piltOp.setValueAtTime(T_Q + 5 / FPS, 0);
    // ...e entra a frase BEM DESTACADA embaixo
    var frase = texto(t6, "funciona em qualquer lugar", "Sora-Bold", 110, BRANCO, 1920, 1990, 10);
    frase.name = "T6V-frase-qualquer-lugar";
    popIn(frase, T_Q);

    // estrela de SP e ARREMESSADA pra esquerda caindo, enquanto a de BH incorpora
    // sigla SP DENTRO da estrela (acompanha quiques por parenting)
// (sigla dentro da estrela de SP removida - Pedro 18/08)

    // SAIDA ESTRELA CADENTE: dispara em arco diagonal com rastro e stretch
    var apPos2 = estrelinha.property("ADBE Transform Group").property("ADBE Position");
    apPos2.setValueAtTime(12.47, [SPX, SPC[1] - 6]);
    apPos2.setValueAtTime(12.63, [SPC[0] - 290, SPC[1] - 190]);
    apPos2.setValueAtTime(13.02, [SPC[0] - 1450, SPC[1] + 520]); // fora do quadro
    var eC = [new KeyframeEase(0, 75)];
    apPos2.setTemporalEaseAtKey(1, eC, eC); // acelera saindo
    var apScC = estrelinha.property("ADBE Transform Group").property("ADBE Scale");
    apScC.setValueAtTime(12.47, [100, 100]);
    apScC.setValueAtTime(12.62, [148, 72]);  // esticada de velocidade
    apScC.setValueAtTime(13.0, [120, 60]);
    var apRotC = estrelinha.property("ADBE Transform Group").property("ADBE Rotate Z");
    apRotC.setValueAtTime(12.47, 0);
    apRotC.setValueAtTime(13.02, -140);
    var apOpC = estrelinha.property("ADBE Transform Group").property("ADBE Opacity");
    apOpC.setValueAtTime(12.95, 100);
    apOpC.setValueAtTime(13.1, 0);
    // rastro: stroke ambar perseguindo pela trajetoria (trim)
    var rastro = t6.layers.addShape();
    rastro.name = "T6V-rastro-sp";
    var rsg = rastro.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var rsgc = rsg.property("ADBE Vectors Group");
    var rsp = rsgc.addProperty("ADBE Vector Shape - Group");
    var rsh2 = new Shape();
    rsh2.vertices = [[SPX, SPC[1] - 40], [SPC[0] - 290, SPC[1] - 190], [SPC[0] - 1450, SPC[1] + 520]];
    rsh2.inTangents = [[0, 0], [180, 30], [340, -160]];
    rsh2.outTangents = [[-160, -60], [-340, 160], [0, 0]];
    rsh2.closed = false;
    rsp.property("ADBE Vector Shape").setValue(rsh2);
    var rst2 = rsgc.addProperty("ADBE Vector Graphic - Stroke");
    rst2.property("ADBE Vector Stroke Color").setValue([245 / 255, 165 / 255, 36 / 255]);
    rst2.property("ADBE Vector Stroke Width").setValue(14);
    rst2.property("ADBE Vector Stroke Opacity").setValue(65);
    rst2.property("ADBE Vector Stroke Line Cap").setValue(2);
    var rtrim = rsgc.addProperty("ADBE Vector Filter - Trim");
    var rEnd = rtrim.property("ADBE Vector Trim End");
    rEnd.setValueAtTime(12.47, 0);
    rEnd.setValueAtTime(13.02, 100);
    var rStart = rtrim.property("ADBE Vector Trim Start");
    rStart.setValueAtTime(12.58, 0);
    rStart.setValueAtTime(13.14, 100);

    // "BH" DENTRO da estrela dourada    // "BH" DENTRO da estrela dourada, entrando fluido no fim do quique
    var bhOldOp = bhTxt.property("ADBE Transform Group").property("ADBE Opacity");
    bhOldOp.setValueAtTime(12.7, 100);
    bhOldOp.setValueAtTime(12.85, 0);
    var bhStar = texto(t6, "BH", "Sora-Bold", 52, BRANCO, BH[0], BH[1] - 2, 10);
    bhStar.name = "T6V-bh-na-estrela";
    var bsPos = bhStar.property("ADBE Transform Group").property("ADBE Position");
    bsPos.setValueAtTime(13.30, [BH[0], BH[1] - 54]);
    bsPos.setValueAtTime(13.43, [BH[0], BH[1] - 4]);
    bsPos.setValueAtTime(13.53, [BH[0], BH[1] - 22]);
    bsPos.setValueAtTime(13.63, [BH[0], BH[1] - 4]);
    var bsSc = bhStar.property("ADBE Transform Group").property("ADBE Scale");
    bsSc.setValueAtTime(13.28, [0, 0]);
    bsSc.setValueAtTime(13.52, [100, 100]);
    easeK(bsSc, 2);
    var bsOp = bhStar.property("ADBE Transform Group").property("ADBE Opacity");
    bsOp.setValueAtTime(13.28, 0);
    bsOp.setValueAtTime(13.4, 100);

    // frase de baixo some antes do mergulho (o BH FICA na estrela)
    var frOp2 = frase.property("ADBE Transform Group").property("ADBE Opacity");
    frOp2.setValueAtTime(14.3, 100);
    frOp2.setValueAtTime(14.55, 0);

    // ---- ordem ----
    for (var L2 = t6.numLayers; L2 >= 1; L2--) {
        if (t6.layer(L2).name === "T6-LETTERING") t6.layer(L2).moveToBeginning();
    }
    for (var L4 = t6.numLayers; L4 >= 1; L4--) {
        if (t6.layer(L4).name === "T6V-estrela-bh") t6.layer(L4).moveToBeginning();
    }
    for (var L5 = t6.numLayers; L5 >= 1; L5--) {
        if (t6.layer(L5).name === "T6V-bh-na-estrela") t6.layer(L5).moveToBeginning();
    }
    fundoPapel.moveToEnd();
    for (var L3 = 1; L3 <= t6.numLayers; L3++) {
        if (t6.layer(L3).name === "BG-T6") {
            var bg = t6.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    // ==== ZOOM IN NA ESTRELA: a cena inteira mergulha (transicao pro T7) ====
    var zoomcam = t6.layers.addNull(dur);
    zoomcam.name = "T6V-ZOOMCAM";
    var ZP = [BH[0] - 23, BH[1] - 14]; // buraco de baixo do B
    zoomcam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue(ZP);
    zoomcam.property("ADBE Transform Group").property("ADBE Position").setValue(ZP);
    for (var ZL = 1; ZL <= t6.numLayers; ZL++) {
        var zly = t6.layer(ZL);
        if (zly === zoomcam || zly.locked) continue;
        if (zly.parent === null) zly.parent = zoomcam;
    }
    var zcp = zoomcam.property("ADBE Transform Group").property("ADBE Position");
    zcp.setValueAtTime(14.0, ZP);
    zcp.setValueAtTime(15.65, [1920, 1080]); // o buraco viaja pro centro do quadro
    var eZ = [new KeyframeEase(0, 78)];
    zcp.setTemporalEaseAtKey(1, eZ, eZ);
    var zcs = zoomcam.property("ADBE Transform Group").property("ADBE Scale");
    zcs.setValueAtTime(14.0, [100, 100]);
    zcs.setValueAtTime(15.65, [50000, 50000]); // atravessa o buraco NO CORTE (ambar dentro)
    easeK(zcs, 1); // acelera entrando

    $.global.ESCALADA_RESULT = { take: "T6", camadas: t6.numLayers, mapa: "MG+SP real" };
})();
