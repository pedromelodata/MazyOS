#!/usr/bin/env node
// Re-sincroniza _base-contabil/ com o vault do produto, que é a fonte da verdade.
// Sem dependências. Só LÊ o vault (arquivos + git log/status sem lock); nunca escreve nele.
//
// Uso (na raiz do workspace):
//   node scripts/sincronizar-base-contabil.mjs
//   node scripts/sincronizar-base-contabil.mjs --vault "C:\Legalizei\legalizei"
//   (ou a variável LEGALIZAI_VAULT)
//
// O que faz:
//   1. copia a LISTA abaixo, byte a byte, pra _base-contabil/ (a cópia é fiel, não edita nada);
//   2. grava _base-contabil/_manifesto.json (commit do vault, data, sha256 de cada arquivo);
//   3. reescreve só o bloco entre os marcadores do README.md (proveniência + tabela de arquivos);
//   4. avisa o que mudou desde a última sincronização e se o FATOS.md foi conferido
//      contra outro commit. FATOS.md, PROIBIDO.md e DIVERGENCIAS.md são escritos à mão e
//      o script nunca mexe neles: quando o vault muda, alguém revisa.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, '_base-contabil');
const iArg = process.argv.indexOf('--vault');
const VAULT = path.resolve(iArg > -1 ? process.argv[iArg + 1] : process.env.LEGALIZAI_VAULT || 'C:\\Legalizei\\legalizei');

const AGENTE = 'execucao/agente-whatsapp-vault';
const SKILLS = `${AGENTE}/skills-legalizai`;
const REFS = `${SKILLS}/base-legalizai/references`;

// [origem no vault, destino em _base-contabil, pra que serve]
const LISTA = [
  [`${SKILLS}/base-legalizai/SKILL.md`, 'base-legalizai/SKILL.md', 'Índice da base oficial que o Léo do WhatsApp consulta. Regra: número nunca sai de memória'],
  [`${REFS}/00-DIRETRIZES-SEGURANCA.md`, 'base-legalizai/00-DIRETRIZES-SEGURANCA.md', 'O que o Léo nunca faz (concorrente, "sem letra miúda", contador no MEI, prazo de abertura, valor de imposto do caso)'],
  [`${REFS}/01-PLANOS-E-OFERTAS.md`, 'base-legalizai/01-PLANOS-E-OFERTAS.md', 'Preços, promoção, validade, o que cada plano inclui, lista de espera e os 3 links'],
  [`${REFS}/02-PRODUTO-E-USABILIDADE.md`, 'base-legalizai/02-PRODUTO-E-USABILIDADE.md', 'Ordem real das etapas do app, corrigir dado, pré-lançamento'],
  [`${REFS}/03-REGRAS-DOS-ORGAOS.md`, 'base-legalizai/03-REGRAS-DOS-ORGAOS.md', 'Prefeitura de BH (IPTU, apartamento), endereço fiscal, taxa da JUCEMG, Receita, quem pode ser MEI'],
  [`${REFS}/04-QUEBRA-OBJECOES.md`, 'base-legalizai/04-QUEBRA-OBJECOES.md', 'Objeções por estágio de funil, com a estrutura da resposta'],
  [`${REFS}/05-DICIONARIO-CNAE-TRIBUTARIO.md`, 'base-legalizai/05-DICIONARIO-CNAE-TRIBUTARIO.md', 'CNAE, Anexos III e V, Fator R, MEI x ME e a régua de profissão'],
  [`${REFS}/06-CALCULO-FISCAL.md`, 'base-legalizai/06-CALCULO-FISCAL.md', 'Como o DAS da ME é calculado, faixas, Fator R, pró-labore, INSS e IRRF do sócio'],
  [`${REFS}/07-OBRIGACOES-MENSAIS.md`, 'base-legalizai/07-OBRIGACOES-MENSAIS.md', 'Rotina do MEI e da ME, quem faz o quê, nota fiscal, prazos'],
  [`${REFS}/08-MAPA-DO-DOSSIE.md`, 'base-legalizai/08-MAPA-DO-DOSSIE.md', 'Campo a campo do app de abertura e o motivo de cada um'],
  [`${REFS}/09-ESCOPO-E-LIMITES.md`, 'base-legalizai/09-ESCOPO-E-LIMITES.md', 'Pra quem a gente atende: BH, serviço, MEI e ME, os dois tetos, sócios, CNAEs'],
  [`${REFS}/10-CONTRATO-GARANTIA-CANCELAMENTO.md`, 'base-legalizai/10-CONTRATO-GARANTIA-CANCELAMENTO.md', '7 dias, fidelidade de 12 meses, multa de 30%'],
  [`${REFS}/11-COMO-CONSULTAR-CNAE.md`, 'base-legalizai/11-COMO-CONSULTAR-CNAE.md', 'O que é proibido afirmar sobre um CNAE específico e as 15 categorias do app'],
  [`${REFS}/12-GATE-DE-SAIDA.md`, 'base-legalizai/12-GATE-DE-SAIDA.md', 'Como dizer não sem perder a pessoa'],
  [`${AGENTE}/00-SOUL-personalidade.md`, 'leo/00-SOUL-personalidade.md', 'Quem o Léo é e como ele soa (ritmo, humor, quando fica sério)'],
  ['marca/personagem-leo.md', 'leo/personagem-leo.md', 'Bíblia do personagem Léo: pilares, o que ironiza, bordões, pilares de conteúdo, visual'],
  [`${SKILLS}/atendimento/SKILL.md`, 'leo/skill-atendimento.md', 'Skill de atendimento do Léo (piso da conversa, checklist antes de enviar)'],
  [`${SKILLS}/vendas/SKILL.md`, 'leo/skill-vendas.md', 'Skill de vendas do Léo (qualificação, preço em dois tempos, lista de espera, nunca em venda)'],
  [`${SKILLS}/escalacao/SKILL.md`, 'leo/skill-escalacao.md', 'Skill de escalação do Léo (multa, cancelamento, prejuízo: humor desligado)'],
  ['marca/decisoes-marca.md', 'marca/decisoes-marca.md', 'ADR da marca (entradas mais novas no fim). Autoridade em conflito de marca'],
  ['marca/copy/glossario-tecnico-humano.md', 'marca/glossario-tecnico-humano.md', 'Termo técnico e a tradução em fala de gente'],
  ['marca/copy/exemplos-copy-por-tela.md', 'marca/exemplos-copy-por-tela.md', 'Exemplos de copy de tela do app'],
  ['pesquisa/fontes/2026-09-14-fechamento-motor-fiscal-LITERAL.md', 'fontes-literais/2026-09-14-fechamento-motor-fiscal-LITERAL.md', 'Fonte legal literal: fechamento do motor fiscal'],
  ['pesquisa/fontes/2026-09-14-lacunas-motor-fiscal-LITERAL.md', 'fontes-literais/2026-09-14-lacunas-motor-fiscal-LITERAL.md', 'Fonte legal literal: lacunas do motor fiscal'],
  ['pesquisa/fontes/2026-09-15-defis-e-canais-LITERAL.md', 'fontes-literais/2026-09-15-defis-e-canais-LITERAL.md', 'Fonte legal literal: DEFIS e canais'],
  ['pesquisa/fontes/2026-09-15-elegibilidade-simples-LITERAL.md', 'fontes-literais/2026-09-15-elegibilidade-simples-LITERAL.md', 'Fonte legal literal: quem pode optar pelo Simples'],
  ['pesquisa/fontes/2026-09-15-pro-labore-por-socio-LITERAL.md', 'fontes-literais/2026-09-15-pro-labore-por-socio-LITERAL.md', 'Fonte legal literal: pró-labore por sócio, INSS e IRRF'],
  ['pesquisa/fontes/2026-09-16-redutor-irrf-consulta-LITERAL.md', 'fontes-literais/2026-09-16-redutor-irrf-consulta-LITERAL.md', 'Fonte legal literal: redutor do IRRF 2026'],
  ['pesquisa/fontes/2026-09-18-risco-medio-liberacao-bh-LITERAL.md', 'fontes-literais/2026-09-18-risco-medio-liberacao-bh-LITERAL.md', 'Fonte legal literal: risco médio e liberação em BH'],
  ['pesquisa/fontes/2026-09-18-transcricao-anexos-risco-bh-LITERAL.md', 'fontes-literais/2026-09-18-transcricao-anexos-risco-bh-LITERAL.md', 'Fonte legal literal: anexos de risco de BH transcritos'],
  ['pesquisa/fiscal-simples-bh-2026.md', 'pesquisa/fiscal-simples-bh-2026.md', 'Pesquisa fiscal Simples, ME de serviço, BH 2026 (bloco CONSOLIDADO no fim)'],
  ['pesquisa/exigencias-jucemg.md', 'pesquisa/exigencias-jucemg.md', 'O que trava um registro na JUCEMG (exigência x indeferimento)'],
  ['pesquisa/rotina-fiscal/2026-09-09-rotina-me-simples-bh.md', 'pesquisa/rotina-fiscal/2026-09-09-rotina-me-simples-bh.md', 'Rotina fiscal da ME do Simples em BH'],
  ['pesquisa/rotina-fiscal/2026-09-09-verificacao-auditoria-tributaria.md', 'pesquisa/rotina-fiscal/2026-09-09-verificacao-auditoria-tributaria.md', 'Auditoria que confere a rotina fiscal'],
  ['pesquisa/obrigacoes-operacionais/estado-atual-obrigacoes-operacionais.md', 'pesquisa/obrigacoes-operacionais/estado-atual-obrigacoes-operacionais.md', 'Estado da pesquisa de obrigações do MEI'],
  ['pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md', 'pesquisa/obrigacoes-operacionais/mei-obrigacoes-operacionais.md', 'Obrigações do MEI: DAS, nota, DASN-SIMEI, teto, MEI empregador'],
  ['pesquisa/obrigacoes-operacionais/mei-mapeamento-funcionalidades.md', 'pesquisa/obrigacoes-operacionais/mei-mapeamento-funcionalidades.md', 'Obrigações do MEI viradas em funcionalidade (não é promessa de produto)'],
  ['pesquisa/obrigacoes-operacionais/resultado-pesquisa-mei-obrigacoes-28-08.md', 'pesquisa/obrigacoes-operacionais/resultado-pesquisa-mei-obrigacoes-28-08.md', 'Resultado bruto da pesquisa de obrigações do MEI'],
  ['pesquisa/abertura-mei/abertura-mei-processo.md', 'pesquisa/abertura-mei/abertura-mei-processo.md', 'Como um MEI é aberto (canal oficial, o que é grátis, quem clica)'],
  ['pesquisa/abertura-mei/resultado-pesquisa-abertura-mei-28-08.md', 'pesquisa/abertura-mei/resultado-pesquisa-abertura-mei-28-08.md', 'Resultado bruto da pesquisa de abertura de MEI'],
  ['mkt/estrategia/estrategia-organica.md', 'estrategia/estrategia-organica.md', 'Estratégia orgânica viva (v4 de 01/09: facilidade, não economia de imposto)'],
  ['mkt/estrategia/mecanicas-engajamento.md', 'estrategia/mecanicas-engajamento.md', 'Mecânicas de engajamento e filtro de sensibilidade'],
  ['mkt/estrategia/posicionamento.md', 'estrategia/posicionamento.md', 'Posicionamento, arquétipo e frases-gatilho'],
  ['atelie/dados/legalizai/estrategia/00-decisoes-marca.md', 'estrategia/atelie/00-decisoes-marca.md', 'Cópia do Ateliê, mais antiga que marca/decisoes-marca.md (esta vence)'],
  ['atelie/dados/legalizai/estrategia/01-posicionamento.md', 'estrategia/atelie/01-posicionamento.md', 'Cópia do Ateliê, mais antiga que estrategia/posicionamento.md (esta vence)'],
  ['atelie/dados/legalizai/estrategia/02-estrategia-organica.md', 'estrategia/atelie/02-estrategia-organica.md', 'Cópia do Ateliê SEM a v4 de 01/09 (estrategia/estrategia-organica.md vence)'],
  ['atelie/dados/legalizai/estrategia/03-mecanicas-engajamento.md', 'estrategia/atelie/03-mecanicas-engajamento.md', 'Cópia do Ateliê, mais antiga que estrategia/mecanicas-engajamento.md (esta vence)'],
  ['atelie/dados/legalizai/estrategia/04-metodologia-personas.md', 'estrategia/atelie/04-metodologia-personas.md', 'Metodologia de personas e tom por dorsal'],
];

const INICIO = '<!-- sincronizar:inicio (bloco reescrito por scripts/sincronizar-base-contabil.mjs; não edite aqui dentro) -->';
const FIM = '<!-- sincronizar:fim -->';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const git = (...args) => execFileSync('git', ['--no-optional-locks', '-C', VAULT, ...args], { encoding: 'utf8' }).trim();
const hoje = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

function falhar(msg) {
  console.error(`ERRO: ${msg}`);
  process.exit(1);
}

if (!existsSync(path.join(VAULT, '.git'))) falhar(`vault não encontrado em ${VAULT} (use --vault <pasta>)`);

// 1. confere antes de copiar: arquivo que sumiu do vault para tudo, sem cópia pela metade
const faltando = LISTA.filter(([de]) => !existsSync(path.join(VAULT, de))).map(([de]) => de);
if (faltando.length) falhar(`sumiram do vault (ajuste a LISTA do script):\n  ${faltando.join('\n  ')}`);

const [commit, commitData, commitAutor, commitAssunto] = git('log', '-1', '--format=%H%n%cI%n%an%n%s').split('\n');
const sujos = git('status', '--porcelain', '--', ...LISTA.map(([de]) => de)).split('\n').filter(Boolean);

// fontes LITERAL novas no vault que ainda não estão na lista
const literaisNaLista = new Set(LISTA.map(([de]) => de));
const literaisNovas = readdirSync(path.join(VAULT, 'pesquisa', 'fontes'))
  .filter((n) => /LITERAL.*\.md$/i.test(n))
  .map((n) => `pesquisa/fontes/${n}`)
  .filter((de) => !literaisNaLista.has(de));

const manifestoPath = path.join(DESTINO, '_manifesto.json');
const anterior = existsSync(manifestoPath) ? JSON.parse(readFileSync(manifestoPath, 'utf8')) : null;
const shaAnterior = new Map((anterior?.arquivos ?? []).map((a) => [a.para, a.sha256]));

// 2. copia
const arquivos = [];
for (const [de, para, uso] of LISTA) {
  const origem = path.join(VAULT, de);
  const alvo = path.join(DESTINO, para);
  mkdirSync(path.dirname(alvo), { recursive: true });
  copyFileSync(origem, alvo);
  const buf = readFileSync(alvo);
  arquivos.push({ de, para, uso, bytes: buf.length, sha256: sha256(buf) });
}
const mudaram = arquivos.filter((a) => shaAnterior.has(a.para) && shaAnterior.get(a.para) !== a.sha256).map((a) => a.para);
const novos = arquivos.filter((a) => anterior && !shaAnterior.has(a.para)).map((a) => a.para);

const manifesto = {
  vault: VAULT,
  commit,
  commitData,
  commitAutor,
  commitAssunto,
  sincronizadoEm: hoje(),
  mudancasNaoCommitadas: sujos,
  arquivos: arquivos.map(({ de, para, bytes, sha256: s }) => ({ de, para, bytes, sha256: s })),
};
writeFileSync(manifestoPath, `${JSON.stringify(manifesto, null, 2)}\n`);

// 3. README: só o bloco entre os marcadores
const grupos = [
  ['base-legalizai/', 'Base oficial do Léo (a que o agente do WhatsApp lê antes de afirmar)'],
  ['leo/', 'Voz do Léo'],
  ['marca/', 'Marca'],
  ['fontes-literais/', 'Fontes legais literais'],
  ['pesquisa/', 'Pesquisa fiscal, rotina, obrigações e abertura'],
  ['estrategia/', 'Estratégia orgânica'],
];
const tabela = grupos
  .map(([pref, titulo]) => {
    const linhas = arquivos
      .filter((a) => a.para.startsWith(pref))
      .map((a) => `| \`${a.para}\` | \`${a.de}\` | ${a.uso} |`);
    return `### ${titulo}\n\n| Arquivo aqui | Origem no vault | Pra que serve |\n|---|---|---|\n${linhas.join('\n')}`;
  })
  .join('\n\n');

const bloco = [
  INICIO,
  '',
  '## Proveniência (gerado pelo script)',
  '',
  `- Vault: \`${VAULT}\``,
  `- Commit: \`${commit}\``,
  `- Data do commit: ${commitData.slice(0, 10)} (${commitAutor})`,
  `- Assunto do commit: ${commitAssunto.replace(/[\u2013\u2014]/g, ',')}`,
  `- Sincronizado em: ${manifesto.sincronizadoEm}`,
  `- Arquivos copiados: ${arquivos.length} (sha256 de cada um em \`_manifesto.json\`)`,
  sujos.length
    ? `- ATENÇÃO: a cópia inclui mudanças NÃO commitadas do vault em: ${sujos.map((s) => `\`${s.slice(3)}\``).join(', ')}`
    : '- Os arquivos copiados estavam iguais ao commit (sem mudança local no vault)',
  '',
  tabela,
  '',
  FIM,
].join('\n');

const readmePath = path.join(DESTINO, 'README.md');
let readme = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : '# Base contábil do conteúdo\n\n';
const i = readme.indexOf(INICIO.slice(0, 25));
const f = readme.indexOf(FIM);
readme = i > -1 && f > i ? readme.slice(0, i) + bloco + readme.slice(f + FIM.length) : `${readme.trimEnd()}\n\n${bloco}\n`;
writeFileSync(readmePath, readme);

// 4. avisos
console.log(`Copiados ${arquivos.length} arquivos do vault (commit ${commit.slice(0, 12)}, ${commitData.slice(0, 10)}).`);
if (sujos.length) console.log(`ATENÇÃO: mudanças não commitadas no vault entraram na cópia:\n  ${sujos.join('\n  ')}`);
if (mudaram.length || novos.length) {
  console.log('Mudou desde a última sincronização:');
  for (const p of [...mudaram, ...novos]) console.log(`  ${p}`);
  console.log('Revise FATOS.md e PROIBIDO.md contra esses arquivos antes de produzir conteúdo.');
} else if (anterior) console.log('Nenhum arquivo mudou desde a última sincronização.');
if (literaisNovas.length) console.log(`Fontes LITERAL novas no vault, fora da lista (avalie incluir):\n  ${literaisNovas.join('\n  ')}`);
const fatosPath = path.join(DESTINO, 'FATOS.md');
if (existsSync(fatosPath)) {
  const m = readFileSync(fatosPath, 'utf8').match(/Conferido contra o commit[^`]*`([0-9a-f]{7,40})`/);
  if (!m) console.log('FATOS.md não diz contra qual commit foi conferido.');
  else if (!commit.startsWith(m[1])) console.log(`FATOS.md foi conferido contra o commit ${m[1].slice(0, 12)}; o vault agora está em ${commit.slice(0, 12)}. Revise antes de produzir.`);
  else console.log('FATOS.md está conferido contra este mesmo commit.');
} else console.log('FATOS.md ainda não existe.');
