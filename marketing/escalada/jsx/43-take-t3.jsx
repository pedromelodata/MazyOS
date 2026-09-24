// 43-take-t3.jsx — T3 "Não é uma pessoa. São 7,4 milhões." (idempotente)
// NOTA (20/08): rodar 54-contador-fix.jsx DEPOIS — remove o card branco,
// deixa a rolagem coral com blur e o final "7.400.000" por extenso.
// Direção Pedro 17/08: começa FOCADO em UM ícone (zoom 480%), câmera AFASTA a
// partir do "São" (2.55s) e, enquanto afasta, chove ícone preenchendo um
// CÍRCULO só no miolo da tela (nada de tela cheia). Contador rola 1 -> 7.400.000
// embaixo e estala em "7,4 MILHÕES" coral. Mundo papel (continuidade do T2).
// Rig: CAM null estático -> parenta anéis -> keys por último (lição do T2).

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];
    var INK_900 = [27 / 255, 30 / 255, 36 / 255];
    var INK_700 = [52 / 255, 54 / 255, 60 / 255];
    var INK_600 = [82 / 255, 78 / 255, 72 / 255];
    var INK_500 = [115 / 255, 110 / 255, 103 / 255];

    var CX = 1920, CY = 1120;         // centro do aglomerado
    var T_ZOOM_INI = 2.55, T_ZOOM_FIM = 5.9;

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
    // LCG pra jitter determinístico (rebuild não muda a multidão)
    var seed = 987654321;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }

    var t3 = findComp("T3");
    if (!t3) { $.global.ESCALADA_RESULT = { erro: "T3 não existe" }; return; }
    var dur = t3.duration; // 9.8333

    for (var L = t3.numLayers; L >= 1; L--) {
        if (t3.layer(L).name.indexOf("T3V-") === 0) t3.layer(L).remove();
    }

    // ---- fundo papel + manchas (mesma linguagem do T2) ----
    var fundo = t3.layers.addSolid(PAPEL, "T3V-fundo-papel", 3840, 2160, 1, dur);
    function mancha(nome, tam, pos, cor, feather, opac, seedM) {
        var m = t3.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
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
    mancha("T3V-mancha-topo", [3900, 1400], [1920, 20], CORAL, 520, 9, 1.4);
    mancha("T3V-mancha-infesq", [1500, 1150], [400, 1980], CORAL600, 480, 7, 3.6);

    // ---- CAM (estático agora, keys no FINAL) ----
    var cam = t3.layers.addNull(dur);
    cam.name = "T3V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([CX, CY]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);

    // ---- glyph de pessoa: cabeça + busto arredondado, num grupo por ícone ----
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
    // ---- multidão em ESPIRAL dourada (phyllotaxis), 1 a 1, todos ink-900 ----
    // direção Pedro 17/08: surgem um por um de dentro pra fora, pretinhos
    var N_ICONES = 150, R_MIN = 90, R_MAX = 600;
    var T_SURGE0 = 2.7, T_SURGE1 = 5.7;
    var AURO = 2.39996322972865; // ângulo de ouro
    var multidao = t3.layers.addShape();
    multidao.name = "T3V-multidao";
    var faseEsp = rnd() * Math.PI * 2;
    for (var mi = 0; mi < N_ICONES; mi++) {
        var frac = mi / (N_ICONES - 1);
        var rEsp = R_MIN + (R_MAX - R_MIN) * Math.sqrt(frac);
        var aEsp = faseEsp + mi * AURO;
        var xEsp = Math.cos(aEsp) * rEsp;
        var yEsp = Math.sin(aEsp) * rEsp * 0.94;
        var escEsp = 0.88 + rnd() * 0.26;
        var gI = poeIcone(multidao, xEsp, yEsp, escEsp, (rnd() - 0.5) * 9, INK_900);
        var tAp = T_SURGE0 + (T_SURGE1 - T_SURGE0) * Math.pow(frac, 0.9);
        var trI = gI.property("ADBE Vector Transform Group");
        var scI = trI.property("ADBE Vector Scale");
        scI.setValueAtTime(tAp, [0, 0]);
        scI.setValueAtTime(tAp + 4 / FPS, [escEsp * 100, escEsp * 100]);
        var e2 = [new KeyframeEase(0, 66), new KeyframeEase(0, 66)];
        scI.setTemporalEaseAtKey(2, e2, e2);
        var opI = trI.property("ADBE Vector Group Opacity");
        opI.setValueAtTime(tAp, 0);
        opI.setValueAtTime(tAp + 2 / FPS, 100);
    }
    multidao.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
    multidao.parent = cam;
    multidao.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    // depois que todos entram, o disco gira devagar (direção Pedro 17/08)
    var mrot = multidao.property("ADBE Transform Group").property("ADBE Rotate Z");
    mrot.setValueAtTime(T_SURGE1, 0);
    mrot.setValueAtTime(dur, 9);
    var eIn = [new KeyframeEase(0, 55)];
    mrot.setTemporalEaseAtKey(1, eIn, eIn);

    // ---- a UMA pessoa (coral, maior, presente desde o frame 0) ----
    var um = t3.layers.addShape();
    um.name = "T3V-a-pessoa";
    poeIcone(um, 0, 0, 1.5, 0, CORAL600);
    um.property("ADBE Transform Group").property("ADBE Position").setValue([CX, CY]);
    um.parent = cam;
    um.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);

    // ---- keys da CAM por último: 480% (um ícone) -> 100% + drift final ----
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [480, 480]);
    cs.setValueAtTime(T_ZOOM_INI, [480, 480]);
    cs.setValueAtTime(T_ZOOM_FIM, [100, 100]);
    easeK(cs, 2); easeK(cs, 3);
    cs.setValueAtTime(7.0, [100, 100]);
    cs.setValueAtTime(dur, [98.2, 98.2]);

    // ---- contador embaixo: rola 1 -> 7.400.000 e estala 7,4 MILHÕES coral ----
    // card branco DS atrás (senão os dígitos pretos somem nos ícones pretos)
    var chip = t3.layers.addShape();
    chip.name = "T3V-contador-card";
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
    chOp.setValueAtTime(3.0, 0);
    chOp.setValueAtTime(3.2, 100);

    var cont = t3.layers.addText("1");
    cont.name = "T3V-contador";
    var cdoc = cont.property("ADBE Text Properties").property("ADBE Text Document");
    var ctd = cdoc.value;
    ctd.resetCharStyle();
    ctd.font = "Sora-Bold";
    ctd.fontSize = 170;
    ctd.fillColor = INK_900;
    ctd.applyStroke = false;
    ctd.tracking = 20;
    ctd.justification = ParagraphJustification.CENTER_JUSTIFY;
    cdoc.setValue(ctd);
    cont.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1885]);
    function fmt(v) {
        var s = String(Math.round(v)), out = "";
        while (s.length > 3) { out = "." + s.substring(s.length - 3) + out; s = s.substring(0, s.length - 3); }
        return s + out;
    }
    var ALVO = 7400000, T_ROLA0 = 2.4, T_ROLA1 = 5.6, T_SNAP = 6.2;
    var passo = 2 / FPS, anterior = null;
    for (var t = T_ROLA0; t <= T_ROLA1 + 0.001; t += passo) {
        var p = (t - T_ROLA0) / (T_ROLA1 - T_ROLA0);
        var v = Math.round(Math.exp(Math.log(ALVO) * p));
        if (v === anterior) continue;
        anterior = v;
        var td2 = cdoc.value; td2.text = fmt(v); cdoc.setValueAtTime(t, td2);
    }
    var tds = cdoc.value; tds.text = fmt(ALVO); cdoc.setValueAtTime(T_ROLA1, tds);
    var tdc = cdoc.value; tdc.text = "7,4 MILHÕES"; tdc.fillColor = CORAL600; cdoc.setValueAtTime(T_SNAP, tdc);
    var cop = cont.property("ADBE Transform Group").property("ADBE Opacity");
    cop.setValueAtTime(3.0, 0);
    cop.setValueAtTime(3.2, 100);
    var csc = cont.property("ADBE Transform Group").property("ADBE Scale");
    csc.setValueAtTime(T_SNAP, [112, 112]);
    csc.setValueAtTime(T_SNAP + 6 / FPS, [100, 100]);
    easeK(csc, 2);

    // ---- scrim de papel atrás da faixa da legenda (Pedro 17/08: nenhum
    // elemento visual por cima/atrapalhando a legenda) ----
    var scrim = t3.layers.addSolid(PAPEL, "T3V-scrim-legenda", 3840, 2160, 1, dur);
    var smk = scrim.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var ss = new Shape();
    ss.vertices = [[-200, 60], [4040, 60], [4040, 600], [-200, 600]];
    ss.closed = true;
    smk.property("ADBE Mask Shape").setValue(ss);
    smk.property("ADBE Mask Feather").setValue([0, 130]);
    scrim.property("ADBE Transform Group").property("ADBE Opacity").setValue(90);

    // ---- ordem: LETTERING topo > scrim > contador > pessoa > espiral > CAM > manchas > fundo > BG ----
    for (var L2 = t3.numLayers; L2 >= 1; L2--) {
        if (t3.layer(L2).name === "T3-LETTERING") t3.layer(L2).moveToBeginning();
    }
    fundo.moveToEnd();
    for (var L3 = 1; L3 <= t3.numLayers; L3++) {
        if (t3.layer(L3).name === "BG-T3") {
            var bg = t3.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T3", camadas: t3.numLayers, icones: 151 };
})();
