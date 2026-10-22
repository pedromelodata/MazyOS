// Gera LISTA-21-DIAS.md (versão curta pro Pedro) a partir de roteiro-21-dias.json. Rodar: node gerar-lista.cjs
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('roteiro-21-dias.json', 'utf8'));
const limpa = (s) => String(s ?? '').replace(/\s*[—–]\s*/g, ', ').trim();
const q3 = (d) => (d.quadros.find((q) => q.n === 3) || {}).texto || '';
const status = (d) => d.no_lancamento === 'fora' ? 'ainda não existe' : q3(d).startsWith('Em breve') ? 'em breve' : 'mostra como funciona';
const marca = (d) => status(d) === 'mostra como funciona' ? '' : ` (${status(d)})`;
const tela = (d) => (typeof d.tela === 'object' ? d.tela.arquivo : d.tela) || 'sem tela';
const q4 = (d) => {
  const q = d.quadros.find((x) => x.n === 4) || {};
  const i = typeof q.interacao === 'string' ? q.interacao : JSON.stringify(q.interacao || '');
  if (d.q4_tipo === 'lista') return `lista de espera: "${limpa(q.texto)}"`;
  return `${d.q4_tipo} "${limpa(q.texto)}" (${limpa(i).replace(/^(enquete|teste):?\s*/i, '')})`;
};
const L = [
  '# Contagem do lançamento: 21 funcionalidades nos stories', '',
  'De 20/10 (faltam 21) a 09/11 (falta 1), uma funcionalidade por dia. O app chega dia 10 de novembro. Tudo é do plano ME.', '',
  'Cada dia tem 4 quadros:',
  '- **Q1:** gancho com a dor e a figurinha de contagem pra 10/11 (a mesma figurinha nos 21 dias, título "App Legalizaí").',
  '- **Q2:** o problema.', '- **Q3:** a tela com o benefício.', '- **Q4:** interação ou lista de espera.', '',
  'As telas estão em `telas/`, com o nome do dia. O roteiro detalhado, com a origem de cada gancho, o recorte de cada tela e as fontes, está em `ROTEIRO-21-DIAS.md`.', '',
  '## Resumo', '', '| Dia | Faltam | Funcionalidade | Status | Tela |', '|---|---|---|---|---|',
];
for (const d of j.dias) L.push(`| ${d.data.slice(0, 5)} | ${d.faltam} | ${d.codigo} ${limpa(d.nome)} | ${status(d)} | ${tela(d) === 'sem tela' ? 'sem tela' : 'sim'} |`);
L.push('', '## Dia a dia');
for (const d of j.dias) {
  const q = (n) => limpa((d.quadros.find((x) => x.n === n) || {}).texto);
  L.push('', `### ${d.data.slice(0, 5)} · ${d.faltam === 1 ? 'falta 1' : 'faltam ' + d.faltam} · ${d.codigo} ${limpa(d.nome)}${marca(d)}`, '',
    `- **Tela:** ${tela(d) === 'sem tela' ? 'sem tela' : '`telas/' + tela(d) + '`'}`,
    `- **Dor:** ${limpa(d.dor)}`, `- **Q1:** "${q(1)}"`, `- **Q2:** "${q(2)}"`, `- **Q3:** "${q(3)}"`, `- **Q4:** ${q4(d)}`);
}
L.push('', '## Antes de começar (decisões do Pedro)', '',
  '1. **"Em breve":** nenhuma das 21 está confirmada pro dia 10/11 (o aceite das funcionalidades é em 03/11). As que não estão prontas saem com "em breve"; a partir de 04/11 dá pra tirar a marca das que passarem.',
  '2. **Débito automático (07/11):** não existe e não entra no lançamento. Recomendação: trocar por outra funcionalidade.',
  '3. **Fator R duas vezes:** 26/10 (4.2) e 02/11 (5.4) falam do mesmo aviso. Se cortar um, sai o 5.4.',
  '4. **Stories do cronograma:** esses dias já têm stories do dia, e com a contagem junto passa do limite de venda. Recomendação: a contagem substitui os stories do cronograma de 20/10 a 09/11.',
  '5. **Data no vault:** a base contábil ainda proíbe dizer a data de lançamento (F008 e P11). A série toda se apoia na decisão de 14/10.',
  '6. **Telas:** todas são capturas de 02/10. Oito funcionalidades não têm tela e vão em fundo da marca; dá pra recapturar do app atual.',
  '7. **Enquete do 21/10:** "Quanto tempo você leva pra emitir uma nota hoje?" é nova e precisa do seu ok.', '');
const txt = L.join('\n');
if (/[—–]/.test(txt)) throw new Error('travessão');
fs.writeFileSync('LISTA-21-DIAS.md', txt);
console.log('ok', j.dias.length, 'dias');
