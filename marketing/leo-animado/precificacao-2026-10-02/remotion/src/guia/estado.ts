import { novaTela, type TelaSt } from "./tela";
import type { FolhaSt, RelogioSt } from "./pinturas";
import narr from "./narracao.json";

export const FPS = 30;
export const DUR = 18; // s (narração 14,7 s + "Vai, legaliza aí" falado de 15,03 a 16,55 + volta pro quadro 0, em loop)
export const FRAMES = DUR * FPS;

/** início (s) da palavra i da narração (whisper, conferido) */
export const W = (i: number) => narr.words[i].s;

export type Obj = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; vis: number };
const obj = (o: Partial<Obj> = {}): Obj => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 1, ...o });

// Tudo que a linha do tempo anima. O 3D e as camadas 2D só LEEM daqui (depois do seek do quadro).
export type Estado = {
  cam: { x: number; y: number; z: number; tx: number; ty: number; tz: number; fov: number };
  phone: Obj;
  watch: Obj & { buzz: number };
  folha: Obj;
  chip: Obj;
  tela: TelaSt;
  relogio: RelogioSt;
  papel: FolhaSt;
  luz: { varre: number; flash: number; quente: number; onda: number };
  part: { amb: number; conv: number; burst1: number; burst2: number; burst3: number; poeira: number };
  ondas: number; // 0..1 anéis de vibração do relógio
  impactos: number[]; // instantes de impacto (tremida curta de câmera)
  ui: { selo: number; seloPulso: number; logo: number; link: number; assina: number; ai: number };
};

// pose do quadro 0 (e do último, pro loop)
export const POSE0 = { x: 0, y: -0.012, z: 0, rx: 0.1, ry: -0.55, rz: 0.035 };
export const CAM0 = { x: 0, y: 0.004, z: 0.66, tx: 0, ty: -0.004, tz: 0, fov: 30 };

export const novoEstado = (): Estado => ({
  cam: { ...CAM0 },
  phone: obj({ ...POSE0 }),
  watch: { ...obj({ x: 0.2, y: -0.05, z: 0.12, vis: 0 }), buzz: 0 },
  folha: obj({ vis: 0, s: 0.5 }),
  chip: obj({ vis: 0, s: 0 }),
  tela: novaTela(),
  relogio: { notif: 0, luz: 1 },
  papel: { carimbo: 0 },
  luz: { varre: 0, flash: 0, quente: 0, onda: 0 },
  part: { amb: 0.65, conv: 0, burst1: 0, burst2: 0, burst3: 0, poeira: 0 },
  ondas: 0,
  impactos: [],
  ui: { selo: 0, seloPulso: 0, logo: 0, link: 0, assina: 0, ai: 0 },
});
