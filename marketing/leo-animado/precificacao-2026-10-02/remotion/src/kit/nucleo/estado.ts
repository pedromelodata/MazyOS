// Estado inicial da cena (contrato: KIT/DESENHO.md, seção 4.2; dono K02).
// Tudo que a timeline anima mora aqui; o render só LÊ depois do seek do quadro.
import type { Estado, Obj, ObjSt, PropsKit, TelaSt } from "./tipos";

export const POSE_PADRAO: Obj = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 1 };

/** canais numéricos da tela que começam em 0 */
export const CANAIS_TELA = ["brilhoCard", "conta", "calc", "toque", "toqueBotao", "pulso", "verif", "anel"];

/** retorno real do app ao copiar o código (impostos/pagar/page.tsx:255) */
export const RETORNO_PADRAO = "Código copiado";

export function poseCompleta(p?: Partial<Obj>): Obj {
  return { ...POSE_PADRAO, ...(p || {}) };
}

/** a mesma ordem de campos do novaTela() do guia */
export function novaTelaKit(inicial: string, verifTexto: string): TelaSt {
  return {
    a: inicial, b: inicial, p: 0, modo: 0, luz: 1,
    brilhoCard: 0, conta: 0, calc: 0, toque: 0, toqueBotao: 0, pulso: 0, verif: 0, anel: 0,
    verifTexto,
  };
}

/** retorno do primeiro extra "botao" das telas da peça (ou "Código copiado") */
export function retornoDoBotao(props: PropsKit): string {
  for (const chave of Object.keys(props.telas || {})) {
    for (const ex of props.telas[chave].extras || []) {
      if (ex.tipo === "botao" && typeof ex.retorno === "string" && ex.retorno) return ex.retorno;
    }
  }
  return RETORNO_PADRAO;
}

export function novoEstado(props: PropsKit): Estado {
  const verifTexto = retornoDoBotao(props);
  const st: Estado = {
    cam: { ...props.camera },
    obj: {},
    telas: {},
    mostradores: {},
    luz: { varre: 0, quente: 0 },
    ui: { assina: 0, ai: 0, link: 0 },
    canais: {},
  };
  for (const o of props.objetos) {
    const pose: ObjSt = { ...poseCompleta(o.pose), buzz: 0 };
    st.obj[o.id] = pose;
    if (o.tipo === "aparelho") st.telas[o.id] = novaTelaKit(o.telaInicial || "apagada", verifTexto);
    if (o.tipo === "relogio") st.mostradores[o.id] = { notif: 0, luz: 1 };
  }
  for (const c of props.camadas || []) {
    st.canais[c.id] = { ...(c.estado || {}) };
  }
  return st;
}
