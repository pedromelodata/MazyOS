// 52-fumaca-t7.jsx — PATCH (Pedro 20/08): troca a fumaça de partículas
// ("bolhas esquisitas") por FUMAÇA FLUIDA estilo smoke-reveal: solid com
// Fractal Noise animado + máscara elíptica que cresce e sobe dissipando.
// Idempotente: remove T7V-poeira/T7V-fumaca e recria.

(function () {
    var FPS = 30;
    var T_BATE = 6.5;
    var INK300 = [203 / 255, 197 / 255, 188 / 255];

    var proj = app.project;
    function findItem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
    // busca property por nome (AE pt-BR) ou matchName, recursiva
    function fxProp(grp, re) {
        for (var i = 1; i <= grp.numProperties; i++) {
            var p = grp.property(i);
            if (re.test(p.name) || re.test(p.matchName)) return p;
            if (p.propertyType === PropertyType.INDEXED_GROUP || p.propertyType === PropertyType.NAMED_GROUP) {
                var sub = fxProp(p, re);
                if (sub) return sub;
            }
        }
        return null;
    }
    // elipse bezier aproximada
    function elipse(cx, cy, rx, ry) {
        var k = 0.5523;
        var s = new Shape();
        s.vertices = [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]];
        s.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
        s.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
        s.closed = true;
        return s;
    }

    var t7 = findItem("T7");
    if (!t7 || !(t7 instanceof CompItem)) { $.global.ESCALADA_RESULT = { erro: "T7 nao achado" }; return; }
    t7.time = 0;
    var dur = t7.duration;

    var cam = null, frame = null;
    for (var L = 1; L <= t7.numLayers; L++) {
        var la = t7.layer(L);
        if (la.name === "T7V-cam") cam = la;
        if (la.name === "T7V-poeira" || la.name === "T7V-fumaca") { la.remove(); L--; }
    }
    // fallback: acha o null da camera pelo parent do dotmatrix
    if (!cam) {
        for (var L2 = 1; L2 <= t7.numLayers; L2++) {
            if (t7.layer(L2).name === "T7V-dotmatrix" && t7.layer(L2).parent) { cam = t7.layer(L2).parent; break; }
        }
    }
    for (var L3 = 1; L3 <= t7.numLayers; L3++) {
        if (t7.layer(L3).name === "T7V-frame" || (t7.layer(L3).source && t7.layer(L3).source.name && t7.layer(L3).source.name.indexOf("iphone") === 0)) { frame = t7.layer(L3); break; }
    }

    // ---- fumaça fluida: 1 solid, mascara crescendo/subindo + fractal noise ----
    var fum = t7.layers.addSolid(INK300, "T7V-fumaca", 3840, 2160, 1, dur);
    if (cam) fum.parent = cam;
    fum.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100]);
    fum.property("ADBE Transform Group").property("ADBE Position").setValue([1920, 1080]);

    // Pedro 20/08: fumaça DE DENTRO PRA FORA do celular — nasce rente à
    // silhueta do aparelho (do topo à base, escondida atrás dele) e vaza
    // pelas bordas expandindo pouco, estilo smoke-reveal
    var mk = fum.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mk.maskMode = MaskMode.ADD;
    var mp = mk.property("ADBE Mask Shape");
    mp.setValueAtTime(T_BATE - 1 / FPS, elipse(1920, 1240, 430, 850));  // ~silhueta do celular
    mp.setValueAtTime(T_BATE + 0.50, elipse(1920, 1215, 640, 990));    // vazou pelas bordas
    mp.setValueAtTime(T_BATE + 1.30, elipse(1920, 1170, 780, 1080));   // dissipando pra fora
    mk.property("ADBE Mask Feather").setValue([200, 200]);

    try {
        var fn = fum.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
        var pContr = fxProp(fn, /contrast|contraste/i);
        if (pContr) pContr.setValue(150);
        var pBril = fxProp(fn, /brilho|brightness/i);
        if (pBril) pBril.setValue(-35);
        var pEsc = fxProp(fn, /"?scale"?$|^escala$/i);
        if (pEsc) { try { pEsc.setValue(210); } catch (e1) {} }
        var pEvo = fxProp(fn, /evolu/i);
        if (pEvo) {
            pEvo.setValueAtTime(T_BATE - 1 / FPS, 0);
            pEvo.setValueAtTime(T_BATE + 1.35, 700); // graus: ~2 voltas de fluido
        }
        var pOff = fxProp(fn, /turbul.*(origem|offset)|offset turbulence|deslocamento da turbul/i);
        if (pOff) {
            pOff.setValueAtTime(T_BATE - 1 / FPS, [1920, 1140]);
            pOff.setValueAtTime(T_BATE + 1.35, [1980, 900]); // fumaca sobe e deriva
        }
    } catch (eFN) {}
    try {
        var bl = fum.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        bl.property("ADBE Gaussian Blur 2-0001").setValue(16);
    } catch (eBL) {}

    var fop = fum.property("ADBE Transform Group").property("ADBE Opacity");
    fop.setValueAtTime(T_BATE - 1 / FPS, 0);
    fop.setValueAtTime(T_BATE + 0.12, 36);
    fop.setValueAtTime(T_BATE + 0.55, 24);
    fop.setValueAtTime(T_BATE + 1.35, 0);

    fum.inPoint = T_BATE - 1 / FPS;
    fum.outPoint = T_BATE + 1.4;
    if (frame) fum.moveAfter(frame); // por TRAS do celular

    $.global.ESCALADA_RESULT = { patch: "fumaca-v2", cam: cam ? cam.name : "sem cam", atras_de: frame ? frame.name : "topo" };
})();
