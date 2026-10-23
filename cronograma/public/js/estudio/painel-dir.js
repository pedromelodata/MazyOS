// 22/10 (Pedro): painel da direita do editor. Com camada escolhida: as propriedades dela (texto: conteúdo, fonte,
// peso, itálico, tamanho, cor, destaque, alinhamento, altura de linha, espaço entre letras, caixa alta, pílula;
// imagem: trocar, espelhar, raio, sombra; forma: tipo, cor, borda, raio; todas: posição, tamanho, rotação,
// opacidade, alinhar, distribuir e ordem). Sem camada: o fundo da página, o formato do documento e a estratégia.
// Os campos mudam o documento na hora (ed.mudar junta as mudanças do mesmo campo num passo só do desfazer).
// 22/10 (Pedro, "use com base no original"): do editor do Ateliê original vieram os controles diretos (deslizante com o
// número do lado), o estilo rápido de texto e o A+ e A-, o destacar trecho num clique, a paleta da marca a um clique
// com a cor atual marcada, o fundo rápido (cores, gradientes e os fundos de imagem do formato), centralizar num clique,
// alinhar várias como bloco ou entre si, espaço fixo entre camadas e duplicar ou puxar página de modelo pelo painel.
import { esc, store, nomePilar, blocoDoPilar, semTraco, toast } from '../core.js';
import * as M from './modelo.js';
import { ic } from './icones.js';
import { urlMiniaturaDoAsset } from './render.js';
import { abrirModelos } from './dialogos.js';

const fmt = (v, casas = 1) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const f = 10 ** casas;
  return String(Math.round(n * f) / f);
};
const hex6 = (c) => {
  const s = String(c ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return `#${[...s.slice(1)].map((x) => x + x).join('')}`;
  if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7);
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);
  if (m) return `#${[m[1], m[2], m[3]].map((x) => Math.round(Number(x)).toString(16).padStart(2, '0')).join('')}`;
  return '#000000';
};
const TRACO = new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`);
const PESOS = [[400, 'Regular'], [500, 'Médio'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extrabold']];
const PALETA_CURTA = ['#FAF8F5', '#FFFFFF', '#FEF3EE', '#F2643C', '#DD4E27', '#B83D1C', '#1B1E24', '#524E48', '#15171C', '#F4F1EC'];
// 22/10 (Pedro): as listas da estratégia principal (as mesmas do server/atelie.mjs, GATILHOS_EMOCIONAIS e
// GATILHOS_PSICOLOGICOS): o design feito à mão escolhe da lista, como a IA
const GATILHOS_EMOCIONAIS = [
  'cansaço da burocracia', 'medo de errar com o fisco', 'alívio da conquista', 'vergonha do contabilês', 'pressa de prazo travado',
  'orgulho de virar empresa', 'declaração anual do MEI', 'imposto de renda', 'virada de ano', 'dia do microempreendedor', 'PLP 108/2021',
];
const GATILHOS_PSICOLOGICOS = ['curiosidade', 'identificação', 'prova social', 'reciprocidade', 'ancoragem', 'novidade', 'escassez real'];
// a cor do campo é a da amostra? (#rrggbbff conta como a mesma; com transparência, não)
const mesmaCor = (a, b) => String(a ?? '').trim().toLowerCase().replace(/^(#[0-9a-f]{6})ff$/, '$1') === String(b ?? '').toLowerCase();

// 22/10 (achado da revisão): com vários textos escolhidos, o campo mostra o valor que todos têm; valor diferente
// fica vazio (o campo diz "vários"). Cor sem diferença de maiúscula e #rrggbbff igual a #rrggbb
export function valorComum(lista) {
  if (!lista.length) return undefined;
  const chave = (v) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/^(#[0-9a-f]{6})ff$/, '$1') : v);
  const k0 = chave(lista[0]);
  return lista.every((v) => chave(v) === k0) ? lista[0] : undefined;
}
// 22/10 (achado da revisão): Largura ou Altura com o cadeado de proporção ligado: a outra medida vem da proporção (a
// do arquivo, na imagem; a da caixa, na forma) e o centro fica no lugar. Sem o cadeado é o recorte consciente
export function tamanhoNaProporcao(c, campo, v, razao) {
  const r1 = (n) => Math.round(n * 10) / 10;
  const k = razao > 0 ? razao : c.largura / c.altura;
  const w = Math.max(1, campo === 'largura' ? v : v * k);
  const h = Math.max(1, campo === 'largura' ? v / k : v);
  const cx = c.x + c.largura / 2;
  const cy = c.y + c.altura / 2;
  return { largura: r1(w), altura: r1(h), x: r1(cx - w / 2), y: r1(cy - h / 2) };
}
// css de um fundo rápido (a amostra do botão)
const cssFundo = (f) => (f.tipo === 'gradiente' ? `linear-gradient(${f.angulo}deg, ${f.cor}, ${f.cor2})` : f.cor);
// os fundos de imagem que casam com o formato do design (fundo-papel-stories no stories, fundo-papel-feed no feed)
function fundosDoFormato(assets, doc) {
  const stories = doc.formato === 'stories' || (doc.formato === 'personalizado' && doc.altura / doc.largura >= 1.7);
  return assets.filter((a) => M.ehFundoDePagina(a) && !a.oculto).filter((a) => {
    const s = `${a.id} ${a.nome} ${(a.tags ?? []).join(' ')}`.toLowerCase();
    const ehStories = /stories/.test(s);
    const ehFeed = /feed/.test(s);
    if (!ehStories && !ehFeed) return true;
    return stories ? ehStories : ehFeed;
  });
}

export function montarPropriedades(ed, raiz) {
  // o espaço entre camadas do "empilhar" (lembra o último que a pessoa usou nesta tela)
  let vaoAtual = Math.round(24 * ((ed.doc?.largura ?? 1080) / 1080));
  // 22/10 (achado da revisão): o cadeado de proporção de cada camada que a pessoa mudou (id -> preso); o resto segue o
  // padrão (imagem presa, forma solta). A marca (logo e símbolo) fica sempre presa
  const cadeado = new Map();
  const ehDaMarca = (c) => c.tipo === 'imagem' && ed.assetsPorId.get(c.assetId)?.categoria === 'marca';
  const proporcaoPresa = (c) => c.tipo !== 'texto' && (ehDaMarca(c) || (cadeado.get(c.id) ?? c.tipo === 'imagem'));
  // a proporção que o cadeado guarda: a do arquivo na imagem (a caixa volta a não recortar), a da caixa na forma
  const razaoDe = (c) => {
    const a = c.tipo === 'imagem' ? ed.assetsPorId.get(c.assetId) : null;
    return a?.largura && a?.altura ? a.largura / a.altura : c.largura / c.altura;
  };
  // ── pedaços de formulário ──
  const num = (campo, valor, { min = '', max = '', passo = 1, sufixo = '', tipo = 'num', alvo = 'camada', rotulo, desligado = false, casas = 1 } = {}) => `
    <label class="est-campo"><span>${esc(rotulo)}</span>
      <span class="est-num"><input type="number" class="campo" data-campo="${campo}" data-tipo="${tipo}" data-alvo="${alvo}" value="${fmt(valor, casas)}" ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} step="${passo}" inputmode="decimal" ${desligado ? 'disabled' : ''}>${sufixo ? `<i>${esc(sufixo)}</i>` : ''}</span>
    </label>`;
  // varios: o valor difere entre os textos escolhidos (o campo fica vazio e diz "vários"; o seletor mostra o primeiro)
  const corCampo = (campo, valor, { rotulo, alvo = 'camada', livre = false, varios = false } = {}) => `
    <div class="est-campo est-campo-cor"><span>${esc(rotulo)}</span>
      <div class="est-cor">
        <input type="color" data-campo="${campo}" data-tipo="cor" data-alvo="${alvo}" value="${hex6(valor)}" aria-label="${esc(rotulo)}">
        <input type="text" class="campo est-hex" data-campo="${campo}" data-tipo="cor" data-alvo="${alvo}" value="${varios ? '' : esc(valor)}" ${varios ? 'placeholder="vários"' : ''} spellcheck="false" aria-label="${esc(rotulo)} (código)" ${livre ? 'title="Aceita #hex, rgb() ou rgba() com transparência"' : ''}>
      </div>
      <div class="est-paleta" role="group" aria-label="Cores da marca pra ${esc(rotulo)}">${PALETA_CURTA.map((c) => `<button type="button" class="est-amostra" data-cor="${c}" data-campo-cor="${campo}" data-alvo="${alvo}" style="background:${c}" title="${esc(M.PALETA.find((p) => p.cor === c)?.nome ?? c)}" aria-label="${esc(M.PALETA.find((p) => p.cor === c)?.nome ?? c)}" aria-pressed="${!varios && mesmaCor(valor, c)}"></button>`).join('')}</div>
    </div>`;
  // 22/10 (Pedro, do Ateliê original): deslizante com o número do lado. O deslizante vai até onde faz sentido na peça; o
  // número aceita a faixa toda (minNum e maxNum)
  const desliza = (campo, valor, { min, max, passo = 1, sufixo = '', tipo = 'num', alvo = 'camada', rotulo, casas = 1, minNum = min, maxNum = max, desligado = false, varios = false } = {}) => {
    const v = fmt(valor, casas);
    const off = desligado ? 'disabled' : '';
    return `
    <div class="est-campo est-desliza"><span>${esc(rotulo)}</span>
      <div class="est-desliza-linha">
        <input type="range" data-campo="${campo}" data-tipo="${tipo}" data-alvo="${alvo}" min="${min}" max="${max}" step="${passo}" value="${v}" aria-label="${esc(rotulo)}" ${off}>
        <span class="est-num"><input type="number" class="campo" data-campo="${campo}" data-tipo="${tipo}" data-alvo="${alvo}" value="${varios ? '' : v}" ${varios ? 'placeholder="vários"' : ''} min="${minNum}" max="${maxNum}" step="${passo}" inputmode="decimal" aria-label="${esc(rotulo)} (número)" ${off}>${sufixo ? `<i>${esc(sufixo)}</i>` : ''}</span>
      </div>
    </div>`;
  };
  const alterna = (campo, ligado, rotulo, { alvo = 'camada', desligado = false } = {}) => `
    <label class="est-alterna"><input type="checkbox" data-campo="${campo}" data-tipo="bool" data-alvo="${alvo}" ${ligado ? 'checked' : ''} ${desligado ? 'disabled' : ''}><span>${esc(rotulo)}</span></label>`;
  const secao = (titulo, corpo, { aberta = true } = {}) => `<details class="est-sec" ${aberta ? 'open' : ''}><summary>${esc(titulo)}</summary><div class="est-sec-corpo">${corpo}</div></details>`;

  // 22/10 (achado da revisão): Largura e Altura com o cadeado de proporção no meio. Imagem nasce com ele ligado (a
  // imagem não recorta sem querer; o logo e o símbolo da marca, sempre ligado); forma nasce solta. Texto: a altura é
  // automática. O estado do cadeado é da tela (não vai pro arquivo)
  function tamanhoCaixaHtml(c) {
    if (c.tipo === 'texto') {
      return `<div class="est-grade2">
        ${num('largura', c.largura, { rotulo: 'Largura', min: 1, sufixo: 'px' })}
        ${num('altura', c.altura, { rotulo: 'Altura (automática)', min: 1, sufixo: 'px', desligado: true })}
      </div>`;
    }
    const presa = proporcaoPresa(c);
    const sempre = ehDaMarca(c);
    const dica = sempre ? 'A marca vai sempre na proporção do arquivo' : presa ? 'Proporção presa: mudar uma medida muda a outra (clique pra soltar e recortar)' : 'Proporção solta: a medida muda só ela (a imagem sai recortada). Clique pra prender';
    return `<div class="est-lado-a-lado">
      ${num('largura', c.largura, { rotulo: 'Largura', min: 1, sufixo: 'px' })}
      <button type="button" class="btn-icone btn-sm est-cadeado" data-acao="cadeado" aria-pressed="${presa}" ${sempre ? 'disabled' : ''} aria-label="${esc(dica)}" title="${esc(dica)}">${ic(presa ? 'cadeado' : 'destravar', 15)}</button>
      ${num('altura', c.altura, { rotulo: 'Altura', min: 1, sufixo: 'px' })}
    </div>`;
  }

  function posicaoHtml(sel) {
    const um = sel.length === 1 ? sel[0] : null;
    const geo = um ? `
      <div class="est-grade2">
        ${num('x', um.x, { rotulo: 'X', sufixo: 'px' })}
        ${num('y', um.y, { rotulo: 'Y', sufixo: 'px' })}
      </div>
      ${tamanhoCaixaHtml(um)}
      ${desliza('rotacao', um.rotacao, { rotulo: 'Rotação', min: -180, max: 180, minNum: -360, maxNum: 360, sufixo: '°' })}
      ${desliza('opacidade', um.opacidade * 100, { rotulo: 'Opacidade', min: 0, max: 100, sufixo: '%', tipo: 'pct', casas: 0 })}` : desliza('opacidade', Math.round((sel.reduce((s, c) => s + c.opacidade, 0) / sel.length) * 100), { rotulo: 'Opacidade', min: 0, max: 100, sufixo: '%', tipo: 'pct', casas: 0 });
    const bot = (acao, valor, icone, rotulo, extra = '') => `<button type="button" class="btn-icone btn-sm" data-acao="${acao}" data-valor="${valor}" aria-label="${esc(rotulo)}" title="${esc(rotulo)}" ${extra}>${ic(icone, 16)}</button>`;
    const varias = sel.filter((c) => !c.travada).length >= 3;
    const duas = sel.filter((c) => !c.travada).length >= 2;
    const entreSi = sel.length > 1 && ed.refAlinhar === 'selecao';
    const onde = (pagina, selecao) => (entreSi ? selecao : pagina);
    // 22/10 (achado da revisão): o campo de % (50 a 200) ao lado do 5%: 100 é o tamanho de quando escolheu. O bloco
    // cresce sem sair da área segura (encostou na margem, para e avisa)
    const t = ed.tamanhoDaSelecao?.();
    const dicaPct = 'Tamanho em %, de 50 a 200 (100 é o tamanho de quando escolheu). Para na área segura';
    return `
      ${geo}
      <div class="est-rotulo-linha">${sel.length > 1 ? 'Tamanho das escolhidas, juntas' : 'Tamanho'}</div>
      <div class="est-escala">
        <button type="button" class="btn btn-sm" data-acao="escala" data-valor="0.95" title="Tudo 5% menor, junto">5% menor</button>
        <span class="est-num"><input type="number" class="campo" data-escala-pct value="${fmt(t?.pct ?? 100, 1)}" min="50" max="200" step="1" inputmode="decimal" aria-label="${esc(dicaPct)}" title="${esc(dicaPct)}" ${t ? '' : 'disabled'}><i>%</i></span>
        <button type="button" class="btn btn-sm" data-acao="escala" data-valor="1.05" title="Tudo 5% maior, junto (para na área segura)">5% maior</button>
      </div>
      <div class="est-rotulo-linha">Alinhar${sel.length > 1 ? '' : ' na página'}</div>
      ${sel.length > 1 ? `
        <div class="segmentado est-seg est-seg-largo" role="group" aria-label="Alinhar em relação a">
          <button type="button" data-acao="ref-alinhar" data-valor="pagina" aria-pressed="${!entreSi}" title="As escolhidas andam juntas, como um bloco: a composição não desmonta">Como bloco</button>
          <button type="button" data-acao="ref-alinhar" data-valor="selecao" aria-pressed="${entreSi}" title="Cada uma vai pra borda (ou pro centro) da caixa da seleção">Entre si</button>
        </div>` : ''}
      <button type="button" class="btn btn-sm est-centralizar" data-acao="alinhar" data-valor="centro">${ic('al-centro', 15)}${entreSi ? 'Centralizar entre si' : sel.length > 1 ? 'Centralizar o bloco na página' : 'Centralizar na página'}</button>
      <div class="est-botoes">
        ${bot('alinhar', 'esquerda', 'al-esq', onde('Esquerda da área segura', 'Esquerda da seleção'))}
        ${bot('alinhar', 'centroH', 'al-ch', onde('Centro horizontal da página', 'Centro horizontal da seleção'))}
        ${bot('alinhar', 'direita', 'al-dir', onde('Direita da área segura', 'Direita da seleção'))}
        ${bot('alinhar', 'topo', 'al-topo', onde('Topo da área segura', 'Topo da seleção'))}
        ${bot('alinhar', 'centroV', 'al-cv', onde('Centro vertical da página', 'Centro vertical da seleção'))}
        ${bot('alinhar', 'base', 'al-base', onde('Base da área segura', 'Base da seleção'))}
        ${bot('distribuir', 'h', 'dist-h', 'Distribuir na horizontal (3 ou mais)', varias ? '' : 'disabled')}
        ${bot('distribuir', 'v', 'dist-v', 'Distribuir na vertical (3 ou mais)', varias ? '' : 'disabled')}
      </div>
      ${duas ? `
        <div class="est-rotulo-linha">Espaço entre as escolhidas</div>
        <div class="est-empilhar">
          <span class="est-num"><input type="number" class="campo" data-vao value="${esc(String(vaoAtual))}" min="0" max="2000" step="1" inputmode="decimal" aria-label="Espaço entre as camadas, em px"><i>px</i></span>
          ${bot('empilhar', 'v', 'dist-v', 'Uma embaixo da outra, com esse espaço')}
          ${bot('empilhar', 'h', 'dist-h', 'Lado a lado, com esse espaço')}
        </div>` : ''}
      <div class="est-rotulo-linha">Ordem</div>
      <div class="est-botoes">
        ${bot('ordem', 'frente', 'frente', 'Trazer pra frente de tudo (Ctrl+Shift+])')}
        ${bot('ordem', '1', 'subir', 'Subir uma (Ctrl+])')}
        ${bot('ordem', '-1', 'descer', 'Descer uma (Ctrl+[)')}
        ${bot('ordem', 'tras', 'tras', 'Mandar pra trás de tudo (Ctrl+Shift+[)')}
      </div>`;
  }

  function textoHtml(c) {
    const dm = c.fonte === 'DM Serif Display';
    return secao('Texto', `
      <label class="est-campo est-campo-largo"><span>Conteúdo</span>
        <textarea class="campo" rows="3" data-campo="texto" data-tipo="texto" data-alvo="camada" spellcheck="true" lang="pt-BR">${esc(c.texto)}</textarea>
      </label>
      <div class="est-botoes">
        <button type="button" class="btn btn-sm" data-acao="destacar" title="Escolha o trecho no campo acima: ele fica na cor de destaque">${ic('destaque', 14)}Destacar trecho</button>
        <button type="button" class="btn btn-sm btn-fantasma" data-acao="tirar-destaque" ${/\*/.test(c.texto) ? '' : 'disabled'}>Tirar os destaques</button>
      </div>
      <p class="est-dica">O trecho entre *asteriscos* fica na cor de destaque. Duplo clique na página edita no lugar.</p>
      <div class="est-rotulo-linha">Estilo rápido</div>
      <div class="est-estilos" role="group" aria-label="Estilo rápido do texto">
        ${M.LISTA_PRESETS_TEXTO.map((p) => `<button type="button" class="est-estilo est-preset-${p.id}" data-acao="estilo" data-valor="${p.id}" title="${esc(p.nome)}: tamanho, peso e espaços do design guide (o texto fica)">${esc(p.nome)}</button>`).join('')}
      </div>
      <div class="est-tamanho">
        ${desliza('tamanho', c.tamanho, { rotulo: 'Tamanho', min: 12, max: Math.round(220 * (ed.doc.largura / 1080)), minNum: 6, maxNum: 1200, sufixo: 'px' })}
        <div class="est-passos" role="group" aria-label="Degraus de tamanho">
          <button type="button" class="btn-icone btn-sm" data-acao="tamanho" data-valor="-1" aria-label="Letra menor (o degrau de baixo)" title="Letra menor">A<small>-</small></button>
          <button type="button" class="btn-icone btn-sm" data-acao="tamanho" data-valor="1" aria-label="Letra maior (o degrau de cima)" title="Letra maior">A<small>+</small></button>
        </div>
      </div>
      ${corCampo('cor', c.cor, { rotulo: 'Cor' })}
      <div class="est-grade2">
        <label class="est-campo"><span>Fonte</span>
          <select class="campo" data-campo="fonte" data-tipo="texto" data-alvo="camada">
            <option value="Sora" ${!dm ? 'selected' : ''}>Sora</option>
            <option value="DM Serif Display" ${dm ? 'selected' : ''}>DM Serif Display (ênfase)</option>
          </select>
        </label>
        <label class="est-campo"><span>Peso</span>
          <select class="campo" data-campo="peso" data-tipo="num" data-alvo="camada" ${dm ? 'disabled title="A DM Serif Display só tem o Regular"' : ''}>
            ${PESOS.map(([v, n]) => `<option value="${v}" ${c.peso === v ? 'selected' : ''}>${v} · ${n}</option>`).join('')}
          </select>
        </label>
      </div>
      ${desliza('alturaLinha', c.alturaLinha, { rotulo: 'Altura da linha', min: 0.8, max: 2, passo: 0.01, minNum: 0.6, maxNum: 4, casas: 2 })}
      ${desliza('espacamentoLetra', c.espacamentoLetra * 1000, { rotulo: 'Espaço entre letras', min: -100, max: 300, passo: 5, minNum: -500, maxNum: 1000, tipo: 'mil', casas: 0, sufixo: '‰' })}
      <div class="est-campo"><span>Alinhamento do texto</span>
        <div class="segmentado est-seg" role="group" aria-label="Alinhamento do texto">
          ${[['esquerda', 'al-esq', 'Esquerda'], ['centro', 'al-ch', 'Centro'], ['direita', 'al-dir', 'Direita']].map(([v, i, n]) => `<button type="button" data-acao="campo" data-campo="alinhamento" data-valor="${v}" aria-pressed="${c.alinhamento === v}" aria-label="${n}" title="${n}">${ic(i, 15)}</button>`).join('')}
        </div>
      </div>
      <div class="est-alternas">
        ${alterna('italico', c.italico, 'Itálico', { desligado: dm })}
        ${alterna('caixaAlta', c.caixa === 'alta', 'Caixa alta')}
      </div>
      ${dm ? '<p class="est-dica">DM Serif Display só em itálico: é a ênfase que o Pedro pediu (o resto é Sora).</p>' : ''}
      ${corCampo('corDestaque', c.corDestaque, { rotulo: 'Cor do destaque' })}
    `) + secao('Pílula de fundo', `
      ${alterna('pilula', Boolean(c.fundo), 'Texto dentro de uma pílula')}
      ${c.fundo ? `
        ${corCampo('fundo.cor', c.fundo.cor, { rotulo: 'Cor da pílula' })}
        <div class="est-grade2">
          ${num('fundo.raio', c.fundo.raio, { rotulo: 'Arredondado', min: 0, max: 9999, sufixo: 'px' })}
        </div>
        ${desliza('fundo.padding', c.fundo.padding, { rotulo: 'Respiro', min: 0, max: Math.round(120 * (ed.doc.largura / 1080)), minNum: 0, maxNum: 600, sufixo: 'px' })}
        <button type="button" class="btn btn-sm" data-acao="ajustar-largura">${ic('ajustar', 14)}Largura do tamanho do texto</button>` : ''}
    `, { aberta: Boolean(c.fundo) });
  }

  // 22/10 (achado da revisão): vários textos escolhidos (Shift + clique ou Ctrl+A): a seção Texto reduzida vale pra
  // todos os textos da seleção (cor e paleta, destaque, tamanho com A+ e A-, fonte, peso, estilo rápido, alinhamento,
  // altura da linha e espaço entre letras). Valor diferente entre eles fica vazio, com "vários"
  function textosHtml(textos) {
    const comum = (k) => valorComum(textos.map((t) => t[k]));
    const t0 = textos[0];
    const fonte = comum('fonte');
    const peso = comum('peso');
    const alinh = comum('alinhamento');
    const todasDm = textos.every((t) => t.fonte === 'DM Serif Display');
    const tamanho = comum('tamanho');
    const linha = comum('alturaLinha');
    const letra = comum('espacamentoLetra');
    return secao(`Texto · ${textos.length} ${textos.length > 1 ? 'textos' : 'texto'}`, `
      <div class="est-rotulo-linha">Estilo rápido</div>
      <div class="est-estilos" role="group" aria-label="Estilo rápido dos textos escolhidos">
        ${M.LISTA_PRESETS_TEXTO.map((p) => `<button type="button" class="est-estilo est-preset-${p.id}" data-acao="estilo" data-valor="${p.id}" title="${esc(p.nome)} em todos os textos escolhidos">${esc(p.nome)}</button>`).join('')}
      </div>
      <div class="est-tamanho">
        ${desliza('tamanho', tamanho ?? t0.tamanho, { rotulo: 'Tamanho', min: 12, max: Math.round(220 * (ed.doc.largura / 1080)), minNum: 6, maxNum: 1200, sufixo: 'px', alvo: 'textos', varios: tamanho === undefined })}
        <div class="est-passos" role="group" aria-label="Degraus de tamanho">
          <button type="button" class="btn-icone btn-sm" data-acao="tamanho" data-valor="-1" aria-label="Letra menor em todos (o degrau de baixo)" title="Letra menor">A<small>-</small></button>
          <button type="button" class="btn-icone btn-sm" data-acao="tamanho" data-valor="1" aria-label="Letra maior em todos (o degrau de cima)" title="Letra maior">A<small>+</small></button>
        </div>
      </div>
      ${corCampo('cor', comum('cor') ?? t0.cor, { rotulo: 'Cor', alvo: 'textos', varios: comum('cor') === undefined })}
      <div class="est-grade2">
        <label class="est-campo"><span>Fonte</span>
          <select class="campo" data-campo="fonte" data-tipo="texto" data-alvo="textos">
            ${fonte === undefined ? '<option value="" selected disabled>vários</option>' : ''}
            <option value="Sora" ${fonte === 'Sora' ? 'selected' : ''}>Sora</option>
            <option value="DM Serif Display" ${fonte === 'DM Serif Display' ? 'selected' : ''}>DM Serif Display (ênfase)</option>
          </select>
        </label>
        <label class="est-campo"><span>Peso</span>
          <select class="campo" data-campo="peso" data-tipo="num" data-alvo="textos" ${todasDm ? 'disabled title="A DM Serif Display só tem o Regular"' : ''}>
            ${peso === undefined ? '<option value="" selected disabled>vários</option>' : ''}
            ${PESOS.map(([v, n]) => `<option value="${v}" ${peso === v ? 'selected' : ''}>${v} · ${n}</option>`).join('')}
          </select>
        </label>
      </div>
      ${desliza('alturaLinha', linha ?? t0.alturaLinha, { rotulo: 'Altura da linha', min: 0.8, max: 2, passo: 0.01, minNum: 0.6, maxNum: 4, casas: 2, alvo: 'textos', varios: linha === undefined })}
      ${desliza('espacamentoLetra', (letra ?? t0.espacamentoLetra) * 1000, { rotulo: 'Espaço entre letras', min: -100, max: 300, passo: 5, minNum: -500, maxNum: 1000, tipo: 'mil', casas: 0, sufixo: '‰', alvo: 'textos', varios: letra === undefined })}
      <div class="est-campo"><span>Alinhamento do texto</span>
        <div class="segmentado est-seg" role="group" aria-label="Alinhamento dos textos">
          ${[['esquerda', 'al-esq', 'Esquerda'], ['centro', 'al-ch', 'Centro'], ['direita', 'al-dir', 'Direita']].map(([v, i, n]) => `<button type="button" data-acao="campo" data-campo="alinhamento" data-alvo="textos" data-valor="${v}" aria-pressed="${alinh === v}" aria-label="${n}" title="${n}">${ic(i, 15)}</button>`).join('')}
        </div>
      </div>
      ${corCampo('corDestaque', comum('corDestaque') ?? t0.corDestaque, { rotulo: 'Cor do destaque', alvo: 'textos', varios: comum('corDestaque') === undefined })}
    `);
  }

  function imagemHtml(c) {
    const a = ed.assetsPorId.get(c.assetId);
    return secao('Imagem', `
      <div class="est-img-atual">
        <span class="est-img-mini">${c.assetId ? `<img src="${esc(urlMiniaturaDoAsset(c.assetId))}" alt="" loading="lazy">` : ''}</span>
        <div><strong>${esc(a?.nome ?? c.nome)}</strong><small>${esc(a ? `${a.categoria ?? ''}${a.largura ? ` · ${a.largura} × ${a.altura}` : ''}` : c.assetId ? 'asset fora do banco' : 'sem imagem')}</small></div>
      </div>
      <div class="est-botoes">
        <button type="button" class="btn btn-sm" data-acao="trocar-imagem">${ic('imagem', 14)}Trocar imagem</button>
        <button type="button" class="btn btn-sm" data-acao="proporcao-original" ${a?.largura ? '' : 'disabled'} title="Volta a proporção do arquivo (mantém a altura)">${ic('ajustar', 14)}Proporção original</button>
      </div>
      <div class="est-alternas">${alterna('espelhar', c.espelhar, 'Espelhar')}</div>
      ${desliza('raio', c.raio, { rotulo: 'Cantos arredondados', min: 0, max: Math.round(300 * (ed.doc.largura / 1080)), minNum: 0, maxNum: 9999, sufixo: 'px' })}
    `) + secao('Sombra', `
      ${alterna('sombraAtiva', Boolean(c.sombra), 'Sombra que segue o recorte')}
      ${c.sombra ? `
        ${corCampo('sombra.cor', c.sombra.cor, { rotulo: 'Cor da sombra', livre: true })}
        ${desliza('sombra.desfoque', c.sombra.desfoque, { rotulo: 'Desfoque', min: 0, max: Math.round(160 * (ed.doc.largura / 1080)), minNum: 0, maxNum: 600, sufixo: 'px' })}
        <div class="est-grade2">
          ${num('sombra.x', c.sombra.x, { rotulo: 'Desloca X', min: -600, max: 600, sufixo: 'px' })}
          ${num('sombra.y', c.sombra.y, { rotulo: 'Desloca Y', min: -600, max: 600, sufixo: 'px' })}
        </div>` : ''}
    `, { aberta: Boolean(c.sombra) });
  }

  function formaHtml(c) {
    return secao('Forma', `
      <label class="est-campo est-campo-largo"><span>Tipo</span>
        <select class="campo" data-campo="forma" data-tipo="texto" data-alvo="camada">
          ${[['retangulo', 'Retângulo'], ['circulo', 'Círculo'], ['linha', 'Linha']].map(([v, n]) => `<option value="${v}" ${c.forma === v ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
      ${corCampo('cor', c.cor, { rotulo: 'Cor', livre: true })}
      ${c.forma !== 'circulo' ? desliza('raio', c.raio, { rotulo: 'Cantos arredondados', min: 0, max: Math.round(300 * (ed.doc.largura / 1080)), minNum: 0, maxNum: 9999, sufixo: 'px' }) : ''}
      ${c.forma === 'linha' ? '<p class="est-dica">A espessura da linha é a altura. Nada de barrinha antes de texto (lê como travessão).</p>' : `
        ${alterna('bordaAtiva', Boolean(c.borda), 'Borda')}
        ${c.borda ? `${corCampo('borda.cor', c.borda.cor, { rotulo: 'Cor da borda' })}${desliza('borda.largura', c.borda.largura, { rotulo: 'Espessura', min: 0, max: Math.round(24 * (ed.doc.largura / 1080)), minNum: 0, maxNum: 400, sufixo: 'px' })}` : ''}`}
    `);
  }

  function acoesCamadaHtml(sel) {
    const travadas = sel.every((c) => c.travada);
    const ocultas = sel.every((c) => c.oculta);
    // 22/10 (Pedro): no carrossel, o elemento que passa da borda continua na página seguinte (ed.atravessarProxima)
    const atravessa = ed.idx + 1 < ed.doc.paginas.length && sel.some((c) => c.tipo !== 'texto');
    return `<div class="est-botoes est-acoes-camada">
      <button type="button" class="btn btn-sm" data-acao="duplicar">${ic('duplicar', 14)}Duplicar</button>
      ${atravessa ? `<button type="button" class="btn btn-sm" data-acao="atravessar" title="A parte que passa da borda da direita continua na página ${ed.idx + 2}">${ic('seta', 14)}Continuar na página ${ed.idx + 2}</button>` : ''}
      <button type="button" class="btn btn-sm" data-acao="travar" aria-pressed="${travadas}">${ic(travadas ? 'cadeado' : 'destravar', 14)}${travadas ? 'Destravar' : 'Travar'}</button>
      <button type="button" class="btn btn-sm" data-acao="ocultar" aria-pressed="${ocultas}">${ic(ocultas ? 'olho' : 'olho-fechado', 14)}${ocultas ? 'Mostrar' : 'Ocultar'}</button>
      <button type="button" class="btn btn-sm btn-perigo" data-acao="apagar">${ic('lixo', 14)}Apagar</button>
    </div>`;
  }

  function fundoHtml() {
    const f = ed.fundoAtual();
    const tipos = [['cor', 'Cor'], ['gradiente', 'Gradiente'], ['imagem', 'Imagem']];
    const a = f.assetId ? ed.assetsPorId.get(f.assetId) : null;
    const imagens = fundosDoFormato(ed.assets, ed.doc);
    let corpo = `
      <div class="est-rotulo-linha">Fundo rápido</div>
      <div class="est-fundos-rapidos" role="group" aria-label="Fundos da marca">
        ${M.FUNDOS_RAPIDOS.map((x, i) => `<button type="button" class="est-fr" data-acao="fundo-rapido" data-valor="${i}" style="background:${cssFundo(x.fundo)}" title="${esc(x.nome)}" aria-label="Fundo ${esc(x.nome)}" aria-pressed="${f.tipo === x.fundo.tipo && mesmaCor(f.cor, x.fundo.cor) && (x.fundo.tipo !== 'gradiente' || mesmaCor(f.cor2, x.fundo.cor2))}"></button>`).join('')}
        ${imagens.map((x) => `<button type="button" class="est-fr est-fr-img" data-acao="fundo-asset" data-valor="${esc(x.id)}" title="${esc(x.nome)}" aria-label="Fundo ${esc(x.nome)}" aria-pressed="${f.tipo === 'imagem' && f.assetId === x.id}"><img src="${esc(urlMiniaturaDoAsset(x.id))}" alt="" loading="lazy" decoding="async"></button>`).join('')}
      </div>
      <div class="segmentado est-seg est-seg-largo" role="group" aria-label="Tipo de fundo">
        ${tipos.map(([v, n]) => `<button type="button" data-acao="fundo-tipo" data-valor="${v}" aria-pressed="${f.tipo === v}">${n}</button>`).join('')}
      </div>`;
    if (f.tipo === 'cor') corpo += corCampo('cor', f.cor, { rotulo: 'Cor', alvo: 'fundo' });
    else if (f.tipo === 'gradiente') {
      corpo += `
        ${corCampo('cor', f.cor, { rotulo: 'Cor do começo', alvo: 'fundo' })}
        ${corCampo('cor2', f.cor2, { rotulo: 'Cor do fim', alvo: 'fundo' })}
        ${desliza('angulo', f.angulo, { rotulo: 'Ângulo', min: -180, max: 180, minNum: -360, maxNum: 360, sufixo: '°', alvo: 'fundo', casas: 0 })}
        <div class="est-rotulo-linha">Prontos do design guide</div>
        <div class="est-gradientes">${M.GRADIENTES.map((g, i) => `<button type="button" class="est-grad" data-acao="gradiente-pronto" data-valor="${i}" style="background:linear-gradient(${g.angulo}deg, ${g.cor}, ${g.cor2})" title="${esc(g.nome)}" aria-label="Gradiente ${esc(g.nome)}"></button>`).join('')}</div>`;
    } else {
      corpo += `
        <div class="est-img-atual">
          <span class="est-img-mini">${f.assetId ? `<img src="${esc(urlMiniaturaDoAsset(f.assetId))}" alt="" loading="lazy">` : ''}</span>
          <div><strong>${esc(a?.nome ?? (f.assetId ? 'Imagem' : 'Nenhuma imagem'))}</strong><small>${f.assetId ? esc(a?.categoria ?? '') : 'Escolha nos assets (os da categoria Fundos já têm o papel e o grão da marca)'}</small></div>
        </div>
        <button type="button" class="btn btn-sm" data-acao="fundo-imagem">${ic('imagem', 14)}${f.assetId ? 'Trocar imagem' : 'Escolher imagem'}</button>
        <div class="segmentado est-seg est-seg-largo" role="group" aria-label="Ajuste da imagem">
          <button type="button" data-acao="fundo-ajuste" data-valor="cobrir" aria-pressed="${f.ajuste !== 'conter'}">Cobrir</button>
          <button type="button" data-acao="fundo-ajuste" data-valor="conter" aria-pressed="${f.ajuste === 'conter'}">Conter</button>
        </div>
        ${corCampo('cor', f.cor, { rotulo: 'Cor por trás', alvo: 'fundo' })}
        <p class="est-dica">A cor por trás acompanha a imagem (a cor média dela): o texto novo nasce na cor certa e o contraste é medido contra ela.</p>`;
    }
    if (ed.doc.paginas.length > 1) corpo += `<button type="button" class="btn btn-sm" data-acao="fundo-todas">${ic('copiar', 14)}Usar este fundo em todas as páginas</button>`;
    return secao(`Fundo da página ${ed.idx + 1}`, corpo);
  }

  function documentoHtml() {
    const d = ed.doc;
    const m = M.margemSegura(d);
    return secao('Documento', `
      <label class="est-campo est-campo-largo"><span>Formato</span>
        <select class="campo" data-acao-change="formato">
          ${M.FORMATOS.map((f) => `<option value="${f.id}" ${d.formato === f.id ? 'selected' : ''}>${esc(f.nome)} · ${esc(f.id === 'personalizado' ? `${d.largura} × ${d.altura}` : f.medida)}</option>`).join('')}
        </select>
      </label>
      ${d.formato === 'personalizado' ? `<div class="est-grade2">
        ${num('largura', d.largura, { rotulo: 'Largura', min: M.LADO_MIN, max: M.LADO_MAX, sufixo: 'px', alvo: 'doc', casas: 0 })}
        ${num('altura', d.altura, { rotulo: 'Altura', min: M.LADO_MIN, max: M.LADO_MAX, sufixo: 'px', alvo: 'doc', casas: 0 })}
      </div>` : ''}
      <p class="est-dica">Área segura dos textos: ${m.esq} px nas laterais, ${m.topo} no topo e ${m.base} na base.</p>
      <p class="est-dica">Origem: ${d.origem === 'ia' ? 'feito pela IA' : d.origem === 'importado' ? 'importado de uma peça pronta' : 'feito à mão'}${d.versao ? ` · versão ${d.versao}` : ''}</p>
    `);
  }

  // gatilho da lista da estratégia; o que veio escrito à mão antes (fora da lista) continua como opção
  const listaGatilho = (campo, rotulo, lista, atual) => `
      <label class="est-campo est-campo-largo"><span>${esc(rotulo)}</span>
        <select class="campo" data-campo="${campo}" data-alvo="estrategia" data-tipo="texto">
          <option value="">Sem gatilho</option>
          ${[...lista, ...(atual && !lista.includes(atual) ? [atual] : [])].map((g) => `<option value="${esc(g)}" ${g === atual ? 'selected' : ''}>${esc(g)}</option>`).join('')}
        </select>
      </label>`;

  function estrategiaHtml() {
    const e = ed.doc.estrategia ?? {};
    const pilares = Array.isArray(store.E?.pilares) ? store.E.pilares : [];
    const bloco = e.pilar != null && e.pilar !== '' ? blocoDoPilar(e.pilar) ?? e.bloco : e.bloco;
    return secao('Estratégia', `
      <p class="est-dica">Fica guardada no design e vai pra IA quando ela faz uma versão nova. O mecanismo de repetição compara a cara do design (fundo, assets e composição) com os das últimas semanas. Vincular a uma peça traz o pilar dela.</p>
      <label class="est-campo est-campo-largo"><span>Pilar</span>
        <select class="campo" data-campo="pilar" data-alvo="estrategia" data-tipo="texto">
          <option value="">Sem pilar</option>
          ${pilares.map((p) => `<option value="${p.id}" ${String(e.pilar) === String(p.id) ? 'selected' : ''}>${esc(nomePilar(p.id))}</option>`).join('')}
        </select>
      </label>
      ${bloco ? `<p class="est-dica">Bloco: <b>${esc(bloco)}</b></p>` : ''}
      <label class="est-campo est-campo-largo"><span>Motivo</span><textarea class="campo" rows="2" data-campo="motivo" data-alvo="estrategia" data-tipo="texto">${esc(e.motivo ?? '')}</textarea></label>
      ${listaGatilho('gatilhoEmocional', 'Gatilho emocional', GATILHOS_EMOCIONAIS, e.gatilhoEmocional)}
      ${listaGatilho('gatilhoPsicologico', 'Gatilho psicológico', GATILHOS_PSICOLOGICOS, e.gatilhoPsicologico)}
    `, { aberta: false });
  }

  // 22/10 (Pedro): a página aberta, com duplicar, página nova e página de um modelo a um clique
  function paginaHtml() {
    const n = ed.doc.paginas.length;
    return secao(`Página ${ed.idx + 1} de ${n}`, `
      <div class="est-botoes">
        <button type="button" class="btn btn-sm" data-acao="pagina-duplicar">${ic('duplicar', 14)}Duplicar a página</button>
        <button type="button" class="btn btn-sm" data-acao="pagina-nova">${ic('pagina-mais', 14)}Página em branco</button>
        <button type="button" class="btn btn-sm" data-acao="pagina-modelo">${ic('modelo', 14)}Página de um modelo</button>
      </div>`);
  }

  const ATALHOS = [
    ['Ctrl+Z / Ctrl+Shift+Z', 'desfazer e refazer'], ['Ctrl+C, Ctrl+V, Ctrl+D', 'copiar, colar, duplicar'], ['Delete', 'apagar'],
    ['Setas (Shift)', 'mover 1 px (10 px)'], ['Shift + clique', 'escolher várias'], ['Duplo clique / Enter', 'editar texto no lugar'],
    ['Espaço + arrastar', 'andar pela página'], ['Ctrl + roda', 'zoom'], ['Ctrl+0 / Ctrl+1', 'ajustar / 100%'],
    ['Alt ao arrastar', 'sem encaixe (a alça do grupo passa da área segura)'], ['Alt + clique', 'pega a camada de fundo (luz, partícula)'], ['Ctrl+] / Ctrl+[', 'subir / descer'],
    ['PageUp / PageDown', 'página anterior / próxima'], ['Ctrl+S', 'salvar agora (até editando o texto)'],
  ];
  const atalhosHtml = () => secao('Atalhos', `<dl class="est-atalhos">${ATALHOS.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`, { aberta: false });

  function desenhar() {
    if (!ed.doc) return;
    const sel = ed.selecionadas();
    let html = '';
    if (!sel.length) {
      html = `<div class="est-dir-cab"><strong>Página ${ed.idx + 1}</strong><small>Nenhuma camada escolhida</small></div>${fundoHtml()}${paginaHtml()}${documentoHtml()}${estrategiaHtml()}${atalhosHtml()}`;
    } else if (sel.length === 1) {
      const c = sel[0];
      const nomeTipo = { texto: 'Texto', imagem: 'Imagem', forma: 'Forma' }[c.tipo];
      html = `<div class="est-dir-cab"><strong>${esc(c.nome)}</strong><small>${nomeTipo}${c.travada ? ' · travada' : ''}${c.oculta ? ' · oculta' : ''}</small></div>
        ${c.travada ? '<p class="est-dica est-dica-trava">Travada: destrave pra mexer.</p>' : ''}
        <fieldset class="est-campos" ${c.travada ? 'disabled' : ''}>
          ${c.tipo === 'texto' ? textoHtml(c) : c.tipo === 'imagem' ? imagemHtml(c) : formaHtml(c)}
          ${secao('Posição e tamanho', posicaoHtml(sel))}
        </fieldset>
        ${acoesCamadaHtml(sel)}`;
    } else {
      const textos = sel.filter((c) => c.tipo === 'texto');
      const travados = textos.length > 0 && textos.every((c) => c.travada);
      html = `<div class="est-dir-cab"><strong>${sel.length} camadas</strong><small>Shift + clique tira ou põe</small></div>
        ${textos.length ? `<fieldset class="est-campos" ${travados ? 'disabled' : ''}>${textosHtml(textos)}</fieldset>` : ''}
        ${secao('Posição', posicaoHtml(sel))}
        ${acoesCamadaHtml(sel)}`;
    }
    const rolagem = raiz.scrollTop;
    // seções fechadas e abertas continuam como estavam
    const abertas = new Map([...raiz.querySelectorAll('details.est-sec')].map((d) => [d.querySelector('summary')?.textContent, d.open]));
    raiz.innerHTML = html;
    for (const d of raiz.querySelectorAll('details.est-sec')) {
      const k = d.querySelector('summary')?.textContent;
      if (abertas.has(k)) d.open = abertas.get(k);
    }
    raiz.scrollTop = rolagem;
  }

  // ── aplicar o que mudou ──
  function valorDe(el) {
    const t = el.dataset.tipo;
    if (t === 'bool') return el.checked;
    if (t === 'num' || t === 'pct' || t === 'mil') {
      const n = Number(String(el.value).replace(',', '.'));
      if (!Number.isFinite(n) || el.value === '') return undefined;
      return t === 'pct' ? n / 100 : t === 'mil' ? n / 1000 : n;
    }
    if (t === 'cor') return M.corValida(el.value) ? el.value.trim() : undefined;
    return el.value;
  }
  function definirCaminho(obj, caminho, v) {
    const p = caminho.split('.');
    let o = obj;
    for (let i = 0; i < p.length - 1; i++) { o = o?.[p[i]]; if (!o) return; }
    o[p.at(-1)] = v;
  }
  // campos que mudam o próprio painel (aparece ou some coisa): redesenha o painel depois
  const ESTRUTURAIS = new Set(['pilula', 'sombraAtiva', 'bordaAtiva', 'fonte', 'forma', 'travada']);

  // soTextos: o campo veio da seção Texto de várias camadas (a cor vale só pros textos, nunca pra forma e imagem juntas)
  function aplicarCamada(campo, v, { soTextos = false } = {}) {
    const sel = ed.selecionadas().filter((c) => !c.travada && (!soTextos || c.tipo === 'texto'));
    if (!sel.length) return;
    const ids = sel.map((c) => c.id).join(',');
    ed.mudar(() => {
      for (const c of sel) {
        switch (campo) {
          case 'pilula':
            if (c.tipo === 'texto') c.fundo = v ? { cor: '#FEF3EE', raio: 999, padding: Math.round(c.tamanho * 0.6) } : null;
            break;
          case 'sombraAtiva':
            if (c.tipo === 'imagem') c.sombra = v ? { cor: 'rgba(27,30,36,0.22)', desfoque: 24, x: 0, y: 18 } : null;
            break;
          case 'bordaAtiva':
            if (c.tipo === 'forma') c.borda = v ? { cor: '#E3DED7', largura: 2 } : null;
            break;
          case 'caixaAlta':
            if (c.tipo === 'texto') c.caixa = v ? 'alta' : 'normal';
            break;
          case 'fonte':
            if (c.tipo === 'texto') {
              c.fonte = v === 'DM Serif Display' ? 'DM Serif Display' : 'Sora';
              if (c.fonte === 'DM Serif Display') { c.peso = 400; c.italico = true; } else { c.italico = false; if (c.peso < 600) c.peso = 700; }
            }
            break;
          case 'peso':
            if (c.tipo === 'texto' && c.fonte === 'Sora') c.peso = Math.min(800, Math.max(400, Math.round(v / 100) * 100));
            break;
          case 'italico':
            if (c.tipo === 'texto' && c.fonte === 'Sora') c.italico = Boolean(v);
            break;
          case 'opacidade':
            c.opacidade = Math.min(1, Math.max(0, v));
            break;
          case 'rotacao':
            c.rotacao = Math.max(-360, Math.min(360, v));
            break;
          case 'largura':
          case 'altura':
            // 22/10 (achado da revisão): com o cadeado ligado a outra medida acompanha e o centro fica
            if (sel.length === 1 && proporcaoPresa(c)) Object.assign(c, tamanhoNaProporcao(c, campo, Math.max(1, v), razaoDe(c)));
            else c[campo] = Math.max(1, v);
            break;
          case 'tamanho':
            if (c.tipo === 'texto') c.tamanho = Math.max(6, Math.min(1200, v));
            break;
          case 'espacamentoLetra':
            if (c.tipo === 'texto') c.espacamentoLetra = Math.max(-0.5, Math.min(1, v));
            break;
          case 'alturaLinha':
            if (c.tipo === 'texto') c.alturaLinha = Math.max(0.6, Math.min(4, v));
            break;
          case 'forma':
            if (c.tipo === 'forma') {
              c.forma = v;
              if (v === 'linha') { c.altura = Math.max(2, Math.min(c.altura, 12)); c.borda = null; c.raio = 999; }
              if (v === 'circulo') { const l = Math.max(c.largura, c.altura); c.largura = l; c.altura = l; }
            }
            break;
          default: {
            const raizCampo = campo.split('.')[0];
            const aceita = { texto: ['texto', 'cor', 'corDestaque', 'alinhamento', 'fundo'], imagem: ['espelhar', 'raio', 'sombra'], forma: ['cor', 'raio', 'borda'] }[c.tipo];
            if (['x', 'y'].includes(campo) || aceita.includes(raizCampo)) definirCaminho(c, campo, v);
          }
        }
      }
    }, { chave: `prop-${campo}-${ids}`, redesenhar: ESTRUTURAIS.has(campo) ? { pagina: true, sobre: true, props: true, camadas: true } : { pagina: true, sobre: true } });
  }

  function aplicarFundo(campo, v) {
    ed.mudar((d) => { d.paginas[ed.idx].fundo[campo] = v; }, { chave: `fundo-${campo}-${ed.idx}`, redesenhar: { pagina: true, sobre: true } });
  }
  function aplicarDoc(campo, v) {
    const n = Math.round(Math.max(M.LADO_MIN, Math.min(M.LADO_MAX, v)));
    if (n === ed.doc[campo]) return;
    ed.mudar((d) => {
      M.redimensionarDoc(d, campo === 'largura' ? n : d.largura, campo === 'altura' ? n : d.altura, { formato: 'personalizado', assetsPorId: ed.assetsPorId });
    }, { chave: `doc-${campo}`, redesenhar: { pagina: true, sobre: true, faixa: true } });
    ed.ajustar();
  }
  function aplicarEstrategia(campo, v) {
    ed.mudarDocMeta((d) => {
      const e = d.estrategia ?? { pilar: null, bloco: null, motivo: '', gatilhoEmocional: '', gatilhoPsicologico: '' };
      if (campo === 'pilar') {
        e.pilar = v === '' ? null : Number(v);
        e.bloco = e.pilar == null ? null : blocoDoPilar(e.pilar) ?? e.bloco;
      } else e[campo] = String(v).slice(0, 600);
      d.estrategia = e;
    });
    if (campo === 'pilar') desenhar();
  }

  function aoMudarCampo(el, final) {
    const campo = el.dataset.campo;
    if (!campo) return;
    let v = valorDe(el);
    if (v === undefined) return;
    // regra dura: travessão e meia-risca viram vírgula (ou hífen entre números) na hora
    if (campo === 'texto' && TRACO.test(v)) {
      v = semTraco(v);
      const pos = Math.max(0, (el.selectionStart ?? v.length) - 1);
      el.value = v;
      try { el.setSelectionRange(pos + 1, pos + 1); } catch { /* campo sem cursor */ }
      toast('Travessão trocado por vírgula: regra dura da marca');
    }
    // os irmãos do mesmo campo (cor: seletor e código) acompanham
    for (const irmao of raiz.querySelectorAll(`[data-campo="${CSS.escape(campo)}"][data-alvo="${el.dataset.alvo}"]`)) {
      if (irmao === el) continue;
      if (irmao.type === 'color') irmao.value = hex6(v);
      else if (irmao.type === 'text') irmao.value = v;
      // deslizante e número andam juntos (os dois na mesma unidade de tela)
      else if (irmao.type === 'range' || irmao.type === 'number') irmao.value = el.value;
    }
    const alvo = el.dataset.alvo ?? 'camada';
    if (alvo === 'fundo') aplicarFundo(campo, v);
    else if (alvo === 'doc') { if (final) aplicarDoc(campo, v); }
    else if (alvo === 'estrategia') aplicarEstrategia(campo, v);
    else aplicarCamada(campo, v, { soTextos: alvo === 'textos' });
  }

  raiz.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    if (el.type === 'checkbox') return;
    if (el.hasAttribute('data-vao')) { vaoAtual = Math.max(0, Number(el.value) || 0); return; }
    aoMudarCampo(el, false);
  });
  raiz.addEventListener('change', (e) => {
    const el = e.target;
    if (el instanceof HTMLSelectElement && el.dataset.acaoChange === 'formato') return mudarFormato(el.value);
    // 22/10 (achado da revisão): o % das escolhidas vale no Enter ou ao sair do campo (digitar 120 não passa por 1 e 12)
    if (el instanceof HTMLInputElement && el.hasAttribute('data-escala-pct')) {
      const v = Number(String(el.value).replace(',', '.'));
      if (el.value !== '' && Number.isFinite(v)) ed.escalarPara(v);
      desenhar();
      return;
    }
    if (el instanceof HTMLSelectElement || (el instanceof HTMLInputElement && el.type === 'checkbox')) return aoMudarCampo(el, true);
    if (el instanceof HTMLInputElement && el.dataset.alvo === 'doc') aoMudarCampo(el, true);
  });
  raiz.addEventListener('keydown', (e) => {
    // Enter num campo de número confirma e volta pra página (as setas da página não brigam com o campo)
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') {
      e.preventDefault();
      aoMudarCampo(e.target, true);
      ed.no.querySelector('.est-palco')?.focus({ preventScroll: true });
    }
  });

  function mudarFormato(id) {
    const f = M.formatoInfo(id);
    const w = id === 'personalizado' ? ed.doc.largura : f.largura;
    const h = id === 'personalizado' ? ed.doc.altura : f.altura;
    ed.mudar((d) => {
      if (w !== d.largura || h !== d.altura || id !== d.formato) M.redimensionarDoc(d, w, h, { formato: id, assetsPorId: ed.assetsPorId });
      else d.formato = id;
    }, { redesenhar: 'tudo' });
    ed.ajustar();
  }

  raiz.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-acao], [data-cor]') : null;
    if (!b || b.disabled) return;
    if (b.dataset.cor) {
      const campo = b.dataset.campoCor;
      const alvo = b.dataset.alvo;
      const input = raiz.querySelector(`input[type="text"][data-campo="${CSS.escape(campo)}"][data-alvo="${alvo}"]`);
      if (input) { input.value = b.dataset.cor; aoMudarCampo(input, true); }
      // a amostra escolhida fica marcada na hora (o painel não é redesenhado pra cor)
      for (const x of b.parentElement.querySelectorAll('.est-amostra')) x.setAttribute('aria-pressed', String(x === b));
      return;
    }
    const a = b.dataset.acao;
    const v = b.dataset.valor;
    if (a === 'campo') { aplicarCamada(b.dataset.campo, v, { soTextos: b.dataset.alvo === 'textos' }); desenharSegmento(b); }
    else if (a === 'cadeado') {
      const c = ed.camada(ed.sel[0]);
      if (!c) return;
      cadeado.set(c.id, !proporcaoPresa(c));
      desenhar();
    }
    else if (a === 'alinhar') ed.alinhar(v);
    else if (a === 'ref-alinhar') ed.definirRefAlinhar(v);
    else if (a === 'escala') ed.escalarSelecao(Number(v));
    else if (a === 'empilhar') ed.empilhar(v, vaoAtual);
    else if (a === 'estilo') ed.estiloTexto(v);
    else if (a === 'tamanho') ed.passoTamanho(Number(v));
    else if (a === 'destacar') destacarTrecho();
    else if (a === 'tirar-destaque') tirarDestaques();
    else if (a === 'fundo-rapido') ed.fundoRapido(M.FUNDOS_RAPIDOS[Number(v)]?.fundo ?? {});
    else if (a === 'fundo-asset') ed.usarComoFundo(ed.assetsPorId.get(v));
    else if (a === 'pagina-duplicar') ed.duplicarPagina();
    else if (a === 'pagina-nova') ed.novaPagina();
    else if (a === 'pagina-modelo') abrirModelos({ formato: ed.doc.formato, aoEscolher: (m) => ed.inserirPaginasDoModelo(m), titulo: 'Página de um modelo' });
    else if (a === 'distribuir') ed.distribuir(v);
    else if (a === 'ordem') ed.ordenar(v === 'frente' || v === 'tras' ? v : Number(v));
    else if (a === 'duplicar') ed.duplicarSelecao();
    else if (a === 'atravessar') ed.atravessarProxima();
    else if (a === 'apagar') ed.apagarSelecao();
    else if (a === 'travar' || a === 'ocultar') {
      const campo = a === 'travar' ? 'travada' : 'oculta';
      const sel = ed.selecionadas();
      const todas = sel.every((c) => c[campo]);
      ed.mudar(() => { for (const c of sel) c[campo] = !todas; }, { redesenhar: { pagina: true, sobre: true, props: true, camadas: true } });
    } else if (a === 'trocar-imagem') ed.esq?.trocarImagem({ alvo: 'camada', id: ed.sel[0] });
    else if (a === 'proporcao-original') {
      const c = ed.camada(ed.sel[0]);
      const ast = ed.assetsPorId.get(c?.assetId);
      if (!c || !ast?.largura) return;
      ed.mudar(() => {
        const ctr = M.centro(c);
        c.largura = Math.round(c.altura * (ast.largura / ast.altura));
        c.x = Math.round(ctr.x - c.largura / 2);
      });
    } else if (a === 'ajustar-largura') ajustarLarguraAoTexto();
    else if (a === 'fundo-tipo') {
      ed.mudar((d) => { d.paginas[ed.idx].fundo.tipo = v; if (v === 'imagem') ed.corPorTrasDoFundo(); }, { redesenhar: { pagina: true, sobre: true, props: true } });
      if (v === 'imagem' && !ed.fundoAtual().assetId) ed.esq?.trocarImagem({ alvo: 'fundo' });
    } else if (a === 'fundo-ajuste') ed.mudar((d) => { d.paginas[ed.idx].fundo.ajuste = v; }, { redesenhar: { pagina: true, sobre: true, props: true } });
    else if (a === 'fundo-imagem') ed.esq?.trocarImagem({ alvo: 'fundo' });
    else if (a === 'gradiente-pronto') {
      // o gradiente pronto é um fundo rápido também: virou de claro pra escuro, oferece trocar as cores
      const g = M.GRADIENTES[Number(v)];
      if (g) ed.fundoRapido({ tipo: 'gradiente', cor: g.cor, cor2: g.cor2, angulo: g.angulo });
    } else if (a === 'fundo-todas') {
      const f = M.clonar(ed.fundoAtual());
      ed.mudar((d) => { for (const p of d.paginas) p.fundo = M.clonar(f); }, { redesenhar: { pagina: true, faixa: true } });
    }
  });

  function desenharSegmento(b) {
    for (const x of b.parentElement.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
  }

  // a pílula fica do tamanho do texto: mede a linha mais larga numa caixa sem quebra
  function ajustarLarguraAoTexto() {
    const c = ed.camada(ed.sel[0]);
    const el = ed.no.querySelector(`.est-folha [data-camada="${CSS.escape(c?.id ?? '')}"]`);
    if (!c || !el) return;
    const clone = el.cloneNode(true);
    clone.style.width = 'max-content';
    clone.style.whiteSpace = 'pre';
    clone.style.transform = 'none';
    clone.style.visibility = 'hidden';
    el.parentElement.append(clone);
    const w = clone.offsetWidth;
    clone.remove();
    if (!w) return;
    ed.mudar(() => {
      const ctr = M.centro(c);
      const novo = Math.ceil(w + 1);
      if (c.alinhamento === 'centro') c.x = Math.round(ctr.x - novo / 2);
      else if (c.alinhamento === 'direita') c.x = Math.round(c.x + c.largura - novo);
      c.largura = novo;
    });
  }

  // durante o arrasto só os números de posição mudam (o painel não é redesenhado e o foco fica onde está)
  function atualizarGeometria() {
    // o % das escolhidas acompanha a alça, a largura digitada e o desfazer
    const pct = raiz.querySelector('input[data-escala-pct]');
    const t = pct && document.activeElement !== pct ? ed.tamanhoDaSelecao?.() : null;
    if (t) pct.value = fmt(t.pct, 1);
    const c = ed.selecionadas().length === 1 ? ed.selecionadas()[0] : null;
    if (!c) return;
    const vals = { x: c.x, y: c.y, largura: c.largura, altura: c.altura, rotacao: c.rotacao, tamanho: c.tamanho };
    for (const [k, v] of Object.entries(vals)) {
      for (const el of raiz.querySelectorAll(`input[data-campo="${k}"][data-alvo="camada"]`)) if (document.activeElement !== el && v != null) el.value = fmt(v);
    }
  }
  function atualizarTexto(c) {
    const el = raiz.querySelector('textarea[data-campo="texto"]');
    if (el && document.activeElement !== el && ed.sel[0] === c.id) el.value = c.texto;
  }

  // 22/10 (Pedro, do Ateliê original): destacar o trecho escolhido no campo Conteúdo num clique (vira *trecho*)
  function destacarTrecho() {
    const ta = raiz.querySelector('textarea[data-campo="texto"]');
    if (!ta) return;
    const v = ta.value;
    let i = ta.selectionStart ?? 0;
    let j = ta.selectionEnd ?? 0;
    while (i < j && /\s/.test(v[i])) i++;
    while (j > i && /\s/.test(v[j - 1])) j--;
    if (i === j) { toast('Escolha o trecho no campo Conteúdo e clique de novo'); ta.focus(); return; }
    const trecho = v.slice(i, j).replace(/\*/g, '');
    ta.value = `${v.slice(0, i).replace(/\*$/, '')}*${trecho}*${v.slice(j).replace(/^\*/, '')}`;
    aoMudarCampo(ta, true);
    desenhar();
  }
  function tirarDestaques() {
    const ta = raiz.querySelector('textarea[data-campo="texto"]');
    if (!ta) return;
    ta.value = ta.value.replace(/\*/g, '');
    aoMudarCampo(ta, true);
    desenhar();
  }

  return { desenhar, atualizarGeometria, atualizarTexto, ajustarLarguraAoTexto };
}
