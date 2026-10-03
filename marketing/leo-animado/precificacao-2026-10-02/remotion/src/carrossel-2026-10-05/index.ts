// Entry próprio do carrossel de 05/10 (Contabilidade tradicional vs Legalizaí).
// Não importa o Root.tsx nem o kit: outra frente edita o Root, e o ext.ts do kit usa require.context.
import { registerRoot } from "remotion";
import { Raiz } from "./Raiz";

registerRoot(Raiz);
