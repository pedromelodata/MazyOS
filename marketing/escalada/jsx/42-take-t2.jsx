// 42-take-t2.jsx — T2 v2 "Dúvidas no celular" (idempotente)
// Direção Pedro 14/08 (ultrathink) + reunião 13/08 ("cards animados dentro da tela"):
// TELA BRANCA (papel #FAF8F5) · iPhone em 3D entra e assenta à esquerda ·
// LEGENDA À DIREITA (rig v2 tema papel) · cards voam DA CÂMERA (z) e COLAM na tela:
//   "imposto" 1.285 -> card IMPOSTO digitando valores e APAGANDO
//   "código"  4.346 -> card CNAE digitando códigos e APAGANDO
//   7.0-8.1 -> tabela de ANO girando 2026->2027->2028->2029 + "1 ANO DEPOIS"
//   "corrigir." 10.087 -> X CRIMSON estampa + freeze
// ORDEM CRÍTICA de rig 3D: null estático -> parenta filhos -> keyframes por último.

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];    // #FAF8F5
    var BRANCO = [1, 1, 1];
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];
    var CRIMSON = [224 / 255, 62 / 255, 67 / 255];
    var INK_900 = [27 / 255, 30 / 255, 36 / 255];
    var CINZA_TERC = [115 / 255, 110 / 255, 103 / 255]; // #736E67
    var HAIR_LIGHT = [203 / 255, 197 / 255, 188 / 255]; // #CBC5BC border-strong light
    var HAIR_SOFT = [227 / 255, 222 / 255, 215 / 255];  // #E3DED7

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
            st.property("ADBE Vector Stroke Width").setValue(strokeW || 3);
        }
        if (fillCor) {
            var fl = cont.addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fillCor);
        }
        return grp;
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
    // digitação com cursor: sourceText em hold keys (mantém o estilo mutando td.text)
    function digita(ly, seq) {
        // seq = [[t, "texto"], ...]
        var prop = ly.property("ADBE Text Properties").property("ADBE Text Document");
        for (var i = 0; i < seq.length; i++) {
            var td = prop.value;
            td.text = seq[i][1];
            prop.setValueAtTime(seq[i][0], td);
        }
    }
    function seqDigitacao(t0, prefixo, corpo, vel) {
        // gera passos de digitação de `corpo` char a char (com cursor |)
        var out = [];
        for (var i = 1; i <= corpo.length; i++) {
            out.push([t0 + (i - 1) * vel, prefixo + corpo.substring(0, i) + "|"]);
        }
        return out;
    }
    function seqApaga(t0, prefixo, corpo, vel, passo) {
        var out = [];
        var len = corpo.length;
        var i = len - passo;
        var t = t0;
        while (i > 0) {
            out.push([t, prefixo + corpo.substring(0, i) + "|"]);
            t += vel; i -= passo;
        }
        out.push([t, prefixo + "|"]);
        return out;
    }

    var t2 = findItem("T2");
    if (!t2) { $.global.ESCALADA_RESULT = { erro: "T2 não existe" }; return; }
    var dur = t2.duration; // 12.9
    t2.time = 0; // parent-preserve usa o playhead: zera antes de construir!
    // (sem isso o still herda offset != do spin e o celular "teleporta" no handoff)

    for (var L = t2.numLayers; L >= 1; L--) {
        if (t2.layer(L).name.indexOf("T2V-") === 0) t2.layer(L).remove();
    }

    // ---- fundo branco (papel) ----
    var fundo = t2.layers.addSolid(PAPEL, "T2V-fundo-papel", 3840, 2160, 1, dur);

    // ---- manchas coral bem de leve (blend normal — em fundo claro o Add não aparece) ----
    function mancha(nome, tam, pos, cor, feather, opac, seed) {
        var m = t2.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
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
            "value * (0.85 + 0.15 * Math.sin(time * 0.45 + " + seed + "));";
        return m;
    }
    mancha("T2V-mancha-topo", [3900, 1400], [1920, 20], CORAL, 520, 9, 0.7);
    mancha("T2V-mancha-infdir", [1500, 1150], [3450, 1950], CORAL600, 480, 7, 2.8);

    // ---- câmera (push até freeze) ----
    var cam = t2.layers.addNull(dur);
    cam.name = "T2V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1920, 1080]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [100, 100]);
    cs.setValueAtTime(10.087, [110, 110]);
    easeChegada(cs); // desacelera chegando no freeze
    cs.setValueAtTime(dur, [110, 110]);

    // ==== RIG 3D DO CELULAR (null ESTÁTICO primeiro; keys só no final) ====
    var FX = 1150, FY = 1120; // posição final do celular (esquerda)
    var rig = t2.layers.addNull(dur);
    rig.name = "T2V-PHONE3D";
    rig.threeDLayer = true;
    rig.property("ADBE Transform Group").property("ADBE Position").setValue([FX, FY, 0]);
    rig.parent = cam;

    // RENDER 3D do iPhone (Blender/Cycles, alpha) — assets/iphone-t2.png
    var fone3d = findItem("iphone-t5.png"); // frontal reto (pedido Pedro 18/08)
    if (!fone3d) {
        var fAssets = findItem("03-ASSETS");
        fone3d = proj.importFile(new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/iphone-t5.png")));
        if (fAssets) fone3d.parentFolder = fAssets;
    }
    var frame = t2.layers.add(fone3d);
    frame.name = "T2V-fone3d";
    frame.threeDLayer = true;
    frame.property("ADBE Transform Group").property("ADBE Position").setValue([FX, FY, 2]);
    frame.property("ADBE Transform Group").property("ADBE Scale").setValue([80, 80, 80]);
    frame.parent = rig;
    var frOp = frame.property("ADBE Transform Group").property("ADBE Opacity");
    frOp.setValueAtTime(0, 0);
    frOp.setValueAtTime(1.0667, 0);
    frOp.setValueAtTime(1.1, 100);

    // SPIN de entrada: vem da esquerda girando (ref. primeiro filme) e para na pose
    var seqT2 = findItem("SEQ-spin-t5"); // sequencia FRONTAL (az0), mesma do T5
    if (!seqT2) {
        var ioS = new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/spin-t5/spin_0000.png"));
        ioS.sequence = true;
        seqT2 = proj.importFile(ioS);
        seqT2.name = "SEQ-spin-t5";
        var fA2 = findItem("03-ASSETS"); if (fA2) seqT2.parentFolder = fA2;
        seqT2.mainSource.conformFrameRate = 30;
    }
    var spin = t2.layers.add(seqT2);
    spin.name = "T2V-spin";
    spin.startTime = 0;
    spin.outPoint = 1.1;  // 33 frames frontais a 30fps
    spin.frameBlendingType = FrameBlendingType.FRAME_MIX;
    t2.frameBlending = true;
    spin.parent = cam;
    spin.property("ADBE Transform Group").property("ADBE Scale").setValue([80, 80]);
    var spPos = spin.property("ADBE Transform Group").property("ADBE Position");
    spPos.setValueAtTime(0, [-700, FY + 150]);
    spPos.setValueAtTime(1.1, [FX, FY]);
    easeChegada(spPos);
    var spOp = spin.property("ADBE Transform Group").property("ADBE Opacity");
    spOp.setValueAtTime(0, 0);
    spOp.setValueAtTime(3 / FPS, 100);

    // ---- cardVoador: cria card + textos no destino, parenta, e voa do z da câmera ----
    function cardVoador(nomeBase, wCard, hCard, wx, wy, tVoo, labelTxt, icone) {
        var card = t2.layers.addShape();
        card.name = nomeBase;
        card.threeDLayer = true;
        shapeRect(card, "bg", [wCard, hCard], 28, BRANCO, HAIR_SOFT, 3);
        card.property("ADBE Transform Group").property("ADBE Position").setValue([wx, wy, -2]);
        card.parent = rig;

        // padrão do app (design-guide): título sentence case ink-900, alinhado à esquerda
        var LX = wx - wCard / 2 + 40;
        var lab = texto(t2, labelTxt, "Sora-SemiBold", 42, INK_900, LX, wy - hCard / 2 + 82, 0, ParagraphJustification.LEFT_JUSTIFY);
        lab.name = nomeBase + "-label";
        lab.threeDLayer = true;
        lab.parent = card;
        lab.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
        var lp = lab.property("ADBE Transform Group").property("ADBE Position").value;
        lab.property("ADBE Transform Group").property("ADBE Position").setValue([lp[0], lp[1], -8]); // à frente do card

        var val = texto(t2, "|", "Sora-Bold", 80, INK_900, LX, wy + 48, 0, ParagraphJustification.LEFT_JUSTIFY);
        val.name = nomeBase + "-valor";
        val.threeDLayer = true;
        val.parent = card;
        val.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
        var vp = val.property("ADBE Transform Group").property("ADBE Position").value;
        val.property("ADBE Transform Group").property("ADBE Position").setValue([vp[0], vp[1], -8]); // à frente do card

        // ícone do card (Pedro 18/08): cifrão no imposto, maleta no CNAE
        var ic = null, cif = null;
        if (icone) {
            ic = t2.layers.addShape();
            ic.name = nomeBase + "-icone";
            ic.threeDLayer = true;
            if (icone === "cifrao") {
                var icg = ic.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                var icc = icg.property("ADBE Vectors Group");
                var cir = icc.addProperty("ADBE Vector Shape - Ellipse");
                cir.property("ADBE Vector Ellipse Size").setValue([66, 66]);
                var icf = icc.addProperty("ADBE Vector Graphic - Fill");
                icf.property("ADBE Vector Fill Color").setValue(CORAL600);
            } else { // maleta (trabalho)
                var mg1 = ic.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); // alça na FRENTE
                var m1c = mg1.property("ADBE Vectors Group");
                var alca = m1c.addProperty("ADBE Vector Shape - Rect");
                alca.property("ADBE Vector Rect Size").setValue([30, 22]);
                alca.property("ADBE Vector Rect Position").setValue([0, -28]);
                alca.property("ADBE Vector Rect Roundness").setValue(8);
                var m1s = m1c.addProperty("ADBE Vector Graphic - Stroke");
                m1s.property("ADBE Vector Stroke Color").setValue(CORAL600);
                m1s.property("ADBE Vector Stroke Width").setValue(8);
                var mg2 = ic.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
                var m2c = mg2.property("ADBE Vectors Group");
                var corpoM = m2c.addProperty("ADBE Vector Shape - Rect");
                corpoM.property("ADBE Vector Rect Size").setValue([68, 48]);
                corpoM.property("ADBE Vector Rect Position").setValue([0, 4]);
                corpoM.property("ADBE Vector Rect Roundness").setValue(10);
                var m2f = m2c.addProperty("ADBE Vector Graphic - Fill");
                m2f.property("ADBE Vector Fill Color").setValue(CORAL600);
            }
            ic.property("ADBE Transform Group").property("ADBE Position").setValue([wx + wCard / 2 - 76, wy - hCard / 2 + 80, -8]);
            ic.parent = card;
            ic.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
            var icOp = ic.property("ADBE Transform Group").property("ADBE Opacity");
            icOp.setValueAtTime(tVoo, 0);
            icOp.setValueAtTime(tVoo + 6 / FPS, 100);
            if (icone === "cifrao") {
                cif = texto(t2, "$", "Sora-Bold", 46, BRANCO, wx + wCard / 2 - 76, wy - hCard / 2 + 96, 0);
                cif.name = nomeBase + "-icone-txt";
                cif.threeDLayer = true;
                cif.parent = card;
                cif.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
                var cp2 = cif.property("ADBE Transform Group").property("ADBE Position").value;
                cif.property("ADBE Transform Group").property("ADBE Position").setValue([cp2[0], cp2[1], -10]);
                var cifOp = cif.property("ADBE Transform Group").property("ADBE Opacity");
                cifOp.setValueAtTime(tVoo, 0);
                cifOp.setValueAtTime(tVoo + 6 / FPS, 100);
            }
        }

        // voo da câmera -> cola na tela (keys DEPOIS do parenting)
        var pos = card.property("ADBE Transform Group").property("ADBE Position");
        var lv = pos.value; // local preservado
        pos.setValueAtTime(tVoo, [lv[0] + 160, lv[1] + 90, -1650]);
        pos.setValueAtTime(tVoo + 11 / FPS, lv);
        easeChegada(pos);
        var cOp = card.property("ADBE Transform Group").property("ADBE Opacity");
        cOp.setValueAtTime(tVoo, 0);
        cOp.setValueAtTime(tVoo + 4 / FPS, 100);
        var lOp = lab.property("ADBE Transform Group").property("ADBE Opacity");
        lOp.setValueAtTime(tVoo, 0);
        lOp.setValueAtTime(tVoo + 6 / FPS, 100);
        var vOp = val.property("ADBE Transform Group").property("ADBE Opacity");
        vOp.setValueAtTime(tVoo, 0);
        vOp.setValueAtTime(tVoo + 6 / FPS, 100);
        return { card: card, label: lab, valor: val, icone: ic, iconeTxt: cif };
    }

    // card 1: IMPOSTO — cola no TOPO da tela ("imposto" 1.285)
    var c1 = cardVoador("T2V-card-imposto", 640, 260, FX, FY - 560, 1.285, "Imposto do mês", "cifrao");
    var seq1 = [];
    seq1 = seq1.concat(seqDigitacao(1.75, "", "R$ 1.240,00", 0.065));
    seq1.push([2.65, "R$ 1.240,00"]);   // cursor some (blink)
    seq1.push([2.85, "R$ 1.240,00|"]);
    seq1 = seq1.concat(seqApaga(3.05, "", "R$ 1.240,00", 0.05, 3));
    seq1 = seq1.concat(seqDigitacao(3.5, "", "R$ 2.187,90", 0.065));
    seq1.push([4.45, "R$ 2.187,90"]);
    seq1.push([4.65, "R$ 2.187,90|"]);
    seq1 = seq1.concat(seqApaga(4.85, "", "R$ 2.187,90", 0.05, 3));
    seq1.push([5.6, "|"]); seq1.push([6.0, ""]); seq1.push([6.4, "|"]);
    seq1.push([6.8, ""]); seq1.push([7.2, "|"]);
    digita(c1.valor, seq1);

    // card 2: CNAE — cola logo abaixo ("código" 4.346)
    var c2 = cardVoador("T2V-card-cnae", 640, 260, FX, FY - 240, 4.346, "Código CNAE", "maleta");
    var seq2 = [];
    seq2 = seq2.concat(seqDigitacao(4.85, "", "6201-5", 0.075));
    seq2.push([5.75, "6201-5"]); seq2.push([5.95, "6201-5|"]);
    seq2 = seq2.concat(seqApaga(6.15, "", "6201-5", 0.055, 2));
    seq2 = seq2.concat(seqDigitacao(6.55, "", "6311-9", 0.075));
    seq2.push([7.35, "6311-9"]); seq2.push([7.55, "6311-9|"]);
    seq2 = seq2.concat(seqApaga(7.75, "", "6311-9", 0.055, 2));
    seq2.push([8.3, "|"]); seq2.push([8.7, ""]); seq2.push([9.1, "|"]);
    digita(c2.valor, seq2);

    // ---- CALENDÁRIO: pequena tabela com os DIAS PASSANDO (Pedro 18/08) ----
    // (substitui o card "Ano fiscal" + texto "3 ANOS DEPOIS")
    var CAL_W = 470, CAL_H = 430, CAL_Y = FY + 190;
    var calen = t2.layers.addShape();
    calen.name = "T2V-calendario";
    calen.threeDLayer = true;
    // ordem de pintura em shape: 1º grupo adicionado fica NA FRENTE
    // 1) highlight do dia (coral, pula célula a célula = dias passando)
    var hoje = calen.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    hoje.name = "hoje";
    var hjc = hoje.property("ADBE Vectors Group");
    var hjr = hjc.addProperty("ADBE Vector Shape - Rect");
    hjr.property("ADBE Vector Rect Size").setValue([50, 44]);
    hjr.property("ADBE Vector Rect Roundness").setValue(10);
    var hjf = hjc.addProperty("ADBE Vector Graphic - Fill");
    hjf.property("ADBE Vector Fill Color").setValue(CORAL600);
    var GC = 7, DX2 = 58, DY2 = 62, GX0 = -174, GY0 = -73;
    var hjP = hoje.property("ADBE Vector Transform Group").property("ADBE Vector Position");
    var T_CAL = 7.35;
    for (var dd = 0; dd < 28; dd++) {
        hjP.setValueAtTime(T_CAL + dd * 0.095, [GX0 + (dd % GC) * DX2, GY0 + Math.floor(dd / GC) * DY2]);
    }
    for (var kh = 1; kh <= hjP.numKeys; kh++) hjP.setInterpolationTypeAtKey(kh, KeyframeInterpolationType.HOLD);
    // 2) grade de dias 7x4 (repeater)
    var gcal = calen.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    gcal.name = "grade";
    var gcc = gcal.property("ADBE Vectors Group");
    var gcr = gcc.addProperty("ADBE Vector Shape - Rect");
    gcr.property("ADBE Vector Rect Size").setValue([46, 40]);
    gcr.property("ADBE Vector Rect Position").setValue([GX0, GY0]);
    gcr.property("ADBE Vector Rect Roundness").setValue(9);
    var gcf = gcc.addProperty("ADBE Vector Graphic - Fill");
    gcf.property("ADBE Vector Fill Color").setValue([241 / 255, 238 / 255, 233 / 255]); // ink-100
    var grX = gcc.addProperty("ADBE Vector Filter - Repeater");
    grX.property("ADBE Vector Repeater Copies").setValue(GC);
    grX.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([DX2, 0]);
    var grY = gcc.addProperty("ADBE Vector Filter - Repeater");
    grY.property("ADBE Vector Repeater Copies").setValue(4);
    grY.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, DY2]);
    // 3) argolinhas do fichário (emoji de calendário)
    var arg = calen.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    arg.name = "argolas";
    var agc = arg.property("ADBE Vectors Group");
    var a1 = agc.addProperty("ADBE Vector Shape - Rect");
    a1.property("ADBE Vector Rect Size").setValue([18, 48]);
    a1.property("ADBE Vector Rect Position").setValue([-120, -CAL_H / 2 + 4]);
    a1.property("ADBE Vector Rect Roundness").setValue(9);
    var a2 = agc.addProperty("ADBE Vector Shape - Rect");
    a2.property("ADBE Vector Rect Size").setValue([18, 48]);
    a2.property("ADBE Vector Rect Position").setValue([120, -CAL_H / 2 + 4]);
    a2.property("ADBE Vector Rect Roundness").setValue(9);
    var agf = agc.addProperty("ADBE Vector Graphic - Fill");
    agf.property("ADBE Vector Fill Color").setValue(BRANCO);
    // 4) cabeçalho coral (topo arredondado)
    var cab2 = calen.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    cab2.name = "cabecalho";
    var cbc = cab2.property("ADBE Vectors Group");
    var cbr = cbc.addProperty("ADBE Vector Shape - Rect");
    cbr.property("ADBE Vector Rect Size").setValue([CAL_W, 96]);
    cbr.property("ADBE Vector Rect Position").setValue([0, -CAL_H / 2 + 48]);
    cbr.property("ADBE Vector Rect Roundness").setValue(28);
    var cbr2 = cbc.addProperty("ADBE Vector Shape - Rect");
    cbr2.property("ADBE Vector Rect Size").setValue([CAL_W, 48]);
    cbr2.property("ADBE Vector Rect Position").setValue([0, -CAL_H / 2 + 72]);
    var cbf = cbc.addProperty("ADBE Vector Graphic - Fill");
    cbf.property("ADBE Vector Fill Color").setValue(CORAL600);
    // 5) corpo branco (fundo)
    shapeRect(calen, "corpo", [CAL_W, CAL_H], 28, BRANCO, HAIR_SOFT, 3);
    calen.property("ADBE Transform Group").property("ADBE Position").setValue([FX, CAL_Y, -2]);
    calen.parent = rig;
    // mês no cabeçalho (passa junto com os dias)
    var mesCal = texto(t2, "Janeiro", "Sora-Bold", 44, BRANCO, FX, CAL_Y - CAL_H / 2 + 62, 6);
    mesCal.name = "T2V-calendario-mes";
    mesCal.threeDLayer = true;
    mesCal.parent = calen;
    mesCal.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
    var mcp = mesCal.property("ADBE Transform Group").property("ADBE Position").value;
    mesCal.property("ADBE Transform Group").property("ADBE Position").setValue([mcp[0], mcp[1], -10]);
    digita(mesCal, [[T_CAL, "Janeiro"], [T_CAL + 0.44, "Fevereiro"], [T_CAL + 0.88, "Março"],
        [T_CAL + 1.32, "Abril"], [T_CAL + 1.76, "Maio"], [T_CAL + 2.2, "Junho"]]);
    // voo da câmera (mesma entrada dos outros cards) — keys DEPOIS do parenting
    var calPos = calen.property("ADBE Transform Group").property("ADBE Position");
    var calLv = calPos.value;
    calPos.setValueAtTime(7.0, [calLv[0] + 160, calLv[1] + 90, -1650]);
    calPos.setValueAtTime(7.0 + 11 / FPS, calLv);
    easeChegada(calPos);
    var calOp = calen.property("ADBE Transform Group").property("ADBE Opacity");
    calOp.setValueAtTime(7.0, 0);
    calOp.setValueAtTime(7.0 + 4 / FPS, 100);
    var mesOp = mesCal.property("ADBE Transform Group").property("ADBE Opacity");
    mesOp.setValueAtTime(7.0, 0);
    mesOp.setValueAtTime(7.0 + 6 / FPS, 100);

    // ---- X CRIMSON: não dá mais pra corrigir ("corrigir." 9.51 na narracao v2) ----
    var xis = t2.layers.addShape();
    xis.name = "T2V-xis";
    xis.threeDLayer = true;
    var g1 = shapeRect(xis, "t1", [560, 78], 39, CRIMSON, null, 0);
    g1.property("ADBE Vector Transform Group").property("ADBE Vector Rotation").setValue(45);
    var g2 = shapeRect(xis, "t2", [560, 78], 39, CRIMSON, null, 0);
    g2.property("ADBE Vector Transform Group").property("ADBE Vector Rotation").setValue(-45);
    xis.property("ADBE Transform Group").property("ADBE Position").setValue([FX, FY - 200, -4]);
    xis.parent = rig;
    var xOp = xis.property("ADBE Transform Group").property("ADBE Opacity");
    xOp.setValueAtTime(9.51, 0);
    xOp.setValueAtTime(9.51 + 3 / FPS, 100);
    var xSc = xis.property("ADBE Transform Group").property("ADBE Scale");
    xSc.setValueAtTime(9.51, [150, 150, 150]);
    xSc.setValueAtTime(9.51 + 5 / FPS, [100, 100, 100]);
    easeChegada(xSc);

    // cards esmaecem sob o X
    var dimAlvos = [c1.card, c1.label, c1.valor, c1.icone, c1.iconeTxt,
        c2.card, c2.label, c2.valor, c2.icone, calen, mesCal];
    for (var dA = 0; dA < dimAlvos.length; dA++) {
        if (!dimAlvos[dA]) continue;
        var dop = dimAlvos[dA].property("ADBE Transform Group").property("ADBE Opacity");
        var dv = dop.valueAtTime(9.58, false);
        dop.setValueAtTime(9.58, dv);
        dop.setValueAtTime(9.88, Math.min(dv, 30));
    }

    // cards flutuando bem leve depois de encaixar (nunca perder o movimento)
    var FLUT = [
        { ly: c1.card, t0: 1.85 }, { ly: c2.card, t0: 4.95 }, { ly: calen, t0: 7.5 }
    ];
    for (var fl2 = 0; fl2 < FLUT.length; fl2++) {
        FLUT[fl2].ly.property("ADBE Transform Group").property("ADBE Position").expression =
            "var f = Math.min(1, Math.max(0, time - " + FLUT[fl2].t0 + ") / 0.8); seedRandom(" + (fl2 + 3) + ", false); var v = wiggle(0.34, 14); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f, 0];";
    }

    // ==== keys do RIG por último (entrada 3D + drift) ====
    // flutuacao continua apos o pouso: o celular nunca trava (Pedro 18/08)
    rig.property("ADBE Transform Group").property("ADBE Position").expression =
        "var f = Math.min(1, Math.max(0, time - 1.1) / 0.9); var v = wiggle(0.35, 26); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f, 0];";
    // giro contínuo pro lado enquanto a câmera aproxima, com coice a cada card
    // que encaixa (direção Pedro 17/08)
    // sem rotacao: celular RETO e de frente (cards paralelos)

    // escurecida leve no freeze
    var freeze = t2.layers.addSolid([0, 0, 0], "T2V-freeze-dim", 3840, 2160, 1, dur);
    var fzOp = freeze.property("ADBE Transform Group").property("ADBE Opacity");
    fzOp.setValueAtTime(10.087, 0);
    fzOp.setValueAtTime(10.087 + 8 / FPS, 9);

    // ---- ordem: LETTERING topo > freeze > X/cards 3D > tela/moldura > manchas > fundo > BG ----
    for (var L2 = t2.numLayers; L2 >= 1; L2--) {
        if (t2.layer(L2).name === "T2-LETTERING") t2.layer(L2).moveToBeginning();
    }
    fundo.moveToEnd();
    for (var L3 = 1; L3 <= t2.numLayers; L3++) {
        if (t2.layer(L3).name === "BG-T2") {
            var bg = t2.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T2", camadas: t2.numLayers, conceito: "iphone 3D tela branca v2" };
})();
