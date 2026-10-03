// Eases da marca e a timeline mestre do kit (contrato: KIT/DESENHO.md, seção 4.3; dono K02).
// As três curvas são as do src/abertura/useMasterTimeline.ts, com os mesmos caminhos. O CustomEase é registro
// global do bundle: o kit só cria uma curva se ela ainda não existe (CustomEase.get vazio) e nunca redefine
// ease existente. Curva nova ganha nome novo com prefixo "kit" (exemplo: "kitMola").
// Nada de SplitText, DrawSVGPlugin ou gsap.defaults aqui.

export const CURVAS_MARCA: Record<string, string> = {
  lgEntra: "M0,0 C0.18,0.9 0.32,1.12 0.56,1.06 0.74,1.01 0.86,1 1,1", // entrada com overshoot de ~12%
  lgSai: "M0,0 C0.4,0 0.7,0.25 1,1", // saída acelerada
  lgPousa: "M0,0 C0.12,0.7 0.24,1.18 0.42,1.1 0.6,0.98 0.78,1.02 1,1", // pouso com mola
};

/** o mínimo do gsap que o núcleo usa (o objeto padrão de "gsap" serve) */
export type GsapMinimo = {
  registerPlugin(...plugins: object[]): void;
  timeline(vars?: gsap.TimelineVars): gsap.core.Timeline;
  parseEase(ease: string): gsap.EaseFunction;
};
/** o mínimo do CustomEase (a classe de "gsap/CustomEase" serve) */
export type CustomEaseMinimo = {
  create(id: string, data: string): unknown;
  get(id: string): unknown;
};

/** registra o plugin CustomEase e cria lgEntra, lgSai e lgPousa só se ainda não existirem; devolve as criadas */
export function registraEases(g: GsapMinimo, customEase: CustomEaseMinimo): string[] {
  g.registerPlugin(customEase as unknown as object);
  const criadas: string[] = [];
  for (const nome of Object.keys(CURVAS_MARCA)) {
    if (!customEase.get(nome)) {
      customEase.create(nome, CURVAS_MARCA[nome]);
      criadas.push(nome);
    }
  }
  return criadas;
}

/** curva nova do kit: o nome precisa começar com "kit" e nunca troca uma curva que já existe */
export function criaEaseKit(customEase: CustomEaseMinimo, nome: string, caminho: string): boolean {
  if (!/^kit[A-Z0-9]/.test(nome)) throw new Error(`ease nova do kit precisa do prefixo "kit" (recebido "${nome}")`);
  if (customEase.get(nome)) return false;
  customEase.create(nome, caminho);
  return true;
}

/** timeline mestre igual à do useMasterTimeline: pausada, ease lgEntra e duração 0,32 por padrão */
export function novaTimeline(g: GsapMinimo): gsap.core.Timeline {
  return g.timeline({ paused: true, defaults: { ease: "lgEntra", duration: 0.32 } });
}
