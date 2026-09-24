// 47-take-t7.jsx — T7 "22 anos + IMPACTO DE MARCA" (idempotente)
// Direção Pedro 18/08 (momento-assinatura do filme):
//   0-0.7s  volta do branco em CÍRCULO (espelho da virada coral do T6)
//   3.0s    CONTADOR 1->22 no meio + cards de tarefas contábeis em volta
//   6.1s    "Por cima": celular surge DA CÂMERA e vai DE ENCONTRO AO FUNDO;
//           os cards e o contador FUNDEM por trás dele
//   7.0s    CHOQUE: shake de camera + POEIRA REALISTA subindo
//   7.15s   celular ARRASTADO pra direita; legenda fica à ESQUERDA
//   9.6s+   telas reais deslizam; flutuação contínua

(function () {
    var FPS = 30;
    var PAPEL = [250 / 255, 248 / 255, 245 / 255];
    var BRANCO = [1, 1, 1];
    var CORAL = [242 / 255, 100 / 255, 60 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];
    var AMBAR = [245 / 255, 165 / 255, 36 / 255];
    var INK_900 = [27 / 255, 30 / 255, 36 / 255];
    var INK_300 = [203 / 255, 197 / 255, 188 / 255];
    var INK_200 = [227 / 255, 222 / 255, 215 / 255];

    // centro do palco (contador/cards/impacto) e destino do arrasto
    var CX2 = 1920, CY2 = 1240, FX_FIM = 2620, ESC = 76;
    var T_VEM = 5.6, T_BATE = 6.5;

    var proj = app.project;
    function findItem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
    function findConta(sub) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name.indexOf(sub) >= 0) return proj.item(i); }
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

    var t7 = findItem("T7");
    if (!t7) { $.global.ESCALADA_RESULT = { erro: "T7 não existe" }; return; }
    var dur = t7.duration; // 16.8
    t7.time = 0; // parent-preserve usa o playhead: zera antes de construir!

    for (var L = t7.numLayers; L >= 1; L--) {
        if (t7.layer(L).name.indexOf("T7V-") === 0) t7.layer(L).remove();
    }
    var velhoPre = findItem("T7-TELAS");
    if (velhoPre) velhoPre.remove();

    // ---- fundo papel + manchas ----
    var fundo = t7.layers.addSolid(PAPEL, "T7V-fundo-papel", 3840, 2160, 1, dur);
    function mancha(nome, tam, pos, cor, feather, opac, seedM) {
        var m = t7.layers.addSolid(cor, nome, 3840, 2160, 1, dur);
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
    var man1 = mancha("T7V-mancha-topo", [3900, 1400], [1920, 20], CORAL, 520, 8, 0.9);
    var man2 = mancha("T7V-mancha-infdir", [1500, 1150], [3450, 1990], CORAL600, 480, 6, 3.3);

    // ---- CAM (push + SHAKE no impacto) ----
    var cam = t7.layers.addNull(dur);
    cam.name = "T7V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1920, 1080]);
    var cp = cam.property("ADBE Transform Group").property("ADBE Position");
    cp.setValueAtTime(0, [1920, 1080]);
    cp.setValueAtTime(T_BATE, [1920, 1080]);
    cp.setValueAtTime(T_BATE + 1 / FPS, [1974, 1110]);
    cp.setValueAtTime(T_BATE + 2 / FPS, [1874, 1052]);
    cp.setValueAtTime(T_BATE + 3 / FPS, [1956, 1100]);
    cp.setValueAtTime(T_BATE + 4 / FPS, [1890, 1060]);
    cp.setValueAtTime(T_BATE + 5 / FPS, [1938, 1090]);
    cp.setValueAtTime(T_BATE + 6 / FPS, [1920, 1080]);
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [100, 100]);
    cs.setValueAtTime(dur, [106, 106]);
    fundo.parent = cam;
    fundo.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    fundo.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);
    man1.parent = cam;
    man1.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    man2.parent = cam;
    man2.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);

    // ---- CONTADOR 1 -> 22 no meio ----
    var cont22 = texto(t7, "1", "Sora-Bold", 560, INK_900, CX2, CY2 + 190, -10);
    cont22.name = "T7V-contador-22";
    cont22.parent = cam;
    cont22.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    var cDoc = cont22.property("ADBE Text Properties").property("ADBE Text Document");
    for (var n22 = 1; n22 <= 22; n22++) {
        var ctd = cDoc.value;
        ctd.text = String(n22);
        cDoc.setValueAtTime(1.95 + (n22 - 1) * 0.072, ctd);
    }
    var c22op = cont22.property("ADBE Transform Group").property("ADBE Opacity");
    c22op.setValueAtTime(1.90, 0);
    c22op.setValueAtTime(2.10, 100);
    // funde por tras do telefone
    c22op.setValueAtTime(6.3, 100);
    c22op.setValueAtTime(6.62, 0);
    var c22sc = cont22.property("ADBE Transform Group").property("ADBE Scale");
    c22sc.setValueAtTime(6.3, [100, 100]);
    c22sc.setValueAtTime(6.62, [28, 28]);
    easeK(c22sc, 2);

    // ---- CARDS de tarefas contábeis em volta (22 anos de trabalho) ----
    var NOMES_T = ["Guia DAS paga", "Folha fechada", "CNPJ aberto", "IRPJ entregue",
        "Balanço anual", "Certidão emitida", "Imposto economizado",
        "Nota fiscal emitida", "MEI regularizado", "Parcelamento quitado",
        "Folha de 13º", "Alvará renovado", "Restituição recebida", "Multa evitada"];
    var TAREFAS = [];
    for (var ri = 0; ri < NOMES_T.length; ri++) {
        var angR = -Math.PI / 2 + ri * (Math.PI * 2 / NOMES_T.length) + (ri % 2) * 0.1;
        var RX = (ri % 2 === 0) ? 1300 : 880;
        var RY = (ri % 2 === 0) ? 720 : 480;
        TAREFAS.push({ txt: NOMES_T[ri], p: [CX2 + Math.cos(angR) * RX, CY2 + Math.sin(angR) * RY] });
    }
    for (var ci = 0; ci < TAREFAS.length; ci++) {
        var TA = TAREFAS[ci];
        var card = t7.layers.addShape();
        card.name = "T7V-tarefa-" + (ci + 1);
        var cw = 110 + TA.txt.length * 19 + 86;
        // ordem de pintura em shape: 1º grupo adicionado fica NA FRENTE
        // check branco (frente) > quadradinho coral > rect branco do card (fundo)
        var vg = card.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        vg.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([-cw / 2 + 70, 0]);
        var vgc = vg.property("ADBE Vectors Group");
        var vp = vgc.addProperty("ADBE Vector Shape - Group");
        var vs = new Shape();
        vs.vertices = [[-13, 2], [-4, 11], [14, -9]];
        vs.closed = false;
        vp.property("ADBE Vector Shape").setValue(vs);
        var vst = vgc.addProperty("ADBE Vector Graphic - Stroke");
        vst.property("ADBE Vector Stroke Color").setValue(BRANCO);
        vst.property("ADBE Vector Stroke Width").setValue(7);
        vst.property("ADBE Vector Stroke Line Cap").setValue(2);
        var qg = card.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        qg.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([-cw / 2 + 70, 0]);
        var qgc = qg.property("ADBE Vectors Group");
        var qr = qgc.addProperty("ADBE Vector Shape - Rect");
        qr.property("ADBE Vector Rect Size").setValue([56, 56]);
        qr.property("ADBE Vector Rect Roundness").setValue(15);
        var qf = qgc.addProperty("ADBE Vector Graphic - Fill");
        qf.property("ADBE Vector Fill Color").setValue(CORAL600);
        var g = card.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var gc = g.property("ADBE Vectors Group");
        var rc = gc.addProperty("ADBE Vector Shape - Rect");
        rc.property("ADBE Vector Rect Size").setValue([cw, 116]);
        rc.property("ADBE Vector Rect Roundness").setValue(40);
        var st = gc.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(INK_300); // border-strong: hairline sumia no papel
        st.property("ADBE Vector Stroke Width").setValue(3);
        var fl = gc.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(BRANCO);

        card.property("ADBE Transform Group").property("ADBE Position").setValue([TA.p[0], TA.p[1]]);
        card.parent = cam;
        card.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
        var tPop = 2.0 + ci * 0.115; // pipoca conforme o contador conta
        var tFun = 5.75 + ci * 0.035;
        var cop = card.property("ADBE Transform Group").property("ADBE Opacity");
        cop.setValueAtTime(tPop, 0);
        cop.setValueAtTime(tPop + 4 / FPS, 100);
        cop.setValueAtTime(tFun + 0.3, 100);
        cop.setValueAtTime(tFun + 0.55, 0);
        var csc = card.property("ADBE Transform Group").property("ADBE Scale");
        csc.setValueAtTime(tPop, [70, 70]);
        csc.setValueAtTime(tPop + 6 / FPS, [100, 100]);
        easeK(csc, 2);
        csc.setValueAtTime(tFun, [100, 100]);
        csc.setValueAtTime(tFun + 0.55, [24, 24]);
        var cpp = card.property("ADBE Transform Group").property("ADBE Position");
        cpp.setValueAtTime(tFun, [TA.p[0], TA.p[1]]);
        cpp.setValueAtTime(tFun + 0.55, [CX2, CY2]);
        easeK(cpp, 2);
        cpp.expression =
            "var f = Math.min(1, Math.max(0, time - " + (tPop + 0.3) + ") / 0.8); seedRandom(" + (ci + 11) + ", false); var v = wiggle(0.34, 13); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f];";

        // texto INDEPENDENTE com as mesmas keys (mesma seed -> flutuam juntos)
        var texTa = texto(t7, TA.txt, "Sora-SemiBold", 34, INK_900, TA.p[0] + 36, TA.p[1] + 12, 0);
        texTa.name = "T7V-tarefa-txt-" + (ci + 1);
        texTa.parent = cam;
        texTa.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
        var top2 = texTa.property("ADBE Transform Group").property("ADBE Opacity");
        top2.setValueAtTime(tPop, 0);
        top2.setValueAtTime(tPop + 5 / FPS, 100);
        top2.setValueAtTime(tFun + 0.25, 100);
        top2.setValueAtTime(tFun + 0.5, 0);
        var tpp = texTa.property("ADBE Transform Group").property("ADBE Position");
        tpp.setValueAtTime(tFun, [TA.p[0] + 40, TA.p[1] + 13]);
        tpp.setValueAtTime(tFun + 0.55, [CX2, CY2]);
        easeK(tpp, 2);
        tpp.expression =
            "var f = Math.min(1, Math.max(0, time - " + (tPop + 0.3) + ") / 0.8); seedRandom(" + (ci + 11) + ", false); var v = wiggle(0.34, 13); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f];";
    }

    // ==== CELULAR: surge DA CÂMERA e vai de encontro ao fundo ====
    var rig = t7.layers.addNull(dur);
    rig.name = "T7V-PHONE3D";
    rig.threeDLayer = true;
    rig.property("ADBE Transform Group").property("ADBE Position").setValue([CX2, CY2, 0]);
    rig.parent = cam;

    var fone = findItem("iphone-t7-splash.png");
    if (!fone) {
        var fA7 = findItem("03-ASSETS");
        fone = proj.importFile(new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/iphone-t7-splash.png")));
        fone.name = "iphone-t7-splash.png";
        if (fA7) fone.parentFolder = fA7;
    }
    var frame = t7.layers.add(fone);
    frame.name = "T7V-fone3d";
    frame.threeDLayer = true;
    frame.property("ADBE Transform Group").property("ADBE Position").setValue([CX2, CY2, 2]);
    frame.property("ADBE Transform Group").property("ADBE Scale").setValue([ESC, ESC, ESC]);
    frame.parent = rig;
    var frOp = frame.property("ADBE Transform Group").property("ADBE Opacity");
    frOp.setValueAtTime(0, 0);
    frOp.setValueAtTime(0, 0);
    frOp.setValueAtTime(T_BATE - 1 / FPS, 0);
    frOp.setValueAtTime(T_BATE, 100); // assume no impacto (handoff do flip)

    // voo da camera -> IMPACTO no fundo -> arrastado pra direita
    var rSc = rig.property("ADBE Transform Group").property("ADBE Scale");
    rSc.setValueAtTime(T_VEM - 0.1, [172, 172, 172]);
    rSc.setValueAtTime(T_BATE, [100, 100, 100]); // fim linear = batida seca
    var rp = rig.property("ADBE Transform Group").property("ADBE Position");
    rp.setValueAtTime(T_VEM - 0.1, [CX2 - 240, -560, 0]); // entra em quadro na diagonal
    rp.setValueAtTime(T_BATE, [CX2, CY2, 0]);
    rp.setValueAtTime(T_BATE + 4 / FPS, [CX2, CY2, 0]);
    rp.setValueAtTime(8.15, [CX2, CY2, 0]); // segura o CENTRO ate "produto novo." acabar (narracao v2)
    rp.setValueAtTime(8.85, [FX_FIM, CY2, 0]); // arrastado JUNTO da descida da legenda (Pedro 21/08)
    easeK(rp, 5);
    // FLIP UNICO com o RENDER REAL 3D: sequencia do Blender (1 volta) na queda
    var seqFlip = findItem("SEQ-spin-t5");
    if (!seqFlip) {
        var ioF = new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/spin-t5/spin_0000.png"));
        ioF.sequence = true;
        seqFlip = proj.importFile(ioF);
        seqFlip.name = "SEQ-spin-t5";
        var fAF = findItem("03-ASSETS"); if (fAF) seqFlip.parentFolder = fAF;
        seqFlip.mainSource.conformFrameRate = 30;
    }
    var flip = t7.layers.add(seqFlip);
    flip.name = "T7V-flip";
    flip.threeDLayer = true;
    flip.startTime = T_VEM - 0.1;
    flip.stretch = 90.9; // 1 volta em 1.0s (mais lento)
    flip.outPoint = T_BATE;
    flip.inPoint = T_VEM - 0.1;
    flip.frameBlendingType = FrameBlendingType.FRAME_MIX;
    flip.parent = rig;
    flip.property("ADBE Transform Group").property("ADBE Scale").setValue([ESC, ESC, ESC]);
    // local do flip = local do render estatico (rig ja tem keys; preserve mentiria)
    var fLoc = frame.property("ADBE Transform Group").property("ADBE Position").value;
    flip.property("ADBE Transform Group").property("ADBE Position").setValue([fLoc[0], fLoc[1], fLoc[2] - 0.5]);
    var flOp = flip.property("ADBE Transform Group").property("ADBE Opacity");
    flOp.setValueAtTime(T_VEM - 0.1, 0);
    flOp.setValueAtTime(T_VEM - 0.1 + 2 / FPS, 100);
    // inclinacao diagonal endireitando ao bater
    var rrz = rig.property("ADBE Transform Group").property("ADBE Rotate Z");
    rrz.setValueAtTime(T_VEM - 0.1, -38);
    rrz.setValueAtTime(T_BATE, 0);
    easeK(rrz, 2);
    rp.expression =
        "var f = Math.min(1, Math.max(0, time - 8.37) / 0.9); var v = wiggle(0.33, 24); value + [(v[0] - value[0]) * f, (v[1] - value[1]) * f, 0];";

    // ---- IMPACTO: fumaça FLUIDA (Pedro 20/08: as partículas CC PW liam
    // como "bolhas esquisitas") — agora vive em 52-fumaca-t7.jsx (solid +
    // Fractal Noise + máscara elíptica crescendo/subindo). Rodar o 52
    // DEPOIS deste take-script. ----

    // DOT MATRIX sutil no fundo inteiro, acende NO IMPACTO (Pedro 18/08:
    // ar de interface tecnologica, cores do DS)
    var matriz = t7.layers.addShape();
    matriz.name = "T7V-dotmatrix";
    matriz.parent = cam;
    matriz.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    var mzg = matriz.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var mzc = mzg.property("ADBE Vectors Group");
    var mze = mzc.addProperty("ADBE Vector Shape - Ellipse");
    mze.property("ADBE Vector Ellipse Size").setValue([9, 9]);
    var mzf = mzc.addProperty("ADBE Vector Graphic - Fill");
    mzf.property("ADBE Vector Fill Color").setValue(INK_900);
    var mzX = mzc.addProperty("ADBE Vector Filter - Repeater");
    mzX.property("ADBE Vector Repeater Copies").setValue(41);
    mzX.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([96, 0]);
    var mzY = mzc.addProperty("ADBE Vector Filter - Repeater");
    mzY.property("ADBE Vector Repeater Copies").setValue(23);
    mzY.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 96]);
    mzg.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([-1920 + 48, -1080 + 48]);
    var mzOp = matriz.property("ADBE Transform Group").property("ADBE Opacity");
    mzOp.setValueAtTime(T_BATE, 0);
    mzOp.setValueAtTime(T_BATE + 0.35, 16);
    matriz.moveBefore(man2); // acima das manchas, atras de todo o resto

    // matrix CORAL: preenche os pontos em laranja numa onda radial que
    // expande do impacto ate o fim do take (Pedro 18/08 — borda gradiente)
    var matrizC = t7.layers.addShape();
    matrizC.name = "T7V-dotmatrix-coral";
    matrizC.parent = cam;
    matrizC.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    var mcg = matrizC.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var mcc = mcg.property("ADBE Vectors Group");
    var mce = mcc.addProperty("ADBE Vector Shape - Ellipse");
    mce.property("ADBE Vector Ellipse Size").setValue([9, 9]);
    var mcf = mcc.addProperty("ADBE Vector Graphic - Fill");
    mcf.property("ADBE Vector Fill Color").setValue(CORAL600);
    var mcX = mcc.addProperty("ADBE Vector Filter - Repeater");
    mcX.property("ADBE Vector Repeater Copies").setValue(41);
    mcX.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([96, 0]);
    var mcY = mcc.addProperty("ADBE Vector Filter - Repeater");
    mcY.property("ADBE Vector Repeater Copies").setValue(23);
    mcY.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([0, 96]);
    mcg.property("ADBE Vector Transform Group").property("ADBE Vector Position").setValue([-1920 + 48, -1080 + 48]);
    // mascara radial no ponto do impacto, feather gigante = borda gradiente
    var mcm = matrizC.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var mcs = new Shape();
    var mR = 90, mK = 0.5523 * mR, mCXl = 0, mCYl = CY2 - 1080;
    mcs.vertices = [[mCXl, mCYl - mR], [mCXl + mR, mCYl], [mCXl, mCYl + mR], [mCXl - mR, mCYl]];
    mcs.inTangents = [[-mK, 0], [0, -mK], [mK, 0], [0, mK]];
    mcs.outTangents = [[mK, 0], [0, mK], [-mK, 0], [0, -mK]];
    mcs.closed = true;
    mcm.property("ADBE Mask Shape").setValue(mcs);
    mcm.property("ADBE Mask Feather").setValue([560, 560]);
    var mcExp = mcm.property("ADBE Mask Offset");
    mcExp.setValueAtTime(T_BATE + 0.2, 0);
    mcExp.setValueAtTime(dur - 0.1, 2500); // expande ate cobrir tudo no fim do take
    var mcOp = matrizC.property("ADBE Transform Group").property("ADBE Opacity");
    mcOp.setValueAtTime(T_BATE + 0.2, 0);
    mcOp.setValueAtTime(T_BATE + 0.55, 24);
    matrizC.moveBefore(matriz); // coral por cima da ink, ambas atras de tudo

    // LINHAS NEON: circuitos tracando os pontos a partir do ponto da queda
    // (Pedro 18/08) — rotas ortogonais pela malha (96px), trim paths + glow
    var circ = t7.layers.addShape();
    circ.name = "T7V-circuito";
    circ.parent = cam;
    circ.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    var cseed = 424242;
    function crnd() { cseed = (cseed * 1103515245 + 12345) % 2147483648; return cseed / 2147483648; }
    function snapX(v) { return Math.round((v + 48) / 96) * 96 - 48; }
    function snapY(v) { return Math.round((v + 1032) / 96) * 96 - 1032; }
    // (rotas de circuito removidas - Pedro 18/08: so a grade padrao)
    // TODOS os pontos conectados (Pedro 18/08): 23 fileiras horizontais
    // neon finas crescendo do x da queda pros 2 lados, em onda a partir da
    // fileira do impacto (as rotas verticais fecham a rede)
    for (var fj = 0; fj < 23; fj++) {
        var fy = -1032 + 96 * fj;
        var fg = circ.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        fg.name = "fileira-" + (fj + 1);
        var fgc = fg.property("ADBE Vectors Group");
        var fpA = fgc.addProperty("ADBE Vector Shape - Group");
        var fshA = new Shape();
        fshA.vertices = [[0, fy], [-1970, fy]];
        fshA.closed = false;
        fpA.property("ADBE Vector Shape").setValue(fshA);
        var fpB = fgc.addProperty("ADBE Vector Shape - Group");
        var fshB = new Shape();
        fshB.vertices = [[0, fy], [1970, fy]];
        fshB.closed = false;
        fpB.property("ADBE Vector Shape").setValue(fshB);
        var fst = fgc.addProperty("ADBE Vector Graphic - Stroke");
        fst.property("ADBE Vector Stroke Color").setValue([245 / 255, 161 / 255, 132 / 255]); // coral-300: leve e sobrio
        fst.property("ADBE Vector Stroke Width").setValue(3);
        fst.property("ADBE Vector Stroke Line Cap").setValue(2);
        fst.property("ADBE Vector Stroke Opacity").setValue(38);
        var ftm = fgc.addProperty("ADBE Vector Filter - Trim");
        var fte = ftm.property("ADBE Vector Trim End");
        var ft0 = T_BATE + 0.3 + Math.abs(fj - 12) * 0.12;
        fte.setValueAtTime(ft0, 0);
        fte.setValueAtTime(ft0 + 1.5, 100);
        easeK(fte, 2);
    }
    // colunas verticais fecham a GRADE (Pedro 18/08)
    for (var cj = 0; cj < 40; cj++) {
        var cx3 = -1872 + 96 * cj;
        var cg2 = circ.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        cg2.name = "coluna-" + (cj + 1);
        var cg2c = cg2.property("ADBE Vectors Group");
        var cpA = cg2c.addProperty("ADBE Vector Shape - Group");
        var cshA = new Shape();
        cshA.vertices = [[cx3, CY2 - 1080], [cx3, -1120]];
        cshA.closed = false;
        cpA.property("ADBE Vector Shape").setValue(cshA);
        var cpB = cg2c.addProperty("ADBE Vector Shape - Group");
        var cshB = new Shape();
        cshB.vertices = [[cx3, CY2 - 1080], [cx3, 1120]];
        cshB.closed = false;
        cpB.property("ADBE Vector Shape").setValue(cshB);
        var cst2 = cg2c.addProperty("ADBE Vector Graphic - Stroke");
        cst2.property("ADBE Vector Stroke Color").setValue([245 / 255, 161 / 255, 132 / 255]); // coral-300
        cst2.property("ADBE Vector Stroke Width").setValue(3);
        cst2.property("ADBE Vector Stroke Line Cap").setValue(2);
        cst2.property("ADBE Vector Stroke Opacity").setValue(38);
        var ctm2 = cg2c.addProperty("ADBE Vector Filter - Trim");
        var cte2 = ctm2.property("ADBE Vector Trim End");
        var ct0 = T_BATE + 0.3 + Math.abs(cx3) / 96 * 0.055;
        cte2.setValueAtTime(ct0, 0);
        cte2.setValueAtTime(ct0 + 1.5, 100);
        easeK(cte2, 2);
    }
    var ccOp = circ.property("ADBE Transform Group").property("ADBE Opacity");
    ccOp.setValueAtTime(T_BATE + 0.2, 0);
    ccOp.setValueAtTime(T_BATE + 0.5, 62);
    try {
        var cfx = circ.property("ADBE Effect Parade").addProperty("ADBE Glo2");
        cfx.property("ADBE Glo2-0002").setValue(62);
        cfx.property("ADBE Glo2-0003").setValue(20);
        cfx.property("ADBE Glo2-0004").setValue(0.3); // brilho leve, sobrio
    } catch (eCg) {}
    circ.moveBefore(matrizC); // acima das malhas de pontos, atras do resto

    // ---- VOLTA DO BRANCO em círculo (espelho da virada coral) ----
    var volta = t7.layers.addSolid(AMBAR, "T7V-volta-ambar", 3840, 2160, 1, dur);
    var vmk = volta.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    vmk.maskMode = MaskMode.SUBTRACT;
    var vsh = new Shape();
    var R0 = 60, k2 = 0.5523;
    vsh.vertices = [[1920, 1080 - R0], [1920 + R0, 1080], [1920, 1080 + R0], [1920 - R0, 1080]];
    vsh.inTangents = [[-R0 * k2, 0], [0, -R0 * k2], [R0 * k2, 0], [0, R0 * k2]];
    vsh.outTangents = [[R0 * k2, 0], [0, R0 * k2], [-R0 * k2, 0], [0, -R0 * k2]];
    vsh.closed = true;
    vmk.property("ADBE Mask Shape").setValue(vsh);
    vmk.property("ADBE Mask Feather").setValue([50, 50]);
    var vex = vmk.property("ADBE Mask Offset");
    vex.setValueAtTime(0.1, 0);
    vex.setValueAtTime(0.75, 4400);
    easeK(vex, 2);

    // ---- ordem ----
    for (var L2 = t7.numLayers; L2 >= 1; L2--) {
        if (t7.layer(L2).name === "T7-LETTERING") t7.layer(L2).moveToBeginning();
    }
    for (var L2b = 1; L2b <= t7.numLayers; L2b++) {
        if (t7.layer(L2b).name === "T7-LETTERING" && t7.layer(L2b).parent === null) { t7.layer(L2b).parent = cam; t7.layer(L2b).property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]); }
    }
    // legenda: desliza pra ESQUERDA junto do drag (8.65->9.45)
    for (var LL = 1; LL <= t7.numLayers; LL++) {
        if (t7.layer(LL).name === "T7-LETTERING") {
            var lpos = t7.layer(LL).property("ADBE Transform Group").property("ADBE Position");
            var lvals = [];
            for (var kk = 1; kk <= lpos.numKeys; kk++) lvals.push(lpos.keyValue(kk));
            while (lpos.numKeys > 0) lpos.removeKey(1);
            var v0 = lvals.length ? lvals[0] : [1920, 1080];
            var v1 = lvals.length ? lvals[lvals.length - 1] : [1040, 1840];
            lpos.setValueAtTime(8.65, v0);
            lpos.setValueAtTime(9.45, v1);
            easeK(lpos, 2);
        }
    }
    for (var L3 = t7.numLayers; L3 >= 1; L3--) {
        if (t7.layer(L3).name === "T7V-volta-ambar") t7.layer(L3).moveToBeginning();
    }
    fundo.moveToEnd();
    for (var L4 = 1; L4 <= t7.numLayers; L4++) {
        if (t7.layer(L4).name === "BG-T7") {
            var bg = t7.layer(L4);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T7", camadas: t7.numLayers, impacto: true };
})();
