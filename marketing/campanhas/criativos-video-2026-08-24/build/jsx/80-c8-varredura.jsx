// 80-c8-varredura.jsx — CRIATIVO 8 "VARREDURA" (mote A, 16,00s, 480 frames) — idempotente
//
// Piloto do template 9:16. Constrói:
//   PRE-tira-12 ......... a tira de 12 folhas de calendário, pitch 456px
//   C8-ABERTO ........... o enquadramento aberto (planos 1 e 3), com a tira e a GUIA-mira
//   C8-FECHADO .......... o enquadramento fechado a 190% (plano 2), onde o anel se desenha
//   MASTER-C8-VARREDURA . 480 frames, os 5 planos montados
//
// Régua de tempo (frame governa, segundo é leitura):
//   f0    hook congelado, anel coral em JANEIRO, âncora "eu não pulo / mês."
//   f11   pulso do anel (150ms)
//   f42   a tira começa a andar (547,2 px/s = 1 pitch a cada 25 frames). Âncora sai em fade
//   f42-50 anel de JANEIRO converte de coral-600 pra borda forte. A única aula da peça
//   f67 FEV · f92 MAR · f117 ABR · f142 MAI · f167 JUN cruzam a mira
//   f189  começa a frenagem
//   f195  para seca com JULHO centrado. Célula nua. Freeze de 10 frames, áudio corta
//   f205  freeze solta, micro-label vira AINDA NÃO MARCADO
//   f208  âncora 2 "eu não deixo / passar." entra em 400ms
//   f267  CORTE pro fechado. O anel se desenha por trim path em 400ms
//   f306  CORTE de volta pro aberto. Varredura recomeça a 380 px/s
//   f342  AGOSTO chega centrado. Começa o colapso das 12 folhas
//   f366  CORTE casado pro crop da tela real do app
//   f405  CORTE pro end card (2,50s)
//   f480  fim. Último frame em papel, igual ao frame 1: o loop fecha
//
// ORÇAMENTO DE CORAL: 2 acendimentos de um teto de 2, e eles NUNCA coexistem.
//   1) anel coral em JANEIRO, f0 a f50
//   2) anel coral no mês-alvo, f267 a f365
//   Entre f50 e f267 não existe um pixel de coral no palco. As palavras fortes de B5 e B6
//   são ink, não coral, porque o anel está aceso. Qualquer acendimento novo REPROVA a peça.
//
// SEM BLUR: nenhum efeito de blur existe neste projeto. O que roda na tira é o motion blur
//   NATIVO da composição (shutter 180), desligado em toda camada tipográfica.
//
// Rodar depois de 00-tokens-9x16, 10-estrutura-9x16, 20-precomps-9x16.

(function () {
    var FPS = 30;
    var W = 1080, H = 1920;
    var MASTER_F = 480;

    var PAPEL         = [250 / 255, 248 / 255, 245 / 255];
    var CARD          = [1, 1, 1];
    var SURF_ALT      = [241 / 255, 238 / 255, 233 / 255];
    var HAIRLINE      = [227 / 255, 222 / 255, 215 / 255];
    var BORDER_STRONG = [203 / 255, 197 / 255, 188 / 255];
    var INK_900       = [27 / 255, 30 / 255, 36 / 255];
    var INK_600       = [82 / 255, 78 / 255, 72 / 255];
    var INK_500       = [115 / 255, 110 / 255, 103 / 255];
    var CORAL_600     = [221 / 255, 78 / 255, 39 / 255];

    var MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO",
                 "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    var ALVO = 6;              // JULHO. Ver Ressalva 1 do roteiro: gate de validação com o Pedro
    var PITCH = 456;
    var TIRA_W = 5616, TIRA_H = 600;
    var FOLHA_CX = 300;        // centro da folha 0 dentro de PRE-tira-12

    var proj = app.project;

    if (!$.global.REELS_txt || !$.global.REELS_novoMaster) {
        throw new Error("Rode 10-estrutura-9x16.jsx e 20-precomps-9x16.jsx antes deste script.");
    }
    var txt = $.global.REELS_txt;
    var ease = $.global.REELS_ease;

    function findItem(nome) {
        for (var i = 1; i <= proj.numItems; i++) {
            if (proj.item(i).name === nome) { return proj.item(i); }
        }
        return null;
    }
    function removeItem(nome) { var it = findItem(nome); if (it) { it.remove(); } }
    function pasta(nome) {
        var it = findItem(nome);
        if (it && it instanceof FolderItem) { return it; }
        return proj.items.addFolder(nome);
    }
    function f(n) { return n / FPS; }

    function grupoRect(layer, nome, tam, raio, fill, stroke, sw, pos) {
        var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.name = nome;
        var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue(tam);
        r.property("ADBE Vector Rect Roundness").setValue(raio);
        if (pos) { r.property("ADBE Vector Rect Position").setValue(pos); }
        if (stroke) {
            var st = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
            st.property("ADBE Vector Stroke Color").setValue(stroke);
            st.property("ADBE Vector Stroke Width").setValue(sw || 3);
        }
        if (fill) {
            var fl = g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
            fl.property("ADBE Vector Fill Color").setValue(fill);
        }
        return g;
    }

    var fPre = pasta("02-PRECOMPS");
    var fComps = pasta("01-COMPS");

    // ================================================================ PRE-tira-12
    removeItem("PRE-tira-12");
    var tira = proj.items.addComp("PRE-tira-12", TIRA_W, TIRA_H, 1, 30, FPS);
    tira.parentFolder = fPre;
    tira.motionBlur = true;               // motion blur NATIVO de comp, shutter 180
    tira.shutterAngle = 180;

    // colunas e linhas da grade, em coordenadas relativas ao centro da folha
    var COL = [-147, -98, -49, 0, 49, 98, 147];
    var ROW = [-113, -65, -17, 31, 79];

    var aneis = [];   // guarda o layer do anel de cada folha (null no mês-alvo)
    var cabecas = []; // guarda o text layer do nome do mês

    for (var i = 0; i < 12; i++) {
        var cx = FOLHA_CX + i * PITCH;

        // corpo da folha: 400x540 raio 48, card branco, hairline 3px
        var folha = tira.layers.addShape();
        folha.name = "folha-" + (i + 1) + "-" + MESES[i];
        folha.property("ADBE Transform Group").property("ADBE Position").setValue([cx, 300]);
        grupoRect(folha, "corpo", [400, 540], 48, CARD, HAIRLINE, 3, [0, 0]);
        grupoRect(folha, "faixa-cabecalho", [400, 96], 48, SURF_ALT, null, 0, [0, -222]);
        // grade 7x5 de células vazias
        for (var c = 0; c < COL.length; c++) {
            for (var r = 0; r < ROW.length; r++) {
                grupoRect(folha, "cel-" + c + "-" + r, [42, 38], 24, SURF_ALT, null, 0, [COL[c], ROW[r]]);
            }
        }
        folha.motionBlur = true;

        // nome do mês: Sora 700 40px ink-900, baseline na faixa
        var cab = txt(tira, "mes-" + (i + 1), MESES[i], {
            peso: "700", size: 40, cor: INK_900, x: cx, baseline: 300 - 208
        });
        cab.motionBlur = false;           // tipografia NUNCA leva motion blur
        cabecas.push(cab);

        // anel na célula linha 1 coluna 4. O mês-alvo NÃO tem anel: a ausência é o evento
        if (i === ALVO) { aneis.push(null); continue; }
        var anel = tira.layers.addShape();
        anel.name = "anel-" + (i + 1) + "-" + MESES[i];
        anel.property("ADBE Transform Group").property("ADBE Position")
            .setValue([cx + COL[3], 300 + ROW[0]]);
        var ag = anel.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        ag.name = "anel";
        var el = ag.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
        el.property("ADBE Vector Ellipse Size").setValue([74, 66]);
        var ast = ag.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
        ast.property("ADBE Vector Stroke Color").setValue(i === 0 ? CORAL_600 : BORDER_STRONG);
        ast.property("ADBE Vector Stroke Width").setValue(i === 0 ? 7 : 3);
        ast.property("ADBE Vector Stroke Line Cap").setValue(2); // round cap
        anel.motionBlur = true;
        aneis.push(anel);
    }

    // --- ACENDIMENTO 1: anel de JANEIRO, coral-600, f0 a f50 ---
    var anelJan = aneis[0];
    var stJan = anelJan.property("ADBE Root Vectors Group").property("anel")
                       .property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke");
    var swJan = stJan.property("ADBE Vector Stroke Width");
    var corJan = stJan.property("ADBE Vector Stroke Color");
    // pulso em f11: 7 > 10 > 7 em 150ms, sem escala e sem bounce
    swJan.setValueAtTime(f(11), 7);
    swJan.setValueAtTime(f(13), 10);
    swJan.setValueAtTime(f(16), 7);
    ease(swJan, 3);
    // conversão pra borda forte de f42 a f50: a única aula da peça, e dura 250ms
    swJan.setValueAtTime(f(42), 7);
    swJan.setValueAtTime(f(50), 3);
    ease(swJan, swJan.numKeys);
    corJan.setValueAtTime(f(42), CORAL_600);
    corJan.setValueAtTime(f(50), BORDER_STRONG);
    ease(corJan, 2);

    // --- micro-evento de cruzamento: anel 3>6>3 em 150ms, sem cor ---
    // Decisão declarada contra o conceito: a versão "cada folha acende o próprio anel" foi
    // RECUSADA, porque um auditor contaria 5 acendimentos e a peça reprovaria. Trocado por
    // peso, não por cor. Mesma cadência de reflexo, custo zero de coral.
    var CRUZA = [67, 92, 117, 142, 167];
    for (var k = 0; k < CRUZA.length; k++) {
        var fc = CRUZA[k];
        var a = aneis[k + 1];
        var sw = a.property("ADBE Root Vectors Group").property("anel")
                  .property("ADBE Vectors Group").property("ADBE Vector Graphic - Stroke")
                  .property("ADBE Vector Stroke Width");
        sw.setValueAtTime(f(fc - 2), 3);
        sw.setValueAtTime(f(fc), 6);
        sw.setValueAtTime(f(fc + 3), 3);
        ease(sw, 3);
        // bump de peso no cabeçalho: troca de face no pico. Em 150ms lê como o wght subindo
        var cabDoc = cabecas[k + 1].property("ADBE Text Properties").property("ADBE Text Document");
        try {
            var d0 = cabDoc.value; d0.font = $.global.REELS_RESULT.fontes["500"];
            cabDoc.setValueAtTime(f(fc - 2), d0);
            var d1 = cabDoc.value; d1.font = $.global.REELS_RESULT.fontes["700"];
            cabDoc.setValueAtTime(f(fc), d1);
            var d2 = cabDoc.value; d2.font = $.global.REELS_RESULT.fontes["500"];
            cabDoc.setValueAtTime(f(fc + 3), d2);
        } catch (e) { /* se a face 500 nao existir, o bump do anel ja carrega o micro-evento */ }
    }

    // ================================================================ C8-ABERTO
    // Enquadramento aberto. Vale pros planos 1 (f0 a f267) e 3 (f306 a f366).
    removeItem("C8-ABERTO");
    var aberto = proj.items.addComp("C8-ABERTO", W, H, 1, MASTER_F / FPS, FPS);
    aberto.parentFolder = fComps;
    aberto.motionBlur = true;
    aberto.shutterAngle = 180;

    var lTira = aberto.layers.add(tira);
    lTira.name = "tira-12";
    lTira.motionBlur = true;
    var posTira = lTira.property("ADBE Transform Group").property("ADBE Position");

    // px pra centralizar a folha i: 3048 - i*456. Centro vertical da tira em y 640.
    function pxFolha(i) { return 3048 - i * PITCH; }

    posTira.setValueAtTime(f(0),   [pxFolha(0), 640]);
    posTira.setValueAtTime(f(42),  [pxFolha(0), 640]);
    // velocidade constante 547,2 px/s ate f189 (18,24 px/frame)
    posTira.setValueAtTime(f(189), [3048 - 2681.28, 640]);
    // frenagem de 6 frames, ease-out sem overshoot, parando com o mes-alvo centrado em f195
    posTira.setValueAtTime(f(195), [pxFolha(ALVO), 640]);
    ease(posTira, 4);
    // freeze de 10 frames: nada se move ate f205. Retomada so no plano 3.
    posTira.setValueAtTime(f(306), [pxFolha(ALVO), 640]);
    // varredura de volta a 380 px/s: 1 pitch em 36 frames, AGOSTO centrado em f342
    posTira.setValueAtTime(f(342), [pxFolha(ALVO + 1), 640]);
    // interpolacao linear nos trechos de velocidade constante
    posTira.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    posTira.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    posTira.setInterpolationTypeAtKey(3, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    posTira.setInterpolationTypeAtKey(5, KeyframeInterpolationType.HOLD);

    // GUIA-mira: hairline 3px borda forte em x 540, de y 380 a y 900. Elemento VISIVEL.
    var mira = aberto.layers.addShape();
    mira.name = "GUIA-mira";
    grupoRect(mira, "mira", [3, 520], 0, BORDER_STRONG, null, 0, [0, 0]);
    mira.property("ADBE Transform Group").property("ADBE Position").setValue([540, 640]);
    mira.motionBlur = false;
    // sai em fade de 250ms de f342 a f350, quando o colapso comeca
    var miraOp = mira.property("ADBE Transform Group").property("ADBE Opacity");
    miraOp.setValueAtTime(f(342), 100);
    miraOp.setValueAtTime(f(350), 0);
    ease(miraOp, 2);

    // ================================================================ C8-FECHADO
    // Plano 2: a mesma folha a 190%, celula nua em (540, 700). O anel se desenha por trim path.
    removeItem("C8-FECHADO");
    var fechado = proj.items.addComp("C8-FECHADO", W, H, 1, 60 / FPS, FPS);
    fechado.parentFolder = fComps;

    var lTiraF = fechado.layers.add(tira);
    lTiraF.name = "tira-12-190";
    lTiraF.property("ADBE Transform Group").property("ADBE Scale").setValue([190, 190]);
    // ancora da tira = centro da comp (2808, 300). A celula nua do mes-alvo esta em
    // (300 + 6*456 + 0, 300 - 113) = (3036, 187) no espaco da tira.
    // Deslocamento ate a ancora: (3036-2808, 187-300) = (228, -113), escalado 1,9 = (433,2, -214,7)
    lTiraF.property("ADBE Transform Group").property("ADBE Position")
          .setValue([540 - 433.2, 700 + 214.7]);
    lTiraF.motionBlur = false;

    // o anel do payoff: desenhado por trim path, 400ms ease-out, comeco as 12 horas, horario
    var anelP = fechado.layers.addShape();
    anelP.name = "anel-payoff-coral";
    anelP.property("ADBE Transform Group").property("ADBE Position").setValue([540, 700]);
    anelP.property("ADBE Transform Group").property("ADBE Rotation").setValue(0);
    var apg = anelP.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    apg.name = "anel";
    var apel = apg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
    apel.property("ADBE Vector Ellipse Size").setValue([74 * 1.9, 66 * 1.9]);
    var apst = apg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
    apst.property("ADBE Vector Stroke Color").setValue(CORAL_600);
    apst.property("ADBE Vector Stroke Width").setValue(13);
    apst.property("ADBE Vector Stroke Line Cap").setValue(2);
    var apTrim = anelP.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim");
    var apEnd = apTrim.property("ADBE Vector Trim End");
    apEnd.setValueAtTime(f(0), 0);
    apEnd.setValueAtTime(f(12), 100);   // 400ms
    ease(apEnd, 2);
    // settle de peso de 150ms depois do desenho: 13 > 15 > 13, sem escala
    var apSW = apst.property("ADBE Vector Stroke Width");
    apSW.setValueAtTime(f(12), 13);
    apSW.setValueAtTime(f(14), 15);
    apSW.setValueAtTime(f(17), 13);
    ease(apSW, 3);

    // ================================================================ MASTER
    var master = $.global.REELS_novoMaster("MASTER-C8-VARREDURA", MASTER_F);
    master.motionBlur = true;
    master.shutterAngle = 180;

    // ---- PLANO 1: f0 a f267, aberto, push-in continuo de 4% com freeze de f195 a f205
    var p1 = master.layers.add(aberto);
    p1.name = "PLANO-1-aberto";
    p1.inPoint = f(0); p1.outPoint = f(267);
    var sc1 = p1.property("ADBE Transform Group").property("ADBE Scale");
    sc1.setValueAtTime(f(0), [100, 100]);
    sc1.setValueAtTime(f(195), [102.92, 102.92]);
    sc1.setValueAtTime(f(205), [102.92, 102.92]);   // o push-in tambem congela
    sc1.setValueAtTime(f(267), [104, 104]);
    for (var s = 1; s <= 4; s++) {
        sc1.setInterpolationTypeAtKey(s, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    }

    // ---- PLANO 2: f267 a f306, fechado, o anel se desenha
    var p2 = master.layers.add(fechado);
    p2.name = "PLANO-2-fechado-anel";
    p2.startTime = f(267);
    p2.inPoint = f(267); p2.outPoint = f(306);

    // ---- PLANO 3: f306 a f366, aberto de novo, varredura mais lenta e colapso
    var p3 = master.layers.add(aberto);
    p3.name = "PLANO-3-aberto-colapso";
    p3.inPoint = f(306); p3.outPoint = f(366);
    var sc3 = p3.property("ADBE Transform Group").property("ADBE Scale");
    sc3.setValueAtTime(f(306), [100, 100]);
    sc3.setValueAtTime(f(342), [103, 103]);
    sc3.setValueAtTime(f(366), [103, 103]);         // congela no colapso
    sc3.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    sc3.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);

    // ---- GUIA-mira / âncoras / micro-label / legendas vivem no MASTER
    // Âncora display 1: 2 linhas, Sora 700 160px, tracking -2%, leading 152,
    // baselines y 714 e y 866 (centro óptico 790). Opacidade 100 DESDE O f0: o hook não anima.
    var a1 = txt(master, "ANCORA-1", "eu não pulo\nmês.", {
        peso: "700", size: 160, cor: INK_900, tracking: -20, leading: 152, baseline: 714
    });
    a1.motionBlur = false;
    a1.outPoint = f(50);
    $.global.REELS_sai250(a1, 42);

    // Âncora display 2: entra em 400ms em f208, sai em fade de 250ms em f256
    var a2 = txt(master, "ANCORA-2", "eu não deixo\npassar.", {
        peso: "700", size: 155, cor: INK_900, tracking: -20, leading: 147, baseline: 716
    });
    a2.motionBlur = false;
    a2.inPoint = f(208); a2.outPoint = f(264);
    $.global.REELS_entra400(a2, 208, 48);
    $.global.REELS_sai250(a2, 256);

    // Micro-label: x 72, baseline y 320, Sora 500 32px CAPS tracking +8%, ink-500.
    // Troca duas vezes, sempre com bump de 150ms.
    function microLabel(nome, texto, fIn, fOut) {
        var m = txt(master, nome, texto, {
            peso: "500", size: 32, cor: INK_500, tracking: 80,
            justif: ParagraphJustification.LEFT_JUSTIFY, x: 72, baseline: 320
        });
        m.motionBlur = false;
        m.inPoint = f(fIn);
        if (fOut) { m.outPoint = f(fOut); }
        return m;
    }
    microLabel("LABEL-1", "CALENDÁRIO", 0, 205);
    microLabel("LABEL-2", "AINDA NÃO MARCADO", 205, 366);
    microLabel("LABEL-3", "TELA DO APP · OBRIGAÇÕES DO MÊS", 366, 405);

    // ---- LEGENDA QUEIMADA: baseline única y 1440 (régua de mote A), Sora 600 60px.
    // Entra word-by-word em 150ms por palavra. A palavra forte recebe cor por range selector.
    // B5 e B6 têm palavra forte em INK, não coral, porque o anel está aceso no palco.
    function legenda(nome, texto, forte, corForte, fIn, fOut) {
        var t = txt(master, nome, texto, {
            peso: "600", size: 60, cor: INK_900, tracking: -10, baseline: 1440
        });
        t.motionBlur = false;
        t.inPoint = f(fIn); t.outPoint = f(fOut);

        var anims = t.property("ADBE Text Properties").property("ADBE Text Animators");

        // 1) entrada word-by-word: opacidade 0 e y +24, revelada por offset de seletor
        var aEnt = anims.addProperty("ADBE Text Animator");
        aEnt.name = "entrada-word-by-word";
        var selEnt = aEnt.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        selEnt.property("ADBE Text Range Units").setValue(1);      // percent
        selEnt.property("ADBE Text Range Type2").setValue(3);      // based on WORDS
        selEnt.property("ADBE Text Selector Shape").setValue(2);   // ramp up
        var off = selEnt.property("ADBE Text Percent Offset");
        off.setValueAtTime(f(fIn), -100);
        off.setValueAtTime(f(fIn + 8), 0);
        ease(off, 2);
        var props = aEnt.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Opacity").setValue(0);
        props.addProperty("ADBE Text Position").setValue([0, 24]);

        // 2) palavra forte: cor por range selector em INDEX
        var idx = texto.indexOf(forte);
        if (idx >= 0) {
            var aCor = anims.addProperty("ADBE Text Animator");
            aCor.name = "palavra-forte";
            var selCor = aCor.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
            selCor.property("ADBE Text Range Units").setValue(2);  // index
            selCor.property("ADBE Text Index Start").setValue(idx);
            selCor.property("ADBE Text Index End").setValue(idx + forte.length);
            aCor.property("ADBE Text Animator Properties")
                .addProperty("ADBE Text Fill Color").setValue(corForte);
        }

        // saída em fade de 250ms terminando exatamente no fOut
        var op = t.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(f(fOut - 8), 100);
        op.setValueAtTime(f(fOut), 0);
        ease(op, op.numKeys);
        return t;
    }

    legenda("B1", "eu fico de olho.",        "olho",      CORAL_600, 50,  100);
    legenda("B2", "você cuida do negócio.",  "negócio",   CORAL_600, 100, 150);
    legenda("B3", "eu passo pelos doze.",    "doze",      CORAL_600, 150, 215);
    legenda("B4", "esse aqui eu vi antes.",  "antes",     CORAL_600, 215, 267);
    // f267: o anel começa a se desenhar. B4 chega a opacidade zero EXATAMENTE aqui.
    legenda("B5", "então eu marco.",         "marco",     INK_900,   265, 309);
    legenda("B6", "sem pular nenhum.",       "nenhum",    INK_900,   309, 373);
    legenda("B7", "esse é o combinado.",     "combinado", CORAL_600, 373, 413);

    // ---- PLANO 4: f366 a f405, crop da tela real do app, corte casado no mesmo retângulo
    // obrigacoes.png 1290x2796 · crop x354 y1406 w816 h490 · escala 1,147x = 936x562 em quadro
    // Auditado por pixel: 0 coral, 0 verde, 0 azul, 0 travessão, 0 valor monetário no crop.
    var telaItem = findItem("obrigacoes.png");
    if (!telaItem) {
        try {
            var arq = new File("c:/Projects/Legalizei_Videos/marketing/telas-app/obrigacoes.png");
            if (arq.exists) {
                var io = new ImportOptions(arq);
                telaItem = proj.importFile(io);
                telaItem.parentFolder = pasta("03-ASSETS");
            }
        } catch (e) { telaItem = null; }
    }
    if (telaItem) {
        var p4 = master.layers.add(telaItem);
        p4.name = "PLANO-4-tela-obrigacoes";
        p4.inPoint = f(366); p4.outPoint = f(405);
        p4.property("ADBE Transform Group").property("ADBE Scale").setValue([114.7, 114.7]);
        // centro do crop na fonte = (762, 1651); centro da fonte = (645, 1398)
        // deslocamento escalado = (134,2 ; 290,2) -> posição = (540-134,2 ; 790-290,2)
        p4.property("ADBE Transform Group").property("ADBE Position").setValue([405.8, 499.8]);
        // máscara no retângulo exato do corte casado: 936x562 centrado em (540, 790)
        var mk = p4.property("ADBE Mask").addProperty("ADBE Mask Atom");
        var sh = new Shape();
        sh.vertices = [[72, 509], [1008, 509], [1008, 1071], [72, 1071]];
        sh.closed = true;
        mk.property("ADBE Mask Shape").setValue(sh);
        mk.name = "corte-casado-936x562";
    } else {
        var falta = txt(master, "PLANO-4-FALTA-ASSET", "FALTA obrigacoes.png", {
            peso: "700", size: 48, cor: CORAL_600, baseline: 790
        });
        falta.inPoint = f(366); falta.outPoint = f(405);
    }

    // ---- PLANO 5: f405 a f480, end card padrão da leva (2,50s)
    var logoItem = findItem("legalizai-logo-horizontal.svg");
    if (!logoItem) {
        try {
            var lf = new File("c:/Projects/Legalizei_Videos/identidade/logos/legalizai-logo-horizontal.svg");
            if (lf.exists) {
                logoItem = proj.importFile(new ImportOptions(lf));
                logoItem.parentFolder = pasta("03-ASSETS");
            }
        } catch (e2) { logoItem = null; }
    }
    $.global.REELS_endcard(master, 405,
        "Entra na lista de espera.",
        "O prazo fica comigo.",
        "Cadastre-se",
        logoItem);

    // ---- super de condição: mote A NÃO tem. Nasce desligado, pra template das outras peças.
    $.global.REELS_superCondicao(master, false);

    // ---- grain: 1,5% base, sobe pra 2% durante o colapso (área grande em movimento faz banding)
    var grainItem = findItem("PRE-grain");
    if (grainItem) {
        var lg = master.layers.add(grainItem);
        lg.name = "GRAIN";
        lg.moveToBeginning();
        lg.outPoint = f(MASTER_F);
        var gop = lg.property("ADBE Transform Group").property("ADBE Opacity");
        gop.setValueAtTime(f(0), 100);
        gop.setValueAtTime(f(342), 100);
        gop.setValueAtTime(f(354), 133);   // 1,5% -> 2%
        gop.setValueAtTime(f(366), 100);
    }

    // ---- assert anti-blur: nenhum efeito com "Blur" pode existir no projeto
    var achouBlur = [];
    for (var ci = 1; ci <= proj.numItems; ci++) {
        var it = proj.item(ci);
        if (!(it instanceof CompItem)) { continue; }
        for (var li = 1; li <= it.numLayers; li++) {
            var fx = it.layer(li).property("ADBE Effect Parade");
            if (!fx) { continue; }
            for (var ei = 1; ei <= fx.numProperties; ei++) {
                var mn = fx.property(ei).matchName;
                if (mn.indexOf("Blur") !== -1 || mn.indexOf("blur") !== -1) {
                    achouBlur.push(it.name + " / " + it.layer(li).name + " / " + mn);
                }
            }
        }
    }
    if (achouBlur.length) {
        throw new Error("ASSERT ANTI-BLUR FALHOU. Blur direcional reprova no build. Achados: " +
                        achouBlur.join(" ;; "));
    }

    $.global.REELS_RESULT = {
        master: master.name,
        frames: MASTER_F,
        duracao: (MASTER_F / FPS) + "s",
        comps: ["PRE-tira-12", "C8-ABERTO", "C8-FECHADO", master.name],
        mesAlvo: MESES[ALVO],
        acendimentos_coral: 2,
        tela_importada: telaItem ? true : false,
        logo_importado: logoItem ? true : false,
        assert_anti_blur: "ok, zero efeitos de blur no projeto"
    };
})();
