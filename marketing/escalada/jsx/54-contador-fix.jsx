// 54-contador-fix.jsx — PATCH (Pedro 20/08): contador do T3/T4 sem a
// caixa branca, numero COMPLETO "7.400.000" (sem abreviacao) em coral, e
// blur direcional vertical durante a rolagem (estilo do swipe) pra nao
// brigar com os icones atras. Idempotente.

(function () {
    var FPS = 30;
    var CORAL600 = [221 / 255, 78 / 255, 39 / 255];

    var proj = app.project;
    function findComp(n) {
        for (var i = 1; i <= proj.numItems; i++) {
            var it = proj.item(i);
            if (it instanceof CompItem && it.name === n) return it;
        }
        return null;
    }
    function fmt(v) {
        var s = String(Math.round(v)), out = "";
        while (s.length > 3) { out = "." + s.substring(s.length - 3) + out; s = s.substring(0, s.length - 3); }
        return s + out;
    }
    function rmLayer(comp, nome) {
        for (var L = comp.numLayers; L >= 1; L--) {
            if (comp.layer(L).name === nome) { comp.layer(L).remove(); return true; }
        }
        return false;
    }

    var feito = [];

    // ---- T3: rolagem coral + blur, sem card, final por extenso ----
    var t3 = findComp("T3");
    if (t3) {
        t3.time = 0;
        feito.push("T3 card removido: " + rmLayer(t3, "T3V-contador-card"));
        for (var L = 1; L <= t3.numLayers; L++) {
            var la = t3.layer(L);
            if (la.name !== "T3V-contador") continue;
            var cdoc = la.property("ADBE Text Properties").property("ADBE Text Document");
            while (cdoc.numKeys > 0) cdoc.removeKey(1);
            var ALVO = 7400000, T_ROLA0 = 2.4, T_ROLA1 = 5.6, T_SNAP = 6.2;
            var passo = 2 / FPS, anterior = null;
            for (var t = T_ROLA0; t <= T_ROLA1 + 0.001; t += passo) {
                var p = (t - T_ROLA0) / (T_ROLA1 - T_ROLA0);
                var v = Math.round(Math.exp(Math.log(ALVO) * p));
                if (v === anterior) continue;
                anterior = v;
                var td = cdoc.value;
                td.text = fmt(v);
                td.fillColor = CORAL600;
                cdoc.setValueAtTime(t, td);
            }
            var tdf = cdoc.value; tdf.text = fmt(ALVO); tdf.fillColor = CORAL600; cdoc.setValueAtTime(T_ROLA1, tdf);
            var tds = cdoc.value; tds.text = fmt(ALVO); tds.fillColor = CORAL600; cdoc.setValueAtTime(T_SNAP, tds);
            // blur direcional vertical na rolagem (decai ao travar o numero)
            var fx = la.property("ADBE Effect Parade");
            for (var F = fx.numProperties; F >= 1; F--) {
                if (fx.property(F).matchName === "ADBE Motion Blur") fx.property(F).remove();
            }
            var db = fx.addProperty("ADBE Motion Blur");
            db.property("ADBE Motion Blur-0001").setValue(0); // direcao: vertical
            var dl = db.property("ADBE Motion Blur-0002");    // blur length
            dl.setValueAtTime(T_ROLA0, 0);
            dl.setValueAtTime(T_ROLA0 + 0.15, 26);
            dl.setValueAtTime(T_ROLA1 - 0.25, 26);
            dl.setValueAtTime(T_ROLA1, 0);
            feito.push("T3 contador: rolagem coral + blur + final " + fmt(ALVO));
            break;
        }
    } else { feito.push("T3 nao achado"); }

    // ---- T4: sem card, texto por extenso ----
    var t4 = findComp("T4");
    if (t4) {
        t4.time = 0;
        feito.push("T4 card removido: " + rmLayer(t4, "T4V-contador-card"));
        for (var L2 = 1; L2 <= t4.numLayers; L2++) {
            var lb = t4.layer(L2);
            if (lb.name !== "T4V-74milhoes") continue;
            var mdoc = lb.property("ADBE Text Properties").property("ADBE Text Document");
            var mtd = mdoc.value;
            mtd.text = "7.400.000";
            mtd.fillColor = CORAL600;
            mdoc.setValue(mtd);
            feito.push("T4 74milhoes -> 7.400.000");
            break;
        }
    } else { feito.push("T4 nao achado"); }

    $.global.ESCALADA_RESULT = { patch: "contador-fix", log: feito.join(" | ") };
})();
