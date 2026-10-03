// Extensão "tradicional-vs-legalizai" do kit de motion (reel de 05/10/2026, "Contabilidade tradicional vs
// Legalizaí"). Contrato: KIT/DESENHO.md, seções 4.3 e 4.10.
//
// As 22 batidas que esta extensão criou (vitrine-luz, carimba, pasta-leva, cartao-sai-da-tela, moeda-pessoa e as
// outras) e a camada "pilula-comenta" agora são do kit, na extensão comum (RM/src/kit/ext/comum/batidas.ts), com os
// mesmos ids, os mesmos números padrão e o mesmo código: a cena da peça continua igual. Aqui fica só o tipo de palco
// da peça ("palco-tvl"), registrado pelo comum.ts com as peças e as poses do reel.
import type { Batida } from "../../nucleo/tipos";
import { REGISTRADO, TIPO_PALCO_TVL } from "./comum";

/** o tipo de palco que esta extensão registra (e se o registro entrou; false quer dizer que o tipo já existia) */
export const palcos: Record<string, boolean> = { [TIPO_PALCO_TVL]: REGISTRADO };

export const batidas: Record<string, Batida<any>> = {};

export const camadas: Record<string, { descricao: string; params: Record<string, unknown>; canais: string[] }> = {};
