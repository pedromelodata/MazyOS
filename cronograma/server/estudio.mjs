// Estúdio de design do Ateliê (22/10/2026, Pedro): "um editor tipo Canva básico dentro do sistema". O editor (front, aba
// Ateliê, área "Design") mexe em fundos, letras, cores, tamanhos, espaçamentos e posição dos elementos, tanto nas imagens
// que já existem (os Destaques "Comece por aqui", importados da base do repo) quanto nas novas geradas aqui pela IA, com o
// banco de assets (server/estudio-assets.mjs, outro construtor), e exporta no navegador de quem usa (PNG, JPG ou PDF: o
// VPS não tem Chromium nem Playwright). Este módulo é o servidor do resto:
//  - documentos (o design): CRUD com validação forte (zod), versão com 409, as 20 últimas versões guardadas, duplicar
//  - semeadura: cada estudio/base/docs/*.json do repo vira documento ('importado') uma vez só
//  - exportações: o arquivo exportado no navegador sobe cru, fica em data/estudio/exportacoes e, quando o design tem
//    peça (pecaId), vira arte da peça (reel.artes ou stories.artes, campo do servidor)
//  - geração por IA (POST /api/estudio/gerar): o design system, o catálogo de assets, as skills de carrossel e posts do
//    MazyOS, a estratégia (pilar x gatilho emocional x gatilho psicológico, bloco, motivo), o mecanismo da semana e a
//    repetição visual com os designs recentes; a saída é o documento, conferido (textos, colisão, área segura, assets)
//  - mecanismo visual (GET /api/estudio/mecanismo?docId=): a assinatura do design contra os das últimas 4 semanas
// Rotas (partes = o que vem depois de "estudio", já decodificado e com o perfil conferido pelo servidor):
//   GET    /api/estudio/docs[?pecaId=]                    -> { docs: [resumo com a capa] }
//   POST   /api/estudio/docs                              -> 201 o documento
//   GET    /api/estudio/docs/:id                          -> o documento
//   PUT    /api/estudio/docs/:id   { versao, ... }        -> o documento (versão diferente da gravada = 409)
//   DELETE /api/estudio/docs/:id                          -> { ok: true, lixeira: true } (vai pra lixeira)
//   POST   /api/estudio/docs/:id/duplicar                 -> 201 o documento novo
//   POST   /api/estudio/docs/:id/remontar { versao }      -> as páginas montadas de novo com o texto da peça ligada (versão nova)
//   POST   /api/estudio/da-peca   { pecaId }              -> 201 o documento montado da peça do cronograma (sem IA)
//   POST   /api/estudio/docs/:id/ajustar-ia { versao, pedido, pagina?, conversa? } -> o documento + ajuste { resposta,
//          avisos, paginas, custo, semMudanca? } (o chat da IA do editor: muda só o que o pedido diz, versão nova)
//   GET    /api/estudio/docs/:id/versoes                  -> { atual, versoes: [...] } (as 20 últimas)
//   POST   /api/estudio/docs/:id/versoes/:n/restaurar     -> o documento (a versão n vira a versão nova)
//   POST   /api/estudio/docs/:id/exportacoes              corpo CRU (PNG, JPEG ou PDF), x-pagina, x-formato -> 201
//   GET    /api/estudio/docs/:id/exportacoes              -> { exportacoes: [...] }
//   GET    /api/estudio/exportacoes/:id/arquivo[?baixar=1] -> o arquivo (nosniff, content-disposition com o nome)
//   POST   /api/estudio/gerar      { brief, formato, paginas, pecaId?, docId?, versao?, modeloId?, skill? } -> o documento + geracao (skill: o "Criar no Ateliê")
//   POST   /api/estudio/tarefas    (o corpo do gerar)     -> 202 { tarefa } (a mesma geração, em segundo plano)
//   GET    /api/estudio/tarefas                           -> { tarefas: [...] } (as de quem pede, até 30 min depois do fim)
//   GET    /api/estudio/tarefas/:id                       -> { tarefa: { id, estado: gerando|pronto|erro, segundos, docId, erro, ... } }
//   GET    /api/estudio/mecanismo?docId=                  -> { alertas: [{ regra, nivel, texto, parecidaCom? }] }
//   GET    /api/estudio/modelos                           -> { modelos: [documento + id, nome, descricao, tipo, fundo], janelas }
//   GET    /api/estudio/lixeira                           -> { docs: [{ id, titulo, formato, origem, apagadoEm, apagadoPor }] }
//   POST   /api/estudio/lixeira/:id/restaurar             -> o documento (volta como versão nova)
//   /api/estudio/assets...                                -> server/estudio-assets.mjs
// Decisões fora do contrato, anotadas aqui:
//  - documento em arquivo, não no db.json: data/estudio/docs/<id>.json, versões em data/estudio/versoes/<id>/<n>.json
//    (com um indice.json). Um design de 20 páginas com 80 camadas cada e as 20 versões dele incham o db.json, que é lido
//    e gravado inteiro a cada mudança do app
//  - o documento leva também fontes (ids do FATOS, como a peça), notas, duplicadoDe, origemArquivo (semente) e revisao
//    (a conferência de textos e de design de quando foi gravado, calculada pelo servidor). A resposta leva areaSegura
//  - unidades: alturaLinha é multiplicador do tamanho (1.2 = 120%) e espacamentoLetra é em em (0.22 = 0,22em), como no
//    design-guide. Valor grande (acima de 4 na altura, de 2 no espaçamento) a conferência lê como px
//  - DM Serif Display só tem o peso 400: o servidor grava 400 nela (o navegador engordaria a letra no falso negrito)
//  - cor: o editor aceita rgb(), rgba(), hsl(), #rgba e transparent (a sombra nasce com rgba); o servidor converte e
//    grava sempre #rrggbb ou #rrggbbaa. Título até 160 caracteres (o limite do editor)
//  - a conferência de colisão olha a tinta do texto (linha a linha, largura de cada letra da Sora calibrada nas caixas
//    medidas no navegador dos Destaques), não a caixa inteira: o ícone ao lado da linha curta não atravessa nada. Luz,
//    disco e textura (assets da categoria fundo) contam como fundo e partícula; o grifo pode ficar embaixo da palavra
//  - assetId que já estava no design e sumiu do banco segue valendo (a camada aparece vazia e a revisão avisa); asset
//    novo precisa existir
//  - PUT parcial: o que não veio fica como estava. Sem versao no corpo = 400
//  - exportação: PNG e JPG são uma página por arquivo ('todas' só no PDF, ou no design de 1 página). A arte nova da
//    mesma página e formato substitui a anterior na peça (a anterior sai do disco). Peça já postada não ganha arte.
//    Exportação sem peça: ficam as 10 mais recentes de cada design. Arte nova em peça aprovada vira 'alterado'; em
//    peça pendente que algum gerente já aprovou, volta pros gerentes (a regra do conferirMudancaAprovada, que compara
//    só os campos de texto)
//  - o Diretor contábil só abre a exportação que está anexada numa peça que ele vê (auth.diretorVe): o resto é 404
//  - gerar: uma geração por pessoa e no máximo 3 juntas; a IA refaz uma vez quando algo falha e o servidor fica com a
//    melhor das tentativas, depois corrige o que dá por código (afasta o que colide, traz pra área segura, aumenta a
//    caixa do texto que não cabe, tira visto escrito e barrinha antes de texto). Bloqueante de texto que sobrar fica
//    na revisão (o design grava e a tela mostra)
//  - semeadura na primeira chamada ao estúdio depois do boot (o server.mjs só ganha 2 linhas). Semente apagada pela
//    equipe não volta; semente que mudou no repo atualiza o design só se ninguém mexeu nele desde a importação
// 22/10 (Pedro): a rodada de correções da revisão do estúdio (achados de segurança, servidor e estratégia):
//  - tetos de trabalho: o texto quebra por letra quando a palavra não cabe (a linha leva pelo menos uma letra, como no
//    navegador), então uma camada tem no máximo uma linha por letra; a colisão varre as linhas pela altura (sem
//    comparar todas com todas); o design inteiro tem no máximo 30 mil letras; tamanho da letra até 1200 px, altura da
//    linha de 0,5 a 4 (multiplicador) e espaço entre letras de -0,5 a 2 em (a leitura como px saiu); corpo do POST e
//    do PUT até 2 MB; a revisão gravada guarda até 200 achados ("e mais N") e a versão guardada vai sem a revisão;
//    no máximo 2000 designs e 150 MB de designs, e espaço livre no disco antes de gravar (507)
//  - apagar manda pra lixeira (data/estudio/lixeira/<id>, com as versões), que guarda os 100 últimos:
//    GET /api/estudio/lixeira e POST /api/estudio/lixeira/:id/restaurar. Design que veio da base do repo (importado)
//    só a gestão (Admin ou Gerente de Marketing) apaga
//  - semeadura grava o registro a cada semente, dá à semente sem id o id fixo est_base_<arquivo> e adota o design que
//    já tem a mesma origem (queda no meio não duplica os Destaques)
//  - a lista de assets não tem mais cache (o upload entra no design na hora)
//  - bloqueante da conferência do Ateliê na copy: a IA não grava o design (422) e a exportação recusa (409) antes de
//    ler o arquivo; o salvar automático do editor segue gravando (a tela mostra o bloqueante)
//  - a arte reexportada da mesma versão do design (outra escala, outro formato) não mexe na aprovação: a arte guarda
//    versaoDoc. Arte nova no meio da aprovação anula a observação dos gerentes da rodada, como o texto. Exportação
//    anexada cuja peça sumiu, ou que saiu da peça, vira solta (entra no teto de 10) na faxina do boot e de cada
//    exportação; anexar é um de cada vez por peça
//  - fato só do FATOS.md: fonte com id que não existe, ou marcado NÃO USAR ou CONFLITO, e número (inclusive "81 mil",
//    "12 meses", "dia 10" e por extenso) sem fonte com id de fato viram problema na revisão. "Decisão do Pedro" (a data
//    do app) vale como fonte
//  - o gancho da capa é a camada de texto de maior letra da página 1 (não a primeira da lista); MEI e contador em
//    camadas diferentes da mesma página são conferidos juntos
//  - os bustos do Léo (tag "corte reto") podem ficar colados na borda de baixo da página: a única exceção da área
//    segura, só na base. O corrigirDesign cola na base em vez de subir o busto
//  - modelos (estudio/base/modelos/*.json, documentos com nome, descricao e tipo; GET /api/estudio/modelos): a
//    geração escolhe o modelo por código, como o gerador do Ateliê original (o código escolhe o combo, a IA escreve),
//    sem repetir o modelo dos 2 últimos designs nem a cor de fundo do último (janelas de 3 e de 2, como o
//    config-postagens do Ateliê), além do mecanismo visual que já existia
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { APP, carregar, salvar, falha, agora, novoId, arquivoDados, semTracos, conferirBloco, blocoDoPilar, dataValida } from './db.mjs';
import { conferir as conferirAtelie, GATILHOS_EMOCIONAIS, GATILHOS_PSICOLOGICOS } from './atelie.mjs';
import { analisarSemana, analiseParaIa, historicoParaIa, pecasDaCampanha, anguloCanonico, jaccard, PILARES_ATIVOS, PILARES_GUARDADOS, PILARES_ESTRATEGIA, ANGULOS_PILAR_8 } from './mecanismo.mjs';
import { consultarIa, iaConfigurada, MSG_SEM_IA, LISTA_PILARES } from './noticias.mjs';
import { blocoBaseContabil, PASTA_BASE as PASTA_BASE_CONTABIL } from './base-contabil.mjs';
import { diaBrasilia } from './estatistica.mjs';
import { RAIZ } from './importar.mjs';
import { servirArquivo, dentroDe } from './videos.mjs';
import { gravarCorpo, tipoPelosBytes, disco, ESPACO_MIN, nomeComExtensao } from './envios.mjs';
import { montarCarrossel, varianteDoCarrossel, tipoDoCarrossel, direcaoDoTipo, NOME_DO_TIPO } from './estudio-carrossel.mjs';
import { slidesComLista, paginasAbrindoListas } from './listas-carrossel.mjs';
import * as auth from './auth.mjs';

// ---------- pastas e limites ----------

export const PASTA_ESTUDIO = arquivoDados('estudio');
const PASTA_DOCS = path.join(PASTA_ESTUDIO, 'docs');
const PASTA_VERSOES = path.join(PASTA_ESTUDIO, 'versoes');
export const PASTA_EXPORTACOES = path.join(PASTA_ESTUDIO, 'exportacoes');
const ARQ_SEMEADOS = path.join(PASTA_ESTUDIO, 'semeados.json');
const PASTA_LIXEIRA = path.join(PASTA_ESTUDIO, 'lixeira');
// a base versionada no repo (catálogo, assets e documentos semente). CRONOGRAMA_ESTUDIO_BASE só pro teste
export const BASE_ESTUDIO = process.env.CRONOGRAMA_ESTUDIO_BASE ? path.resolve(process.env.CRONOGRAMA_ESTUDIO_BASE) : path.join(APP, 'estudio', 'base');
const PASTA_MODELOS = path.join(BASE_ESTUDIO, 'modelos');

export const FORMATOS = {
  stories: { nome: 'Stories 9:16', largura: 1080, altura: 1920, margem: { topo: 240, base: 360, esquerda: 96, direita: 96 } },
  feed45: { nome: 'Feed 4:5', largura: 1080, altura: 1350, margem: { topo: 72, base: 72, esquerda: 72, direita: 72 } },
  quadrado: { nome: 'Quadrado 1:1', largura: 1080, altura: 1080, margem: { topo: 72, base: 72, esquerda: 72, direita: 72 } },
  personalizado: { nome: 'Personalizado', largura: null, altura: null, margem: null },
};
export const IDS_FORMATO = Object.keys(FORMATOS);
export const LIM = {
  paginas: 20, camadas: 80, texto: 2000, titulo: 160, nome: 80, coord: 10000, motivo: 1000, gatilho: 100, fontes: 40, fonte: 1000, guias: 40,
  notas: 2000, versoes: 20, ladoMin: 64, ladoMax: 8000, brief: 4000, corpo: 2_000_000, artesPorPeca: 60, exportacoesSoltas: 10,
  // 22/10 (Pedro): tetos de trabalho e de memória (o servidor é um processo só e guarda os designs na memória)
  textoDoc: 30_000, tamanhoLetra: 1200, revisaoItens: 200, achadosPorRegra: 20, lixeira: 100,
};
// trocáveis no teste (80 MB de verdade não cabem num teste). designs e bytesDocs: o teto do banco de designs
export const limites = { exportacao: 80 * 1024 * 1024, designs: 2000, bytesDocs: 150 * 1024 * 1024 };
// o disco (trocável no teste): bytes livres na pasta do estúdio
export const discoEstudio = { livre: (pasta) => disco.livre(pasta) };
const TIMEOUT_IA = 6 * 60_000;
const DIAS_MECANISMO = 28;
const GERACOES_JUNTAS = 3;
const MSG_SEM_DOC = 'Esse design não existe mais.';
const MSG_SEM_EXPORTACAO = 'Essa exportação não existe mais.';
export const MSG_CONFLITO = 'Alguém mexeu neste design: recarregue';
const AUTOR_SEMENTE = 'Base do estúdio';
const ID_DOC = /^est_[A-Za-z0-9_-]{1,64}$/;
const ID_EXPORTACAO = /^exp_[A-Za-z0-9_-]{1,64}$/;
const ID_ASSET = /^ast_[A-Za-z0-9_-]{1,64}$/;
const ID_MODELO = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const ehDoc = (id) => ID_DOC.test(String(id ?? ''));
export const ehExportacao = (id) => ID_EXPORTACAO.test(String(id ?? ''));

// a paleta do design-guide (identidade/design-guide.md): o que sai dela vira alerta na revisão (nunca erro)
const PALETA = new Set([
  '#faf8f5', '#ffffff', '#f1eee9', '#15171c', '#1f2228', '#282b32', '#2a2e37', '#202433', '#f2643c', '#dd4e27', '#b83d1c', '#fef3ee',
  '#1b1e24', '#f4f1ec', '#524e48', '#bdb8b0', '#e3ded7', '#cbc5bc', '#2e313a', '#17a06a', '#f5a524', '#e03e43', '#000000',
]);
const VISTO_ESCRITO = /[\u2713\u2714\u2611\u2705\u{1F5F8}]/gu;
const TEM_VISTO = /[\u2713\u2714\u2611\u2705\u{1F5F8}]/u;

// ---------- textos ----------

const tem = (v) => Boolean(String(v ?? '').trim());
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const curto = (s, n) => (String(s ?? '').length > n ? `${String(s).slice(0, n - 3).trimEnd()}...` : String(s ?? ''));
const dm = (iso) => `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}`;
const semAcento = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
// 22/10 (Pedro): os outros traços que leem como travessão (figura U+2012, barra horizontal U+2015, menos U+2212) e o
// hífen solto entre espaços ("Abrir empresa - sem cartório", "PARTE 1 --- 500"): entre números vira hífen, no resto
// vira vírgula. O hífen colado na palavra ("pró-labore", "e-mail") fica
const TRACOS_EXTRAS = /[\u2012\u2015\u2212]/;
const HIFEN_SOLTO = /(^|[ \t])-{1,3}(?=[ \t]|$)/m;
const semTracosExtras = (s) => String(s ?? '')
  .replace(/(\d)[ \t]*(?:[\u2012\u2015\u2212]|-{1,3})[ \t]*(?=\d)/g, '$1-')
  .replace(/[ \t]*[\u2012\u2015\u2212][ \t]*/g, ', ')
  .replace(/(^|[ \t])-{1,3}(?=[ \t]|$)[ \t]*/gm, (m, antes) => (antes ? ', ' : ''))
  .replace(/^, |, $/gm, '').replace(/ ,/g, ',').replace(/,,+/g, ',');
// sem caractere de controle (a quebra de linha fica) e travessão (e os traços acima) vira vírgula (regra dura de copy)
const textoLimpo = (s) => semTracosExtras(semTracos(String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')));
const umaLinha = (s) => textoLimpo(s).replace(/\s+/g, ' ').trim();
// o texto que a IA escreve: além dos traços, "Legalizai" vira "Legalizaí" e negrito de markdown sai
const textoDaIa = (s) => textoLimpo(s).replace(/Legalizai(?![\p{L}])/gu, 'Legalizaí').replace(/\*\*/g, '');
// filename* da RFC 5987 (o mesmo do envios.mjs)
const codificarNome = (s) => encodeURIComponent(s).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const novoIdCurto = (prefixo) => `${prefixo}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;

// ---------- validação (zod) ----------

const MSG_COR = 'precisa ser uma cor #rgb, #rrggbb ou #rrggbbaa';
const RE_COR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// 22/10 (Pedro): o campo de cor do editor aceita rgb(), rgba(), hsl(), #rgba e transparent (a sombra nasce com rgba):
// o servidor grava sempre em hex (#rrggbb, ou #rrggbbaa com transparência). O que não dá pra converter cai na validação
const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
function hslParaRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
// 22/10 (achado da revisão): cor de verdade cabe em 40 caracteres. O que passa de 64 nem entra na expressão (a
// RE_COR recusa com 400 na hora) e o separador não é ambíguo: espaço e vírgula sobrepostos faziam a expressão
// voltar atrás com o cubo do tamanho e travar o servidor
export function normalizarCor(v) {
  if (typeof v !== 'string' || v.length > 64) return v;
  const s = v.trim().toLowerCase();
  if (s === 'transparent') return '#00000000';
  let m = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}${m[4]}${m[4]}`;
  m = /^(rgba?|hsla?)\(\s*([-\d.]+)(deg|%)?(?:\s*,\s*|\s+)([\d.]+)(%)?(?:\s*,\s*|\s+)([\d.]+)(%)?(?:\s*[,/]\s*([\d.]+)(%)?)?\s*\)$/.exec(s);
  if (!m) return s;
  const alfa = m[8] == null ? 1 : Number(m[8]) / (m[9] ? 100 : 1);
  let rgb;
  if (m[1].startsWith('rgb')) rgb = [[m[2], m[3]], [m[4], m[5]], [m[6], m[7]]].map(([n, pct]) => Number(n) * (pct ? 2.55 : 1));
  else rgb = hslParaRgb(((Number(m[2]) % 360) + 360) % 360, Number(m[4]) / 100, Number(m[6]) / 100);
  if (rgb.some((n) => !Number.isFinite(n) || n < 0 || n > 255.5) || !(alfa >= 0 && alfa <= 1)) return s;
  return `#${rgb.map(hex2).join('')}${alfa < 1 ? hex2(alfa * 255) : ''}`;
}
const zCor = z.preprocess(normalizarCor, z.string({ error: MSG_COR }).regex(RE_COR, { error: MSG_COR }).transform((s) => s.toLowerCase()));
const zNum = (min, max) => z.number({ error: 'precisa ser um número' })
  .min(min, { error: `vai de ${min} a ${max}` }).max(max, { error: `vai de ${min} a ${max}` });
const zCoord = () => zNum(-LIM.coord, LIM.coord);
const zTexto = (max) => z.string({ error: 'precisa ser texto' }).max(max, { error: `passa de ${max} caracteres` }).transform(textoLimpo);
const zBool = () => z.boolean({ error: 'precisa ser verdadeiro ou falso' });
const zAsset = z.string({ error: 'precisa ser o id de um asset' }).regex(ID_ASSET, { error: 'não é o id de um asset (ast_...)' });
const vazioNulo = (v) => (v === '' ? null : v);

const BASE_CAMADA = {
  id: z.any().optional(),
  nome: zTexto(LIM.nome).optional(),
  x: zCoord(),
  y: zCoord(),
  largura: zNum(1, LIM.coord),
  altura: zNum(1, LIM.coord),
  // graus, guardado entre -180 e 180
  rotacao: zCoord().default(0).transform((g) => {
    const r = ((g % 360) + 360) % 360;
    return r > 180 ? r - 360 : r;
  }),
  opacidade: zNum(0, 1).default(1),
  travada: zBool().default(false),
  oculta: zBool().default(false),
  // 23/10 (Pedro: "Ctrl + G agrupa, Ctrl + Shift + G desagrupa"): as camadas com o mesmo grupo andam juntas no editor
  grupo: z.preprocess(vazioNulo, z.string({ error: 'precisa ser o id de um grupo' }).regex(/^[A-Za-z0-9_-]{1,40}$/, { error: 'não é o id de um grupo' }).nullable().optional()),
};
const ZTexto = z.object({
  ...BASE_CAMADA,
  tipo: z.literal('texto'),
  texto: zTexto(LIM.texto).default(''),
  fonte: z.enum(['Sora', 'DM Serif Display'], { error: 'a fonte precisa ser Sora ou DM Serif Display' }).default('Sora'),
  // Sora vai até 800 (regra do Pedro); o número quebrado do controle deslizante vira inteiro
  peso: zNum(400, 800).default(400).transform((p) => Math.round(p)),
  italico: zBool().default(false),
  // 22/10 (Pedro): as faixas do editor (painel-dir.js): letra até 1200 px, altura da linha de 0,5 a 4 (multiplicador
  // do tamanho) e espaço entre letras em em, de -0,5 a 2. A leitura de valor grande como px saiu (uma camada de 2 KB
  // com espaçamento 10000 virava milhões de linhas na conferência)
  tamanho: zNum(1, LIM.tamanhoLetra).default(48),
  cor: zCor.default('#1b1e24'),
  corDestaque: zCor.default('#f2643c'),
  alinhamento: z.enum(['esquerda', 'centro', 'direita'], { error: 'o alinhamento precisa ser esquerda, centro ou direita' }).default('esquerda'),
  alturaLinha: zNum(0.5, 4).default(1.2),
  espacamentoLetra: zNum(-0.5, 2).default(0),
  caixa: z.enum(['normal', 'alta'], { error: 'a caixa precisa ser normal ou alta' }).default('normal'),
  fundo: z.object({ cor: zCor, raio: zNum(0, LIM.coord).default(999), padding: zNum(0, 2000).default(16) }).nullable().default(null),
});
const ZImagem = z.object({
  ...BASE_CAMADA,
  tipo: z.literal('imagem'),
  assetId: zAsset,
  espelhar: zBool().default(false),
  raio: zNum(0, LIM.coord).default(0),
  sombra: z.object({ cor: zCor, desfoque: zNum(0, 2000).default(0), x: zCoord().default(0), y: zCoord().default(0) }).nullable().default(null),
});
const ZForma = z.object({
  ...BASE_CAMADA,
  tipo: z.literal('forma'),
  forma: z.enum(['retangulo', 'circulo', 'linha'], { error: 'a forma precisa ser retangulo, circulo ou linha' }).default('retangulo'),
  cor: zCor.default('#f2643c'),
  borda: z.object({ cor: zCor, largura: zNum(0, 2000).default(1) }).nullable().default(null),
  raio: zNum(0, LIM.coord).default(0),
});
const ZCamada = z.discriminatedUnion('tipo', [ZTexto, ZImagem, ZForma], { error: 'o tipo da camada precisa ser texto, imagem ou forma' });
const ZFundo = z.object({
  tipo: z.enum(['cor', 'gradiente', 'imagem'], { error: 'o fundo precisa ser cor, gradiente ou imagem' }).default('cor'),
  cor: zCor.default('#faf8f5'),
  cor2: zCor.default('#f1eee9'),
  angulo: zNum(-360, 360).default(160),
  assetId: z.preprocess(vazioNulo, zAsset.nullable().default(null)),
  ajuste: z.enum(['cobrir', 'conter'], { error: 'o ajuste precisa ser cobrir ou conter' }).default('cobrir'),
}).superRefine((f, ctx) => {
  if (f.tipo === 'imagem' && !f.assetId) ctx.addIssue({ code: 'custom', path: ['assetId'], message: 'o fundo de imagem precisa de um asset' });
});
const ZPagina = z.object({
  id: z.any().optional(),
  fundo: ZFundo.prefault({}),
  camadas: z.array(ZCamada, { error: 'precisa ser uma lista' }).max(LIM.camadas, { error: `aceita no máximo ${LIM.camadas} camadas por página` }).default([]),
});
const ZEstrategia = z.object({
  pilar: z.preprocess((v) => (v === '' ? null : typeof v === 'string' && /^\d{1,2}$/.test(v.trim()) ? Number(v) : v),
    z.number({ error: 'precisa ser o número de um pilar' }).int().min(1).max(99).nullable().default(null)),
  bloco: z.preprocess(vazioNulo, z.string({ error: 'precisa ser texto' }).max(40).nullable().default(null)),
  motivo: zTexto(LIM.motivo).default(''),
  gatilhoEmocional: zTexto(LIM.gatilho).default(''),
  gatilhoPsicologico: zTexto(LIM.gatilho).default(''),
  // 22/10 (Pedro): o ângulo do pilar 8 (os 9 que giram), quando o design é desse pilar
  angulo: z.preprocess(vazioNulo, zTexto(LIM.gatilho).nullable().optional()),
});
const zLado = () => z.number({ error: 'precisa ser um número' }).int({ error: 'precisa ser um número inteiro' })
  .min(LIM.ladoMin, { error: `vai de ${LIM.ladoMin} a ${LIM.ladoMax} px` }).max(LIM.ladoMax, { error: `vai de ${LIM.ladoMin} a ${LIM.ladoMax} px` });
const ZDoc = z.object({
  titulo: zTexto(LIM.titulo).optional(),
  formato: z.enum(IDS_FORMATO, { error: `o formato precisa ser ${IDS_FORMATO.join(', ')}` }).optional(),
  largura: zLado().optional(),
  altura: zLado().optional(),
  paginas: z.array(ZPagina, { error: 'precisa ser uma lista' })
    .min(1, { error: 'o design precisa de pelo menos 1 página' }).max(LIM.paginas, { error: `aceita no máximo ${LIM.paginas} páginas` }).optional(),
  pecaId: z.preprocess(vazioNulo, z.string({ error: 'precisa ser o id de uma peça' }).max(80).nullable()).optional(),
  estrategia: ZEstrategia.nullable().optional(),
  fontes: z.array(zTexto(LIM.fonte), { error: 'precisa ser uma lista' }).max(LIM.fontes, { error: `aceita no máximo ${LIM.fontes} fontes` }).optional(),
  notas: zTexto(LIM.notas).optional(),
  // 22/10 (Pedro): o modelo de que o design nasceu (estudio/base/modelos): entra na janela de não repetição do gerar
  modeloId: z.preprocess(vazioNulo, z.string({ error: 'precisa ser o id de um modelo' }).regex(ID_MODELO, { error: 'não é o id de um modelo' }).nullable()).optional(),
  // 23/10 (Pedro: "régua horizontal e vertical que também aplica a regra dos artboards"): as guias puxadas da régua,
  // do design inteiro (a mesma posição em todas as páginas): v = as verticais (x), h = as horizontais (y)
  guiasFixas: z.object({
    v: z.array(zCoord(), { error: 'precisa ser uma lista' }).max(LIM.guias, { error: `aceita no máximo ${LIM.guias} guias` }).default([]),
    h: z.array(zCoord(), { error: 'precisa ser uma lista' }).max(LIM.guias, { error: `aceita no máximo ${LIM.guias} guias` }).default([]),
  }, { error: 'as guias precisam ser { v, h }' }).nullable().optional(),
}, { error: 'o design precisa ser um objeto' });

// onde está o problema, em português: "página 2, camada 3 ("Título"), tamanho"
function ondeDo(caminho, b) {
  const partes = [];
  let resto = caminho;
  if (caminho[0] === 'paginas' && Number.isInteger(caminho[1])) {
    partes.push(`página ${caminho[1] + 1}`);
    resto = caminho.slice(2);
    if (resto[0] === 'camadas' && Number.isInteger(resto[1])) {
      const nome = umaLinha(objeto(b?.paginas?.[caminho[1]]?.camadas?.[resto[1]]).nome);
      partes.push(`camada ${resto[1] + 1}${nome ? ` ("${curto(nome, 30)}")` : ''}`);
      resto = resto.slice(2);
    }
  }
  const campo = resto.filter((x) => typeof x === 'string').join('.');
  if (campo) partes.push(campo);
  return partes.join(', ') || 'o design';
}
function textoDoProblema(is) {
  // a mensagem escrita no esquema vale; a padrão do zod (em inglês) vira português aqui
  if (is.message && !/^(Invalid|Too (big|small)|Expected|Unrecognized)/.test(is.message)) return is.message;
  if (is.code === 'invalid_type') {
    return { number: 'precisa ser um número', string: 'precisa ser texto', boolean: 'precisa ser verdadeiro ou falso', array: 'precisa ser uma lista', object: 'precisa ser um objeto' }[is.expected] ?? is.message;
  }
  if (is.code === 'too_big' && is.origin === 'array') return `aceita no máximo ${is.maximum} itens`;
  if (is.code === 'too_small' && is.origin === 'array') return `precisa de pelo menos ${is.minimum}`;
  if (is.code === 'too_big' && is.origin === 'string') return `passa de ${is.maximum} caracteres`;
  if (is.code === 'invalid_value') return `precisa ser ${is.values.map(String).join(', ')}`;
  if (is.code === 'invalid_union') return 'o tipo da camada precisa ser texto, imagem ou forma';
  return is.message;
}
const problemaInvalido = (mensagem, problemas = []) => Object.assign(falha(400, mensagem), { problemas });
function erroDeValidacao(issues, b) {
  const lista = issues.slice(0, 8).map((is) => `${ondeDo(is.path ?? [], b)}: ${textoDoProblema(is)}`);
  return problemaInvalido(`Design inválido: ${lista.slice(0, 3).join('; ')}.`, lista);
}

const paginaVazia = () => ({ fundo: { tipo: 'cor', cor: '#faf8f5', cor2: '#f1eee9', angulo: 160, assetId: null, ajuste: 'cobrir' }, camadas: [] });
const NOME_FORMA = { retangulo: 'Retângulo', circulo: 'Círculo', linha: 'Linha' };
// os ids que o design usa (fundo e camadas de imagem)
export function assetsDoDoc(doc) {
  const ids = new Set();
  for (const p of doc?.paginas ?? []) {
    if (p?.fundo?.assetId) ids.add(p.fundo.assetId);
    for (const c of p?.camadas ?? []) if (c?.tipo === 'imagem' && c.assetId) ids.add(c.assetId);
  }
  return ids;
}

// a peça do cronograma pelo id: a de feed (db.reels) ou os stories do dia (db.stories)
function acharPeca(db, id) {
  if (typeof id !== 'string' || !id) return null;
  const r = (db?.reels ?? []).find((x) => x?.id === id);
  if (r) return { tipo: 'peca', item: r };
  const s = (Array.isArray(db?.stories) ? db.stories : []).find((x) => x?.id === id);
  return s ? { tipo: 'stories', item: s } : null;
}

// b: o que chegou (tela, semente, IA). atual: o design gravado (edição: o que não veio fica como está e os assets que
// ele já usava seguem valendo). assets: Map id -> asset (só consultado quando o design usa algum asset novo).
// Devolve o conteúdo limpo: { titulo, formato, largura, altura, paginas, pecaId, estrategia, fontes, notas }
export function validarDocumento(b, { atual = null, db = null, assets = null } = {}) {
  const r = ZDoc.safeParse(b);
  if (!r.success) throw erroDeValidacao(r.error.issues, b);
  const v = r.data;
  const base = atual ?? {};
  const formato = v.formato ?? base.formato ?? 'feed45';
  const f = FORMATOS[formato];
  const largura = f.largura ?? v.largura ?? base.largura ?? null;
  const altura = f.altura ?? v.altura ?? base.altura ?? null;
  if (!largura || !altura) throw problemaInvalido(`O formato personalizado precisa de largura e altura (de ${LIM.ladoMin} a ${LIM.ladoMax} px).`);
  const titulo = umaLinha(v.titulo ?? base.titulo ?? '') || 'Design sem título';
  const paginas = structuredClone(v.paginas ?? base.paginas ?? [paginaVazia()]);
  // ids únicos no design inteiro (o que veio torto ou repetido ganha um novo)
  const vistos = new Set();
  const idOk = (id, prefixo) => {
    const ok = typeof id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(id) && !vistos.has(id) ? id : novoIdCurto(prefixo);
    vistos.add(ok);
    return ok;
  };
  for (const p of paginas) {
    p.id = idOk(p.id, 'pag');
    for (const c of p.camadas) {
      c.id = idOk(c.id, 'cam');
      if (c.tipo === 'texto' && c.fonte === 'DM Serif Display') c.peso = 400;
      if (!tem(c.nome)) {
        c.nome = c.tipo === 'texto' ? curto(umaLinha(c.texto.replace(/\*/g, '')), 40) || 'Texto'
          : c.tipo === 'imagem' ? umaLinha(assets?.get(c.assetId)?.nome) || 'Imagem' : NOME_FORMA[c.forma];
      }
      c.nome = umaLinha(c.nome).slice(0, LIM.nome);
    }
  }
  // asset que o design ainda não usava precisa existir no banco
  const jaUsados = assetsDoDoc(base);
  for (const [i, p] of paginas.entries()) {
    const confere = (id, onde) => {
      if (!id || jaUsados.has(id) || assets?.has(id)) return;
      throw problemaInvalido(`${onde} da página ${i + 1} usa um asset que não existe no banco (${id}).`);
    };
    if (p.fundo.tipo === 'imagem') confere(p.fundo.assetId, 'O fundo');
    for (const c of p.camadas) if (c.tipo === 'imagem') confere(c.assetId, `A camada "${curto(c.nome, 30)}"`);
    if (p.fundo.tipo !== 'imagem') p.fundo.assetId = null;
  }
  let pecaId = v.pecaId === undefined ? base.pecaId ?? null : v.pecaId;
  if (pecaId != null && db && !acharPeca(db, pecaId)) {
    // a peça que já estava ligada e foi apagada solta sem erro (como o pecaDoDia dos stories). Ligar um design novo, ou
    // um design ligado, a uma peça que não existe continua erro. 24/10 (Pedro: "o Ctrl+S não está salvando"): o editor
    // aberto seguia mandando o id da peça apagada depois que o design já tinha soltado, e cada salvamento voltava 400;
    // com o design já solto, o id que não existe só fica de fora (a resposta volta com pecaId null e o editor acerta)
    const novaLigacao = v.pecaId !== undefined && v.pecaId !== base.pecaId;
    if (novaLigacao && (!atual || base.pecaId != null)) throw problemaInvalido('Essa peça não existe no cronograma.');
    pecaId = null;
  }
  let estrategia = v.estrategia === undefined ? base.estrategia ?? null : v.estrategia;
  if (estrategia) {
    estrategia = { ...estrategia };
    if (estrategia.pilar != null && db && !(db.pilares ?? []).some((pl) => pl.id === estrategia.pilar)) throw problemaInvalido(`O pilar ${estrategia.pilar} não existe.`);
    let bloco = null;
    try {
      bloco = conferirBloco(estrategia.bloco);
    } catch {
      throw problemaInvalido('O bloco precisa ser Educação, Afeto, Diferencial ou Conversão.');
    }
    estrategia.bloco = bloco ?? blocoDoPilar(estrategia.pilar);
    estrategia.motivo = estrategia.motivo.trim();
    estrategia.gatilhoEmocional = umaLinha(estrategia.gatilhoEmocional);
    estrategia.gatilhoPsicologico = umaLinha(estrategia.gatilhoPsicologico);
    // o ângulo só vale no pilar 8, e só um dos 9 (o que vier fora da lista sai)
    const angulo = estrategia.pilar === 8 ? anguloCanonico(estrategia.angulo) : null;
    if (angulo) estrategia.angulo = angulo;
    else delete estrategia.angulo;
  }
  // 22/10 (Pedro): poucas palavras por página; 30 mil letras no design inteiro é o teto de trabalho da conferência
  let letras = 0;
  for (const p of paginas) for (const c of p.camadas) if (c.tipo === 'texto') letras += c.texto.length;
  if (letras > LIM.textoDoc) throw problemaInvalido(`O design passa de ${LIM.textoDoc.toLocaleString('pt-BR')} letras (tem ${letras.toLocaleString('pt-BR')}): poucas palavras por página.`);
  const fontes = (v.fontes ?? base.fontes ?? []).map((s) => umaLinha(s)).filter(Boolean);
  const notas = String(v.notas ?? base.notas ?? '').trim();
  const modeloId = v.modeloId === undefined ? base.modeloId ?? null : v.modeloId;
  // as guias da régua: sem repetir, com 1 casa (a que não veio fica como estava)
  const g = v.guiasFixas === undefined ? base.guiasFixas ?? null : v.guiasFixas;
  const umaCasa = (lista) => [...new Set((lista ?? []).map((n) => Math.round(n * 10) / 10))].slice(0, LIM.guias);
  const guiasFixas = g ? { v: umaCasa(g.v), h: umaCasa(g.h) } : null;
  return {
    titulo, formato, largura, altura, paginas, pecaId: pecaId ?? null, estrategia: estrategia ?? null, fontes, notas, ...(modeloId ? { modeloId } : {}),
    ...(guiasFixas ? { guiasFixas } : {}),
  };
}

// ---------- geometria: área segura, caixa, colisão ----------

// a área onde texto, card, ícone e aparelho ficam (regra do Pedro, 09/10): stories 96 nas laterais, 240 no topo e 360
// na base; feed e quadrado 72 em volta; personalizado proporcional (72 px a cada 1080 do menor lado)
export function areaSegura(doc) {
  const L = Number(doc?.largura) || 1080;
  const A = Number(doc?.altura) || 1350;
  let m = FORMATOS[doc?.formato]?.margem;
  if (!m) {
    const x = Math.max(8, Math.round((Math.min(L, A) * 72) / 1080));
    m = { topo: x, base: x, esquerda: x, direita: x };
  }
  return { ...m, x: m.esquerda, y: m.topo, largura: L - m.esquerda - m.direita, altura: A - m.topo - m.base };
}

// a largura de cada letra da Sora, em em (aproximada por classe de letra). Conferida com as caixas medidas no navegador
// nos Destaques de 22/10: "Proativa" em 700 de 60 px dá 247 px (medido 250), "Vai," em 800 de 116 px dá 207 (215) e
// "criou a Legalizaí." em 800 de 100 px dá 840 (cabe nos 888 da caixa, como no navegador)
function emDaLetra(ch) {
  const b = ch.normalize('NFD')[0] ?? ch;
  if (/\s/.test(b) || /[il.,:;'!|]/.test(b)) return 0.26;
  if (/[ftrj]/.test(b)) return 0.38;
  if (b === 'I') return 0.3;
  if (/[mw]/.test(b)) return 0.88;
  if (/[MW]/.test(b)) return 0.95;
  if (/[A-Z]/.test(b)) return 0.68;
  return 0.6;
}
// as linhas do texto quebrado (largura de cada letra, quebra por palavra): { larguras (px de cada linha), lh, pad }.
// folga: a largura a mais que a conta aceita antes de quebrar a linha (a caixa medida no navegador é justa)
// 22/10 (Pedro): a palavra que não cabe quebra por letra e cada linha leva pelo menos uma letra (como o navegador):
// a camada tem no máximo uma linha por letra, por mais estreita que seja a caixa ou larga que seja a letra. Antes, a
// conta empurrava uma linha por largura da caixa e 2 KB de texto viravam milhões de linhas (o servidor caía sem memória)
export function quebrarLinhas(c, folga = 1) {
  const em = Number(c.tamanho) || 48;
  const pad = c.fundo ? (Number(c.fundo.padding) || 0) * 2 : 0;
  // espaço entre letras em em (o editor e o contrato); valor fora da faixa fica na ponta dela
  const ls = Math.max(-0.5, Math.min(2, Number(c.espacamentoLetra) || 0)) * em;
  // a letra engorda com o peso; a DM Serif é mais estreita; a caixa alta vira maiúscula
  const fator = (c.fonte === 'DM Serif Display' ? 0.88 : 1 + (((c.peso ?? 400) - 400) / 400) * 0.08) * em;
  const letra = (ch) => Math.max(0, emDaLetra(ch) * fator + ls);
  const largura = (s) => [...s].reduce((w, ch) => w + letra(ch), 0);
  const cabe = Math.max(1, (Math.max(1, (Number(c.largura) || 1) - pad)) * folga);
  const espaco = Math.max(0, 0.26 * fator + ls);
  const larguras = [];
  const texto = String(c.texto ?? '').replace(/\*/g, '');
  for (const par of (c.caixa === 'alta' ? texto.toUpperCase() : texto).split('\n')) {
    let atual = 0;
    for (const p of par.split(/\s+/).filter(Boolean)) {
      const w = largura(p);
      if (atual && atual + espaco + w <= cabe) {
        atual += espaco + w;
        continue;
      }
      if (atual) larguras.push(atual);
      if (w <= cabe) {
        atual = w;
        continue;
      }
      // a palavra maior que a caixa: letra a letra, cada linha com pelo menos uma
      atual = 0;
      for (const ch of p) {
        const lw = letra(ch);
        if (atual && atual + lw > cabe) {
          larguras.push(atual);
          atual = 0;
        }
        atual += lw;
      }
    }
    larguras.push(atual);
  }
  const lh = Math.max(0.5, Math.min(4, Number(c.alturaLinha) || 1.2)) * em;
  return { larguras, lh, pad };
}
// a altura que o texto ocupa, estimada. Serve pra corrigir a caixa que a IA mandou e pro alerta do texto que não cabe:
// o navegador do editor mede de verdade
export function alturaEstimada(c, { folga = 1 } = {}) {
  const { larguras, lh, pad } = quebrarLinhas(c, folga);
  return Math.ceil(larguras.length * lh + pad);
}
// a tinta do texto: um retângulo por linha, na largura estimada e no alinhamento (a caixa do texto costuma ser mais
// larga que as linhas curtas, e o ícone ao lado da linha curta não atravessa nada). Texto girado ou com pílula: a caixa
function tintaDoTexto(c) {
  if (c.fundo || (Number(c.rotacao) || 0) !== 0) return [caixaDe(c)];
  const { larguras, lh } = quebrarLinhas(c, 1.08);
  return larguras.map((w0, i) => {
    const w = Math.min(Math.max(w0, 1), c.largura);
    const x = c.alinhamento === 'centro' ? c.x + (c.largura - w) / 2 : c.alinhamento === 'direita' ? c.x + c.largura - w : c.x;
    return { x, y: c.y + i * lh, w, h: lh };
  });
}
// a caixa que contém os retângulos (laço, não Math.min(...lista): lista grande estoura a pilha)
const uniao = (rs) => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rs) {
    if (r.x < x0) x0 = r.x;
    if (r.y < y0) y0 = r.y;
    if (r.x + r.w > x1) x1 = r.x + r.w;
    if (r.y + r.h > y1) y1 = r.y + r.h;
  }
  return rs.length ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
};
// o que a camada ocupa pra conferência: a tinta do texto (linha a linha) ou a caixa
const ocupa = (c) => (c.tipo === 'texto' ? tintaDoTexto(c) : [caixaDe(c)]);

// a caixa alinhada aos eixos que a camada ocupa (girada, a caixa que contém o retângulo girado). A do texto é a que veio:
// o editor mede no navegador e a IA tem a caixa corrigida pela estimativa antes da conferência (docDaIa)
export function caixaDe(c) {
  const w = Number(c.largura) || 0;
  const h = Number(c.altura) || 0;
  const g = ((Number(c.rotacao) || 0) * Math.PI) / 180;
  if (!g) return { x: c.x, y: c.y, w, h };
  const cx = c.x + w / 2;
  const cy = c.y + h / 2;
  const cos = Math.abs(Math.cos(g));
  const sin = Math.abs(Math.sin(g));
  const W = w * cos + h * sin;
  const H = w * sin + h * cos;
  return { x: cx - W / 2, y: cy - H / 2, w: W, h: H };
}
const TOL = 2;
const sobrepoe = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > TOL && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > TOL;
const contem = (a, b) => b.x >= a.x - TOL && b.y >= a.y - TOL && b.x + b.w <= a.x + a.w + TOL && b.y + b.h <= a.y + a.h + TOL;
const visivel = (c) => !c.oculta && (c.opacidade ?? 1) > 0;
// o cartão (forma que não é linha) atrás que contém o elemento inteiro: a metáfora do papel, não é colisão
const ehCartao = (c) => c.tipo === 'forma' && c.forma !== 'linha';
// imagem ou forma que cobre a página inteira: é fundo (pode ir até a borda e ficar atrás de tudo)
const cobreAPagina = (c, k, doc) => Boolean(doc) && c.tipo !== 'texto' && k.x <= 0 && k.y <= 0 && k.x + k.w >= doc.largura && k.y + k.h >= doc.altura;
// asset da categoria fundo usado como camada (luz, disco, textura, vinheta): é fundo e partícula, pode ir até a borda e
// passar por trás ou pela frente dos objetos sem contar como colisão (regra do Pedro, 09/10)
const ehEfeitoDeFundo = (c, assets) => c.tipo === 'imagem' && assets?.get(c.assetId)?.categoria === 'fundo';
// o grifo (sublinhado à mão) mora embaixo da palavra que ele marca: com texto não é colisão, e esticar é o uso dele
const ehGrifo = (c, assets) => {
  if (c.tipo !== 'imagem') return false;
  const a = assets?.get(c.assetId);
  return /grifo|sublinhad|rabisco/i.test(`${c.assetId} ${a?.nome ?? ''} ${(a?.tags ?? []).join(' ')}`);
};

// algum retângulo de A cruza algum de B. As duas listas vêm por y crescente e as linhas de uma camada não se cruzam
// entre si (a tinta do texto, uma faixa por linha): a varredura anda nas duas juntas, sem comparar todas com todas
// (22/10, Pedro: 80 camadas de 1900 linhas travavam o servidor por minutos)
function algumaSobrepoe(ra, rb) {
  let j0 = 0;
  for (const a of ra) {
    while (j0 < rb.length && rb[j0].y + rb[j0].h <= a.y + TOL) j0++;
    for (let j = j0; j < rb.length && rb[j].y < a.y + a.h - TOL; j++) if (sobrepoe(a, rb[j])) return true;
  }
  return false;
}

// os pares de camadas da página que se atravessam (a de índice menor fica atrás). doc e assets (opcionais): com eles, a
// camada que cobre a página inteira e a de efeito de fundo não colidem, e o grifo não colide com texto
export function colisoes(pagina, doc = null, assets = null) {
  const vis = (pagina?.camadas ?? []).filter(visivel).map((c) => {
    const rs = ocupa(c);
    return { c, rs, k: uniao(rs) };
  });
  const out = [];
  for (let i = 0; i < vis.length; i++) {
    for (let j = i + 1; j < vis.length; j++) {
      const A = vis[i];
      const B = vis[j];
      if (!sobrepoe(A.k, B.k) || !algumaSobrepoe(A.rs, B.rs)) continue;
      if (ehCartao(A.c) && contem(A.k, B.k)) continue;
      if (cobreAPagina(A.c, A.k, doc) || ehEfeitoDeFundo(A.c, assets) || ehEfeitoDeFundo(B.c, assets)) continue;
      if ((ehGrifo(A.c, assets) && B.c.tipo === 'texto') || (ehGrifo(B.c, assets) && A.c.tipo === 'texto')) continue;
      out.push([A.c, B.c]);
    }
  }
  return out;
}
// faixa de fundo que sangra (forma que atravessa a largura ou a altura inteira), a camada que cobre a página e o efeito de
// fundo: fundo pode ir até a borda
const sangra = (c, k, doc, assets = null) => cobreAPagina(c, k, doc) || ehEfeitoDeFundo(c, assets)
  || (c.tipo === 'forma' && ((k.x <= 0 && k.x + k.w >= doc.largura) || (k.y <= 0 && k.y + k.h >= doc.altura)));
const fora = (k, a) => k.x < a.x - 0.5 || k.y < a.y - 0.5 || k.x + k.w > a.x + a.largura + 0.5 || k.y + k.h > a.y + a.altura + 0.5;
// forma fina (até 12 px de um lado, 3 vezes isso do outro): régua, barrinha
const ehFina = (c) => c.tipo === 'forma' && Math.min(c.largura, c.altura) <= 12 && Math.max(c.largura, c.altura) >= 3 * Math.min(c.largura, c.altura);
// barrinha colada antes do texto na mesma linha (lê como travessão; Pedro, 23/09). A régua numa linha própria pode
function barrinhasAntesDeTexto(pagina) {
  const out = [];
  const textos = pagina.camadas.filter((c) => c.tipo === 'texto' && visivel(c) && tem(c.texto));
  for (const f of pagina.camadas.filter((c) => ehFina(c) && visivel(c))) {
    const kf = caixaDe(f);
    const meio = kf.y + kf.h / 2;
    for (const t of textos) {
      const kt = caixaDe(t);
      const primeiraLinha = kt.y + Math.min(kt.h, (t.tamanho ?? 48) * 1.6);
      if (meio >= kt.y - TOL && meio <= primeiraLinha && kf.x + kf.w <= kt.x + TOL && kt.x - (kf.x + kf.w) <= 80) {
        out.push([f, t]);
        break;
      }
    }
  }
  return out;
}
const palavrasDaPagina = (p) => p.camadas.filter((c) => c.tipo === 'texto' && visivel(c) && !MOLDURA.has(c.nome))
  .reduce((n, c) => n + String(c.texto).replace(/\*/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length, 0);

// o símbolo da marca (o plano, o negativo e o 3D do banco): 22/10 (Pedro) só o asset da BASE do repo, da categoria marca
// ou 3D, com "símbolo" no id ou no nome (logo não conta). Upload com a tag check ou visto não vira o símbolo: a revisão
// avisa que todo visto é o símbolo da marca
const ehSimbolo = (a) => Boolean(a) && a.origem !== 'upload' && ['marca', '3d'].includes(a.categoria)
  && !/logo/i.test(`${a.id} ${a.nome}`) && /s[ií]mbolo/i.test(`${a.id} ${a.nome}`);
const pareceVisto = (a) => Boolean(a) && !ehSimbolo(a) && (a.tags ?? []).some((t) => /^(s[ií]mbolo|visto|check)$/i.test(String(t)));
// 22/10 (Pedro): asset com corte reto embaixo (os bustos do Léo, tag "corte reto" no catálogo): pode ficar colado na
// borda de baixo da página, a única exceção da área segura (só na base; nas laterais e no topo vale a margem)
// 22/10 (achado da revisão): ou marcado no uso, com "corte reto" no nome da camada (o Léo do Destaque 01), igual no
// editor (modelo.js)
const ehCorteReto = (c, assets) => c.tipo === 'imagem' && ((assets?.get(c.assetId)?.tags ?? []).some((t) => semAcento(t).trim() === 'corte reto')
  || /\bcorte reto\b/.test(semAcento(c.nome ?? '')));
const coladoNaBase = (k, doc) => Boolean(doc) && k.y + k.h >= doc.altura - 1;

// ---------- revisão (o que o servidor confere em todo design gravado) ----------

// os textos visíveis da página, o de maior letra primeiro (22/10, Pedro: é o título ou o gancho; a primeira camada da
// lista costuma ser a tag ou o kicker, e a anti-repetição do gancho comparava "MEI" com as peças)
// 23/10: a moldura do carrossel montado (estudio-carrossel.mjs: a tag do público, o contador de páginas e a linha do
// logo) não é texto da peça: fica fora da conferência do texto
const MOLDURA = new Set(['Tag do público', 'Contador', 'Contabilidade Digital']);
function textosDaPagina(p) {
  const cs = p.camadas.filter((c) => c.tipo === 'texto' && visivel(c) && tem(c.texto) && !MOLDURA.has(c.nome));
  const maior = cs.reduce((m, c) => (!m || c.tamanho > m.tamanho ? c : m), null);
  return maior ? [maior, ...cs.filter((c) => c !== maior)].map((c) => c.texto.replace(/\*/g, '')) : [];
}
// o gancho do design: o texto de maior letra da capa
export const ganchoDoDoc = (doc) => umaLinha(textosDaPagina(doc?.paginas?.[0] ?? { camadas: [] })[0] ?? '');
// as fontes que valem pro design: as dele e, sem nenhuma, as da peça ligada (22/10, Pedro: o editor não tem campo de
// fontes, e o design feito à mão da peça herda as fontes dela)
function fontesDoDoc(doc, db = null) {
  if ((doc.fontes ?? []).length) return doc.fontes;
  const p = doc.pecaId && db ? acharPeca(db, doc.pecaId) : null;
  return Array.isArray(p?.item?.fontes) ? p.item.fontes.map((f) => umaLinha(f)).filter(Boolean) : [];
}
// a peça que a conferência do Ateliê lê: 1 página = a arte (estático); mais = capa, slides e o slide final
function pecaDoDoc(doc, db = null) {
  const pags = doc.paginas.map(textosDaPagina);
  const fontes = fontesDoDoc(doc, db);
  if (pags.length === 1) return { estatico: { headline: pags[0][0] ?? '', apoio: pags[0].slice(1).join('\n'), visual: '', cta: '' }, fontes };
  const slide = (ts) => ({ titulo: ts[0] ?? '', texto: ts.slice(1).join('\n'), visual: '' });
  return { carrossel: { capa: slide(pags[0]), slides: pags.slice(1, -1).map(slide), final: slide(pags.at(-1)) }, fontes };
}

// ---------- fato só do FATOS.md (22/10, Pedro) ----------

// os fatos de _base-contabil/FATOS.md: id -> status (USAR, NÃO USAR ou CONFLITO). Lido de novo quando o arquivo muda
let fatosCache = null;
export async function lerFatos(arquivo = path.join(PASTA_BASE_CONTABIL, 'FATOS.md')) {
  let st;
  try {
    st = await stat(arquivo);
  } catch {
    return new Map();
  }
  if (fatosCache?.arquivo === arquivo && fatosCache.mtime === st.mtimeMs) return fatosCache.mapa;
  const mapa = new Map();
  const txt = await readFile(arquivo, 'utf8').catch(() => '');
  for (const m of txt.matchAll(/^\*\*(F\d{3})\s*·[^*]*\*\*\s*·\s*(USAR|N[ÃA]O USAR|CONFLITO)\b/gmu)) mapa.set(m[1], m[2].replace('NAO', 'NÃO'));
  fatosCache = { arquivo, mtime: st.mtimeMs, mapa };
  return mapa;
}
// número, data, prazo, preço ou percentual: R$, %, dia N, dd/mm, N mil, N dias/meses/anos/horas, 1.000 e o número por
// extenso com unidade ("doze meses", "oitenta e um mil"). O mote "100% digital / 100% humana" é claim, não número
const POR_EXTENSO = 'dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|quatrocentos|quinhentos';
const NUMERO_AMPLO = new RegExp([
  'R\\$\\s?\\d', '\\d+([.,]\\d+)?\\s?%', '\\bdia\\s+\\d', '\\b\\d{1,2}\\/\\d{1,2}\\b', '\\b\\d{1,3}(\\.\\d{3})+\\b',
  '\\b\\d+([.,]\\d+)?\\s*(mil|milh[õo]es|dias?|meses|m[êe]s|anos?|horas?)\\b',
  `\\b(${POR_EXTENSO})\\b(\\s+e\\s+\\p{L}+)?\\s+(mil|reais|dias|meses|anos|por cento)\\b`,
].join('|'), 'iu');
const semClaim = (t) => String(t).replace(/100\s?%\s?(e\s)?(human|digital)\w*/gi, '');
const fonteDeDecisao = (f) => /decis[ãa]o do pedro/i.test(f);
// as fontes do design contra o FATOS.md e o texto com número sem fonte. Devolve itens da revisão de design
export function conferirFatos(doc, fontes, fatos) {
  const out = [];
  let fonteValida = false;
  for (const f of fontes ?? []) {
    const ids = [...new Set(String(f).match(/\bF\d{3}\b/g) ?? [])];
    if (!ids.length) {
      if (fonteDeDecisao(f)) fonteValida = true;
      else out.push({ regra: 'fonte-sem-fato', nivel: 'alerta', pagina: null, camadas: [], texto: `A fonte "${curto(f, 60)}" não cita um fato do FATOS.md (F000): número, data, preço e regra saem de lá.` });
      continue;
    }
    for (const id of ids) {
      const st = fatos.size ? fatos.get(id) : 'USAR';
      if (!st) out.push({ regra: 'fato-inexistente', nivel: 'problema', pagina: null, camadas: [], texto: `A fonte "${curto(f, 60)}" cita ${id}, que não existe no FATOS.md: o que não está lá não é dito.` });
      else if (st !== 'USAR') out.push({ regra: 'fato-nao-usar', nivel: 'problema', pagina: null, camadas: [], texto: `${id} está marcado ${st} no FATOS.md: esse fato não entra na peça.` });
      else fonteValida = true;
    }
  }
  if (!fonteValida) {
    doc.paginas.forEach((p, i) => {
      const cs = p.camadas.filter((x) => x.tipo === 'texto' && visivel(x) && tem(x.texto));
      // o mote quebrado em camadas ("100%" numa, "digital" na outra) continua sendo o claim
      const claimNaPagina = /100\s?%\s?(e\s)?(human|digital)/i.test(cs.map((c) => c.texto.replace(/\*/g, '')).join(' ').replace(/\s+/g, ' '));
      for (const c of cs) {
        const t = semClaim(c.texto.replace(/\*/g, ''));
        const m = NUMERO_AMPLO.exec(claimNaPagina ? t.replace(/\b100\s?%/g, '') : t);
        if (m) out.push({ regra: 'numero-sem-fato', nivel: 'problema', pagina: i + 1, camadas: [c.id], texto: `"${curto(c.nome || c.texto, 30)}" tem número ("${curto(m[0], 30)}") sem fonte: cite o fato do FATOS.md (F000) nas fontes ou tire o número.` });
      }
    });
  }
  return out;
}

// 22/10 (achado da revisão): a escala por formato, a mesma do editor (modelo.js, ESCALA_TEXTO e tituloDaEscala), em 1080
// de largura: o stories (a página alta, 1,7 vez a largura ou mais) pelos Destaques, título de 80 a 112 px (22/10: o Destaque 07 aprovado tem 80) e corpo de 36 a
// 44 (kicker de 30); o feed pelo design-guide, título de 54 a 92 e corpo de 24 a 32. Antes o stories usava a do feed: o
// título de 96 px dos Destaques e dos modelos virava alerta gravado que a tela não mostrava
const ESCALA_TEXTO = {
  stories: { titulo: [80, 112], corpo: [36, 44] },
  feed: { titulo: [54, 92], corpo: [24, 32] },
};
// o teto de palavras por página, o mesmo do editor (modelo.js) e o dado à IA (REGRAS_DESIGN); a meta é umas 25
export const LIMITE_PALAVRAS = 35;
// o número em destaque (o preço do card de oferta, o número do slide, "R$ 81 mil"): pode passar da escala do título
const SO_NUMERO = /^(R\$\s*)?[+-]?\d[\d.,:/]*\s*(%|x|mil|milh[ãa]o|milh[õo]es|k|º|ª)?$/iu;
const soNumero = (t) => SO_NUMERO.test(String(t ?? '').replace(/\*/g, '').replace(/\s+/g, ' ').trim());
// a maior letra da página (o título ou o gancho; com empate, todos os textos dela) nunca é texto corrido. Ela vai pra
// escala do título quando a página tem mais de um texto e não é um número em destaque nem a letra de 3 textos ou mais (a
// lista sem título: os nomes do time no Destaque 04)
function tituloDaEscala(textos) {
  const max = textos.reduce((m, c) => Math.max(m, c.tamanho), -Infinity);
  const maiores = textos.filter((c) => Math.abs(c.tamanho - max) < 0.5);
  const titulo = textos.length >= 2 && maiores.length < 3 && !soNumero(maiores[0].texto) ? maiores[0] : null;
  return { titulo, maiores: new Set(maiores) };
}

// 24/10: a escala da exportação (a mesma do ESCALA_EXPORTAR de public/js/estudio/dialogos.js: PNG sempre em 2x) e a
// folga antes de avisar que a imagem vai sair borrada (até 1,4x maior que o original ainda passa no feed)
export const ESCALA_EXPORTAR = 2;
const RESOLUCAO_FOLGA = 1.4;

// o design contra as regras de design do Pedro. nivel: 'problema' (a IA refaz; na tela, vermelho) ou 'alerta'
export function revisarDesign(doc, assets = new Map()) {
  const area = areaSegura(doc);
  const out = [];
  const add = (regra, nivel, pagina, camadas, texto) => out.push({ regra, nivel, pagina, camadas: camadas.map((c) => c.id), texto });
  const nomeDe = (c) => `"${curto(c.nome || c.tipo, 30)}"`;
  const minimo = Math.round((22 * doc.largura) / 1080);
  const escala = doc.altura / doc.largura >= 1.7 ? { nome: 'stories', ...ESCALA_TEXTO.stories } : { nome: 'feed', ...ESCALA_TEXTO.feed };
  const px = (v) => Math.round((v * doc.largura) / 1080);
  const [t0, t1] = escala.titulo.map(px);
  const [c0, c1] = escala.corpo.map(px);
  // o busto de corte reto colado na base: a área segura vale nas laterais e no topo
  const areaAteABase = { ...area, altura: doc.altura - area.y + LIM.coord };
  doc.paginas.forEach((p, i) => {
    const n = i + 1;
    if (p.fundo.tipo === 'imagem' && p.fundo.assetId && !assets.has(p.fundo.assetId)) add('asset-sumiu', 'problema', n, [], `O fundo usa um asset que não existe mais (${p.fundo.assetId}).`);
    for (const k of [p.fundo.cor, ...(p.fundo.tipo === 'gradiente' ? [p.fundo.cor2] : [])]) {
      if (p.fundo.tipo !== 'imagem' && !PALETA.has(k.slice(0, 7))) add('paleta', 'alerta', n, [], `O fundo usa ${k}, fora da paleta do design-guide.`);
    }
    for (const [a, b] of colisoes(p, doc, assets)) add('colisao', 'problema', n, [a, b], `${nomeDe(b)} atravessa ${nomeDe(a)}: nada atravessa nada.`);
    // 23/10: a moldura do carrossel montado (MOLDURA) fica fora da escala, das palavras e do destaque, como no editor
    const textosVis = p.camadas.filter((c) => c.tipo === 'texto' && visivel(c) && tem(c.texto) && !MOLDURA.has(c.nome));
    const { titulo, maiores } = tituloDaEscala(textosVis);
    for (const c of p.camadas.filter(visivel)) {
      const k = uniao(ocupa(c));
      const naBase = ehCorteReto(c, assets) && coladoNaBase(k, doc);
      // 22/10 (Pedro): "a margem de segurança é apenas para os textos": imagem, ícone, forma e objeto podem estourar a borda
      if (c.tipo === 'texto' && !sangra(c, k, doc, assets) && fora(k, naBase ? areaAteABase : area)) add('area-segura', 'problema', n, [c], `${nomeDe(c)} sai da área segura (margem de ${area.esquerda} px nas laterais, ${area.topo} no topo e ${area.base} na base${ehCorteReto(c, assets) ? '; o busto de corte reto pode ficar colado na borda de baixo da página' : ''}).`);
      if (c.tipo === 'texto') {
        if (TEM_VISTO.test(c.texto)) add('visto', 'problema', n, [c], `${nomeDe(c)} tem um visto escrito: todo visto é o símbolo da marca inteiro.`);
        if (TRACOS_EXTRAS.test(c.texto) || HIFEN_SOLTO.test(c.texto)) add('travessao', 'problema', n, [c], `${nomeDe(c)} tem um traço solto que lê como travessão: troque por vírgula, ponto ou dois-pontos.`);
        const palavras = String(c.texto).replace(/\*/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
        if (c === titulo && (c.tamanho < t0 || c.tamanho > t1)) add('escala', 'alerta', n, [c], `${nomeDe(c)} (o título da página) tem ${Math.round(c.tamanho)} px: no ${escala.nome} o título vai de ${t0} a ${t1} px.`);
        else if (!maiores.has(c) && palavras >= 10 && (c.tamanho < c0 || c.tamanho > c1)) add('escala', 'alerta', n, [c], `${nomeDe(c)} (texto corrido) tem ${Math.round(c.tamanho)} px: no ${escala.nome} o corpo vai de ${c0} a ${c1} px.`);
        // só quando passa longe: a caixa do editor é medida no navegador, a conta aqui é aproximada
        if (alturaEstimada(c, { folga: 1.08 }) > c.altura * 1.3 + 4) add('texto-cabe', 'alerta', n, [c], `${nomeDe(c)} pode não caber na caixa: aumente a caixa ou diminua a letra.`);
        if (c.fonte === 'DM Serif Display' && !c.italico) add('dm-serif', 'alerta', n, [c], `${nomeDe(c)}: a DM Serif Display entra só itálica, como ênfase.`);
        if (c.tamanho < minimo && tem(c.texto)) add('letra-pequena', 'alerta', n, [c], `${nomeDe(c)} tem ${Math.round(c.tamanho)} px: abaixo de ${minimo} px some no celular.`);
        for (const k of [c.cor, c.corDestaque]) if (!PALETA.has(k.slice(0, 7))) add('paleta', 'alerta', n, [c], `${nomeDe(c)} usa ${k}, fora da paleta do design-guide.`);
      }
      if (c.tipo === 'imagem') {
        const a = assets.get(c.assetId);
        if (!a) {
          add('asset-sumiu', 'problema', n, [c], `${nomeDe(c)} usa um asset que não existe mais (${c.assetId}).`);
          continue;
        }
        const razao = a.largura && a.altura ? (c.largura / c.altura) / (a.largura / a.altura) : 1;
        if (ehSimbolo(a)) {
          // 22/10 (Pedro): espelhado ou girado também não é o símbolo (o visto ao contrário)
          if (Math.abs(razao - 1) > 0.03 || c.raio > 0 || c.espelhar === true || (Number(c.rotacao) || 0) !== 0 || k.x < 0 || k.y < 0 || k.x + k.w > doc.largura || k.y + k.h > doc.altura) {
            add('simbolo', 'problema', n, [c], `${nomeDe(c)}: o símbolo da marca fica inteiro, reto, sem espelhar, na proporção dele e sem canto cortado.`);
          }
        } else if (Math.abs(razao - 1) > 0.03 && !ehGrifo(c, assets) && !ehEfeitoDeFundo(c, assets)) {
          add('proporcao', 'alerta', n, [c], `${nomeDe(c)} está esticado: a imagem fica na proporção do asset.`);
        }
        if (pareceVisto(a)) add('simbolo', 'alerta', n, [c], `${nomeDe(c)} parece um visto: todo visto é o símbolo da marca (o do banco base), não outro ícone de check.`);
        // 24/10 (Pedro: "não estamos conseguindo exportar da qualidade que queremos"): a exportação é PNG em 2x
        // (ESCALA_EXPORTAR); imagem com original menor que o espaço que ocupa no PNG sai esticada e borrada. Luz e
        // efeito de fundo podem esticar
        const precisa = Math.round(c.largura * ESCALA_EXPORTAR);
        if (a.largura > 0 && precisa > a.largura * RESOLUCAO_FOLGA && !ehEfeitoDeFundo(c, assets)) {
          add('resolucao', 'alerta', n, [c], `${nomeDe(c)} vai sair borrada na exportação: o original tem ${a.largura} px de largura e no PNG ocupa ${precisa} px (${(precisa / a.largura).toFixed(1).replace('.', ',')}x maior). Troque por uma versão com pelo menos ${precisa} px ou diminua a imagem.`);
        }
      }
    }
    for (const [f, t] of barrinhasAntesDeTexto(p)) add('barrinha', 'problema', n, [f, t], `${nomeDe(f)} é uma barrinha antes de ${nomeDe(t)}: lê como travessão.`);
    // 22/10 (Pedro): MEI numa camada (a tag) e o contador em outra da mesma página escapavam da regra por frase. O
    // contador que fala do plano ME, o assistente virtual e a negação ("não precisa de contador") liberam
    const tMei = textosVis.filter((c) => /\bMEI\b/.test(c.texto));
    const tContador = textosVis.filter((c) => /contador/i.test(c.texto) && !/\bME\b|plano ME/.test(c.texto));
    const pagina = textosVis.map((c) => c.texto).join('\n');
    if (tMei.length && tContador.length && !/assistente virtual/i.test(pagina) && !/n[ãa]o (precisa|tem|existe|vai ter)[^.\n]{0,30}contador|sem contador/i.test(pagina)) {
      add('mei-contador', 'problema', n, [...new Set([...tMei, ...tContador])], 'A página fala de MEI e de contador: no MEI é o assistente virtual, nunca contador humano (P06). O contador com CRC é do plano ME.');
    }
    const palavras = palavrasDaPagina(p);
    if (palavras > LIMITE_PALAVRAS) add('palavras', 'alerta', n, [], `A página ${n} tem ${palavras} palavras: poucas palavras por página (até umas 25).`);
    // 22/10 (achado da revisão): uma cor de destaque por página, como no editor (modelo.js): no carrossel ela muda com o
    // fundo (coral no escuro, coral 600 no papel, ink no coral) e o design inteiro contava 3
    const destaques = new Set(textosVis.filter((c) => /\*[^*\n][^*]*\*/.test(c.texto)).map((c) => String(c.corDestaque).toLowerCase()));
    if (destaques.size > 1) add('destaque', 'alerta', n, [], `A página ${n} usa ${destaques.size} cores de destaque: uma só.`);
  });
  return out;
}

// 22/10 (Pedro): a revisão gravada no design tem teto (um design de 80 camadas sobrepostas em 20 páginas chegava a
// 65 mil achados e 20 MB por arquivo): os problemas primeiro, até 200 itens, e um último "e mais N"
function comTeto(lista, n = LIM.revisaoItens) {
  if (lista.length <= n) return lista;
  const ordenada = [...lista.filter((d) => d.nivel === 'problema'), ...lista.filter((d) => d.nivel !== 'problema')];
  return [...ordenada.slice(0, n - 1), { regra: 'mais', nivel: 'alerta', pagina: null, camadas: [], texto: `E mais ${ordenada.length - n + 1} achados: corrija os de cima e confira de novo.` }];
}

// a revisão inteira: os textos pela conferência do Ateliê (atelie.mjs), o design pelas regras acima e as fontes contra
// o FATOS.md (22/10, Pedro: fato só do FATOS.md, conferido)
export async function revisar(doc, { db = null, assets = new Map() } = {}) {
  const qa = await conferirAtelie(pecaDoDoc(doc, db), { db, reelId: doc.pecaId ?? null, meta: {} });
  const fatos = conferirFatos(doc, fontesDoDoc(doc, db), await lerFatos());
  const design = [...revisarDesign(doc, assets), ...fatos];
  const falhas = qa.itens.filter((i) => !i.ok).map((i) => ({ ...i, achados: i.achados.slice(0, LIM.achadosPorRegra) }));
  return {
    em: agora(),
    textos: { bloqueia: qa.bloqueia, contagem: qa.contagem, falhas },
    design: comTeto(design),
    contagem: {
      bloqueante: qa.contagem.bloqueante,
      problemas: design.filter((d) => d.nivel === 'problema').length,
      alertas: design.filter((d) => d.nivel === 'alerta').length + qa.contagem.alerta + qa.contagem.revisar,
    },
  };
}

// ---------- assets (o banco é do server/estudio-assets.mjs) ----------

let fonteInjetada = null;
// teste: a lista de assets sem o módulo de assets
export function definirFonteAssets(fn) {
  fonteInjetada = typeof fn === 'function' ? fn : null;
}
const listaDe = (r) => (Array.isArray(r) ? r : Array.isArray(r?.assets) ? r.assets : Array.isArray(r?.itens) ? r.itens : null);
// sem o módulo de assets (ou sem a função de listar), o catálogo da base e os arquivos de upload direto do disco
async function assetsDoDisco() {
  const out = [];
  try {
    const j = JSON.parse(await readFile(path.join(BASE_ESTUDIO, 'catalogo.json'), 'utf8'));
    out.push(...(listaDe(j) ?? []).map((a) => ({ origem: 'base', ...a })));
  } catch { /* sem catálogo neste servidor */ }
  try {
    const pasta = arquivoDados(path.join('estudio', 'assets'));
    const nomes = await readdir(pasta);
    const metas = new Map();
    for (const n of nomes.filter((x) => /^ast_[A-Za-z0-9_-]+\.json$/.test(x))) {
      try {
        const m = JSON.parse(await readFile(path.join(pasta, n), 'utf8'));
        if (m?.id) metas.set(m.id, m);
      } catch { /* metadado ilegível fica de fora */ }
    }
    for (const n of nomes) {
      const m = /^(ast_[A-Za-z0-9_-]+)\.(png|jpe?g|webp)$/i.exec(n);
      if (m && !out.some((a) => a.id === m[1])) out.push({ id: m[1], origem: 'upload', ...(metas.get(m[1]) ?? {}) });
    }
  } catch { /* sem upload ainda */ }
  return out;
}
// todos os assets (os ocultos também: o design que já usa um asset oculto segue valendo), na forma do contrato.
// 22/10 (Pedro): sem cache. O cache de 5 s recusava o design logo depois de subir uma imagem (400, "asset que não
// existe no banco") e o salvar automático mantinha ele sempre quente; o estudio-assets.mjs já guarda a base e o
// registro na memória, e a lista sai barata
export async function listarAssets() {
  let bruta = null;
  if (fonteInjetada) bruta = listaDe(await fonteInjetada());
  else {
    try {
      // estudio-assets.mjs: listar({ ocultos: true }) devolve a base (com a camada do time por cima) e os uploads
      const mod = await import('./estudio-assets.mjs');
      const fn = [mod.listar, mod.listarAssets].find((f) => typeof f === 'function');
      if (fn) bruta = listaDe(await fn({ ocultos: true }));
    } catch (e) {
      if (e?.code !== 'ERR_MODULE_NOT_FOUND') console.error('Lista de assets do estúdio:', e.message);
    }
    bruta ??= await assetsDoDisco();
  }
  const lista = (bruta ?? []).filter((a) => a && ID_ASSET.test(String(a.id))).map((a) => ({
    id: a.id, nome: umaLinha(a.nome) || a.id, categoria: String(a.categoria ?? 'outro'), tags: Array.isArray(a.tags) ? a.tags.map(String) : [],
    descricao: umaLinha(a.descricao), origem: a.origem === 'upload' ? 'upload' : 'base', largura: Number(a.largura) || null, altura: Number(a.altura) || null,
    oculto: a.oculto === true, tipo: a.tipo ?? null,
  }));
  return lista;
}
const mapaAssets = async () => new Map((await listarAssets()).map((a) => [a.id, a]));

// pro banco de assets: os designs que usam um asset (avisar antes de apagar um upload)
export async function usosDoAsset(assetId) {
  await pronto();
  return [...docs.values()].filter((d) => assetsDoDoc(d).has(assetId)).map((d) => ({ id: d.id, titulo: d.titulo }));
}

// ---------- disco ----------

async function gravarArquivo(destino, dados) {
  await mkdir(path.dirname(destino), { recursive: true });
  const tmp = `${destino}.${randomUUID()}.tmp`;
  await writeFile(tmp, typeof dados === 'string' ? dados : JSON.stringify(dados, null, 2), 'utf8');
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, destino);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) {
        await rm(tmp, { force: true }).catch(() => {});
        throw e;
      }
      await new Promise((ok) => setTimeout(ok, 60 * (i + 1)));
    }
  }
}
// rename com paciência: no Windows o antivírus segura o arquivo novo por um instante
async function mover(de, para) {
  for (let i = 0; ; i++) {
    try {
      return await rename(de, para);
    } catch (e) {
      if (i >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      await new Promise((ok) => setTimeout(ok, 60 * (i + 1)));
    }
  }
}
async function lerJsonOu(arquivo, padrao) {
  try {
    const txt = await readFile(arquivo, 'utf8');
    return txt.trim() ? JSON.parse(txt) : padrao;
  } catch (e) {
    if (e.code === 'ENOENT') return padrao;
    throw e;
  }
}
const arquivoDoDoc = (id) => path.join(PASTA_DOCS, `${id}.json`);
const pastaVersoes = (id) => path.join(PASTA_VERSOES, id);

// ---------- memória: os designs e as exportações (o servidor é um processo só) ----------

const docs = new Map();
const exportacoes = new Map();
// 22/10 (Pedro): o tamanho de cada design no disco (o teto de 150 MB do banco de designs)
const bytesDocs = new Map();
const somaBytes = () => {
  let n = 0;
  for (const b of bytesDocs.values()) n += b;
  return n;
};
let preparando = null;

async function carregarDocs() {
  docs.clear();
  let nomes = [];
  try {
    nomes = await readdir(PASTA_DOCS);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  for (const n of nomes) {
    const m = /^(est_[A-Za-z0-9_-]+)\.json$/.exec(n);
    if (!m) continue;
    try {
      const txt = await readFile(path.join(PASTA_DOCS, n), 'utf8');
      const d = JSON.parse(txt);
      if (d?.id === m[1] && Array.isArray(d.paginas)) {
        docs.set(d.id, d);
        bytesDocs.set(d.id, Buffer.byteLength(txt));
      } else console.error(`Design ${n} ignorado: o arquivo não tem a forma de um design.`);
    } catch (e) {
      // arquivo quebrado não é apagado nem regravado: fica pra alguém olhar
      console.error(`Design ${n} ilegível, ficou de fora:`, e.message);
    }
  }
  exportacoes.clear();
  let arqs = [];
  try {
    arqs = await readdir(PASTA_EXPORTACOES);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  for (const n of arqs) {
    const m = /^(exp_[A-Za-z0-9_-]+)\.json$/.exec(n);
    if (!m) continue;
    try {
      const x = JSON.parse(await readFile(path.join(PASTA_EXPORTACOES, n), 'utf8'));
      if (x?.id === m[1]) exportacoes.set(x.id, x);
    } catch (e) {
      console.error(`Exportação ${n} ilegível, ficou de fora:`, e.message);
    }
  }
}

// a primeira chamada ao estúdio carrega os designs e semeia os da base. Falha no disco não fica presa: tenta de novo.
// 22/10 (Pedro): e faz a faxina das exportações anexadas cuja peça sumiu (viram soltas, no teto de 10 do design)
export function pronto() {
  preparando ??= (async () => {
    docs.clear();
    bytesDocs.clear();
    await carregarDocs();
    await semear().catch((e) => console.error('Semeadura do estúdio:', e.message));
    await faxinaExportacoes(await carregar()).catch((e) => console.error('Faxina das exportações do estúdio:', e.message));
  })().catch((e) => {
    preparando = null;
    throw e;
  });
  return preparando;
}

// alterações de um mesmo design uma de cada vez (conferir a versão e gravar sem ninguém no meio)
const filas = new Map();
function emFila(id, fn) {
  const antes = filas.get(id) ?? Promise.resolve();
  const r = antes.then(fn);
  const fim = r.catch(() => {});
  filas.set(id, fim);
  fim.then(() => {
    if (filas.get(id) === fim) filas.delete(id);
  });
  return r;
}

// ---------- versões ----------

// 22/10 (Pedro): o editor salva sozinho a cada pausa (1,2 s). Edições seguidas da mesma pessoa em até 10 minutos viram
// uma versão só na lista (a última do bloco fica; a versão do design sobe a cada gravação, pro 409). Sem isso, as 20
// versões guardadas sumiam em meio minuto de arrasto. IA, restauração, importação e outra pessoa abrem versão nova
const JANELA_VERSAO = 10 * 60_000;
async function guardarVersao(doc, nota) {
  const pasta = pastaVersoes(doc.id);
  // 22/10 (Pedro): a versão guardada vai sem a revisão (a revisão é refeita quando a versão volta)
  const { revisao, ...semRevisao } = doc;
  await gravarArquivo(path.join(pasta, `${doc.versao}.json`), semRevisao);
  const indiceArq = path.join(pasta, 'indice.json');
  const indice = (await lerJsonOu(indiceArq, [])).filter((v) => Number.isInteger(v?.versao) && v.versao !== doc.versao);
  indice.sort((a, b) => a.versao - b.versao);
  const ultimo = indice.at(-1);
  const inicio = ultimo?.inicio ?? ultimo?.em;
  const juntar = ultimo && nota === 'Editado' && ultimo.nota === 'Editado' && ultimo.por === doc.atualizadoPor
    && Date.parse(doc.atualizadoEm) - Date.parse(inicio) < JANELA_VERSAO;
  const saem = [];
  if (juntar) saem.push(indice.pop());
  indice.push({ versao: doc.versao, em: doc.atualizadoEm, ...(juntar ? { inicio } : {}), por: doc.atualizadoPor, nota, titulo: doc.titulo, paginas: doc.paginas.length, origem: doc.origem });
  saem.push(...indice.splice(0, Math.max(0, indice.length - LIM.versoes)));
  await gravarArquivo(indiceArq, indice);
  for (const v of saem) await rm(path.join(pasta, `${v.versao}.json`), { force: true }).catch(() => {});
}

// 22/10 (Pedro): espaço livre antes de gravar um design (o disco cheio derrubava o salvar do db.json junto)
async function conferirEspacoDocs() {
  let livre;
  try {
    livre = await discoEstudio.livre(path.dirname(PASTA_ESTUDIO));
  } catch (e) {
    if (e.code === 'ENOENT') return;
    console.error('Espaço livre do estúdio não foi medido:', e.message);
    throw falha(503, 'Não deu pra conferir o espaço livre do servidor. Tente de novo em instantes.');
  }
  if (!Number.isFinite(livre) || livre - bytesSubindo < ESPACO_MIN) throw falha(507, 'O servidor está sem espaço pra arquivos agora: o design não foi gravado. Avise quem cuida do servidor.');
}
const MB = (n) => `${Math.round(n / 1024 / 1024)} MB`;

// grava o design (arquivo e memória) e a versão dele. 22/10 (Pedro): com os tetos do banco de designs (quantidade e
// tamanho) e o espaço livre do disco conferidos antes
async function gravarDoc(doc, nota, { db = null, assets = null } = {}) {
  const novo = !docs.has(doc.id);
  if (novo && docs.size >= limites.designs) throw falha(507, `O estúdio já tem ${limites.designs} designs: apague os que não usa (eles vão pra lixeira) antes de criar outro.`);
  doc.revisao = await revisar(doc, { db: db ?? (await carregar()), assets: assets ?? (await mapaAssets()) });
  const txt = JSON.stringify(doc, null, 2);
  const bytes = Buffer.byteLength(txt);
  if (somaBytes() - (bytesDocs.get(doc.id) ?? 0) + bytes > limites.bytesDocs) {
    throw falha(507, `O banco de designs passaria de ${MB(limites.bytesDocs)}: apague designs que não usa (eles vão pra lixeira) e tente de novo.`);
  }
  await conferirEspacoDocs();
  await mkdir(PASTA_DOCS, { recursive: true });
  await gravarArquivo(arquivoDoDoc(doc.id), txt);
  docs.set(doc.id, doc);
  bytesDocs.set(doc.id, bytes);
  await guardarVersao(doc, nota).catch((e) => console.error(`Versão ${doc.versao} de ${doc.id} não foi guardada:`, e.message));
  return doc;
}

// ---------- o design como a tela recebe ----------

const urlExportacao = (id) => `/api/estudio/exportacoes/${id}/arquivo`;
function resumoPeca(db, id) {
  const p = acharPeca(db, id);
  if (!p) return null;
  const r = p.item;
  return p.tipo === 'stories'
    ? { id: r.id, tipo: 'stories', titulo: tem(r.tema) ? `Story · ${String(r.tema).trim()}` : 'Story', data: r.data ?? '', peca: 'stories' }
    : { id: r.id, tipo: 'peca', titulo: r.ideia ?? '', data: r.data ?? '', peca: r.peca ?? 'reel' };
}
export const docParaTela = (d) => ({ ...d, areaSegura: areaSegura(d) });
const exportacaoParaTela = (x) => ({ ...x, url: urlExportacao(x.id) });
function resumoDoc(db, d) {
  const exps = [...exportacoes.values()].filter((x) => x.docId === d.id).sort((a, b) => String(b.em).localeCompare(String(a.em)));
  const capa = exps.find((x) => x.pagina === 1 && x.formato !== 'pdf');
  return {
    id: d.id, titulo: d.titulo, formato: d.formato, largura: d.largura, altura: d.altura, nPaginas: d.paginas.length, capa: d.paginas[0] ?? null,
    pecaId: d.pecaId ?? null, peca: d.pecaId ? resumoPeca(db, d.pecaId) : null, origem: d.origem, estrategia: d.estrategia ?? null, versao: d.versao,
    criadoEm: d.criadoEm, criadoPor: d.criadoPor, atualizadoEm: d.atualizadoEm, atualizadoPor: d.atualizadoPor,
    miniatura: capa ? urlExportacao(capa.id) : null, exportacoes: exps.length, revisao: d.revisao?.contagem ?? null, areaSegura: areaSegura(d),
  };
}

// ---------- CRUD ----------

const autorDe = (u) => u?.nome ?? null;
function acharDoc(id) {
  const d = ehDoc(id) ? docs.get(id) : null;
  if (!d) throw falha(404, MSG_SEM_DOC);
  return d;
}

async function listarDocs(url) {
  const db = await carregar();
  const pecaId = url.searchParams.get('pecaId');
  const lista = [...docs.values()].filter((d) => !pecaId || d.pecaId === pecaId)
    .sort((a, b) => String(b.atualizadoEm ?? '').localeCompare(String(a.atualizadoEm ?? '')));
  return { docs: lista.map((d) => resumoDoc(db, d)) };
}

async function criarDoc(b, u, { origem = 'manual', nota = 'Criado', extra = {} } = {}) {
  const db = await carregar();
  const assets = await mapaAssets();
  const conteudo = validarDocumento(b, { db, assets });
  const quando = agora();
  const doc = {
    id: extra.id ?? novoId('est'), ...conteudo, origem, versao: 1, criadoEm: quando, criadoPor: autorDe(u), atualizadoEm: quando, atualizadoPor: autorDe(u),
    ...semCampos(extra, ['id']),
  };
  return gravarDoc(doc, nota, { db, assets });
}
const semCampos = (o, ks) => Object.fromEntries(Object.entries(o).filter(([k]) => !ks.includes(k)));

function conferirVersao(d, versao) {
  if (versao == null || versao === '') throw falha(400, 'Mande a versão do design que você abriu (versao).');
  if (!Number.isInteger(Number(versao)) || Number(versao) !== d.versao) {
    throw Object.assign(falha(409, MSG_CONFLITO), { versaoAtual: d.versao });
  }
}

// os campos do servidor não vêm da tela: o resto passa pela validação (o que não veio fica como está)
const DO_SERVIDOR = ['id', 'versao', 'origem', 'criadoEm', 'criadoPor', 'atualizadoEm', 'atualizadoPor', 'revisao', 'areaSegura', 'duplicadoDe', 'origemArquivo'];
async function editarDoc(id, b, u) {
  return emFila(id, async () => {
    const d = acharDoc(id);
    conferirVersao(d, b?.versao);
    const db = await carregar();
    const assets = await mapaAssets();
    const conteudo = validarDocumento(semCampos(objeto(b), DO_SERVIDOR), { atual: d, db, assets });
    const novo = { ...d, ...conteudo, versao: d.versao + 1, atualizadoEm: agora(), atualizadoPor: autorDe(u) };
    return gravarDoc(novo, 'Editado', { db, assets });
  });
}

// 22/10 (Pedro): apagar manda pra lixeira (data/estudio/lixeira/<id>/doc.json e versoes/), que guarda os 100 últimos.
// O design que veio da base do repo (importado, os Destaques) só a gestão apaga: o operador não apaga a base do repo
// (como os assets da base, que só escondem). A semente apagada continua sem voltar sozinha; a lixeira traz de volta
const pastaNaLixeira = (id) => path.join(PASTA_LIXEIRA, id);
async function apagarDoc(id, u) {
  return emFila(id, async () => {
    const d = acharDoc(id);
    // 22/10 (achado da revisão): conferido pela semente, não pela origem (o design da base refeito pela IA vira 'ia')
    if (d.origemArquivo && !auth.ehGestao(u)) {
      throw falha(403, 'Esse design veio da base do repo (importado): só Admin ou Gerente de Marketing apaga.');
    }
    const destino = pastaNaLixeira(d.id);
    await rm(destino, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    await mkdir(destino, { recursive: true });
    await gravarArquivo(path.join(destino, 'info.json'), { id: d.id, titulo: d.titulo, formato: d.formato, origem: d.origem, pecaId: d.pecaId ?? null, apagadoEm: agora(), apagadoPor: autorDe(u) });
    await mover(arquivoDoDoc(d.id), path.join(destino, 'doc.json'));
    docs.delete(d.id);
    bytesDocs.delete(d.id);
    await mover(pastaVersoes(d.id), path.join(destino, 'versoes')).catch((e) => {
      if (e.code !== 'ENOENT') console.error(`Design ${d.id} foi pra lixeira, mas as versões ficaram:`, e.message);
    });
    // a exportação que é arte de uma peça fica (a peça segue mostrando); a solta sai junto
    for (const x of [...exportacoes.values()].filter((e) => e.docId === d.id && !e.pecaId)) await apagarExportacao(x);
    await podarLixeira().catch((e) => console.error('Lixeira do estúdio:', e.message));
    return { ok: true, lixeira: true };
  });
}
async function itensDaLixeira() {
  let nomes = [];
  try {
    nomes = await readdir(PASTA_LIXEIRA);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const out = [];
  for (const n of nomes.filter((x) => ehDoc(x))) {
    const info = await lerJsonOu(path.join(pastaNaLixeira(n), 'info.json'), null).catch(() => null);
    if (info?.id === n) out.push(info);
  }
  return out.sort((a, b) => String(b.apagadoEm).localeCompare(String(a.apagadoEm)));
}
// a lixeira guarda os 100 apagados mais recentes
async function podarLixeira() {
  for (const x of (await itensDaLixeira()).slice(LIM.lixeira)) await rm(pastaNaLixeira(x.id), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
async function listarLixeira() {
  return { docs: (await itensDaLixeira()).map(({ id, titulo, formato, origem, pecaId, apagadoEm, apagadoPor }) => ({ id, titulo, formato, origem, pecaId, apagadoEm, apagadoPor })) };
}
// volta da lixeira como versão nova (a revisão é refeita); o id e as versões de antes voltam junto
async function restaurarDaLixeira(id, u) {
  if (!ehDoc(id)) throw falha(404, 'Esse design não está na lixeira.');
  return emFila(id, async () => {
    if (docs.has(id)) throw falha(409, 'Já existe um design com esse id.');
    const pasta = pastaNaLixeira(id);
    const d = await lerJsonOu(path.join(pasta, 'doc.json'), null).catch(() => null);
    if (d?.id !== id || !Array.isArray(d.paginas)) throw falha(404, 'Esse design não está na lixeira.');
    await mover(path.join(pasta, 'versoes'), pastaVersoes(id)).catch((e) => {
      if (e.code !== 'ENOENT') console.error(`As versões de ${id} ficaram na lixeira:`, e.message);
    });
    const db = await carregar();
    const assets = await mapaAssets();
    const conteudo = validarDocumento(semCampos(d, DO_SERVIDOR), { atual: d, db, assets });
    const salvo = await gravarDoc({ ...d, ...conteudo, versao: d.versao + 1, atualizadoEm: agora(), atualizadoPor: autorDe(u) }, 'Restaurado da lixeira', { db, assets });
    await rm(pasta, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    return salvo;
  });
}

async function duplicarDoc(id, u) {
  const d = acharDoc(id);
  const copia = semCampos(structuredClone(d), [...DO_SERVIDOR]);
  copia.titulo = curto(`${d.titulo} (cópia)`, LIM.titulo);
  for (const p of copia.paginas) {
    delete p.id;
    for (const c of p.camadas) delete c.id;
  }
  // a cópia é uma variação do mesmo design: os assets dele seguem valendo mesmo se algum sumiu do banco
  const db = await carregar();
  const assets = await mapaAssets();
  const conteudo = validarDocumento(copia, { db, assets, atual: { paginas: d.paginas } });
  const quando = agora();
  const doc = {
    id: novoId('est'), ...conteudo, origem: 'manual', versao: 1, criadoEm: quando, criadoPor: autorDe(u), atualizadoEm: quando, atualizadoPor: autorDe(u),
    duplicadoDe: d.id,
  };
  return gravarDoc(doc, `Duplicado de "${curto(d.titulo, 60)}"`, { db, assets });
}

// ---------- design da peça do cronograma ----------
// 23/10 (Pedro: "não tem opção de levar o post para o Ateliê criar, cria essa integração"): o "Criar no Ateliê" do
// painel da peça e dos stories abre o design ligado a ela; sem nenhum, o servidor monta um com os modelos do repo
// (estudio/base/modelos) e o texto que a peça já tem, sem IA, ligado à peça (a arte exportada vai pra ela e pra
// aprovação). O carrossel sai do estudio-carrossel.mjs, no visual da skill carrossel (23/10, ver lá); o estático vira a
// dica com título, apoio e o card da CTA; os stories, um quadro por página (o quadro longo: a primeira frase no título e
// o resto no card); o reel, a capa em stories. No estático e nos stories, o texto novo fica na letra do modelo (o título
// mais longo desce até o mínimo da escala do título; o texto corrido fica na escala do corpo) e a caixa cresce com ele;
// o card acompanha o texto de dentro; o que a peça não tem sai do modelo (camada vazia e card sem texto não ficam). No
// fim, a mesma correção do design da IA (corrigirDesign): nada atravessa nada e o texto fica na área segura. A pílula
// do público sai do modelo (23/10, Pedro: a tag ME / MEI fica no banco, como asset, e não vai por padrão)
const MODELO_DA_PECA = { estatico: 'estatico-dica', stories: 'stories-dica' };
const LIM_PAGINAS_DA_PECA = 12;
const palavrasDe = (t) => String(t ?? '').replace(/\*/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const linhasDe = (c) => quebrarLinhas(c).larguras.length;
function trocarTextoDoModelo(c, texto, escala) {
  const linhasAntes = linhasDe(c);
  c.texto = String(texto ?? '').trim();
  if (c.fundo) {
    // a pílula fica numa linha só, na largura do texto novo
    const { larguras, pad } = quebrarLinhas({ ...c, largura: LIM.coord });
    c.largura = Math.ceil(larguras.reduce((m, w) => Math.max(m, w), 0) * 1.04 + pad);
  } else if (c.nome === 'Título') {
    const piso = Math.min(c.tamanho, escala.titulo[0]);
    while (c.tamanho > piso && linhasDe(c) > linhasAntes + 1) c.tamanho = Math.max(piso, Math.floor(c.tamanho * 0.94));
  } else if (palavrasDe(c.texto) >= 10) {
    c.tamanho = Math.min(Math.max(c.tamanho, escala.corpo[0]), escala.corpo[1]);
  }
  c.altura = alturaEstimada(c);
}
const dentroDaCaixa = (c, k) => c.x >= k.x - 1 && c.y >= k.y - 1 && c.x + c.largura <= k.x + k.largura + 1 && c.y + c.altura <= k.y + k.altura + 1;
// a página 1 do modelo com o texto da peça: textos[nome da camada] = texto ('' tira a camada)
function paginaDoModelo(modelo, textos, escala) {
  const p = structuredClone(modelo.doc.paginas[0]);
  delete p.id;
  // o card e o que está dentro dele no modelo, com a folga de baixo: com o texto novo, ele cresce ou encolhe junto
  const card = p.camadas.find((c) => c.tipo === 'forma' && c.nome === 'Card');
  const doCard = card ? p.camadas.filter((c) => c !== card && dentroDaCaixa(c, card)) : [];
  const fundoDe = (cs) => cs.reduce((m, c) => Math.max(m, c.y + c.altura), -Infinity);
  const folgaCard = doCard.length ? card.y + card.altura - fundoDe(doCard) : 0;
  let camadas = [];
  for (const c of p.camadas) {
    if (c.tipo === 'texto' && Object.hasOwn(textos, c.nome)) {
      if (!tem(textos[c.nome])) continue;
      trocarTextoDoModelo(c, textos[c.nome], escala);
    }
    camadas.push(c);
  }
  if (card) {
    const ficou = doCard.filter((c) => camadas.includes(c));
    // o card só faz sentido com o texto dele: sem texto dentro, sai o card e o ícone
    if (!ficou.some((c) => c.tipo === 'texto')) camadas = camadas.filter((c) => c !== card && !doCard.includes(c));
    else card.altura = Math.round(fundoDe(ficou) + folgaCard - card.y);
  }
  for (const c of camadas) delete c.id;
  p.camadas = camadas;
  return p;
}
// o quadro longo do story: a primeira frase (curta) vira o título e o resto vai pro card; sem frase curta, tudo no título
function partirQuadro(t, max = 80) {
  const s = String(t ?? '').trim();
  if (s.length <= max) return [s, ''];
  const m = s.match(/^(.{8,}?[.!?:])\s+(\S[\s\S]*)$/u);
  return m && m[1].length <= max ? [m[1], m[2].trim()] : [s, ''];
}
const tipoDaPeca = (achado) => (achado.tipo === 'stories' ? 'stories' : (achado.item.peca ?? 'reel'));
export async function designDaPeca(pecaId, u) {
  const db = await carregar();
  const achado = acharPeca(db, pecaId);
  if (!achado) throw falha(404, 'Essa peça não existe mais.');
  const p = achado.item;
  // 23/10 (Pedro tentou com o post de ontem, já postado): a peça postada também monta; a arte exportada dela não se
  // anexa na peça (anexarNaPeca), fica solta no design
  const peca = tipoDaPeca(achado);
  const rotulo = { carrossel: 'Carrossel', estatico: 'Estático', stories: 'Story', reel: 'Capa do reel' }[peca] ?? 'Peça';
  const titulo = curto(`${rotulo} · ${umaLinha(peca === 'stories' ? p.tema : p.ideia) || 'sem título'}`, LIM.titulo);
  const montado = await montarPaginasDaPeca(p, peca, await mapaAssets(), db);
  return criarDoc({ titulo, ...montado, pecaId: p.id }, u, { nota: 'Montado da peça do cronograma' });
}
// 23/10 (Pedro: "extremamente genéricos"): o design que já existe também troca pro visual novo. POST
// /api/estudio/docs/:id/remontar { versao } (o "Remontar com o texto da peça" do painel Vincular do editor) troca as
// páginas do design ligado a uma peça pelas montadas de novo com o texto dela, como uma versão nova: a de agora fica em
// Versões. O título, a estratégia e as fontes do design ficam
async function remontarDaPeca(id, b, u) {
  return emFila(id, async () => {
    const d = acharDoc(id);
    if (b?.versao != null && b.versao !== '') conferirVersao(d, b.versao);
    if (!d.pecaId) throw falha(409, 'Esse design não está ligado a nenhuma peça: vincule uma antes de remontar.');
    const db = await carregar();
    const achado = acharPeca(db, d.pecaId);
    if (!achado) throw falha(404, 'A peça ligada a esse design não existe mais.');
    const assets = await mapaAssets();
    const montado = await montarPaginasDaPeca(achado.item, tipoDaPeca(achado), assets, db);
    const conteudo = validarDocumento({ titulo: d.titulo, ...montado, estrategia: d.estrategia ?? null, fontes: d.fontes ?? [], notas: d.notas ?? '' }, { atual: d, db, assets });
    const novo = { ...d, ...conteudo, versao: d.versao + 1, atualizadoEm: agora(), atualizadoPor: autorDe(u) };
    return gravarDoc(novo, 'Remontado com o texto da peça', { db, assets });
  });
}
// as páginas da peça já corrigidas, no formato delas: { formato, largura, altura, paginas } (o paginasDaPeca mais abaixo
// é outra coisa: quantas páginas a IA gera pra peça)
async function montarPaginasDaPeca(p, peca, assets, db) {
  // 23/10 (Pedro: "extremamente genéricos, preciso que ele seja criado de acordo com a skill MazyOS"): o carrossel sai
  // do estudio-carrossel.mjs, no visual da skill carrossel (o "Giro Legalizaí" e o "5 sinais" de 01/09, alternando)
  if (peca === 'carrossel') {
    const feed = { formato: 'feed45', largura: FORMATOS.feed45.largura, altura: FORMATOS.feed45.altura };
    const paginas = montarCarrossel(p, {
      alturaEstimada, quebrarLinhas, assets, bloco: p.bloco ?? blocoDoPilar(p.pilar), maxSlides: LIM_PAGINAS_DA_PECA - 2,
      variante: varianteDoCarrossel(db, p),
    });
    return { ...feed, paginas: corrigirDesign({ ...feed, paginas }, assets).paginas };
  }
  const modelos = new Map((await listarModelos()).map((m) => [m.id, m]));
  const modelo = (id) => {
    const m = modelos.get(id);
    if (!m) throw falha(503, `O modelo ${id} não está no repo (estudio/base/modelos).`);
    return m;
  };
  const pilula = (m, texto) => {
    const nome = m.doc.paginas[0].camadas.find((c) => c.tipo === 'texto' && /^p[ií]lula/i.test(c.nome ?? ''))?.nome;
    return nome ? { [nome]: texto } : {};
  };
  const base = modelo(peca === 'estatico' ? MODELO_DA_PECA.estatico : MODELO_DA_PECA.stories);
  const escala = base.doc.altura / base.doc.largura >= 1.7 ? ESCALA_TEXTO.stories : ESCALA_TEXTO.feed;
  const pagina = (m, textos) => paginaDoModelo(m, textos, escala);
  let paginas;
  if (peca === 'estatico') {
    const e = p.estatico ?? {};
    // 23/10 (Pedro): a tag do público não vai mais por padrão (está no banco, como asset)
    paginas = [pagina(base, { 'Título': e.headline || p.ideia, 'Corpo': e.apoio ?? '', 'Fonte': '', 'Texto do card': e.cta ?? '', ...pilula(base, '') })];
  } else {
    // stories: um quadro por página; reel: a capa, em stories
    const quadros = peca === 'stories' ? (p.quadros ?? []).filter((q) => tem(q?.texto)).slice(0, LIM_PAGINAS_DA_PECA) : [];
    const textos = quadros.length ? quadros.map((q) => q.texto) : [peca === 'stories' ? p.tema || 'Story' : p.roteiro?.hook || p.ideia];
    paginas = textos.map((t) => {
      const [tituloQ, resto] = partirQuadro(t);
      return pagina(base, { 'Título': tituloQ, 'Dica': resto, 'Detalhe': '', ...pilula(base, '') });
    });
  }
  // a mesma correção do design da IA: a caixa do texto, a área segura dos textos e nada atravessando nada
  const medida = { formato: base.doc.formato, largura: base.doc.largura, altura: base.doc.altura };
  return { ...medida, paginas: corrigirDesign({ ...medida, paginas }, assets).paginas };
}

async function listarVersoes(id) {
  const d = acharDoc(id);
  const indice = await lerJsonOu(path.join(pastaVersoes(d.id), 'indice.json'), []);
  return { atual: d.versao, versoes: indice.filter((v) => Number.isInteger(v?.versao)).sort((a, b) => b.versao - a.versao).map((v) => ({ ...v, atual: v.versao === d.versao })) };
}

async function restaurarVersao(id, n, b, u) {
  if (!/^\d{1,9}$/.test(String(n))) throw falha(404, 'Essa versão não existe.');
  return emFila(id, async () => {
    const d = acharDoc(id);
    if (b?.versao != null && b.versao !== '') conferirVersao(d, b.versao);
    let antiga;
    try {
      antiga = JSON.parse(await readFile(path.join(pastaVersoes(d.id), `${Number(n)}.json`), 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') throw falha(404, `A versão ${Number(n)} não está mais guardada (ficam as ${LIM.versoes} últimas).`);
      throw e;
    }
    const db = await carregar();
    const assets = await mapaAssets();
    // a ligação com a peça é a de agora (restaurar volta o desenho, não muda de peça)
    const conteudo = validarDocumento(
      { titulo: antiga.titulo, formato: antiga.formato, largura: antiga.largura, altura: antiga.altura, paginas: antiga.paginas, estrategia: antiga.estrategia ?? null, fontes: antiga.fontes ?? [], notas: antiga.notas ?? '' },
      { atual: { ...d, paginas: [...(antiga.paginas ?? []), ...d.paginas] }, db, assets },
    );
    const novo = { ...d, ...conteudo, versao: d.versao + 1, atualizadoEm: agora(), atualizadoPor: autorDe(u) };
    return gravarDoc(novo, `Restaurado da versão ${Number(n)}`, { db, assets });
  });
}

// ---------- semeadura (estudio/base/docs/*.json do repo) ----------

const hashDe = (txt) => createHash('sha256').update(txt).digest('hex').slice(0, 16);
// devolve quantos designs entraram ou mudaram
export async function semear() {
  const pasta = path.join(BASE_ESTUDIO, 'docs');
  let nomes;
  try {
    nomes = (await readdir(pasta)).filter((n) => /\.json$/i.test(n)).sort();
  } catch (e) {
    if (e.code === 'ENOENT') return 0;
    throw e;
  }
  const registro = await lerJsonOu(ARQ_SEMEADOS, {});
  // 22/10 (Pedro): o registro é gravado a cada semente que entra ou muda (queda no meio não duplica os Destaques)
  const gravarRegistro = () => gravarArquivo(ARQ_SEMEADOS, registro);
  let mudou = 0;
  for (const nome of nomes) {
    let txt;
    let j;
    try {
      txt = await readFile(path.join(pasta, nome), 'utf8');
      j = JSON.parse(txt);
    } catch (e) {
      console.error(`Semente ${nome} ilegível:`, e.message);
      continue;
    }
    const itens = Array.isArray(j) ? j : Array.isArray(j?.docs) ? j.docs : [j];
    for (const [i, item] of itens.entries()) {
      const chave = itens.length > 1 ? `docs/${nome}#${i + 1}` : `docs/${nome}`;
      const hash = hashDe(JSON.stringify(item));
      const reg = registro[chave];
      try {
        if (!reg) {
          const origemArquivo = `estudio/base/${chave}`;
          // o design desta semente que já existe (a queda veio antes de gravar o registro) é adotado, não duplicado
          const adotado = [...docs.values()].find((d) => d.origemArquivo === origemArquivo);
          if (adotado) {
            registro[chave] = { docId: adotado.id, hash, versao: adotado.versao, em: adotado.criadoEm };
            await gravarRegistro();
            continue;
          }
          // a semente sem id ganha um fixo, do nome do arquivo (est_base_comece-por-aqui-01)
          const fixo = ehDoc(item?.id) ? item.id : `est_base_${chave.replace(/^docs\//, '').replace(/\.json(#\d+)?$/i, (_, n) => (n ? `-${n.slice(1)}` : '')).replace(/[^A-Za-z0-9_-]/g, '-')}`.slice(0, 68);
          const id = ehDoc(fixo) && !docs.has(fixo) ? fixo : undefined;
          const doc = await criarDoc(semCampos(objeto(item), DO_SERVIDOR), { nome: AUTOR_SEMENTE }, {
            origem: 'importado', nota: `Importado de ${origemArquivo}`, extra: { ...(id ? { id } : {}), origemArquivo },
          });
          registro[chave] = { docId: doc.id, hash, versao: doc.versao, em: doc.criadoEm };
          await gravarRegistro();
          mudou++;
          continue;
        }
        if (reg.hash === hash) continue;
        const d = docs.get(reg.docId);
        // apagado pela equipe: não volta. Editado depois da importação: fica como a equipe deixou
        if (d && d.versao === reg.versao) {
          await emFila(d.id, async () => {
            const db = await carregar();
            const assets = await mapaAssets();
            const conteudo = validarDocumento(semCampos(objeto(item), DO_SERVIDOR), { atual: d, db, assets });
            const novo = { ...d, ...conteudo, versao: d.versao + 1, atualizadoEm: agora(), atualizadoPor: AUTOR_SEMENTE };
            await gravarDoc(novo, `Atualizado de estudio/base/${chave}`, { db, assets });
            registro[chave] = { ...reg, hash, versao: novo.versao };
          });
          await gravarRegistro();
          mudou++;
        } else {
          if (d) console.log(`Semente ${chave} mudou no repo, mas o design "${d.titulo}" já foi editado: ficou como está.`);
          registro[chave] = { ...reg, hash };
        }
      } catch (e) {
        // fica fora do registro: tenta de novo no próximo boot
        console.error(`Semente ${chave} não entrou: ${e.message}`);
      }
    }
  }
  await gravarRegistro();
  if (mudou) console.log(`Estúdio: ${mudou} ${mudou === 1 ? 'design da base entrou ou mudou' : 'designs da base entraram ou mudaram'}.`);
  return mudou;
}

// ---------- exportações ----------

const EXPORTAVEIS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'application/pdf': 'pdf' };
const TIPO_DO_FORMATO = { png: 'image/png', jpg: 'image/jpeg', pdf: 'application/pdf' };
const ROTULO_FORMATO = { png: 'PNG', jpg: 'JPG', pdf: 'PDF' };
let bytesSubindo = 0;
const exportandoPorDoc = new Map();

const caminhoExportacao = (x) => {
  if (!ehExportacao(x?.id) || !Object.hasOwn(TIPO_DO_FORMATO, x?.formato)) return null;
  const p = path.join(PASTA_EXPORTACOES, `${x.id}.${x.formato}`);
  return dentroDe(p, PASTA_EXPORTACOES) ? p : null;
};
async function apagarExportacao(x) {
  exportacoes.delete(x.id);
  const p = caminhoExportacao(x);
  if (p) await rm(p, { force: true, maxRetries: 3, retryDelay: 100 }).catch((e) => console.error(`Exportação ${x.id} ficou no disco:`, e.message));
  await rm(path.join(PASTA_EXPORTACOES, `${x.id}.json`), { force: true }).catch(() => {});
}

function lerPagina(bruto, doc) {
  const v = String(Array.isArray(bruto) ? bruto[0] : bruto ?? '').trim().toLowerCase();
  if (!v) {
    if (doc.paginas.length === 1) return 1;
    throw falha(400, 'Diga a página exportada (x-pagina: o número da página ou todas).');
  }
  if (v === 'todas') return 'todas';
  if (!/^\d{1,3}$/.test(v) || Number(v) < 1 || Number(v) > doc.paginas.length) throw falha(400, `A página exportada precisa ser de 1 a ${doc.paginas.length} (ou todas).`);
  return Number(v);
}
function lerFormato(bruto) {
  const v = String(Array.isArray(bruto) ? bruto[0] : bruto ?? '').trim().toLowerCase().replace(/^image\/|^application\//, '');
  if (!v) return null;
  const f = { png: 'png', jpg: 'jpg', jpeg: 'jpg', pdf: 'pdf' }[v];
  if (!f) throw falha(400, 'O formato da exportação precisa ser png, jpg ou pdf.');
  return f;
}

// a arte nova numa peça que está na aprovação: aprovada vira 'alterado'; pendente que algum gerente já aprovou volta
// pros gerentes (a regra do aprovacoes.conferirMudancaAprovada, que compara só os campos de texto da peça)
function arteNaAprovacao(p, u) {
  const ap = p.aprovacao;
  const estado = ap?.estado;
  if (estado !== 'aprovado' && estado !== 'pendente') return false;
  const registrar = (texto) => {
    ap.conversa = Array.isArray(ap.conversa) ? ap.conversa : [];
    ap.conversa.push({ id: novoId('apv'), em: agora(), tipo: 'alterado', autor: u?.nome ?? 'Sistema', autorId: u?.id ?? null, papel: u ? auth.papelDe(u) : 'sistema', texto, mudou: ['arte'] });
    if (ap.conversa.length > 300) ap.conversa.splice(0, ap.conversa.length - 300);
  };
  if (estado === 'aprovado') {
    ap.estado = 'alterado';
    registrar('A arte mudou depois de aprovada: mande de novo pra aprovação');
    return true;
  }
  const gerentes = auth.gerentesAtivos();
  const etapaAntes = auth.etapaDaAprovacao(ap, gerentes);
  if (!gerentes.length || (etapaAntes === 'gerentes' && !auth.aprovaramGerentes(ap).length)) return false;
  Object.assign(ap, { etapa: 'gerentes', gerentes: { aprovaram: [] } });
  // 22/10 (Pedro): como no texto (aprovacoes.conferirMudancaAprovada), a observação que um gerente deixou ao aprovar a
  // arte de antes não vale mais: fica anulada (o painel não mostra) e o texto segue na conversa, como histórico. A
  // regra está repetida aqui porque o aprovacoes.mjs ainda não exporta o caminho dela (fica pra quando ele exportar)
  for (const o of Array.isArray(ap.observacoes) ? ap.observacoes : []) {
    if (o && o.etapa === 'gerentes' && Number(o.rodada ?? 1) === Number(ap.rodada ?? 1) && !o.anulada) o.anulada = agora();
  }
  registrar('A arte mudou durante a aprovação: volta pros gerentes aprovarem de novo');
  return true;
}

// 22/10 (Pedro): a arte que a peça já tem desta mesma versão do design cobre a página exportada (a mesma página, ou o
// PDF com todas). Reexportar a mesma versão em outra escala ou formato (PNG, JPG, PDF) não muda o desenho: a aprovação
// fica como está. Arte antiga sem versaoDoc usa a da exportação
function mesmaVersaoNaPeca(artes, doc, x) {
  const daVersao = artes.filter((a) => a.docId === doc.id && (a.versaoDoc ?? exportacoes.get(a.id)?.versaoDoc) === x.versaoDoc);
  if (x.pagina === 'todas') {
    return daVersao.some((a) => a.pagina === 'todas') || doc.paginas.every((_, i) => daVersao.some((a) => a.pagina === i + 1));
  }
  return daVersao.some((a) => a.pagina === x.pagina || a.pagina === 'todas');
}

// a exportação vira arte da peça do design: a da mesma página e formato sai (é substituída). Quem chama faz isso em
// fila por peça (duas exportações juntas não tiram uma a outra da peça)
async function anexarNaPeca(doc, x, u) {
  const db = await carregar();
  const achado = acharPeca(db, doc.pecaId);
  if (!achado) return { anexada: false, aviso: 'A peça ligada a este design não existe mais: a arte não foi anexada.' };
  const p = achado.item;
  if (p.status === 'publicado') return { anexada: false, aviso: 'A peça já foi postada: a arte não foi anexada.' };
  const artes = (Array.isArray(p.artes) ? p.artes : []).filter((a) => a && typeof a === 'object' && ehExportacao(a.id));
  const mesmoDesenho = mesmaVersaoNaPeca(artes, doc, x);
  const saem = artes.filter((a) => a.docId === doc.id && a.pagina === x.pagina && a.formato === x.formato);
  const ficam = artes.filter((a) => !saem.includes(a));
  ficam.push({ id: x.id, docId: doc.id, pagina: x.pagina, formato: x.formato, url: urlExportacao(x.id), em: x.em, por: x.por, versaoDoc: x.versaoDoc });
  const sobra = ficam.splice(0, Math.max(0, ficam.length - LIM.artesPorPeca));
  p.artes = ficam;
  p.atualizadoEm = agora();
  p.atualizadoPor = autorDe(u);
  const aprovacao = mesmoDesenho ? false : arteNaAprovacao(p, u);
  await salvar();
  for (const a of [...saem, ...sobra]) {
    const velha = exportacoes.get(a.id);
    if (velha) await apagarExportacao(velha);
  }
  return { anexada: true, pecaId: p.id, tipo: achado.tipo, substituidas: saem.map((a) => a.id), aprovacao: aprovacao ? p.aprovacao.estado : null, ...(mesmoDesenho ? { mesmaVersao: true } : {}) };
}

// 22/10 (Pedro): a faxina das exportações anexadas: a que aponta pra uma peça que não existe mais, ou que não está mais
// nas artes dela, vira solta (pecaId null) e entra no teto de 10 soltas do design; a solta de design que não existe
// mais (nem na lixeira) sai do disco. Roda no boot e a cada exportação
async function faxinaExportacoes(db) {
  const naLixeira = new Set((await itensDaLixeira().catch(() => [])).map((x) => x.id));
  const docsTocados = new Set();
  for (const x of [...exportacoes.values()]) {
    if (x.pecaId) {
      const p = acharPeca(db, x.pecaId)?.item;
      if (p && Array.isArray(p.artes) && p.artes.some((a) => a?.id === x.id)) continue;
      x.pecaId = null;
      await gravarArquivo(path.join(PASTA_EXPORTACOES, `${x.id}.json`), x).catch((e) => console.error(`Exportação ${x.id}:`, e.message));
      docsTocados.add(x.docId);
    }
    if (!x.pecaId && !docs.has(x.docId) && !naLixeira.has(x.docId)) await apagarExportacao(x);
  }
  for (const id of docsTocados) await podarSoltas(id);
}
// sem peça: ficam as 10 mais recentes de cada design
async function podarSoltas(docId) {
  const soltas = [...exportacoes.values()].filter((e) => e.docId === docId && !e.pecaId).sort((a, b) => String(b.em).localeCompare(String(a.em)));
  for (const velha of soltas.slice(LIM.exportacoesSoltas)) await apagarExportacao(velha);
}
// o bloqueante da conferência do Ateliê na copy do design (o último gravado): não exporta nem anexa
function conferirSemBloqueante(doc) {
  if (!doc.revisao?.textos?.bloqueia) return;
  const nomes = (doc.revisao.textos.falhas ?? []).filter((f) => f.nivel === 'bloqueante').map((f) => f.nome);
  throw falha(409, `Tem bloqueante na copy (${nomes.join(', ') || 'regra dura'}): corrija antes de exportar ou anexar na peça.`);
}

async function conferirEspaco() {
  let livre;
  try {
    // 23/10: pela mesma porta do design (discoEstudio), que o teste troca pelo disco folgado
    livre = await discoEstudio.livre(PASTA_EXPORTACOES);
  } catch (e) {
    console.error('Espaço livre das exportações não foi medido:', e.message);
    throw falha(503, 'Não deu pra conferir o espaço livre do servidor. Tente de novo em instantes.');
  }
  if (!Number.isFinite(livre) || livre - bytesSubindo < ESPACO_MIN) throw falha(507, 'O servidor está sem espaço pra arquivos agora. Avise quem cuida do servidor.');
}

async function exportar(req, id, u) {
  const doc = acharDoc(id);
  // tudo que dá pra conferir antes de ler o corpo (recusa cedo fecha a conexão, sem engolir 80 MB)
  const pagina = lerPagina(req.headers['x-pagina'], doc);
  const pedido = lerFormato(req.headers['x-formato']);
  if (pagina === 'todas' && pedido && pedido !== 'pdf' && doc.paginas.length > 1) throw falha(400, 'PNG e JPG são uma página por arquivo: mande x-pagina com o número da página (todas só no PDF).');
  const declarado = Number(req.headers['content-length']);
  const MSG_GRANDE = `A exportação passa de ${Math.round(limites.exportacao / 1024 / 1024)} MB.`;
  if (Number.isFinite(declarado) && declarado > limites.exportacao) throw falha(413, MSG_GRANDE);
  conferirSemBloqueante(doc);
  if ((exportandoPorDoc.get(doc.id) ?? 0) >= 4) throw falha(429, 'Esse design já tem 4 exportações subindo agora. Espere uma terminar.');
  const reserva = Number.isFinite(declarado) && req.headers['content-length'] != null ? declarado : limites.exportacao;
  exportandoPorDoc.set(doc.id, (exportandoPorDoc.get(doc.id) ?? 0) + 1);
  bytesSubindo += reserva;
  const tmp = path.join(PASTA_EXPORTACOES, `.subindo-${randomUUID()}.tmp`);
  let final = null;
  try {
    await mkdir(PASTA_EXPORTACOES, { recursive: true });
    await conferirEspaco();
    let gravado;
    try {
      gravado = await gravarCorpo(req, tmp, limites.exportacao);
    } catch (e) {
      // o 413 do gravarCorpo fala dos 200 MB do envio: aqui o teto é o da exportação
      if (e.status === 413) throw falha(413, MSG_GRANDE);
      throw e;
    }
    const { total, cabeca } = gravado;
    const t = tipoPelosBytes(cabeca);
    const formato = t ? EXPORTAVEIS[t.tipo] : null;
    if (!formato) throw falha(415, 'A exportação precisa ser PNG, JPG ou PDF.');
    if (pedido && pedido !== formato) throw falha(415, `O arquivo não é ${ROTULO_FORMATO[pedido]}: os bytes dizem ${ROTULO_FORMATO[formato]}.`);
    let pag = pagina;
    if (pag === 'todas' && formato !== 'pdf') {
      if (doc.paginas.length > 1) throw falha(400, 'PNG e JPG são uma página por arquivo: mande x-pagina com o número da página (todas só no PDF).');
      pag = 1;
    }
    // o design pode ter mudado ou sumido enquanto o arquivo chegava
    const atual = acharDoc(id);
    if (typeof pag === 'number' && pag > atual.paginas.length) throw falha(409, 'O design mudou e essa página não existe mais. Exporte de novo.');
    conferirSemBloqueante(atual);
    const x = {
      id: novoId('exp'), docId: atual.id, docTitulo: atual.titulo, pagina: pag, formato, tipo: TIPO_DO_FORMATO[formato], tamanho: total,
      nome: nomeComExtensao(`${atual.titulo} (${pag === 'todas' ? 'todas as páginas' : `página ${pag}`})`, formato),
      em: agora(), por: autorDe(u), porId: u?.id ?? null, versaoDoc: atual.versao, pecaId: null,
    };
    const destino = caminhoExportacao(x);
    if (!destino) throw falha(400, 'Endereço inválido.');
    await mover(tmp, destino);
    final = destino;
    // 22/10 (Pedro): a exportação entra no registro antes de virar arte da peça (assim nunca fica órfã no disco) e o
    // anexo é um de cada vez por peça
    await gravarArquivo(path.join(PASTA_EXPORTACOES, `${x.id}.json`), x);
    exportacoes.set(x.id, x);
    final = null;
    let anexo = { anexada: false };
    if (atual.pecaId) {
      try {
        anexo = await emFila(`peca:${atual.pecaId}`, () => anexarNaPeca(atual, x, u));
      } catch (e) {
        await apagarExportacao(x);
        throw e;
      }
      if (anexo.anexada) {
        x.pecaId = atual.pecaId;
        await gravarArquivo(path.join(PASTA_EXPORTACOES, `${x.id}.json`), x).catch((e) => console.error(`Exportação ${x.id}:`, e.message));
      }
    }
    await podarSoltas(atual.id);
    await faxinaExportacoes(await carregar()).catch((e) => console.error('Faxina das exportações do estúdio:', e.message));
    return { ...exportacaoParaTela(x), anexo };
  } finally {
    bytesSubindo -= reserva;
    const n = (exportandoPorDoc.get(doc.id) ?? 1) - 1;
    if (n > 0) exportandoPorDoc.set(doc.id, n);
    else exportandoPorDoc.delete(doc.id);
    await rm(tmp, { force: true }).catch(() => {});
    if (final) await rm(final, { force: true }).catch(() => {});
  }
}

const exportacoesDoDoc = (id) => {
  const d = acharDoc(id);
  return { exportacoes: [...exportacoes.values()].filter((x) => x.docId === d.id).sort((a, b) => String(b.em).localeCompare(String(a.em))).map(exportacaoParaTela) };
};

// o Diretor contábil abre só a arte anexada numa peça que ele vê (pendente na etapa dele ou decidida nela)
function diretorVeExportacao(db, id) {
  const pecas = [...(db.reels ?? []), ...(Array.isArray(db.stories) ? db.stories : [])];
  return pecas.some((p) => Array.isArray(p?.artes) && p.artes.some((a) => a?.id === id) && auth.diretorVe(p.aprovacao));
}

async function servirExportacao(req, res, id, u, json) {
  await pronto();
  const x = exportacoes.get(id);
  if (!x) return json(res, 404, { erro: MSG_SEM_EXPORTACAO });
  if (auth.papelDe(u) === 'diretor' && !diretorVeExportacao(await carregar(), id)) return json(res, 404, { erro: MSG_SEM_EXPORTACAO });
  const real = caminhoExportacao(x);
  if (!real) return json(res, 404, { erro: MSG_SEM_EXPORTACAO });
  const baixar = new URL(req.url, 'http://estudio').searchParams.get('baixar') === '1';
  return servirArquivo(req, res, real, {
    json,
    tipo: TIPO_DO_FORMATO[x.formato],
    cache: 'private, no-cache',
    extras: { 'x-content-type-options': 'nosniff', 'content-disposition': `${baixar ? 'attachment' : 'inline'}; filename*=UTF-8''${codificarNome(x.nome || `design.${x.formato}`)}` },
    rotulo: `Exportação ${x.id}`,
    naoAchou: MSG_SEM_EXPORTACAO,
    ocupado: 'O arquivo está sendo gravado agora. Tente de novo em instantes.',
  });
}

// ---------- mecanismo visual (repetição com os designs das últimas 4 semanas) ----------

const chaveFundo = (f) => (f.tipo === 'imagem' ? `imagem:${f.assetId}` : f.tipo === 'gradiente' ? `gradiente:${f.cor}>${f.cor2}` : `cor:${f.cor}`);
const terco = (v, total) => Math.min(2, Math.max(0, Math.floor((v / total) * 3)));
const tamanhoRelativo = (fr) => (fr < 0.04 ? 'P' : fr < 0.2 ? 'M' : 'G');
// a assinatura: o fundo que mais aparece (a imagem que cobre a página conta como fundo), os assets principais (os 3
// objetos de maior área, a partir de 2% de uma página; fundo, efeito de fundo e grifo ficam fora) e a disposição da capa
// (tipo, terço da tela e tamanho de cada camada)
export function assinatura(doc, assets = null) {
  const areaPagina = doc.largura * doc.altura;
  const contagem = new Map();
  const usos = new Map();
  for (const p of doc.paginas) {
    const cobre = p.camadas.find((c) => c.tipo === 'imagem' && visivel(c) && cobreAPagina(c, caixaDe(c), doc));
    const k = cobre ? `imagem:${cobre.assetId}` : chaveFundo(p.fundo);
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
    for (const c of p.camadas) {
      if (c.tipo !== 'imagem' || !visivel(c) || c === cobre || ehEfeitoDeFundo(c, assets) || ehGrifo(c, assets)) continue;
      usos.set(c.assetId, (usos.get(c.assetId) ?? 0) + c.largura * c.altura);
    }
  }
  const fundo = [...contagem].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'cor:#faf8f5';
  const principais = [...usos].filter(([, a]) => a >= areaPagina * 0.02).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id);
  const capa = doc.paginas[0];
  const disposicao = [...new Set((capa?.camadas ?? []).filter((c) => visivel(c) && !ehEfeitoDeFundo(c, assets)).map((c) => {
    const k = caixaDe(c);
    return `${c.tipo}:${terco(k.x + k.w / 2, doc.largura)}${terco(k.y + k.h / 2, doc.altura)}:${tamanhoRelativo((k.w * k.h) / areaPagina)}`;
  }))];
  return { fundo, fundos: [...contagem.keys()], assets: [...usos.keys()], principais, disposicao };
}
const jaccardLista = (a, b) => {
  const x = new Set(a);
  const y = new Set(b);
  if (!x.size || !y.size) return 0;
  let comum = 0;
  for (const v of x) if (y.has(v)) comum++;
  return comum / (x.size + y.size - comum);
};
const diasEntre = (a, b) => Math.round((Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000);
// a data do design: a da peça ligada, ou o dia em que nasceu
function dataDoDoc(d, db) {
  const p = d.pecaId ? acharPeca(db, d.pecaId) : null;
  if (p && dataValida(p.item.data)) return p.item.data;
  return diaBrasilia(Date.parse(d.criadoEm ?? '')) ?? diaBrasilia(Date.now());
}
const mesmaFamilia = (a, b) => a.id === b.id || (a.pecaId && a.pecaId === b.pecaId) || a.duplicadoDe === b.id || b.duplicadoDe === a.id
  || (a.duplicadoDe && a.duplicadoDe === b.duplicadoDe);

// alvo: o design (gravado ou o que a IA acabou de fazer). Devolve { alertas, comparados, janelaDias }
export function mecanismoVisual(alvo, todos, db, assets = new Map()) {
  const ref = dataDoDoc(alvo, db);
  const sa = assinatura(alvo, assets);
  const nome = (id) => assets.get(id)?.nome ?? id;
  const alertas = [];
  let comparados = 0;
  const principalIgual = [];
  for (const d of todos) {
    if (mesmaFamilia(alvo, d)) continue;
    const data = dataDoDoc(d, db);
    if (Math.abs(diasEntre(ref, data)) > DIAS_MECANISMO) continue;
    comparados++;
    const sb = assinatura(d, assets);
    const parecidaCom = { id: d.id, titulo: d.titulo, data };
    const mesmoFundo = sa.fundo === sb.fundo;
    const assetsIguais = jaccardLista(sa.principais, sb.principais);
    if (mesmoFundo && assetsIguais >= 0.6) {
      alertas.push({ regra: 'fundo-e-assets', nivel: 'alerta', parecidaCom, peso: 2 + assetsIguais, texto: `Mesmo fundo e mesmos assets principais (${sa.principais.filter((x) => sb.principais.includes(x)).map(nome).join(', ')}) do design "${curto(d.titulo, 60)}" de ${dm(data)}: mude o fundo ou o objeto principal.` });
    } else if (mesmoFundo && sa.disposicao.length >= 3 && jaccardLista(sa.disposicao, sb.disposicao) >= 0.85) {
      alertas.push({ regra: 'composicao', nivel: 'alerta', parecidaCom, peso: 1.5, texto: `Mesmo fundo e a mesma composição da capa do design "${curto(d.titulo, 60)}" de ${dm(data)}: mude a disposição dos elementos.` });
    } else if (sa.principais[0] && sa.principais[0] === sb.principais[0]) principalIgual.push(parecidaCom);
  }
  if (principalIgual.length >= 2) {
    alertas.push({ regra: 'asset-principal', nivel: 'info', parecidaCom: principalIgual[0], peso: 0, texto: `${nome(sa.principais[0])} é o objeto principal de mais ${principalIgual.length} designs das últimas ${DIAS_MECANISMO / 7} semanas.` });
  }
  alertas.sort((a, b) => b.peso - a.peso);
  return { alertas: alertas.slice(0, 6).map(({ peso, ...x }) => x), comparados, janelaDias: DIAS_MECANISMO };
}

async function rotaMecanismo(url) {
  const id = url.searchParams.get('docId');
  if (!id) throw falha(400, 'Diga o design (docId).');
  const d = acharDoc(id);
  return mecanismoVisual(d, [...docs.values()], await carregar(), await mapaAssets());
}

// ---------- modelos (estudio/base/modelos/*.json) ----------
// 22/10 (Pedro): "use com base no original". No Ateliê original o código escolhe o combo (pilar, gatilho e template,
// pelo mapa editorial e pelas janelas de não repetição da aba Configurações: pilar 2, gatilho 4, template 3, fundo 2,
// "não repetir em N posts" = fora os usados nos N-1 últimos) e a IA só escreve pro combo escolhido. Aqui o pilar e os
// gatilhos já vêm da peça (o calendário manda) ou da IA conferida pelo mecanismo da semana; o código escolhe o MODELO
// de layout (os documentos que o time guarda em estudio/base/modelos, com nome, descricao e tipo) e respeita duas
// janelas contra os últimos designs do mesmo grupo (stories ou feed): o modelo não repete nos 2 últimos e a cor do
// fundo (claro, escuro, coral ou imagem) não repete no último. Sem modelo que passe, a janela do fundo cai primeiro e
// depois a do modelo (como o "se esgotou, libera tudo" do Ateliê). O modelo pode declarar pilares, blocos e pecas
// (estatico, carrossel, stories); sem isso, o tipo dá a afinidade com o bloco (oferta = Conversão, mito e dica =
// Educação, bastidor = Afeto)
export const JANELAS = { modelo: 3, fundo: 2 };
const BLOCOS_DO_TIPO = {
  oferta: ['Conversão'], mito: ['Educação'], dica: ['Educação'], caixinha: ['Educação'], lista: ['Educação', 'Diferencial'],
  numero: ['Educação', 'Diferencial', 'Conversão'], bastidor: ['Afeto', 'Diferencial'],
};
const NOME_CLASSE = { claro: 'claro', escuro: 'escuro', coral: 'coral', imagem: 'de imagem' };
const grupoDoFormato = (d) => (d?.formato === 'stories' || (Number(d?.altura) / Number(d?.largura) >= 1.7) ? 'stories' : 'feed');

// a cor do fundo do design (o que mais aparece nas páginas, assinatura): claro, escuro, coral ou imagem
function classeDaCor(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(hex));
  if (!m) return 'claro';
  const [r, g, b] = m.slice(1, 4).map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
  const h = max === min ? 0 : max === r ? (60 * ((g - b) / (max - min)) + 360) % 360 : max === g ? 60 * ((b - r) / (max - min)) + 120 : 60 * ((r - g) / (max - min)) + 240;
  if (s > 0.45 && l > 0.25 && l < 0.75 && (h < 35 || h > 340)) return 'coral';
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5 ? 'claro' : 'escuro';
}
export function classeDoFundo(doc, assets = null) {
  const k = assinatura(doc, assets).fundo;
  if (k.startsWith('cor:')) return classeDaCor(k.slice(4));
  if (k.startsWith('gradiente:')) {
    const [a, b] = k.slice(10).split('>');
    const ca = classeDaCor(a);
    return ca === classeDaCor(b) ? ca : ca === 'coral' || classeDaCor(b) === 'coral' ? 'coral' : ca;
  }
  const a = assets?.get(k.slice(7));
  const nome = semAcento(`${a?.id ?? k} ${a?.nome ?? ''} ${(a?.tags ?? []).join(' ')}`);
  if (a?.categoria === 'fundo' || /fundo/.test(nome)) {
    if (/coral/.test(nome)) return 'coral';
    if (/escuro|vinheta/.test(nome)) return 'escuro';
    if (/papel|claro/.test(nome)) return 'claro';
  }
  return 'imagem';
}

let modelosCache = null;
// os modelos do repo, validados como documento (asset que não existe derruba o modelo, com aviso no log). Lidos de
// novo quando algum arquivo da pasta muda
export async function listarModelos(assets = null) {
  let nomes = [];
  try {
    nomes = (await readdir(PASTA_MODELOS)).filter((n) => /^[a-z0-9][a-z0-9-]*\.json$/i.test(n)).sort();
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const sts = await Promise.all(nomes.map((n) => stat(path.join(PASTA_MODELOS, n)).then((s) => `${n}:${s.size}:${s.mtimeMs}`).catch(() => n)));
  const assinaturaPasta = sts.join('|');
  const mapa = assets ?? (await mapaAssets());
  if (modelosCache?.pasta === assinaturaPasta && modelosCache.nAssets === mapa.size) return modelosCache.lista;
  const lista = [];
  const problemas = [];
  for (const n of nomes) {
    try {
      const j = JSON.parse(await readFile(path.join(PASTA_MODELOS, n), 'utf8'));
      const corpo = objeto(j.documento ?? j.doc ?? j);
      const meta = { ...objeto(j), ...objeto(j.modelo) };
      const conteudo = validarDocumento(semCampos(corpo, [...DO_SERVIDOR, 'pecaId', 'estrategia', 'modeloId', 'fontes', 'notas']), { assets: mapa });
      const idBruto = String(meta.id ?? '').toLowerCase();
      const id = ID_MODELO.test(idBruto) ? idBruto : n.replace(/\.json$/i, '').toLowerCase();
      if (lista.some((m) => m.id === id)) throw new Error(`id ${id} repetido`);
      const ints = (v) => (Array.isArray(v) ? v.map(Number).filter((x) => Number.isInteger(x)) : []);
      const textos = (v) => (Array.isArray(v) ? v.map((x) => umaLinha(x)).filter(Boolean) : []);
      // 22/10 (Pedro): as fontes do modelo com número ou preço (ids do FATOS.md, "F005 · ...") vão junto, pro design
      // que nasce dele não sair com o número sem fonte. Só o que começa com um id de fato
      const fontes = textos(corpo.fontes).filter((f) => /^F\d{3}\b/.test(f)).slice(0, LIM.fontes).map((f) => curto(f, LIM.fonte));
      lista.push({
        id, arquivo: n, nome: umaLinha(meta.nome) || conteudo.titulo, descricao: umaLinha(meta.descricao), tipo: umaLinha(meta.tipo).toLowerCase() || null,
        pilares: ints(meta.pilares), blocos: textos(meta.blocos).map(conferirBlocoOu).filter(Boolean), pecas: textos(meta.pecas).map((x) => x.toLowerCase()),
        doc: { ...conteudo, fontes }, fundo: classeDoFundo(conteudo, mapa),
      });
    } catch (e) {
      problemas.push(`${n}: ${e.message}`);
    }
  }
  for (const p of problemas) console.error('Modelo do estúdio ficou de fora:', p);
  modelosCache = { pasta: assinaturaPasta, nAssets: mapa.size, lista, problemas };
  return lista;
}
// GET /api/estudio/modelos: o modelo inteiro (documento com nome, descrição e tipo) pra tela usar e mostrar a miniatura
async function rotaModelos() {
  const lista = await listarModelos();
  return {
    modelos: lista.map((m) => ({
      id: m.id, nome: m.nome, descricao: m.descricao, tipo: m.tipo, pilares: m.pilares, blocos: m.blocos, pecas: m.pecas, fundo: m.fundo, ...m.doc,
    })),
    janelas: JANELAS,
    problemas: modelosCache?.problemas ?? [],
  };
}

// os últimos designs do mesmo grupo (stories ou feed) até a data de referência, o mais recente primeiro (a família do
// design que está sendo refeito fica de fora)
function ultimosDesigns(grupo, ref, db, alvo = null) {
  return [...docs.values()].filter((d) => grupoDoFormato(d) === grupo && !(alvo && mesmaFamilia(alvo, d)))
    .map((d) => ({ d, data: dataDoDoc(d, db) })).filter(({ data }) => data <= ref)
    .sort((a, b) => b.data.localeCompare(a.data) || String(b.d.atualizadoEm ?? '').localeCompare(String(a.d.atualizadoEm ?? '')))
    .map(({ d }) => d);
}
// o modelo da geração, escolhido pelo código. pedido: o id que veio do POST ('nenhum' = sem modelo). Devolve
// { modelo, motivo, evitarModelos, evitarFundos, relaxou } ou { modelo: null, motivo }
export async function escolherModelo({ formato, largura, altura, paginas, peca, estrategia = null, ref, db, assets, alvo = null, pedido = null }) {
  if (pedido === 'nenhum') return { modelo: null, motivo: 'Sem modelo: pedido de quem gerou.' };
  const todos = await listarModelos(assets);
  if (pedido) {
    const m = todos.find((x) => x.id === pedido);
    if (!m) throw falha(400, `O modelo ${pedido} não existe (estudio/base/modelos).`);
    return { modelo: m, motivo: 'Modelo escolhido por quem gerou.', evitarModelos: [], evitarFundos: [], relaxou: [] };
  }
  if (alvo) {
    const m = alvo.modeloId ? todos.find((x) => x.id === alvo.modeloId) : null;
    return m ? { modelo: m, motivo: 'O modelo de que o design nasceu.', evitarModelos: [], evitarFundos: [], relaxou: [] } : { modelo: null, motivo: 'O design refeito fica no layout dele.' };
  }
  const grupo = grupoDoFormato({ formato, largura, altura });
  const doGrupo = todos.filter((m) => grupoDoFormato(m.doc) === grupo);
  if (!doGrupo.length) return { modelo: null, motivo: todos.length ? `Nenhum modelo de ${grupo} no repo.` : 'Nenhum modelo no repo (estudio/base/modelos).' };
  const recentes = ultimosDesigns(grupo, ref, db);
  const evitarModelos = recentes.slice(0, JANELAS.modelo - 1).map((d) => d.modeloId).filter(Boolean);
  const evitarFundos = recentes.slice(0, JANELAS.fundo - 1).map((d) => classeDoFundo(d, assets));
  const tipoPeca = peca ? (peca.tipo === 'stories' ? 'stories' : peca.item.peca ?? 'reel') : paginas > 1 ? 'carrossel' : 'estatico';
  const pilar = estrategia?.pilar ?? null;
  const bloco = estrategia?.bloco ?? blocoDoPilar(pilar);
  const afinidade = (m) => {
    if (pilar != null && m.pilares.includes(pilar)) return 0;
    if (bloco && m.blocos.includes(bloco)) return 0;
    if ((m.pilares.length || m.blocos.length)) return 3;
    const doTipo = BLOCOS_DO_TIPO[m.tipo];
    return doTipo ? (bloco && doTipo.includes(bloco) ? 1 : 3) : 2;
  };
  const encaixe = (m) => {
    if (m.pecas.length) return m.pecas.includes(tipoPeca) || (tipoPeca === 'reel' && m.pecas.includes('stories')) ? 0 : 2;
    const n = m.doc.paginas.length;
    if (tipoPeca === 'carrossel') return n > 1 || m.tipo === 'carrossel' ? 0 : m.tipo === 'capa' ? 1 : 2;
    return m.tipo === 'cta' || m.tipo === 'carrossel' ? 2 : n === 1 ? 0 : 1;
  };
  const limite = Date.parse(`${ref}T12:00:00Z`) - DIAS_MECANISMO * 86_400_000;
  const usos = (m) => recentes.filter((d) => d.modeloId === m.id && Date.parse(`${dataDoDoc(d, db)}T12:00:00Z`) >= limite).length;
  const ordem = (a, b) => afinidade(a) - afinidade(b) || encaixe(a) - encaixe(b) || usos(a) - usos(b) || a.id.localeCompare(b.id);
  const relaxou = [];
  let candidatos = doGrupo.filter((m) => !evitarModelos.includes(m.id) && !evitarFundos.includes(m.fundo));
  if (!candidatos.length) {
    relaxou.push('fundo');
    candidatos = doGrupo.filter((m) => !evitarModelos.includes(m.id));
  }
  if (!candidatos.length) {
    relaxou.push('modelo');
    candidatos = doGrupo;
  }
  const modelo = [...candidatos].sort(ordem)[0];
  const motivo = [
    `Modelo "${modelo.nome}" (${modelo.id}, fundo ${NOME_CLASSE[modelo.fundo]})`,
    evitarModelos.length ? `fora os modelos dos ${evitarModelos.length} últimos designs (${evitarModelos.join(', ')})` : '',
    evitarFundos.length ? `fora o fundo ${evitarFundos.map((c) => NOME_CLASSE[c]).join(' e ')} do último design` : '',
    relaxou.length ? `sem opção que passasse: ${relaxou.map((x) => (x === 'fundo' ? 'o fundo repete' : 'o modelo repete')).join(' e ')}` : '',
  ].filter(tem).join('; ');
  return { modelo, motivo: `${motivo}.`, evitarModelos, evitarFundos: relaxou.includes('fundo') ? [] : evitarFundos, relaxou };
}
// o modelo no prompt: a estrutura a seguir (o JSON do documento, cortado se for grande)
function modeloParaIa(escolha) {
  const m = escolha?.modelo;
  if (!m) return '';
  const json = JSON.stringify({ titulo: m.doc.titulo, formato: m.doc.formato, paginas: m.doc.paginas.map((p) => ({ fundo: p.fundo, camadas: p.camadas.map(({ id, travada, oculta, ...c }) => c) })) });
  return dentro('modelo', [
    `O código escolheu o modelo de layout desta geração (não troque): "${m.nome}" (${m.id})${m.tipo ? `, tipo ${m.tipo}` : ''}, fundo ${NOME_CLASSE[m.fundo]}. ${m.descricao}`.trim(),
    `Por quê: ${escolha.motivo}`,
    'Use a estrutura dele: o fundo, a disposição, a hierarquia do texto (o que é gancho, kicker, apoio e convite), o tipo e o lugar dos assets. Troque os textos pelo assunto da peça e os assets pelos do catálogo que combinam com ele; ajuste tamanhos e posições pro texto caber, sem sair das regras. Precisa de mais páginas que o modelo? Repita a estrutura das páginas do meio. O fundo fica o do modelo.',
    `O modelo: ${curto(json, 30_000)}`,
  ].join('\n'), ` id="${m.id}"`);
}

// ---------- geração por IA ----------

let iaInjetada = null;
// teste: a IA falsa ({ etapa, sistema, prompt, schema } -> { dados } ou o objeto direto). null volta pra de verdade
export function definirIa(fn) {
  iaInjetada = typeof fn === 'function' ? fn : null;
}

const S = (extra = {}) => ({ type: 'string', ...extra });
const N = { type: 'number' };
const B = { type: 'boolean' };
const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });
const CAMADA_IA = obj({
  tipo: S({ enum: ['texto', 'imagem', 'forma'] }), nome: S(), x: N, y: N, largura: N, altura: N, rotacao: N, opacidade: N,
  texto: S(), fonte: S({ enum: ['Sora', 'DM Serif Display'] }), peso: N, italico: B, tamanho: N, cor: S(), corDestaque: S(),
  alinhamento: S({ enum: ['esquerda', 'centro', 'direita'] }), alturaLinha: N, espacamentoLetra: N, caixa: S({ enum: ['normal', 'alta'] }),
  pilula: obj({ ativa: B, cor: S(), raio: N, padding: N }),
  assetId: S(), espelhar: B, raio: N, forma: S({ enum: ['retangulo', 'circulo', 'linha'] }), borda: obj({ ativa: B, cor: S(), largura: N }),
});
export const SCHEMA_IA = obj({
  titulo: S(),
  ganchoOrigem: S(),
  estrategia: obj({ pilar: { type: 'integer' }, motivo: S(), gatilhoEmocional: S(), gatilhoPsicologico: S(), angulo: S() }),
  fontes: { type: 'array', items: S() },
  paginas: {
    type: 'array',
    items: obj({
      fundo: obj({ tipo: S({ enum: ['cor', 'gradiente', 'imagem'] }), cor: S(), cor2: S(), angulo: N, assetId: S(), ajuste: S({ enum: ['cobrir', 'conter'] }) }),
      camadas: { type: 'array', items: CAMADA_IA },
    }),
  },
  observacoes: S(),
});

// as referências que a IA lê (lidas a cada geração: mexeu no arquivo, a próxima já usa).
// 22/10 (Pedro): o banco numerado de 1000 ganchos (o que a peça cita como "banco N") entra no lugar do .docx convertido
// da skill de carrossel (só tinha 1 a 500, com numeração repetida); a escada de CTA (ctas.md) entra sempre; a skill de
// stories (stories-leo) entra no design de stories; a paleta e o uso visual do Léo vêm do brandmkt
export const REFERENCIAS = {
  designGuide: 'identidade/design-guide.md',
  skillCarrossel: '.claude/skills/carrossel/SKILL.md',
  estrategiaCarrossel: '.claude/skills/carrossel/references/estrategia.md',
  ganchosBanco: '.claude/skills/reels-leo/references/banco-1000-ganchos.md',
  estrategiaReels: '.claude/skills/reels-leo/references/estrategia.md',
  ganchosReels: '.claude/skills/reels-leo/references/ganchos.md',
  ctas: '.claude/skills/reels-leo/references/ctas.md',
  skillStories: '.claude/skills/stories-leo/SKILL.md',
  estrategiaPrincipal: 'marketing/estrategia/ESTRATEGIA-PRINCIPAL.md',
  paleta: 'identidade/brandmkt/01-marca/paleta-cores.md',
  personagemLeo: 'identidade/brandmkt/01-marca/personagem-leo.md',
};
// sem estas a geração não roda (503 antes de gastar a IA); a de stories só no design de stories. As outras faltando
// viram aviso
const REFERENCIAS_OBRIGATORIAS = ['designGuide', 'skillCarrossel', 'estrategiaPrincipal', 'ganchosBanco', 'ganchosReels'];
async function lerReferencias() {
  const out = {};
  const faltam = [];
  for (const [k, rel] of Object.entries(REFERENCIAS)) {
    try {
      out[k] = (await readFile(path.join(RAIZ, rel), 'utf8')).trim();
    } catch {
      out[k] = '';
      faltam.push(rel);
    }
  }
  return { ...out, faltam };
}
// do personagem-leo.md, só o que a arte usa (quem é, a fala em 1ª pessoa, o que ele não é e a descrição física), sem
// linha que cite o que o P39 proíbe
function leoParaArte(txt) {
  const secoes = String(txt ?? '').split(/^(?=## )/m).filter((s) => /^## (1|4|7|12)\. /.test(s));
  return secoes.join('\n').split('\n').filter((l) => !/mauro|\blegalize\b|22 anos/i.test(l)).join('\n').trim();
}
// os ganchos que existem: os códigos G da curadoria (ganchos.md) e os números do banco de 1000
let ganchosCache = null;
async function ganchosValidos() {
  const rel = REFERENCIAS.ganchosReels;
  const txt = await readFile(path.join(RAIZ, rel), 'utf8').catch(() => '');
  if (ganchosCache?.txt === txt) return ganchosCache.g;
  const g = new Set((txt.match(/\bG\d{1,3}\b/g) ?? []).map((x) => `G${Number(x.slice(1))}`));
  ganchosCache = { txt, g };
  return g;
}
// 22/10 (Pedro): todo post abre com gancho do banco (09/10): ganchoOrigem precisa ser um G da curadoria que existe ou
// "banco N" com N de 1 a 1000. Devolve o problema (texto) ou null
export async function problemaDoGancho(origem) {
  const s = String(origem ?? '').trim();
  if (!s) return 'Falta de onde veio o gancho (ganchoOrigem): o código G da curadoria ou "banco N" do banco de 1000.';
  const gs = await ganchosValidos();
  const g = /\bG\s?(\d{1,3})\b/i.exec(s);
  if (g) return !gs.size || gs.has(`G${Number(g[1])}`) ? null : `O gancho ${s} não existe na curadoria (ganchos.md): use um G que existe ou "banco N".`;
  const b = /\bbanco\s*(?:n[ºo°]?\s*)?(\d{1,4})\b/i.exec(s);
  if (b) return Number(b[1]) >= 1 && Number(b[1]) <= 1000 ? null : `"${s}" não existe: o banco de ganchos vai de 1 a 1000.`;
  return `"${curto(s, 40)}" não diz de onde veio o gancho: use o código G da curadoria ou "banco N" (1 a 1000). Gancho inventado fora do banco não sai.`;
}
const dentro = (tag, txt, attrs = '') => `<${tag}${attrs}>\n${String(txt ?? '').trim()}\n</${tag}>`;

export const REGRAS_DESIGN = `Regras de design do Pedro (valem em todo design, por cima de qualquer outra referência):
- Margem de segurança só dos textos (Pedro, 22/10): no stories 1080x1920 nenhum texto fica a menos de 96 px das laterais, 240 px do topo e 360 px da base; no feed (1080x1350 e 1080x1080), 72 px em volta. Imagem, Léo, ícone, aparelho, objeto e card podem passar da borda de propósito, cortados pela borda de forma estratégica (o busto do Léo com corte reto cola na borda de baixo); fundo e partícula vão até a borda.
- Carrossel (mais de uma página no feed): um elemento pode atravessar de uma página pra seguinte, ocupando as duas de forma estratégica (o Léo, um aparelho, uma seta, um objeto que puxa o arrasto). É a mesma camada nas duas páginas: na página N com a parte da direita passando da borda (x + largura maior que a largura da página) e na página N+1 com x negativo na mesma medida (o x da página N menos a largura da página), mesmo y e mesmo tamanho, pra emendar quando a pessoa arrasta. O texto nunca atravessa: ele fica dentro da margem da página dele.
- Nada atravessa nada: texto nunca em cima de texto, de imagem ou de forma; colisão zero, com pelo menos 24 px entre os elementos. A única exceção é o cartão: uma forma retângulo ATRÁS (antes na lista de camadas) que contém o texto ou o ícone inteiro, a metáfora do papel do design-guide.
- Todo visto (check) é o símbolo da marca inteiro (o asset do símbolo no catálogo), na proporção do arquivo, nunca cortado, nunca atrás de nada e nunca com canto arredondado por cima. Nunca escreva um caractere de visto no texto.
- Sora no máximo peso 800. A ênfase em DM Serif Display Italic é a exceção pedida pelo Pedro: DM Serif Display só itálica, peso 400, numa palavra ou expressão curta de destaque, numa camada própria.
- Poucas palavras por página: um título curto e no máximo um parágrafo de apoio de até 3 linhas (até uns 25 palavras na página). A capa traz o gancho do banco, até 7 palavras na tela.
- Liberdade criativa nos objetos (3D, foto realista, ícone brilhante do catálogo); a base não muda (papel quente, coral, ink, Sora).
- O Léo aparece grande (Pedro, 23/10: "o Leozin está bem pequeno"): na capa, numa coluna própria, de 900 a 1100 px de altura no feed (o texto na outra coluna, sem passar por baixo dele); nos slides, de 600 a 900 px. Ele pode sair pela base ou pela lateral, cortado de forma estratégica.
- Nada de enfeite decorativo nem barrinha antes de texto. A régua fina coral só entre o kicker e o título, numa linha própria.
- Uma cor de destaque só (coral): o trecho entre *asteriscos* do texto ganha a corDestaque.
- Tipografia que se lê no celular, a escala conferida num design de 1080 de largura: no feed, título de 54 a 92 px (capa de 76 a 92, página de 54 a 64) e corpo de 24 a 32 px (26 a 30 é o ideal); no stories 1080x1920, título de 80 a 112 px, corpo de 36 a 44 px e kicker de 30 px. O número em destaque (o preço, o número do slide) pode passar do tamanho do título. Nada abaixo de 22 px: kicker, tag (ME / MEI) e legenda pequena também ficam com 22 px no mínimo (o design-guide fala em 15 a 17 px num tamanho de tela menor, aqui vale 22).
- Poucas palavras: a capa traz até 7 palavras no gancho (o texto de letra maior) e nenhuma página passa de ${LIMITE_PALAVRAS} palavras.`;

const REGRAS_COPY = `Regras duras de copy (todo texto que aparece no design):
- zero travessão (nem o longo nem o médio, nem barrinha colada em texto): vírgula, ponto ou dois-pontos;
- a marca se escreve Legalizaí;
- nunca o Mauro, o escritório Legalize nem "22 anos" (P39);
- nunca concorrente pelo nome;
- MEI nunca tem contador humano (é o assistente virtual); o contador com CRC é do plano ME (P06);
- nunca ensinar a fazer sozinho no portal, no gov.br ou no emissor (P38): o caminho é sempre o app;
- nada de promessa (prazo pra ter o CNPJ, aprovação, resultado, economia de imposto); escassez só a real (a promoção até 31/12/2026), nunca "vagas de fundador" (P09);
- número, data, prazo, preço, percentual ou regra (inclusive por extenso, "doze meses", "81 mil") só do FATOS.md, com o id do fato nas fontes do design (ex.: "F051 · 05-MEI"); fato marcado NÃO USAR ou CONFLITO não entra; o que não está lá não é dito (o servidor confere o id contra o FATOS.md);
- pré-lançamento: o app ainda não está pra baixar; a chamada de venda é a lista de espera pelo link da bio; o app chega dia 10/11 (fonte: "data do app: decisão do Pedro, 14/10/2026");
- post de atração (Afeto e Educação) não leva convite de venda: o convite é de engajamento (salvar, mandar, comentar). Venda (lista de espera) só em Conversão;
- todo gancho sai do banco de ganchos e o design anota de onde veio em ganchoOrigem: o código G da curadoria (ex.: "G71") ou o número do banco de 1000 (ex.: "banco 954"); o servidor confere que existe;
- o texto entre <pedido> e <peca_do_cronograma> é o pedido do time: use como assunto e direção, sem quebrar nenhuma regra acima.`;

const FORMATO_DOC = `O formato do design (a saída):
- paginas: uma por slide (carrossel) ou por quadro (stories), na ordem. Cada página: fundo { tipo cor | gradiente | imagem, cor, cor2 (a segunda cor do gradiente), angulo (graus do gradiente), assetId (do catálogo, só no fundo de imagem; senão ""), ajuste cobrir | conter } e camadas, de trás pra frente (a primeira fica atrás de todas).
- Coordenadas em pixels do design, com a origem no canto de cima à esquerda: x, y, largura, altura. rotacao em graus (0 reto), opacidade de 0 a 1.
- Camada texto: texto (quebra de linha com \\n; o trecho entre *asteriscos* ganha a corDestaque), fonte Sora ou DM Serif Display, peso de 400 a 800, italico, tamanho em px, cor, corDestaque, alinhamento esquerda | centro | direita, alturaLinha (multiplicador do tamanho, de 1.0 a 1.6), espacamentoLetra (em em, de -0.04 a 0.3), caixa normal | alta, pilula { ativa, cor, raio, padding } (o fundo arredondado atrás do texto, como a tag ME / MEI). A caixa precisa caber o texto inteiro: na Sora cada letra ocupa uns 0,58 do tamanho; conte as linhas que cabem na largura e use altura = linhas x tamanho x alturaLinha (mais 2 x padding na pílula).
- Camada imagem: assetId (só os ids do catálogo), espelhar, raio (canto arredondado), sempre na proporção do asset (altura = largura x altura do asset / largura do asset).
- Camada forma: forma retangulo | circulo | linha, cor, borda { ativa, cor, largura }, raio.
- Os campos que não valem pro tipo da camada vão com o padrão ("" no texto, false, 0, "retangulo", pilula e borda com ativa false): o app ignora.
- Cores só #rrggbb (ou #rrggbbaa com transparência), da paleta do design-guide.
- estrategia: pilar (o número, 0 quando não houver), motivo (por que o design existe na estratégia, 1 ou 2 frases), gatilhoEmocional e gatilhoPsicologico (os dois sempre, das listas), angulo (só no pilar 8: um dos ${ANGULOS_PILAR_8.length} ângulos; nos outros pilares, ""). fontes: os ids do FATOS.md de todo número, data, preço ou regra do texto. observacoes: até 3 linhas pro time (o que você decidiu e o que conferir).`;

function linhaAsset(a) {
  const tam = a.largura && a.altura ? `${a.largura}x${a.altura}` : 'tamanho desconhecido';
  return `- ${a.id} · ${a.nome} · ${a.categoria} · ${tam}${a.tags.length ? ` · tags: ${a.tags.slice(0, 8).join(', ')}` : ''}${a.descricao ? ` · ${curto(a.descricao, 160)}` : ''}${ehSimbolo(a) ? ' · O SÍMBOLO DA MARCA (todo visto)' : ''}`;
}
// stories: o design de formato stories ou o da peça de stories do dia (22/10, Pedro: a IA lia só a estrutura de
// carrossel e nunca a skill de stories)
function sistemaIa(refs, assets, { stories = false } = {}) {
  const visiveis = assets.filter((a) => !a.oculto).slice(0, 400);
  const simbolo = visiveis.find(ehSimbolo);
  const daSkill = stories
    ? 'A saída é o DOCUMENTO DO EDITOR descrito abaixo, nunca HTML. Este design é de STORIES: siga a skill de stories (stories_leo) na estrutura dos quadros (o quadro 1 com o gancho do banco, poucas palavras por quadro, o quadro com interação quando a peça pede: enquete, caixinha, teste ou link, a venda como consequência do contexto e o teto de vendas da semana). Da skill de carrossel, use as regras de copy e o visual (design-guide).'
    : 'A saída é o DOCUMENTO DO EDITOR descrito abaixo, nunca HTML: o renderizador HTML e o Playwright da skill de carrossel não rodam aqui. Da skill, use as regras de copy, a estrutura dos slides (capa com o gancho do banco, um conceito por slide, o slide final com o convite do nível que a peça pede, da escada de CTA) e o visual (design-guide).';
  return [
    'Você é o diretor de arte e redator do Instagram do Legalizaí (contabilidade digital pra MEI e ME de serviço em Belo Horizonte; o app chega dia 10/11/2026; a promoção vale até 31/12/2026). Você monta designs (post de feed, carrossel e stories) no editor do Ateliê do app. Português do Brasil, fala com você, leve e direto, sem contabilês.',
    daSkill,
    REGRAS_DESIGN,
    REGRAS_COPY,
    FORMATO_DOC,
    `O sistema da estratégia: pilar x gatilho emocional x gatilho psicológico. Pilares ativos: ${LISTA_PILARES}. Guardados (não usar): ${PILARES_GUARDADOS.join(', ')}. Gatilhos emocionais: ${GATILHOS_EMOCIONAIS.join(', ')}. Gatilhos psicológicos: ${GATILHOS_PSICOLOGICOS.join(', ')}. Ângulos do pilar 8: ${ANGULOS_PILAR_8.join(', ')}.`,
    dentro('catalogo_de_assets', visiveis.length ? `${visiveis.map(linhaAsset).join('\n')}${simbolo ? '' : '\n(sem o símbolo da marca no catálogo: não use visto)'}` : '(o banco de assets está vazio: use só texto e forma)'),
    dentro('design_guide', refs.designGuide, ` arquivo="${REFERENCIAS.designGuide}"`),
    refs.paleta ? dentro('paleta_da_marca', refs.paleta, ` arquivo="${REFERENCIAS.paleta}"`) : '',
    refs.personagemLeo ? dentro('leo_na_arte', leoParaArte(refs.personagemLeo), ` arquivo="${REFERENCIAS.personagemLeo}"`) : '',
    dentro('skill_carrossel', refs.skillCarrossel, ` arquivo="${REFERENCIAS.skillCarrossel}"`),
    stories ? dentro('stories_leo', refs.skillStories, ` arquivo="${REFERENCIAS.skillStories}"`) : '',
    dentro('estrategia_no_carrossel', refs.estrategiaCarrossel, ` arquivo="${REFERENCIAS.estrategiaCarrossel}"`),
    dentro('estrategia_na_peca', refs.estrategiaReels, ` arquivo="${REFERENCIAS.estrategiaReels}"`),
    dentro('escada_de_cta', refs.ctas, ` arquivo="${REFERENCIAS.ctas}"`),
    dentro('banco_de_ganchos_curado', refs.ganchosReels, ` arquivo="${REFERENCIAS.ganchosReels}"`),
    dentro('banco_de_ganchos_numerado', refs.ganchosBanco, ` arquivo="${REFERENCIAS.ganchosBanco}"`),
    dentro('estrategia_principal', refs.estrategiaPrincipal, ` arquivo="${REFERENCIAS.estrategiaPrincipal}"`),
    blocoBaseContabil(),
    'Responda só pela saída estruturada pedida.',
  ].filter(tem).join('\n\n');
}

// o que a IA lê da peça do cronograma
function textoDaPecaIa(db, achado) {
  const { tipo, item: r } = achado;
  const pl = r.pilar == null ? null : (db.pilares ?? []).find((x) => x.id === Number(r.pilar));
  const linhas = [
    `Tipo: ${tipo === 'stories' ? 'stories do dia' : r.peca ?? 'reel'}`, `Data: ${r.data || 'sem data'}`,
    `${tipo === 'stories' ? 'Tema' : 'Ideia'}: ${tipo === 'stories' ? r.tema ?? '' : r.ideia ?? ''}`,
    `Pilar: ${pl ? `${pl.id} ${PILARES_ESTRATEGIA[pl.id] ?? pl.nome}` : r.pilarTexto || 'sem pilar'}${r.bloco ? ` (bloco ${r.bloco})` : ''}`,
    tem(r.motivo) ? `Motivo (a defesa): ${r.motivo}` : '',
    tem(r.gatilhoEmocional) ? `Gatilho emocional: ${r.gatilhoEmocional}` : '', tem(r.gatilhoPsicologico) ? `Gatilho psicológico: ${r.gatilhoPsicologico}` : '',
    tem(r.angulo) ? `Ângulo do pilar 8: ${r.angulo}` : '',
    tem(r.ganchoOrigem) ? `De onde veio o gancho: ${umaLinha(r.ganchoOrigem)}` : '',
  ];
  const ro = objeto(r.roteiro);
  if ([ro.hook, ro.textoTela, ro.cta].some(tem) || (ro.cenas ?? []).length) {
    linhas.push(`Roteiro: gancho "${ro.hook ?? ''}"${tem(ro.textoTela) ? `, texto de tela "${ro.textoTela}"` : ''}${(ro.cenas ?? []).length ? `\nFalas: ${ro.cenas.slice(0, 12).map((c) => c?.fala).filter(tem).join(' / ')}` : ''}${tem(ro.cta) ? `\nCTA: ${ro.cta}` : ''}`);
  }
  const ca = objeto(r.carrossel);
  const slides = [ca.capa, ...(Array.isArray(ca.slides) ? ca.slides : []), ca.final].filter((s) => s && (tem(s.titulo) || tem(s.texto)));
  if (slides.length) linhas.push(`Slides:\n${slides.map((s, i) => `${i + 1}. ${[s.titulo, s.texto].filter(tem).join(': ')}${tem(s.visual) ? ` (visual: ${s.visual})` : ''}`).join('\n')}`);
  // 26/10 (Pedro): a lista espremida abre em um slide por item, por cima do número de páginas do pedido
  const comLista = r.peca === 'carrossel' ? slidesComLista(slides) : [];
  if (comLista.length) linhas.push(`Lista espremida: ${comLista.map((x) => `o slide ${x.indice} traz ${x.itens} itens`).join('; ')}. No design, cada item ganha a própria página (o título do item, uma explicação curta em português de gente e um visual próprio), e o fecho não repete a lista: o design sai com ${paginasDaPeca(achado)} páginas (a capa, um slide por item e o fim), mesmo que o pedido diga menos.`);
  const es = objeto(r.estatico);
  if (['headline', 'apoio', 'cta'].some((k) => tem(es[k]))) linhas.push(`Arte: ${['headline', 'apoio', 'cta'].map((k) => es[k]).filter(tem).join(' | ')}${tem(es.visual) ? ` (visual: ${es.visual})` : ''}`);
  const qs = Array.isArray(r.quadros) ? r.quadros : [];
  if (qs.length) linhas.push(`Quadros:\n${qs.map((q, i) => `${i + 1}. ${[q?.texto, tem(q?.visual) ? `visual: ${q.visual}` : '', tem(q?.interacao) ? `interação: ${q.interacao}` : ''].filter(tem).join(' | ')}`).join('\n')}`);
  if (tem(r.cta) && tipo === 'stories') linhas.push(`CTA: ${r.cta}`);
  if (tem(r.legenda)) linhas.push(`Legenda: ${curto(r.legenda, 1500)}`);
  if (Array.isArray(r.fontes) && r.fontes.length) linhas.push(`Fontes da peça:\n${r.fontes.join('\n')}`);
  // 22/10 (Pedro): o stories ligado à peça de feed do dia conversa com ela (teaser do carrossel): a IA vê a ideia, o
  // gancho, o pilar e o design dela no estúdio, pra continuidade de texto e de visual
  const doDia = tipo === 'stories' && r.pecaDoDia ? acharPeca(db, r.pecaDoDia) : null;
  if (doDia?.tipo === 'peca') {
    const f = doDia.item;
    const g = f.roteiro?.hook || f.carrossel?.capa?.titulo || f.estatico?.headline || '';
    const design = [...docs.values()].filter((d) => d.pecaId === f.id).sort((a, b) => String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)))[0];
    const visual = design ? `Design dela no estúdio: "${curto(design.titulo, 80)}", fundo ${assinatura(design).fundo}, gancho na capa "${curto(ganchoDoDoc(design), 120)}".` : '';
    linhas.push(`Peça de feed do dia (o stories conversa com ela; continue o assunto e o visual, sem copiar o gancho):\n${[`${f.peca ?? 'reel'} de ${f.data ?? 'sem data'}: ${f.ideia ?? ''}`, tem(g) ? `Gancho: ${g}` : '', f.pilar != null ? `Pilar: ${f.pilar}` : '', visual].filter(tem).join('\n')}`);
  }
  return linhas.filter(tem).join('\n');
}
const formatoDaPeca = (achado) => (!achado ? null : achado.tipo === 'stories' || (achado.item.peca ?? 'reel') === 'reel' ? 'stories' : 'feed45');
function paginasDaPeca(achado) {
  if (!achado) return null;
  const r = achado.item;
  if (achado.tipo === 'stories') return Math.min(LIM.paginas, Math.max(1, (r.quadros ?? []).length));
  // 26/10 (Pedro): a lista espremida num slide conta um slide por item (listas-carrossel.mjs)
  if (r.peca === 'carrossel') return Math.min(LIM.paginas, Math.max(2, paginasAbrindoListas(slidesDaPeca(r))));
  return 1;
}
// os slides da peça carrossel na ordem, da capa ao fim
function slidesDaPeca(r) {
  const ca = objeto(r.carrossel);
  return [ca.capa, ...(Array.isArray(ca.slides) ? ca.slides : []), ca.final];
}
// 26/10 (Pedro: "tem que ter um slide explicativo para cada um"): quando a peça (ou, sem peça carrossel, o design que vai
// ser refeito) traz uma lista espremida num slide, o design pode sair com a lista aberta em um slide por item. Devolve
// as páginas com a lista aberta, ou null quando não há lista pra abrir
function paginasComListaAberta({ peca, alvo, formato }) {
  const slides = peca?.item.peca === 'carrossel' ? slidesDaPeca(peca.item)
    : alvo && formato !== 'stories' && alvo.paginas.length > 1 ? alvo.paginas.map((p) => textosDaPagina(p).join('\n')) : [];
  return slidesComLista(slides).length ? Math.min(LIM.paginas, paginasAbrindoListas(slides)) : null;
}
const descreverDisposicao = (tokens) => tokens.slice(0, 6).map((t) => {
  const [tipo, cel, tam] = t.split(':');
  return `${tipo} ${{ P: 'pequeno', M: 'médio', G: 'grande' }[tam]} ${['à esquerda', 'no centro', 'à direita'][Number(cel[0])]} ${['em cima', 'no meio', 'embaixo'][Number(cel[1])]}`;
}).join(', ');
// 22/10 (Pedro): além do visual, o gancho da capa, o pilar e os gatilhos de cada design (a anti-repetição não era só
// visual); a mesma família (a peça, a cópia) fica de fora, como no mecanismo visual
function designsRecentesIa(db, ref, alvo, assets) {
  const nome = (id) => assets.get(id)?.nome ?? id;
  return [...docs.values()].filter((d) => !(alvo && mesmaFamilia(alvo, d))).map((d) => ({ d, data: dataDoDoc(d, db) }))
    .filter(({ data }) => Math.abs(diasEntre(ref, data)) <= DIAS_MECANISMO).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 25)
    .map(({ d, data }) => {
      const s = assinatura(d, assets);
      const e = d.estrategia ?? {};
      const est = [e.pilar ? `pilar ${e.pilar}` : '', e.gatilhoEmocional, e.gatilhoPsicologico].filter(tem).join(', ');
      return `- ${dm(data)} · "${curto(d.titulo, 70)}" · ${d.formato}${d.modeloId ? ` · modelo ${d.modeloId}` : ''} · fundo ${s.fundo} · gancho "${curto(ganchoDoDoc(d), 90)}"${est ? ` · ${est}` : ''} · assets principais: ${s.principais.map((id) => `${nome(id)} (${id})`).join(', ') || 'nenhum'} · capa: ${descreverDisposicao(s.disposicao) || 'só fundo'}`;
    }).join('\n');
}
// o gancho do design parecido com o de outro design dos últimos 90 dias (fora da família): alerta, nunca bloqueio
function ganchoRepetido(doc, alvo, db) {
  const g = ganchoDoDoc(doc);
  if (!tem(g)) return null;
  const ref = dataDoDoc(doc, db);
  let melhor = null;
  for (const d of docs.values()) {
    if (alvo && mesmaFamilia(alvo, d)) continue;
    const data = dataDoDoc(d, db);
    if (Math.abs(diasEntre(ref, data)) > 90) continue;
    const p = jaccard(g, ganchoDoDoc(d));
    if (p >= 0.5 && (!melhor || p > melhor.p)) melhor = { p, d, data };
  }
  return melhor ? `O gancho "${curto(g, 70)}" é parecido com o do design "${curto(melhor.d.titulo, 60)}" de ${dm(melhor.data)} (${Math.round(melhor.p * 100)}% das palavras): mude o ângulo.` : null;
}

// número que a IA mandou: finito e dentro da faixa, senão o padrão
const numOu = (v, padrao, min, max) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao);
const corOu = (v, padrao) => (typeof v === 'string' && RE_COR.test(v.trim()) ? v.trim().toLowerCase() : padrao);
const umDe = (v, lista, padrao) => (lista.includes(v) ? v : padrao);

// a saída da IA no formato do contrato (antes da validação). problemas: o que se perdeu no caminho
function docDaIa(dados, { formato, largura, altura, assets, problemas }) {
  const d = objeto(dados);
  const paginas = (Array.isArray(d.paginas) ? d.paginas : []).slice(0, LIM.paginas).map((p, i) => {
    const f = objeto(p?.fundo);
    const fundo = {
      tipo: umDe(f.tipo, ['cor', 'gradiente', 'imagem'], 'cor'), cor: corOu(f.cor, '#faf8f5'), cor2: corOu(f.cor2, '#f1eee9'),
      angulo: numOu(f.angulo, 160, -360, 360), assetId: null, ajuste: umDe(f.ajuste, ['cobrir', 'conter'], 'cobrir'),
    };
    if (fundo.tipo === 'imagem') {
      if (assets.has(f.assetId)) fundo.assetId = f.assetId;
      else {
        problemas.push({ regra: 'asset-inexistente', nivel: 'problema', pagina: i + 1, texto: `O fundo da página ${i + 1} usa um asset que não está no catálogo (${curto(f.assetId, 40) || 'vazio'}).` });
        fundo.tipo = 'cor';
      }
    }
    const camadas = [];
    for (const c0 of (Array.isArray(p?.camadas) ? p.camadas : []).slice(0, LIM.camadas)) {
      const c = objeto(c0);
      const tipo = umDe(c.tipo, ['texto', 'imagem', 'forma'], null);
      if (!tipo) continue;
      const comum = {
        // o id da camada que já existia (o ajuste pelo chat do editor); a validação troca o que vier torto ou repetido
        ...(typeof c.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(c.id) ? { id: c.id } : {}),
        tipo, nome: curto(umaLinha(textoDaIa(c.nome)), LIM.nome), x: numOu(c.x, 0, -LIM.coord, LIM.coord), y: numOu(c.y, 0, -LIM.coord, LIM.coord),
        largura: numOu(c.largura, 200, 1, LIM.coord), altura: numOu(c.altura, 100, 1, LIM.coord), rotacao: numOu(c.rotacao, 0, -360, 360),
        opacidade: numOu(c.opacidade, 1, 0, 1) || 1,
      };
      if (tipo === 'texto') {
        const texto = textoDaIa(c.texto).trim().slice(0, LIM.texto);
        if (!texto) continue;
        const serif = c.fonte === 'DM Serif Display';
        const pil = objeto(c.pilula);
        const t = {
          ...comum, texto, fonte: serif ? 'DM Serif Display' : 'Sora', peso: serif ? 400 : Math.round(numOu(c.peso, 400, 400, 800) / 100) * 100, italico: serif ? true : c.italico === true,
          tamanho: numOu(c.tamanho, 48, 8, 1000), cor: corOu(c.cor, '#1b1e24'), corDestaque: corOu(c.corDestaque, '#f2643c'),
          alinhamento: umDe(c.alinhamento, ['esquerda', 'centro', 'direita'], 'esquerda'), alturaLinha: numOu(c.alturaLinha, 1.2, 0.8, 3),
          espacamentoLetra: numOu(c.espacamentoLetra, 0, -0.1, 0.5), caixa: umDe(c.caixa, ['normal', 'alta'], 'normal'),
          fundo: pil.ativa === true ? { cor: corOu(pil.cor, '#fef3ee'), raio: numOu(pil.raio, 999, 0, LIM.coord), padding: numOu(pil.padding, 16, 0, 400) } : null,
        };
        // a IA erra a altura do texto: a caixa cresce até caber (a colisão e a área segura conferem a caixa que cabe)
        t.altura = Math.min(LIM.coord, Math.max(t.altura, alturaEstimada(t)));
        camadas.push(t);
      } else if (tipo === 'imagem') {
        if (!assets.has(c.assetId)) {
          problemas.push({ regra: 'asset-inexistente', nivel: 'problema', pagina: i + 1, texto: `A camada "${curto(comum.nome, 30)}" da página ${i + 1} usa um asset que não está no catálogo (${curto(c.assetId, 40) || 'vazio'}).` });
          continue;
        }
        camadas.push({ ...comum, assetId: c.assetId, espelhar: c.espelhar === true, raio: numOu(c.raio, 0, 0, LIM.coord), sombra: null });
      } else {
        const bo = objeto(c.borda);
        camadas.push({
          ...comum, forma: umDe(c.forma, ['retangulo', 'circulo', 'linha'], 'retangulo'), cor: corOu(c.cor, '#ffffff'),
          borda: bo.ativa === true ? { cor: corOu(bo.cor, '#e3ded7'), largura: numOu(bo.largura, 1, 0, 50) } : null, raio: numOu(c.raio, 0, 0, LIM.coord),
        });
      }
    }
    return { fundo, camadas };
  });
  const fontes = (Array.isArray(d.fontes) ? d.fontes : []).map((s) => umaLinha(textoDaIa(s))).filter(Boolean).slice(0, LIM.fontes);
  const ganchoOrigem = umaLinha(textoDaIa(d.ganchoOrigem));
  const observacoes = textoDaIa(d.observacoes).trim();
  return {
    titulo: curto(umaLinha(textoDaIa(d.titulo)), LIM.titulo) || 'Design gerado pela IA', formato, largura, altura, paginas, fontes,
    notas: curto([`Gancho: ${ganchoOrigem || 'não informado'}.`, observacoes].filter(tem).join('\n'), LIM.notas),
  };
}

const canonico = (v, lista) => lista.find((x) => semAcento(x) === semAcento(v).trim()) ?? umaLinha(v);
// a estratégia do design: a da peça manda (o que faltar nela, a IA completa); sem peça, a da IA, conferida
function estrategiaFinal(db, achado, ia) {
  const e = objeto(ia);
  const avisos = [];
  const pilarIa = Number.isInteger(e.pilar) && e.pilar > 0 ? e.pilar : null;
  let pilar = pilarIa;
  if (pilar != null && (!PILARES_ATIVOS.includes(pilar) || !(db.pilares ?? []).some((p) => p.id === pilar))) {
    avisos.push(`A IA escolheu o pilar ${pilar}, que não é um dos ativos: ficou sem pilar.`);
    pilar = null;
  }
  let out = {
    pilar, bloco: blocoDoPilar(pilar), motivo: curto(textoDaIa(e.motivo).trim(), LIM.motivo),
    gatilhoEmocional: curto(canonico(textoDaIa(e.gatilhoEmocional), GATILHOS_EMOCIONAIS), LIM.gatilho),
    gatilhoPsicologico: curto(canonico(textoDaIa(e.gatilhoPsicologico), GATILHOS_PSICOLOGICOS), LIM.gatilho),
    angulo: pilar === 8 ? anguloCanonico(e.angulo) : null,
  };
  if (achado) {
    const r = achado.item;
    const pilarPeca = r.pilar == null || r.pilar === '' ? null : Number(r.pilar);
    const pilarFinal = pilarPeca ?? out.pilar;
    out = {
      pilar: pilarFinal,
      bloco: conferirBlocoOu(r.bloco) ?? blocoDoPilar(pilarFinal),
      motivo: tem(r.motivo) ? umaLinha(r.motivo).slice(0, LIM.motivo) : out.motivo,
      gatilhoEmocional: tem(r.gatilhoEmocional) ? umaLinha(r.gatilhoEmocional).slice(0, LIM.gatilho) : out.gatilhoEmocional,
      gatilhoPsicologico: tem(r.gatilhoPsicologico) ? umaLinha(r.gatilhoPsicologico).slice(0, LIM.gatilho) : out.gatilhoPsicologico,
      angulo: pilarFinal === 8 ? anguloCanonico(r.angulo) ?? anguloCanonico(e.angulo) : null,
    };
  }
  // 22/10 (Pedro): o design sem peça precisa dos dois gatilhos das listas e, no pilar 8, do ângulo (a IA refaz)
  const problemas = [];
  if (tem(out.gatilhoEmocional) && !GATILHOS_EMOCIONAIS.includes(out.gatilhoEmocional)) avisos.push(`O gatilho emocional "${out.gatilhoEmocional}" não está na lista da estratégia.`);
  if (tem(out.gatilhoPsicologico) && !GATILHOS_PSICOLOGICOS.includes(out.gatilhoPsicologico)) avisos.push(`O gatilho psicológico "${out.gatilhoPsicologico}" não está na lista da estratégia.`);
  if (!achado) {
    if (!GATILHOS_EMOCIONAIS.includes(out.gatilhoEmocional)) problemas.push(`O gatilho emocional precisa ser um da lista (${GATILHOS_EMOCIONAIS.slice(0, 6).join(', ')}...).`);
    if (!GATILHOS_PSICOLOGICOS.includes(out.gatilhoPsicologico)) problemas.push(`O gatilho psicológico precisa ser um da lista (${GATILHOS_PSICOLOGICOS.join(', ')}).`);
    if (out.pilar === 8 && !out.angulo) problemas.push(`O pilar 8 precisa do ângulo (um dos ${ANGULOS_PILAR_8.length}: ${ANGULOS_PILAR_8.join(', ')}).`);
  }
  if (!out.angulo) delete out.angulo;
  return { estrategia: out, avisos, problemas };
}
function conferirBlocoOu(v) {
  try {
    return conferirBloco(v);
  } catch {
    return null;
  }
}

// ---------- correção por código (depois da última tentativa da IA) ----------

const GAP = 24;
// grupos que se movem juntos: o cartão e o que está dentro dele, e o grifo com o texto que ele marca. O fundo (o que
// sangra e o efeito de fundo) não anda
function grupos(pagina, doc, assets = null) {
  const vis = pagina.camadas.filter((c) => visivel(c)).map((c) => ({ c, k: caixaDe(c) }));
  const usados = new Set();
  const out = [];
  for (const a of vis) {
    if (usados.has(a.c) || !ehCartao(a.c) || fixo(a.c, a.k, doc, assets)) continue;
    const membros = [a, ...vis.filter((b) => b !== a && !usados.has(b.c) && contem(a.k, b.k) && pagina.camadas.indexOf(b.c) > pagina.camadas.indexOf(a.c))];
    for (const m of membros) usados.add(m.c);
    out.push(membros);
  }
  for (const a of vis) if (!usados.has(a.c) && !ehGrifo(a.c, assets) && !fixo(a.c, a.k, doc, assets)) out.push([a]);
  for (const gr of vis.filter((a) => !usados.has(a.c) && ehGrifo(a.c, assets))) {
    const area = (g) => g.filter((m) => m.c.tipo === 'texto').reduce((maior, m) => Math.max(maior, Math.max(0, Math.min(m.k.x + m.k.w, gr.k.x + gr.k.w) - Math.max(m.k.x, gr.k.x)) * Math.max(0, Math.min(m.k.y + m.k.h, gr.k.y + gr.k.h) - Math.max(m.k.y, gr.k.y))), 0);
    const dono = out.filter((g) => area(g) > 0).sort((a, b) => area(b) - area(a))[0];
    if (dono) dono.push(gr);
    else out.push([gr]);
  }
  return out.map((ms) => ({ membros: ms.map((m) => m.c), ...caixaDosMembros(ms) }));
}
// a caixa do grupo (laço, como o uniao)
function caixaDosMembros(ms) {
  const k = uniao(ms.map((m) => m.k));
  return { x: k.x, y: k.y, w: k.w, h: k.h };
}
// o que não anda na correção: o fundo (o que sangra e o efeito de fundo) e o busto de corte reto colado na base
const fixo = (c, k, doc, assets) => sangra(c, k, doc, assets) || (ehCorteReto(c, assets) && coladoNaBase(k, doc));
const moverGrupo = (g, dx, dy) => {
  for (const c of g.membros) {
    c.x += dx;
    c.y += dy;
  }
  g.x += dx;
  g.y += dy;
};
// empurra pra baixo o que colide com o que já está posto (de cima pra baixo). Devolve se coube: o grupo com texto na
// área segura; 23/10 (a margem é só dos textos, Pedro 22/10) o resto só precisa começar dentro da página (a imagem
// empurrada pra baixo da área segura não encolhe mais a letra da página inteira)
function afastar(pagina, doc, area, assets = null) {
  const gs = grupos(pagina, doc, assets).sort((a, b) => a.y - b.y || a.x - b.x);
  const postos = [];
  for (const g of gs) {
    for (let volta = 0; volta < 50; volta++) {
      const bate = postos.filter((p) => sobrepoe({ x: p.x - GAP / 2, y: p.y - GAP / 2, w: p.w + GAP, h: p.h + GAP }, g));
      if (!bate.length) break;
      moverGrupo(g, 0, bate.reduce((m, p) => Math.max(m, p.y + p.h + GAP), -Infinity) - g.y);
    }
    postos.push(g);
  }
  return postos.every((g) => (g.membros.some((c) => c.tipo === 'texto') ? g.y + g.h <= area.y + area.altura + 0.5 : g.y < doc.altura));
}
// traz pra dentro da área segura (diminui o que é maior que ela). 22/10 (Pedro): o busto de corte reto que passa da
// base da área segura cola na borda de baixo da página (não sobe e fica com o corte flutuando no meio do quadro)
function trazerPraArea(pagina, doc, area, assets = null, minimo = 8) {
  for (const c of pagina.camadas.filter(visivel)) {
    let k = caixaDe(c);
    if (sangra(c, k, doc, assets)) continue;
    // 22/10 (Pedro): a margem é só dos textos. O resto pode estourar a borda (inclusive passar pra página seguinte do
    // carrossel); só não some: o que ficou todo fora da página volta pro meio da área segura
    if (c.tipo !== 'texto') {
      if (k.x >= doc.largura || k.x + k.w <= 0 || k.y >= doc.altura || k.y + k.h <= 0) {
        c.x = Math.round(area.x + (area.largura - k.w) / 2);
        c.y = Math.round(area.y + (area.altura - k.h) / 2);
      }
      continue;
    }
    const reto = ehCorteReto(c, assets) && k.y + k.h > area.y + area.altura;
    const escala = Math.min(1, area.largura / k.w, (reto ? doc.altura - area.y : area.altura) / k.h);
    if (escala < 1) {
      c.largura = Math.max(1, Math.floor(c.largura * escala));
      c.altura = Math.max(1, Math.floor(c.altura * escala));
      if (c.tipo === 'texto') c.tamanho = Math.max(minimo, Math.floor(c.tamanho * escala));
      k = caixaDe(c);
    }
    const dx = k.x < area.x ? area.x - k.x : k.x + k.w > area.x + area.largura ? area.x + area.largura - (k.x + k.w) : 0;
    const dy = reto ? doc.altura - (k.y + k.h)
      : k.y < area.y ? area.y - k.y : k.y + k.h > area.y + area.altura ? area.y + area.altura - (k.y + k.h) : 0;
    c.x = Math.round(c.x + dx);
    c.y = Math.round(c.y + dy);
  }
}
// a correção inteira: visto escrito, barrinha, símbolo girado ou espelhado, letra abaixo do mínimo, caixa do texto, área
// segura e colisão (a letra encolhe até 4 vezes quando o que foi afastado não cabe mais, nunca abaixo do mínimo).
// assets: o efeito de fundo, o grifo, o símbolo e o busto de corte reto têm regra própria
export function corrigirDesign(doc, assets = null) {
  const area = areaSegura(doc);
  // 22/10 (Pedro): nada abaixo de 22 px num design de 1080 de largura (a IA seguia os 15 a 17 px do kicker do design-guide)
  const minimo = Math.round((22 * doc.largura) / 1080);
  doc.paginas = doc.paginas.map((p0) => {
    const original = structuredClone(p0);
    for (const c of original.camadas) if (c.tipo === 'texto') c.texto = c.texto.replace(VISTO_ESCRITO, '').replace(/[ 	]{2,}/g, ' ').trim();
    for (const c of original.camadas) {
      if (c.tipo === 'imagem' && ehSimbolo(assets?.get(c.assetId))) {
        c.espelhar = false;
        c.rotacao = 0;
        c.raio = 0;
      }
    }
    const barrinhas = new Set(barrinhasAntesDeTexto(original).map(([f]) => f));
    original.camadas = original.camadas.filter((c) => !barrinhas.has(c) && !(c.tipo === 'texto' && !tem(c.texto)));
    let melhor = null;
    for (let escala = 1, volta = 0; volta < 5; volta++, escala *= 0.9) {
      const p = structuredClone(original);
      for (const c of p.camadas.filter((x) => x.tipo === 'texto')) {
        c.tamanho = Math.max(minimo, Math.floor(c.tamanho * escala));
        c.altura = Math.max(c.altura, alturaEstimada(c));
      }
      trazerPraArea(p, doc, area, assets, minimo);
      const coube = afastar(p, doc, area, assets);
      melhor = p;
      if (coube && !colisoes(p, doc, assets).length) break;
    }
    return melhor;
  });
  return doc;
}

// o candidato de uma tentativa: convertido, validado e conferido
async function avaliarCandidato(dados, ctx) {
  const problemasIa = [];
  const bruto = docDaIa(dados, { formato: ctx.formato, largura: ctx.largura, altura: ctx.altura, assets: ctx.assets, problemas: problemasIa });
  const { estrategia, avisos, problemas: problemasEstrategia } = estrategiaFinal(ctx.db, ctx.peca, objeto(dados).estrategia);
  let doc;
  try {
    doc = validarDocumento({ ...bruto, pecaId: ctx.pecaId, estrategia }, { db: ctx.db, assets: ctx.assets });
  } catch (e) {
    return { invalido: true, erro: e.message, pontos: 1e9, problemas: [`O design não passou na validação: ${e.message}`], dados };
  }
  return pontuar({ doc, dados, problemasIa, problemasEstrategia, avisos }, ctx);
}
const contarPalavras = (t) => String(t ?? '').replace(/\*/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
// 22/10 (Pedro): o design sem peça (só brief) passa pelo mecanismo da semana como se já estivesse no calendário, na data
// de referência: repetição com as 8 semanas, o mesmo pilar 2 vezes na semana, a 1ª campanha, o ângulo do pilar 8, o
// convite de venda em post de atração e a oferta acima do teto. Antes só ia como texto no prompt
function alertasDaSemana(doc, ctx) {
  const e = doc.estrategia;
  if (ctx.peca || !e?.pilar || !dataValida(ctx.ref)) return [];
  const ID = 'est_candidato';
  const g = ganchoDoDoc(doc);
  const ultima = textosDaPagina(doc.paginas.at(-1)).join(' ');
  const db2 = { ...ctx.db, reels: [...(ctx.db.reels ?? [])], stories: [...(Array.isArray(ctx.db.stories) ? ctx.db.stories : [])] };
  if (ctx.formato === 'stories') {
    db2.stories.push({ id: ID, data: ctx.ref, pilar: e.pilar, bloco: e.bloco, tema: g || doc.titulo, quadros: doc.paginas.map((p) => ({ texto: textosDaPagina(p).join(' ') })), pecaDoDia: null, angulo: e.angulo ?? null });
  } else {
    const carrossel = doc.paginas.length > 1;
    db2.reels.push({
      id: ID, data: ctx.ref, peca: carrossel ? 'carrossel' : 'estatico', pilar: e.pilar, bloco: e.bloco, ideia: doc.titulo, angulo: e.angulo ?? null, legenda: '',
      ...(carrossel ? { carrossel: { capa: { titulo: g }, final: { titulo: ultima } } } : { estatico: { headline: g, cta: ultima } }),
    });
  }
  let a;
  try {
    a = analisarSemana(db2, ctx.ref, { campanha: ctx.campanha ?? [] });
  } catch {
    return [];
  }
  const out = (a.pecas[ID] ?? []).filter((x) => x.nivel === 'alerta').map((x) => `Mecanismo da semana: ${x.texto}`);
  if (e.pilar === 10 && !a.oferta.ok) out.push(`Mecanismo da semana: com este design a oferta (pilar 10) fica em ${a.oferta.pct}% da semana, e o teto é ${a.oferta.teto}%: escolha outro pilar.`);
  return out;
}
async function pontuar(cand, ctx) {
  const { doc } = cand;
  const rev = await revisar(doc, { db: ctx.db, assets: ctx.assets });
  const comoAlvo = { ...doc, id: ctx.docId ?? 'est_novo', criadoEm: agora(), duplicadoDe: ctx.alvo?.duplicadoDe ?? null };
  const visual = mecanismoVisual(comoAlvo, [...docs.values()], ctx.db, ctx.assets);
  const problemas = [];
  // 26/10 (Pedro): com lista espremida na peça (ou no design refeito), vale também o design com a lista aberta
  const abertas = paginasComListaAberta(ctx);
  if (doc.paginas.length !== ctx.paginas && doc.paginas.length !== abertas) {
    problemas.push(`Pedi ${ctx.paginas} ${ctx.paginas === 1 ? 'página' : 'páginas'}${abertas && abertas !== ctx.paginas ? ` (ou ${abertas}, com a lista aberta em um slide por item)` : ''} e vieram ${doc.paginas.length}.`);
  }
  for (const i of rev.textos.falhas.filter((x) => x.nivel === 'bloqueante')) problemas.push(`[bloqueante] ${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"`).join('; ')} (${i.dica})`);
  for (const p of cand.problemasIa) problemas.push(p.texto);
  for (const d of rev.design.filter((x) => x.nivel === 'problema')) problemas.push(`${d.pagina ? `Página ${d.pagina}: ` : ''}${d.texto}`);
  // 22/10 (Pedro): os limites dados à IA são os conferidos: página com mais de LIMITE_PALAVRAS (35, o mesmo do editor) e
  // capa com mais de 7 no gancho
  for (const d of rev.design.filter((x) => x.regra === 'palavras')) problemas.push(d.texto);
  const gancho = ganchoDoDoc(doc);
  // 23/10: o gancho que é o da peça do cronograma entra como está (a ideia do calendário é usada como está; a origem
  // dele é conferida no gerador da semana)
  const doCalendario = Boolean(ctx.peca) && soPalavras(gancho) === soPalavras(ganchoDaPeca(ctx.peca.item));
  if (!doCalendario) {
    if (contarPalavras(gancho) > 7) problemas.push(`O gancho da capa tem ${contarPalavras(gancho)} palavras ("${curto(gancho, 80)}"): até 7 na tela.`);
    const pg = await problemaDoGancho(umaLinha(textoDaIa(objeto(cand.dados).ganchoOrigem)));
    if (pg) problemas.push(pg);
  }
  problemas.push(...(cand.problemasEstrategia ?? []));
  problemas.push(...alertasDaSemana(doc, ctx));
  for (const a of visual.alertas.filter((x) => x.regra === 'fundo-e-assets')) problemas.push(`Repetição visual: ${a.texto}`);
  if (ctx.escolha?.evitarFundos?.length) {
    const classe = classeDoFundo(doc, ctx.assets);
    if (ctx.escolha.evitarFundos.includes(classe)) problemas.push(`O fundo ${NOME_CLASSE[classe]} repete o do último design (janela de não repetição do fundo): fique com o fundo do modelo.`);
  }
  if (!ctx.peca && !tem(doc.estrategia?.motivo)) problemas.push('Falta o motivo da estratégia (por que o design existe).');
  const avisos = [...(cand.avisos ?? [])];
  const repetido = ganchoRepetido(doc, comoAlvo, ctx.db);
  if (repetido) avisos.push(repetido);
  const pontos = (rev.textos.bloqueia ? 1000 : 0) + problemas.length * 10 + rev.contagem.alertas;
  return { ...cand, avisos, rev, visual, problemas, pontos };
}

const gerandoPor = new Set();
const ZGerar = z.object({
  brief: zTexto(LIM.brief).default(''),
  formato: z.enum(IDS_FORMATO, { error: `o formato precisa ser ${IDS_FORMATO.join(', ')}` }).optional(),
  paginas: z.preprocess((v) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v), z.number({ error: 'precisa ser um número' }).int().min(1, { error: `vai de 1 a ${LIM.paginas}` }).max(LIM.paginas, { error: `vai de 1 a ${LIM.paginas}` }).optional()),
  pecaId: z.preprocess(vazioNulo, z.string().max(80).nullable().optional()),
  docId: z.preprocess(vazioNulo, z.string().max(80).nullable().optional()),
  versao: z.any().optional(),
  largura: zLado().optional(),
  altura: zLado().optional(),
  // 22/10 (Pedro): o modelo de layout (o id de estudio/base/modelos; "nenhum" = sem modelo; vazio = o código escolhe)
  modeloId: z.preprocess(vazioNulo, z.string().regex(/^(nenhum|[a-z0-9][a-z0-9-]{0,63})$/, { error: 'não é o id de um modelo' }).nullable().optional()),
  // 23/10 (Pedro: "a skill não está sendo utilizada, ela deve ser ativa toda vez que eu for criar no Ateliê"): o "Criar
  // no Ateliê" da peça roda a skill dela pela IA, sem o modelo de layout do repo (o modelo deixava cara de template)
  skill: z.boolean({ error: 'precisa ser verdadeiro ou falso' }).optional(),
});

// o gancho da peça do cronograma (a capa do carrossel, a headline do estático, o gancho do roteiro ou o tema dos stories)
const ganchoDaPeca = (r) => [r?.carrossel?.capa?.titulo, r?.estatico?.headline, r?.roteiro?.hook, r?.tema, r?.ideia].find(tem) ?? '';
const soPalavras = (s) => semAcento(String(s ?? '').replace(/\*/g, '')).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// o que a IA lê no "Criar no Ateliê": a skill manda no desenho, com o tipo de conteúdo da peça e a variação do carrossel
function skillNoAtelie(db, achado) {
  const r = achado.item;
  const comoEstao = 'Os textos da peça são os do cronograma: use como estão (o gancho da capa sem mudar nenhuma palavra), só quebrando em título e apoio e destacando o trecho-chave com *asteriscos*.';
  if (achado.tipo === 'stories') {
    return ['Este design é a skill de stories (stories_leo) rodando no Ateliê pelo botão "Criar no Ateliê" (Pedro, 23/10: "não quero nada genérico"): siga a skill na estrutura dos quadros e o visual do design-guide, um quadro por página.', comoEstao].join('\n');
  }
  if (r.peca !== 'carrossel') {
    return ['Este design é a skill de carrossel rodando no Ateliê pelo botão "Criar no Ateliê" (Pedro, 23/10: "não quero nada genérico"), no tipo POST ÚNICO: o visual do "Visual do Legalizaí" e um layout nomeado que converse com o texto (NÚMERO, CITAÇÃO, SOLO ou capa com o Léo).', comoEstao].join('\n');
  }
  const tipo = tipoDoCarrossel(r);
  const variante = varianteDoCarrossel(db, r);
  return [
    'Este design é a skill de carrossel (skill_carrossel) rodando no Ateliê pelo botão "Criar no Ateliê" (Pedro, 23/10: "não quero nada genérico, a skill deve ser ativa toda vez"). Siga a skill inteira: o Passo 2 e o 3 já vieram na peça, e o desenho é o do "Visual do Legalizaí" com os "Layouts nomeados".',
    comoEstao,
    `Tipo de conteúdo desta peça: ${NOME_DO_TIPO[tipo]}. ${direcaoDoTipo(tipo)}`,
    `Variação pela ordem do cronograma: ${variante === 'claro' ? 'clara (o "5 sinais" de 01/09: papel quente #FAF8F5, logo horizontal, o destaque em coral #DD4E27)' : 'escura (o "Giro Legalizaí" de 01/09: o fundo escuro do banco com a luz coral, logo negativo claro, o destaque em coral)'}.`,
    'Não é template: cada slide ganha o desenho que o conteúdo dele pede, alternando 2 ou 3 layouts nomeados no meio (NÚMERO, SOLO, CITAÇÃO, card), com o Léo, o ícone 3D, o aparelho ou o número grande que conversa com aquele texto. Nunca a mesma composição em todas as páginas.',
    'Em todas as páginas: o contador (01 / 05) em cima à direita e o logo com "Contabilidade Digital" embaixo à esquerda. A capa leva a pílula "Arrasta pro lado"; o último slide, o convite do nível que a peça pede.',
  ].join('\n');
}

// o pedido do gerar lido e conferido (400, 409 da versão, 503 sem a IA), antes de qualquer chamada à IA. O POST das
// tarefas confere com ele pra devolver o erro na hora, em vez de deixar pra tarefa
async function lerPedidoGerar(b) {
  await pronto();
  const r = ZGerar.safeParse(objeto(b));
  if (!r.success) throw erroDeValidacao(r.error.issues, b);
  const v = r.data;
  const db = await carregar();
  const alvo = v.docId ? acharDoc(v.docId) : null;
  if (alvo && v.versao != null && v.versao !== '') conferirVersao(alvo, v.versao);
  const pecaId = v.pecaId !== undefined ? v.pecaId : alvo?.pecaId ?? null;
  const peca = pecaId ? acharPeca(db, pecaId) : null;
  if (pecaId && !peca) throw falha(400, 'Essa peça não existe no cronograma.');
  const brief = v.brief.trim();
  if (!tem(brief) && !peca && !alvo) throw falha(400, 'Escreva o brief (o que o design precisa dizer) ou escolha uma peça do cronograma.');
  const formato = v.formato ?? alvo?.formato ?? formatoDaPeca(peca) ?? 'feed45';
  const largura = FORMATOS[formato].largura ?? v.largura ?? alvo?.largura;
  const altura = FORMATOS[formato].altura ?? v.altura ?? alvo?.altura;
  if (!largura || !altura) throw falha(400, `O formato personalizado precisa de largura e altura (de ${LIM.ladoMin} a ${LIM.ladoMax} px).`);
  const paginas = v.paginas ?? (alvo && !v.formato ? alvo.paginas.length : null) ?? paginasDaPeca(peca) ?? 1;
  if (!iaInjetada && !iaConfigurada()) throw falha(503, MSG_SEM_IA);
  return { v, db, alvo, pecaId, peca, brief, formato, largura, altura, paginas };
}

// uma geração por pessoa e no máximo GERACOES_JUNTAS no servidor. Síncrona: quem confere também reserva, sem await no meio
function reservarGeracao(quem) {
  if (gerandoPor.has(quem)) throw falha(409, 'Você já tem um design sendo gerado: espere terminar.');
  if (gerandoPor.size >= GERACOES_JUNTAS) throw falha(503, 'Tem gerações demais rodando agora. Tente de novo em instantes.');
  gerandoPor.add(quem);
}

// POST /api/estudio/gerar: o design novo (ou a versão nova do docId) feito pela IA
export async function gerar(b, u) {
  const pedido = await lerPedidoGerar(b);
  const quem = u?.id ?? 'sem-conta';
  reservarGeracao(quem);
  try {
    return await gerarDesign(pedido, u);
  } finally {
    gerandoPor.delete(quem);
  }
}

async function gerarDesign({ v, db, alvo, pecaId, peca, brief, formato, largura, altura, paginas }, u) {
  const assetsLista = await listarAssets();
  const assets = new Map(assetsLista.map((a) => [a.id, a]));
  const refs = await lerReferencias();
  // 22/10 (Pedro): sem o design system, a skill e a estratégia a geração não roda (antes seguia e só avisava no fim,
  // depois de gastar as duas chamadas)
  const stories = formato === 'stories' || peca?.tipo === 'stories';
  const obrigatorias = [...REFERENCIAS_OBRIGATORIAS, ...(stories ? ['skillStories'] : [])];
  const faltando = obrigatorias.filter((k) => !refs[k]).map((k) => REFERENCIAS[k]);
  if (faltando.length) throw falha(503, `Faltam neste servidor as referências da IA: ${faltando.join(', ')}. Sem elas o design sairia sem a estratégia e o design system.`);
  const area = areaSegura({ formato, largura, altura });
  const ref = peca && dataValida(peca.item.data) ? peca.item.data : diaBrasilia(Date.now());
  let semana = '';
  let historico = '';
  let campanha = [];
  try {
    campanha = await pecasDaCampanha();
    const a = analisarSemana(db, ref, { campanha });
    const daPeca = peca ? (a.pecas[peca.item.id] ?? []).filter((x) => x.nivel === 'alerta').map((x) => `- ${x.texto}`) : [];
    semana = [analiseParaIa(a), daPeca.length ? `Alertas desta peça:\n${daPeca.join('\n')}` : '', !peca && a.alertas.length ? `Alertas da semana:\n${a.alertas.slice(0, 12).map((x) => `- ${x}`).join('\n')}` : ''].filter(tem).join('\n');
    historico = curto(historicoParaIa(db, ref), 8000);
  } catch (e) {
    semana = `(o mecanismo da semana não rodou: ${e.message})`;
  }
  const recentes = designsRecentesIa(db, ref, alvo, assets);
  // o modelo de layout, escolhido pelo código (janelas de não repetição de modelo e de fundo). No "Criar no Ateliê"
  // (skill), sem modelo: o desenho sai da skill
  const comSkill = v.skill === true && Boolean(peca) && !alvo;
  const escolha = comSkill
    ? { modelo: null, motivo: 'Criar no Ateliê: o desenho sai da skill, sem modelo de layout.' }
    : await escolherModelo({ formato, largura, altura, paginas, peca, estrategia: peca ? estrategiaFinal(db, peca, {}).estrategia : null, ref, db, assets, alvo, pedido: v.modeloId ?? null });
  const pedido = [
    dentro('pedido', [
      tem(brief) ? `Brief: ${brief}` : 'Brief: (sem brief; o design sai da peça do cronograma)',
      `Formato: ${FORMATOS[formato].nome} (${largura} x ${altura} px), ${paginas} ${paginas === 1 ? 'página' : 'páginas'}${peca?.item.peca === 'carrossel' ? ' (capa, slides do meio e o slide final)' : ''}.`,
      `Área segura deste design: x de ${area.x} a ${area.x + area.largura} e y de ${area.y} a ${area.y + area.altura}.`,
    ].join('\n')),
    peca ? dentro('peca_do_cronograma', textoDaPecaIa(db, peca)) : '',
    peca ? 'A ideia, o pilar e o motivo da peça entram como estão (o calendário é usado como está), menos o que fere regra dura (P39, PROIBIDO.md, fato fora do FATOS.md): isso não entra no design e vira alerta nas observacoes. O design escreve e desenha em volta deles. Faltou o gatilho na peça? Escolha das listas.' : 'Escolha o pilar (um dos ativos), o gatilho emocional e o psicológico das listas (os dois, sempre), o ângulo se o pilar for o 8, e escreva o motivo. O servidor confere a escolha contra o mecanismo da semana.',
    modeloParaIa(escolha),
    dentro('mecanismo_da_semana', semana || '(sem dados da semana)'),
    historico ? dentro('pecas_das_ultimas_semanas', historico) : '',
    dentro('designs_recentes', recentes ? `Não repita o mesmo fundo com os mesmos assets principais nem a mesma composição destes:\n${recentes}` : '(nenhum design nas últimas 4 semanas)'),
    alvo ? dentro('design_atual', `Este é o design que você vai refazer (versão ${alvo.versao}). Mantenha o que o brief não pedir pra mudar:\n${JSON.stringify({ titulo: alvo.titulo, paginas: alvo.paginas })}`.slice(0, 60_000)) : '',
    comSkill ? dentro('skill_no_atelie', skillNoAtelie(db, peca)) : '',
    'Monte o design inteiro agora.',
  ].filter(tem).join('\n\n');
  const sistema = sistemaIa(refs, assetsLista, { stories });
  const ctx = { db, assets, formato, largura, altura, paginas, pecaId, peca, docId: alvo?.id ?? null, alvo, ref, campanha, escolha };
  const tentativas = [];
  let melhor = null;
  let custo = 0;
  for (let t = 1; t <= 2; t++) {
    const anterior = tentativas.at(-1);
    const prompt = t === 1 ? pedido : [
      pedido,
      dentro('tentativa_anterior', JSON.stringify(anterior.dados).slice(0, 60_000)),
      dentro('problemas', anterior.problemas.map((p) => `- ${p}`).join('\n')),
      'Refaça o design inteiro corrigindo todos os problemas acima, sem criar outros.',
    ].join('\n\n');
    const resposta = await (iaInjetada ?? consultarIa)({ etapa: t === 1 ? 'design' : 'refazer', sistema, prompt, schema: SCHEMA_IA, timeoutMs: TIMEOUT_IA, maxTurns: 4 });
    const dados = resposta && typeof resposta === 'object' && 'dados' in resposta ? resposta.dados : resposta;
    custo += Number(resposta?.custo) || 0;
    const cand = await avaliarCandidato(dados, ctx);
    tentativas.push(cand);
    if (!melhor || cand.pontos < melhor.pontos) melhor = cand;
    if (!cand.problemas.length) break;
  }
  if (melhor.invalido) throw falha(502, `A IA devolveu um design que não vale (${curto(melhor.erro, 300)}). Tente de novo.`);
  // o que a IA não corrigiu, o código corrige; depois passa de novo pela validação e pela conferência
  const corrigido = validarDocumento(corrigirDesign(structuredClone(melhor.doc), assets), { db, assets });
  if (escolha.modelo) corrigido.modeloId = escolha.modelo.id;
  const final = await pontuar({ ...melhor, doc: corrigido }, ctx);
  // 22/10 (Pedro): bloqueante da conferência do Ateliê (P39, concorrente, travessão, fundador) que sobrou nas duas
  // tentativas: o design não é gravado (no Ateliê de chat, o bloqueante trava o salvar_reel do mesmo jeito)
  if (final.rev.textos.bloqueia) {
    const bloqueios = final.rev.textos.falhas.filter((x) => x.nivel === 'bloqueante').map((i) => `${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"`).join('; ')}`);
    throw Object.assign(falha(422, `A IA escreveu o que a regra dura bloqueia nas ${tentativas.length} tentativas (${bloqueios.map((b) => b.split(':')[0]).join(', ')}): o design não foi gravado. Ajuste o brief ou a peça e gere de novo.`), { problemas: bloqueios });
  }
  const quando = agora();
  const nota = 'Gerado pela IA';
  const salvo = alvo
    ? await emFila(alvo.id, async () => {
      const atual = acharDoc(alvo.id);
      if (atual.versao !== alvo.versao) throw Object.assign(falha(409, MSG_CONFLITO), { versaoAtual: atual.versao });
      return gravarDoc({ ...atual, ...corrigido, origem: 'ia', versao: atual.versao + 1, atualizadoEm: quando, atualizadoPor: autorDe(u) }, nota, { db, assets });
    })
    : await gravarDoc({ id: novoId('est'), ...corrigido, origem: 'ia', versao: 1, criadoEm: quando, criadoPor: autorDe(u), atualizadoEm: quando, atualizadoPor: autorDe(u) }, nota, { db, assets });
  const avisos = [
    ...(refs.faltam.length ? [`Referências que faltam neste servidor: ${refs.faltam.join(', ')}.`] : []),
    ...(escolha.relaxou?.length ? [`Modelo: ${escolha.motivo}`] : []),
    ...final.avisos,
    ...final.problemas.map((p) => `Ficou pra conferir: ${p}`),
    ...final.visual.alertas.filter((a) => a.nivel === 'alerta').map((a) => a.texto),
  ];
  return {
    ...docParaTela(salvo),
    geracao: {
      tentativas: tentativas.length, custo: custo || null, avisos: [...new Set(avisos)], mecanismo: final.visual.alertas, problemasDaPrimeira: tentativas[0].problemas,
      modelo: escolha.modelo ? { id: escolha.modelo.id, nome: escolha.modelo.nome, fundo: escolha.modelo.fundo, motivo: escolha.motivo } : null,
    },
  };
}

// ---------- a geração em segundo plano ----------

// 26/10 (Pedro: "deixe a skill rodando mesmo que eu clique fora ou faça outras coisas no Ateliê"): POST
// /api/estudio/tarefas (o corpo do gerar) confere o pedido, começa a geração e responde na hora (202) com a tarefa; GET
// /api/estudio/tarefas lista as de quem pede e GET /api/estudio/tarefas/:id lê uma. A geração segue no servidor com o
// painel fechado, a página trocada ou a internet caída, e a resposta curta não cai no túnel da Cloudflare (100 s; a skill
// leva de 2 a 5 minutos). Ficam só na memória, presas a quem pediu, até 30 minutos depois do fim: o servidor reiniciado
// perde as que rodavam (o design delas não chegou a ser gravado). Do design, a tarefa guarda só o id, o título, a versão
// e o resumo da geração; nada do prompt vai pra ela nem pro log
const tarefas = new Map();
const VIDA_TAREFA_MS = 30 * 60_000;
const MSG_SEM_TAREFA = 'Essa geração não existe mais: o servidor reiniciou ou ela terminou há mais de 30 minutos.';

function varrerTarefas() {
  const limite = Date.now() - VIDA_TAREFA_MS;
  for (const [id, t] of tarefas) if (t.fim && Date.parse(t.fim) < limite) tarefas.delete(id);
}

const tarefaPublica = (t) => ({
  id: t.id, estado: t.estado, pecaId: t.pecaId, alvoId: t.alvoId, assunto: t.assunto, inicio: t.inicio, fim: t.fim,
  segundos: Math.max(0, Math.round(((t.fim ? Date.parse(t.fim) : Date.now()) - Date.parse(t.inicio)) / 1000)),
  docId: t.docId, titulo: t.titulo, versao: t.versao, geracao: t.geracao, erro: t.erro, status: t.status, problemas: t.problemas,
});

async function rodarTarefa(t, pedido, u) {
  try {
    const d = await gerarDesign(pedido, u);
    Object.assign(t, { estado: 'pronto', docId: d.id, titulo: d.titulo, versao: d.versao, geracao: d.geracao });
  } catch (e) {
    if (!e?.status) console.error('Estúdio: a geração em segundo plano falhou de um jeito inesperado.');
    Object.assign(t, {
      estado: 'erro', erro: e?.status ? e.message : 'A geração falhou. Tente de novo.', status: e?.status ?? 500,
      problemas: Array.isArray(e?.problemas) ? e.problemas : [],
    });
  } finally {
    gerandoPor.delete(t.dono);
    t.fim = agora();
  }
}

// POST /api/estudio/tarefas: o erro do pedido (400, 409, 503) volta na hora, como no gerar; o resto fica na tarefa
export async function iniciarTarefa(b, u) {
  const pedido = await lerPedidoGerar(b);
  varrerTarefas();
  const dono = u?.id ?? 'sem-conta';
  reservarGeracao(dono);
  const { peca, alvo, brief } = pedido;
  const t = {
    id: novoId('ger'), dono, pecaId: pedido.pecaId ?? null, alvoId: alvo?.id ?? null,
    assunto: curto(peca ? peca.item.ideia || peca.item.tema || ganchoDaPeca(peca.item) : alvo ? alvo.titulo : brief, 160),
    estado: 'gerando', inicio: agora(), fim: null, docId: null, titulo: null, versao: null, geracao: null, erro: null, status: null, problemas: [],
  };
  tarefas.set(t.id, t);
  rodarTarefa(t, pedido, u); // segue sozinha; o GET acompanha
  return tarefaPublica(t);
}

// GET /api/estudio/tarefas: as de quem pede, da mais nova pra mais velha
export function listarTarefas(u) {
  varrerTarefas();
  const dono = u?.id ?? 'sem-conta';
  return [...tarefas.values()].filter((t) => t.dono === dono).sort((a, b) => b.inicio.localeCompare(a.inicio)).map(tarefaPublica);
}

// GET /api/estudio/tarefas/:id: a de outra pessoa é 404, como a que não existe
export function lerTarefa(id, u) {
  varrerTarefas();
  const t = tarefas.get(id);
  if (!t || t.dono !== (u?.id ?? 'sem-conta')) throw falha(404, MSG_SEM_TAREFA);
  return tarefaPublica(t);
}

// ---------- o chat da IA no editor ----------

// 23/10 (Pedro: "na edição, deixe um chat para pedir a IA para alterar algumas coisas"): POST
// /api/estudio/docs/:id/ajustar-ia { versao, pedido, pagina, conversa } (o chat da IA do editor). A IA recebe o design
// como está e muda só o que o pedido diz (trocar um texto, aumentar o Léo, mudar o fundo de uma página), com as regras
// de design e de copy, o catálogo, o design system e o FATOS do "Gerar com IA". Ela devolve só as páginas que mudaram,
// inteiras, com o id das camadas que já existiam (a camada travada ou oculta segue assim). O problema que o ajuste
// criou volta pra ela uma vez; o que o design já tinha não conta. O bloqueante da conferência do Ateliê não grava.
// Sai uma versão nova (a de antes fica em Versões); pergunta ou pedido recusado volta só com a resposta
const CAMADA_AJUSTE = obj({ id: S(), ...CAMADA_IA.properties });
export const SCHEMA_AJUSTE = obj({
  resposta: S(),
  titulo: S(),
  ganchoOrigem: S(),
  fontes: { type: 'array', items: S() },
  paginas: { type: 'array', items: obj({ numero: { type: 'integer' }, fundo: SCHEMA_IA.properties.paginas.items.properties.fundo, camadas: { type: 'array', items: CAMADA_AJUSTE } }) },
  remover: { type: 'array', items: { type: 'integer' } },
});
const FORMATO_AJUSTE = `A saída do ajuste:
- resposta: 1 a 3 frases pro time, que aparecem no chat, dizendo o que você mudou (ou por que não mudou). Fala com você, sem contabilês e sem travessão.
- paginas: só as páginas que mudaram, cada uma inteira: numero (a página, de 1 em diante), fundo e TODAS as camadas da página, de trás pra frente (as que mudaram e as que ficam como estão). A camada que já existia vai com o id dela; a camada nova vai com id "". A página que não mudou não vem. Página nova: o numero seguinte ao da última (ela entra no fim).
- remover: os números das páginas que o pedido manda tirar (senão, a lista vazia).
- titulo: o título novo do design, só quando o pedido muda o assunto dele; senão "".
- ganchoOrigem: só quando o texto do gancho da capa muda, de onde veio o gancho novo: o código G da curadoria, "banco N" do banco de 1000 ou "pedido do time" quando o pedido trouxe o texto pronto; senão "".
- fontes: quando entra número, data, preço ou regra nova, a lista inteira das fontes do design depois do ajuste (os ids do FATOS.md); senão a lista vazia (ficam as de agora).
- O que o pedido não citar fica igual: posição, tamanho, cor, fonte e texto de cada camada. Pedido vago ("deixa mais bonito", "melhora") mexe pouco e a resposta diz o que mudou.
- Pedido que quebra regra dura de copy ou de design não entra: a resposta diz por quê e o que você fez no lugar.
- Pergunta ou opinião, sem pedido de mudança: responda na resposta, sem páginas.`;

function sistemaAjuste(refs, assets, { stories = false } = {}) {
  const visiveis = assets.filter((a) => !a.oculto).slice(0, 400);
  const simbolo = visiveis.find(ehSimbolo);
  return [
    `Você é o diretor de arte e redator do Instagram do Legalizaí (contabilidade digital pra MEI e ME de serviço em Belo Horizonte; o app chega dia 10/11/2026; a promoção vale até 31/12/2026). No editor do Ateliê, alguém do time pede pelo chat um ajuste num design de ${stories ? 'stories' : 'feed'} que já existe, e você faz só esse ajuste no DOCUMENTO DO EDITOR (nunca HTML). Português do Brasil, fala com você, leve e direto, sem contabilês.`,
    REGRAS_DESIGN,
    REGRAS_COPY,
    FORMATO_DOC.split('\n- estrategia:')[0],
    FORMATO_AJUSTE,
    dentro('catalogo_de_assets', visiveis.length ? `${visiveis.map(linhaAsset).join('\n')}${simbolo ? '' : '\n(sem o símbolo da marca no catálogo: não use visto)'}` : '(o banco de assets está vazio: use só texto e forma)'),
    dentro('design_guide', refs.designGuide, ` arquivo="${REFERENCIAS.designGuide}"`),
    refs.paleta ? dentro('paleta_da_marca', refs.paleta, ` arquivo="${REFERENCIAS.paleta}"`) : '',
    refs.personagemLeo ? dentro('leo_na_arte', leoParaArte(refs.personagemLeo), ` arquivo="${REFERENCIAS.personagemLeo}"`) : '',
    refs.ganchosReels ? dentro('banco_de_ganchos_curado', refs.ganchosReels, ` arquivo="${REFERENCIAS.ganchosReels}"`) : '',
    refs.ctas ? dentro('escada_de_cta', refs.ctas, ` arquivo="${REFERENCIAS.ctas}"`) : '',
    blocoBaseContabil(),
    'Responda só pela saída estruturada pedida.',
  ].filter(tem).join('\n\n');
}

// a página do design no formato que a IA devolve (o mesmo da saída), sem os campos que não valem pro tipo da camada
function paginaParaIa(p, numero) {
  const r = (n) => Math.round(Number(n) || 0);
  return {
    numero,
    fundo: { tipo: p.fundo.tipo, cor: p.fundo.cor, cor2: p.fundo.cor2, angulo: p.fundo.angulo, assetId: p.fundo.assetId ?? '', ajuste: p.fundo.ajuste },
    camadas: p.camadas.map((c) => {
      const base = { id: c.id, tipo: c.tipo, nome: c.nome, x: r(c.x), y: r(c.y), largura: r(c.largura), altura: r(c.altura), rotacao: c.rotacao ?? 0, opacidade: c.opacidade ?? 1, ...(c.oculta ? { oculta: true } : {}), ...(c.travada ? { travada: true } : {}) };
      if (c.tipo === 'texto') {
        return { ...base, texto: c.texto, fonte: c.fonte, peso: c.peso, italico: c.italico, tamanho: c.tamanho, cor: c.cor, corDestaque: c.corDestaque, alinhamento: c.alinhamento, alturaLinha: c.alturaLinha, espacamentoLetra: c.espacamentoLetra, caixa: c.caixa, pilula: c.fundo ? { ativa: true, ...c.fundo } : { ativa: false } };
      }
      if (c.tipo === 'imagem') return { ...base, assetId: c.assetId, espelhar: c.espelhar, raio: c.raio };
      return { ...base, forma: c.forma, cor: c.cor, borda: c.borda ? { ativa: true, ...c.borda } : { ativa: false }, raio: c.raio };
    }),
  };
}

// as páginas do design com o ajuste da IA: as que vieram trocam as do mesmo número, as de número depois da última
// entram no fim e as de remover saem. A camada com o id de uma que já existia herda o travada, o oculta, o grupo e a sombra.
// Devolve { paginas, mudou (os números das páginas novas ou trocadas, já na numeração final), mexeu } ou { erro }
function aplicarAjuste(d, sai, assets, problemas) {
  const total = d.paginas.length;
  const vindas = new Map();
  for (const p of (Array.isArray(sai.paginas) ? sai.paginas : []).slice(0, LIM.paginas)) {
    const n = Number(objeto(p).numero);
    if (Number.isInteger(n) && n >= 1 && n <= LIM.paginas) vindas.set(n, p);
  }
  const antigas = new Map(d.paginas.flatMap((p) => p.camadas).map((c) => [c.id, c]));
  const convertidas = new Map();
  for (const [n, p] of vindas) {
    const daPagina = [];
    const [pg] = docDaIa({ paginas: [p] }, { formato: d.formato, largura: d.largura, altura: d.altura, assets, problemas: daPagina }).paginas;
    for (const x of daPagina) problemas.push({ ...x, pagina: n, texto: x.texto.replace(/página 1\b/g, `página ${n}`) });
    for (const c of pg.camadas) {
      const velha = c.id ? antigas.get(c.id) : null;
      if (velha && velha.tipo === c.tipo) {
        c.travada = velha.travada === true;
        c.oculta = velha.oculta === true;
        if (velha.grupo) c.grupo = velha.grupo;
        if (c.tipo === 'imagem') c.sombra = velha.sombra ?? null;
      } else delete c.id;
    }
    if (n <= total) pg.id = d.paginas[n - 1].id;
    convertidas.set(n, pg);
  }
  const remover = new Set((Array.isArray(sai.remover) ? sai.remover : []).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= total));
  const lista = [
    ...d.paginas.map((p, i) => ({ p: convertidas.get(i + 1) ?? p, n: i + 1, nova: convertidas.has(i + 1) })),
    ...[...convertidas.keys()].filter((n) => n > total).sort((a, b) => a - b).map((n) => ({ p: convertidas.get(n), n, nova: true })),
  ].filter((x) => !remover.has(x.n));
  if (!lista.length) return { erro: 'O ajuste tirava todas as páginas do design.' };
  if (lista.length > LIM.paginas) return { erro: `O ajuste deixava o design com ${lista.length} páginas, e o máximo é ${LIM.paginas}.` };
  // o que o código corrige no gerar (o tamanho mínimo, a área segura, a colisão), só nas páginas que a IA mexeu
  const mexidas = lista.filter((x) => x.nova);
  const corrigidas = corrigirDesign({ formato: d.formato, largura: d.largura, altura: d.altura, paginas: mexidas.map((x) => x.p) }, assets).paginas;
  mexidas.forEach((x, i) => { x.p = corrigidas[i]; });
  return { paginas: lista.map((x) => x.p), mudou: lista.flatMap((x, i) => (x.nova ? [i + 1] : [])), mexeu: mexidas.length > 0 || remover.size > 0 };
}

// os problemas do design pela régua do gerar: o bloqueante da conferência da copy, o problema da revisão do design e o
// limite de palavras por página
const problemasDaRevisao = (rev) => [
  ...rev.textos.falhas.filter((x) => x.nivel === 'bloqueante').map((i) => `[bloqueante] ${i.nome}: ${i.achados.map((a) => `${a.onde}: "${a.trecho}"`).join('; ')} (${i.dica})`),
  ...rev.design.filter((x) => x.nivel === 'problema' || x.regra === 'palavras').map((x) => `${x.pagina ? `Página ${x.pagina}: ` : ''}${x.texto}`),
];

async function avaliarAjuste(d, dados, { db, assets, jaTinha }) {
  const sai = objeto(dados);
  const resposta = curto(textoDaIa(sai.resposta).trim(), 1500);
  const titulo = curto(umaLinha(textoDaIa(sai.titulo)), LIM.titulo);
  const fontes = (Array.isArray(sai.fontes) ? sai.fontes : []).map((s) => umaLinha(textoDaIa(s))).filter(Boolean).slice(0, LIM.fontes);
  const problemasIa = [];
  const m = aplicarAjuste(d, sai, assets, problemasIa);
  if (m.erro) return { invalido: true, erro: m.erro, pontos: 1e9, problemas: [m.erro], dados, resposta };
  const mudaTitulo = tem(titulo) && titulo !== d.titulo;
  if (!m.mexeu && !mudaTitulo && !fontes.length) return { semMudanca: true, pontos: 0, problemas: [], dados, resposta };
  let doc;
  try {
    doc = { ...d, ...validarDocumento({ ...(mudaTitulo ? { titulo } : {}), paginas: m.paginas, ...(fontes.length ? { fontes } : {}) }, { atual: d, db, assets }) };
  } catch (e) {
    return { invalido: true, erro: e.message, pontos: 1e9, problemas: [`O ajuste não passou na validação: ${e.message}`], dados, resposta };
  }
  const rev = await revisar(doc, { db, assets });
  const novos = problemasDaRevisao(rev).filter((p) => !jaTinha.has(p));
  const problemas = [...problemasIa.map((p) => p.texto), ...novos];
  // o gancho que mudou: até 7 palavras e de onde veio (aviso, nunca refação: o texto pode ter vindo pronto do pedido)
  const avisos = [];
  const g0 = ganchoDoDoc(d);
  const g1 = ganchoDoDoc(doc);
  if (semAcento(g1) !== semAcento(g0)) {
    if (contarPalavras(g1) > 7) avisos.push(`O gancho da capa ficou com ${contarPalavras(g1)} palavras ("${curto(g1, 80)}"): o combinado é até 7 na tela.`);
    const origem = umaLinha(textoDaIa(sai.ganchoOrigem));
    if (!/pedido do time/i.test(origem)) {
      const pg = await problemaDoGancho(origem);
      if (pg) avisos.push(pg);
    }
  }
  const bloqueia = novos.some((p) => p.startsWith('[bloqueante]'));
  return { doc, rev, dados, resposta, problemas, avisos, mudou: m.mudou, bloqueia, pontos: (bloqueia ? 1000 : 0) + problemas.length * 10 };
}

const ZAjustar = z.object({
  versao: z.any(),
  pedido: zTexto(2000),
  pagina: z.preprocess((v) => (v === '' || v == null ? null : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v), z.number({ error: 'precisa ser o número da página' }).int().min(1).max(LIM.paginas).nullable()).optional(),
  conversa: z.array(z.object({ quem: z.enum(['voce', 'ia']), texto: zTexto(3000) }), { error: 'precisa ser uma lista' }).max(40).default([]),
});

export async function ajustarComIa(id, b, u) {
  await pronto();
  const r = ZAjustar.safeParse(objeto(b));
  if (!r.success) throw erroDeValidacao(r.error.issues, b);
  const v = r.data;
  const pedido = v.pedido.trim();
  if (pedido.length < 2) throw falha(400, 'Escreva o que a IA deve mudar no design.');
  const d = acharDoc(id);
  conferirVersao(d, v.versao);
  if (!iaInjetada && !iaConfigurada()) throw falha(503, MSG_SEM_IA);
  const quem = u?.id ?? 'sem-conta';
  if (gerandoPor.has(quem)) throw falha(409, 'A IA ainda está num pedido seu: espere terminar.');
  if (gerandoPor.size >= GERACOES_JUNTAS) throw falha(503, 'Tem pedidos demais pra IA agora. Tente de novo em instantes.');
  gerandoPor.add(quem);
  try {
    const db = await carregar();
    const assetsLista = await listarAssets();
    const assets = new Map(assetsLista.map((a) => [a.id, a]));
    const refs = await lerReferencias();
    if (!refs.designGuide) throw falha(503, `Falta neste servidor o design system (${REFERENCIAS.designGuide}): sem ele o ajuste sairia fora do visual da marca.`);
    const achado = d.pecaId ? acharPeca(db, d.pecaId) : null;
    const area = areaSegura(d);
    const jaTinha = new Set(problemasDaRevisao(await revisar(d, { db, assets })));
    const pagina = v.pagina && v.pagina <= d.paginas.length ? v.pagina : null;
    const pedidoIa = [
      dentro('design_atual', [
        `Título: ${d.titulo}`,
        `Formato: ${FORMATOS[d.formato]?.nome ?? d.formato} (${d.largura} x ${d.altura} px), ${d.paginas.length} ${d.paginas.length === 1 ? 'página' : 'páginas'}. Área segura dos textos: x de ${area.x} a ${area.x + area.largura} e y de ${area.y} a ${area.y + area.altura}.`,
        `Fontes de agora: ${(d.fontes ?? []).join(' | ') || 'nenhuma'}`,
        tem(d.notas) ? `Notas: ${curto(d.notas, 600)}` : '',
        JSON.stringify(d.paginas.map((p, i) => paginaParaIa(p, i + 1))),
      ].filter(tem).join('\n').slice(0, 80_000)),
      achado ? dentro('peca_do_cronograma', textoDaPecaIa(db, achado)) : '',
      v.conversa.length ? dentro('conversa_ate_aqui', v.conversa.slice(-12).map((x) => `${x.quem === 'ia' ? 'IA' : 'Time'}: ${curto(x.texto, 1500)}`).join('\n')) : '',
      dentro('pedido', pedido),
      pagina ? `A pessoa está com a página ${pagina} aberta no editor: "aqui", "esta página", "esse texto" e "ele" falam dela, a não ser que o pedido cite outra.` : '',
      'Faça o ajuste agora.',
    ].filter(tem).join('\n\n');
    const sistema = sistemaAjuste(refs, assetsLista, { stories: d.formato === 'stories' });
    const tentativas = [];
    let melhor = null;
    let custo = 0;
    for (let t = 1; t <= 2; t++) {
      const anterior = tentativas.at(-1);
      const prompt = t === 1 ? pedidoIa : [
        pedidoIa,
        dentro('tentativa_anterior', JSON.stringify(anterior.dados).slice(0, 60_000)),
        dentro('problemas', anterior.problemas.map((p) => `- ${p}`).join('\n')),
        'Refaça o ajuste corrigindo os problemas acima, sem criar outros e sem mexer no que o pedido não citou.',
      ].join('\n\n');
      const resposta = await (iaInjetada ?? consultarIa)({ etapa: t === 1 ? 'ajuste' : 'refazer-ajuste', sistema, prompt, schema: SCHEMA_AJUSTE, timeoutMs: TIMEOUT_IA, maxTurns: 4 });
      const dados = resposta && typeof resposta === 'object' && 'dados' in resposta ? resposta.dados : resposta;
      custo += Number(resposta?.custo) || 0;
      const cand = await avaliarAjuste(d, dados, { db, assets, jaTinha });
      // na segunda tentativa, desistir do ajuste não ganha do ajuste da primeira com problema pra conferir
      if (t > 1 && cand.semMudanca) cand.pontos = 1e8;
      tentativas.push(cand);
      if (!melhor || cand.pontos < melhor.pontos) melhor = cand;
      if (!cand.problemas.length) break;
    }
    const base = { custo: custo || null, tentativas: tentativas.length };
    if (melhor.invalido) throw falha(502, `A IA devolveu um ajuste que não vale (${curto(melhor.erro, 300)}). Tente de novo com outras palavras.`);
    if (melhor.semMudanca) return { ...docParaTela(d), ajuste: { ...base, resposta: melhor.resposta || 'Não mudei nada no design.', avisos: [], paginas: [], semMudanca: true } };
    if (melhor.bloqueia) {
      const bloqueios = melhor.problemas.filter((p) => p.startsWith('[bloqueante]')).map((p) => p.slice(13));
      throw Object.assign(falha(422, `O ajuste escrevia o que a regra dura bloqueia (${bloqueios.map((x) => x.split(':')[0]).join(', ')}): nada foi gravado. Peça de outro jeito.`), { problemas: bloqueios });
    }
    const salvo = await emFila(d.id, async () => {
      const atual = acharDoc(d.id);
      if (atual.versao !== d.versao) throw Object.assign(falha(409, MSG_CONFLITO), { versaoAtual: atual.versao });
      const { titulo, paginas, fontes } = melhor.doc;
      return gravarDoc({ ...atual, titulo, paginas, fontes, versao: atual.versao + 1, atualizadoEm: agora(), atualizadoPor: autorDe(u) }, `Ajustado pela IA: ${curto(umaLinha(pedido), 80)}`, { db, assets });
    });
    return {
      ...docParaTela(salvo),
      ajuste: { ...base, resposta: melhor.resposta || 'Pronto.', avisos: [...new Set([...melhor.avisos, ...melhor.problemas.map((p) => `Ficou pra conferir: ${p}`)])], paginas: melhor.mudou },
    };
  } finally {
    gerandoPor.delete(quem);
  }
}

// ---------- rotas ----------

async function rotaAssets(req, res, partes, sess, ferramentas) {
  let mod;
  try {
    mod = await import('./estudio-assets.mjs');
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' && String(e.message).includes('estudio-assets')) {
      return ferramentas.json(res, 503, { erro: 'O banco de assets ainda não está neste servidor.' });
    }
    throw e;
  }
  return mod.rota(req, res, partes.slice(1), sess, { ...ferramentas, partesEstudio: partes });
}

// /api/estudio/... (partes: o que vem depois de "estudio"). O perfil já foi conferido pelo servidor (auth.podeApi): o
// Diretor contábil só chega no arquivo da exportação; aqui dentro, de novo
export async function rota(req, res, partes, sess, ferramentas) {
  const { json, corpoJson } = ferramentas;
  const m = req.method;
  const u = sess?.usuario ?? null;
  const [area, id, sub, n, acao] = partes;
  const url = new URL(req.url, 'http://estudio');
  const so = (...metodos) => {
    res.setHeader('allow', metodos.join(', '));
    return json(res, 405, { erro: 'Método não permitido.' });
  };
  try {
    if (area === 'exportacoes') {
      if (partes.length !== 3 || sub !== 'arquivo' || !ehExportacao(id)) return json(res, 404, { erro: 'Rota não existe.' });
      if (m !== 'GET' && m !== 'HEAD') return so('GET', 'HEAD');
      return await servirExportacao(req, res, id, u, json);
    }
    if (auth.papelDe(u) === 'diretor') return json(res, 403, { erro: auth.motivoNegado(u, m, `/api/estudio/${partes.join('/')}`) });
    if (area === 'assets') return await rotaAssets(req, res, partes, sess, ferramentas);
    await pronto();
    // 23/10 (Pedro): a peça do cronograma vira design (o "Criar no Ateliê" do painel da peça)
    if (area === 'da-peca' && !id) {
      if (m !== 'POST') return so('POST');
      const b = objeto(await corpoJson(req, 10_000));
      return json(res, 201, docParaTela(await designDaPeca(String(b.pecaId ?? ''), u)));
    }
    if (area === 'docs') {
      if (!id) {
        if (m === 'GET') return json(res, 200, await listarDocs(url));
        if (m === 'POST') return json(res, 201, docParaTela(await criarDoc(semCampos(objeto(await corpoJson(req, LIM.corpo)), DO_SERVIDOR), u)));
        return so('GET', 'POST');
      }
      if (!ehDoc(id)) return json(res, 404, { erro: MSG_SEM_DOC });
      if (!sub) {
        if (m === 'GET') return json(res, 200, docParaTela(acharDoc(id)));
        if (m === 'PUT') return json(res, 200, docParaTela(await editarDoc(id, await corpoJson(req, LIM.corpo), u)));
        if (m === 'DELETE') return json(res, 200, await apagarDoc(id, u));
        return so('GET', 'PUT', 'DELETE');
      }
      if (sub === 'duplicar' && partes.length === 3) {
        if (m !== 'POST') return so('POST');
        return json(res, 201, docParaTela(await duplicarDoc(id, u)));
      }
      // 23/10 (Pedro): troca as páginas pelas montadas de novo com o texto da peça ligada (versão nova)
      if (sub === 'remontar' && partes.length === 3) {
        if (m !== 'POST') return so('POST');
        return json(res, 200, docParaTela(await remontarDaPeca(id, objeto(await corpoJson(req, 10_000)), u)));
      }
      // 23/10 (Pedro): o chat da IA do editor (muda só o que o pedido diz; versão nova)
      if (sub === 'ajustar-ia' && partes.length === 3) {
        if (m !== 'POST') return so('POST');
        return json(res, 200, await ajustarComIa(id, await corpoJson(req, 200_000), u));
      }
      if (sub === 'versoes' && partes.length === 3) {
        if (m !== 'GET') return so('GET');
        return json(res, 200, await listarVersoes(id));
      }
      if (sub === 'versoes' && partes.length === 5 && acao === 'restaurar') {
        if (m !== 'POST') return so('POST');
        return json(res, 200, docParaTela(await restaurarVersao(id, n, await corpoJson(req, 10_000), u)));
      }
      if (sub === 'exportacoes' && partes.length === 3) {
        if (m === 'GET') return json(res, 200, exportacoesDoDoc(id));
        if (m !== 'POST') return so('GET', 'POST');
        try {
          return json(res, 201, await exportar(req, id, u));
        } catch (e) {
          // recusado antes de ler o corpo inteiro: a conexão fecha depois da resposta (a regra única do auth.mjs)
          auth.fecharSeCorpoChegando(req, res);
          throw e;
        }
      }
      return json(res, 404, { erro: 'Rota não existe.' });
    }
    if (area === 'gerar' && partes.length === 1) {
      if (m !== 'POST') return so('POST');
      return json(res, 200, await gerar(await corpoJson(req, 50_000), u));
    }
    // 26/10 (Pedro): a geração em segundo plano (o "Criar no Ateliê" segue com o painel fechado)
    if (area === 'tarefas' && partes.length === 1) {
      if (m === 'GET') return json(res, 200, { tarefas: listarTarefas(u) });
      if (m === 'POST') return json(res, 202, { tarefa: await iniciarTarefa(await corpoJson(req, 50_000), u) });
      return so('GET', 'POST');
    }
    if (area === 'tarefas' && partes.length === 2) {
      if (m !== 'GET') return so('GET');
      return json(res, 200, { tarefa: lerTarefa(id, u) });
    }
    if (area === 'mecanismo' && partes.length === 1) {
      if (m !== 'GET') return so('GET');
      return json(res, 200, await rotaMecanismo(url));
    }
    // 22/10 (Pedro): os modelos de layout do repo e a lixeira dos designs apagados
    if (area === 'modelos' && partes.length === 1) {
      if (m !== 'GET') return so('GET');
      return json(res, 200, await rotaModelos());
    }
    if (area === 'lixeira') {
      if (partes.length === 1) {
        if (m !== 'GET') return so('GET');
        return json(res, 200, await listarLixeira());
      }
      if (partes.length === 3 && sub === 'restaurar') {
        if (m !== 'POST') return so('POST');
        return json(res, 200, docParaTela(await restaurarDaLixeira(id, u)));
      }
      return json(res, 404, { erro: 'Rota não existe.' });
    }
    return json(res, 404, { erro: 'Rota não existe.' });
  } catch (e) {
    // a validação devolve a lista inteira; o 409 leva a versão gravada (a tela recarrega)
    if (e?.status && !res.headersSent && (e.problemas || e.versaoAtual != null)) {
      return json(res, e.status, { erro: e.message, ...(e.problemas ? { problemas: e.problemas } : {}), ...(e.versaoAtual != null ? { versaoAtual: e.versaoAtual } : {}) });
    }
    throw e;
  }
}

// pro teste: zera a memória (os arquivos ficam) e roda a preparação de novo, como num boot
export function reiniciarParaTeste() {
  preparando = null;
  docs.clear();
  exportacoes.clear();
  bytesDocs.clear();
  return pronto();
}

