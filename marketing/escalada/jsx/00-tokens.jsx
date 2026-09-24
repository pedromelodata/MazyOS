// 00-tokens.jsx — comp _CONTROLE com Color Controls globais (idempotente)
// Fonte: data/tokens.json (valores literais embutidos; jsx aplicam literais + _CONTROLE pra ajuste global)
// Rodar dentro do AE (bridge MCP: $.evalFile). Retorna resumo via variável global ESCALADA_RESULT.

(function () {
    function hexToRgb(hex) {
        var h = hex.replace("#", "");
        return [parseInt(h.substr(0, 2), 16) / 255,
                parseInt(h.substr(2, 2), 16) / 255,
                parseInt(h.substr(4, 2), 16) / 255];
    }

    var CORES = [
        ["page-dark",     "#15171C"],
        ["card-dark",     "#1F2228"],
        ["texto-dark",    "#F4F1EC"],
        ["hairline-dark", "#2E313A"],
        ["papel",         "#FAF8F5"],
        ["coral-500",     "#F2643C"],
        ["coral-600",     "#DD4E27"],
        ["crimson",       "#E03E43"],
        ["verde-check",   "#17A06A"],
        ["warning",       "#F5A524"]
    ];

    var proj = app.project;

    // idempotência: remove _CONTROLE existente
    for (var i = proj.numItems; i >= 1; i--) {
        if (proj.item(i).name === "_CONTROLE") { proj.item(i).remove(); }
    }

    var comp = proj.items.addComp("_CONTROLE", 1920, 1080, 1, 10, 30);
    var nul = comp.layers.addNull(10);
    nul.name = "CORES";

    for (var c = 0; c < CORES.length; c++) {
        var fx = nul.property("ADBE Effect Parade").addProperty("ADBE Color Control");
        fx.name = CORES[c][0];
        fx.property("ADBE Color Control-0001").setValue(hexToRgb(CORES[c][1]));
    }

    $.global.ESCALADA_RESULT = { comp: comp.name, controles: CORES.length };
})();
