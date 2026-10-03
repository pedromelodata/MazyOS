// Metadados do KitMotion pelas props (dono K06; contrato: KIT/DESENHO.md, seção 1, item 2): a duração, o fps
// e o tamanho vêm de props.json (calculateMetadata). As props padrão são as do guia (props-guia.json, geradas
// com node RM/src/kit/testes/props-guia.mjs cenas.json <saida>, do K02).
import type { CalculateMetadataFunction } from "remotion";
import type { PropsKit } from "../nucleo/tipos";
import propsGuia from "./props-guia.json";

export const PROPS_GUIA = propsGuia as unknown as PropsKit;

export const calculaMetadadosKit: CalculateMetadataFunction<PropsKit> = ({ props }) => {
  const fps = props.fps || 30;
  const quadros = typeof props.quadros === "number" && props.quadros > 0 ? props.quadros : Math.round(props.duracao * fps);
  return {
    durationInFrames: Math.max(1, quadros),
    fps,
    width: props.largura || 1080,
    height: props.altura || 1920,
  };
};
