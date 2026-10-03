// Tipos do lado de render do kit (dono K06; contrato: KIT/DESENHO.md, seções 4.4 e 4.10).
// FabricaObjeto é o que uma extensão entrega em render.objetos (por tipo de objeto); CamadaExtensao é o que ela
// entrega em render.camadas (por tipo de camada). O núcleo (K02) continua puro: nada daqui entra nele.
import type React from "react";
import type * as THREE from "three";
import type { Batida, Estado, ObjetoProps, PropsKit } from "../nucleo/tipos";

/** o que já foi carregado antes da fábrica rodar (GLB e imagens pelo caminho no public) */
export type RecursosCena = {
  /** cena original do GLB (clone antes de usar: o cache é compartilhado) */
  glb(caminho: string): THREE.Object3D;
  /** imagem já carregada */
  imagem(caminho: string): HTMLImageElement;
  /** carregar mais coisas depois (com a mesma trava de quadro), pras fábricas assíncronas */
  carregaGLB(caminho: string): Promise<THREE.Object3D>;
  carregaImagem(caminho: string): Promise<HTMLImageElement>;
};

export type ContextoFabrica = {
  objeto: ObjetoProps;
  props: PropsKit;
  recursos: RecursosCena;
  gl: THREE.WebGLRenderer;
};

/** um objeto montado na cena 3D */
export type ObjetoMontado = {
  /** o rig que recebe a pose do quadro (aplicaRig do núcleo) */
  raiz: THREE.Object3D;
  /** quem dimensiona a sombra de contato (padrão: a raiz) */
  alvoSombra?: THREE.Object3D;
  /** força da sombra de contato (padrão: objeto.sombra); 0 desliga a sombra */
  sombra?: number;
  /** ry extra somado no aplicaRig (padrão 0) */
  extraRy?: number;
  /** pinta as texturas do quadro (chamado depois da pose, antes das sombras) */
  pinta?(st: Estado, t: number): void;
};

/** fábrica de um tipo de objeto (núcleo: aparelho, relogio, folha, pilula, comprovante e glb) */
export type FabricaObjeto = {
  /** arquivos do public que a fábrica precisa antes de criar; o render carrega tudo junto, na ordem da cena */
  arquivos?(objeto: ObjetoProps, props: PropsKit): { glb?: string[]; imagens?: string[] };
  /** cria o objeto; pode devolver Promise (extensão que carrega textura própria) */
  cria(ctx: ContextoFabrica): ObjetoMontado | Promise<ObjetoMontado>;
};

/** camada 2D de extensão: desenhada por cima da legenda e do fecho, na ordem de props.camadas */
export type CamadaExtensao = React.FC<{ id: string; st: Estado; props: PropsKit; t: number }>;

/** o que RM/src/kit/ext/<nome>/render.tsx exporta em `render` */
export type RenderExtensao = {
  objetos?: Record<string, FabricaObjeto>;
  camadas?: Record<string, CamadaExtensao>;
};

/** metadados puros de camada (RM/src/kit/ext/<nome>/batidas.ts exporta em `camadas`) */
export type MetaCamada = { descricao: string; params: Record<string, unknown>; canais: string[] };

/** o que RM/src/kit/ext/<nome>/batidas.ts exporta */
export type BatidasExtensao = {
  batidas?: Record<string, Batida<any>>;
  camadas?: Record<string, MetaCamada>;
};

/** uma extensão como o ext.ts entrega (desligada quando `erro` vem preenchido) */
export type Extensao = {
  nome: string;
  batidas: Record<string, Batida<any>>;
  camadas: Record<string, MetaCamada>;
  render: RenderExtensao;
  erro: string | null;
};
