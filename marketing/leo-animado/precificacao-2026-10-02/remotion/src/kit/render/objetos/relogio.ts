// Objeto "relogio" (dono K06): o relógio GLB com o mostrador pintado pelo PintorRelogioKit, montado como o
// watchRig do src/guia/Cena3D.tsx. Os dois anéis de vibração do original ficam no rig, sempre invisíveis (no
// guia o "ondas" nunca anima): eles entram na caixa que dimensiona a sombra de contato, e sem eles a sombra do
// relógio sairia menor que a do original.
import * as THREE from "three";
import { findMesh } from "../carrega";
import { PintorRelogioKit } from "../pintores/relogio";
import type { FabricaObjeto } from "../tipos-render";
import { aplicaBase } from "./aparelho";

/** ícone do app no cartão de notificação */
export const ICONE_RELOGIO_PADRAO = "marca/simbolo.svg";

const iconeDe = (o: { mostrador?: unknown }) => {
  const m = o.mostrador as { icone?: string } | undefined;
  return m && typeof m.icone === "string" ? m.icone : ICONE_RELOGIO_PADRAO;
};

export const fabricaRelogio: FabricaObjeto = {
  arquivos(o) {
    return { glb: o.arquivo ? [o.arquivo] : [], imagens: [iconeDe(o)] };
  },
  cria({ objeto: o, recursos }) {
    if (!o.arquivo) throw new Error(`relógio ${o.id}: falta o arquivo do GLB (render.publicKit do catálogo)`);
    const relogio = new PintorRelogioKit(recursos.imagem(iconeDe(o)), o.mostrador, o.telaPx || [420, 512], o.flipY !== false);
    const watch = recursos.glb(o.arquivo).clone(true);
    aplicaBase(watch, o);
    const tw = findMesh(watch, o.malhaTela || "Tela");
    if (tw) tw.material = new THREE.MeshBasicMaterial({ map: relogio.tex, toneMapped: false });
    else console.warn("KIT_AVISO", `relógio ${o.id}: malha "${o.malhaTela || "Tela"}" não achada; o mostrador não é pintado`);
    const rig = new THREE.Group();
    rig.add(watch);
    // anéis de vibração em volta do mostrador (no plano da tela do relógio), invisíveis
    for (let i = 0; i < 2; i++) {
      const a = new THREE.Mesh(new THREE.RingGeometry(0.0255, 0.0263, 64), new THREE.MeshBasicMaterial({ color: "#F2643C", transparent: true, depthWrite: false, toneMapped: false }));
      a.position.set(0, 0.019, 0.03);
      a.rotation.x = -0.6;
      a.visible = false;
      rig.add(a);
    }
    return {
      raiz: rig,
      sombra: o.sombra,
      pinta(st, t) {
        const ms = st.mostradores[o.id];
        if (ms) relogio.pinta(ms, t);
      },
    };
  },
};
