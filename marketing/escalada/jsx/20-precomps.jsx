// 20-precomps.jsx — precomps estruturais (idempotente)
// PRE-phone-frame · PRE-card · PRE-contador (slider + expressão pt-BR) · PRE-mapa
// PRE-lettering-rig · PRE-grade-grain · PRE-mascote (SLOT do T8, nulls riggados)

(function () {
    var FPS = 30;
    var PAGE_DARK = [21 / 255, 23 / 255, 28 / 255];   // #15171C
    var CARD_DARK = [31 / 255, 34 / 255, 40 / 255];   // #1F2228
    var HAIRLINE = [46 / 255, 49 / 255, 58 / 255];    // #2E313A
    var TEXTO_DARK = [244 / 255, 241 / 255, 236 / 255]; // #F4F1EC

    var proj = app.project;

    function findItem(nome) {
        for (var i = 1; i <= proj.numItems; i++) {
            if (proj.item(i).name === nome) { return proj.item(i); }
        }
        return null;
    }
    function removeItem(nome) {
        var it = findItem(nome);
        if (it) { it.remove(); }
    }
    function pasta(nome) {
        var it = findItem(nome);
        if (it && it instanceof FolderItem) { return it; }
        return proj.items.addFolder(nome);
    }
    function rrect(layer, tamanho, raio, fillCor, strokeCor, strokeW) {
        var grp = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var rc = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        rc.property("ADBE Vector Rect Size").setValue(tamanho);
        rc.property("ADBE Vector Rect Roundness").setValue(raio);
        if (strokeCor) {
            var st = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(strokeCor);
            st.property("ADBE Vector Stroke Width").setValue(strokeW || 4);
        }
        if (fillCor) {
            var fl = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fillCor);
        }
        return grp;
    }

    var fPre = pasta("02-PRECOMPS");
    var nomes = ["PRE-phone-frame", "PRE-card", "PRE-contador", "PRE-mapa",
                 "PRE-lettering-rig", "PRE-grade-grain", "PRE-mascote"];
    for (var n = 0; n < nomes.length; n++) { removeItem(nomes[n]); }

    // PRE-phone-frame — outline hairline de iPhone (proporção telas 1290x2796 + moldura)
    var phone = proj.items.addComp("PRE-phone-frame", 1400, 2910, 1, 10, FPS);
    phone.parentFolder = fPre;
    var pf = phone.layers.addShape();
    pf.name = "frame-outline";
    rrect(pf, [1350, 2860], 180, null, HAIRLINE, 6);
    var slotTela = phone.layers.addNull(10);
    slotTela.name = "SLOT-TELA";  // âncora pra parentear PNG 1290x2796

    // PRE-card — card dark padrão (raio 16 escalado pra 4K = 32px @2x… mantém 16 nominal do token)
    var card = proj.items.addComp("PRE-card", 1200, 720, 1, 10, FPS);
    card.parentFolder = fPre;
    var cd = card.layers.addShape();
    cd.name = "card-bg";
    rrect(cd, [1160, 680], 16, CARD_DARK, HAIRLINE, 2);

    // PRE-contador — text layer + Slider, formatação pt-BR (pontos de milhar)
    var cont = proj.items.addComp("PRE-contador", 2400, 800, 1, 12, FPS);
    cont.parentFolder = fPre;
    var ctrl = cont.layers.addNull(12);
    ctrl.name = "CTRL";
    var slider = ctrl.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    slider.name = "Contador";
    var txt = cont.layers.addText("0");
    txt.name = "numero";
    var doc = txt.property("ADBE Text Properties").property("ADBE Text Document");
    var td = doc.value;
    td.resetCharStyle();
    td.font = "Sora-Bold";
    td.fontSize = 560;
    td.fillColor = TEXTO_DARK;
    td.applyStroke = false;
    td.justification = ParagraphJustification.CENTER_JUSTIFY;
    doc.setValue(td);
    txt.property("ADBE Transform Group").property("ADBE Position").setValue([1200, 560]);
    doc.expression =
        'var n = Math.round(thisComp.layer("CTRL").effect("Contador")("ADBE Slider Control-0001"));\n' +
        'var s = "" + n; var out = ""; var c = 0;\n' +
        'for (var i = s.length - 1; i >= 0; i--) { out = s.charAt(i) + out; c++; if (c % 3 === 0 && i > 0) { out = "." + out; } }\n' +
        'out;';

    // PRE-mapa — placeholder estrutural (silhuetas entram na produção)
    var mapa = proj.items.addComp("PRE-mapa", 3840, 2160, 1, 16, FPS);
    mapa.parentFolder = fPre;
    var mnull = mapa.layers.addNull(16);
    mnull.name = "MAPA-ROOT";

    // PRE-lettering-rig — palco do rig da Fase 3
    var lr = proj.items.addComp("PRE-lettering-rig", 3840, 2160, 1, 20, FPS);
    lr.parentFolder = fPre;
    var lrnull = lr.layers.addNull(20);
    lrnull.name = "LETTERING-ROOT";

    // PRE-grade-grain — adjustment com ruído 1.5% (anti-banding; 16bpc no projeto)
    var gg = proj.items.addComp("PRE-grade-grain", 3840, 2160, 1, 93, FPS);
    gg.parentFolder = fPre;
    var adj = gg.layers.addSolid([1, 1, 1], "GRADE-GRAIN", 3840, 2160, 1, 93);
    adj.adjustmentLayer = true;
    var noise = adj.property("ADBE Effect Parade").addProperty("ADBE Noise");
    noise.property("ADBE Noise-0001").setValue(1.5); // Quantidade de ruído %

    // PRE-mascote — SLOT do T8: nulls riggados; asset do Pedro entra por parenting sem retiming
    var masc = proj.items.addComp("PRE-mascote", 3840, 2160, 1, 261 / FPS, FPS);
    masc.parentFolder = fPre;
    var root = masc.layers.addNull(261 / FPS);
    root.name = "SLOT-MASCOTE";
    root.property("ADBE Transform Group").property("ADBE Position").setValue([1200, 1400]);
    var head = masc.layers.addNull(261 / FPS);
    head.name = "mascote_head";
    head.parent = root;
    head.property("ADBE Transform Group").property("ADBE Position").setValue([0, -400]);
    var handR = masc.layers.addNull(261 / FPS);
    handR.name = "mascote_hand_R";
    handR.parent = root;
    handR.property("ADBE Transform Group").property("ADBE Position").setValue([300, -150]);

    // projeto em 16bpc (anti-banding da virada)
    proj.bitsPerChannel = 16;

    $.global.ESCALADA_RESULT = { precomps: nomes.length, bpc: proj.bitsPerChannel };
})();
