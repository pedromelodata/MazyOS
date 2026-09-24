// 49-take-t8.jsx — T8 "Vai, legaliza aí" — TAKE FULL-HIGGSFIELD (v5, idempotente)
// Direção Pedro 19/08: o take inteiro é o vídeo IA (t8-fullia.mp4, Seedance,
// start frame = cena real do filme): suricato realista entra, tira a logo da
// tela (o símbolo sai e flutua), faz o gesto do check e acena.
// Por cima, do filme: lettering (6.0+), áudio t8.wav (6.0) e balão opcional.

(function () {
    var FPS = 30;
    var BRANCO = [1, 1, 1];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];

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
    function vid(nome) {
        var it = findItem(nome);
        if (!it) {
            var fA = findItem("03-ASSETS");
            it = proj.importFile(new ImportOptions(new File("C:/Projects/Legalizei_Videos/marketing/filme/escalada/assets/mascote/" + nome)));
            it.name = nome;
            if (fA) it.parentFolder = fA;
        }
        return it;
    }

    var t8 = findItem("T8");
    if (!t8) { $.global.ESCALADA_RESULT = { erro: "T8 não existe" }; return; }
    var dur = t8.duration; // 8.7
    t8.time = 0;
    t8.frameBlending = true;

    for (var L = t8.numLayers; L >= 1; L--) {
        if (t8.layer(L).name.indexOf("T8V-") === 0) t8.layer(L).remove();
    }

    // ---- o take inteiro: vídeo IA full-frame (10s -> 8.7s) ----
    var cena = t8.layers.add(vid("t8-fullia.mp4"));
    cena.name = "T8V-cena";
    cena.startTime = 0;
    cena.stretch = 87; // 10.0s -> 8.7s
    cena.inPoint = 0;
    cena.outPoint = dur;
    cena.frameBlendingType = FrameBlendingType.FRAME_MIX;
    // escala base dinamica: video 1080p -> 200%; 4K -> 100% (upscale 20/08)
    var SBASE = 3840 / Math.max(1, cena.source.width) * 100;
    cena.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);
    cena.property("ADBE Transform Group").property("ADBE Scale").setValue([SBASE, SBASE]);

    // ---- zoom-ponte (Pedro 20/08): o take abre a 112% (continuando o
    // zoom-in do fim do T7 no celular, ponto fixo 2660,1240 do comp) e
    // relaxa pra base em 2s enquanto o push-in interno do video segue ----
    var zSc = cena.property("ADBE Transform Group").property("ADBE Scale");
    var zPo = cena.property("ADBE Transform Group").property("ADBE Position");
    var fw = 1330 * (cena.source.width / 1920), fh = 620 * (cena.source.width / 1920);
    var ax = cena.source.width / 2, ay = cena.source.height / 2;
    var s0 = SBASE * 1.12;
    zSc.setValueAtTime(0, [s0, s0]);
    zSc.setValueAtTime(2.0, [SBASE, SBASE]);
    easeK(zSc, 2); // chegada suave; key 1 linear pra emendar o corte
    zPo.setValueAtTime(0, [2660 - (fw - ax) * (s0 / 100), 1240 - (fh - ay) * (s0 / 100)]);
    zPo.setValueAtTime(2.0, [1920, 1080]);
    easeK(zPo, 2);

    // ---- balão de fala (VERSÃO A — desligado = versão B/narrador) ----
    var balao = t8.layers.addShape();
    balao.name = "T8V-balao";
    var blg = balao.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var blc = blg.property("ADBE Vectors Group");
    var blr = blc.addProperty("ADBE Vector Shape - Rect");
    blr.property("ADBE Vector Rect Size").setValue([680, 180]);
    blr.property("ADBE Vector Rect Roundness").setValue(90);
    var blt = blc.addProperty("ADBE Vector Shape - Group");
    var tsh = new Shape();
    tsh.vertices = [[-40, 86], [60, 86], [-80, 190]];
    tsh.closed = true;
    blt.property("ADBE Vector Shape").setValue(tsh);
    var blf = blc.addProperty("ADBE Vector Graphic - Fill");
    blf.property("ADBE Vector Fill Color").setValue(BRANCO);
    balao.property("ADBE Transform Group").property("ADBE Position").setValue([2450, 660]);
    var boSc = balao.property("ADBE Transform Group").property("ADBE Scale");
    boSc.setValueAtTime(6.3, [0, 0]);
    boSc.setValueAtTime(6.52, [108, 108]);
    boSc.setValueAtTime(6.64, [100, 100]);
    easeK(boSc, 2);
    var btx = t8.layers.addText("Vai, legaliza aí!");
    btx.name = "T8V-balao-txt";
    var btd = btx.property("ADBE Text Properties").property("ADBE Text Document");
    var btv = btd.value;
    btv.resetCharStyle();
    btv.font = "Sora-Bold";
    btv.fontSize = 58;
    btv.fillColor = CORAL600;
    btv.applyStroke = false;
    btv.justification = ParagraphJustification.CENTER_JUSTIFY;
    btd.setValue(btv);
    // parent PRIMEIRO e position LOCAL direta: com o balao a scale 0 no
    // playhead, o parent-preserve degenera e joga o texto pra fora da tela
    btx.parent = balao;
    btx.property("ADBE Transform Group").property("ADBE Position").setValue([0, 20]);
    btx.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    balao.enabled = false;
    btx.enabled = false;

    // ---- áudio + lettering do filme por cima ----
    for (var A = 1; A <= t8.numLayers; A++) {
        var la = t8.layer(A);
        if (la.name === "t8.wav") la.startTime = 6.0;
        if (la.name === "T8-LETTERING") {
            la.startTime = 6.0;
            la.property("ADBE Transform Group").property("ADBE Position").setValue([2050, 1010]); // EM CIMA do icone que ele segura (Pedro 21/08)
        }
    }

    // ---- ordem ----
    for (var L2 = t8.numLayers; L2 >= 1; L2--) {
        if (t8.layer(L2).name === "T8-LETTERING") t8.layer(L2).moveToBeginning();
    }
    cena.moveToEnd();
    for (var L3 = 1; L3 <= t8.numLayers; L3++) {
        if (t8.layer(L3).name === "BG-T8") {
            var bg8 = t8.layer(L3);
            bg8.locked = false;
            bg8.moveToEnd();
            bg8.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T8", camadas: t8.numLayers, mascote: "full-higgsfield v5" };
})();
