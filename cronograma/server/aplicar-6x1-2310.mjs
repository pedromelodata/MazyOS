// Ajuste do Pedro de 23/10/2026 no carrossel "Se você tem colaborador, esse post é pra você: a escala 6x1 acabou"
// (reel_1ba95c15). Rode com o servidor PARADO:
//   node server/aplicar-6x1-2310.mjs [--simular]
// --simular mostra o que mudaria, sem gravar. CRONOGRAMA_DATA troca a pasta de dados (teste numa cópia). Rodar de novo
// não muda nada: cada troca só acontece enquanto o texto antigo estiver lá.
// Pedro (23/10): "no post de escala 6x1 temos que substituir o slide 6" por "o colaborador somente pode trabalhar mais
// de 8 horas pela aprovação do seu sindicato" e, no slide 5, "1 domingo de folga ao mês pelo menos, obrigatório, e as
// mulheres 2 domingos por mês". Nenhuma das duas está no FATOS.md, e as fontes da peça (Senado e Agência Brasil,
// 16/10/2026) não trazem o domingo por mês nem a regra das mulheres; pela Agência Brasil, passar de 8 horas é hora
// extra paga, e o acordo ou a convenção coletiva é pra escala diferente da 5x2, com compensação. O Pedro escolheu ficar
// com as fontes, e mandou a da regra das mulheres (CLT, art. 386: "havendo trabalho aos domingos, será organizada uma
// escala de revezamento quinzenal que favoreça o repouso dominical"). Fica assim (a capa é o slide 1):
//  - slide 6 ("E a empresa pequena?") vira "Mais de 8 horas no dia", com o que a Agência Brasil diz;
//  - slide 5 (a folga de domingo) ganha a escala quinzenal das mulheres pela CLT, e a fonte entra nas fontes da peça.
//    O "1 domingo por mês" de todo mundo fica de fora: não tem fonte
// A peça passa pela regra de sempre da aprovação (conferirMudancaAprovada): o pendente com gerente que já aprovou volta
// pros gerentes; o aprovado vira "alterado". O reel.md que o cronograma gerou (se houver) é regravado. Backup do db.json
// de antes: db.antes-6x1-2310.json na primeira vez (nunca regravado)
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { DB_PATH, arquivoDados, carregar, salvar, agora } from './db.mjs';
import { conferirReel } from './validar.mjs';
import { fotoDaAprovacao, conferirMudancaAprovada } from './aprovacoes.mjs';
import { regravarSeGerado } from './reelmd.mjs';

const SIMULAR = process.argv.includes('--simular');
const PORTA = Number(process.env.PORT) || 4317;
const AUTOR = 'Ajuste do 6x1 de 23/10 (aplicar-6x1-2310)';
const QUEM = { nome: AUTOR, id: null, sistema: true };
const ID = 'reel_1ba95c15';
// cada troca: o slide pelo título de agora, o texto de agora (null: qualquer um) e o que ele vira
const TROCAS = [
  {
    onde: 'A folga de domingo',
    de: 'Um dos dois dias de descanso deve cair, de preferência, no domingo.',
    para: { texto: 'Um dos dois dias de descanso deve cair, de preferência, no domingo. Pras mulheres, a CLT já pede escala quinzenal: um domingo de folga a cada 15 dias.' },
  },
  {
    onde: 'E a empresa pequena?',
    de: null,
    para: {
      titulo: 'Mais de 8 horas no dia',
      texto: 'Passou de 8 horas, é hora extra, paga. Escala diferente da 5x2, com compensação, só com convenção ou acordo coletivo, pelo sindicato.',
      visual: 'Card de texto, o 8 em destaque',
    },
  },
];
const FONTE = 'Fora do FATOS: CLT, art. 386 ("havendo trabalho aos domingos, será organizada uma escala de revezamento quinzenal, que favoreça o repouso dominical"), mandada pelo Pedro em 23/10/2026';

const sair = (msg, codigo = 1) => { console.error(msg); process.exit(codigo); };
function portaOcupada() {
  return new Promise((ok) => {
    const s = net.connect({ host: '127.0.0.1', port: PORTA });
    s.once('connect', () => { s.destroy(); ok(true); });
    s.once('error', () => ok(false));
  });
}
if (!SIMULAR && !process.env.CRONOGRAMA_DATA && (await portaOcupada())) {
  sair(`O servidor está no ar na porta ${PORTA}. Pare ele antes (systemctl stop gestao-marketing) e rode de novo.`);
}

const original = await readFile(DB_PATH, 'utf8');
const db = await carregar();
const r = (db.reels ?? []).find((x) => x.id === ID);
if (!r) sair(`Nada foi gravado. A peça ${ID} não existe mais.`);
if (r.status === 'publicado') sair('Nada foi gravado. A peça já foi postada: é o registro do que foi ao ar.');
const carrossel = structuredClone(r.carrossel ?? {});
const slides = carrossel.slides ?? [];
const titulo = (s) => String(s?.titulo ?? '').trim();
let mudou = 0;
for (const t of TROCAS) {
  const i = slides.findIndex((s) => titulo(s) === t.onde);
  const jaFeito = slides.some((s) => titulo(s) === (t.para.titulo ?? t.onde) && String(s?.texto ?? '').trim() === t.para.texto);
  if (jaFeito) { console.log(`"${t.para.titulo ?? t.onde}": já aplicado.`); continue; }
  if (i < 0 || (t.de != null && String(slides[i].texto ?? '').trim() !== t.de)) {
    sair(`Nada foi gravado. O slide "${t.onde}" não está como antes: alguém mexeu na tela. Confira lá.`);
  }
  console.log(`Slide ${i + 2} (a capa é o 1): "${slides[i].titulo}: ${slides[i].texto}"`);
  slides[i] = { ...slides[i], ...t.para };
  console.log(`  vira "${slides[i].titulo}: ${slides[i].texto}"`);
  mudou++;
}
const fontes = Array.isArray(r.fontes) ? [...r.fontes] : [];
if (!fontes.includes(FONTE)) { fontes.push(FONTE); mudou++; console.log(`Fonte nova: ${FONTE}`); }
if (!mudou) sair('Já aplicado: nada mudou.', 0);
const foto = r.aprovacao ? fotoDaAprovacao(r) : null;
Object.assign(r, conferirReel({ carrossel, fontes }, r));
const mexeuNaAprovacao = r.aprovacao ? conferirMudancaAprovada(r, foto, QUEM) : false;
Object.assign(r, { atualizadoEm: agora(), atualizadoPor: AUTOR });
console.log(r.aprovacao ? `Aprovação: ${r.aprovacao.estado}, etapa ${r.aprovacao.etapa}${mexeuNaAprovacao ? ' (a regra de sempre da aprovação mexeu nela)' : ''}.` : 'Sem aprovação.');
if (SIMULAR) sair('Simulação: nada foi gravado.', 0);

const backup = arquivoDados('db.antes-6x1-2310.json');
if (!existsSync(backup)) await writeFile(backup, original);
await salvar();
const pasta = await regravarSeGerado(r).catch((e) => { console.error(`O reel.md não foi regravado: ${e.message}`); return null; });
console.log(`Gravado.${pasta ? ` reel.md regravado em ${pasta}.` : ''} Backup em data/db.antes-6x1-2310.json.`);
