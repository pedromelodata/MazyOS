// 50-master.jsx — UNIFICAÇÃO T1–T7 (Pedro 18/08): corta os silêncios entre
// takes, encadeia na MASTER-3840x2160-30 e coreografa SAÍDAS por elemento
// (uns caem, outros vão pro lado, outros sobem). T8 fica FORA do tratamento
// (vinheta pendente) — só é reposicionado pro novo fim.
// ⚠️ RODAR POR ÚLTIMO, depois de qualquer take-script (44/47 sobrescrevem
// keys que este script adiciona dentro dos takes).
// Áudio: cada take toca o próprio tN.wav; narracao-timeline é MUTADA.

(function () {
    var FPS = 30;
    var proj = app.project;
    function fi(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
    function lay(c, n) {
        for (var i = 1; i <= c.numLayers; i++) { if (c.layer(i).name === n) return c.layer(i); }
        return null;
    }
    function easeSaida(prop, ki) { // começa devagar e ACELERA saindo
        var dims = 1;
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) dims = 2;
        else if (t === PropertyValueType.ThreeD) dims = 3;
        var arr = [];
        for (var d = 0; d < dims; d++) arr.push(new KeyframeEase(0, 60));
        prop.setTemporalEaseAtKey(ki, arr, arr);
    }
    // saída genérica: desloca `delta` entre t0 e t1 (idempotente: keys por tempo)
    function sai(comp, nome, t0, t1, delta) {
        var ly = lay(comp, nome);
        if (!ly) return "SEM " + nome;
        var pp = ly.property("ADBE Transform Group").property("ADBE Position");
        var v0 = pp.valueAtTime(t0, false);
        var v1 = [];
        for (var d = 0; d < v0.length; d++) v1.push(v0[d] + (delta[d] || 0));
        pp.setValueAtTime(t0, v0);
        pp.setValueAtTime(t1, v1);
        try { easeSaida(pp, pp.nearestKeyIndex(t0)); } catch (e) {}
        return nome;
    }

    // quanto de cada take FICA (fala + respiro curto p/ saída);
    // T6 inteiro: o zoom-túnel já é a transição pro T7
    var KEEP = { T1: 5.8, T2: 10.9667, T3: 8.7333, T4: 8.2333, T5: 7.5333, T6: 15.6333, T7: 14.3667 }; // narracao v2 20/08
    var DX = 0.45; // duração das saídas
    var log = [];

    // GIRO PRA CÂMERA (Pedro 19/08): em vez de jogar o celular pra cima/lado,
    // ele dá UMA VOLTA 3D REAL (SEQ-spin-t5) avançando em Z até "bater" na
    // câmera — e corta pro próximo take. Idempotente.
    // t0 = APÓS o fim da narração (Pedro 19/08: parado até acabar a fala,
    // só então é LANÇADO girando pra câmera)
    function giroCamera(comp, pfx, rigNome, stillNome, escFone, t0, t1, base) {
        var GDUR = t1 - t0;
        comp.time = 0;
        for (var L = comp.numLayers; L >= 1; L--) {
            if (comp.layer(L).name === pfx + "X-giro") comp.layer(L).remove();
        }
        var rig = lay(comp, rigNome);
        if (!rig) return "SEM " + rigNome;
        var pp = rig.property("ADBE Transform Group").property("ADBE Position");
        while (pp.numKeys > 0) pp.removeKey(1); // limpa a queda/subida antiga
        pp.setValue(base); // base EXPLÍCITA: remover keys deixa valor residual!
        var ps = rig.property("ADBE Transform Group").property("ADBE Scale");
        while (ps.numKeys > 0) ps.removeKey(1);
        ps.setValue([100, 100, 100]);
        // elementos de tela (cards/X/calendário/planilha) somem rápido
        var FADEPFX = [pfx + "V-card-", pfx + "V-calendario", pfx + "V-xis",
            pfx + "V-planilha", pfx + "V-notas", pfx + "V-contador-", pfx + "V-pla-"];
        for (var L2 = 1; L2 <= comp.numLayers; L2++) {
            var ly2 = comp.layer(L2);
            for (var f2 = 0; f2 < FADEPFX.length; f2++) {
                if (ly2.name.indexOf(FADEPFX[f2]) === 0) {
                    var op2 = ly2.property("ADBE Transform Group").property("ADBE Opacity");
                    op2.setValueAtTime(t0, op2.valueAtTime(t0, false));
                    op2.setValueAtTime(t0 + 0.12, 0);
                    break;
                }
            }
        }
        // still troca pelo spin no frame do swap (handoff seco, como na entrada)
        var still = lay(comp, stillNome);
        var sop = still.property("ADBE Transform Group").property("ADBE Opacity");
        sop.setValueAtTime(t0 - 1 / FPS, sop.valueAtTime(t0 - 1 / FPS, false));
        sop.setValueAtTime(t0, 0);
        var seqS = fi("SEQ-spin-t5");
        var giro = comp.layers.add(seqS);
        giro.name = pfx + "X-giro";
        giro.threeDLayer = true;
        giro.startTime = t0;
        giro.stretch = GDUR / 1.1 * 100; // 1 volta completa em 0.6s, termina FRONTAL
        giro.inPoint = t0;
        giro.outPoint = t1;
        giro.frameBlendingType = FrameBlendingType.NO_FRAME_BLEND; // Pedro 20/08: frame-mix criava "sombras" no giro
        giro.parent = rig;
        giro.property("ADBE Transform Group").property("ADBE Scale").setValue([escFone, escFone, escFone]);
        var fLoc = still.property("ADBE Transform Group").property("ADBE Position").value;
        giro.property("ADBE Transform Group").property("ADBE Position").setValue([fLoc[0], fLoc[1], fLoc[2] - 0.5]);
        var gop = giro.property("ADBE Transform Group").property("ADBE Opacity");
        gop.setValueAtTime(t0 - 1 / FPS, 0);
        gop.setValueAtTime(t0, 100);
        // vem PRA CÂMERA via ESCALA do rig (z real sofre clipping do renderer):
        // converge pro centro e cresce até estourar o quadro no corte
        pp.setValueAtTime(t0, base);
        pp.setValueAtTime(t1, [1920, 1080, 0]);
        try { easeSaida(pp, pp.nearestKeyIndex(t0)); } catch (eG) {}
        ps.setValueAtTime(t0, [100, 100, 100]);
        ps.setValueAtTime(t1, [640, 640, 640]);
        try { easeSaida(ps, ps.nearestKeyIndex(t0)); } catch (eG2) {}
        return pfx + " giro-camera";
    }

    // ---- T1: cena CAI (tudo parentado na CAM), lettering SOBE ----
    var t1 = fi("T1");
    log.push(sai(t1, "T1V-CAM", KEEP.T1 - DX, KEEP.T1, [0, 2400]));
    log.push(sai(t1, "T1-LETTERING", KEEP.T1 - DX, KEEP.T1, [0, -1500]));

    // ---- T2: celular dá o GIRO pra câmera; lettering SOBE, dim apaga ----
    var t2 = fi("T2");
    log.push(giroCamera(t2, "T2", "T2V-PHONE3D", "T2V-fone3d", 80, KEEP.T2 - 0.88, KEEP.T2, [1150, 1120, 0]));
    log.push(sai(t2, "T2-LETTERING", KEEP.T2 - DX, KEEP.T2, [0, -1500]));
    var fz = lay(t2, "T2V-freeze-dim");
    if (fz) {
        var fo = fz.property("ADBE Transform Group").property("ADBE Opacity");
        fo.setValueAtTime(KEEP.T2 - DX, fo.valueAtTime(KEEP.T2 - DX, false));
        fo.setValueAtTime(KEEP.T2, 0);
    }

    // ---- T3 -> T4: corte CONTÍNUO (mesma multidão) — T4 abre no ângulo
    // exato em que o disco do T3 foi cortado ----
    var t3 = fi("T3");
    var t4 = fi("T4");
    var rot3 = lay(t3, "T3V-multidao").property("ADBE Transform Group").property("ADBE Rotate Z");
    var angCorte = rot3.valueAtTime(KEEP.T3, false);
    lay(t4, "T4V-multidao").property("ADBE Transform Group").property("ADBE Rotate Z").setValueAtTime(0, angCorte);
    log.push("T4 abre no angulo " + angCorte.toFixed(2));

    // ---- T4: herói+bolo p/ ESQUERDA, 0,7% p/ DIREITA, sobreviventes CAEM,
    // lettering SOBE ----
    log.push(sai(t4, "T4V-heroi", KEEP.T4 - DX, KEEP.T4, [-2600, 0]));
    log.push(sai(t4, "T4V-bolo", KEEP.T4 - DX, KEEP.T4, [-2600, 0]));
    log.push(sai(t4, "T4V-07", KEEP.T4 - DX, KEEP.T4, [1900, 0]));
    log.push(sai(t4, "T4V-multidao", KEEP.T4 - DX, KEEP.T4, [0, 2300]));
    log.push(sai(t4, "T4-LETTERING", KEEP.T4 - DX, KEEP.T4, [0, -1400]));

    // ---- T5: celular dá o GIRO pra câmera; lettering sai p/ ESQUERDA ----
    var t5 = fi("T5");
    log.push(giroCamera(t5, "T5", "T5V-PHONE3D", "T5V-fone3d", 84, KEEP.T5 - 0.57, KEEP.T5, [2400, 1110, 0]));
    log.push(sai(t5, "T5-LETTERING", KEEP.T5 - DX, KEEP.T5, [-1700, 0]));

    // ---- PONTE T7->T8 (Pedro 19/08): o suricato ENTRA no fim do T7,
    // atravessa a ultima frase (as letras somem com wipe conforme ele passa)
    // e o video continua no T8 do ponto exato — corte imperceptivel ----
    var t7 = fi("T7");
    t7.time = 0;
    for (var LX = t7.numLayers; LX >= 1; LX--) {
        if (t7.layer(LX).name.indexOf("T7X-") === 0) t7.layer(LX).remove();
    }
    function fitem(n) {
        for (var i = 1; i <= proj.numItems; i++) { if (proj.item(i).name === n) return proj.item(i); }
        return null;
    }
var matI = null, suriI = null; // (suricato no T7 removido: take full-IA comeca no T8)
    if (false) {
    }
    if (false) {
        // sombra de contato dele no trecho do T7
        var ch7 = t7.layers.addShape();
        ch7.name = "T7X-suri-sombra";
        var sg7 = ch7.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var sc7 = sg7.property("ADBE Vectors Group");
        var se7 = sc7.addProperty("ADBE Vector Shape - Ellipse");
        se7.property("ADBE Vector Ellipse Size").setValue([400, 58]);
        var sf7 = sc7.addProperty("ADBE Vector Graphic - Fill");
        sf7.property("ADBE Vector Fill Color").setValue([27 / 255, 30 / 255, 36 / 255]);
        ch7.property("ADBE Transform Group").property("ADBE Opacity").setValue(11);
        var cp7 = ch7.property("ADBE Transform Group").property("ADBE Position");
        cp7.setValueAtTime(13.9033, [420, 2190]);
        cp7.setValueAtTime(14.9, [1500, 2190]);
        ch7.inPoint = 13.95;
        ch7.outPoint = t7.duration;
    }
    {
        // a ULTIMA FRASE some conforme ele passa (wipe da esquerda pra direita)
        for (var LW = 1; LW <= t7.numLayers; LW++) {
            var lw = t7.layer(LW);
            if (lw.name === "T7-LETTERING") {
                var fxp = lw.property("ADBE Effect Parade");
                var temW = false;
                for (var fw = 1; fw <= fxp.numProperties; fw++) { if (fxp.property(fw).matchName === "ADBE Linear Wipe") temW = true; }
                if (!temW) {
                    var wp = fxp.addProperty("ADBE Linear Wipe");
                    wp.property("ADBE Linear Wipe-0002").setValue(270); // some da esquerda pra direita
                    wp.property("ADBE Linear Wipe-0003").setValue(280); // feather: letras "desmanchando"
                    var wc = wp.property("ADBE Linear Wipe-0001");
                    wc.setValueAtTime(13.42, 0);
                    wc.setValueAtTime(14.32, 100);
                }
                break;
            }
        }
    }

    // ---- MASTER: encadeia sem os silêncios ----
    var m = fi("MASTER-3840x2160-30");
    if (!m) { $.global.ESCALADA_RESULT = { erro: "master nao achada" }; return; }
    var ordem = ["T1", "T2", "T3", "T4", "T5", "T6", "T7"];
    var start = 0.8; // head preservado
    for (var i = 0; i < ordem.length; i++) {
        var ml = lay(m, ordem[i]);
        ml.startTime = start;
        ml.inPoint = start;
        ml.outPoint = start + KEEP[ordem[i]];
        start += KEEP[ordem[i]];
    }
    var fimT7 = start;
    // T8 (vinheta pendente): só reposiciona pro novo fim, sem tratamento
    var t8l = lay(m, "T8");
    if (t8l) { t8l.startTime = fimT7; t8l.inPoint = fimT7; }

    // ---- ZOOM-PONTE (Pedro 20/08): zoom-in leve no celular enquanto a
    // ultima frase some (fimT7-0.95 -> corte), 100->112% com ponto fixo no
    // celular (2660,1240); o T8 abre a 112% e continua o movimento ----
    var t7m = lay(m, "T7");
    if (t7m) {
        var zTG = t7m.property("ADBE Transform Group");
        var zAp = zTG.property("ADBE Anchor Point");
        var zPp = zTG.property("ADBE Position");
        var zSp = zTG.property("ADBE Scale");
        while (zSp.numKeys > 0) zSp.removeKey(1);
        while (zPp.numKeys > 0) zPp.removeKey(1);
        while (zAp.numKeys > 0) zAp.removeKey(1);
        zAp.setValue([2660, 1240]);
        zPp.setValue([2660, 1240]);
        zSp.setValue([100, 100]);
        zSp.setValueAtTime(fimT7 - 0.95, [100, 100]);
        zSp.setValueAtTime(fimT7, [112, 112]);
        var zDims = 1;
        var zVT = zSp.propertyValueType;
        if (zVT === PropertyValueType.TwoD) zDims = 2;
        else if (zVT === PropertyValueType.ThreeD) zDims = 3;
        var zEase = [];
        for (var zd = 0; zd < zDims; zd++) zEase.push(new KeyframeEase(0, 66));
        zSp.setTemporalEaseAtKey(1, zEase, zEase); // arranque suave; key 2 linear (velocidade continua no T8)
    }

    // ---- TRANSIÇÃO SWIPE T7->T8 (Pedro 20/08: corte "muito seco" + suricato
    // "dropando do nada"): dois painéis coral varrem da esquerda pra direita
    // cobrindo o corte — a tela e revelada da ESQUERDA, entregando o mascote
    // ja em quadro como se ele entrasse junto com o swipe ----
    for (var TR = m.numLayers; TR >= 1; TR--) {
        if (m.layer(TR).name.indexOf("TRANS-") === 0) m.layer(TR).remove();
    }
    m.motionBlur = true;
    function painel(nome, cor, tIn, tCob, tSai, tFim) {
        var p = m.layers.addShape();
        p.name = nome;
        var pg = p.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var pc = pg.property("ADBE Vectors Group");
        var pr = pc.addProperty("ADBE Vector Shape - Rect");
        pr.property("ADBE Vector Rect Size").setValue([5200, 5200]); // margem pra rotacao
        var pf = pc.addProperty("ADBE Vector Graphic - Fill");
        pf.property("ADBE Vector Fill Color").setValue(cor);
        p.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(-8);
        var pp = p.property("ADBE Transform Group").property("ADBE Position");
        pp.setValueAtTime(tIn, [-4900, 1080]);   // fora, esquerda
        pp.setValueAtTime(tCob, [1920, 1080]);   // cobrindo a tela
        pp.setValueAtTime(tSai, [1920, 1080]);
        pp.setValueAtTime(tFim, [8700, 1080]);   // fora, direita
        var eF = [new KeyframeEase(0, 80)]; // position e ESPACIAL: ease de 1 dimensao
        pp.setTemporalEaseAtKey(2, eF, eF);
        pp.setTemporalEaseAtKey(3, eF, eF);
        p.motionBlur = true;
        p.inPoint = tIn;
        p.outPoint = tFim + 1 / 30;
        p.moveToBeginning();
        return p;
    }
    // coral-300 na frente (lead), coral-600 atras (lag): na saida o 600
    // segura um instante a mais e revela a cena por ultimo
    painel("TRANS-swipe-b", [221 / 255, 78 / 255, 39 / 255], fimT7 - 0.26, fimT7 - 0.02, fimT7 + 0.05, fimT7 + 0.38);
    painel("TRANS-swipe-a", [245 / 255, 161 / 255, 132 / 255], fimT7 - 0.30, fimT7 - 0.08, fimT7 + 0.01, fimT7 + 0.30);
    // narração da master muda: cada take toca o próprio wav
    var nar = lay(m, "narracao-timeline.wav");
    if (nar) nar.audioEnabled = false;
    m.workAreaStart = 0;
    m.workAreaDuration = Math.min(m.duration, fimT7 + 8.7);

    $.global.ESCALADA_RESULT = { fimT7: fimT7.toFixed(2), saidas: log.join(" | ") };
})();
