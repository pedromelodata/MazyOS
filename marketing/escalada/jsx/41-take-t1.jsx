// 41-take-t1.jsx — T1 "Madrugada" v5 (idempotente)
// Direção Pedro 14/08 (iterações): SEM partículas; fundo = gradiente radial sutil.
// Cenas narrativas GRANDES sincronizadas à locução:
//   A (0.13-2.9)  "enquanto você assiste isso" — tela + play coral (pulso) + progresso
//   B (3.03-6.0)  "alguém abrindo uma empresa" — pessoa + CARD CHECKLIST: 4 tarefas
//                 aparecem no "abrindo"; status alternados no fim de cada linha:
//                 VERDE ✓ · VERMELHO ✕ · VERDE ✓ · VERMELHO ✕ (a partir do "empresa.")
// Legenda central 125px fica por conta do rig (32-lettering.jsx v2).

(function () {
    var FPS = 30;
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var VERDE = [23 / 255, 160 / 255, 106 / 255];    // #17A06A
    var CRIMSON = [224 / 255, 62 / 255, 67 / 255];   // #E03E43
    var TEXTO_DARK = [244 / 255, 241 / 255, 236 / 255];
    var CARD_DARK = [31 / 255, 34 / 255, 40 / 255];
    var HAIRLINE = [46 / 255, 49 / 255, 58 / 255];

    var proj = app.project;
    function findItem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
    function easeChegada(prop) {
        var dims = 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) dims = 2;
        else if (t === PropertyValueType.ThreeD) dims = 3;
        var arr = [];
        for (var d = 0; d < dims; d++) arr.push(new KeyframeEase(0, 66));
        prop.setTemporalEaseAtKey(2, arr, arr);
    }
    function shapeRect(layer, nome, tam, raio, fillCor, strokeCor, strokeW) {
        var grp = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        grp.name = nome;
        var cont = grp.property("ADBE Vectors Group");
        var rc = cont.addProperty("ADBE Vector Shape - Rect");
        rc.property("ADBE Vector Rect Size").setValue(tam);
        rc.property("ADBE Vector Rect Roundness").setValue(raio);
        if (strokeCor) {
            var st = cont.addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(strokeCor);
            st.property("ADBE Vector Stroke Width").setValue(strokeW || 4);
        }
        if (fillCor) {
            var fl = cont.addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fillCor);
        }
        return grp;
    }
    function entra(layer, t0, durF, dy, scIni) {
        var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(t0, 0);
        op.setValueAtTime(t0 + durF / FPS, 100);
        easeChegada(op);
        if (dy) {
            var pos = layer.property("ADBE Transform Group").property("ADBE Position");
            var pv = pos.value;
            pos.setValueAtTime(t0, [pv[0], pv[1] + dy]);
            pos.setValueAtTime(t0 + durF / FPS, [pv[0], pv[1]]);
            easeChegada(pos);
        }
        if (scIni) {
            var sc = layer.property("ADBE Transform Group").property("ADBE Scale");
            sc.setValueAtTime(t0, [scIni, scIni]);
            sc.setValueAtTime(t0 + durF / FPS, [100, 100]);
            easeChegada(sc);
        }
    }
    function sai(layer, t0, durF, dy) {
        var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(t0, 100);
        op.setValueAtTime(t0 + durF / FPS, 0);
        if (dy) {
            var pos = layer.property("ADBE Transform Group").property("ADBE Position");
            var pv = pos.valueAtTime(t0, false);
            pos.setValueAtTime(t0, pv);
            pos.setValueAtTime(t0 + durF / FPS, [pv[0], pv[1] + dy]);
        }
    }

    var t1 = findItem("T1");
    if (!t1) { $.global.ESCALADA_RESULT = { erro: "T1 não existe" }; return; }
    var dur = t1.duration;

    // idempotência (remove também conceitos antigos)
    for (var L = t1.numLayers; L >= 1; L--) {
        if (t1.layer(L).name.indexOf("T1V-") === 0) t1.layer(L).remove();
    }
    var velhos = ["T1-FEED", "PRE-particulas"];
    for (var v = 0; v < velhos.length; v++) {
        var it = findItem(velhos[v]);
        if (it) it.remove();
    }

    // ---- fundo: gradiente radial sutil ----
    var grad = t1.layers.addSolid([21 / 255, 23 / 255, 28 / 255], "T1V-gradiente", 3840, 2160, 1, dur);
    var ramp = grad.property("ADBE Effect Parade").addProperty("ADBE Ramp");
    ramp.property("ADBE Ramp-0001").setValue([1920, 260]);
    ramp.property("ADBE Ramp-0002").setValue([42 / 255, 46 / 255, 55 / 255]);
    ramp.property("ADBE Ramp-0003").setValue([1920, 2400]);
    ramp.property("ADBE Ramp-0004").setValue([21 / 255, 23 / 255, 28 / 255]);
    ramp.property("ADBE Ramp-0005").setValue(1);

    // ---- manchas de marca (glows coral + lavagem ink, direção Pedro 14/08) ----
    function mancha(nome, tam, pos, cor, feather, opac, addMode, seed) {
        var m = t1.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
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
        if (addMode) { m.blendingMode = BlendingMode.ADD; }
        // deriva lenta + pulso de brilho bem de leve
        m.property("ADBE Transform Group").property("ADBE Position").expression =
            "value + [wiggle(0.05, 70)[0] - value[0], wiggle(0.04, 50)[1] - value[1]];";
        m.property("ADBE Transform Group").property("ADBE Scale").expression =
            "var b = 5 * Math.sin(time * 0.3 + " + seed + ");\n[value[0] + b, value[1] + b];";
        m.property("ADBE Transform Group").property("ADBE Opacity").expression =
            "value * (0.85 + 0.15 * Math.sin(time * 0.45 + " + seed + "));";
        return m;
    }
    mancha("T1V-mancha-topo", [3900, 1500], [1920, 40], CORAL, 520, 11, true, 0);
    mancha("T1V-mancha-infdir", [1500, 1150], [3400, 1900], [221 / 255, 78 / 255, 39 / 255], 480, 9, true, 2.1);

    // ---- câmera ----
    var cam = t1.layers.addNull(dur);
    cam.name = "T1V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1920, 1080]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [100, 100]);
    cs.setValueAtTime(5.5, [104, 104]);
    cs.setValueAtTime(dur, [112, 112]);

    // ==== CENA A (0.13-2.9): tela + play + progresso (20% maior) ====
    var telaA = t1.layers.addShape();
    telaA.name = "T1V-cenaA-tela";
    shapeRect(telaA, "tela", [880, 495], 40, null, HAIRLINE, 6);
    telaA.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 580]);
    telaA.parent = cam;
    entra(telaA, 0.131, 12, 40, 92);
    sai(telaA, 2.85, 8, -40);

    var play = t1.layers.addShape();
    play.name = "T1V-cenaA-play";
    var pgrp = play.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var pcont = pgrp.property("ADBE Vectors Group");
    var ppath = pcont.addProperty("ADBE Vector Shape - Group");
    var psh = new Shape();
    psh.vertices = [[-46, -64], [-46, 64], [64, 0]];
    psh.closed = true;
    ppath.property("ADBE Vector Shape").setValue(psh);
    var pfill = pcont.addProperty("ADBE Vector Graphic - Fill");
    pfill.property("ADBE Vector Fill Color").setValue(CORAL);
    play.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 580]);
    play.parent = cam;
    entra(play, 1.551, 8, 0, 35);
    var psc = play.property("ADBE Transform Group").property("ADBE Scale");
    psc.setValueAtTime(1.991, [100, 100]);
    psc.setValueAtTime(1.991 + 4 / FPS, [112, 112]);
    psc.setValueAtTime(1.991 + 8 / FPS, [100, 100]);
    sai(play, 2.85, 8, -40);

    // anéis de pulso emanando do play (o vídeo "tocando")
    for (var an = 0; an < 2; an++) {
        var anel = t1.layers.addShape();
        anel.name = "T1V-cenaA-anel" + (an + 1);
        var agrp = anel.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var acont = agrp.property("ADBE Vectors Group");
        var ael = acont.addProperty("ADBE Vector Shape - Ellipse");
        ael.property("ADBE Vector Ellipse Size").setValue([200, 200]);
        var ast = acont.addProperty("ADBE Vector Graphic - Stroke");
        ast.property("ADBE Vector Stroke Color").setValue(CORAL);
        ast.property("ADBE Vector Stroke Width").setValue(6);
        anel.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 580]);
        anel.parent = cam;
        var fase = an * 0.6;
        anel.property("ADBE Transform Group").property("ADBE Scale").expression =
            "var p = ((time - " + fase + ") % 1.2) / 1.2;\n[100 + p * 130, 100 + p * 130];";
        anel.property("ADBE Transform Group").property("ADBE Opacity").expression =
            "if (time < 1.65 || time > 2.8) { 0 } else { var p = ((time - " + fase + ") % 1.2) / 1.2;\n(1 - p) * 45 }";
    }

    // equalizer de 5 barras dançando na base da tela (o som do vídeo)
    var eqX = [1790, 1855, 1920, 1985, 2050];
    var eqF = [5.2, 7.1, 6.0, 8.3, 5.7];
    for (var eb = 0; eb < 5; eb++) {
        var barra = t1.layers.addShape();
        barra.name = "T1V-cenaA-eq" + (eb + 1);
        shapeRect(barra, "eq", [26, 100], 13, (eb % 2 === 0) ? CORAL : TEXTO_DARK, null, 0);
        barra.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 50]);
        barra.property("ADBE Transform Group").property("ADBE Position").setValue([eqX[eb], 790]);
        barra.parent = cam;
        barra.property("ADBE Transform Group").property("ADBE Scale").expression =
            "[100, 30 + 70 * Math.abs(Math.sin(time * " + eqF[eb] + " + " + (eb * 1.3).toFixed(1) + "))];";
        entra(barra, 0.5 + eb * 0.07, 6, 20, 0);
        sai(barra, 2.85, 8, -40);
    }

    var progT = t1.layers.addShape();
    progT.name = "T1V-cenaA-trilho";
    shapeRect(progT, "trilho", [680, 12], 6, HAIRLINE, null, 0);
    progT.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 920]);
    progT.parent = cam;
    entra(progT, 0.45, 8, 20, 0);
    sai(progT, 2.85, 8, -40);

    var progF = t1.layers.addShape();
    progF.name = "T1V-cenaA-progresso";
    shapeRect(progF, "fill", [680, 12], 6, CORAL, null, 0);
    progF.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([-340, 0]);
    progF.property("ADBE Transform Group").property("ADBE Position").setValue([1580, 920]);
    var fsc = progF.property("ADBE Transform Group").property("ADBE Scale");
    fsc.setValueAtTime(0.6, [0, 100]);
    fsc.setValueAtTime(2.7, [62, 100]);
    progF.parent = cam;
    sai(progF, 2.85, 8, -40);

    // ==== CENA B (3.03-6.0): pessoa + card checklist (25% maior) ====
    var pessoa = t1.layers.addShape();
    pessoa.name = "T1V-cenaB-pessoa";
    var bgrp = pessoa.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var bcont = bgrp.property("ADBE Vectors Group");
    var bhead = bcont.addProperty("ADBE Vector Shape - Ellipse");
    bhead.property("ADBE Vector Ellipse Size").setValue([124, 124]);
    bhead.property("ADBE Vector Ellipse Position").setValue([0, -104]);
    var bbody = bcont.addProperty("ADBE Vector Shape - Rect");
    bbody.property("ADBE Vector Rect Size").setValue([232, 134]);
    bbody.property("ADBE Vector Rect Roundness").setValue(67);
    bbody.property("ADBE Vector Rect Position").setValue([0, 56]);
    var bfill = bcont.addProperty("ADBE Vector Graphic - Fill");
    bfill.property("ADBE Vector Fill Color").setValue(TEXTO_DARK);
    pessoa.property("ADBE Transform Group").property("ADBE Position").setValue([1440, 620]);
    pessoa.parent = cam;
    var ppos = pessoa.property("ADBE Transform Group").property("ADBE Position");
    ppos.setValueAtTime(3.032, [1270, 620]);
    ppos.setValueAtTime(3.032 + 10 / FPS, [1440, 620]);
    easeChegada(ppos);
    var pop2 = pessoa.property("ADBE Transform Group").property("ADBE Opacity");
    pop2.setValueAtTime(3.032, 0);
    pop2.setValueAtTime(3.032 + 8 / FPS, 100);
    sai(pessoa, 6.0, 10, -60);

    // card checklist
    var CARD_X = 2240, CARD_Y = 620;
    var form = t1.layers.addShape();
    form.name = "T1V-cenaB-card";
    shapeRect(form, "card", [660, 500], 28, CARD_DARK, HAIRLINE, 3);
    form.property("ADBE Transform Group").property("ADBE Position").setValue([CARD_X, CARD_Y]);
    form.parent = cam;
    entra(form, 4.072, 10, 50, 94);
    sai(form, 6.0, 10, -60);

    // 4 tarefas: barra + status no fim da linha (verde, vermelho, verde, vermelho)
    var linhasY = [-165, -55, 55, 165];
    var linhasW = [360, 300, 340, 280];
    var linhasT = [4.25, 4.45, 4.65, 4.85];
    var statusT = [4.95, 5.16, 5.37, 5.58];
    var statusVerde = [true, false, true, false];
    for (var lb = 0; lb < 4; lb++) {
        var lin = t1.layers.addShape();
        lin.name = "T1V-cenaB-linha" + (lb + 1);
        shapeRect(lin, "linha", [linhasW[lb], 20], 10, HAIRLINE, null, 0);
        lin.property("ADBE Transform Group").property("ADBE Position")
            .setValue([CARD_X - 290 + linhasW[lb] / 2 + 40, CARD_Y + linhasY[lb]]);
        lin.parent = cam;
        entra(lin, linhasT[lb], 6, 0, 40);
        sai(lin, 6.0, 10, -60);

        var st = t1.layers.addShape();
        st.name = "T1V-cenaB-status" + (lb + 1);
        var sgrp = st.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var scont = sgrp.property("ADBE Vectors Group");
        var scirc = scont.addProperty("ADBE Vector Shape - Ellipse");
        scirc.property("ADBE Vector Ellipse Size").setValue([84, 84]);
        var sfill = scont.addProperty("ADBE Vector Graphic - Fill");
        sfill.property("ADBE Vector Fill Color").setValue(statusVerde[lb] ? VERDE : CRIMSON);
        var mgrp = st.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var mcont = mgrp.property("ADBE Vectors Group");
        if (statusVerde[lb]) {
            var mp = mcont.addProperty("ADBE Vector Shape - Group");
            var msh = new Shape();
            msh.vertices = [[-22, 2], [-6, 18], [24, -16]];
            msh.closed = false;
            mp.property("ADBE Vector Shape").setValue(msh);
            var mst = mcont.addProperty("ADBE Vector Graphic - Stroke");
            mst.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
            mst.property("ADBE Vector Stroke Width").setValue(12);
            mst.property("ADBE Vector Stroke Line Cap").setValue(2);
        } else {
            var x1 = mcont.addProperty("ADBE Vector Shape - Group");
            var xs1 = new Shape();
            xs1.vertices = [[-16, -16], [16, 16]];
            xs1.closed = false;
            x1.property("ADBE Vector Shape").setValue(xs1);
            var x2 = mcont.addProperty("ADBE Vector Shape - Group");
            var xs2 = new Shape();
            xs2.vertices = [[16, -16], [-16, 16]];
            xs2.closed = false;
            x2.property("ADBE Vector Shape").setValue(xs2);
            var xst = mcont.addProperty("ADBE Vector Graphic - Stroke");
            xst.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
            xst.property("ADBE Vector Stroke Width").setValue(12);
            xst.property("ADBE Vector Stroke Line Cap").setValue(2);
        }
        st.property("ADBE Transform Group").property("ADBE Position").setValue([CARD_X + 240, CARD_Y + linhasY[lb]]);
        st.parent = cam;
        entra(st, statusT[lb], 7, 0, 25);
        sai(st, 6.0, 10, -60);
    }

    // ordem: lettering topo, gradiente acima do BG, BG fundo
    for (var L2 = t1.numLayers; L2 >= 1; L2--) {
        if (t1.layer(L2).name === "T1-LETTERING") t1.layer(L2).moveToBeginning();
    }
    for (var L4 = 1; L4 <= t1.numLayers; L4++) {
        if (t1.layer(L4).name === "T1V-gradiente") { t1.layer(L4).moveToEnd(); break; }
    }
    for (var L5 = 1; L5 <= t1.numLayers; L5++) {
        if (t1.layer(L5).name === "BG-T1") {
            var bg = t1.layer(L5);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T1", camadas: t1.numLayers, conceito: "cenas narrativas v5 (checklist, sem particulas)" };
})();
