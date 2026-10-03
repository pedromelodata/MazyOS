// Ajustes de regra na legenda e nas fontes da peça de 05/10 (reel_93834bb1, "Contabilidade tradicional vs Legalizaí"),
// feitos em 03/10 junto com a entrega do carrossel e do reel:
//  - "no plano ME" na frase do contador (regra dura: MEI nunca tem contador humano; F042 e F040 valem pro ME);
//  - crédito do modelo 3D do celular antes das hashtags (licença CC BY 4.0 exige; sem nome de marca);
//  - fontes que as telas mostram: F077 (o "Vence dia 20"), F094 (declarações no plano ME) e F148 (o escritório).
// Como os outros aplicar-*.mjs: recusa com o servidor no ar (ele regravaria o banco da memória por cima),
// backup antes de gravar, idempotente, e --simular só mostra.
//   node server/aplicar-legenda-0510.mjs [--simular]
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';

const SIMULAR = process.argv.includes('--simular');
const ID = 'reel_93834bb1';
const FRASE_ANTES = 'E quando o caso foge do padrão, quem olha é um contador com registro no CRC.';
const FRASE_DEPOIS = 'E quando o caso foge do padrão, no plano ME, quem olha é um contador com registro no CRC.';
const CREDITO = 'Modelos 3D: celular por polyman Studio (Sketchfab, CC BY 4.0), modificado.';
const FONTES_NOVAS = ['F077 · 07 §2 e §5', 'F094 · 07 §2 e §3', 'F148 · POS L55'];

const portaOcupada = (porta) => new Promise((ok) => {
  const s = net.connect({ host: '127.0.0.1', port: porta });
  s.once('connect', () => { s.destroy(); ok(true); });
  s.once('error', () => ok(false));
});

function ajustar(reel) {
  const mudancas = [];
  let legenda = String(reel.legenda ?? '');
  if (legenda.includes(FRASE_ANTES)) {
    legenda = legenda.replace(FRASE_ANTES, FRASE_DEPOIS);
    mudancas.push('legenda: "no plano ME" na frase do contador');
  } else if (!legenda.includes(FRASE_DEPOIS)) {
    throw new Error('a frase do contador não está na legenda como esperado; nada foi gravado');
  }
  if (!legenda.includes(CREDITO)) {
    const i = legenda.search(/\n\s*#/);
    legenda = i >= 0 ? `${legenda.slice(0, i).trimEnd()}\n\n${CREDITO}\n${legenda.slice(i).replace(/^\n+/, '\n')}` : `${legenda.trimEnd()}\n\n${CREDITO}`;
    mudancas.push('legenda: crédito do modelo 3D antes das hashtags');
  }
  const fontes = Array.isArray(reel.fontes) ? [...reel.fontes] : [];
  for (const f of FONTES_NOVAS) {
    const id = f.split(' ')[0];
    if (!fontes.some((x) => String(x).startsWith(id + ' '))) { fontes.push(f); mudancas.push(`fontes: ${id}`); }
  }
  return { legenda, fontes, mudancas };
}

if (await portaOcupada(4317)) {
  console.error('Tem um servidor no ar na porta 4317. Pare a Gestão de Marketing antes e rode de novo.');
  process.exit(1);
}
if (!existsSync(DB_PATH)) { console.error(`o banco ${DB_PATH} não existe`); process.exit(1); }
const original = await readFile(DB_PATH);
const cru = JSON.parse(original.toString('utf8'));
const alvo = (cru.reels ?? []).find((r) => r.id === ID);
if (!alvo) { console.error(`a peça ${ID} não está no banco`); process.exit(1); }
const previa = ajustar(alvo);
if (!previa.mudancas.length) { console.log('Nada mudou: a legenda e as fontes já estavam ajustadas.'); process.exit(0); }
console.log(`${SIMULAR ? 'SIMULAÇÃO (nada é gravado)\n' : ''}${ID}:\n  ${previa.mudancas.join('\n  ')}\n\nLegenda nova:\n${previa.legenda}\n`);
if (SIMULAR) process.exit(0);

const db = await carregar();
const reel = db.reels.find((r) => r.id === ID);
const feito = ajustar(reel);
reel.legenda = feito.legenda;
reel.fontes = feito.fontes;
reel.atualizadoEm = agora();
reel.atualizadoPor = 'Ajuste de regra na legenda (aplicar-legenda-0510)';
const backup = arquivoDados('db.antes-legenda-0510.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
console.log(`Pronto. Backup: ${backup}`);
