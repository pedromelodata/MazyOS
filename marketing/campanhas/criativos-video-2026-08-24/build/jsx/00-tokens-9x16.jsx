// 00-tokens-9x16.jsx — comp _CONTROLE com Color Controls globais da leva 9:16 (idempotente)
// Fonte: identidade/tokens.css via data/tokens.json do escalada.
// Diferenças vs escalada: acrescenta border-strong e text-tertiary (pedido do guardian na peça 7),
// e o mundo desta leva é PAPEL, não dark, então papel e card vêm primeiro.
// Rodar dentro do AE (bridge MCP). Resultado em $.global.REELS_RESULT.

(function () {
    function hexToRgb(hex) {
        var h = hex.replace("#", "");
        return [parseInt(h.substr(0, 2), 16) / 255,
                parseInt(h.substr(2, 2), 16) / 255,
                parseInt(h.substr(4, 2), 16) / 255];
    }

    // Ordem importa: é a ordem em que os Color Controls aparecem no null CORES.
    var CORES = [
        ["papel",         "#FAF8F5"],  // surface-page. NUNCA branco puro
        ["card",          "#FFFFFF"],  // surface-card
        ["surface-alt",   "#F1EEE9"],  // faixa de cabeçalho, célula vazia
        ["hairline",      "#E3DED7"],  // border-hairline
        ["border-strong", "#CBC5BC"],  // border-strong. Anel de mês já marcado, GUIA-mira
        ["ink-900",       "#1B1E24"],  // text-primary
        ["ink-600",       "#524E48"],  // text-secondary
        ["ink-500",       "#736E67"],  // text-tertiary. Micro-label e super de condição
        ["coral-500",     "#F2643C"],  // MARCA. Só logo e wordmark
        ["coral-600",     "#DD4E27"],  // AÇÃO. Fill de botão, âncora, anel
        ["verde-check",   "#17A06A"],
        ["warning",       "#F5A524"],
        ["crimson",       "#E03E43"],
        ["page-dark",     "#15171C"],  // só se alguma peça da leva usar mundo escuro
        ["card-dark",     "#1F2228"],
        ["texto-dark",    "#F4F1EC"]
    ];

    var proj = app.project;

    for (var i = proj.numItems; i >= 1; i--) {
        if (proj.item(i).name === "_CONTROLE") { proj.item(i).remove(); }
    }

    var comp = proj.items.addComp("_CONTROLE", 1080, 1920, 1, 10, 30);
    var nul = comp.layers.addNull(10);
    nul.name = "CORES";

    for (var c = 0; c < CORES.length; c++) {
        var fx = nul.property("ADBE Effect Parade").addProperty("ADBE Color Control");
        fx.name = CORES[c][0];
        fx.property("ADBE Color Control-0001").setValue(hexToRgb(CORES[c][1]));
    }

    $.global.REELS_RESULT = { comp: comp.name, controles: CORES.length };
})();
