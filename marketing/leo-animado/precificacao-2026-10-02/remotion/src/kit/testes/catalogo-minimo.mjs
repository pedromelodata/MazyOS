// Catálogo mínimo em memória (dono K02), no formato que o montaProps aceita (listas por tipo, item com id).
// Só pros testes quando o "catalogo.py exporta" do K01 ainda não existe: os modelos de vídeo, os procedurais
// (folha DAS, pílula "dia 20", comprovante), a Talent in the Air, a House One e os efeitos da seção 6.
// Dados tirados do KIT/DESENHO.md (seções 4.9 e 6 e Anexo A). As caixas do iPhone e do relógio são aproximadas
// (medidas do Anexo A, centradas); a caixa medida do GLB é do K01 (bbox_glb.py).

const PI = Math.PI;

const sint = (nome, origem = "PR/src/sfx.py") => ({
  id: `sint-${nome}`,
  tipo: "sintetizado",
  status: "liberado",
  licenca: { nome: "código próprio (numpy), sem licença de terceiro" },
  arquivo: { modulo: origem, funcao: nome },
});

const arquivoSfx = (id, status, licenca) => ({ id, tipo: "arquivo", status, licenca: { nome: licenca } });

// decisões de risco no formato estruturado (catalogos/LEIA-ME.md, seção Status), como nas sobreposições revisao-travas
const DECISAO_TALENT = {
  quem: "Pedro",
  quando: "2026-10-02",
  pecas: ["guia-pronta-2026-10-14"],
  texto: "trilha da V2 escolhida mesmo relançada por terceiro com ISRC próprio; só na peça de 14/10",
};
const DECISAO_V4 = (oque) => ({
  quem: "orquestrador do kit (DESENHO, revisão 2)",
  quando: "2026-10-02",
  pecas: ["guia-pronta-2026-10-14"],
  texto: `${oque} do V4 do reel de 14/10, entregue ao Pedro: desenho reconhecível sem logo; nunca citar a marca`,
});
const PENDENTE = { quem: "Pedro", quando: null, pecas: [], pendente: true, pergunta: "usar o crédito que cita marca?", texto: "fora do padrão até o Pedro decidir" };

export function catalogoMinimo() {
  return {
    versao: 1,
    origem: "catálogo mínimo em memória do K02 (testes); o oficial é o catalogo.py exporta do K01",
    trilhas: [
      {
        id: "mixkit-01-talent-in-the-air",
        titulo: "Talent in the Air",
        status: "aceito-com-risco",
        tom: { texto: "incerto (lá bemol maior, 0,67)", transporVerificado: 0 },
        pontos: [{ id: "volta-15.748", t: 15.748, tipo: "volta", desc: "janela B: volta no tempo 1 com mStart 5,448" }],
        decisaoRisco: DECISAO_TALENT,
      },
      { id: "pixabay-03-summer-fashion", tipo: "trilha", status: "sem-verificacao", tom: { transporVerificado: 0 }, pontos: [] },
      { id: "previa-mixkit-04-house-one", tipo: "previa", previaDe: "mixkit-04-house-one", status: "liberado", tom: { transporVerificado: 0 }, pontos: [] },
      {
        id: "mixkit-04-house-one",
        titulo: "House One",
        status: "liberado",
        tom: { texto: "janela em dó# menor (0,79): o 2867 sobe 1 semitom", transporVerificado: 1 },
        pontos: [{ id: "volta-62.011", t: 62.011, tipo: "volta", desc: "a banda volta no tempo 1 (mStart 51,711 + 10,30)" }],
      },
      {
        id: "mixkit-05-lets-move",
        titulo: "Let's Move",
        status: "liberado",
        tom: { transporVerificado: 0 },
        pontos: [{ id: "drop-16.035", t: 16.035, tipo: "drop" }],
      },
      { id: "epidemic-palmy-sway", status: "reprovado", tom: { transporVerificado: 0 }, pontos: [] },
      { id: "epidemic-brand-new-beginning", status: "reprovado", tom: { transporVerificado: 0 }, pontos: [] },
    ],
    efeitos: [
      sint("s_whoosh"),
      sint("s_swish"),
      sint("s_chime"),
      sint("s_tick"),
      sint("s_pop"),
      sint("s_bubble"),
      sint("s_check"),
      sint("s_riser"),
      sint("s_thump"),
      sint("s_burst"),
      sint("s_clack"),
      sint("s_papel", "GP/mix_guia.py"),
      sint("s_vibra", "GP/mix_guia.py"),
      sint("s_brilho", "GP/mix_guia.py"),
      sint("s_conta", "GP/mix_guia.py"),
      sint("s_processa", "GP/mix_guia.py"),
      arquivoSfx("pixabay-405445", "sem-verificacao", "Pixabay Content License"),
      arquivoSfx("pixabay-197886", "sem-verificacao", "Pixabay Content License"),
      arquivoSfx("pixabay-186577", "sem-verificacao", "Pixabay Content License"),
      arquivoSfx("pixabay-570438", "sem-verificacao", "Pixabay Content License"),
      arquivoSfx("pixabay-316482", "sem-verificacao", "Pixabay Content License"),
      arquivoSfx("mixkit-166", "sem-verificacao", "Mixkit Sound Effects Free License"),
      arquivoSfx("mixkit-1897", "sem-verificacao", "Mixkit Sound Effects Free License"),
      arquivoSfx("mixkit-1109", "sem-verificacao", "Mixkit Sound Effects Free License"),
      arquivoSfx("mixkit-2867", "liberado", "Mixkit Sound Effects Free License"),
      arquivoSfx("mixkit-2568", "liberado", "Mixkit Sound Effects Free License"),
      arquivoSfx("mixkit-1490", "liberado", "Mixkit Sound Effects Free License"),
    ],
    modelos: [
      {
        id: "glb-video-iphone",
        tipo: "glb",
        status: "aceito-com-risco",
        decisaoRisco: DECISAO_V4("celular"),
        licenca: {
          nome: "CC BY 4.0",
          creditoObrigatorio: true,
          credito: "'Apple iPhone 15 Pro Max Black' por polyman Studio (Sketchfab, CC BY 4.0), modificado",
          creditoLegenda: { trecho: "celular por polyman Studio", fonte: "Sketchfab", licenca: "CC BY 4.0" },
        },
        escala: 1,
        caixa: { min: [-0.03885, -0.07975, -0.00615], max: [0.03885, 0.07975, 0.00615], aproximada: true },
        render: {
          publicKit: "3d/iphone.glb",
          tipoObjeto: "aparelho",
          rotacaoBase: [0, PI, 0],
          malhaTela: "Tela",
          telaPx: [1290, 2796],
          flipY: true,
          telaPlano: { largura: 0.0713, altura: 0.154, frente: 0.0064 },
          vidro: { largura: 0.0748, altura: 0.1575, raio: 0.0105, z: 0.0073 },
          sombra: 0.85,
        },
      },
      {
        id: "glb-video-watch",
        tipo: "glb",
        status: "aceito-com-risco",
        decisaoRisco: DECISAO_V4("relógio"),
        licenca: {
          nome: "CC BY 4.0",
          creditoObrigatorio: true,
          credito: "Modelo 'Apple Watch Ultra Orange' por alboxer2000_ (Sketchfab, CC BY 4.0), modificado",
          creditoLegenda: { trecho: "relógio por alboxer2000_", fonte: "Sketchfab", licenca: "CC BY 4.0" },
        },
        escala: 1,
        caixa: { min: [-0.0221, -0.0377, -0.0389], max: [0.0221, 0.0377, 0.0389], aproximada: true },
        render: { publicKit: "3d/watch.glb", tipoObjeto: "relogio", rotacaoBase: [0, 0, 0], malhaTela: "Tela", telaPx: [420, 512], flipY: true, sombra: 0.7 },
      },
      {
        id: "glb-carteira",
        tipo: "glb",
        status: "aceito-com-risco",
        decisaoRisco: PENDENTE,
        notaLicenca: "o crédito exigido pela CC BY 3.0 cita marca",
        licenca: { nome: "CC BY 3.0", creditoObrigatorio: true, credito: "crédito com marca (só no catálogo)", creditoLegenda: null },
        render: { tipoObjeto: "glb", escala: 1 },
      },
      {
        id: "proc-folha-das",
        tipo: "procedural",
        status: "liberado",
        licenca: { nome: "próprio", creditoLegenda: null },
        render: {
          tipoObjeto: "folha",
          plano: { largura: 0.068, altura: 0.096, segmentos: [12, 16], curva: -6, ondula: 0.004, freqOndula: 40 },
          canvas: [720, 1016],
          material: { cor: "#EEE7DD", rugosidade: 1, envMap: 0.45 },
          sombraRet: { x: 0.004, y: -0.007, z: -0.014, opacidade: 0.42 },
          sombra: 0.45,
        },
      },
      {
        id: "proc-pilula-dia20",
        tipo: "procedural",
        status: "liberado",
        licenca: { nome: "próprio", creditoLegenda: null },
        render: {
          tipoObjeto: "pilula",
          forma: { largura: 0.064, altura: 0.026, profundidade: 0.006, bisel: 0.0016, segmentosBisel: 4, segmentosCurva: 24 },
          material: { cor: "#D9481F", rugosidade: 0.42, clearcoat: 0.35, clearcoatRugosidade: 0.3, envMap: 0.6 },
          etiqueta: { texto: "dia 20", fonte: "800 150px Sora", cor: "#FFFFFF", canvas: [640, 256], fracaoLargura: 0.86, z: 0.0048 },
          flutuacao: { amp: 0.0014, freq: 2.6, fase: 0.5 },
          sombra: 0.5,
        },
      },
      {
        id: "proc-comprovante",
        tipo: "procedural",
        status: "liberado",
        licenca: { nome: "próprio", creditoLegenda: null },
        render: {
          tipoObjeto: "comprovante",
          plano: { largura: 0.06, altura: 0.11, segmentos: [10, 18], curva: -4, ondula: 0.003, freqOndula: 36 },
          canvas: [660, 1210],
          material: { cor: "#F7F4EF", rugosidade: 1, envMap: 0.45 },
          sombraRet: { x: 0.004, y: -0.007, z: -0.014, opacidade: 0.4 },
          sombra: 0.45,
        },
      },
      // o palco de argila da extensão comum (rodada 4: o cartão do imposto dele entra na trava do F063)
      { id: "proc-palco-argila", tipo: "procedural", status: "liberado", licenca: { nome: "próprio", creditoLegenda: null }, render: { tipoObjeto: "palco-argila" } },
    ],
    telas: [
      { id: "montada-tela-splash", tipo: "montada", status: "liberado", servePecaMei: true, conjunto: "2026-10-02", arquivo: "GP/assets/telas/tela-splash.png", fundo: "#FFFFFF" },
      { id: "montada-tela-inicio", tipo: "montada", status: "liberado", servePecaMei: false, conjunto: "2026-10-02", arquivo: "GP/assets/telas/tela-inicio.png", fundo: "#FFFFFF" },
      { id: "montada-tela-inicio-pagar", tipo: "montada", status: "liberado", servePecaMei: false, conjunto: "2026-10-02", arquivo: "GP/assets/telas/tela-inicio-pagar.png", fundo: "#FFFFFF" },
      { id: "montada-tela-imposto", tipo: "montada", status: "liberado", servePecaMei: false, conjunto: "2026-10-02", arquivo: "GP/assets/telas/tela-imposto.png", fundo: "#FFFFFF" },
      { id: "tela0210-splash", tipo: "captura", status: "liberado", servePecaMei: true, conjunto: "2026-10-02", arquivo: "TELAS0210/splash.png", resumo: "logo negativa sobre o coral" },
      { id: "tela0210-painel", tipo: "captura", status: "reprovado", servePecaMei: false, conjunto: "2026-10-02", arquivo: "TELAS0210/painel.png", resumo: "404: página de erro" },
      // captura aceita com risco por decisão de agente com '*' (rodada 4: não vale pra peça nova, vira aviso)
      {
        id: "tela0210-welcome", tipo: "captura", status: "aceito-com-risco", servePecaMei: true, conjunto: "2026-10-02", arquivo: "TELAS0210/welcome.png",
        decisaoRisco: { quem: "K13 (revisão por regra das telas de 02/10, sem o Pedro)", quando: "2026-10-02", pecas: ["*"], texto: "vale com os cortes do item" },
      },
    ],
  };
}
