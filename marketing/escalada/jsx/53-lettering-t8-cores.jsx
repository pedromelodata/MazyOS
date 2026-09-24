// 53-lettering-t8-cores.jsx — PATCH (Pedro 20/08): "Vai, legaliza" em
// PRETO (ink-900) e "ai." em CORAL-600 no lettering do T8.
// Percorre o precomp T8-LETTERING (recursivo) e pinta cada text layer.
// Criterio sem depender de acento/encoding: texto minusculo so-letras
// ascii == "a" (sobra de "ai." sem o i-acentuado) -> coral; senao ink.

(function () {
    var INK900 = [27 / 255, 30 / 255, 36 / 255];
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];

    var proj = app.project;
    function findComp(n) {
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it.name === n) return it;
        }
        return null;
    }
    var pintadas = [];
    function pintaComp(comp, prof) {
        if (prof > 3) return;
        for (var L = 1; L <= comp.numLayers; L++) {
            var la = comp.layer(L);
            if (la instanceof TextLayer) {
                var td = la.property("ADBE Text Properties").property("ADBE Text Document");
                var tv = td.value;
                var limpo = ("" + tv.text).toLowerCase().replace(/[^a-z]/g, "");
                var cor = (limpo === "a" || limpo === "ai") ? CORAL600 : INK900;
                tv.fillColor = cor;
                td.setValue(tv);
                // animator de fill color por cima (se a fase 3 criou)
                try {
                    var anims = la.property("ADBE Text Properties").property("ADBE Text Animators");
                    for (var A = 1; A <= anims.numProperties; A++) {
                        var ap = anims.property(A).property("ADBE Text Animator Properties");
                        if (!ap) continue;
                        for (var P = 1; P <= ap.numProperties; P++) {
                            if (ap.property(P).matchName === "ADBE Text Fill Color") ap.property(P).setValue(cor);
                        }
                    }
                } catch (eA) {}
                pintadas.push(la.name + "->" + (cor === CORAL600 ? "coral" : "ink"));
            } else if (la.source && la.source instanceof CompItem) {
                pintaComp(la.source, prof + 1);
            }
        }
    }

    var alvo = findComp("T8-LETTERING");
    if (!alvo) {
        for (var i2 = 1; i2 <= proj.numItems; i2++) {
            var it2 = proj.item(i2);
            if (it2 instanceof CompItem && it2.name.indexOf("T8") >= 0 && it2.name.toUpperCase().indexOf("LETTER") >= 0) { alvo = it2; break; }
        }
    }
    if (!alvo) { $.global.ESCALADA_RESULT = { erro: "T8-LETTERING nao achado" }; return; }
    pintaComp(alvo, 0);
    $.global.ESCALADA_RESULT = { patch: "lettering-t8-cores", camadas: pintadas.join(" | ") };
})();
