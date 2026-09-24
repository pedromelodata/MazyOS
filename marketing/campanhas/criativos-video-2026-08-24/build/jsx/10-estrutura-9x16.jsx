// 10-estrutura-9x16.jsx — TEMPLATE 9:16 da leva de criativos (idempotente)
// Nasce na peça 8 (VARREDURA), que é o piloto, e é reusado pelas outras cinco.
//
// Régua 1080x1920 @30fps:
//   GUIA-safe .......... 936x1320, x 72 a 1008, y 300 a 1620
//   Centro óptico ...... y 790 (é onde mora a âncora display, acima do centro geométrico)
//   Palco .............. y 360 a 1140
//   Legenda queimada ... baseline y 1440 no mote A (1 linha)
//                        baseline y 1320 nos motes B e C, porque o super de condição ocupa o rodapé
//   Super de condição .. baselines y 1420 / 1460 / 1500, 3 linhas, só motes B e C
//   Corredor de ícones do Instagram: banda direita x >= 880 e banda inferior y >= 1650.
//                        Nenhum glifo pode entrar aí. O botão do end card vive em x 290 a 790.
//
// Rodar depois do 00-tokens-9x16.jsx. Resultado em $.global.REELS_RESULT.

(function () {
    var FPS = 30;
    var W = 1080, H = 1920;

    var PAPEL = [250 / 255, 248 / 255, 245 / 255];         // #FAF8F5
    var BORDER_STRONG = [203 / 255, 197 / 255, 188 / 255]; // #CBC5BC
    var CORAL_600 = [221 / 255, 78 / 255, 39 / 255];       // #DD4E27

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
    // retângulo com raio, no sistema de shape layers
    function rrect(layer, nome, tamanho, raio, fillCor, strokeCor, strokeW, pos) {
        var grp = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        grp.name = nome;
        var rc = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        rc.property("ADBE Vector Rect Size").setValue(tamanho);
        rc.property("ADBE Vector Rect Roundness").setValue(raio);
        if (pos) { rc.property("ADBE Vector Rect Position").setValue(pos); }
        if (strokeCor) {
            var st = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(strokeCor);
            st.property("ADBE Vector Stroke Width").setValue(strokeW || 3);
        }
        if (fillCor) {
            var fl = grp.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fillCor);
        }
        return grp;
    }

    // ---------- pastas ----------
    var fComps  = pasta("01-COMPS");
    var fPre    = pasta("02-PRECOMPS");
    var fAssets = pasta("03-ASSETS");
    var fAudio  = pasta("04-AUDIO");
    var fGuias  = pasta("05-GUIAS");

    // ---------- GUIA-safe ----------
    // Camada-guia única com: safe 936x1320, marca do centro óptico y 790,
    // linha da legenda de mote A (y 1440), bloco do super de condição (y 1400 a 1512),
    // e o corredor de ícones do Instagram (banda direita e banda inferior).
    removeItem("GUIA-safe");
    var guia = proj.items.addComp("GUIA-safe", W, H, 1, 30, FPS);
    guia.parentFolder = fGuias;

    var g = guia.layers.addShape();
    g.name = "reguas";

    // safe 936x1320 centrado em (540, 960)
    rrect(g, "safe-936x1320", [936, 1320], 0, null, BORDER_STRONG, 3, [0, 0]);
    g.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);

    // centro óptico y 790: traço horizontal fino de 936px
    var gOpt = guia.layers.addShape();
    gOpt.name = "centro-optico-y790";
    rrect(gOpt, "linha", [936, 2], 0, CORAL_600, null, 0, [0, 0]);
    gOpt.property("ADBE Transform Group").property("ADBE Position").setValue([540, 790]);
    gOpt.property("ADBE Transform Group").property("ADBE Opacity").setValue(40);

    // baseline da legenda de mote A
    var gLeg = guia.layers.addShape();
    gLeg.name = "baseline-legenda-moteA-y1440";
    rrect(gLeg, "linha", [936, 2], 0, BORDER_STRONG, null, 0, [0, 0]);
    gLeg.property("ADBE Transform Group").property("ADBE Position").setValue([540, 1440]);

    // bloco do super de condição (motes B e C): 3 baselines 1420/1460/1500
    var gSup = guia.layers.addShape();
    gSup.name = "bloco-super-condicao-B-C";
    rrect(gSup, "caixa", [936, 112], 0, null, BORDER_STRONG, 2, [0, 0]);
    gSup.property("ADBE Transform Group").property("ADBE Position").setValue([540, 1456]);
    gSup.property("ADBE Transform Group").property("ADBE Opacity").setValue(50);

    // corredor de ícones do Instagram: banda direita x>=880, banda inferior y>=1650
    var gIG = guia.layers.addShape();
    gIG.name = "corredor-instagram-PROIBIDO";
    rrect(gIG, "banda-direita", [200, 1920], 0, CORAL_600, null, 0, [980 - 540, 0]);
    rrect(gIG, "banda-inferior", [1080, 270], 0, CORAL_600, null, 0, [0, 1785 - 960]);
    gIG.property("ADBE Transform Group").property("ADBE Position").setValue([540, 960]);
    gIG.property("ADBE Transform Group").property("ADBE Opacity").setValue(12);

    // ---------- fábrica de MASTER ----------
    // Cada peça chama isso com o próprio nome e a própria duração em frames.
    // Fica exposto em $.global pra os scripts 8N reusarem sem duplicar código.
    $.global.REELS_novoMaster = function (nome, frames) {
        removeItem(nome);
        var m = proj.items.addComp(nome, W, H, 1, frames / FPS, FPS);
        m.parentFolder = fComps;
        m.bgColor = PAPEL;
        // fundo de papel travado: o mundo desta leva é papel do primeiro ao último frame
        var bg = m.layers.addSolid(PAPEL, "BG-papel", W, H, 1, frames / FPS);
        bg.locked = true;
        // camada-guia no topo, não renderiza
        var gl = m.layers.add(guia);
        gl.guideLayer = true;
        gl.startTime = 0;
        gl.outPoint = frames / FPS;
        gl.moveToBeginning();
        return m;
    };

    $.global.REELS_RESULT = {
        template: "9:16 1080x1920 @30",
        guia: guia.name,
        pastas: [fComps.name, fPre.name, fAssets.name, fAudio.name, fGuias.name],
        fabrica: "REELS_novoMaster(nome, frames)"
    };
})();
