import { useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { continueRender, delayRender } from "remotion";

gsap.registerPlugin(SplitText, DrawSVGPlugin, CustomEase);
// GSAP sem relógio próprio: quem manda é o quadro do Remotion (tl.seek por quadro)
gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep();

// Assinatura de movimento da marca (skill motion-design, personalidade "Playful"):
// entrada com overshoot de ~12%, saída acelerada e mola de pouso.
CustomEase.create("lgEntra", "M0,0 C0.18,0.9 0.32,1.12 0.56,1.06 0.74,1.01 0.86,1 1,1");
CustomEase.create("lgSai", "M0,0 C0.4,0 0.7,0.25 1,1");
CustomEase.create("lgPousa", "M0,0 C0.12,0.7 0.24,1.18 0.42,1.1 0.6,0.98 0.78,1.02 1,1");

/**
 * Linha do tempo GSAP mestre, pausada, montada uma vez quando as fontes estão prontas
 * (SplitText precisa das métricas da Sora) e avançada pelo componente a cada quadro.
 */
export function useMasterTimeline(build: (tl: gsap.core.Timeline) => void, scope: React.RefObject<HTMLElement | null>) {
  const [tl, setTl] = useState<gsap.core.Timeline | null>(null);
  const [handle] = useState(() => delayRender("montando a linha do tempo GSAP"));
  useLayoutEffect(() => {
    let ctx: gsap.Context | null = null;
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const t = gsap.timeline({ paused: true, defaults: { ease: "lgEntra", duration: 0.32 } });
        build(t);
        t.seek(0, false);
        setTl(t);
      }, scope.current ?? undefined);
    });
    return () => {
      alive = false;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // libera o quadro só depois que o componente já desenhou com a linha do tempo aplicada
  useLayoutEffect(() => {
    if (tl) continueRender(handle);
  }, [tl, handle]);
  return tl;
}

export { gsap, SplitText };
