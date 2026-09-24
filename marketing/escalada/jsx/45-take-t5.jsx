// 45-take-t5.jsx — T5 v2 "Planilha, caderno e contador 1x/ano" (idempotente)
// Ajustes Pedro 17/08: celular MAIS FRONTAL (render az8) quase no centro,
// legendas à ESQUERDA, cards encaixados retos como UI real:
//   Planilha: grade reta com fantasma financeiro em TODAS as células
//   Notas (bloco de notas): digita "pagar imposto amanhã", apaga,
//         digita "pagar imposto depois de amanhã"
// ---- card 3: CONTADOR - calendario Dez 26/27/28/29 (flip por ano) ----
// Rig: null estático -> filhos -> keys por último. Nada torto.

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];
    var BRANCO = [1, 1, 1];
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];
    var INK_900 = [27 / 255, 30 / 255, 36 / 255];
    var INK_600 = [82 / 255, 78 / 255, 72 / 255];
    var INK_400 = [161 / 255, 155 / 255, 146 / 255];
    var INK_100 = [241 / 255, 238 / 255, 233 / 255];
    var HAIR_SOFT = [227 / 255, 222 / 255, 215 / 255];

    // ---- geometria principal (celular quase no centro, tela responsiva) ----
    var FX = 2400, FY = 1110;      // centro do celular
    var ESC_FONE = 84;             // escala do render
    var CW = 770;                  // largura dos cards (encaixe na tela)
    var Y_PLA = FY - 482, Y_NOT = FY + 34, Y_CON = FY + 530;

    var proj = app.project;
    function findItem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
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
    function digita(ly, seq) {
        var prop = ly.property("ADBE Text Properties").property("ADBE Text Document");
        for (var i = 0; i < seq.length; i++) {
            var td = prop.value;
            td.text = seq[i][1];
            prop.setValueAtTime(seq[i][0], td);
        }
    }
    function seqDigitacao(t0, corpo, vel) {
        var out = [];
        for (var i = 1; i <= corpo.length; i++) out.push([t0 + (i - 1) * vel, corpo.substring(0, i) + "|"]);
        return out;
    }
    function seqApaga(t0, corpo, vel, passo) {
        var out = [];
        var i = corpo.length - passo;
        var t = t0;
        while (i > 0) { out.push([t, corpo.substring(0, i) + "|"]); t += vel; i -= passo; }
        out.push([t, "|"]);
        return out;
    }

    var t5 = findItem("T5");
    if (!t5) { $.global.ESCALADA_RESULT = { erro: "T5 não existe" }; return; }
    var dur = t5.duration; // 10.9667
    t5.time = 0; // parent-preserve usa o playhead: zera antes de construir!

    for (var L = t5.numLayers; L >= 1; L--) {
        if (t5.layer(L).name.indexOf("T5V-") === 0) t5.layer(L).remove();
    }

    // ---- fundo papel + manchas ----
    var fundo = t5.layers.addSolid(PAPEL, "T5V-fundo-papel", 3840, 2160, 1, dur);
    function mancha(nome, tam, pos, cor, feather, opac, seedM) {
        var m = t5.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
        var rx = tam[0] / 2, ry = tam[1] / 2, k = 0.5523;
        var cx = pos[0], cy = pos[1];
        var msk = m.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var s = new Shape();
        s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
        s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
        s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
        s.closed = true;
        msk.property("ADBE Mask Shape").setValue(s);
        msk.property("ADBE Mask Feather").setValue([feather, feather]);
        m.property("ADBE Transform Group").property("ADBE Opacity").setValue(opac);
        m.property("ADBE Transform Group").property("ADBE Position").expression =
            "value + [wiggle(0.05, 70)[0] - value[0], wiggle(0.04, 50)[1] - value[1]];";
        return m;
    }
    mancha("T5V-mancha-topo", [3900, 1400], [1920, 20], CORAL, 520, 8, 1.1);
    var mBaixo = mancha("T5V-mancha-virada", [2600, 1400], [1920, 2250], CORAL600, 480, 0, 5.0);
    var mbOp = mBaixo.property("ADBE Transform Group").property("ADBE Opacity");
    mbOp.setValueAtTime(8.47, 0);
    mbOp.setValueAtTime(dur, 16);

    // ---- CAM ----
    var cam = t5.layers.addNull(dur);
    cam.name = "T5V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1920, 1080]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);

    // ==== rig do iPhone (render frontal az8) ====
    var rig = t5.layers.addNull(dur);
    rig.name = "T5V-PHONE3D";
    rig.threeDLayer = true;
    rig.property("ADBE Transform Group").property("ADBE Position").setValue([FX, FY, 0]);
    rig.parent = cam;

    var fone5 = findItem("iphone-t5.png");
    if (!fone5) {
        var fAssets = findItem("03-ASSETS");
        fone5 = proj.importFile(new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/iphone-t5.png")));
        if (fAssets) fone5.parentFolder = fAssets;
    }
    var frame = t5.layers.add(fone5);
    frame.name = "T5V-fone3d";
    frame.threeDLayer = true;
    frame.property("ADBE Transform Group").property("ADBE Position").setValue([FX, FY, 2]);
    frame.property("ADBE Transform Group").property("ADBE Scale").setValue([ESC_FONE, ESC_FONE, ESC_FONE]);
    frame.parent = rig;
    var frOp = frame.property("ADBE Transform Group").property("ADBE Opacity");
    frOp.setValueAtTime(0, 0);
    frOp.setValueAtTime(1.0667, 0);
    frOp.setValueAtTime(1.1, 100);

    // SPIN de entrada: volta da DIREITA girando e para na pose frontal
    var seqT5 = findItem("SEQ-spin-t5");
    if (!seqT5) {
        var ioS = new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/spin-t5/spin_0000.png"));
        ioS.sequence = true;
        seqT5 = proj.importFile(ioS);
        seqT5.name = "SEQ-spin-t5";
        var fA2 = findItem("03-ASSETS"); if (fA2) seqT5.parentFolder = fA2;
        seqT5.mainSource.conformFrameRate = 30;
    }
    var spin = t5.layers.add(seqT5);
    spin.name = "T5V-spin";
    spin.startTime = 0;
    spin.outPoint = 1.1;  // 33 frames nativos a 30fps: pousa apos o "E o resto?"
    spin.frameBlendingType = FrameBlendingType.FRAME_MIX;
    t5.frameBlending = true;
    spin.parent = cam;
    spin.property("ADBE Transform Group").property("ADBE Scale").setValue([ESC_FONE, ESC_FONE]);
    var spPos = spin.property("ADBE Transform Group").property("ADBE Position");
    spPos.setValueAtTime(0, [4600, FY + 120]);
    spPos.setValueAtTime(1.1, [FX, FY]);
    easeK(spPos, 2);
    var spOp = spin.property("ADBE Transform Group").property("ADBE Opacity");
    spOp.setValueAtTime(0, 0);
    spOp.setValueAtTime(3 / FPS, 100);

    // ---- fábrica de cards (retos, encaixados) ----
    function cardBase(nome, wCard, hCard, wx, wy, labelTxt) {
        var card = t5.layers.addShape();
        card.name = nome;
        card.threeDLayer = true;
        var grp = card.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var cont = grp.property("ADBE Vectors Group");
        var rc = cont.addProperty("ADBE Vector Shape - Rect");
        rc.property("ADBE Vector Rect Size").setValue([wCard, hCard]);
        rc.property("ADBE Vector Rect Roundness").setValue(44);
        var st = cont.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(HAIR_SOFT);
        st.property("ADBE Vector Stroke Width").setValue(3);
        var fl = cont.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(BRANCO);
        card.property("ADBE Transform Group").property("ADBE Position").setValue([wx, wy, -2]);
        card.parent = rig;
        var lab = texto(t5, labelTxt, "Sora-SemiBold", 44, INK_900, wx - wCard / 2 + 40, wy - hCard / 2 + 76, 0, ParagraphJustification.LEFT_JUSTIFY);
        lab.name = nome + "-label";
        lab.threeDLayer = true;
        lab.parent = card;
        lab.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
        var lp = lab.property("ADBE Transform Group").property("ADBE Position").value;
        lab.property("ADBE Transform Group").property("ADBE Position").setValue([lp[0], lp[1], -8]);
        return { card: card, lab: lab };
    }
    function filho3D(ly, pai, z) {
        ly.threeDLayer = true;
        ly.parent = pai;
        ly.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
        var pp = ly.property("ADBE Transform Group").property("ADBE Position").value;
        ly.property("ADBE Transform Group").property("ADBE Position").setValue([pp[0], pp[1], z]);
    }
    function fade(ly, tIn) {
        var op = ly.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(tIn, 0);
        op.setValueAtTime(tIn + 6 / FPS, 100);
    }
    function entraLado(card, lado, tIn) {
        var pos = card.property("ADBE Transform Group").property("ADBE Position");
        var lv = pos.value;
        pos.setValueAtTime(tIn, [lv[0] + lado * 720, lv[1], lv[2]]);
        pos.setValueAtTime(tIn + 13 / FPS, lv);
        easeK(pos, 2);
        fade(card, tIn);
    }
    function entraCamera(card, tIn) {
        var pos = card.property("ADBE Transform Group").property("ADBE Position");
        var lv = pos.value;
        pos.setValueAtTime(tIn, [lv[0] + 120, lv[1] + 70, -1650]);
        pos.setValueAtTime(tIn + 11 / FPS, lv);
        easeK(pos, 2);
        fade(card, tIn);
    }

    // ---- card 1: PLANILHA — grade reta, fantasma financeiro em TODA célula ----
    var cPla = cardBase("T5V-card-planilha", CW, 500, FX, Y_PLA, "Planilha");
    var T_PLA = 2.08;
    var COLS = 4, ROWS = 4, CEL_W = (CW - 80) / COLS, CEL_H = 74;
    var gradeY0 = Y_PLA + 44;
    var grade = t5.layers.addShape();
    grade.name = "T5V-planilha-grade";
    for (var gc = 0; gc < COLS; gc++) {
        for (var gr = 0; gr < ROWS; gr++) {
            var cel = grade.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            cel.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([(gc - (COLS - 1) / 2) * CEL_W, (gr - (ROWS - 1) / 2) * CEL_H]);
            var celC = cel.property("ADBE Vectors Group");
            var celR = celC.addProperty("ADBE Vector Shape - Rect");
            celR.property("ADBE Vector Rect Size").setValue([CEL_W, CEL_H]);
            var celS = celC.addProperty("ADBE Vector Graphic - Stroke");
            celS.property("ADBE Vector Stroke Color").setValue(HAIR_SOFT);
            celS.property("ADBE Vector Stroke Width").setValue(2);
            var celF = celC.addProperty("ADBE Vector Graphic - Fill");
            celF.property("ADBE Vector Fill Color").setValue(gr === 0 ? INK_100 : BRANCO);
        }
    }
    grade.property("ADBE Transform Group").property("ADBE Position").setValue([FX, gradeY0, -8]);
    filho3D(grade, cPla.card, -8);
    var DADOS = [
        ["Mês", "Guia", "Valor", "Pago"],
        ["jun", "DAS", "R$ 840", "sim"],
        ["jul", "DAS", "R$ 1.240", "?"],
        ["ago", "INSS", "R$ 96", "?"]
    ];
    var celTxts = [];
    for (var dr = 0; dr < ROWS; dr++) {
        for (var dc = 0; dc < COLS; dc++) {
            var ctx = texto(t5, DADOS[dr][dc], dr === 0 ? "Sora-SemiBold" : "Sora-Regular", 32,
                dr === 0 ? INK_600 : INK_400,
                FX + (dc - (COLS - 1) / 2) * CEL_W, gradeY0 + (dr - (ROWS - 1) / 2) * CEL_H + 10, 0);
            ctx.name = "T5V-pla-c" + dr + dc;
            filho3D(ctx, cPla.card, -10);
            celTxts.push(ctx);
        }
    }
    entraLado(cPla.card, -1, T_PLA);
    fade(cPla.lab, T_PLA);
    fade(grade, T_PLA);
    for (var ft = 0; ft < celTxts.length; ft++) fade(celTxts[ft], T_PLA + 0.06 * (ft % COLS) + 0.05 * Math.floor(ft / COLS));

    // ---- card 2: NOTAS (bloco de notas) — digita, apaga, digita ----
    var cNot = cardBase("T5V-card-notas", CW, 460, FX, Y_NOT, "Notas");
    var T_NOT = 2.85;
    // linha separadora sob o título (cara de bloco de notas)
    var sep = t5.layers.addShape();
    sep.name = "T5V-notas-sep";
    var sgrp = sep.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var sc = sgrp.property("ADBE Vectors Group");
    var sr = sc.addProperty("ADBE Vector Shape - Rect");
    sr.property("ADBE Vector Rect Size").setValue([CW - 80, 3]);
    var sf = sc.addProperty("ADBE Vector Graphic - Fill");
    sf.property("ADBE Vector Fill Color").setValue(HAIR_SOFT);
    sep.property("ADBE Transform Group").property("ADBE Position").setValue([FX, Y_NOT - 120, -8]);
    filho3D(sep, cNot.card, -8);
    var nota = texto(t5, "|", "Sora-Regular", 38, INK_900, FX - CW / 2 + 44, Y_NOT - 20, 0, ParagraphJustification.LEFT_JUSTIFY);
    nota.name = "T5V-notas-texto";
    filho3D(nota, cNot.card, -10);
    var FRASE1 = "pagar imposto amanhã";
    var FRASE2 = "pagar imposto depois de amanhã";
    var seqN = [];
    seqN.push([T_NOT + 0.15, "|"]);
    seqN = seqN.concat(seqDigitacao(3.62, FRASE1, 0.052));
    seqN.push([4.85, FRASE1]);
    seqN.push([5.02, FRASE1 + "|"]);
    seqN = seqN.concat(seqApaga(5.18, FRASE1, 0.03, 2));
    seqN = seqN.concat(seqDigitacao(5.55, FRASE2, 0.046));
    seqN.push([7.15, FRASE2]);
    seqN.push([7.4, FRASE2 + "|"]);
    seqN.push([7.7, FRASE2]);
    seqN.push([8.0, FRASE2 + "|"]);
    digita(nota, seqN);
    entraLado(cNot.card, 1, T_NOT);
    fade(cNot.lab, T_NOT);
    fade(sep, T_NOT);
    fade(nota, T_NOT);

    // ---- card 3: CONTADOR - calendario Dez 26/27/28/29 (flip por ano) ----
    var cCon = cardBase("T5V-card-contador", CW, 460, FX, Y_CON, "Contador");
    var T_CON = 3.86;
    // CALENDÁRIO animado: pequena tabela com os DIAS PASSANDO (Pedro 18/08)
    var C5_W = 560, C5_H = 340, C5_Y = Y_CON + 50;
    var cal5 = t5.layers.addShape();
    cal5.name = "T5V-contador-calendario";
    // 1) highlight do dia (frente)
    var hj5 = cal5.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    hj5.name = "hoje";
    var h5c = hj5.property("ADBE Vectors Group");
    var h5r = h5c.addProperty("ADBE Vector Shape - Rect");
    h5r.property("ADBE Vector Rect Size").setValue([54, 44]);
    h5r.property("ADBE Vector Rect Roundness").setValue(10);
    var h5f = h5c.addProperty("ADBE Vector Graphic - Fill");
    h5f.property("ADBE Vector Fill Color").setValue(CORAL600);
    var G5C = 7, D5X = 62, D5Y = 56, G5X0 = -186, G5Y0 = -60;
    var h5P = hj5.property("ADBE Vector Transform Group").property("ADBE Vector Position");
    var T_CAL5 = 4.12;
    for (var dd5 = 0; dd5 < 28; dd5++) {
        h5P.setValueAtTime(T_CAL5 + dd5 * 0.1, [G5X0 + (dd5 % G5C) * D5X, G5Y0 + Math.floor(dd5 / G5C) * D5Y]);
    }
    for (var kh5 = 1; kh5 <= h5P.numKeys; kh5++) h5P.setInterpolationTypeAtKey(kh5, KeyframeInterpolationType.HOLD);
    // 2) grade de dias 7x4
    var g5 = cal5.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    g5.name = "grade";
    var g5c = g5.property("ADBE Vectors Group");
    var g5r = g5c.addProperty("ADBE Vector Shape - Rect");
    g5r.property("ADBE Vector Rect Size").setValue([50, 40]);
    g5r.property("ADBE Vector Rect Position").setValue([G5X0, G5Y0]);
    g5r.property("ADBE Vector Rect Roundness").setValue(9);
    var g5f = g5c.addProperty("ADBE Vector Graphic - Fill");
    g5f.property("ADBE Vector Fill Color").setValue(INK_100);
    var g5X = g5c.addProperty("ADBE Vector Filter - Repeater");
    g5X.property("ADBE Vector Repeater Copies").setValue(G5C);
    g5X.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([D5X, 0]);
    var g5Y = g5c.addProperty("ADBE Vector Filter - Repeater");
    g5Y.property("ADBE Vector Repeater Copies").setValue(4);
    g5Y.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, D5Y]);
    // 3) cabeçalho coral
    var c5b = cal5.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    c5b.name = "cabecalho";
    var c5c = c5b.property("ADBE Vectors Group");
    var c5r = c5c.addProperty("ADBE Vector Shape - Rect");
    c5r.property("ADBE Vector Rect Size").setValue([C5_W, 76]);
    c5r.property("ADBE Vector Rect Position").setValue([0, -C5_H / 2 + 38]);
    c5r.property("ADBE Vector Rect Roundness").setValue(24);
    var c5r2 = c5c.addProperty("ADBE Vector Shape - Rect");
    c5r2.property("ADBE Vector Rect Size").setValue([C5_W, 38]);
    c5r2.property("ADBE Vector Rect Position").setValue([0, -C5_H / 2 + 57]);
    var c5f = c5c.addProperty("ADBE Vector Graphic - Fill");
    c5f.property("ADBE Vector Fill Color").setValue(CORAL600);
    // 4) corpo branco
    var c5g = cal5.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    c5g.name = "corpo";
    var c5gc = c5g.property("ADBE Vectors Group");
    var c5gr = c5gc.addProperty("ADBE Vector Shape - Rect");
    c5gr.property("ADBE Vector Rect Size").setValue([C5_W, C5_H]);
    c5gr.property("ADBE Vector Rect Roundness").setValue(24);
    var c5gs = c5gc.addProperty("ADBE Vector Graphic - Stroke");
    c5gs.property("ADBE Vector Stroke Color").setValue(HAIR_SOFT);
    c5gs.property("ADBE Vector Stroke Width").setValue(3);
    var c5gf = c5gc.addProperty("ADBE Vector Graphic - Fill");
    c5gf.property("ADBE Vector Fill Color").setValue(BRANCO);
    cal5.property("ADBE Transform Group").property("ADBE Position").setValue([FX, C5_Y, -8]);
    filho3D(cal5, cCon.card, -8);
    // mês no cabeçalho (meses passando junto)
    var mes5 = texto(t5, "Janeiro", "Sora-Bold", 40, BRANCO, FX, C5_Y - C5_H / 2 + 52, 6);
    mes5.name = "T5V-contador-mes";
    filho3D(mes5, cCon.card, -10);
    digita(mes5, [[T_CAL5, "Janeiro"], [T_CAL5 + 0.7, "Abril"], [T_CAL5 + 1.4, "Julho"],
        [T_CAL5 + 2.1, "Outubro"], [T_CAL5 + 2.8, "Dezembro"]]);
    entraCamera(cCon.card, T_CON);
    fade(cCon.lab, T_CON);
    fade(cal5, T_CON);
    fade(mes5, T_CON);

    // cards flutuando bem leve depois de encaixar
    var FLUT5 = [
        { ly: cPla.card, t0: 2.95 }, { ly: cNot.card, t0: 3.95 }, { ly: cCon.card, t0: 5.25 }
    ];
    for (var fl2 = 0; fl2 < FLUT5.length; fl2++) {
        FLUT5[fl2].ly.property("ADBE Transform Group").property("ADBE Position").expression =
            "var f = Math.min(1, Math.max(0, time - " + FLUT5[fl2].t0 + ") / 0.8); seedRandom(" + (fl2 + 7) + ", false); var v = wiggle(0.32, 13); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f, 0];";
    }

    // ==== keys do rig por último: quase frontal, encaixe limpo ====
    // flutuacao continua apos o pouso: o celular nunca trava (Pedro 18/08)
    rig.property("ADBE Transform Group").property("ADBE Position").expression =
        "var f = Math.min(1, Math.max(0, time - 1.1) / 0.9); var v = wiggle(0.33, 24); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f, 0];";
    // sem rotação: cards retos, paralelos à tela do render
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [100, 100]);
    cs.setValueAtTime(dur, [106, 106]);

    // ---- ordem ----
    for (var L2 = t5.numLayers; L2 >= 1; L2--) {
        if (t5.layer(L2).name === "T5-LETTERING") t5.layer(L2).moveToBeginning();
    }
    fundo.moveToEnd();
    for (var L3 = 1; L3 <= t5.numLayers; L3++) {
        if (t5.layer(L3).name === "BG-T5") {
            var bg = t5.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T5", camadas: t5.numLayers, versao: "v2 frontal" };
})();
