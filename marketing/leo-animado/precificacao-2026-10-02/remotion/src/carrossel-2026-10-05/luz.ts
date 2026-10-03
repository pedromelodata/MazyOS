// Luz do palco (a mesma em todas as telas). Fica num lugar só pra o render de teste poder variar por inputProps.
// Revisão v3: a luz herdada do reel da guia (chave 1,4, ambiente 1,1, exposição 1,0) estourava a argila: o papel
// saía branco chapado (L* 98, sem o fio das folhas) e a argila frio-500 saía quase branca (L* 89).
export type Luz = {
  exposicao: number; // toneMappingExposure (só pros materiais com tone mapping; fundo, telas e texto não mudam)
  ambiente: number; // scene.environmentIntensity (RoomEnvironment)
  chave: number; // direcional quente de cima, da esquerda e da frente
  recorte: number; // direcional de trás e da direita
  hemisferio: number;
};

// Calibrada no teste de 02/10 (telas 1 e 2 em 4 variantes): argila frio-500 em L* 62 a 65, papel em L* 93 com o
// fio das folhas à vista, mais contraste entre a face iluminada e a de sombra. Fundo, telas e texto não mudam.
export const LUZ_PADRAO: Luz = { exposicao: 0.78, ambiente: 0.6, chave: 1.45, recorte: 1.25, hemisferio: 0.32 };
