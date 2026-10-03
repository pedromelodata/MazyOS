// Extensão "tradicional-vs-legalizai" do kit de motion (render). Contrato: KIT/DESENHO.md, seção 4.10.
// O objeto "palco-tvl" da cena do reel de 05/10/2026 é desenhado pela fábrica do palco de argila da extensão comum
// (RM/src/kit/ext/comum/palco/fabrica.ts), com as peças e as poses que o comum.ts desta pasta registra. A camada
// "pilula-comenta" também é da extensão comum.
import type { RenderExtensao } from "../../render/tipos-render";
import { fabricaPalco } from "../comum/palco/fabrica";
import { TIPO_PALCO_TVL } from "./comum";

export const render: RenderExtensao = {
  objetos: { [TIPO_PALCO_TVL]: fabricaPalco },
};
