// 44-take-t4.jsx — T4 "0,7%" (idempotente) — CONTINUAÇÃO DIRETA do T3 v020.
// Direção Pedro 17/08: abre no estado final do T3 (mesma espiral/seed, disco
// ainda girando devagar, card 7,4 MILHÕES embaixo, cam 98.2 SEM zoom).
// NOTA (20/08): rodar 54-contador-fix.jsx DEPOIS — sem card, "7.400.000".
//   0-3.6s  pergunta: giro desacelera até PARAR no "disso?" (3.05); card apaga
//   4.425s  "0,7%": varredura aleatória APAGA a multidão (sobra 1 ícone de 150
//           = 0,67%) + "0,7%" coral-600 gigante estampa ao lado direito
//   ~4.7s   a pessoa coral some junto com a massa (ninguém cuida dela)
//   6.6-8.7 "menos de uma em cada 100." sobre o vazio; sobrevivente pulsa sutil
// Mesma seed LCG do T3 => layout idêntico da multidão (continuidade de corte).

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];
    var INK_900 = [27 / 255, 30 / 255, 36 / 255];

    var CX = 1920, CY = 1120;
    var T_APAGA = 5.03;      // palavra "0,7%"
    var T_PARA_GIRO = 3.6;    // depois do "disso?"
    // Pedro 18/08: no "Menos de uma..." (lettering 6.66) UM ícone vai pra
    // esquerda vazia; no "em cada cem." (7.93) um BOLO de 99 se forma em volta
    // e ele se destaca maior e brilhante (1 em cada 100)
    var T_HERO = 6.07, T_BOLO = 6.83;
    var HX = 820, HY = 1160; // bem à esquerda (Pedro 18/08)

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
    // MESMA seed do T3 -> mesma multidão
    var seed = 987654321;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

    var t4 = findComp("T4");
    if (!t4) { $.global.ESCALADA_RESULT = { erro: "T4 não existe" }; return; }
    var dur = t4.duration; // 10.2
    t4.time = 0; // parent-preserve usa o playhead

    for (var L = t4.numLayers; L >= 1; L--) {
        if (t4.layer(L).name.indexOf("T4V-") === 0) t4.layer(L).remove();
    }

    // ---- fundo papel + manchas ----
    var fundo = t4.layers.addSolid(PAPEL, "T4V-fundo-papel", 3840, 2160, 1, dur);
    function mancha(nome, tam, pos, cor, feather, opac, seedM) {
        var m = t4.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
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
        m.property("ADBE Transform Group").property("ADBE Opacity").expression =
            "value * (0.85 + 0.15 * Math.sin(time * 0.45 + " + seedM + "));";
        return m;
    }
    mancha("T4V-mancha-topo", [3900, 1400], [1920, 20], CORAL, 520, 9, 2.1);
    mancha("T4V-mancha-infdir", [1500, 1150], [3500, 1990], CORAL600, 480, 7, 4.2);

    // ---- CAM: continua do 98.2 do fim do T3, SEM zoom (reunião 13/08) ----
    var cam = t4.layers.addNull(dur);
    cam.name = "T4V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([CX, CY]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);

    // ---- glyph de pessoa (idêntico ao T3) ----
    function poeIcone(shapeLayer, x, y, esc, rot, cor) {
        var g = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var tr = g.property("ADBE Vector Transform Group");
        tr.property("ADBE Vector Position").setValue([x, y]);
        tr.property("ADBE Vector Scale").setValue([esc * 100, esc * 100]);
        tr.property("ADBE Vector Rotation").setValue(rot);
        var cont = g.property("ADBE Vectors Group");
        var cab = cont.addProperty("ADBE Vector Shape - Ellipse");
        cab.property("ADBE Vector Ellipse Size").setValue([26, 26]);
        cab.property("ADBE Vector Ellipse Position").setValue([0, -24]);
        var corpo = cont.addProperty("ADBE Vector Shape - Rect");
        corpo.property("ADBE Vector Rect Size").setValue([46, 38]);
        corpo.property("ADBE Vector Rect Position").setValue([0, 14]);
        corpo.property("ADBE Vector Rect Roundness").setValue(19);
        var fl = cont.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(cor);
        return g;
    }

    // ---- multidão: MESMO layout do T3 (fase 1: calcula tudo; fase 2: cria
    // e keya cada grupo NA HORA — referências a Vector Group invalidam quando
    // outro grupo é adicionado depois) ----
    var N_ICONES = 150, R_MIN = 90, R_MAX = 600;
    var AURO = 2.39996322972865;
    var faseEsp = rnd() * Math.PI * 2;
    var layout = [], sobreviventeIdx = -1;
    for (var mi = 0; mi < N_ICONES; mi++) {
        var frac = mi / (N_ICONES - 1);
        var rEsp = R_MIN + (R_MAX - R_MIN) * Math.sqrt(frac);
        var aEsp = faseEsp + mi * AURO;
        var xEsp = Math.cos(aEsp) * rEsp;
        var yEsp = Math.sin(aEsp) * rEsp * 0.94;
        var escEsp = 0.88 + rnd() * 0.26;         // mesma ordem de rnd do T3
        var rotEsp = (rnd() - 0.5) * 9;
        layout.push({ x: xEsp, y: yEsp, esc: escEsp, rot: rotEsp });
        if (sobreviventeIdx < 0 && xEsp > 120 && xEsp < 320 && Math.abs(yEsp) < 160) sobreviventeIdx = mi;
    }
    // 6 sobreviventes bem espalhados (um por setor de 60 graus, raio médio)
    var setores = [0, 60, 120, 180, 240, 300];
    var escolhidos = [];
    for (var se = 0; se < setores.length; se++) {
        var melhor = -1, melhorDist = 1e9;
        for (var li = 0; li < N_ICONES; li++) {
            var rr2 = Math.sqrt(layout[li].x * layout[li].x + layout[li].y * layout[li].y);
            if (rr2 < 180 || rr2 > 520) continue;
            var ang2 = Math.atan2(layout[li].y, layout[li].x) * 180 / Math.PI;
            if (ang2 < 0) ang2 += 360;
            var d2 = Math.abs(ang2 - setores[se]);
            if (d2 > 180) d2 = 360 - d2;
            if (d2 < melhorDist) { melhorDist = d2; melhor = li; }
        }
        if (melhor >= 0) escolhidos.push(melhor);
    }
    // APENAS 2 CORES nos ícones (Pedro 18/08): ink-900 (massa) + coral-600 (quem acende)
    var TONS = [CORAL600, CORAL600, CORAL600, CORAL600, CORAL600, CORAL600];
    escolhidos.sort(function (a, b) { return layout[a].x - layout[b].x; });
    var tomDe = {};
    for (var te = 0; te < escolhidos.length; te++) tomDe[escolhidos[te]] = TONS[te];
    for (var oi = 0; oi < N_ICONES; oi++) layout[oi].tOff = T_APAGA + rnd() * 0.75;
    var heroIdx = escolhidos[0]; // o mais à esquerda vira o HERÓI do "1 em cada 100"

    var multidao = t4.layers.addShape();
    multidao.name = "T4V-multidao";
    for (var ci = 0; ci < N_ICONES; ci++) {
        var it2 = layout[ci];
        var gI = poeIcone(multidao, it2.x, it2.y, it2.esc, it2.rot, INK_900);
        var trV = gI.property("ADBE Vector Transform Group");
        var e0 = it2.esc * 100;
        if (tomDe[ci]) {
            // sobrevivente: se ACENDE em coral (gradiente) e cresce com pop
            var flP = gI.property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");
            flP.setValueAtTime(T_APAGA, INK_900);
            flP.setValueAtTime(T_APAGA + 9 / FPS, tomDe[ci]);
            var scS = trV.property("ADBE Vector Scale");
            scS.setValueAtTime(T_APAGA, [e0, e0]);
            scS.setValueAtTime(T_APAGA + 8 / FPS, [e0 * 1.75, e0 * 1.75]);
            var eSv = [new KeyframeEase(0, 66), new KeyframeEase(0, 66)];
            scS.setTemporalEaseAtKey(2, eSv, eSv);
            // vida orgânica pós-acender: deriva lateral + balanço, fase própria
            var posP = trV.property("ADBE Vector Position");
            posP.expression = "var f = Math.min(1, Math.max(0, time - 4.6) / 1.2); seedRandom(" + ci + ", false); var w = wiggle(0.38, 34); value + [(w[0] - value[0]) * f, (w[1] - value[1]) * 0.4 * f];";
            var rotP = trV.property("ADBE Vector Rotation");
            rotP.expression = "var f = Math.min(1, Math.max(0, time - 4.6) / 1.2); value + Math.sin(time * 0.9 + " + ci + ") * 4 * f;";
            if (ci === heroIdx) {
                // o herói sai da multidão (a camada T4V-heroi assume no mesmo lugar)
                var opH = trV.property("ADBE Vector Group Opacity");
                opH.setValueAtTime(T_HERO, 100);
                opH.setValueAtTime(T_HERO + 3 / FPS, 0);
            }
        } else {
            // some de vez (referência anterior)
            var scV = trV.property("ADBE Vector Scale");
            scV.setValueAtTime(it2.tOff, [e0, e0]);
            scV.setValueAtTime(it2.tOff + 5 / FPS, [0, 0]);
            var opV = trV.property("ADBE Vector Group Opacity");
            opV.setValueAtTime(it2.tOff, 100);
            opV.setValueAtTime(it2.tOff + 5 / FPS, 0);
        }
    }
    multidao.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
    multidao.parent = cam;
    multidao.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);

    // ---- pessoa coral: some junto com a massa ----
    var um = t4.layers.addShape();
    um.name = "T4V-a-pessoa";
    poeIcone(um, 0, 0, 1.5, 0, CORAL600);
    um.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
    um.parent = cam;
    um.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    var umOp = um.property("ADBE Transform Group").property("ADBE Opacity");
    umOp.setValueAtTime(4.7, 100);
    umOp.setValueAtTime(4.7 + 6 / FPS, 0);

    // ---- giro: continua do T3 (9°, ~2.2°/s) e desacelera até parar ----
    var mrot = multidao.property("ADBE Transform Group").property("ADBE Rotate Z");
    mrot.setValueAtTime(0, 9);
    mrot.setValueAtTime(T_PARA_GIRO, 13);
    easeK(mrot, 2); // chega parando
    var urot = um.property("ADBE Transform Group").property("ADBE Rotate Z");
    urot.setValueAtTime(0, 0); // a coral não gira (é o eixo)

    // ---- HERÓI: "Menos de uma..." -> um ícone voa pra ESQUERDA vazia;
    // "em cada cem." -> BOLO de 99 ícones se forma em volta e ele se DESTACA
    // maior e brilhante (Pedro 18/08)
    var hl = layout[heroIdx];
    var thetaH = 13 * Math.PI / 180; // rotação final da multidão (parada em 13°)
    var hx0 = CX + hl.x * Math.cos(thetaH) - hl.y * Math.sin(thetaH);
    var hy0 = CY + hl.x * Math.sin(thetaH) + hl.y * Math.cos(thetaH);
    var heroi = t4.layers.addShape();
    heroi.name = "T4V-heroi";
    poeIcone(heroi, 0, 0, hl.esc * 1.4, 0, CORAL600);
    heroi.property("ADBE Transform Group").property("ADBE Position").setValue([hx0, hy0]);
    heroi.parent = cam;
    heroi.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    heroi.property("ADBE Transform Group").property("ADBE Position").setValue([hx0, hy0]);
    var hPos = heroi.property("ADBE Transform Group").property("ADBE Position");
    hPos.setValueAtTime(T_HERO, [hx0, hy0]);
    hPos.setValueAtTime(T_HERO + 0.6, [HX, HY]);
    easeK(hPos, 2);
    var hOp = heroi.property("ADBE Transform Group").property("ADBE Opacity");
    hOp.setValueAtTime(T_HERO - 3 / FPS, 0);
    hOp.setValueAtTime(T_HERO + 2 / FPS, 100);
    // destaque no "em cada cem.": cresce com pop e respira
    var hSc = heroi.property("ADBE Transform Group").property("ADBE Scale");
    hSc.setValueAtTime(T_BOLO, [100, 100]);
    hSc.setValueAtTime(T_BOLO + 0.28, [148, 148]);
    hSc.setValueAtTime(T_BOLO + 0.42, [138, 138]);
    easeK(hSc, 2);
    hSc.expression = "var p = Math.min(1, Math.max(0, time - " + (T_BOLO + 0.5) + ") / 0.5); value * (1 + 0.045 * p * Math.sin(time * 2.2));";
    // flutuação orgânica contínua
    hPos.expression = "var f = Math.min(1, Math.max(0, time - " + (T_HERO + 0.7) + ") / 0.8); seedRandom(77, false); var v = wiggle(0.35, 13); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f];";
    // (sem glow: na referencia o destaque vem do contraste + clareira)

    // ---- BOLO: 99 ícones ink-900 pipocando EM VOLTA do herói (1 em cada 100) ----
    var bolo = t4.layers.addShape();
    bolo.name = "T4V-bolo";
    // espiral aurea (mesma tecnica da multidao do T3): espacamento UNIFORME,
    // cada icone no seu espaco, sem amontoar (Pedro 19/08)
    for (var bi2 = 0; bi2 < 99; bi2++) {
        var aB = 0.6 + bi2 * 2.39996322972865;
        var rB = 118 + (300 - 118) * Math.sqrt(bi2 / 98);
        var xB = Math.cos(aB) * rB;
        var yB = Math.sin(aB) * rB * 0.85;
        var eB2 = 0.52 + rnd() * 0.2;
        var gB = poeIcone(bolo, xB, yB, eB2, (rnd() - 0.5) * 12, INK_900);
        var trB = gB.property("ADBE Vector Transform Group");
        var tB = T_BOLO + (bi2 / 99) * 0.85 + rnd() * 0.06;
        var sB = trB.property("ADBE Vector Scale");
        sB.setValueAtTime(tB, [0, 0]);
        sB.setValueAtTime(tB + 6 / FPS, [eB2 * 115, eB2 * 115]);
        sB.setValueAtTime(tB + 9 / FPS, [eB2 * 100, eB2 * 100]);
        var oB = trB.property("ADBE Vector Group Opacity");
        oB.setValueAtTime(tB, 0);
        oB.setValueAtTime(tB + 3 / FPS, 100);
    }
    bolo.property("ADBE Transform Group").property("ADBE Position").setValue([HX, HY]);
    bolo.parent = cam;
    bolo.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    bolo.property("ADBE Transform Group").property("ADBE Position").setValue([HX, HY]);
    // vida orgânica do bolo inteiro (wiggle barato no layer, não por grupo)
    bolo.property("ADBE Transform Group").property("ADBE Position").expression =
        "var f = Math.min(1, Math.max(0, time - " + (T_BOLO + 0.9) + ") / 0.9); seedRandom(88, false); var v = wiggle(0.3, 10); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f];";
    bolo.property("ADBE Transform Group").property("ADBE Rotate Z").expression = "Math.sin(time * 0.5) * 1.5;";
    heroi.moveBefore(bolo); // herói na FRENTE do bolo

    // ---- CAM keys por último: 98.2 fixo (sem zoom), micro drift ----
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [98.2, 98.2]);
    cs.setValueAtTime(dur, [99, 99]);

    // ---- card 7,4 MILHÕES (estado final do T3) que apaga na pergunta ----
    var chip = t4.layers.addShape();
    chip.name = "T4V-contador-card";
    var chGrp = chip.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var chCont = chGrp.property("ADBE Vectors Group");
    var chRect = chCont.addProperty("ADBE Vector Shape - Rect");
    chRect.property("ADBE Vector Rect Size").setValue([1150, 240]);
    chRect.property("ADBE Vector Rect Roundness").setValue(28);
    var chSt = chCont.addProperty("ADBE Vector Graphic - Stroke");
    chSt.property("ADBE Vector Stroke Color").setValue([227 / 255, 222 / 255, 215 / 255]);
    chSt.property("ADBE Vector Stroke Width").setValue(3);
    var chFl = chCont.addProperty("ADBE Vector Graphic - Fill");
    chFl.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
    chip.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1855]);
    var chOp = chip.property("ADBE Transform Group").property("ADBE Opacity");
    chOp.setValueAtTime(3.05, 100);
    chOp.setValueAtTime(3.55, 0);

    var m74 = t4.layers.addText("7,4 MILHÕES");
    m74.name = "T4V-74milhoes";
    var mdoc = m74.property("ADBE Text Properties").property("ADBE Text Document");
    var mtd = mdoc.value;
    mtd.resetCharStyle();
    mtd.font = "Sora-Bold";
    mtd.fontSize = 170;
    mtd.fillColor = CORAL600;
    mtd.applyStroke = false;
    mtd.tracking = 20;
    mtd.justification = ParagraphJustification.CENTER_JUSTIFY;
    mdoc.setValue(mtd);
    m74.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1915]);
    var mOp = m74.property("ADBE Transform Group").property("ADBE Opacity");
    mOp.setValueAtTime(3.05, 100);
    mOp.setValueAtTime(3.55, 0);

    // ---- "0,7%" gigante coral estampa ao lado direito ----
    var p07 = t4.layers.addText("0,7%");
    p07.name = "T4V-07";
    var pdoc = p07.property("ADBE Text Properties").property("ADBE Text Document");
    var ptd = pdoc.value;
    ptd.resetCharStyle();
    ptd.font = "Sora-Bold";
    ptd.fontSize = 400;
    ptd.fillColor = CORAL600;
    ptd.applyStroke = false;
    ptd.tracking = -10;
    ptd.justification = ParagraphJustification.CENTER_JUSTIFY;
    pdoc.setValue(ptd);
    p07.property("ADBE Transform Group").property("ADBE Position").setValue([3080, 1230]);
    var pOp = p07.property("ADBE Transform Group").property("ADBE Opacity");
    pOp.setValueAtTime(T_APAGA, 0);
    pOp.setValueAtTime(T_APAGA + 3 / FPS, 100);
    var pSc = p07.property("ADBE Transform Group").property("ADBE Scale");
    pSc.setValueAtTime(T_APAGA, [118, 118]);
    pSc.setValueAtTime(T_APAGA + 5 / FPS, [100, 100]);
    easeK(pSc, 2);

    // ---- ordem ----
    for (var L2 = t4.numLayers; L2 >= 1; L2--) {
        if (t4.layer(L2).name === "T4-LETTERING") t4.layer(L2).moveToBeginning();
    }
    fundo.moveToEnd();
    for (var L3 = 1; L3 <= t4.numLayers; L3++) {
        if (t4.layer(L3).name === "BG-T4") {
            var bg = t4.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T4", camadas: t4.numLayers, sobrevivente: sobreviventeIdx };
})();
