// Fila pesada do servidor (Métricas, 30/09/2026; SPEC-METRICAS.md §3.3.3): uma rodada pesada por vez no
// servidor inteiro. Pesada = baixar vídeo ou imagens, tirar quadros, transcrever e rodar a IA: a análise
// "Por que esse reel funcionou" (analise.mjs) e as etiquetas da IA (mecanismos.mjs) dividem a mesma vaga,
// porque download, whisper e a IA pesam na máquina e no disco. Decisões:
//  - uma vaga só, seja qual for o nome: dois nomes diferentes nunca rodam juntos
//  - não é reentrante: o mesmo dono pedindo de novo recebe false (dois jobs iguais não correm juntos)
//  - liberar com o dono confere o dono (quem não reservou não solta a vaga de outro); sem o dono, solta
//    a vaga daquele nome
//  - só memória: reiniciar o servidor solta a vaga (os jobs morrem junto)

let vaga = null; // { nome, dono, desde }

// true: a vaga é sua (libere no finally); false: tem outra rodada pesada no servidor
export function reservar(nome = 'pesada', dono = null) {
  if (vaga) return false;
  vaga = { nome: String(nome ?? 'pesada'), dono: dono == null ? null : String(dono), desde: new Date().toISOString() };
  return true;
}

// true quando soltou
export function liberar(nome = null, dono) {
  if (!vaga) return false;
  if (nome != null && vaga.nome !== String(nome)) return false;
  if (dono !== undefined && vaga.dono !== (dono == null ? null : String(dono))) return false;
  vaga = null;
  return true;
}

// o nome da vaga ocupada, ou null
export const ocupada = () => vaga?.nome ?? null;

// quem está com a vaga ({ nome, dono, desde }), ou null: pra tela dizer o que está rodando
export const atual = () => (vaga ? { ...vaga } : null);
