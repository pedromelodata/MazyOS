import { C } from "./cores";

// Texto exato do Pedro (conferido no vault), só dividido em título e apoio, com quebras manuais medidas na Sora.
// Uma expressão de destaque por tela, em 700 coral-600 (#DD4E27, 3,81:1 sobre o papel); o #F2643C fica no
// "Legalizaí" de 100 px da capa e nos objetos.
//
// Revisão v3 (02/10): capa com o texto colado ("tradicional e Legalizaí: o que muda pra você?"); vitrine em dois
// painéis arredondados; aparelho travado na mesma caixa da capa até a tela 5; sem contador no rodapé; "Plano ME"
// dentro da pílula LEGALIZAÍ da tela 3 (título e palco não mexem).

export type Seg = { t: string; cor?: string; peso?: number };
export type Linha = Seg[];

export type CamCfg = { cy: number; s: number };

export type Caixa = [number, number, number, number]; // x0, y0, x1, y1 em px do quadro

export type FundoCfg = {
  vitrines: Caixa[]; // 1 (fecho: um painel só, quente) ou 2 (esquerda fria, direita quente)
  halo: [number, number]; // centro do halo coral (px)
  haloI: number; // intensidade do halo
  luzFria?: [number, number]; // centro da luz suave do painel frio
  brilho?: { cx: number; cy: number; rx: number; ry: number; i: number }; // brilho do splash no chão (capa)
};

export type TelaCfg = {
  n: number;
  arquivo: string;
  tipo: "capa" | "interna" | "fecho";
  cam: CamCfg;
  fundo: FundoCfg;
  titulo: Linha[];
  tituloTopo: number;
  apoio: Linha[];
  apoioTopo: number;
  rotulos?: { planoMe?: boolean }; // pílulas dentro dos painéis (telas 1 a 5)
};

// ---------------------------------------------------------------------------------------------------------
// Grade da vitrine (iguais da capa à tela 5): painéis com raio 24, vão de 24 px no meio do quadro.
export const VITRINE_TOPO = 458;
export const VITRINE_BASE = 1212;
export const VITRINE_ESQ: Caixa = [72, VITRINE_TOPO, 528, VITRINE_BASE];
export const VITRINE_DIR: Caixa = [552, VITRINE_TOPO, 1008, VITRINE_BASE];
export const VITRINE_RAIO = 24;
// capa: o título de 3 linhas desce mais; os painéis começam em 500 (o aparelho fica na mesma caixa)
const CAPA_ESQ: Caixa = [72, 500, 528, 1196];
const CAPA_DIR: Caixa = [552, 500, 1008, 1196];
// fecho: um painel só, quente (a fusão)
const FECHO: Caixa = [72, 212, 1008, 872];

/** caixa do aparelho travada da capa à tela 5 (tolerância de 15 px) */
export const FONE_CAIXA: Caixa = [648, 560, 947, 1161];
export const CAM_PADRAO: CamCfg = { cy: 880, s: 3750 };

const L = (t: string): Seg => ({ t });
const destaque = (t: string): Seg => ({ t, cor: C.coral600, peso: 700 });
const forte = (t: string): Seg => ({ t, cor: C.tinta, peso: 700 });
const forteCoral = (t: string): Seg => ({ t, cor: C.coral600, peso: 700 });

const HALO: [number, number] = [800, 860];
const LUZ_FRIA: [number, number] = [292, 900];

export const TELAS: TelaCfg[] = [
  {
    n: 0,
    arquivo: "01-capa.png",
    tipo: "capa",
    cam: CAM_PADRAO,
    fundo: { vitrines: [CAPA_ESQ, CAPA_DIR], halo: HALO, haloI: 0.5, luzFria: LUZ_FRIA, brilho: { cx: 800, cy: 1163, rx: 210, ry: 34, i: 0.16 } },
    // O Pedro nomeou o carrossel "Contabilidade Tradicional Vs Legalizaí" (02/10): o "vs" vai no título e a
    // pergunta do texto colado ("o que muda pra você?") vira o apoio
    titulo: [[L("Contabilidade")], [L("tradicional "), { t: "vs", cor: C.tinta3, peso: 400 }], [{ t: "Legalizaí", cor: C.coral }]],
    tituloTopo: 92,
    apoio: [[L("O que muda pra você?")]],
    apoioTopo: 412,
  },
  {
    n: 1,
    arquivo: "02-abrir-a-empresa.png",
    tipo: "interna",
    cam: CAM_PADRAO,
    fundo: { vitrines: [VITRINE_ESQ, VITRINE_DIR], halo: HALO, haloI: 0.4, luzFria: LUZ_FRIA },
    titulo: [[L("Abrir a empresa")]],
    tituloTopo: 88,
    apoio: [
      [L("Antes, era papel e ida ao escritório.")],
      [L("Agora, tudo pelo "), destaque("celular ou computador"), L(",")],
      [L("e você assina com a sua conta gov.br.")],
    ],
    apoioTopo: 190,
    rotulos: {},
  },
  {
    n: 2,
    arquivo: "03-a-guia-do-mes.png",
    tipo: "interna",
    cam: CAM_PADRAO,
    fundo: { vitrines: [VITRINE_ESQ, VITRINE_DIR], halo: HALO, haloI: 0.4, luzFria: LUZ_FRIA },
    titulo: [[L("A guia do mês")]],
    tituloTopo: 88,
    apoio: [
      [L("O sistema calcula o imposto do mês,")],
      [L("emite a guia e te avisa no app e no WhatsApp.")],
      [forte("Você "), forteCoral("só paga"), forte(".")],
    ],
    apoioTopo: 190,
    rotulos: {},
  },
  {
    n: 3,
    arquivo: "04-caso-fora-do-padrao.png",
    tipo: "interna",
    cam: CAM_PADRAO,
    fundo: { vitrines: [VITRINE_ESQ, VITRINE_DIR], halo: HALO, haloI: 0.4, luzFria: LUZ_FRIA },
    titulo: [[L("Quando o caso")], [L("foge do padrão")]],
    tituloTopo: 88,
    apoio: [
      [L("Continua com "), destaque("gente de verdade"), L(":")],
      [L("um contador com registro no CRC.")],
      [L("A conta de rotina fica com o sistema.")],
    ],
    apoioTopo: 268,
    rotulos: { planoMe: true },
  },
  {
    n: 4,
    arquivo: "05-o-que-voce-paga.png",
    tipo: "interna",
    cam: CAM_PADRAO,
    fundo: { vitrines: [VITRINE_ESQ, VITRINE_DIR], halo: HALO, haloI: 0.45, luzFria: LUZ_FRIA },
    titulo: [[L("O que você paga")]],
    tituloTopo: 88,
    apoio: [
      [L("O que é serviço fica "), destaque("separado")],
      [L("do que é taxa do governo. Você vê")],
      [L("pra onde vai cada parte antes de pagar.")],
    ],
    apoioTopo: 190,
    rotulos: {},
  },
  {
    n: 5,
    arquivo: "06-antes-de-assinar.png",
    tipo: "interna",
    cam: CAM_PADRAO,
    fundo: { vitrines: [VITRINE_ESQ, VITRINE_DIR], halo: HALO, haloI: 0.45, luzFria: LUZ_FRIA },
    titulo: [[L("Antes de assinar")]],
    tituloTopo: 88,
    apoio: [
      [L("Antes de qualquer pagamento, você vê")],
      [L("o CNPJ da Legalizaí, o registro do contador")],
      [L("e o "), destaque("contrato inteiro"), L(".")],
    ],
    apoioTopo: 190,
    rotulos: {},
  },
  {
    n: 6,
    arquivo: "07-fecho.png",
    tipo: "fecho",
    cam: { cy: 555, s: 3600 },
    fundo: { vitrines: [FECHO], halo: [560, 560], haloI: 0.4 },
    // no fecho o "título" é a pergunta (embaixo) e o "apoio" é a frase (em cima)
    titulo: [[L("E você, prefere")], [L("resolver como?")]],
    tituloTopo: 900,
    apoio: [[L("O "), forte("mesmo cuidado"), L(" de quem entende de")], [L("contabilidade, agora no app que tá chegando.")]],
    apoioTopo: 88,
  },
];
