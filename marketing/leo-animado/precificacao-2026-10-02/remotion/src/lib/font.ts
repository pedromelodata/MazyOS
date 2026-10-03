import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Sora variável (100 a 800), carregada uma vez só pra todas as composições
loadFont({ family: "Sora", url: staticFile("Sora-wght.ttf"), weight: "100 800" });
