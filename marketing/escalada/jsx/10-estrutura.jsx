// 10-estrutura.jsx — MASTER 4K 2790f + T1..T8 + GUIA-safe + organização de pastas (idempotente)
// Gerado a partir de data/timeline.json (Fase 1). Frames exatos @30fps:
//   head 24f | T1@24 214f | T2@238 387f | T3@625 295f | T4@920 306f
//   T5@1226 329f | T6@1555 470f | T7@2025 504f | T8@2529 261f | total 2790f = 93.0s
// Duração de cada TN = conteúdo do take + respiro (a transição mora dentro do take).

(function () {
    var FPS = 30;
    var W = 3840, H = 2160;
    var MASTER_F = 2790;
    var TAKES = [
        // [nome, inFrames, durFrames]
        ["T1",   24, 214],
        ["T2",  238, 387],
        ["T3",  625, 295],
        ["T4",  920, 306],
        ["T5", 1226, 329],
        ["T6", 1555, 470],
        ["T7", 2025, 504],
        ["T8", 2529, 261]
    ];
    var PAGE_DARK = [21 / 255, 23 / 255, 28 / 255]; // #15171C

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
    function findOrCreateFolder(nome) {
        var it = findItem(nome);
        if (it && it instanceof FolderItem) { return it; }
        return proj.items.addFolder(nome);
    }

    // idempotência
    removeItem("MASTER-3840x2160-30");
    for (var r = 0; r < TAKES.length; r++) { removeItem(TAKES[r][0]); }
    removeItem("GUIA-safe");

    var fComps = findOrCreateFolder("01-COMPS");
    var fPre = findOrCreateFolder("02-PRECOMPS");
    var fAssets = findOrCreateFolder("03-ASSETS");
    var fAudio = findOrCreateFolder("04-AUDIO");

    // GUIA-safe: retângulo 3456x1944 central (hairline) — camada-guia, não renderiza
    var guia = proj.items.addComp("GUIA-safe", W, H, 1, 10, FPS);
    guia.parentFolder = fPre;
    var gs = guia.layers.addShape();
    gs.name = "safe-3456x1944";
    var grp = gs.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    var rect = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    rect.property("ADBE Vector Rect Size").setValue([3456, 1944]);
    var stroke = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    stroke.property("ADBE Vector Stroke Color").setValue([46 / 255, 49 / 255, 58 / 255]);
    stroke.property("ADBE Vector Stroke Width").setValue(4);

    // MASTER
    var master = proj.items.addComp("MASTER-3840x2160-30", W, H, 1, MASTER_F / FPS, FPS);
    master.parentFolder = fComps;
    master.bgColor = PAGE_DARK;

    // takes (fundo dark provisório em cada um pra QC visual; produção substitui)
    for (var t = 0; t < TAKES.length; t++) {
        var nome = TAKES[t][0], inF = TAKES[t][1], durF = TAKES[t][2];
        var comp = proj.items.addComp(nome, W, H, 1, durF / FPS, FPS);
        comp.parentFolder = fComps;
        comp.bgColor = PAGE_DARK;
        var solid = comp.layers.addSolid(PAGE_DARK, "BG-" + nome, W, H, 1, durF / FPS);
        solid.locked = true;
        var lay = master.layers.add(comp);
        lay.startTime = inF / FPS;
    }

    // camada-guia do safe no MASTER (topo)
    var gl = master.layers.add(guia);
    gl.guideLayer = true;
    gl.startTime = 0;
    gl.outPoint = MASTER_F / FPS;
    gl.moveToBeginning();

    // fade do preto no head (0 -> 0.8s)
    var fade = master.layers.addSolid([0, 0, 0], "FADE-PRETO-HEAD", W, H, 1, 1.2);
    fade.moveToBeginning();
    var op = fade.property("ADBE Transform Group").property("ADBE Opacity");
    op.setValueAtTime(0, 100);
    op.setValueAtTime(24 / FPS, 0);
    op.setTemporalEaseAtKey(2, [new KeyframeEase(0, 66)], [new KeyframeEase(0, 66)]);

    $.global.ESCALADA_RESULT = { master: master.name, frames: MASTER_F, takes: TAKES.length };
})();
