// 40-take-t4.jsx — produção visual do T4 "0,7%" (idempotente)
// Beats (take-relativo): 0-3.93 pergunta sobre campo aceso · 4.35-5.15 APAGÃO em
// varredura (sobra cluster 5x5=25 acesos de ~3520 visíveis = 0,71%, honesto) ·
// 4.55 âncora "0,7%" coral 720px AO LADO do cluster · 6.9 fileira de 100 ·
// 8.248 ("cem.") 1 aceso + micro-label "MENOS DE 1 EM CADA 100" · 8.7-10.2 respiro.
// Campo de ícones: 1 shape layer + 2 Repeaters (80x44, pitch 48/49) — LOD da SPEC.
// Grade do cluster registrada na grade do campo (offset múltiplo do pitch).

(function () {
    var FPS = 30;
    var TEXTO_DARK = [244 / 255, 241 / 255, 236 / 255];
    var CORAL_500 = [242 / 255, 100 / 255, 60 / 255];
    var CINZA_TERC = [142 / 255, 137 / 255, 129 / 255]; // text-tertiary dark

    var proj = app.project;
    function findItem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
    function pasta(nome) {
        var it = findItem(nome);
        if (it && it instanceof FolderItem) return it;
        return proj.items.addFolder(nome);
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
    // glifo de pessoa (cabeça + ombros) num grupo de shape layer
    function glifo(layer, headD, bodyW, bodyH, bodyR, headY, bodyY, cor) {
        var grp = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var cont = grp.property("ADBE Vectors Group");
        var head = cont.addProperty("ADBE Vector Shape - Ellipse");
        head.property("ADBE Vector Ellipse Size").setValue([headD, headD]);
        head.property("ADBE Vector Ellipse Position").setValue([0, headY]);
        var body = cont.addProperty("ADBE Vector Shape - Rect");
        body.property("ADBE Vector Rect Size").setValue([bodyW, bodyH]);
        body.property("ADBE Vector Rect Roundness").setValue(bodyR);
        body.property("ADBE Vector Rect Position").setValue([0, bodyY]);
        var fill = cont.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(cor);
        return cont;
    }
    function repetidor(cont, copias, dx, dy) {
        var rep = cont.addProperty("ADBE Vector Filter - Repeater");
        rep.property("ADBE Vector Repeater Copies").setValue(copias);
        rep.property("ADBE Vector Repeater Transform").property("ADBE Vector Repeater Position").setValue([dx, dy]);
        return rep;
    }
    function texto(comp, str, fonte, tam, cor, x, y, tracking) {
        var ly = comp.layers.addText(str);
        var tdoc = ly.property("ADBE Text Properties").property("ADBE Text Document");
        var td = tdoc.value;
        td.resetCharStyle();
        td.font = fonte;
        td.fontSize = tam;
        td.fillColor = cor;
        td.applyStroke = false;
        td.tracking = tracking || 0;
        td.justification = ParagraphJustification.CENTER_JUSTIFY;
        tdoc.setValue(td);
        ly.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        return ly;
    }

    var t4 = findItem("T4");
    if (!t4) { $.global.ESCALADA_RESULT = { erro: "T4 não existe" }; return; }
    var dur = t4.duration;

    // idempotência: remove camadas T4V-* e precomp do campo
    for (var L = t4.numLayers; L >= 1; L--) {
        if (t4.layer(L).name.indexOf("T4V-") === 0) t4.layer(L).remove();
    }
    var oldCampo = findItem("PRE-icones-campo");
    if (oldCampo) oldCampo.remove();

    // ---- PRE-icones-campo: 80x44 = 3520 ícones ----
    var fPre = pasta("02-PRECOMPS");
    var campo = proj.items.addComp("PRE-icones-campo", 3840, 2160, 1, 15, FPS);
    campo.parentFolder = fPre;
    var cl = campo.layers.addShape();
    cl.name = "campo-3520";
    var cont = glifo(cl, 18, 34, 18, 9, -14, 8, TEXTO_DARK);
    repetidor(cont, 80, 48, 0);
    repetidor(cont, 44, 0, 49);
    cl.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
    cl.property("ADBE Transform Group").property("ADBE Position").setValue([24, 25]);

    // ---- câmera (drift 100->103) ----
    var cam = t4.layers.addNull(dur);
    cam.name = "T4V-CAM";
    cam.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([1920, 1080]);
    cam.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);
    var cs = cam.property("ADBE Transform Group").property("ADBE Scale");
    cs.setValueAtTime(0, [100, 100]);
    cs.setValueAtTime(dur, [103, 103]);

    // ---- campo dim (estado apagado, sempre presente) ----
    var dim = t4.layers.add(campo);
    dim.name = "T4V-campo-dim";
    dim.property("ADBE Transform Group").property("ADBE Opacity").setValue(12);
    dim.parent = cam;

    // ---- campo aceso (some na varredura via Linear Wipe) ----
    var lit = t4.layers.add(campo);
    lit.name = "T4V-campo-lit";
    lit.property("ADBE Transform Group").property("ADBE Opacity").setValue(42);
    lit.parent = cam;
    var wipe = lit.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
    wipe.property("ADBE Linear Wipe-0002").setValue(90); // luz recua da esquerda pra direita
    wipe.property("ADBE Linear Wipe-0003").setValue(400); // feather
    var compl = wipe.property("ADBE Linear Wipe-0001");
    compl.setValueAtTime(4.35, 0);
    compl.setValueAtTime(5.15, 100);
    easeChegada(compl);

    // ---- cluster 5x5 = 25 acesos, registrado na grade (célula 50..54 x 18..22) ----
    var clu = t4.layers.addShape();
    clu.name = "T4V-cluster-25";
    var contC = glifo(clu, 18, 34, 18, 9, -14, 8, TEXTO_DARK);
    repetidor(contC, 5, 48, 0);
    repetidor(contC, 5, 0, 49);
    clu.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
    clu.property("ADBE Transform Group").property("ADBE Position").setValue([24 + 48 * 50, 25 + 49 * 18]);
    clu.parent = cam;
    var cluOp = clu.property("ADBE Transform Group").property("ADBE Opacity");
    cluOp.setValueAtTime(0, 0);
    cluOp.setValueAtTime(4.84, 0);
    cluOp.setValueAtTime(5.0, 100);


    // ---- scrim do terço inferior (contraste da legenda) ----
    var scrim = t4.layers.addSolid([11 / 255, 13 / 255, 18 / 255], "T4V-scrim", 3840, 2160, 1, dur);
    var mk = scrim.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var sh = new Shape();
    sh.vertices = [[0, 1560], [3840, 1560], [3840, 2160], [0, 2160]];
    sh.closed = true;
    mk.property("ADBE Mask Shape").setValue(sh);
    mk.property("ADBE Mask Feather").setValue([0, 420]);
    scrim.property("ADBE Transform Group").property("ADBE Opacity").setValue(80);

    // ---- âncora 0,7% coral 720px, ao lado do cluster ----
    var anc = texto(t4, "0,7%", "Sora-Bold", 720, CORAL_500, 1150, 1250, -20);
    anc.name = "T4V-ancora-07";
    var aop = anc.property("ADBE Transform Group").property("ADBE Opacity");
    aop.setValueAtTime(4.55, 0);
    aop.setValueAtTime(4.55 + 8 / FPS, 100);
    easeChegada(aop);
    var asc = anc.property("ADBE Transform Group").property("ADBE Scale");
    asc.setValueAtTime(4.55, [96, 96]);
    asc.setValueAtTime(4.55 + 8 / FPS, [100, 100]);
    easeChegada(asc);

    // ---- micro-label fonte do dado ----
    var fonte = texto(t4, "PESQUISA DE MERCADO · 2026", "Sora-SemiBold", 48, CINZA_TERC, 1150, 1460, 80);
    fonte.name = "T4V-fonte-dado";
    var fop = fonte.property("ADBE Transform Group").property("ADBE Opacity");
    fop.setValueAtTime(5.0, 0);
    fop.setValueAtTime(5.0 + 8 / FPS, 100);

    // ---- fileira de 100 (1 aceso) ----
    var fil = t4.layers.addShape();
    fil.name = "T4V-fileira-100";
    var contF = glifo(fil, 12, 22, 12, 6, -9, 5, TEXTO_DARK);
    repetidor(contF, 100, 32, 0);
    fil.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
    fil.property("ADBE Transform Group").property("ADBE Position").setValue([352, 1520]);
    var filOp = fil.property("ADBE Transform Group").property("ADBE Opacity");
    filOp.setValueAtTime(6.9, 0);
    filOp.setValueAtTime(6.9 + 5 / FPS, 24);

    var um = t4.layers.addShape();
    um.name = "T4V-fileira-aceso";
    glifo(um, 17, 30, 17, 8, -13, 7, TEXTO_DARK);
    um.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
    um.property("ADBE Transform Group").property("ADBE Position").setValue([352 + 36 * 32, 1520]);
    var umOp = um.property("ADBE Transform Group").property("ADBE Opacity");
    umOp.setValueAtTime(8.248, 0);
    umOp.setValueAtTime(8.248 + 5 / FPS, 100);
    var umSc = um.property("ADBE Transform Group").property("ADBE Scale");
    umSc.setValueAtTime(8.248, [80, 80]);
    umSc.setValueAtTime(8.248 + 5 / FPS, [100, 100]);
    easeChegada(umSc);

    // ---- micro-label da fileira ----
    var lab = texto(t4, "MENOS DE 1 EM CADA 100", "Sora-SemiBold", 48, TEXTO_DARK, 1920, 1640, 80);
    lab.name = "T4V-label-100";
    lab.property("ADBE Transform Group").property("ADBE Opacity").setValue(70);
    var lop = lab.property("ADBE Transform Group").property("ADBE Opacity");
    lop.setValueAtTime(8.30, 0);
    lop.setValueAtTime(8.30 + 5 / FPS, 70);
    var lpos = lab.property("ADBE Transform Group").property("ADBE Position");
    lpos.setValueAtTime(8.30, [1920, 1664]);
    lpos.setValueAtTime(8.30 + 5 / FPS, [1920, 1640]);
    easeChegada(lpos);

    // lettering e BG nos lugares certos
    for (var L2 = t4.numLayers; L2 >= 1; L2--) {
        var nm = t4.layer(L2).name;
        if (nm === "T4-LETTERING") t4.layer(L2).moveToBeginning();
    }
    for (var L3 = 1; L3 <= t4.numLayers; L3++) {
        if (t4.layer(L3).name === "BG-T4") {
            var bg = t4.layer(L3);
            bg.locked = false;
            bg.moveToEnd();
            bg.locked = true;
            break;
        }
    }

    $.global.ESCALADA_RESULT = { take: "T4", camadas: t4.numLayers, campoIcones: 3520, cluster: 25 };
})();
