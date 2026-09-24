// 48-polimento.jsx — ACABAMENTO GLOBAL (idempotente; rodar APÓS os take-scripts)
// Direção Pedro 18/08: motion blur onde há movimento rápido; drop shadow em
// celular/cards (cartão flutuante); glow nas estrelas e polish global sutil;
// dot grid nos fundos de cena "de dados"; tilt 3D leve nos chips estáticos;
// extrusão FAKE no mapa do T6 (espessura + sombra = bloco flutuante).

(function () {
    var proj = app.project;
    function comp(n) {
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it.name === n) return it;
        }
        return null;
    }
    function lay(c, n) {
        for (var i = 1; i <= c.numLayers; i++) { if (c.layer(i).name === n) return c.layer(i); }
        return null;
    }
    function temFx(ly, matchName) {
        var fx = ly.property("ADBE Effect Parade");
        for (var i = 1; i <= fx.numProperties; i++) { if (fx.property(i).matchName === matchName) return true; }
        return false;
    }
    function sombra(ly, opac255, dist, soft) {
        if (!ly || temFx(ly, "ADBE Drop Shadow")) return;
        try {
            var fx = ly.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
            fx.property("ADBE Drop Shadow-0002").setValue(opac255);
            fx.property("ADBE Drop Shadow-0004").setValue(dist);
            fx.property("ADBE Drop Shadow-0005").setValue(soft);
        } catch (e) {}
    }
    function brilho(ly, thr, rad, inten) {
        if (!ly || temFx(ly, "ADBE Glo2")) return;
        try {
            var fx = ly.property("ADBE Effect Parade").addProperty("ADBE Glo2");
            fx.property("ADBE Glo2-0002").setValue(thr);
            fx.property("ADBE Glo2-0003").setValue(rad);
            fx.property("ADBE Glo2-0004").setValue(inten);
        } catch (e) {}
    }
    function blurOn(ly) { if (ly) ly.motionBlur = true; }
    function tilt(ly, grausY) {
        if (!ly || ly.threeDLayer) return;
        try {
            ly.threeDLayer = true;
            ly.property("ADBE Transform Group").property("ADBE Rotate Y").setValue(grausY);
        } catch (e) {}
    }
    function dotGrid(c, prefixo, cor, opac) {
        var nome = prefixo + "-dotgrid";
        if (lay(c, nome)) return;
        var g = c.layers.addShape();
        g.name = nome;
        var raiz = g.property("ADBE Root Vectors Group");
        var grp = raiz.addProperty("ADBE Vector Group");
        var cont = grp.property("ADBE Vectors Group");
        var el = cont.addProperty("ADBE Vector Shape - Ellipse");
        el.property("ADBE Vector Ellipse Size").setValue([6, 6]);
        var fl = cont.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(cor);
        var repX = cont.addProperty("ADBE Vector Filter - Repeater");
        repX.property("ADBE Vector Repeater Copies").setValue(41);
        repX.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([96, 0]);
        var repY = cont.addProperty("ADBE Vector Filter - Repeater");
        repY.property("ADBE Vector Repeater Copies").setValue(23);
        repY.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 96]);
        grp.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([-1920 + 48, -1080 + 48]);
        g.property("ADBE Transform Group").property("ADBE Opacity").setValue(opac);
        // logo acima do fundo
        var fundo = lay(c, prefixo + "-fundo-papel") || lay(c, prefixo + "-fundo-ambar");
        if (fundo) g.moveBefore(fundo);
        else g.moveToEnd();
        return g;
    }
    function polimento(c, prefixo) {
        var nome = prefixo + "-polimento";
        if (lay(c, nome)) return;
        var adj = c.layers.addSolid([1, 1, 1], nome, 3840, 2160, 1, c.duration);
        adj.adjustmentLayer = true;
        adj.moveToBeginning();
        try {
            var fx = adj.property("ADBE Effect Parade").addProperty("ADBE Glo2");
            fx.property("ADBE Glo2-0002").setValue(88); // threshold alto: só realces
            fx.property("ADBE Glo2-0003").setValue(46);
            fx.property("ADBE Glo2-0004").setValue(0.28); // sutil
        } catch (e) {}
    }
    // takes claros: glow global LAVA hairlines/mapa/cards (Pedro 18/08) — remover
    function rmPolimento(c, prefixo) {
        var l = lay(c, prefixo + "-polimento");
        if (l) l.remove();
    }
    // tela do render fora do DS (#E35F39) -> coral-600 #DD4E27, preservando shading
    function corTela(ly) {
        if (!ly || temFx(ly, "ADBE Change To Color")) return;
        try {
            var fx = ly.property("ADBE Effect Parade").addProperty("ADBE Change To Color");
            fx.property("ADBE Change To Color-0001").setValue([227 / 255, 95 / 255, 57 / 255]);
            fx.property("ADBE Change To Color-0002").setValue([221 / 255, 78 / 255, 39 / 255]);
            fx.property("ADBE Change To Color-0003").setValue(4); // Hue, Lightness & Saturation
            fx.property("ADBE Change To Color-0004").setValue(2); // Transforming (mantem shading)
            fx.property("ADBE Change To Color-0005").setValue(12); // tol Hue
            fx.property("ADBE Change To Color-0006").setValue(40); // tol Lightness
            fx.property("ADBE Change To Color-0007").setValue(50); // tol Saturation
            fx.property("ADBE Change To Color-0008").setValue(40); // softness
        } catch (e) {}
    }

    var feitos = [];

    // ---- T1 (dark): motion blur + polish ----
    var t1 = comp("T1");
    if (t1) { t1.motionBlur = true; polimento(t1, "T1V"); feitos.push("T1"); }

    // ---- T2: sombras no celular/cards, blur nos voos ----
    var t2 = comp("T2");
    if (t2) {
        t2.motionBlur = true;
        sombra(lay(t2, "T2V-fone3d"), 55, 26, 95);
        sombra(lay(t2, "T2V-spin"), 45, 26, 95);
        var n2 = ["T2V-card-imposto", "T2V-card-cnae", "T2V-calendario"];
        for (var i2 = 0; i2 < n2.length; i2++) { sombra(lay(t2, n2[i2]), 40, 14, 60); blurOn(lay(t2, n2[i2])); }
        blurOn(lay(t2, "T2V-spin"));
        corTela(lay(t2, "T2V-fone3d"));
        corTela(lay(t2, "T2V-spin"));
        rmPolimento(t2, "T2V");
        feitos.push("T2");
    }

    // ---- T3: card do contador com sombra+tilt, dot grid, blur na espiral ----
    var t3 = comp("T3");
    if (t3) {
        t3.motionBlur = true;
        sombra(lay(t3, "T3V-contador-card"), 40, 14, 60);
        blurOn(lay(t3, "T3V-multidao"));
        dotGrid(t3, "T3V", [27 / 255, 30 / 255, 36 / 255], 4.5);
        rmPolimento(t3, "T3V");
        feitos.push("T3");
    }

    // ---- T4: idem T3 + glow no 0,7% ----
    var t4 = comp("T4");
    if (t4) {
        t4.motionBlur = true;
        sombra(lay(t4, "T4V-contador-card"), 40, 14, 60);
        blurOn(lay(t4, "T4V-multidao"));
        dotGrid(t4, "T4V", [27 / 255, 30 / 255, 36 / 255], 4.5);
        rmPolimento(t4, "T4V");
        feitos.push("T4");
    }

    // ---- T5: sombras no celular/cards ----
    var t5 = comp("T5");
    if (t5) {
        t5.motionBlur = true;
        sombra(lay(t5, "T5V-fone3d"), 55, 26, 95);
        sombra(lay(t5, "T5V-spin"), 45, 26, 95);
        var n5 = ["T5V-card-planilha", "T5V-card-notas", "T5V-card-contador"];
        for (var i5 = 0; i5 < n5.length; i5++) { sombra(lay(t5, n5[i5]), 40, 14, 60); blurOn(lay(t5, n5[i5])); }
        blurOn(lay(t5, "T5V-spin"));
        corTela(lay(t5, "T5V-fone3d"));
        corTela(lay(t5, "T5V-spin"));
        rmPolimento(t5, "T5V");
        feitos.push("T5");
    }

    // ---- T6: mapa BLOCO flutuante (espessura fake + sombra), glow estrelas ----
    var t6 = comp("T6");
    if (t6) {
        t6.motionBlur = true;
        var mapa = lay(t6, "T6V-mapa-mgsp");
        if (mapa && !temFx(mapa, "ADBE Drop Shadow")) {
            // espessura fake: duplica os contornos deslocados, atras (bloco solido)
            // fase 1: coleta as formas (referencias invalidam ao adicionar grupos)
            var raiz = mapa.property("ADBE Root Vectors Group");
            var formas = [];
            for (var mg = 1; mg <= raiz.numProperties; mg++) {
                var gO = raiz.property(mg);
                if (!gO || gO.matchName !== "ADBE Vector Group") continue;
                var pthO = gO.property("ADBE Vectors Group").property("ADBE Vector Shape - Group");
                if (!pthO) continue;
                formas.push({ nome: gO.name, sh: pthO.property("ADBE Vector Shape").value });
            }
            // fase 2: cria as espessuras (cada grupo criado e configurado NA HORA)
            for (var fe = 0; fe < formas.length; fe++) {
                var gS = mapa.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                gS.name = formas[fe].nome + "-espessura";
                var cS = gS.property("ADBE Vectors Group");
                var pS = cS.addProperty("ADBE Vector Shape - Group");
                pS.property("ADBE Vector Shape").setValue(formas[fe].sh);
                var fS = cS.addProperty("ADBE Vector Graphic - Fill");
                fS.property("ADBE Vector Fill Color").setValue([140 / 255, 47 / 255, 22 / 255]);
                var tS = gS.property("ADBE Vector Transform Group");
                tS.property("ADBE Vector Position").setValue([0, 18]);
                tS.property("ADBE Vector Group Opacity").setValue(55);
            }
            sombra(mapa, 60, 34, 110);
        }
        brilho(lay(t6, "T6V-estrela-bh"), 78, 34, 0.32);
        brilho(lay(t6, "T6V-estrela-sp"), 78, 30, 0.28);
        brilho(lay(t6, "T6V-rastro-sp"), 62, 50, 0.6);
        sombra(lay(t6, "T6V-pill-11h"), 45, 14, 60);
        sombra(lay(t6, "T6V-badge-3a"), 40, 10, 50);
        blurOn(lay(t6, "T6V-estrela-bh"));
        blurOn(lay(t6, "T6V-estrela-sp"));
        blurOn(lay(t6, "T6V-pino"));
        dotGrid(t6, "T6V", [1, 1, 1], 5);
        rmPolimento(t6, "T6V");
        feitos.push("T6");
    }

    // ---- T7: sombras celular/cards, blur na queda/fusão/poeira ----
    var t7 = comp("T7");
    if (t7) {
        t7.motionBlur = true;
        sombra(lay(t7, "T7V-fone3d"), 60, 30, 100);
        sombra(lay(t7, "T7V-flip"), 45, 30, 100);
        for (var i7 = 1; i7 <= 14; i7++) { sombra(lay(t7, "T7V-tarefa-" + i7), 40, 12, 55); blurOn(lay(t7, "T7V-tarefa-" + i7)); }
        blurOn(lay(t7, "T7V-flip"));
        blurOn(lay(t7, "T7V-poeira"));
        blurOn(lay(t7, "T7V-contador-22"));
        corTela(lay(t7, "T7V-fone3d"));
        corTela(lay(t7, "T7V-flip"));
        rmPolimento(t7, "T7V");
        feitos.push("T7");
    }

    $.global.ESCALADA_RESULT = { polimento: feitos.join("+") };
})();
