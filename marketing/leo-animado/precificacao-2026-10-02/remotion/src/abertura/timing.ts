// Grade de tempo do vídeo "Abertura do mês" (peça de 01/10, pilar 16).
// Trilha "Brand New Beginning" (Öman) a partir de 33,0 s: pulso de 120 BPM (batida a cada 0,5 s) e a
// virada da música em 34,005 s, que cai em 1,0 s do vídeo. Toda troca de cena cai numa batida.
export const FPS = 30;
export const DUR = 18;
export const FRAMES = DUR * FPS;
export const BEAT = 0.5;
export const DROP = 1.0;
// cenas: [início, fim) em segundos
export const SC = {
  gancho: [0, 3],
  guarde: [3, 6],
  prova: [6, 9],
  dia20: [9, 12],
  app: [12, 15],
  cta: [15, 18],
} as const;
export type Cena = keyof typeof SC;
