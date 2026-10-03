// O loadFont do @remotion/fonts só põe a Sora no document.fonts DEPOIS de baixar e carregar o arquivo. Um
// document.fonts.load() chamado antes disso resolve na hora, sem fonte nenhuma, e o canvas pinta com a fonte
// reserva. Aqui espera a face "Sora" aparecer carregada (e depois pede os pesos usados).
export async function esperaSora(pesos: number[] = [500, 700, 800], limiteMs = 20000) {
  const t0 = performance.now();
  for (;;) {
    let pronta = false;
    document.fonts.forEach((f) => {
      if (f.family.replace(/["']/g, "") === "Sora" && f.status === "loaded") pronta = true;
    });
    if (pronta) break;
    if (performance.now() - t0 > limiteMs) throw new Error("a Sora não carregou (public-carrossel/Sora-wght.ttf)");
    await new Promise((r) => setTimeout(r, 25));
  }
  await Promise.all(pesos.map((p) => document.fonts.load(`${p} 40px Sora`)));
}
