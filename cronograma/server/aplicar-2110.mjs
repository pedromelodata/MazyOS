// Ajustes de dados de 21/10/2026 (pedidos do Pedro). Rode com o servidor PARADO:
//   node server/aplicar-2110.mjs [--simular]
// --simular mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia).
// Rodar de novo não muda nada.
//  1. "Ou é um ou é outro": peça com dois tipos (peca2) fica com um só, o que tem mais conteúdo escrito
//     (empate: o principal). O conteúdo do outro tipo continua guardado na peça, só não aparece
//  2. Rede: tudo é Instagram
//  3. Lançamento em 10/11/2026: o Pré-lançamento termina no lançamento (a oferta da lista segue até 31/12, F005)
import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const SIMULAR = process.argv.includes('--simular');
const DADOS = process.env.CRONOGRAMA_DATA ? path.resolve(process.env.CRONOGRAMA_DATA) : path.join(import.meta.dirname, '..', 'data');
const ARQ = path.join(DADOS, 'db.json');
const PORTA = Number(process.env.PORT) || 4317;
const REDE = 'Instagram';
const LANCAMENTO = '2026-11-10';
const OBJETIVO_ANTIGO = 'Engordar a lista de espera. Oferta real, válida até 31/12/2026';
const OBJETIVO_NOVO = 'Engordar a lista de espera até o lançamento: o app chega dia 10/11/2026. Oferta real, válida até 31/12/2026 pra quem entra na lista de espera: plano MEI a R$ 29 por mês nos 3 primeiros meses, depois R$ 49; plano ME a R$ 99 por mês nos 3 primeiros meses, depois R$ 139.';

const tem = (v) => Boolean(String(v ?? '').trim());
const conteudo = {
  reel: (r) => [r.roteiro?.hook, r.roteiro?.desenvolvimento, r.roteiro?.cta, ...(r.roteiro?.cenas ?? []).map((c) => c?.fala)].filter(tem).length,
  carrossel: (r) => [r.carrossel?.capa, ...(r.carrossel?.slides ?? []), r.carrossel?.final].filter((s) => tem(s?.titulo) || tem(s?.texto)).length,
  estatico: (r) => ['headline', 'apoio', 'cta', 'visual'].filter((k) => tem(r.estatico?.[k])).length,
  stories: (r) => (r.stories?.quadros ?? []).filter((q) => tem(q?.texto)).length,
};

function portaOcupada() {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: PORTA });
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('error', () => ok(false));
    s.setTimeout(1500, () => { s.destroy(); ok(false); });
  });
}

if (!SIMULAR && !process.env.CRONOGRAMA_DATA && (await portaOcupada())) {
  console.error(`O servidor está no ar na porta ${PORTA}. Pare ele antes (systemctl stop gestao-marketing) e rode de novo.`);
  process.exit(1);
}

const texto = await readFile(ARQ, 'utf8');
const db = JSON.parse(texto);
const log = [];

for (const r of db.reels ?? []) {
  if (tem(r.peca2)) {
    const tipos = [r.peca || 'reel', r.peca2];
    const pontos = tipos.map((t) => conteudo[t]?.(r) ?? 0);
    const fica = pontos[1] > pontos[0] ? tipos[1] : tipos[0];
    log.push(`${r.data || 'sem data'} · ${tipos.join('+')} → ${fica} (conteúdo ${pontos.join(' x ')}) · ${String(r.ideia).slice(0, 60)}`);
    r.peca = fica;
    r.peca2 = '';
  }
  if (r.rede !== REDE) {
    r.rede = REDE;
    log.push(`rede → Instagram · ${r.data || 'sem data'} · ${String(r.ideia).slice(0, 50)}`);
  }
}

const c = (db.campanhas ?? []).find((x) => x.id === 'cmp_prelancamento');
if (c) {
  if (c.fim !== LANCAMENTO) {
    log.push(`campanha: fim ${c.fim} → ${LANCAMENTO}`);
    c.fim = LANCAMENTO;
  }
  if (String(c.objetivo ?? '').startsWith(OBJETIVO_ANTIGO)) {
    c.objetivo = OBJETIVO_NOVO;
    log.push('campanha: objetivo com a data do lançamento');
  }
}

console.log(log.length ? log.join('\n') : 'Nada a mudar.');
if (SIMULAR || !log.length) process.exit(0);

const backup = path.join(DADOS, 'db.antes-2110.json');
if (!existsSync(backup)) await writeFile(backup, texto);
const tmp = `${ARQ}.tmp-2110`;
await writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
await rename(tmp, ARQ);
const conferido = JSON.parse(await readFile(ARQ, 'utf8'));
const ok = (conferido.reels ?? []).every((r) => !tem(r.peca2) && r.rede === REDE)
  && (conferido.campanhas ?? []).find((x) => x.id === 'cmp_prelancamento')?.fim === LANCAMENTO;
console.log(ok ? `Gravado e conferido (backup em ${path.basename(backup)}).` : 'ATENÇÃO: o arquivo gravado não bate com o esperado.');
process.exit(ok ? 0 : 1);
