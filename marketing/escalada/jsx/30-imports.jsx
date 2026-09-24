// 30-imports.jsx — importa áudio (timeline + takes), SVGs de marca e telas do app (idempotente)
// Áudio: narracao-timeline.wav no MASTER @0; tN.wav dentro de cada comp TN @0.
// SVGs: logo horizontal (master), negativa escura (dark), símbolo. Telas: 5 PNGs travadas.

(function () {
    var BASE = "C:/Projects/Legalizei_Videos/";
    var ESC = BASE + "marketing/filme/escalada/";

    var proj = app.project;

    function findItem(nome) {
        for (var i = 1; i <= proj.numItems; i++) {
            if (proj.item(i).name === nome) { return proj.item(i); }
        }
        return null;
    }
    function pasta(nome) {
        var it = findItem(nome);
        if (it && it instanceof FolderItem) { return it; }
        return proj.items.addFolder(nome);
    }
    function importa(caminho, pastaDest) {
        var f = new File(caminho);
        if (!f.exists) { return { erro: "não existe: " + caminho }; }
        // idempotência: remove item com o mesmo nome de arquivo
        var nomeArq = f.name;
        for (var i = proj.numItems; i >= 1; i--) {
            var it = proj.item(i);
            if (it instanceof FootageItem && it.name === decodeURI(nomeArq)) { it.remove(); }
        }
        var item = proj.importFile(new ImportOptions(f));
        item.parentFolder = pastaDest;
        return item;
    }

    var fAudio = pasta("04-AUDIO");
    var fAssets = pasta("03-ASSETS");
    var fTelas = pasta("03a-TELAS");
    fTelas.parentFolder = fAssets;
    var fLogos = pasta("03b-LOGOS");
    fLogos.parentFolder = fAssets;

    var erros = [];

    // ---- áudio na MASTER ----
    var master = findItem("MASTER-3840x2160-30");
    var narr = importa(ESC + "audio/narracao-timeline.wav", fAudio);
    if (narr.erro) { erros.push(narr.erro); }
    else {
        // remove camada de áudio antiga se existir
        for (var L = master.numLayers; L >= 1; L--) {
            if (master.layer(L).name === "narracao-timeline.wav") { master.layer(L).remove(); }
        }
        var ml = master.layers.add(narr);
        ml.startTime = 0;
        ml.moveToEnd();
    }

    // ---- áudio por take ----
    for (var t = 1; t <= 8; t++) {
        var comp = findItem("T" + t);
        var wav = importa(ESC + "audio/takes/t" + t + ".wav", fAudio);
        if (wav.erro) { erros.push(wav.erro); continue; }
        for (var L2 = comp.numLayers; L2 >= 1; L2--) {
            if (comp.layer(L2).name === "t" + t + ".wav") { comp.layer(L2).remove(); }
        }
        var al = comp.layers.add(wav);
        al.startTime = 0;
        al.moveToEnd();
    }

    // ---- SVGs de marca ----
    var svgs = [
        BASE + "identidade/logos/legalizai-logo-horizontal.svg",
        BASE + "identidade/logos/legalizai-logo-negativa-escura.svg",
        BASE + "legalizei-branding/simbolo.svg"
    ];
    var svgOk = [];
    for (var s = 0; s < svgs.length; s++) {
        var r = importa(svgs[s], fLogos);
        if (r.erro) { erros.push(r.erro); } else { svgOk.push(r.name); }
    }

    // ---- telas travadas ----
    var telas = ["01-N1-splash.png", "02-N2-welcome.png", "03-N3-entrada.png",
                 "04-N4-gate-cnae.png", "05-N4-atende.png"];
    var telasOk = 0;
    for (var p = 0; p < telas.length; p++) {
        var rt = importa(BASE + "marketing/telas-filme/" + telas[p], fTelas);
        if (rt.erro) { erros.push(rt.erro); } else { telasOk++; }
    }

    $.global.ESCALADA_RESULT = { svgs: svgOk, telas: telasOk, erros: erros };
})();
