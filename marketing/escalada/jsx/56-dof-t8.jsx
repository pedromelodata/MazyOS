// 56-dof-t8.jsx — PATCH (Pedro 20/08): DOF no take do suricato — o fundo
// (grade com artefatos do upscale 4K) fica suavemente desfocado, suricato
// e celular nitidos. Duplicata com Gaussian embaixo + mascara animada na
// camada nitida (coords do VIDEO 4K). Apos a grade dissolver (~5s) a
// mascara abre pra tela cheia. Idempotente.

(function () {
    var proj = app.project;
    function findComp(n) {
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it.name === n) return it;
        }
        return null;
    }
    function rectShape(x0, x1, y0, y1) {
        var s = new Shape();
        s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        s.closed = true;
        return s;
    }

    var t8 = findComp("T8");
    if (!t8) { $.global.ESCALADA_RESULT = { erro: "T8 nao achado" }; return; }
    t8.time = 0;

    var cena = null;
    for (var L = t8.numLayers; L >= 1; L--) {
        var la = t8.layer(L);
        if (la.name === "T8V-cena-blur") { la.remove(); continue; }
        if (la.name === "T8V-cena") cena = la;
    }
    if (!cena) { $.global.ESCALADA_RESULT = { erro: "T8V-cena nao achada" }; return; }

    // limpa mascaras antigas da nitida (idempotencia)
    var mp = cena.property("ADBE Mask Parade");
    while (mp.numProperties > 0) mp.property(1).remove();

    // duplicata desfocada EMBAIXO (herda keys de scale/position do zoom-ponte)
    var blur = cena.duplicate();
    blur.name = "T8V-cena-blur";
    blur.moveAfter(cena);
    try {
        var gb = blur.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2");
        gb.property("ADBE Gaussian Blur 2-0001").setValue(14);
    } catch (eB) {}

    // DUAS mascaras justas (coords do source 4K): celular fixo + faixa
    // colada no suricato durante a caminhada — todo o resto desfocado
    var mk1 = cena.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mk1.maskMode = MaskMode.ADD;
    var p1 = mk1.property("ADBE Mask Shape");
    p1.setValueAtTime(0.0, rectShape(1950, 3840, 0, 2160)); // celular
    p1.setValueAtTime(4.8, rectShape(1950, 3840, 0, 2160));
    p1.setValueAtTime(5.6, rectShape(-300, 4140, -300, 2460)); // grade ja dissolveu: tudo nitido
    mk1.property("ADBE Mask Feather").setValue([300, 300]);

    var mk2 = cena.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    mk2.maskMode = MaskMode.ADD;
    var p2 = mk2.property("ADBE Mask Shape");
    var CAMINHO = [[0.0, 350], [0.8, 800], [1.6, 1300], [2.4, 1750], [3.0, 2050], [5.6, 2050]];
    for (var c = 0; c < CAMINHO.length; c++) {
        var cx = CAMINHO[c][1];
        p2.setValueAtTime(CAMINHO[c][0], rectShape(cx - 460, cx + 460, 0, 2160));
    }
    mk2.property("ADBE Mask Feather").setValue([300, 300]);

    $.global.ESCALADA_RESULT = { patch: "dof-t8 v2", blur: "gaussian 14", mascaras: "celular fixo + faixa do suricato" };
})();
