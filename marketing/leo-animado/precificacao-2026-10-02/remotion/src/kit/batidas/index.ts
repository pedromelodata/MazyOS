// Índice das batidas do núcleo (dono K02): as 13 do reel da guia (seção 5 do KIT/DESENHO.md).
// As extensões (ext/<nome>/batidas.ts) somam as delas a este registro no K06/K07; aqui fica só o núcleo.
import type { Batida } from "../nucleo/tipos";
import { ganchoGiroVarredura } from "./gancho-giro-varredura";
import { naoDeCabeca } from "./nao-de-cabeca";
import { mergulhoAbreApp } from "./mergulho-abre-app";
import { cardContador } from "./card-contador";
import { empurrarTela } from "./empurrar-tela";
import { objetoSaiDaTela } from "./objeto-sai-da-tela";
import { relogioNotificacao } from "./relogio-notificacao";
import { flipTrocaEscondida } from "./flip-troca-escondida";
import { toqueBotao } from "./toque-botao";
import { recuoCamera } from "./recuo-camera";
import { fechoSimbolo } from "./fecho-simbolo";
import { linkBio } from "./link-bio";
import { voltaLoop } from "./volta-loop";

/** a ordem do reel da guia (é a ordem de aplicação na cena da regressão) */
export const ORDEM_GUIA = [
  "gancho-giro-varredura",
  "nao-de-cabeca",
  "mergulho-abre-app",
  "card-contador",
  "empurrar-tela",
  "objeto-sai-da-tela",
  "relogio-notificacao",
  "flip-troca-escondida",
  "toque-botao",
  "recuo-camera",
  "fecho-simbolo",
  "link-bio",
  "volta-loop",
];

const LISTA: Array<Batida<any>> = [
  ganchoGiroVarredura,
  naoDeCabeca,
  mergulhoAbreApp,
  cardContador,
  empurrarTela,
  objetoSaiDaTela,
  relogioNotificacao,
  flipTrocaEscondida,
  toqueBotao,
  recuoCamera,
  fechoSimbolo,
  linkBio,
  voltaLoop,
];

export const BATIDAS_NUCLEO: Record<string, Batida<any>> = {};
for (const b of LISTA) BATIDAS_NUCLEO[b.id] = b;

export {
  ganchoGiroVarredura,
  naoDeCabeca,
  mergulhoAbreApp,
  cardContador,
  empurrarTela,
  objetoSaiDaTela,
  relogioNotificacao,
  flipTrocaEscondida,
  toqueBotao,
  recuoCamera,
  fechoSimbolo,
  linkBio,
  voltaLoop,
};
export { calculaVerso } from "./flip-troca-escondida";
export type { Verso } from "./flip-troca-escondida";
export type { SimboloPublicado, PontoSimbolo } from "./fecho-simbolo";
