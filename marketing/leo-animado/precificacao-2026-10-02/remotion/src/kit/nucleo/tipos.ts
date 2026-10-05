/// <reference types="gsap" />
// Tipos do kit de motion (contrato: KIT/DESENHO.md, seções 4.1 a 4.4; dono K02).
// TypeScript puro: sem React, sem DOM, sem Remotion. Os nomes são os do contrato; campos marcados
// "(acréscimo do K02)" são opcionais e não mudam nada do que o contrato pede.

// ---------- 4.1 Tempo ----------
export type Tempo =
  | number // segundo absoluto do vídeo
  | { palavra: number; desloc?: number; borda?: "inicio" | "fim" } // W(i) ou We(i), mais desloc
  | { fecho: number | "aiAcende"; desloc?: number } // tFecho + n (ou tFecho + aiAcende do fecho.json)
  | { fim: number } // duracao + n (n negativo)
  | { marca: string; desloc?: number } // cenas.json "marcas": {"nome": s}
  | { desloc: number }; // relativo ao t da própria batida (só dentro da batida)

// ---------- 4.2 Estado ----------
export type Obj = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; vis: number };
export type ObjSt = Obj & { buzz: number }; // buzz só tem efeito no tipo relogio
export type CamSt = { x: number; y: number; z: number; tx: number; ty: number; tz: number; fov: number };
export type TelaSt = {
  a: string; b: string; p: number; modo: number; luz: number; // modo 0 = abrir (zoom), 1 = empurrar (entra pela direita)
  brilhoCard: number; conta: number; calc: number; toque: number; toqueBotao: number;
  pulso: number; verif: number; anel: number; verifTexto: string;
};
export type MostradorSt = { notif: number; luz: number };
export type Estado = {
  cam: CamSt;
  obj: Record<string, ObjSt>; // por id de objeto da cena
  telas: Record<string, TelaSt>; // por objeto do tipo aparelho
  mostradores: Record<string, MostradorSt>; // por objeto do tipo relogio
  luz: { varre: number; quente: number };
  ui: { assina: number; ai: number; link: number };
  canais: Record<string, Record<string, number>>; // camadas 2D e objetos de extensão
};

// ---------- 4.3 Batida, contexto e som ----------
export type SomDef = {
  som: string; // id do catálogo de efeitos: "pixabay-405445", "mixkit-166", "sint-s_whoosh"...
  em: string; // nome da âncora da batida ("inicio", "giro", "toque"...)
  desloc: number; // segundos em relação à âncora
  ganhoDb: number;
  // argumentos do sintetizado, na ordem da função Python. Texto "@ancora", "@ancora+0.08" ou "@ancora-0.1"
  // vira o instante da âncora (6 casas); "$nome" vira o valor passado no 2º argumento de ctx.som (acréscimo do K02)
  args?: (number | string)[];
  filtro?: string; // filtro ffmpeg aplicado ao arquivo ("areverse", "asetrate=44100*1.05946,aresample=48000")
  inverte?: boolean; // inverte o sinal sintetizado (o [::-1] do mix_guia.py)
  ancora?: "inicio" | "sincronia"; // padrão "inicio": t é o começo do arquivo; "sincronia": t é o ponto de sincronia do catálogo
  transpor?: "trilha" | number; // semitons; "trilha" usa trilha.tom.transporVerificado do catálogo
};
export type EventoSom = {
  ordem: number; t: number; som: string; ganhoDb: number;
  args?: (number | string)[]; filtro?: string; inverte?: boolean;
  ancora?: "inicio" | "sincronia"; transpor?: number; semente?: number;
  origem: string; // "<id da batida>#<índice do som>" ou "cena#<índice>"
};
export type Ctx = {
  t(x: Tempo, base?: number): number;
  W(i: number): number; We(i: number): number;
  tFecho: number; dur: number; fps: number;
  props: PropsKit;
  // escolhe os sons (params.semSom, params.sons, perfil) e empurra; `valores` (acréscimo do K02) resolve "$nome" nos args
  som(ancoras: Record<string, number>, valores?: Record<string, number | string>): void;
  publica(chave: string, valor: unknown): void; // valor pra uma batida seguinte (ex.: "simbolo")
  le<T>(chave: string): T | undefined;
  avisa(msg: string): void;
};
export type Batida<P> = {
  id: string;
  camada: "3d" | "tela" | "2d" | "fecho";
  descricao: string;
  ancoras: string[];
  padrao: P; // números do reel da guia
  sons: { v2: SomDef[]; enxuto?: SomDef[] }; // perfil v2 = o aprovado
  aplica(tl: gsap.core.Timeline, st: Estado, p: P, ctx: Ctx): void;
};

// ---------- 4.4 Props do KitMotion ----------
export type Palavra = { i: number; t: string; s: number; e: number };
export type Frase = { w: number[]; key: number; title: boolean; s: number; e: number; out: number };
export type Narracao = { fps: number; words: Palavra[]; phrases: Frase[] };
/** narracao.json como o kit grava (seção 4.7): o render ignora o que não conhece (acréscimo do K02) */
export type NarracaoArquivo = Narracao & { tFecho?: number; duracao?: number; roteiro?: string; audio?: string };
export type Regiao = { x: number; y: number; w?: number; h?: number; r?: number; fonte?: string; cor?: string };
export type ExtraTela =
  | { tipo: "brilhoCard"; regiao: string }
  | { tipo: "contador"; regiao: string; valor: number; formato?: "brl" }
  | { tipo: "varredura"; regiao: string }
  | { tipo: "botao"; regiao: string; rotulo: string; retorno: string; cor?: string }
  | { tipo: "toqueCirculo"; regiao: string };
export type Flutuacao = {
  amp: number; freq: number; fase: number; rzAmp?: number; rzFreq?: number; desligaSeRxMaior?: number;
  rzFase?: number; // fase do balanço em rz (acréscimo do K02; padrão 0)
};
/** troca de cor dentro da textura: os pixels com a matiz perto de `de` viram `para`, com a luz e o desgaste da
 *  textura (razão de luminância contra `de`) (acréscimo da frente modelos no render, 03/10) */
export type TrocaMatiz = { de: string; para: string; tolerancia?: number; satMin?: number };
/** ajuste de um material do GLB, pelo nome do material (render.materiais do catálogo; a cena pode somar os dela).
 *  Cores em hex sRGB; os números são os do MeshStandardMaterial do three (acréscimo da frente modelos no render) */
export type AjusteMaterial = {
  cor?: string; // multiplica a textura (sem textura, é a cor)
  rugosidade?: number; metalico?: number; envMap?: number; // roughness, metalness, envMapIntensity
  opacidade?: number; transparente?: boolean; transmissao?: number; // transmissao 0 desliga a refração do glTF
  semMapa?: boolean; // tira a textura de cor (o vidro da lâmpada usa a textura do corpo e sai preto)
  semLuz?: boolean; // MeshBasicMaterial com a mesma textura, sem tone mapping: a cor exata da textura
  emissivo?: string; intensidadeEmissiva?: number;
  dupla?: boolean; // desenha as duas faces
  normaisSuaves?: boolean; // junta os vértices e recalcula as normais das malhas deste material
  matiz?: TrocaMatiz[];
};
export type ObjetoProps = {
  id: string; modelo: string;
  tipo: "aparelho" | "relogio" | "folha" | "pilula" | "comprovante" | "glb" | string;
  arquivo?: string; // caminho no public-kit
  rotacaoBase?: [number, number, number]; escala?: number;
  // deslocamento do modelo dentro do rig, em metros, depois da rotacaoBase e da escala (render.pivo do catálogo:
  // "centro" põe o centro da caixa na origem do rig; a pose gira e escala em volta dele) (acréscimo da frente modelos)
  pivo?: [number, number, number];
  materiais?: Record<string, AjusteMaterial>; // render.materiais do catálogo + materiais da cena (acréscimo da frente modelos)
  malhaTela?: string; telaPx?: [number, number]; flipY?: boolean;
  telaPlano?: { largura: number; altura: number; frente: number };
  vidro?: { largura: number; altura: number; raio: number; z: number };
  texturaMalha?: { malha: string; pintor: string; canvas: [number, number]; flipY?: boolean; params?: Record<string, unknown> };
  caixa?: { min: [number, number, number]; max: [number, number, number] }; // em metros, já com rotacaoBase e escala
  pose: Obj; sombra: number; telaInicial?: string;
  mostrador?: { hora: string; app: string; quando: string; linhas: string[] };
  conteudo?: Record<string, unknown>; // dados do pintor (folha DAS, comprovante, pílula)
  cores?: Record<string, string>;
  flutuacao?: Flutuacao;
  credito?: string | null; // trecho de legenda (creditoLegenda), nunca o título com marca
  render?: Record<string, unknown>; // bloco `render` inteiro do catálogo (plano, forma, material...) (acréscimo do K02)
};
export type CamadaProps = { id: string; tipo: string; estado: Record<string, number>; [k: string]: unknown };
export type ExtraSom = Omit<SomDef, "em" | "desloc"> & { t: Tempo };
/** prova de colisão (kit.py colisao; acréscimo de 05/10): o bloco "colisao" da cena, que o RM/src/kit/cli/colisao.mjs
 *  passa pro render em props.prova.colisao */
export type ConfColisao = {
  tolerancia?: number; // metros: até aqui é encostar, não colidir (padrão 0,0006)
  permitidos?: Array<[string, string]>; // pares de corpos que podem se encostar e se cruzar (ids de corpo)
  faixaLegenda?: boolean; // padrão true: corpo 3D na faixa da legenda, com a legenda na tela, conta
  faixaFecho?: boolean; // padrão true: corpo 3D atrás do fecho (logo e pílula do link), com eles na tela, conta
  // toque aparente: corpos que se cobrem na tela sem se tocar em 3D, com folga na linha de visão abaixo deste valor
  // (metros), contam; false desliga a medida (o kit.py colisao tem o padrão, 0,04)
  aparente?: number | false;
};
/** modos de prova do render (acréscimo de 05/10): sem `prova`, o quadro sai igual, pixel a pixel */
export type ProvaKit = { colisao?: boolean | ConfColisao };
export type PropsKit = {
  versao: 1; peca: string; titulo: string; publicDir: string;
  fps: number; largura: number; altura: number; duracao: number; quadros: number; tFecho: number | null;
  narracao: Narracao;
  voz: { arquivo: string; fecho: "embutido" | "asset"; final: string | null };
  legenda: { top: number; altura: number; tamanho: number; modo: "light" | "dark" | "coral" | "video"; esquerda?: number; largura?: number };
  camera: CamSt;
  ambiente: {
    deriva: boolean; flutuacao: boolean; poeira: number; periodico: boolean;
    varredura: { x: number; z: number; largura: number; altura: number; intensidade: number; yDe: number; yAte: number };
  };
  objetos: ObjetoProps[]; // a ordem é a ordem de criação na cena 3D
  telas: Record<string, { arquivo: string; extras: ExtraTela[]; conjunto?: string }>;
  regioes: Record<string, Regiao>;
  camadas: CamadaProps[];
  batidas: Array<{ id: string; params: Record<string, unknown> }>; // como na cena, sem resolver
  sons: {
    perfil: "v2" | "enxuto"; modoRuido: "legado" | "por-evento";
    extras: ExtraSom[]; remover: string[];
  };
  fecho: null | {
    asset: string; aiAcende: number;
    layout: { top: number; altura: number; gap: number; tamanhoVai: number; larguraLogo: number; logoBase: string; logoAcesa: string };
    link: { texto: string; cor: string; top: number; tamanho: number };
  };
  trilha: {
    id: string; mStart: number; ganhoDb: number | "auto"; transporVerificado: number; status: string; decisaoRisco: string | null;
    // acréscimos do K02 (copiados da cena pro mix): automação, abaixamento e fades
    automacao?: Array<[number, number]>; abaixamento?: number; fadeIn?: number; fadeOut?: number;
    momento?: number; ponto?: string;
  };
  /** "ME", "MEI" ou "todos" ("ambos" é o nome antigo de "todos"); null quando a cena não declarou (o montaProps recusa) */
  fatos: { publico: "ME" | "MEI" | "todos" | "ambos" | null; exemplos: Array<{ texto: string; origem: string }> };
  capa: null | { quadro: number | "auto"; titulo: string; destaque?: string };
  creditos: string[]; // trechos de licenca.creditoLegenda dos modelos usados
  creditoLegenda: string | null; // texto pronto pra legenda (regra da seção 4.9)
  avisos: string[]; // avisos do montaProps, copiados pro relatório
  marcas?: Record<string, number>; // "marcas" da cena, pro Tempo {marca} (acréscimo do K02)
  dataPost?: string; // (acréscimo do K02)
  prova?: ProvaKit; // só o kit.py colisao passa (acréscimo de 05/10); o montaProps nunca grava
};

// ---------- cena (entrada do montaProps; o esquema formal é do K01) ----------
export type CenaObjeto = {
  id: string; modelo: string; tipo?: string; pose?: Partial<Obj>; telaInicial?: string;
  mostrador?: ObjetoProps["mostrador"]; conteudo?: Record<string, unknown>; sombra?: number;
  flutuacao?: Flutuacao; cores?: Record<string, string>;
  materiais?: Record<string, AjusteMaterial>; // somados aos render.materiais do catálogo (a cena vence campo a campo)
};
export type Cena = {
  versao: 1; peca: string; titulo: string; dataPost?: string;
  fps?: number; largura?: number; altura?: number;
  duracao?: number | "auto"; tFecho?: number | "auto" | null;
  narracao?: string; voz?: Partial<PropsKit["voz"]>;
  trilha: {
    id: string; momento?: Tempo; ponto?: string; mStart?: number; ganhoDb?: number | "auto";
    automacao?: Array<[number, number]>; abaixamento?: number; fadeIn?: number; fadeOut?: number; decisaoRisco?: string | null;
  };
  legenda?: Partial<PropsKit["legenda"]>;
  camera?: Partial<CamSt>;
  ambiente?: Partial<Omit<PropsKit["ambiente"], "varredura">> & { varredura?: Partial<PropsKit["ambiente"]["varredura"]> };
  objetos?: CenaObjeto[];
  telas?: Record<string, { arquivo: string; extras?: ExtraTela[]; conjunto?: string }>;
  regioes?: Record<string, Regiao> | string;
  camadas?: CamadaProps[];
  marcas?: Record<string, number>;
  batidas?: Array<{ id: string; params?: Record<string, unknown> }>;
  fecho?: null | { asset?: string; link?: Partial<NonNullable<PropsKit["fecho"]>["link"]>; layout?: Partial<NonNullable<PropsKit["fecho"]>["layout"]> };
  sons?: Partial<PropsKit["sons"]>;
  /** público obrigatório (F063 por padrão, rodada 4): "MEI", "todos" e vazio são conferidos como MEI */
  fatos?: { publico?: "ME" | "MEI" | "todos" | "ambos" | "" | null; exemplos?: Array<{ texto: string; origem: string }> };
  capa?: null | { quadro: number | "auto"; titulo: string; destaque?: string };
  publicDir?: string;
  notas?: string;
  /** só o kit.py colisao lê (o montaProps ignora): tolerância, pares permitidos e as faixas (acréscimo de 05/10) */
  colisao?: ConfColisao;
};
