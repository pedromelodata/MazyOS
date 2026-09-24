// Aplica a revisão do nicho de 23/09/2026 num banco: Fator R numa peça só e o resto do nicho contábil
// em Viralização, Vendas e Conexão. Rode com o servidor PARADO:
//   npm run importar-nicho <pasta da revisão>        (ou CRONOGRAMA_NICHO=<pasta>)
// A pasta tem mapa.json, plano.json, ideias-viralizacao.json, ideias-vendas.json, ideias-conexao.json,
// reels-1.json e reels-2.json. CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos
// reel.md (teste numa cópia). Rodar de novo não muda nada.
//
//  0. confere tudo antes de escrever; backup do db.json em db.antes-nicho.json (só na primeira vez)
//  1. formatos ganham tipos (formatoTipos do guia, pela migração; edição do usuário fica)
//  2. ideias: as "remover" saem (o id fica nas sementes: o boot não traz de volta), as mantidas
//     ganham tipo e as novas entram. ideias.json da pasta de dados vira exatamente mantidas + novas,
//     e o banco recebe pelo mesmo merge do boot
//  3. reels: "manter" ganha o tipo novo (reel.md gerado é regravado); cada reel reescrito apaga o que
//     ele substitui (e o reel.md que o cronograma gerou pra ele) e entra com reel.md novo.
//     Reel já gravado, editado ou publicado não é substituído (aviso no resumo)
//  4. o episódio 1 da série Tá Chegando (16/10) para de prometer o episódio 2 em 23/10: o teaser
//     passa a prometer os próximos episódios, sem data
//  5. resumo
import { readFile, writeFile, copyFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {
  APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, lerJson, guia, repontarIdeia, novoId, agora, TIPOS_REEL,
  TEMA_LEGADO, ROTULO_TIPO,
} from './db.mjs';
import { reelDoLote, mesmoReel, limparIdeia, ideiaPadrao, semCampos } from './validar.mjs';
import { mesclarIdeias } from './migrar.mjs';
import { escreverReelMd, regravarSeGerado, apagarReelMdGerado, CONTEUDO } from './reelmd.mjs';

const AUTOR = 'Importação do nicho';
const BACKUP = 'db.antes-nicho.json';
const ARQUIVOS_IDEIAS = ['ideias-viralizacao.json', 'ideias-vendas.json', 'ideias-conexao.json'];
const ARQUIVOS_REELS = ['reels-1.json', 'reels-2.json'];
const TRAVADOS = ['gravado', 'editado', 'publicado'];

// episódio 1 da série Tá Chegando: o teaser prometia o episódio 2, que estava em 23/10 e saiu do
// cronograma. O texto novo é a alternativa que o próprio roteiro já trazia pra esse caso
const EP1_DATA = '2026-10-16';
const EP1_TROCAS = {
  fala: [['No episódio dois: a ficha da sua empresa no bolso.', 'Nos próximos episódios: uma tela nova por vez.']],
  tela: [['PRÓXIMO EPISÓDIO: SUA EMPRESA NO BOLSO', 'PRÓXIMOS EPISÓDIOS: UMA TELA NOVA POR VEZ']],
  legenda: [['No próximo episódio: a ficha da sua empresa no bolso.', 'Nos próximos episódios, uma tela nova por vez.']],
  edicao: [['"Próximo episódio: sua empresa no bolso"', '"Próximos episódios: uma tela nova por vez"']],
  checklist: [
    ['Ele já está no cronograma na sexta, 23/10.', 'Ele ainda não tem data no cronograma.'],
    [
      /^Se o episódio dois não ficar gravado, não publicar este com a promessa:.*$/,
      'O teaser já promete os próximos episódios sem data. Quando o episódio dois ganhar data no cronograma, dá pra voltar ao teaser "No episódio dois: a ficha da sua empresa no bolso." e ao fim da legenda "No próximo episódio: a ficha da sua empresa no bolso."',
    ],
  ],
};

const falhar = (msg) => {
  console.error(`\nNada foi importado: ${msg}`);
  process.exit(1);
};

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => {
      s.destroy();
      ok(true);
    });
    s.once('timeout', () => {
      s.destroy();
      ok(false);
    });
    s.once('error', () => ok(false));
  });
}

async function lerFonte(pasta, nome) {
  const p = path.join(pasta, nome);
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (e) {
    return falhar(`não consegui ler ${p} (${e.message}).`);
  }
}
const listaDe = (j, chave) => (Array.isArray(j) ? j : Array.isArray(j?.[chave]) ? j[chave] : null);

// grava inteiro ou nada (tmp + rename), com quebra de linha no fim como os outros arquivos de semente
async function gravarTexto(arquivo, texto) {
  const tmp = `${arquivo}.${process.pid}.tmp`;
  await writeFile(tmp, texto, 'utf8');
  await rename(tmp, arquivo);
}

// troca exata (texto) ou por regex (linha inteira); devolve [novo, mudou]
function trocar(valor, trocas) {
  let v = valor;
  for (const [de, para] of trocas) v = de instanceof RegExp ? v.replace(de, para) : v.split(de).join(para);
  return [v, v !== valor];
}

async function main() {
  const pasta = path.resolve(process.argv[2] || process.env.CRONOGRAMA_NICHO || '');
  if (!process.argv[2] && !process.env.CRONOGRAMA_NICHO) {
    console.log('Uso: npm run importar-nicho <pasta da revisão do nicho>   (CRONOGRAMA_DATA troca a pasta de dados)');
    process.exit(1);
  }
  const dadosReais = path.resolve(DATA_DIR) === path.join(APP, 'data');
  if (dadosReais) {
    for (const porta of new Set([Number(process.env.PORT) || 4317, 4317])) {
      if (await portaOcupada(porta)) falhar(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes (deploy\\desinstalar.ps1 ou feche o processo) e rode de novo.`);
    }
  }
  if (!existsSync(arquivoDados('estilos.json'))) falhar(`${arquivoDados('estilos.json')} não existe (é o guia do nicho, vem do git).`);
  console.log(`Revisão: ${pasta}\nDados: ${DATA_DIR}\nreel.md: ${CONTEUDO}\n`);

  // ---------- 0. lê e confere tudo antes de escrever ----------
  const mapa = await lerFonte(pasta, 'mapa.json');
  const plano = await lerFonte(pasta, 'plano.json');
  const ideiasNovasBrutas = [];
  for (const nome of ARQUIVOS_IDEIAS) {
    const l = listaDe(await lerFonte(pasta, nome), 'ideias');
    if (!l) falhar(`${nome} não é uma lista de ideias.`);
    ideiasNovasBrutas.push(...l);
  }
  const reescritos = [];
  for (const nome of ARQUIVOS_REELS) {
    const l = listaDe(await lerFonte(pasta, nome), 'reels');
    if (!l) falhar(`${nome} não é uma lista de reels.`);
    reescritos.push(...l);
  }
  if (!Array.isArray(plano.cronograma) || !Array.isArray(plano.ideiasAntigas)) falhar('plano.json precisa de cronograma e ideiasAntigas.');

  const brutoAntes = existsSync(DB_PATH) ? JSON.parse(await readFile(DB_PATH, 'utf8')) : null;
  const tiposAntes = new Map((brutoAntes?.formatos ?? []).map((f) => [f.id, Array.isArray(f.tipos) ? f.tipos.length : -1]));
  if (existsSync(DB_PATH) && !existsSync(arquivoDados(BACKUP))) {
    await copyFile(DB_PATH, arquivoDados(BACKUP));
    console.log(`Backup do banco: ${arquivoDados(BACKUP)}`);
  }

  const db = await carregar(); // migração do boot: formato.tipos, campos novos da ideia, tema antigo
  const avisos = [];
  const g = guia();
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!igual(g.temas, mapa.temas) || !igual(g.estilos, mapa.estilos) || !igual(g.formatoTipos, mapa.formatoTipos)) {
    avisos.push('data/estilos.json não bate com o mapa.json da revisão (estilos, temas ou formatoTipos). Valeu o estilos.json.');
  }

  // ideias novas: mesma validação da tela (tipo, tema do guia ou rótulo conhecido, roteiro base, fontes)
  const ideiasNovas = [];
  const idsVistos = new Set();
  const comRotulo = [];
  for (const [n, b] of ideiasNovasBrutas.entries()) {
    if (!b?.id || typeof b.id !== 'string' || idsVistos.has(b.id)) falhar(`a ideia nº ${n + 1} das revisadas não tem id, ou o id se repete.`);
    idsVistos.add(b.id);
    let limpa;
    try {
      limpa = limparIdeia(semCampos(b, ['id', 'criadaEm']));
    } catch (e) {
      falhar(`ideia ${b.id}: ${e.message}`);
    }
    if (!String(limpa.titulo ?? '').trim()) falhar(`ideia ${b.id} sem título.`);
    if (!TIPOS_REEL.includes(limpa.tipo)) falhar(`ideia ${b.id} sem tipo válido.`);
    if (limpa.formatoId && !db.formatos.some((f) => f.id === limpa.formatoId)) falhar(`ideia ${b.id}: o formato ${limpa.formatoId} não existe na biblioteca.`);
    if (limpa.tema && !g.temas.some((t) => t.id === limpa.tema)) comRotulo.push(`${b.id} (${g.rotulosTema[limpa.tema] ?? limpa.tema})`);
    ideiasNovas.push({ id: b.id, ...ideiaPadrao(), origem: 'curadoria', ...limpa, reelId: null, criadaEm: b.criadaEm || agora() });
  }

  if (comRotulo.length) avisos.push(`${comRotulo.length} ideias novas usam tema que é só rótulo (fora dos ${g.temas.length} temas do guia, sem fatos): ${comRotulo.join(', ')}.`);

  // reels reescritos: mesma validação do lote (tipo, data, formato, roteiro, legenda, gravação, fontes)
  const planoPorReel = new Map(plano.cronograma.map((e) => [e.reelIdAtual, e]));
  const trocas = [];
  for (const [n, bruto] of reescritos.entries()) {
    let novo;
    try {
      novo = reelDoLote(db, bruto);
    } catch (e) {
      falhar(`reel reescrito nº ${n + 1} (${bruto?.data ?? 'sem data'}): ${e.message}`);
    }
    const e = planoPorReel.get(bruto.substitui);
    if (!e || e.acao !== 'reescrever') avisos.push(`reel reescrito de ${novo.data}: ${bruto.substitui ?? '(sem substitui)'} não está no plano como "reescrever".`);
    else if (e.data !== novo.data) avisos.push(`reel reescrito de ${novo.data}: no plano a data é ${e.data}.`);
    trocas.push({ velhoId: bruto.substitui ?? null, novo });
  }
  for (const e of plano.cronograma) {
    if (e.acao === 'reescrever' && !trocas.some((t) => t.velhoId === e.reelIdAtual)) avisos.push(`plano manda reescrever ${e.data} (${e.reelIdAtual}), mas nenhum reel reescrito substitui esse.`);
    if (!['manter', 'reescrever'].includes(e.acao)) avisos.push(`plano: ação "${e.acao}" em ${e.data} não existe (ignorada).`);
  }

  // ---------- 1. formatos ----------
  const comTipos = db.formatos.filter((f) => f.tipos?.length);
  const ganharam = comTipos.filter((f) => (tiposAntes.get(f.id) ?? -1) <= 0).length;
  for (const x of g.formatoTipos) if (!db.formatos.some((f) => f.id === x.formatoId)) avisos.push(`formatoTipos cita ${x.formatoId}, que não existe na biblioteca.`);

  // ---------- 2. ideias ----------
  const antigas = new Map(plano.ideiasAntigas.map((x) => [x.id, x]));
  const semente = listaDe(await lerJson('ideias.json', []), 'ideias') ?? [];
  const mantidas = [];
  for (const i of semente) {
    const p = antigas.get(i.id);
    if (p?.acao === 'remover' || idsVistos.has(i.id)) continue;
    if (!p) avisos.push(`ideia ${i.id} do ideias.json não está no plano: ficou como estava.`);
    const tema = Object.hasOwn(TEMA_LEGADO, i.tema) ? TEMA_LEGADO[i.tema] : i.tema;
    mantidas.push(p && TIPOS_REEL.includes(p.tipo) ? { ...i, tipo: p.tipo, tema } : { ...i, tema });
  }
  const novaSemente = [...mantidas, ...ideiasNovas];
  const textoSemente = `${JSON.stringify(novaSemente, null, 2)}\n`;
  const sementeMudou = (await readFile(arquivoDados('ideias.json'), 'utf8').catch(() => '')) !== textoSemente;
  if (sementeMudou) await gravarTexto(arquivoDados('ideias.json'), textoSemente);

  const antesIdeias = JSON.stringify(db.ideias);
  const merge = mesclarIdeias(db, novaSemente);
  const removidas = [];
  const regravar = new Set();
  for (const [id, p] of antigas) {
    if (p.acao !== 'remover') continue;
    db.sementes.ideias = [...new Set([...(db.sementes.ideias ?? []), id])];
    const i = db.ideias.find((x) => x.id === id);
    if (!i) continue;
    for (const r of db.reels) {
      if (r.ideiaId === id) {
        r.ideiaId = null;
        regravar.add(r.id);
      }
    }
    db.ideias.splice(db.ideias.indexOf(i), 1);
    removidas.push(`${id} · ${i.titulo}`);
  }
  // mantida que o usuário editou (o merge não mexe): só ganha o tipo, se ainda não tem
  for (const [id, p] of antigas) {
    const i = p.acao === 'manter' && db.ideias.find((x) => x.id === id);
    if (i && i.tipo == null && TIPOS_REEL.includes(p.tipo)) i.tipo = p.tipo;
  }
  const ideiasMudaram = JSON.stringify(db.ideias) !== antesIdeias;

  // ---------- 3. reels ----------
  const tiposTrocados = [];
  for (const e of plano.cronograma.filter((x) => x.acao === 'manter')) {
    const r = db.reels.find((x) => x.id === e.reelIdAtual);
    if (!r) {
      avisos.push(`plano manda manter ${e.data} (${e.reelIdAtual}), mas esse reel não existe.`);
      continue;
    }
    if (r.data !== e.data) avisos.push(`reel ${r.id}: no plano a data é ${e.data}, no banco ${r.data || 'sem data'}.`);
    if (e.formatoId && r.formatoId !== e.formatoId) avisos.push(`reel ${r.id} (${r.data}): no plano o formato é ${e.formatoId}, no banco ${r.formatoId}. Ficou o do banco.`);
    if (!TIPOS_REEL.includes(e.tipo)) {
      avisos.push(`plano: tipo "${e.tipo}" de ${e.data} não existe.`);
      continue;
    }
    if (r.tipo !== e.tipo) {
      tiposTrocados.push(`${r.data} · ${ROTULO_TIPO[r.tipo] ?? 'sem tipo'} → ${ROTULO_TIPO[e.tipo]} · ${r.ideia}`);
      r.tipo = e.tipo;
      regravar.add(r.id);
    }
  }

  const saem = [];
  const entram = [];
  for (const { velhoId, novo } of trocas) {
    const velho = velhoId ? db.reels.find((x) => x.id === velhoId) : null;
    if (velho && (TRAVADOS.includes(velho.status) || velho.permalink || velho.metricas)) {
      avisos.push(`${velho.data} · "${velho.ideia}" já está ${velho.status}${velho.permalink ? ' e publicado' : ''}: não foi substituído por "${novo.ideia}".`);
      continue;
    }
    if (velho) {
      for (const i of db.ideias) if (i.reelId === velho.id) repontarIdeia(db, i.id, velho.id);
      for (const c of db.cases) if (c.reelId === velho.id) c.reelId = null;
      db.reels.splice(db.reels.indexOf(velho), 1);
      saem.push(velho);
    }
    if (db.reels.some((x) => mesmoReel(x, novo))) continue; // já importado numa rodada anterior
    const reel = { id: novoId('reel'), ...novo, criadoPor: AUTOR };
    db.reels.push(reel);
    const ideia = reel.ideiaId && db.ideias.find((i) => i.id === reel.ideiaId);
    if (ideia) ideia.reelId = reel.id;
    entram.push(reel);
  }

  // ---------- 4. episódio 1 da série Tá Chegando ----------
  let ep1 = null;
  const e1 = plano.cronograma.find((x) => x.data === EP1_DATA && x.acao === 'manter');
  const alvoEp1 = db.reels.find((r) => r.id === e1?.reelIdAtual) ?? db.reels.find((r) => r.data === EP1_DATA && /t[aá] chegando/i.test(r.ideia) && /epis[oó]dio 1/i.test(r.ideia));
  if (!alvoEp1) avisos.push(`não achei o episódio 1 da série Tá Chegando em ${EP1_DATA}: o teaser não foi mexido.`);
  else {
    const mudou = [];
    const ro = alvoEp1.roteiro ?? {};
    for (const c of ro.cenas ?? []) {
      let m;
      [c.fala, m] = trocar(c.fala ?? '', EP1_TROCAS.fala);
      if (m) mudou.push(`fala da cena ${c.tempo}`);
      [c.tela, m] = trocar(c.tela ?? '', EP1_TROCAS.tela);
      if (m) mudou.push(`texto de tela da cena ${c.tempo}`);
    }
    let m;
    [ro.desenvolvimento, m] = trocar(ro.desenvolvimento ?? '', EP1_TROCAS.fala);
    if (m) mudou.push('desenvolvimento');
    [alvoEp1.legenda, m] = trocar(alvoEp1.legenda ?? '', EP1_TROCAS.legenda);
    if (m) mudou.push('legenda');
    const gr = alvoEp1.gravacao ?? {};
    [gr.edicao, m] = trocar(gr.edicao ?? '', EP1_TROCAS.edicao);
    if (m) mudou.push('end card (edição)');
    gr.checklist = (gr.checklist ?? []).map((item, n) => {
      const [novo, mm] = trocar(item, EP1_TROCAS.checklist);
      if (mm) mudou.push(`checklist, item ${n + 1}`);
      return novo;
    });
    if (mudou.length) {
      Object.assign(alvoEp1, { atualizadoEm: agora(), atualizadoPor: AUTOR });
      regravar.add(alvoEp1.id);
      ep1 = `${alvoEp1.data} · ${alvoEp1.ideia}: ${mudou.join(', ')}`;
    }
  }

  // ---------- grava: banco, depois os reel.md ----------
  const bancoMudou = ideiasMudaram || tiposTrocados.length || saem.length || entram.length || ep1;
  if (bancoMudou) await salvar();
  const arquivos = [];
  for (const velho of saem) {
    try {
      const r = await apagarReelMdGerado(velho);
      arquivos.push(r.apagado ? `apagado ${path.relative(CONTEUDO, r.pasta)}/reel.md${r.sobrou.length ? ` (a pasta ficou: ${r.sobrou.join(', ')})` : ''}` : `mantido ${velho.origem || '(sem reel.md)'}: ${r.motivo}`);
    } catch (e) {
      avisos.push(`reel.md de ${velho.id} não foi apagado: ${e.message}`);
    }
  }
  for (const reel of entram) {
    try {
      await escreverReelMd(reel, { adiar: true });
      arquivos.push(`novo ${reel.origem}`);
    } catch (e) {
      avisos.push(`o reel ${reel.data} entrou no banco, mas o reel.md não foi escrito: ${e.message}`);
    }
  }
  for (const id of regravar) {
    const reel = db.reels.find((r) => r.id === id);
    if (!reel) continue;
    try {
      const p = await regravarSeGerado(reel);
      arquivos.push(p ? `regravado ${reel.origem}` : `não regravado ${reel.origem || reel.id} (escrito à mão ou sem arquivo)`);
    } catch (e) {
      avisos.push(`reel.md de ${reel.id} não foi regravado: ${e.message}`);
    }
  }
  if (entram.length) await salvar(); // origem (caminho do reel.md) de cada reel novo

  // ---------- 5. resumo ----------
  const porTipo = (lista) => TIPOS_REEL.map((t) => `${ROTULO_TIPO[t]} ${lista.filter((x) => x.tipo === t).length}`).join(' · ');
  const linhas = [
    '',
    '== Resumo da importação do nicho ==',
    `Formatos: ${comTipos.length} de ${db.formatos.length} com tipos${ganharam ? ` (${ganharam} ganharam agora)` : ''}`,
    `Ideias: ${db.ideias.length} no banco (${porTipo(db.ideias)} · sem tipo ${db.ideias.filter((i) => !i.tipo).length}). Merge: ${merge.novos} novas, ${merge.atualizados} atualizadas${removidas.length ? `, ${removidas.length} removidas` : ''}. ideias.json ${sementeMudou ? `reescrito (${novaSemente.length})` : 'já estava igual'}`,
    ...removidas.map((x) => `  - saiu ${x}`),
    `Reels: ${db.reels.length} no banco. Tipo trocado em ${tiposTrocados.length}, substituídos ${saem.length}, novos ${entram.length}`,
    ...tiposTrocados.map((x) => `  - ${x}`),
    ...saem.map((r) => `  - saiu ${r.data} · ${r.ideia} (${r.id})`),
    ...entram.map((r) => `  - entrou ${r.data} · ${ROTULO_TIPO[r.tipo]} · ${r.ideia} (${r.id})`),
    `Episódio 1 da série Tá Chegando: ${ep1 ? `teaser sem data (${ep1})` : 'nada a mudar'}`,
    ...(arquivos.length ? ['reel.md:', ...arquivos.map((x) => `  - ${x}`)] : ['reel.md: nada a mudar']),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    bancoMudou || sementeMudou ? `Pronto. Backup do banco de antes da primeira importação: ${arquivoDados(BACKUP)}` : 'Nada mudou: esta revisão já estava aplicada.',
  ];
  console.log(linhas.join('\n'));
}

try {
  await main();
  process.exit(0);
} catch (e) {
  console.error(`\nErro na importação: ${e.status ? e.message : e.stack}`);
  process.exit(1);
}
