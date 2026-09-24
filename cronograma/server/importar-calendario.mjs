// Aplica o calendário editorial oficial do mês (CSV exportado da planilha "Calendário Editorial e
// Monitoramento") no cronograma. Decisão do dono em 24/09/2026: o CSV manda. Rode com o servidor PARADO:
//   npm run importar-calendario [caminho do CSV]      (ou CRONOGRAMA_CALENDARIO=<csv>)
// CRONOGRAMA_DATA troca a pasta de dados e CRONOGRAMA_CONTEUDO a dos reel.md (teste numa cópia).
// Rodar de novo com o mesmo CSV não muda nada.
//
//  0. lê e confere o CSV inteiro antes de escrever; backup do db.json (db.antes-calendario-<mês>.json
//     na primeira vez, db.antes-calendario-<mês>.ultimo.json a cada rodada)
//  1. cada peça do CSV vira (ou atualiza) um item do cronograma naquela data, marcado com
//     calendario = "csv:<data>". Onde um reel do mês já cobria o mesmo assunto (CASAMENTOS), ele muda
//     pra data do CSV e ganha os campos do calendário, com roteiro e gravação de antes
//  2. todo reel do mês que não é peça do CSV vira ideia no Banco de Ideias (roteiro base, fontes e o
//     caminho do reel.md nas notas) e sai do cronograma. O reel.md fica onde está
//  3. reel.md: regravado (gerador de reelmd.mjs) nos itens com roteiro que mudaram nesta rodada
//  4. resumo
//
// Campos do CSV → reel: Data → data · Pilar → pilar (número) + pilarTexto · Bloco → tipo (Afeto →
// conexao, Educação → ensino, Diferencial e Conversão → vendas; humor com "potencial de
// compartilhamento" → viralizacao) · Tema → ideia e tema · Formato → formatoTexto (e formatoId só
// quando o texto nomeia um formato da biblioteca; peça que não é reel fica em formato livre) · Rede →
// rede · Gatilho / observação → gatilho · Status → status (sem rebaixar reel que já tem roteiro) ·
// Link do post → permalink · Candidato a impulsionar → impulsionar (Sim, Não, Avaliar)
import { readFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {
  APP, DATA_DIR, DB_PATH, arquivoDados, carregar, salvar, repontarIdeia, agora, TRACOS, ROTULO_TIPO, dataValida,
  gravacaoVazia,
} from './db.mjs';
import { conferirReel, conferirRefs, limparIdeia, ideiaPadrao, chaveTitulo, roteiroLimpo } from './validar.mjs';
import { escreverReelMd, regravarSeGerado, CONTEUDO } from './reelmd.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';

const AUTOR = 'Calendário editorial (CSV)';
// o nome do arquivo exportado tem travessão: montado por código pra nenhum aparecer no fonte
const TRAVESSAO = String.fromCharCode(0x2014);
const CSV_PADRAO = `C:\\Users\\EDIT-ADMIN\\Downloads\\Legalizaí ${TRAVESSAO} Calendário Editorial e Monitoramento ${TRAVESSAO} Outubro 2026 - Calendario Outubro.csv`;

// reel do cronograma que já cobre a peça do CSV: data do CSV → id do reel + pedaço do título que
// precisa bater (se o título mudou, o casamento não acontece e a peça entra vazia, com aviso)
const CASAMENTOS = {
  '2026-10-05': { id: 'reel_93834bb1', titulo: 'o dia em que o brasil criou o cnpj' },
  '2026-10-12': { id: 'reel_6e36427c', titulo: 'serie ta chegando episodio 1' },
  '2026-10-14': { id: 'reel_e1977777', titulo: 'desafio 40 segundos e um cafe' },
  '2026-10-19': { id: 'reel_de900d74', titulo: 'golpe do boleto do mei' },
  '2026-10-21': { id: 'reel_43adf4b9', titulo: 'mei aposenta o mauro responde' },
  '2026-10-30': { id: 'reel_5045fe9b', titulo: 'do talao a nota nacional' },
};

// tema do Banco de Ideias pra cada reel que vira ideia (id de tema do guia ou rótulo conhecido)
const TEMA_DA_IDEIA = {
  reel_c2487437: 'app',
  reel_ceee49f7: 'tm_pf_pj',
  reel_fbc8c1b1: 'tm_trocar_contador',
  reel_85b089fd: 'tm_bh_alvara_iss',
  reel_0e236fab: 'app',
  reel_fc796628: 'tm_prolabore_lucro',
  reel_f6b28e65: 'tm_burocracia',
  reel_500f7412: 'tm_ferias_mei',
  reel_430afeae: 'tm_papelada_cansa',
  reel_b9685341: 'tm_cliente_atrasa',
  reel_daceb1cb: 'tm_mei_ou_me',
};

const TIPO_DO_BLOCO = { afeto: 'conexao', educacao: 'ensino', diferencial: 'vendas', conversao: 'vendas' };
const STATUS_DO_CSV = {
  planejado: 'ideia', planejada: 'ideia', 'a fazer': 'ideia', pendente: 'ideia', ideia: 'ideia', '': 'ideia',
  roteiro: 'roteiro', roteirizado: 'roteiro', 'em producao': 'roteiro', 'em andamento': 'roteiro',
  gravado: 'gravado', gravada: 'gravado',
  editado: 'editado', editada: 'editado', pronto: 'editado', pronta: 'editado', aprovado: 'editado', agendado: 'editado',
  publicado: 'publicado', publicada: 'publicado', postado: 'publicado', postada: 'publicado', 'no ar': 'publicado',
};
const ORDEM_STATUS = ['ideia', 'roteiro', 'gravado', 'editado', 'publicado'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const FLAG_PRECO = 'Conferir preço com o Pedro antes de produzir';
const NOTA_PRECO = `${FLAG_PRECO}: o CSV traz MEI R$29 e ME R$99, e a memória da marca e a campanha Pré-lançamento dizem MEI R$19 e ME R$79 nos 3 primeiros meses (depois R$49 e R$139).`;
const NOTA_CONTADOR = 'Tema mantido como veio do calendário, mas o QA vai apontar ironia com a profissão em "contador que some": o Legalizaí tem contador CRC de verdade. Mirar no sistema e na falta de resposta, não no contador como classe.';

const sem = (s) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const falhar = (msg) => {
  console.error(`\nNada foi importado: ${msg}`);
  process.exit(1);
};

function portaOcupada(porta) {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: porta });
    s.setTimeout(800);
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('timeout', () => { s.destroy(); ok(false); });
    s.once('error', () => ok(false));
  });
}

// CSV com aspas, vírgula e quebra de linha dentro do campo (RFC 4180)
function lerCsv(texto) {
  const linhas = [];
  let linha = [];
  let campo = '';
  let aspas = false;
  const t = texto.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const semTraco = (s) => String(s ?? '').trim().replace(TRACOS, ', ').replace(/\s+/g, ' ');
// "16 (travessão) Dicas empresariais" → { numero: 16, texto: "16 · Dicas empresariais" }
function pilarDoCsv(s) {
  const m = String(s ?? '').trim().match(/^(\d+)\s*[\u2014\u2013-]?\s*(.*)$/);
  if (!m) return { numero: null, texto: semTraco(s) };
  return { numero: Number(m[1]), texto: m[2] ? `${m[1]} · ${semTraco(m[2])}` : m[1] };
}

function pecasDoCsv(texto) {
  const linhas = lerCsv(texto);
  const iCab = linhas.findIndex((l) => sem(l[0]) === 'data' && l.some((x) => sem(x) === 'tema'));
  if (iCab < 0) falhar('não achei a linha de cabeçalho (Data, Dia, Pilar, ...) no CSV.');
  const cab = linhas[iCab].map(sem);
  const col = (nome) => {
    const i = cab.findIndex((c) => c === nome || c.startsWith(`${nome} `) || c.startsWith(`${nome}(`));
    if (i < 0) falhar(`o CSV não tem a coluna "${nome}".`);
    return i;
  };
  const C = {
    data: col('data'), dia: col('dia'), pilar: col('pilar'), bloco: col('bloco'), tema: col('tema'), formato: col('formato'),
    rede: col('rede'), gatilho: col('gatilho / observacao'), status: col('status'), link: col('link do post'),
    impulsionar: col('candidato a impulsionar'),
  };
  const pecas = [];
  for (const [n, l] of linhas.slice(iCab + 1).entries()) {
    if (!l.some((x) => x.trim())) continue;
    const bruto = (k) => String(l[C[k]] ?? '').trim();
    const m = bruto('data').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) falhar(`linha ${iCab + n + 2} do CSV: a data "${bruto('data')}" não é DD/MM/AAAA.`);
    const data = `${m[3]}-${m[2]}-${m[1]}`;
    if (!dataValida(data)) falhar(`linha ${iCab + n + 2} do CSV: ${bruto('data')} não existe.`);
    if (!bruto('tema')) falhar(`${bruto('data')}: peça sem tema.`);
    const statusCsv = sem(bruto('status'));
    const imp = sem(bruto('impulsionar'));
    pecas.push({
      data,
      dia: sem(bruto('dia')),
      pilar: pilarDoCsv(bruto('pilar')),
      bloco: semTraco(bruto('bloco')),
      tema: semTraco(bruto('tema')),
      formatoTexto: semTraco(bruto('formato')),
      rede: semTraco(bruto('rede')),
      gatilho: semTraco(bruto('gatilho')),
      statusCsv: bruto('status'),
      status: STATUS_DO_CSV[statusCsv] ?? null,
      permalink: bruto('link'),
      impulsionar: imp === 'sim' ? 'Sim' : imp === 'nao' ? 'Não' : imp === 'avaliar' ? 'Avaliar' : null,
      impulsionarCsv: bruto('impulsionar'),
    });
  }
  return pecas;
}

function tipoDaPeca(p) {
  const humor = /humor/i.test(p.tema) && /compartilhamento/i.test(p.gatilho);
  if (humor) return 'viralizacao';
  return TIPO_DO_BLOCO[sem(p.bloco).split(/[\s/]/)[0]] ?? null;
}

// formato da biblioteca que o texto do CSV nomeia (ex.: "formato 'Traduzindo o contabilês'")
function formatoNomeado(db, texto) {
  const k = ` ${chaveTitulo(texto)} `;
  return db.formatos.find((f) => chaveTitulo(f.nome).length >= 12 && k.includes(` ${chaveTitulo(f.nome)} `)) ?? null;
}
const ehReel = (texto) => /\breels?\b/i.test(texto);

const temRoteiro = (r) => Boolean(r.roteiro && (r.roteiro.hook?.trim() || r.roteiro.desenvolvimento?.trim() || r.roteiro.cenas?.length));
const juntar = (...partes) => partes.filter((x) => x && x.trim()).join(' ');

async function main() {
  const csv = path.resolve(process.argv[2] || process.env.CRONOGRAMA_CALENDARIO || CSV_PADRAO);
  const dadosReais = path.resolve(DATA_DIR) === path.join(APP, 'data');
  if (dadosReais) {
    for (const porta of new Set([Number(process.env.PORT) || 4317, 4317])) {
      if (await portaOcupada(porta)) falhar(`tem um servidor no ar na porta ${porta}. Pare o servidor da Gestão de Marketing antes e rode de novo.`);
    }
  }
  if (!existsSync(csv)) falhar(`o CSV ${csv} não existe.`);
  console.log(`Calendário: ${csv}\nDados: ${DATA_DIR}\nreel.md: ${CONTEUDO}\n`);

  // ---------- 0. lê e confere tudo antes de escrever ----------
  const pecas = pecasDoCsv(await readFile(csv, 'utf8'));
  if (!pecas.length) falhar('o CSV não tem nenhuma peça.');
  const meses = [...new Set(pecas.map((p) => p.data.slice(0, 7)))];
  if (meses.length !== 1) falhar(`o CSV mistura meses (${meses.join(', ')}). Um CSV por mês.`);
  const mes = meses[0];
  const datas = new Set();
  const avisos = [];
  for (const p of pecas) {
    if (datas.has(p.data)) falhar(`${p.data} aparece duas vezes no CSV. Uma peça por dia (o item é casado pela data).`);
    datas.add(p.data);
    const dia = DIAS[new Date(`${p.data}T12:00:00Z`).getUTCDay()];
    if (p.dia && sem(p.dia).slice(0, 3) !== dia) avisos.push(`${p.data}: o CSV diz "${p.dia}", mas o dia é ${dia}.`);
    if (!p.status) falhar(`${p.data}: status "${p.statusCsv}" do CSV não tem equivalente (ideia, roteiro, gravado, editado, publicado).`);
    if (p.impulsionarCsv && !p.impulsionar) falhar(`${p.data}: "Candidato a impulsionar" = "${p.impulsionarCsv}" (esperado Sim, Não ou Avaliar).`);
    if (!p.pilar.numero) falhar(`${p.data}: o pilar "${p.pilar.texto}" não começa pelo número.`);
    if (!tipoDaPeca(p)) falhar(`${p.data}: o bloco "${p.bloco}" não tem tipo (Afeto, Educação, Diferencial, Conversão).`);
  }

  if (existsSync(DB_PATH)) {
    const primeiro = arquivoDados(`db.antes-calendario-${mes}.json`);
    if (!existsSync(primeiro)) {
      await copyFile(DB_PATH, primeiro);
      console.log(`Backup do banco (primeira importação deste mês): ${primeiro}`);
    }
    await copyFile(DB_PATH, arquivoDados(`db.antes-calendario-${mes}.ultimo.json`));
  }

  const db = await carregar(); // migração do boot: pilares 16 e 17 entram aqui
  for (const p of pecas) {
    if (!db.pilares.some((x) => x.id === p.pilar.numero)) falhar(`${p.data}: o pilar ${p.pilar.numero} não existe no banco.`);
  }

  // ---------- 1. peças do CSV ----------
  const antes = new Map(db.reels.map((r) => [r.id, JSON.stringify(r)]));
  const usados = new Set();
  const novos = [];
  const movidos = [];
  const atualizados = [];
  for (const p of pecas) {
    const marca = `csv:${p.data}`;
    let r = db.reels.find((x) => x.calendario === marca);
    let origem = 'ja-importado';
    if (!r) {
      const c = CASAMENTOS[p.data];
      const alvo = c && db.reels.find((x) => x.id === c.id);
      if (c && !alvo) avisos.push(`${p.data}: o reel ${c.id} que cobria esta peça não existe mais. A peça entrou vazia.`);
      else if (alvo && !chaveTitulo(alvo.ideia).includes(c.titulo)) avisos.push(`${p.data}: o reel ${c.id} mudou de título ("${alvo.ideia}"). A peça entrou vazia.`);
      else if (alvo && alvo.calendario) avisos.push(`${p.data}: o reel ${c.id} já é a peça ${alvo.calendario}. A peça entrou vazia.`);
      else if (alvo && !String(alvo.data ?? '').startsWith(mes)) avisos.push(`${p.data}: o reel ${c.id} não está mais em ${mes}. A peça entrou vazia.`);
      else if (alvo) {
        r = alvo;
        origem = 'movido';
        const deAntes = `Roteiro aproveitado do reel "${alvo.ideia}" (estava em ${alvo.data.slice(8, 10)}/${alvo.data.slice(5, 7)}${alvo.formatoId ? `, formato ${db.formatos.find((f) => f.id === alvo.formatoId)?.codigo ?? alvo.formatoId}` : ''}). Conferir se o roteiro cobre o tema do calendário antes de gravar.`;
        movidos.push({ r, de: alvo.data, titulo: alvo.ideia });
        r.notas = juntar(r.notas, deAntes);
      }
    }
    if (!r) {
      r = {
        id: `reel_c${p.data.replaceAll('-', '').slice(2)}`, // reel_c261002: estável e legível
        ideia: '', tema: '', pilar: null, formatoId: null, campanhaId: CAMPANHA_PADRAO, data: p.data, status: 'ideia',
        roteiro: roteiroLimpo(null), legenda: '', permalink: '', metricas: null, ideiaId: null, favorito: false,
        tipo: null, gravacao: gravacaoVazia(), fontes: [], criadoEm: agora(), criadoPor: AUTOR,
      };
      if (db.reels.some((x) => x.id === r.id)) r.id = `${r.id}_${Math.random().toString(16).slice(2, 6)}`;
      db.reels.push(r);
      origem = 'novo';
      novos.push(r);
    }
    usados.add(r.id);

    // campos do calendário: o CSV manda
    const fmtNomeado = formatoNomeado(db, p.formatoTexto);
    let formatoId = r.formatoId ?? null;
    if (fmtNomeado) formatoId = fmtNomeado.id;
    else if (!ehReel(p.formatoTexto)) formatoId = null; // carrossel, estático: formato livre
    if (origem === 'movido' && r.formatoId && formatoId !== r.formatoId) {
      r.notas = juntar(r.notas, fmtNomeado
        ? `O calendário pede o formato ${fmtNomeado.codigo} (${fmtNomeado.nome}): ajustar o roteiro.`
        : 'O calendário pede uma peça que não é reel: adaptar o roteiro pro formato do calendário.');
    }
    let gatilho = p.gatilho;
    const notas = [];
    if (/R\$\s*29|R\$\s*99/.test(p.tema)) {
      gatilho = juntar(gatilho.replace(/[.\s]*$/, '.'), `${FLAG_PRECO}.`);
      notas.push(NOTA_PRECO);
    }
    if (/contador que some/i.test(p.tema)) notas.push(NOTA_CONTADOR);
    let notasFinal = r.notas ?? '';
    for (const n of notas) if (!notasFinal.includes(n)) notasFinal = juntar(notasFinal, n);

    const statusAtual = ORDEM_STATUS.indexOf(r.status);
    let status = p.permalink ? 'publicado' : p.status;
    // "Planejado" não rebaixa reel que já tem roteiro (ou foi gravado)
    if (origem !== 'novo' && statusAtual > ORDEM_STATUS.indexOf(status)) status = r.status;

    const campos = conferirReel({
      data: p.data,
      ideia: p.tema,
      tema: p.tema,
      pilar: p.pilar.numero,
      pilarTexto: p.pilar.texto,
      tipo: tipoDaPeca(p),
      formatoId,
      formatoTexto: p.formatoTexto,
      rede: p.rede,
      gatilho,
      impulsionar: p.impulsionar,
      status,
      notas: notasFinal,
      ...(p.permalink ? { permalink: p.permalink } : {}),
    }, r);
    conferirRefs(db, campos);
    Object.assign(r, campos, { calendario: `csv:${p.data}` });
    if (origem === 'ja-importado' && antes.get(r.id) !== JSON.stringify(r)) atualizados.push(r);
  }

  // ---------- 2. o resto do mês vira ideia ----------
  const viraramIdeia = [];
  for (const r of [...db.reels]) {
    if (!String(r.data ?? '').startsWith(mes) || usados.has(r.id)) continue;
    const id = `ide_cal_${r.id.replace(/^reel_/, '')}`;
    let ideia = db.ideias.find((i) => i.id === id);
    if (!ideia) {
      const ro = r.roteiro ?? {};
      const deOrigem = r.ideiaId ? db.ideias.find((i) => i.id === r.ideiaId) : null;
      let tema = TEMA_DA_IDEIA[r.id] ?? deOrigem?.tema ?? null;
      const bruto = {
        titulo: r.ideia,
        descricao: r.tema ?? '',
        tipo: r.tipo ?? null,
        tema,
        formatoId: r.formatoId && db.formatos.some((f) => f.id === r.formatoId) ? r.formatoId : null,
        gancho: ro.hook ?? '',
        roteiroBase: { hook: ro.hook ?? '', textoTela: ro.textoTela ?? '', narracao: ro.desenvolvimento ?? '', cta: ro.cta ?? '' },
        fontes: r.fontes ?? [],
        notas: `Veio do cronograma de outubro antes do calendário oficial; roteiro completo em ${r.origem || '(sem reel.md)'}`,
      };
      let limpa;
      try {
        limpa = limparIdeia(bruto);
      } catch (e) {
        avisos.push(`ideia de ${r.id}: ${e.message} (entrou sem tema).`);
        limpa = limparIdeia({ ...bruto, tema: null });
      }
      ideia = { id, ...ideiaPadrao(), ...limpa, origem: 'manual', reelId: null, criadaEm: agora(), criadaPor: AUTOR };
      db.ideias.push(ideia);
    }
    for (const i of db.ideias) if (i.reelId === r.id) repontarIdeia(db, i.id, r.id);
    for (const c of db.cases) if (c.reelId === r.id) c.reelId = null;
    db.reels.splice(db.reels.indexOf(r), 1);
    viraramIdeia.push({ r, ideia });
  }

  // atualizadoEm só em quem mudou de verdade
  const mudaram = db.reels.filter((r) => usados.has(r.id) && antes.has(r.id) && antes.get(r.id) !== JSON.stringify(r));
  for (const r of mudaram) Object.assign(r, { atualizadoEm: agora(), atualizadoPor: AUTOR });

  const bancoMudou = novos.length || mudaram.length || viraramIdeia.length;
  if (bancoMudou) await salvar();

  // ---------- 3. reel.md ----------
  const arquivos = [];
  for (const r of [...novos, ...mudaram]) {
    if (!temRoteiro(r)) continue;
    try {
      if (r.origem) {
        const p = await regravarSeGerado(r);
        arquivos.push(p ? `regravado ${r.origem}` : `não regravado ${r.origem} (escrito à mão)`);
      } else {
        await escreverReelMd(r, { adiar: true });
        arquivos.push(`novo ${r.origem}`);
      }
    } catch (e) {
      avisos.push(`reel.md de ${r.id}: ${e.message}`);
    }
  }
  if (arquivos.some((x) => x.startsWith('novo'))) await salvar();

  // ---------- 4. resumo ----------
  const doMes = db.reels.filter((r) => String(r.data ?? '').startsWith(mes)).sort((a, b) => a.data.localeCompare(b.data));
  const fmt = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const linhas = [
    '',
    `== Resumo do calendário ${mes} ==`,
    `CSV: ${pecas.length} peças. Cronograma de ${mes}: ${doMes.length} itens (${doMes.filter((r) => r.calendario).length} do calendário)`,
    `Novos (sem roteiro ainda): ${novos.length}`,
    ...novos.map((r) => `  - ${fmt(r.data)} · ${ROTULO_TIPO[r.tipo]} · ${r.ideia}`),
    `Reels que já existiam e foram pra data do CSV: ${movidos.length}`,
    ...movidos.map((m) => `  - ${fmt(m.de)} → ${fmt(m.r.data)} · "${m.titulo}" agora é "${m.r.ideia}"`),
    ...(atualizados.length ? [`Peças já importadas que mudaram: ${atualizados.length}`, ...atualizados.map((r) => `  - ${fmt(r.data)} · ${r.ideia}`)] : []),
    `Viraram ideia (saíram do cronograma, reel.md mantido): ${viraramIdeia.length}`,
    ...viraramIdeia.map(({ r, ideia }) => `  - ${fmt(r.data)} · ${r.ideia} → ${ideia.id}`),
    ...(arquivos.length ? ['reel.md:', ...arquivos.map((x) => `  - ${x}`)] : ['reel.md: nada a mudar']),
    ...(avisos.length ? ['Avisos:', ...avisos.map((x) => `  - ${x}`)] : []),
    bancoMudou ? `Pronto. Backup de antes da primeira importação: ${arquivoDados(`db.antes-calendario-${mes}.json`)}` : 'Nada mudou: este calendário já estava aplicado.',
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
