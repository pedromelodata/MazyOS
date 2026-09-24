// 32-lettering.jsx — rig de legendas kinetic v2 (idempotente, por take)
// v2 (direção do Pedro 14/08): ritmo de cor do design system nas legendas —
//   · palavra FORTE da frase (flag coral do JSON, senão a de peso) = CORAL-500 + Bold
//   · palavras curtas de apoio (<=3 letras) = cinza secundário #BDB8B0
//   · demais = #F4F1EC
//   (substitui a regra "máx 1 coral por take" da SPEC pra legendas)
// Animação mais viva: corrida 200ms y+56 scale 90->100 com rotação alternada -4/+4;
// forte 400ms y+80 scale 84->100. Ease chegada speed 0. Saída da respiração fade 250ms.
// Uso: $.evalFile(31-legendas-data.jsx); $.global.LETTERING_TAKE = "T4"; $.evalFile(este).

(function () {
    var TAKE = $.global.LETTERING_TAKE;
    var DATA = $.global.LEGENDAS;
    if (!TAKE || !DATA || !DATA[TAKE]) { $.global.ESCALADA_RESULT = { erro: "dados/take ausentes" }; return; }

    var doc = DATA[TAKE];
    var W = 3840, H = 2160, FPS = 30;
    // opções por take via $.global.LETTERING_OPCOES: { tema:'dark'|'papel', xc, larguraMax, y1, y2a, y2b }
    var OPC = $.global.LETTERING_OPCOES || {};
    var PAPEL = (OPC.tema === "papel");
    var TEMA_CORAL = (OPC.tema === "coral"); // mundo coral: texto claro, forte = branco puro
    var TEXTO_DARK = TEMA_CORAL ? [254 / 255, 243 / 255, 238 / 255] : (PAPEL ? [27 / 255, 30 / 255, 36 / 255] : [244 / 255, 241 / 255, 236 / 255]);
    var SECUNDARIO = TEMA_CORAL ? [248 / 255, 195 / 255, 176 / 255] : (PAPEL ? [115 / 255, 110 / 255, 103 / 255] : [189 / 255, 184 / 255, 176 / 255]);
    var CORAL_500 = TEMA_CORAL ? [1, 1, 1] : (PAPEL ? [221 / 255, 78 / 255, 39 / 255] : [242 / 255, 100 / 255, 60 / 255]);
    if (OPC.tudoBranco) { TEXTO_DARK = [1, 1, 1]; SECUNDARIO = [1, 1, 1]; CORAL_500 = [1, 1, 1]; }
    if (OPC.duasCores) {
        if (TEMA_CORAL) { TEXTO_DARK = [1, 1, 1]; CORAL_500 = [27 / 255, 30 / 255, 36 / 255]; } // coral: branco + ink
        SECUNDARIO = TEXTO_DARK;
    } // máx 2 cores: texto + forte
    var TAM = OPC.tam || 125, GAP = 36;
    var LARG_MAX = OPC.larguraMax || 3000;
    var XC = OPC.xc || 1920;  // centro horizontal do bloco
    var Y1 = OPC.y1 || 1124, Y2A = OPC.y2a || 1042, Y2B = OPC.y2b || 1204;

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
    function limpo(s) {
        return s.replace(/[.,!?…:;"'()]/g, "");
    }

    // idempotência
    for (var i = proj.numItems; i >= 1; i--) {
        var nm = proj.item(i).name;
        if (nm === TAKE + "-LETTERING" || nm.indexOf(TAKE + "-L") === 0) { proj.item(i).remove(); }
    }

    var fPre = pasta("02-PRECOMPS");
    var takeComp = findItem(TAKE);
    var dur = takeComp.duration;

    var letComp = proj.items.addComp(TAKE + "-LETTERING", W, H, 1, dur, FPS);
    letComp.parentFolder = fPre;

    if (OPC.modo === "apple") {
        // MODO APPLE v2: Text Animator (Scale+Opacity+Blur juntos), pivo por
        // palavra, curva "premium": entrada rapida + desaceleracao bem longa
        var YC_A = OPC.yApple || 1080;
        var totalA = 0;
        function easeApple(prop) {
            var dims = 1;
            var pt = prop.propertyValueType;
            if (pt === PropertyValueType.TwoD) dims = 2;
            else if (pt === PropertyValueType.ThreeD) dims = 3;
            var rapida = [], longa = [];
            for (var d = 0; d < dims; d++) { rapida.push(new KeyframeEase(0, 28)); longa.push(new KeyframeEase(0, 92)); }
            prop.setTemporalEaseAtKey(1, rapida, rapida);
            prop.setTemporalEaseAtKey(2, longa, longa);
        }
        for (var LA = 0; LA < doc.linhas.length; LA++) {
            var linhaA = doc.linhas[LA];
            var idxC = -1;
            for (var pcA = 0; pcA < linhaA.palavras.length; pcA++) { if (linhaA.palavras[pcA].coral) { idxC = pcA; break; } }
            if (idxC < 0) { for (var ppA = 0; ppA < linhaA.palavras.length; ppA++) { if (linhaA.palavras[ppA].peso) { idxC = ppA; } } }
            var fimRespA;
            if (LA < doc.linhas.length - 1) { fimRespA = doc.linhas[LA + 1].palavras[0].t_in - 0.05; }
            else { fimRespA = dur - 0.3; }
            // agrupa em FRASES curtas (2-3 palavras; pontuacao fecha o grupo)
            var grupos = [];
            var gAtual = [];
            for (var gw = 0; gw < linhaA.palavras.length; gw++) {
                gAtual.push(gw);
                var txtW = linhaA.palavras[gw].texto;
                var fecha = gAtual.length >= 3 || /[.,!?…;:]$/.test(txtW);
                if (fecha || gw === linhaA.palavras.length - 1) { grupos.push(gAtual); gAtual = []; }
            }
            for (var gi = 0; gi < grupos.length; gi++) {
                var G = grupos[gi];
                var partes = [];
                for (var gp = 0; gp < G.length; gp++) partes.push(linhaA.palavras[G[gp]].texto);
                var fraseTxt = partes.join(" ");
                var lyA = letComp.layers.addText(fraseTxt);
                var tdocA = lyA.property("ADBE Text Properties").property("ADBE Text Document");
                var tdA = tdocA.value;
                tdA.resetCharStyle();
                tdA.font = "Sora-Bold";
                tdA.fontSize = TAM;
                tdA.fillColor = TEXTO_DARK;
                tdA.applyStroke = false;
                tdA.tracking = -10;
                tdA.justification = ParagraphJustification.CENTER_JUSTIFY;
                tdocA.setValue(tdA);
                // OPC.zonas: posicao por FASE do take — [{ate: s, xc, y}, ...]
                // (Pedro 20/08: "legenda compoe" — em cima enquanto o palco esta
                // cheio, ao lado quando o objeto estaciona num canto)
                var xcG = XC, ycG = YC_A;
                var tZona = linhaA.palavras[G[0]].t_in;
                if (OPC.zonas) {
                    for (var z = 0; z < OPC.zonas.length; z++) {
                        if (tZona < OPC.zonas[z].ate) { xcG = OPC.zonas[z].xc; ycG = OPC.zonas[z].y; break; }
                    }
                }
                lyA.property("ADBE Transform Group").property("ADBE Position").setValue([xcG, ycG]);
                var rA = lyA.sourceRectAtTime(0, false);
                var fator = Math.min(1, LARG_MAX / Math.max(1, rA.width)) * 100;
                lyA.property("ADBE Transform Group").property("ADBE Scale").setValue([fator, fator]);
                var t0A = linhaA.palavras[G[0]].t_in;
                var t1A = (gi < grupos.length - 1) ? linhaA.palavras[grupos[gi + 1][0]].t_in : fimRespA;
                if (t1A <= t0A) t1A = t0A + 0.2;
                try {
                    var maisOp = lyA.property("ADBE Text Properties").property("ADBE Text More Options");
                    maisOp.property("ADBE Text Anchor Point Option").setValue(3);
                    var gAli = maisOp.property("ADBE Text Anchor Point Align");
                    if (gAli) gAli.setValue([0, -45]);
                } catch (eG) {}
                // ANIMATOR 1: entrada apple (Scale+Opacity+Blur)
                var animA = lyA.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
                animA.name = "entrada-apple";
                var propsA = animA.property("ADBE Text Animator Properties");
                var aSc = propsA.addProperty("ADBE Text Scale 3D");
                aSc.setValueAtTime(t0A, [122, 122]);
                aSc.setValueAtTime(t0A + 0.6, [100, 100]);
                easeApple(aSc);
                var aOpA = propsA.addProperty("ADBE Text Opacity");
                aOpA.setValueAtTime(t0A, 0);
                aOpA.setValueAtTime(t0A + 0.28, 100);
                easeApple(aOpA);
                var aBl = propsA.addProperty("ADBE Text Blur");
                aBl.setValueAtTime(t0A, [42, 42]);
                aBl.setValueAtTime(t0A + 0.5, [0, 0]);
                easeApple(aBl);
                // ANIMATOR 2: palavra forte CORAL dentro da frase (range por percent)
                var idxNoGrupo = -1;
                for (var ig = 0; ig < G.length; ig++) { if (G[ig] === idxC) { idxNoGrupo = ig; break; } }
                if (idxNoGrupo >= 0) {
                    var antes = 0;
                    for (var ib = 0; ib < idxNoGrupo; ib++) { antes += partes[ib].length + 1; }
                    var lenF = partes[idxNoGrupo].length;
                    var totalC = fraseTxt.length;
                    try {
                        var animC = lyA.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
                        animC.name = "cor-forte";
                        var selC = animC.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
                        selC.property("ADBE Text Percent Start").setValue(antes / totalC * 100);
                        selC.property("ADBE Text Percent End").setValue((antes + lenF) / totalC * 100);
                        var corF = animC.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
                        corF.setValue(CORAL_500);
                    } catch (eC) {}
                }
                // saida: corte rapido quando a proxima frase entra
                var opL = lyA.property("ADBE Transform Group").property("ADBE Opacity");
                opL.setValueAtTime(t1A, 100);
                opL.setValueAtTime(t1A + 0.08, 0);
                totalA++;
            }
        }
        var stageA = takeComp.layers.add(letComp);
        stageA.startTime = 0;
        $.global.ESCALADA_RESULT = { take: TAKE, modo: "apple-v2-animators", palavras: totalA, fontes: ["Sora-Bold"] };
        return;
    }

    var totalPalavras = 0;
    var fontesUsadas = {};

    for (var L = 0; L < doc.linhas.length; L++) {
        var linha = doc.linhas[L];

        // palavra coral da respiração: a flagada no JSON; senão, a de peso
        var idxCoral = -1;
        for (var pc = 0; pc < linha.palavras.length; pc++) {
            if (linha.palavras[pc].coral) { idxCoral = pc; break; }
        }
        if (idxCoral < 0) {
            for (var pp = 0; pp < linha.palavras.length; pp++) {
                if (linha.palavras[pp].peso) { idxCoral = pp; }
            }
        }

        var breath = proj.items.addComp(TAKE + "-L" + (L + 1), W, H, 1, dur, FPS);
        breath.parentFolder = fPre;

        var camadas = [], larguras = [];
        for (var p = 0; p < linha.palavras.length; p++) {
            var pal = linha.palavras[p];
            var forte = (p === idxCoral);
            var apoio = !forte && limpo(pal.texto).length <= 3;
            var ly = breath.layers.addText(pal.texto);
            var tdoc = ly.property("ADBE Text Properties").property("ADBE Text Document");
            var td = tdoc.value;
            td.resetCharStyle();
            td.font = (forte || pal.peso) ? "Sora-Bold" : "Sora-SemiBold";
            td.fontSize = TAM;
            td.fillColor = forte ? CORAL_500 : (apoio ? SECUNDARIO : TEXTO_DARK);
            td.applyStroke = false;
            td.justification = ParagraphJustification.LEFT_JUSTIFY;
            tdoc.setValue(td);
            fontesUsadas[tdoc.value.font] = true;
            var r = ly.sourceRectAtTime(0, false);
            camadas.push(ly); larguras.push(r.width);
            totalPalavras++;
        }

        var total = 0;
        for (var w1 = 0; w1 < larguras.length; w1++) { total += larguras[w1]; }
        total += GAP * (larguras.length - 1);
        var quebra = camadas.length;
        if (total > LARG_MAX) {
            var acc = 0, alvo = total / 2;
            for (var q = 0; q < larguras.length; q++) {
                acc += larguras[q] + GAP;
                if (acc >= alvo) { quebra = q + 1; break; }
            }
        }
        function layoutSeq(ini, fim, baseline) {
            var wsum = 0;
            for (var k = ini; k < fim; k++) { wsum += larguras[k]; }
            wsum += GAP * (fim - ini - 1);
            var x = XC - wsum / 2;
            for (var k2 = ini; k2 < fim; k2++) {
                var pal2 = linha.palavras[k2];
                var forte2 = (k2 === idxCoral);
                var lyr = camadas[k2];
                var t0 = pal2.t_in;
                var durAnim = forte2 ? 12 / FPS : 6 / FPS; // 400ms forte, 200ms corrida
                var dy = forte2 ? 80 : 56;
                var scIni = forte2 ? 84 : 90;

                var pos = lyr.property("ADBE Transform Group").property("ADBE Position");
                pos.setValueAtTime(t0, [x, baseline + dy]);
                pos.setValueAtTime(t0 + durAnim, [x, baseline]);
                easeChegada(pos);
                var op = lyr.property("ADBE Transform Group").property("ADBE Opacity");
                op.setValueAtTime(t0, 0);
                op.setValueAtTime(t0 + durAnim, 100);
                easeChegada(op);
                var sc = lyr.property("ADBE Transform Group").property("ADBE Scale");
                sc.setValueAtTime(t0, [scIni, scIni]);
                sc.setValueAtTime(t0 + durAnim, [100, 100]);
                easeChegada(sc);
                if (!forte2) {
                    var rot = lyr.property("ADBE Transform Group").property("ADBE Rotate Z");
                    rot.setValueAtTime(t0, (k2 % 2 === 0) ? -4 : 4);
                    rot.setValueAtTime(t0 + durAnim, 0);
                    easeChegada(rot);
                }
                x += larguras[k2] + GAP;
            }
        }
        if (quebra >= camadas.length) { layoutSeq(0, camadas.length, Y1); }
        else { layoutSeq(0, quebra, Y2A); layoutSeq(quebra, camadas.length, Y2B); }

        var bl = letComp.layers.add(breath);
        bl.startTime = 0;
        var fimResp;
        if (L < doc.linhas.length - 1) { fimResp = doc.linhas[L + 1].palavras[0].t_in - 0.05; }
        else { fimResp = (TAKE === "T8") ? -1 : dur - 0.3; }
        if (fimResp > 0) {
            var bop = bl.property("ADBE Transform Group").property("ADBE Opacity");
            bop.setValueAtTime(Math.max(0, fimResp - 0.25), 100);
            bop.setValueAtTime(fimResp, 0);
        }
    }

    for (var t2 = takeComp.numLayers; t2 >= 1; t2--) {
        if (takeComp.layer(t2).name === TAKE + "-LETTERING") { takeComp.layer(t2).remove(); }
    }
    var stage = takeComp.layers.add(letComp);
    stage.startTime = 0;
    stage.moveToBeginning();

    var fontes = [];
    for (var f in fontesUsadas) { if (fontesUsadas.hasOwnProperty(f)) fontes.push(f); }
    $.global.ESCALADA_RESULT = { take: TAKE, respiracoes: doc.linhas.length, palavras: totalPalavras, fontes: fontes };
})();
