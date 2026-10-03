// Extensão "tradicional-vs-legalizai" do kit de motion: a configuração do palco do reel de 05/10/2026
// ("Contabilidade tradicional vs Legalizaí", a versão animada do carrossel do mesmo dia). Puro: sem React, sem DOM e
// sem Remotion (o Node das props, dos eventos e do qc também empacota este arquivo).
//
// Desde 03/10 o código do palco, das peças de argila e das 22 batidas fica na extensão comum do kit
// (RM/src/kit/ext/comum/): esta extensão só registra o tipo de palco da peça, "palco-tvl", com as peças, as poses e
// as medidas dela. A cena da peça não muda (o objeto "palco" segue com "tipo": "palco-tvl" e as batidas com os mesmos
// ids), e o render sai igual (provas em KIT/pecas/2026-10-05-tradicional-vs-legalizai/provas/kit-comum/).
import { CAM_REPOUSO, FILEIRA_PADRAO, VITRINE_PADRAO, registraPalco, type PecaDef } from "../comum/palco/modelo";

/** tipo do objeto palco da cena da peça */
export const TIPO_PALCO_TVL = "palco-tvl";

/** a cena da peça: as peças de argila nas poses do carrossel, os cartões e as placas com o pouso em px da câmera
 *  de repouso. A cena pode trocar qualquer número por conteudo.pecas.<id> (mescla rasa). */
export const PECAS_TVL: Record<string, PecaDef> = {
  // Tradicional (argila fria); conjunto da capa no quadro 0. O formulário de cima da pilhaA recebe a marca do
  // carimbo e voa pra dentro da pastaA na "ida ao escritório" (opcoes.voaPara).
  pilhaA: { tipo: "pilha", lado: "frio", x: -0.066, y: 0, z: -0.012, rx: 0, ry: 0.12, rz: 0, s: 1, altura: 0.056, visivel: true, opcoes: { macos: [0.013, 0.012, 0.014, 0.012], semente: 11, voaPara: "pastaA", marca: true } },
  carimbo: { tipo: "carimbo", lado: "frio", pai: "pilhaA", x: 0.006, y: 0, z: 0.004, rx: 0, ry: 0.13, rz: 0, s: 1, altura: 0.13, visivel: true },
  despP: { tipo: "despertador", lado: "frio", x: -0.035, y: 0, z: 0.042, rx: 0, ry: 0.35, rz: 0, s: 1, altura: 0.066, visivel: true, opcoes: { tamanho: 0.062 } },
  // a pasta da "ida ao escritório" entra atrás da pilha, já aberta (frente inclinada); com o carimbo fora, a
  // folha carimbada voa pra dentro dela, a frente fecha girando e ela sai pela parede da esquerda
  pastaA: { tipo: "pasta", lado: "frio", x: -0.074, y: 0, z: -0.074, rx: -0.05, ry: 0.16, rz: 0, s: 0.85, altura: 0.11, visivel: false, opcoes: { folhas: 3, docFrente: false }, inicial: { abre: 1 } },
  despG: { tipo: "despertador", lado: "frio", x: -0.042, y: 0, z: 0.012, rx: 0, ry: 0.3, rz: 0, s: 1, altura: 0.095, visivel: false, opcoes: { tamanho: 0.09, segundos: true } },
  envelope: { tipo: "envelope", lado: "frio", x: -0.08, y: 0, z: -0.042, rx: 0, ry: 0.32, rz: -0.12, s: 1, altura: 0.11, visivel: false },
  pilhaB: { tipo: "pilha", lado: "frio", x: -0.068, y: 0, z: -0.006, rx: 0, ry: 0.1, rz: 0, s: 1, altura: 0.054, visivel: false, opcoes: { macos: [0.012, 0.013, 0.012, 0.012], semente: 3 } },
  // a lupa fica com o aro longe do vão (aro até uns x 460 na câmera de repouso); o pivô da troca é a ponta do cabo
  lupa: { tipo: "lupa", lado: "frio", x: -0.038, y: 0.0705, z: 0.02, rx: 0, ry: 0, rz: 0.24, s: 0.75, altura: 0.125, visivel: false, opcoes: { pivo: [0, -0.094, 0] } },
  pastaC: { tipo: "pasta", lado: "frio", x: -0.06, y: 0, z: -0.02, rx: 0, ry: 0.2, rz: 0, s: 1, altura: 0.135, visivel: false, opcoes: { folhas: 3, docFrente: true } },
  // Legalizaí: os cartões nascem com o recorte EXATO da vaga na tela (opcoes.regiao, em px da tela montada) e só
  // mudam durante o voo: crescem e, se pedirem, ficam compactos (opcoes.compacto: largura em px da tela, cortando
  // a sobra da direita). Pouso em px da câmera de repouso (opcoes.pouso {px, py, z, larguraPx}: o centro e a
  // largura do cartão já compacto).
  cartaoNasceu: {
    tipo: "cartao-app", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.12, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "homeDia1",
      regiao: { x: 72, y: 209, w: 1146, h: 637 },
      raio: 46,
      compacto: 1064,
      corCorpo: "#24262C",
      pouso: { px: 734, py: 1238, z: 0.06, larguraPx: 470 },
    },
  },
  cartaoImposto: {
    tipo: "cartao-imposto", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.12, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "inicio",
      regiao: { x: 72, y: 424, w: 1146, h: 486 },
      raio: 46,
      compacto: 648,
      corCorpo: "#FEF3EE",
      borda: "#F1D5C8",
      valorTexto: "R$ 178,31",
      valor: 178.31,
      rotulo: "Pagar agora",
      retorno: "Código copiado",
      corBotao: "#B83D1C",
      pouso: { px: 745, py: 1236, z: 0.06, larguraPx: 436 },
    },
  },
  // a linha "Contrato social" da tela de Documentos (a vaga tem os cantos de cima redondos e o divisor embaixo)
  cartaoContrato: {
    tipo: "cartao-app", lado: "quente", x: 0, y: 0, z: 0, rx: -0.16, ry: -0.1, rz: 0, s: 1, altura: 0, visivel: false,
    opcoes: {
      tela: "documentos",
      regiao: { x: 72, y: 813, w: 1146, h: 188 },
      raio: 46,
      raioBaixo: 0,
      compacto: 880,
      raioCompacto: 40,
      corCorpo: "#FFFFFF",
      borda: "#E6E1DA",
      bordaSo: "voo",
      pouso: { px: 752, py: 1084, z: 0.07, larguraPx: 470 },
    },
  },
  // fileira de quatro placas de papel creme, em leque: cada uma um pouco na frente da anterior
  placa1: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: 0.035, s: 1, altura: 0, visivel: false, opcoes: { ordem: 0 } },
  placa2: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: 0.012, s: 1, altura: 0, visivel: false, opcoes: { ordem: 1 } },
  placa3: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: -0.012, s: 1, altura: 0, visivel: false, opcoes: { ordem: 2, entregue: true } },
  placa4: { tipo: "placa", lado: "quente", x: 0, y: 0, z: 0, rx: -0.2, ry: -0.1, rz: -0.035, s: 1, altura: 0, visivel: false, opcoes: { ordem: 3 } },
  // moeda 1,5 vez maior (uns 170 px), pousando à esquerda e acima da fileira, sem tapar placa e longe de x 980;
  // sai da tela pela direita, por cima da fileira (origem em px da tela montada)
  moeda: { tipo: "moeda", lado: "quente", x: 0, y: 0, z: 0, rx: -0.16, ry: -0.18, rz: 0, s: 1.08, altura: 0, visivel: false, opcoes: { pouso: { px: 650, py: 1056, z: 0.075 }, origem: { u: 1010, v: 1400 } } },
  sino: { tipo: "sino", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0.3, s: 0.7, altura: 0, visivel: false, opcoes: { pouso: { px: 922, py: 800, z: 0.03 } } },
  faisca1: { tipo: "faisca", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, altura: 0, visivel: false, opcoes: { cor: "#F2643C", desloc: [0.02, 0.021, 0.012], tamanho: 0.014 } },
  faisca2: { tipo: "faisca", lado: "quente", x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, altura: 0, visivel: false, opcoes: { cor: "#F7A386", desloc: [-0.019, 0.023, 0.01], tamanho: 0.01 } },
};

/** o palco da peça: as peças acima, as vitrines e a fileira padrão do palco de argila e a câmera de repouso do
 *  carrossel (as mesmas medidas da peça) */
export const REGISTRADO = registraPalco(TIPO_PALCO_TVL, { pecas: PECAS_TVL, vitrine: VITRINE_PADRAO, fileira: FILEIRA_PADRAO, camRepouso: CAM_REPOUSO });
