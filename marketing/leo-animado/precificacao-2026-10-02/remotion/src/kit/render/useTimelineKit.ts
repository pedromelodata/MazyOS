// Timeline mestre do KitMotion (dono K06): como o src/abertura/useMasterTimeline.ts. delayRender, espera o
// document.fonts.ready, registra as eases da marca (registraEases do núcleo: não redefine ease que já existe),
// cria a timeline (novaTimeline: pausada, lgEntra e 0,32 por padrão), monta as batidas das props
// (montaTimeline), dá seek(0) e só libera o quadro (continueRender) depois do componente desenhar com ela.
// Não mexe em gsap.defaults e não registra plugin além do CustomEase. A cada quadro, quem usa dá
// tl.seek(t + 1e-4, false): no 0 exato os set() da posição 0 não aplicam (armadilha de 01/10).
import { useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { cancelRender, continueRender, delayRender } from "remotion";
import { novaTimeline, registraEases } from "../nucleo/eases";
import { montaTimeline } from "../nucleo/monta";
import type { Batida, Estado, PropsKit } from "../nucleo/tipos";

export function useTimelineKit(st: Estado, props: PropsKit, batidas: Record<string, Batida<any>>) {
  const [tl, setTl] = useState<gsap.core.Timeline | null>(null);
  const [handle] = useState(() => delayRender("montando a linha do tempo do kit"));
  useLayoutEffect(() => {
    let vivo = true;
    let criada: gsap.core.Timeline | null = null;
    document.fonts.ready.then(() => {
      if (!vivo) return;
      try {
        registraEases(gsap, CustomEase);
        const t = novaTimeline(gsap);
        const avisos: string[] = [];
        montaTimeline(t, st, props, batidas, { avisos });
        for (const a of avisos) console.warn("KIT_AVISO", a);
        t.seek(0, false);
        criada = t;
        setTl(t);
      } catch (e) {
        cancelRender(e);
      }
    });
    return () => {
      vivo = false;
      if (criada) criada.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // libera o quadro só depois que o componente já desenhou com a linha do tempo aplicada
  useLayoutEffect(() => {
    if (tl) continueRender(handle);
  }, [tl, handle]);
  return tl;
}
