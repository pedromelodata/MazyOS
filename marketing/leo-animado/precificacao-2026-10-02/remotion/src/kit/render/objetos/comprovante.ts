// Objeto "comprovante" (dono K06; contrato: KIT/DESENHO.md, seção 4.9): papel como a folha DAS (proc-comprovante
// do catálogo) pintado pelo PintorComprovante com os dados de objeto.conteudo. conteudo.mostraValor false troca o
// valor por esqueleto (obrigatório em peça de MEI, F063).
import { PintorComprovante, type DadosComprovante } from "../pintores/comprovante";
import type { FabricaObjeto } from "../tipos-render";
import { papelCurvo, renderPapel, type RenderPapel } from "./folha";

/** o render da proc-comprovante (o mesmo do catálogo), pra quando a cena não traz o bloco */
export const RENDER_COMPROVANTE_PADRAO: RenderPapel = {
  plano: { largura: 0.06, altura: 0.11, segmentos: [10, 18], curva: -4, ondula: 0.003, freqOndula: 36 },
  canvas: [660, 1210],
  material: { cor: "#F7F4EF", rugosidade: 1, envMap: 0.45 },
  sombraRet: { x: 0.004, y: -0.007, z: -0.014, opacidade: 0.4 },
};

export const fabricaComprovante: FabricaObjeto = {
  cria({ objeto: o }) {
    const r = renderPapel(o, RENDER_COMPROVANTE_PADRAO);
    const pintor = new PintorComprovante((o.conteudo || null) as Partial<DadosComprovante> | null, r.canvas, o.flipY !== false);
    const papel = papelCurvo(pintor.tex, r);
    return {
      raiz: papel,
      sombra: o.sombra,
      pinta() {
        pintor.pinta();
      },
    };
  },
};
