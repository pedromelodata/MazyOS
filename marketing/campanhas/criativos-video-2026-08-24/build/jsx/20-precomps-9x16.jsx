// 20-precomps-9x16.jsx — precomps e fábricas compartilhadas pela leva (idempotente)
// Nasce na peça 8 (piloto). Tudo aqui é TEMPLATE reusável pelas outras cinco peças.
//
// Entrega:
//   PRE-grain ............ ruído 1,5% (sobe pra 2% em movimento de área grande)
//   PRE-traco ............ hairline 936x3 por Trim Path, 150ms ease-out. O micro-evento primitivo da leva
//   $.global.REELS_txt ... cria text layer point-text com baseline exata
//   $.global.REELS_ease .. aplica ease-out padrão (150/250/400ms), sem bounce, nunca overshoot
//   $.global.REELS_superCondicao(comp) ... super de condição de 3 linhas no rodapé (motes B e C)
//   $.global.REELS_endcard(comp, f0, cta1, cta2, rotulo) ... end card padrão de 2,50s
//
// Rodar depois do 10-estrutura-9x16.jsx. Resultado em $.global.REELS_RESULT.

(function () {
    var FPS = 30;
    var W = 1080, H = 1920;

    var PAPEL         = [250 / 255, 248 / 255, 245 / 255];
    var CARD          = [1, 1, 1];
    var HAIRLINE      = [227 / 255, 222 / 255, 215 / 255];
    var BORDER_STRONG = [203 / 255, 197 / 255, 188 / 255];
    var INK_900       = [27 / 255, 30 / 255, 36 / 255];
    var INK_600       = [82 / 255, 78 / 255, 72 / 255];
    var INK_500       = [115 / 255, 110 / 255, 103 / 255];
    var CORAL_500     = [242 / 255, 100 / 255, 60 / 255];
    var CORAL_600     = [221 / 255, 78 / 255, 39 / 255];
    var BRANCO        = [1, 1, 1];

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

    // ---------- resolução da fonte ----------
    // Sora é variable (Sora-wght.ttf). Dependendo de como o Windows registrou, o postScriptName
    // muda. Resolve uma vez e guarda, e falha ALTO se não achar, porque fonte errada reprova a peça.
    var FONT_CACHE = {};
    function sora(peso) {
        if (FONT_CACHE[peso]) { return FONT_CACHE[peso]; }
        var candidatos = {
            "700": ["Sora-Bold", "Sora Bold", "Sora-wght-Bold", "Sora"],
            "600": ["Sora-SemiBold", "Sora SemiBold", "Sora-wght-SemiBold", "Sora-Bold", "Sora"],
            "500": ["Sora-Medium", "Sora Medium", "Sora-wght-Medium", "Sora-Regular", "Sora"],
            "400": ["Sora-Regular", "Sora Regular", "Sora-wght-Regular", "Sora"]
        }[peso];
        // sonda: cria um text layer temporário e vê qual nome o AE aceita
        var tmp = proj.items.addComp("__fontprobe", 100, 100, 1, 1, FPS);
        var tl = tmp.layers.addText("A");
        var dp = tl.property("ADBE Text Properties").property("ADBE Text Document");
        var achou = null;
        for (var i = 0; i < candidatos.length; i++) {
            var d = dp.value;
            d.resetCharStyle();
            d.font = candidatos[i];
            dp.setValue(d);
            if (dp.value.font === candidatos[i]) { achou = candidatos[i]; break; }
        }
        tmp.remove();
        if (!achou) {
            throw new Error("Fonte Sora nao encontrada para o peso " + peso +
                            ". Instale Sora-wght.ttf (esta em marketing/filme/escalada/tools/) e reinicie o AE.");
        }
        FONT_CACHE[peso] = achou;
        return achou;
    }

    // ---------- text layer com baseline exata ----------
    // opts: {peso, size, cor, tracking, leading, justif, baseline, x}
    // Point text: a posição da camada É a baseline da primeira linha.
    $.global.REELS_txt = function (comp, nome, texto, opts) {
        var t = comp.layers.addText(texto);
        t.name = nome;
        var dp = t.property("ADBE Text Properties").property("ADBE Text Document");
        var d = dp.value;
        d.resetCharStyle();
        d.font = sora(opts.peso || "700");
        d.fontSize = opts.size;
        d.fillColor = opts.cor || INK_900;
        d.applyFill = true;
        d.applyStroke = false;
        if (opts.tracking !== undefined) { d.tracking = opts.tracking; }
        if (opts.leading !== undefined) { d.autoLeading = false; d.leading = opts.leading; }
        d.justification = opts.justif || ParagraphJustification.CENTER_JUSTIFY;
        dp.setValue(d);
        t.property("ADBE Transform Group").property("ADBE Position")
         .setValue([opts.x === undefined ? 540 : opts.x, opts.baseline]);
        return t;
    };

    // ---------- ease padrão da marca ----------
    // ease-out sempre, sem bounce, sem overshoot. 150 micro / 250 padrão / 400 entrada.
    $.global.REELS_ease = function (prop, iKey) {
        var fora = new KeyframeEase(0, 75);
        var dentro = new KeyframeEase(0, 0.1);
        try {
            prop.setTemporalEaseAtKey(iKey, [dentro], [fora]);
        } catch (e) { /* propriedades multi-dim precisam de array por dimensão */
            var n = prop.value.length || 1;
            var ai = [], ao = [];
            for (var k = 0; k < n; k++) { ai.push(dentro); ao.push(fora); }
            prop.setTemporalEaseAtKey(iKey, ai, ao);
        }
    };

    // entrada padrão de 400ms: opacidade 0>100, y +48>0, escala 92>100
    $.global.REELS_entra400 = function (layer, f0, dy) {
        var t0 = f0 / FPS, t1 = (f0 + 12) / FPS;
        var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(t0, 0); op.setValueAtTime(t1, 100);
        $.global.REELS_ease(op, 2);
        var pos = layer.property("ADBE Transform Group").property("ADBE Position");
        var p = pos.value;
        pos.setValueAtTime(t0, [p[0], p[1] + (dy === undefined ? 48 : dy)]);
        pos.setValueAtTime(t1, p);
        $.global.REELS_ease(pos, 2);
        var sc = layer.property("ADBE Transform Group").property("ADBE Scale");
        var s = sc.value;
        sc.setValueAtTime(t0, [s[0] * 0.92, s[1] * 0.92]); sc.setValueAtTime(t1, s);
        $.global.REELS_ease(sc, 2);
    };

    // saída padrão em fade de 250ms, sem deslocamento
    $.global.REELS_sai250 = function (layer, f0) {
        var op = layer.property("ADBE Transform Group").property("ADBE Opacity");
        op.setValueAtTime(f0 / FPS, 100);
        op.setValueAtTime((f0 + 8) / FPS, 0);
        $.global.REELS_ease(op, op.numKeys);
    };

    var fPre = pasta("02-PRECOMPS");

    // ---------- PRE-grain ----------
    removeItem("PRE-grain");
    var grain = proj.items.addComp("PRE-grain", W, H, 1, 30, FPS);
    grain.parentFolder = fPre;
    var gs = grain.layers.addSolid([0.5, 0.5, 0.5], "ruido", W, H, 1, 30);
    var noise = gs.property("ADBE Effect Parade").addProperty("ADBE Noise");
    noise.property("ADBE Noise-0001").setValue(1.5); // Amount of Noise
    noise.property("ADBE Noise-0002").setValue(0);   // Noise Type: nao usa cor
    gs.blendingMode = BlendingMode.OVERLAY;
    gs.property("ADBE Transform Group").property("ADBE Opacity").setValue(100);

    // ---------- PRE-traco ----------
    // Hairline de 936px que se desenha por Trim Path em 150ms ease-out.
    // É o micro-evento primitivo da leva. NUNCA blur, NUNCA wipe de efeito.
    removeItem("PRE-traco");
    var traco = proj.items.addComp("PRE-traco", 936, 24, 1, 5, FPS);
    traco.parentFolder = fPre;
    var tl = traco.layers.addShape();
    tl.name = "hairline-936";
    var tg = tl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
    tg.name = "traco";
    var trc = tg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
    trc.property("ADBE Vector Rect Size").setValue([936, 3]);
    trc.property("ADBE Vector Rect Roundness").setValue(0);
    var tfill = tg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    tfill.property("ADBE Vector Fill Color").setValue(BORDER_STRONG);
    var trim = tl.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim");
    var fim = trim.property("ADBE Vector Trim End");
    fim.setValueAtTime(0, 0);
    fim.setValueAtTime(5 / FPS, 100); // 150ms
    $.global.REELS_ease(fim, 2);
    tl.property("ADBE Transform Group").property("ADBE Position").setValue([468, 12]);

    // ---------- super de condição (motes B e C) ----------
    // 3 linhas, Sora Regular 30px, line-height 40px EXATOS, baselines 1420 / 1460 / 1500.
    // Entra no 2º quadro e NUNCA sai. Em mote A este bloco nasce desligado.
    $.global.REELS_superCondicao = function (comp, ligado) {
        var linhas = [
            ["Condição garantida pra quem entra na lista.", 1420],
            ["Vale até 31 de dezembro de 2026, ou enquanto a lista", 1460],
            ["estiver aberta, o que vier primeiro.", 1500]
        ];
        var criadas = [];
        for (var i = 0; i < linhas.length; i++) {
            var t = $.global.REELS_txt(comp, "SUPER-condicao-" + (i + 1), linhas[i][0], {
                peso: "400", size: 30, cor: INK_500, leading: 40, baseline: linhas[i][1]
            });
            t.enabled = ligado ? true : false;
            criadas.push(t);
        }
        return criadas;
    };

    // ---------- end card padrão da leva ----------
    // 2,50s (75 frames). Papel entra em POP de 4 frames, nunca dissolve.
    // logoItem pode ser null: nesse caso entra um placeholder com o nome, e o 30-imports
    // troca depois sem retiming.
    $.global.REELS_endcard = function (comp, f0, cta1, cta2, rotulo, logoItem) {
        var out = {};

        // POP de papel: 4 frames, sem dissolve
        var pop = comp.layers.addSolid(PAPEL, "ENDCARD-papel", W, H, 1, comp.duration);
        pop.startTime = f0 / FPS;
        pop.inPoint = f0 / FPS;
        var pop_op = pop.property("ADBE Transform Group").property("ADBE Opacity");
        pop_op.setValueAtTime(f0 / FPS, 0);
        pop_op.setValueAtTime((f0 + 4) / FPS, 100);
        pop_op.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD);
        out.papel = pop;

        // logo, largura 620px, centro (540, 620), entrada de 400ms
        var logo;
        if (logoItem) {
            logo = comp.layers.add(logoItem);
            logo.name = "ENDCARD-logo";
            var larg = logoItem.width || 620;
            var esc = (620 / larg) * 100;
            logo.property("ADBE Transform Group").property("ADBE Scale").setValue([esc, esc]);
        } else {
            logo = comp.layers.addShape();
            logo.name = "ENDCARD-logo-PLACEHOLDER-620px";
            var lg = logo.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            var lr = lg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
            lr.property("ADBE Vector Rect Size").setValue([620, 140]);
            lr.property("ADBE Vector Rect Roundness").setValue(12);
            var lst = lg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
            lst.property("ADBE Vector Stroke Color").setValue(BORDER_STRONG);
            lst.property("ADBE Vector Stroke Width").setValue(3);
        }
        logo.property("ADBE Transform Group").property("ADBE Position").setValue([540, 620]);
        logo.startTime = f0 / FPS;
        logo.inPoint = f0 / FPS;
        $.global.REELS_entra400(logo, f0, 48);
        out.logo = logo;

        // CTA 1 em f0+6, CTA 2 em f0+9
        var c1 = $.global.REELS_txt(comp, "ENDCARD-cta1", cta1, {
            peso: "600", size: 56, cor: INK_900, baseline: 850
        });
        c1.inPoint = (f0 + 6) / FPS;
        var c1op = c1.property("ADBE Transform Group").property("ADBE Opacity");
        c1op.setValueAtTime((f0 + 6) / FPS, 0);
        c1op.setValueAtTime((f0 + 14) / FPS, 100);
        $.global.REELS_ease(c1op, 2);
        out.cta1 = c1;

        var c2 = $.global.REELS_txt(comp, "ENDCARD-cta2", cta2, {
            peso: "600", size: 48, cor: INK_600, baseline: 920
        });
        c2.inPoint = (f0 + 9) / FPS;
        var c2op = c2.property("ADBE Transform Group").property("ADBE Opacity");
        c2op.setValueAtTime((f0 + 9) / FPS, 0);
        c2op.setValueAtTime((f0 + 17) / FPS, 100);
        $.global.REELS_ease(c2op, 2);
        out.cta2 = c2;

        // botão em f0+21: 500x132, raio 36, fill coral-600, centro (540, 1050)
        var bt = comp.layers.addShape();
        bt.name = "ENDCARD-botao";
        var bg = bt.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var br = bg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
        br.property("ADBE Vector Rect Size").setValue([500, 132]);
        br.property("ADBE Vector Rect Roundness").setValue(36);
        var bf = bg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
        bf.property("ADBE Vector Fill Color").setValue(CORAL_600);
        bt.property("ADBE Transform Group").property("ADBE Position").setValue([540, 1050]);
        bt.inPoint = (f0 + 21) / FPS;
        var btop = bt.property("ADBE Transform Group").property("ADBE Opacity");
        btop.setValueAtTime((f0 + 21) / FPS, 0);
        btop.setValueAtTime((f0 + 29) / FPS, 100);
        $.global.REELS_ease(btop, 2);
        var btsc = bt.property("ADBE Transform Group").property("ADBE Scale");
        btsc.setValueAtTime((f0 + 21) / FPS, [96, 96]);
        btsc.setValueAtTime((f0 + 29) / FPS, [100, 100]);
        $.global.REELS_ease(btsc, 2);
        out.botao = bt;

        // rótulo do botão: Sora 700 56px branco, baseline y 1070
        // branco sobre coral-600 dá 4,04:1, então SÓ passa AA em texto grande bold. 56px bold passa.
        var rb = $.global.REELS_txt(comp, "ENDCARD-botao-rotulo", rotulo, {
            peso: "700", size: 56, cor: BRANCO, baseline: 1070
        });
        rb.inPoint = (f0 + 21) / FPS;
        var rbop = rb.property("ADBE Transform Group").property("ADBE Opacity");
        rbop.setValueAtTime((f0 + 21) / FPS, 0);
        rbop.setValueAtTime((f0 + 29) / FPS, 100);
        $.global.REELS_ease(rbop, 2);
        out.rotulo = rb;

        return out;
    };

    $.global.REELS_RESULT = {
        precomps: ["PRE-grain", "PRE-traco"],
        fabricas: ["REELS_txt", "REELS_ease", "REELS_entra400", "REELS_sai250",
                   "REELS_superCondicao", "REELS_endcard"],
        fontes: { "700": sora("700"), "600": sora("600"), "500": sora("500"), "400": sora("400") }
    };
})();
