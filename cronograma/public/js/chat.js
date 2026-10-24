// Criar reel: passo 1 (dia no calendário, tipo, formato da biblioteca) e o chat SSE com as
// skills reels-leo e reels-curtos (porta da v1). O agente grava pelo salvar_reel no servidor.
// Reel novo só começa com dia E tipo escolhidos (o servidor também recusa sem os dois).
// Escolhido o tipo, aparece o cartão do estilo (objetivo, ganchos modelo, CTA). Os formatos que o guia
// do estilo recomenda (estilo.formatosRecomendados, a mesma lista da Biblioteca) sobem pro topo com o
// selo "recomendado pra X"; os outros que também servem pro tipo (formato.tipos) vêm logo depois, sem selo.
// 25/09: a peça (Reel, Carrossel, Estático, Stories) se escolhe aqui e vai pro chat e pro salvar_reel.
// Formato da Biblioteca de Reels só aparece com Reel.
// 21/10 (Pedro): reel, carrossel e estático nascem sempre na aba Ateliê (views/atelie.js). abrirCriar e abrirChat
// desenham dentro dela (alvo) em vez do painel lateral; chamado de fora (menu, dia do cronograma, ideia,
// biblioteca), abrirCriar só leva pra aba com o pedido. Editar peça que já existe continua no painel.
// 24/10 (Pedro: "Dar opção de criar no ateliê, storys também"): Stories volta pro passo 1 do Ateliê, sem a IA. Pede o dia
// (sem story ainda: um dia tem um só), o bloco, o objetivo e o tema; "Criar story" grava (POST /api/stories) e abre o
// painel do story pra escrever os quadros; "Criar e abrir no Design" leva pro editor do Ateliê (#/atelie?arte=)
import {
  esc, negrito, fmtData, store, recarregar, abrirPainel, fecharPainel, BTN_FECHAR, DIAS, TIPOS, PECAS,
  formato, campanha, ideia, seloFormato, icone, tipoReel, pillTipo, sessaoCaiu, pecaInfo, rotuloPeca,
  estilo, tiposDoFormato, partesGancho, comLacunas, nomeTema, temaDo, tipoFormato, pillFormato, navegar,
  BLOCOS_ESTRATEGIA, blocoInfo, pillBloco, pilarInfo, tipoDoPilar, blocoDaPeca, api, toast, aoMudar,
} from './core.js';
import { abrirDetalhe } from './detalhe.js';
import { abrirStories, OBJETIVOS, objetivoInfo } from './stories.js';

const CAMPANHA_PADRAO = 'cmp_prelancamento';
const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const isoDe = (d) => d.toLocaleDateString('sv-SE');
const nomeMes = (d) => { const s = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const diaLongo = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
// "Criar carrossel", "Bloco do story": o nome da peça em minúscula e o artigo dela (22/10: o story no singular)
const NOME_PECA = { reel: 'reel', carrossel: 'carrossel', estatico: 'estático', stories: 'story' };
const DA_PECA = { reel: 'do reel', carrossel: 'do carrossel', estatico: 'do estático', stories: 'do story' };
const pillPeca = (id) => { const p = pecaInfo(id); return p ? `<span class="pill pill-peca">${icone(p.icone, 13)}${esc(p.nome)}</span>` : ''; };

const chaveCodigo = (c = '') => {
  const [a, b] = String(c).split('.');
  return [a === 'T' ? 999 : Number(a) || 998, Number(b) || 0];
};
const porCodigo = (x, y) => {
  const [a1, b1] = chaveCodigo(x.codigo), [a2, b2] = chaveCodigo(y.codigo);
  return a1 - a2 || b1 - b2;
};

function agrupar(formatos) {
  const grupos = new Map();
  for (const f of formatos) {
    const k = f.categoria || 'Outros';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(f);
  }
  return [...grupos];
}


// reels por dia (pro calendário do passo 1)
function reelsPorDia() {
  const m = new Map();
  for (const r of store.E?.reels ?? []) {
    if (!r.data) continue;
    if (!m.has(r.data)) m.set(r.data, []);
    m.get(r.data).push(r);
  }
  return m;
}

// 24/10: o story de cada dia (um por dia), pro calendário do passo 1 com a peça Stories
const storiesPorDia = () => new Map((store.E?.stories ?? []).filter((s) => s.data).map((s) => [s.data, s]));
// o passo 1 aberto ouve a recarga do estado (um por vez): o story criado ou apagado em outro lugar muda o dia aqui também
let pararOuvinte = null;

// grade do mês: dia com reel tem ponto + dica (título e tipo); fim de semana esmaecido, mas clicável.
// stories (24/10): com a peça Stories, o ocupado é o dia que já tem story (o mapa de storiesPorDia)
function gradeMes(mes, escolhido, porDia, stories = null) {
  const hoje = hojeISO();
  const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const nDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  let html = DIAS.map((d) => `<span class="cc-cab" aria-hidden="true">${d}</span>`).join('');
  for (let i = 0; i < primeiro.getDay(); i++) html += '<span class="cc-vazio" aria-hidden="true"></span>';
  for (let n = 1; n <= nDias; n++) {
    const d = new Date(mes.getFullYear(), mes.getMonth(), n);
    const iso = isoDe(d);
    const rs = porDia.get(iso) ?? [];
    const sto = stories?.get(iso) ?? null;
    const ocupado = stories ? Boolean(sto) : rs.length > 0;
    const fds = d.getDay() === 0 || d.getDay() === 6;
    const dica = stories
      ? (sto ? `Story: ${sto.tema || 'sem tema'}` : 'Dia sem story')
      : rs.length ? rs.map((r) => `${r.ideia} · ${rotuloPeca(r)} · ${blocoInfo(blocoDaPeca(r))?.nome ?? 'sem bloco'}`).join('\n') : 'Dia livre';
    const leitura = stories
      ? `${diaLongo(iso)}, ${sto ? `já tem story: ${sto.tema || 'sem tema'}` : 'sem story'}`
      : `${diaLongo(iso)}, ${rs.length ? `já tem ${rs.length === 1 ? '1 peça' : `${rs.length} peças`}: ${dica.replace(/\n/g, '; ')}` : 'livre'}`;
    const pontos = stories ? (sto ? '<i></i>' : '') : rs.slice(0, 3).map((r) => `<i data-tipo="${esc(r.tipo ?? '')}"></i>`).join('');
    html += `<button type="button" class="cc-dia${fds ? ' fds' : ''}${iso === hoje ? ' hoje' : ''}${iso < hoje ? ' passado' : ''}${ocupado ? ' ocupado' : ''}"
      data-dia="${iso}" aria-pressed="${iso === escolhido}" title="${esc(dica)}" aria-label="${esc(leitura)}">
      <span class="cc-num">${n}</span>
      ${pontos ? `<span class="cc-pontos" aria-hidden="true">${pontos}</span>` : ''}
    </button>`;
  }
  return html;
}

// ── Passo 1 ─────────────────────────────────────────────────────────────
// alvo: o elemento da aba Ateliê onde o passo 1 se desenha; aoComecar(sel): o que fazer no "Começar no chat"
export function abrirCriar({ data = '', formatoId = '', ideiaId = '', tipo = '', peca = '' } = {}, { alvo = null, aoComecar = null } = {}) {
  // 24/10: o story também nasce no Ateliê (antes abria o chat no painel lateral)
  if (!alvo) {
    const pedido = new URLSearchParams(Object.entries({ peca, data, formatoId, ideiaId, tipo }).filter(([, v]) => v)).toString();
    navegar(`#/atelie${pedido ? `?${pedido}` : ''}`);
    return;
  }
  const E = store.E;
  if (!E) return;
  const ide = ideiaId ? ideia(ideiaId) : null;
  const cmp = campanha(CAMPANHA_PADRAO) ?? E.campanhas[0];
  const sel = {
    data: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : '',
    tipo: tipoReel(tipo) ? tipo : tipoReel(ide?.tipo) ? ide.tipo : '',
    // 21/10 (Pedro): na tela é o bloco e o pilar da estratégia principal; o tipo por dentro acompanha o pilar
    pilar: '',
    bloco: '',
    formatoId: formatoId || ide?.formatoId || '',
    campanhaId: cmp?.id ?? '',
    ideiaId: ide?.id ?? '',
    peca: pecaInfo(peca) ? peca : 'reel',
  };
  if (sel.formatoId && !formato(sel.formatoId)) sel.formatoId = '';
  const porDia = reelsPorDia();
  let porStory = storiesPorDia();
  // 24/10: o objetivo do story segue o bloco (Conversão vende, o resto engaja) até alguém escolher na mão
  let objetivoStory = '';
  const ehStory = () => sel.peca === 'stories';
  const objetivoDoStory = () => objetivoStory || (sel.bloco === 'Conversão' ? 'vendas' : 'engajamento');
  let mes = sel.data ? new Date(Number(sel.data.slice(0, 4)), Number(sel.data.slice(5, 7)) - 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let estiloAberto = false;

  const ordenados = [...E.formatos].sort(porCodigo);
  const validados = ordenados.filter((f) => f.status === 'validado');
  const emTeste = ordenados.filter((f) => f.status !== 'validado');
  const abrirTestes = !validados.length || emTeste.some((f) => f.id === sel.formatoId);
  const principais = TIPOS.filter((t) => !t.secundario);
  const secundarios = TIPOS.filter((t) => t.secundario);

  const serve = (f) => Boolean(sel.tipo) && tiposDoFormato(f).includes(sel.tipo);
  const recomendados = () => (sel.tipo ? estilo(sel.tipo)?.formatosRecomendados ?? [] : []);
  const recomendado = (f) => recomendados().includes(f.id);
  // o tipo do formato vem primeiro (dentro de um grupo da mesma categoria ele já está no título do grupo);
  // código, duração e selo ficam pequenos
  const opcao = (f, { comTipo = true } = {}) => {
    const t = recomendado(f) ? tipoReel(sel.tipo) : null;
    return `
    <button type="button" class="cria-opcao${t ? ' recomendado' : ''}" data-formato="${f.id}" aria-pressed="${f.id === sel.formatoId}">
      ${comTipo ? `<span class="cria-tipo-fmt">${esc(tipoFormato(f))}</span>` : ''}
      <strong>${esc(f.nome)}</strong>
      ${f.formula ? `<small class="cria-formula">${esc(f.formula)}</small>` : ''}
      <span class="cria-selo"><small class="cria-meta">${[f.codigo, f.duracao].filter(Boolean).map(esc).join(' · ')}</small>${seloFormato(f, { compacto: true })}${t ? `<span class="cria-reco">${icone(t.icone, 12)}recomendado</span>` : ''}</span>
    </button>`;
  };
  const opcaoSemTipo = (f) => opcao(f, { comTipo: false });

  const grupos = (lista) => {
    const gs = agrupar(lista);
    if (gs.length === 1 && gs[0][0] === 'Nossos testes') return `<div class="cria-grade">${gs[0][1].map(opcaoSemTipo).join('')}</div>`;
    return gs.map(([cat, fs]) => `
      <div class="cria-grupo">
        <div class="cria-grupo-titulo">${esc(tipoFormato(fs[0]) || cat)}<span>${fs.length}</span></div>
        <div class="cria-grade">${fs.map(opcaoSemTipo).join('')}</div>
      </div>`).join('');
  };

  // com tipo escolhido: os recomendados pelo guia do estilo (na ordem dele), depois os que também servem
  const formatosHtml = () => {
    const t = tipoReel(sel.tipo);
    const ordem = recomendados();
    const rank = (f) => ordem.indexOf(f.id);
    const reco = t ? validados.filter(recomendado).sort((a, b) => rank(a) - rank(b)) : [];
    const tambem = t ? validados.filter((f) => serve(f) && !recomendado(f)) : [];
    const outros = validados.filter((f) => !reco.includes(f) && !tambem.includes(f));
    const aviso = `<div class="cria-aviso">Nenhum formato validado ainda. Validar exige ${E.regraValidacao?.minCasesAcima ?? 2} cases rendendo 1,5× a mediana da conta ou um benchmark com número e fonte.</div>`;
    if (!reco.length && !tambem.length) {
      return `
      <div class="bloco">
        <div class="bloco-titulo">Formatos validados<span class="cria-conta">${validados.length}</span></div>
        ${validados.length ? grupos(validados) : aviso}
      </div>`;
    }
    return `
      ${reco.length ? `
      <div class="bloco">
        <div class="bloco-titulo">Recomendados pro pilar ${esc(String(sel.pilar))}<span class="cria-conta">${reco.length}</span></div>
        <div class="cria-grade">${reco.map((f) => opcao(f)).join('')}</div>
      </div>` : ''}
      ${tambem.length ? `
      <div class="bloco">
        <div class="bloco-titulo">${reco.length ? 'Também servem' : 'Servem'} pro pilar ${esc(String(sel.pilar))}<span class="cria-conta">${tambem.length}</span></div>
        <div class="cria-grade">${tambem.map((f) => opcao(f)).join('')}</div>
      </div>` : ''}
      ${outros.length ? `
      <div class="bloco">
        <div class="bloco-titulo">Outros formatos validados<span class="cria-conta">${outros.length}</span></div>
        ${grupos(outros)}
      </div>` : ''}`;
  };

  // 21/10 (Pedro): os pilares ativos do bloco escolhido (os guardados não aparecem)
  const pilaresHtml = () => {
    if (!sel.bloco) return '<p class="cria-pilares-vazio">Escolha o bloco pra ver os pilares.</p>';
    const ps = (E.pilares ?? []).filter((p) => p.bloco === sel.bloco && p.status !== 'guardado');
    return ps.map((p) => `
      <button type="button" class="cria-pilar" data-pilar-opcao="${p.id}" aria-pressed="${p.id === Number(sel.pilar)}" title="${esc(p.descricao ?? '')}">
        <strong>${p.id} · ${esc(p.nome)}</strong>${p.descricao ? `<small>${esc(p.descricao)}</small>` : ''}
      </button>`).join('');
  };

  // cartão compacto do estilo: objetivo, 3 ganchos modelo e a CTA (tudo do guia, com "ver tudo")
  // 21/10: o cartão é do pilar escolhido (estratégia principal); os ganchos modelo e a CTA vêm do guia por dentro
  const estiloHtml = () => {
    const pl = pilarInfo(sel.pilar);
    const t = tipoReel(sel.tipo);
    if (!pl || !t) return '';
    const b = blocoInfo(pl.bloco);
    const topo = `
      <div class="cria-estilo-topo">
        <span class="cria-estilo-ico">${icone(b?.icone ?? t.icone, 18)}</span>
        <div>
          <span class="cria-rotulo">Pilar ${esc(`${pl.id} · ${pl.nome}`)}${b ? ` · ${esc(b.longo)}` : ''}</span>
          <p class="cria-estilo-obj">${esc(pl.descricao ?? '')}</p>
        </div>
      </div>`;
    const e = estilo(t.id);
    if (!e) return topo;
    const todos = e.ganchosModelo ?? [];
    const ganchos = (estiloAberto ? todos : todos.slice(0, 3)).map(partesGancho);
    const ctas = (e.ctas ?? []).filter(Boolean);
    const maisDe = todos.length > 3 || ctas.length > 1;
    return `
      ${topo}
      <div class="cria-estilo-corpo">
        <div class="cria-estilo-bloco">
          <span class="cria-estilo-sub">Ganchos modelo</span>
          <ol class="cria-estilo-ganchos">
            ${ganchos.map((g) => `<li><span>${comLacunas(g.modelo)}</span>${g.exemplo ? `<small>Ex.: ${esc(g.exemplo)}</small>` : ''}</li>`).join('')}
          </ol>
        </div>
        <div class="cria-estilo-bloco">
          <span class="cria-estilo-sub">${estiloAberto && ctas.length > 1 ? 'CTAs' : 'CTA'}</span>
          ${(estiloAberto ? ctas : ctas.slice(0, 1)).map((c) => `<p class="cria-estilo-cta">${esc(c)}</p>`).join('')}
        </div>
      </div>
      ${maisDe ? `<button type="button" class="cria-estilo-mais" data-estilo-tudo aria-expanded="${estiloAberto}">${estiloAberto ? 'Mostrar menos' : `Ver os ${todos.length} ganchos e as ${ctas.length} CTAs`}</button>` : ''}`;
  };

  const html = `
    <div class="painel-topo">
      <div>
        <h2>Criar ${esc(NOME_PECA[sel.peca])}</h2>
      </div>
      ${alvo ? '' : BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      <section class="cria-peca" aria-labelledby="cp-titulo">
        <div class="bloco-titulo" id="cp-titulo">Peça</div>
        <div class="segmentado cria-peca-opcoes" role="group" aria-labelledby="cp-titulo">
          ${PECAS.map((pc) => `<button type="button" data-peca-opcao="${pc.id}" aria-pressed="${pc.id === sel.peca}">${icone(pc.icone, 15)}${esc(pc.nome)}</button>`).join('')}
        </div>
      </section>

      ${ide ? `
      <div class="cria-ideia">
        <span class="cria-ideia-icone">${icone('lampada', 18)}</span>
        <div>
          <span class="cria-rotulo">Ideia do banco${ide.tema ? ` · ${esc(nomeTema(ide.tema, { curto: true }))}` : ''}</span>
          <strong>${esc(ide.titulo)}</strong>
          ${ide.roteiroBase?.hook || ide.gancho ? `<p class="cria-gancho">${ide.roteiroBase?.hook ? 'Hook do roteiro base' : 'Gancho sugerido'}: "${esc(ide.roteiroBase?.hook || ide.gancho)}"</p>` : ''}
          ${ide.descricao ? `<p class="cria-ideia-desc">${esc(ide.descricao)}</p>` : ''}
        </div>
      </div>` : ''}

      <div class="cria-quando">
        <section class="cria-cal" aria-labelledby="cc-titulo">
          <div class="bloco-titulo" id="cc-titulo">Dia de publicação<span class="cria-obrig">obrigatório</span></div>
          <div class="cc-topo">
            <button type="button" class="btn-icone btn-sm" data-cc-mes="-1" aria-label="Mês anterior">${icone('chevron-esq', 16)}</button>
            <strong id="cc-nome" aria-live="polite">${esc(nomeMes(mes))}</strong>
            <button type="button" class="btn-icone btn-sm" data-cc-mes="1" aria-label="Próximo mês">${icone('chevron-dir', 16)}</button>
          </div>
          <div class="cc-grade" id="cc-grade" role="group" aria-label="Dias do mês">${gradeMes(mes, sel.data, porDia, ehStory() ? porStory : null)}</div>
          <div class="cc-legenda" aria-hidden="true">
            <span><i class="cc-leg ocupado"></i><span id="cc-leg-ocupado">${ehStory() ? 'já tem story' : 'já tem peça'}</span></span>
            <span><i class="cc-leg livre"></i>livre</span>
            <span><i class="cc-leg fds"></i>fim de semana</span>
          </div>
          <p class="cc-escolhido" id="cc-escolhido" aria-live="polite"></p>
        </section>

        <section class="cria-tipos" aria-labelledby="ct-titulo">
          <div class="bloco-titulo" id="ct-titulo"><span id="ct-nome">${ehStory() ? 'Bloco' : 'Bloco e pilar'} ${esc(DA_PECA[sel.peca])}</span><span class="cria-obrig">obrigatório</span></div>
          <div class="cria-tipo-lista" role="group" aria-label="Bloco da estratégia">
            ${BLOCOS_ESTRATEGIA.map((b) => `
            <button type="button" class="cria-tipo" data-bloco-opcao="${esc(b.id)}" aria-pressed="${b.id === sel.bloco}" title="${esc(`${b.longo}: ${b.serve}`)}">
              <span class="cria-tipo-ico">${icone(b.icone, 18)}</span>
              <span class="cria-tipo-texto"><strong>${esc(b.longo)}</strong><small>${esc(b.serve)} · ${b.fatia}% da pauta</small></span>
            </button>`).join('')}
          </div>
          <div class="cria-pilares" id="cria-pilares" role="group" aria-label="Pilar" ${ehStory() ? 'hidden' : ''}>${pilaresHtml()}</div>
          <div class="rotulo-fixo" id="cria-campanha" ${ehStory() ? 'hidden' : ''}>Campanha<span class="campo-fixo" title="Por enquanto só existe esta campanha">${icone('alvo', 16)}${esc(cmp?.nome ?? 'Pré-lançamento')}</span></div>
        </section>
      </div>

      <section class="cria-story" id="cria-story" aria-labelledby="cs-titulo" ${ehStory() ? '' : 'hidden'}>
        <div class="bloco-titulo" id="cs-titulo">O story<span class="cria-obrig">tema obrigatório</span></div>
        <div class="cria-story-campos">
          <label class="rotulo cria-story-tema">Tema<input class="campo" id="cs-tema" maxlength="300" autocomplete="off" placeholder="Ex.: Enquete: você sabe o que é o DAS?" /></label>
          <div class="rotulo">Objetivo
            <div class="segmentado" role="group" aria-label="Objetivo do story">${OBJETIVOS.map((o) => `<button type="button" data-cs-objetivo="${o.id}" aria-pressed="${o.id === objetivoDoStory()}">${esc(o.nome)}</button>`).join('')}</div>
          </div>
        </div>
        <p class="cria-story-nota">Os quadros (3 a 5) você escreve logo depois, no painel do story, ou monta direto no Design.</p>
      </section>

      <section class="cria-estilo" id="cria-estilo" aria-label="O pilar escolhido" ${sel.pilar && !ehStory() ? '' : 'hidden'}>${estiloHtml()}</section>

      <div id="cria-formatos" ${sel.peca === 'reel' ? '' : 'hidden'}>${formatosHtml()}</div>

      ${emTeste.length ? `
      <div class="bloco" id="cria-testes-bloco" ${sel.peca === 'reel' ? '' : 'hidden'}>
        <button type="button" class="cria-sanfona" id="cria-toggle" aria-expanded="${abrirTestes}">
          <span class="bloco-titulo">Nossos testes<span class="cria-conta">${emTeste.length}</span></span>
          <span class="cria-sanfona-acao">${abrirTestes ? 'Esconder' : 'Mostrar'}</span>
        </button>
        <div id="cria-testes" ${abrirTestes ? '' : 'hidden'}>
          ${grupos(emTeste)}
        </div>
      </div>` : ''}
    </div>
    <div class="painel-rodape cria-rodape">
      <span class="cria-escolhido" id="cria-escolhido"></span>
      <button class="btn btn-fantasma" id="cria-sem-formato">Seguir sem formato</button>
      <button class="btn" id="cria-story-design" hidden>${icone('pincel', 16)}Criar e abrir no Design</button>
      <button class="btn btn-primario" id="cria-comecar">${ehStory() ? 'Criar story' : 'Começar no chat'}</button>
    </div>
  `;
  let p;
  if (alvo) { alvo.innerHTML = html; p = alvo; } else p = abrirPainel(html, { largo: true }) || document.querySelector('.painel');
  const comecar = (o) => (aoComecar ?? abrirChat)(o);

  const q = (s) => p.querySelector(s);
  const qq = (s) => [...p.querySelectorAll(s)];
  qq('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));

  const ligarDias = () => qq('[data-dia]').forEach((b) => (b.onclick = () => { sel.data = b.dataset.dia; marcar(); }));
  const desenharMes = () => {
    q('#cc-grade').innerHTML = gradeMes(mes, sel.data, porDia, ehStory() ? porStory : null);
    q('#cc-nome').textContent = nomeMes(mes);
    ligarDias();
  };

  // 24/10: o story pede o dia sem story, o bloco e o tema (o pilar fica de fora, como no painel do story)
  const temaStory = () => q('#cs-tema')?.value.trim() ?? '';
  const marcarStory = () => {
    const sto = sel.data ? porStory.get(sel.data) ?? null : null;
    const rs = sel.data ? porDia.get(sel.data) ?? [] : [];
    q('#cc-escolhido').innerHTML = !sel.data
      ? 'Escolha um dia no calendário.'
      : `<strong>${esc(diaLongo(sel.data))}</strong> · ${sto
        ? `<span class="cc-aviso">já tem story: ${esc(`"${sto.tema || 'sem tema'}"`)}. Um dia tem um só: escolha outro dia ou abra esse pelo cronograma</span>`
        : `sem story${rs.length ? `. ${rs.length === 1 ? 'O post do dia' : 'Os posts do dia'}: ${rs.map((r) => esc(`"${r.ideia}"`)).join(', ')}` : ''}`}`;
    qq('[data-cs-objetivo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.csObjetivo === objetivoDoStory())));
    const falta = [!sel.data && 'o dia', !sel.bloco && 'o bloco', !temaStory() && 'o tema'].filter(Boolean);
    const motivo = falta.length ? `Falta ${falta.join(', ').replace(/, ([^,]*)$/, ' e $1')}` : sto ? 'Esse dia já tem story' : '';
    for (const b of [q('#cria-comecar'), q('#cria-story-design')]) {
      b.disabled = Boolean(motivo);
      b.title = motivo;
    }
    q('#cria-escolhido').innerHTML = [
      pillPeca('stories'),
      sel.data ? `<span class="pill">${icone('calendario', 13)}${esc(fmtData(sel.data, { diaSemana: true }))}</span>` : '',
      sel.bloco ? pillBloco(sel.bloco) : '',
      `<span class="pill">${esc(objetivoInfo(objetivoDoStory()).nome)}</span>`,
      motivo ? `<span class="cria-falta">${esc(motivo)}</span>` : '',
    ].join('');
  };

  const marcar = () => {
    const comReel = sel.peca === 'reel';
    const f = comReel ? formato(sel.formatoId) : null;
    const pl = pilarInfo(sel.pilar);
    qq('[data-peca-opcao]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pecaOpcao === sel.peca)));
    qq('[data-formato]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.formato === sel.formatoId)));
    qq('[data-bloco-opcao]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.blocoOpcao === sel.bloco)));
    qq('[data-pilar-opcao]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pilarOpcao === String(sel.pilar))));
    qq('[data-dia]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dia === sel.data)));
    q('#cria-sem-formato').hidden = !comReel;
    q('#cria-story-design').hidden = !ehStory();
    if (ehStory()) { marcarStory(); return; }
    const rs = sel.data ? porDia.get(sel.data) ?? [] : [];
    q('#cc-escolhido').innerHTML = !sel.data
      ? 'Escolha um dia no calendário.'
      : `<strong>${esc(diaLongo(sel.data))}</strong> · ${rs.length
        ? `<span class="cc-aviso">já tem ${rs.length === 1 ? 'uma peça' : `${rs.length} peças`}: ${rs.map((r) => esc(`"${r.ideia}" (${rotuloPeca(r)}, ${blocoInfo(blocoDaPeca(r))?.nome ?? 'sem bloco'})`)).join(', ')}</span>`
        : 'dia livre'}`;
    const falta = [!sel.data && 'o dia', !pl && 'o pilar'].filter(Boolean);
    const pronto = !falta.length;
    q('#cria-comecar').disabled = !pronto || (comReel && !f);
    q('#cria-sem-formato').disabled = !pronto;
    q('#cria-comecar').title = !pronto ? `Escolha ${falta.join(' e ')} antes` : comReel && !f ? 'Escolha um formato' : '';
    q('#cria-sem-formato').title = !pronto ? `Escolha ${falta.join(' e ')} antes` : '';
    q('#cria-escolhido').innerHTML = [
      pillPeca(sel.peca),
      sel.data ? `<span class="pill">${icone('calendario', 13)}${esc(fmtData(sel.data, { diaSemana: true }))}</span>` : '',
      sel.bloco ? pillBloco(sel.bloco) : '',
      pl ? `<span class="pill">Pilar ${esc(`${pl.id} · ${pl.nome}`)}</span>` : '',
      f ? pillFormato(f) : '',
      falta.length ? `<span class="cria-falta">Falta escolher ${falta.join(' e ')}</span>` : comReel && !f ? '<span>Escolha um formato</span>' : '',
    ].join('');
  };
  ligarDias();
  marcar();

  qq('[data-cc-mes]').forEach((b) => (b.onclick = () => {
    mes = new Date(mes.getFullYear(), mes.getMonth() + Number(b.dataset.ccMes), 1);
    desenharMes();
  }));
  const ligarFormatos = () => qq('[data-formato]').forEach((b) => (b.onclick = () => { sel.formatoId = b.dataset.formato; marcar(); }));
  const desenharEstilo = () => {
    const caixa = q('#cria-estilo');
    caixa.hidden = !sel.pilar || ehStory();
    caixa.innerHTML = estiloHtml();
    const mais = caixa.querySelector('[data-estilo-tudo]');
    if (mais) mais.onclick = () => { estiloAberto = !estiloAberto; desenharEstilo(); caixa.querySelector('[data-estilo-tudo]')?.focus(); };
  };
  const ligarPilares = () => qq('[data-pilar-opcao]').forEach((b) => (b.onclick = () => {
    if (String(sel.pilar) === b.dataset.pilarOpcao) return;
    sel.pilar = Number(b.dataset.pilarOpcao);
    sel.tipo = tipoDoPilar(sel.pilar) ?? '';
    estiloAberto = false;
    desenharEstilo();
    q('#cria-formatos').innerHTML = formatosHtml();
    ligarFormatos();
    marcar();
  }));
  qq('[data-bloco-opcao]').forEach((b) => (b.onclick = () => {
    if (sel.bloco === b.dataset.blocoOpcao) return;
    sel.bloco = b.dataset.blocoOpcao;
    if (pilarInfo(sel.pilar)?.bloco !== sel.bloco) { sel.pilar = ''; sel.tipo = ''; desenharEstilo(); }
    q('#cria-pilares').innerHTML = pilaresHtml();
    ligarPilares();
    marcar();
  }));
  ligarPilares();
  qq('[data-peca-opcao]').forEach((b) => (b.onclick = () => {
    if (sel.peca === b.dataset.pecaOpcao) return;
    const eraStory = ehStory();
    sel.peca = b.dataset.pecaOpcao;
    const comReel = sel.peca === 'reel';
    // o h2 do painel ganha o id painel-titulo (abrirPainel): acha pela classe
    q('.painel-topo h2').textContent = `Criar ${NOME_PECA[sel.peca]}`;
    q('#ct-nome').textContent = `${ehStory() ? 'Bloco' : 'Bloco e pilar'} ${DA_PECA[sel.peca]}`;
    q('#cria-formatos').hidden = !comReel;
    const testes = q('#cria-testes-bloco');
    if (testes) testes.hidden = !comReel;
    // 24/10: o story troca o pilar, a campanha e o cartão do pilar pelo tema e o objetivo; o calendário marca o dia com story
    q('#cria-pilares').hidden = ehStory();
    q('#cria-campanha').hidden = ehStory();
    q('#cria-story').hidden = !ehStory();
    q('#cria-comecar').textContent = ehStory() ? 'Criar story' : 'Começar no chat';
    q('#cc-leg-ocupado').textContent = ehStory() ? 'já tem story' : 'já tem peça';
    if (eraStory !== ehStory()) desenharMes();
    desenharEstilo();
    marcar();
  }));
  q('#cs-tema').oninput = () => marcar();
  // o dia que ganhou ou perdeu story em outro lugar (o painel, o cronograma, outra pessoa): o calendário redesenha sem
  // tirar o foco do dia. Sai quando o passo 1 some (o chat começou ou outro passo 1 abriu)
  pararOuvinte?.();
  pararOuvinte = aoMudar(() => {
    if (!q('#cc-grade')) { pararOuvinte?.(); pararOuvinte = null; return; }
    porStory = storiesPorDia();
    if (!ehStory()) return;
    const foco = p.contains(document.activeElement) ? document.activeElement.closest('[data-dia]')?.dataset.dia : null;
    desenharMes();
    marcar();
    if (foco) q(`[data-dia="${foco}"]`)?.focus({ preventScroll: true });
  });
  qq('[data-cs-objetivo]').forEach((b) => (b.onclick = () => { objetivoStory = b.dataset.csObjetivo; marcar(); }));
  // grava o story e segue: o painel dele (pra escrever os quadros) ou o editor do Design
  const criarStory = async (depois) => {
    if (!ehStory() || !sel.data || !sel.bloco || !temaStory() || porStory.has(sel.data)) return;
    const botoes = [q('#cria-comecar'), q('#cria-story-design')];
    botoes.forEach((x) => { x.disabled = true; });
    try {
      const novo = await api('POST', '/api/stories', { data: sel.data, bloco: sel.bloco, objetivo: objetivoDoStory(), tema: temaStory(), quadros: [] });
      porStory.set(novo.data, novo);
      q('#cs-tema').value = '';
      desenharMes();
      marcar();
      await recarregar();
      toast(`Story criado em ${fmtData(novo.data)}`);
      depois(novo);
    } catch (e) {
      toast(e.message);
      marcar();
    }
  };
  desenharEstilo();
  ligarFormatos();
  const toggle = q('#cria-toggle');
  if (toggle) toggle.onclick = () => {
    const aberto = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(aberto));
    q('#cria-testes').hidden = !aberto;
    q('.cria-sanfona-acao').textContent = aberto ? 'Esconder' : 'Mostrar';
  };
  const titulo = () => (ide ? ide.titulo : `Novo ${NOME_PECA[sel.peca]}`);
  const pronto = () => sel.data && pilarInfo(sel.pilar) && tipoReel(sel.tipo);
  q('#cria-comecar').onclick = () => {
    if (ehStory()) { criarStory((s) => abrirStories(s.id, true)); return; }
    if (!pronto()) return;
    // formato da Biblioteca de Reels só vale com reel
    if (sel.peca !== 'reel') comecar({ ...sel, formatoId: '', titulo: titulo() });
    else if (formato(sel.formatoId)) comecar({ ...sel, titulo: titulo() });
  };
  q('#cria-sem-formato').onclick = () => { if (pronto()) comecar({ ...sel, formatoId: '', titulo: titulo() }); };
  q('#cria-story-design').onclick = () => criarStory((s) => navegar(`#/atelie?arte=${encodeURIComponent(s.id)}`));

  // vindo da biblioteca, mostra o formato escolhido; vindo de uma ideia, o resumo dela fica no topo
  const escolhido = !ide && sel.formatoId && q(`[data-formato="${sel.formatoId}"]`);
  if (escolhido && sel.data && sel.tipo) requestAnimationFrame(() => escolhido.scrollIntoView({ block: 'nearest' }));
}

// ── Chat com a skill ────────────────────────────────────────────────────
const NOMES_FERRAMENTA = {
  Skill: 'Carregando a skill',
  Read: 'Lendo as regras da marca',
  Glob: 'Procurando os arquivos de referência',
  Grep: 'Buscando nas referências',
  mcp__cronograma__salvar_reel: 'Salvando no cronograma',
  mcp__cronograma__mostrar_card: 'Montando o card e conferindo as regras',
};

// alvo: o elemento da aba Ateliê onde o chat se desenha (a conversa vai com atelie: true); aoCard(ev): o card que a
// IA mostrou, com a conferência; aoSalvo(reel): a peça gravada. Devolve { enviar } pro botão "Salvar" do card
export function abrirChat({ formatoId = '', campanhaId = '', data = '', tipo = '', reelId = null, ideiaId = '', titulo = 'Novo reel', peca = '', pilar = '' } = {}, { alvo = null, aoCard = null, aoSalvo = null } = {}) {
  const chatId = crypto.randomUUID();
  // peça nova: o tipo escolhido no "Criar"; editando, o servidor usa a peça que já existe
  const pecaNova = !reelId && pecaInfo(peca) ? peca : '';
  const f = formato(formatoId);
  const c = campanha(campanhaId);
  const t = tipoReel(tipo);
  const ide = ideiaId ? ideia(ideiaId) : null;
  let ocupado = false;
  let salvou = false;

  const html = `
    <div class="painel-topo">
      <div>
        <h2>${esc(titulo)}</h2>
        <p class="chat-pills">${pecaNova ? pillPeca(pecaNova) : ''}${data ? `<span class="pill">${icone('calendario', 13)}${esc(fmtData(data, { ano: true, diaSemana: true }))}</span>` : ''}${pilarInfo(pilar) ? `${pillBloco(pilarInfo(pilar).bloco)}<span class="pill">Pilar ${esc(`${pilarInfo(pilar).id} · ${pilarInfo(pilar).nome}`)}</span>` : ''}${pecaNova && pecaNova !== 'reel' ? '' : pillFormato(f)}${c ? `<span class="pill">${icone('alvo', 13)}${esc(c.nome)}</span>` : ''}${ide ? `<span class="pill">${icone('lampada', 12)} ideia do banco</span>` : ''}</p>
      </div>
      ${alvo ? '' : BTN_FECHAR}
    </div>
    <div class="painel-corpo"><div class="chat-lista" aria-live="polite"></div></div>
    <form class="painel-rodape chat-rodape">
      <div class="chat-atalhos"></div>
      <div class="chat-entrada">
        <textarea class="campo" rows="1" placeholder="Escreva pra ${alvo ? 'o Ateliê' : 'skill'} (Enter envia, Shift+Enter quebra linha)" aria-label="Mensagem"></textarea>
        <button class="btn btn-primario" type="submit">Enviar</button>
      </div>
    </form>
  `;
  let p;
  if (alvo) { alvo.innerHTML = html; p = alvo; } else p = abrirPainel(html, { largo: true }) || document.querySelector('.painel');
  let mostrouCard = false;

  const chat = p.querySelector('.chat-lista');
  const corpo = p.querySelector('.painel-corpo');
  const form = p.querySelector('.chat-rodape');
  const campo = form.querySelector('textarea');
  const botao = form.querySelector('button[type="submit"]');
  const caixaAtalhos = form.querySelector('.chat-atalhos');
  p.querySelectorAll('[data-fechar]').forEach((b) => (b.onclick = fecharPainel));

  const rolar = () => (corpo.scrollTop = corpo.scrollHeight);
  const bolha = (classe, html = '') => {
    const d = document.createElement('div');
    d.className = `chat-msg ${classe}`;
    d.innerHTML = html;
    chat.append(d);
    rolar();
    return d;
  };
  let ultimoStatus = '';
  const status = (texto) => {
    if (texto === ultimoStatus) return;
    ultimoStatus = texto;
    bolha('sistema', esc(texto) + '...');
  };
  const atalhos = (lista) => {
    caixaAtalhos.innerHTML = lista.map((t) => `<button type="button" class="btn btn-sm">${esc(t)}</button>`).join('');
    caixaAtalhos.querySelectorAll('button').forEach((b) => (b.onclick = () => enviar(b.textContent)));
  };

  async function enviar(texto) {
    if (ocupado || !texto.trim()) return;
    ocupado = true;
    botao.disabled = true;
    caixaAtalhos.innerHTML = '';
    ultimoStatus = '';
    bolha('eu', esc(texto));
    let atual = bolha('ia');
    let bruto = '';
    let ultimaFala = '';
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chatId, mensagem: texto, formatoId, campanhaId, data, tipo: t?.id ?? '', reelId, ideiaId, ...(pecaNova ? { peca: pecaNova } : {}), ...(pilar ? { pilar: Number(pilar) } : {}), ...(alvo ? { atelie: true } : {}) }),
      });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({}));
        if (sessaoCaiu(r.status, j)) throw Object.assign(new Error('Sua sessão acabou. Entre de novo.'), { doServidor: true });
        throw Object.assign(new Error(j.erro || `Erro ${r.status}`), { doServidor: true });
      }
      const leitor = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await leitor.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const partes = buf.split('\n\n');
        buf = partes.pop();
        for (const parte of partes) {
          if (!parte.startsWith('data: ')) continue;
          const ev = JSON.parse(parte.slice(6));
          if (ev.type === 'text') {
            if (!bruto) chat.append(atual); // a bolha vazia desce pra baixo das linhas de ferramenta
            ultimoStatus = '';
            bruto += ev.delta; atual.innerHTML = negrito(bruto); ultimaFala = bruto; rolar();
          } else if (ev.type === 'break' && bruto.trim()) { atual = bolha('ia'); bruto = ''; }
          else if (ev.type === 'tool') {
            status(NOMES_FERRAMENTA[ev.name] ?? `Usando ${ev.name}`);
            if (!bruto) { chat.append(atual); rolar(); }
          }
          else if (ev.type === 'card') {
            mostrouCard = true;
            aoCard?.(ev);
            bolha('sistema', ev.qa?.bloqueia ? 'Card atualizado: a conferência achou um bloqueante.' : 'Card atualizado.');
          }
          else if (ev.type === 'reel') {
            reelId = ev.reel.id;
            salvou = true;
            aoSalvo?.(ev.reel);
            const s = document.createElement('div');
            s.className = 'chat-salvo';
            s.innerHTML = `<span>✓ "${esc(ev.reel.ideia)}" salvo no cronograma</span><button type="button" class="btn btn-sm">Ver detalhe</button>`;
            s.querySelector('button').onclick = async () => { await recarregar(); abrirDetalhe(ev.reel.id); };
            chat.append(s);
            rolar();
            recarregar();
          } else if (ev.type === 'done' && ev.ok === false) bolha('sistema', 'A skill parou antes do fim. Mande uma mensagem pra ela continuar.');
          else if (ev.type === 'error') bolha('sistema', 'Erro: ' + esc(ev.message));
        }
      }
    } catch (e) {
      bolha('sistema', (e.doServidor ? 'Erro: ' : 'Erro de conexão: ') + esc(e.message));
    }
    if (!atual.textContent.trim()) atual.remove();
    ocupado = false;
    botao.disabled = false;
    if (salvou) atalhos(['Deixa o gancho mais forte', 'Encurta a legenda', 'Troca a CTA pra salvar o post']);
    else if (mostrouCard) atalhos(['Sim, pode salvar', 'Deixa o gancho mais forte', 'Encurta a legenda']);
    else if (/salv/i.test(ultimaFala) && /\?/.test(ultimaFala)) atalhos(['Sim, pode salvar', 'Quero ajustar antes']);
    if (p.isConnected) campo.focus();
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    if (ocupado || !campo.value.trim()) return; // mantém o texto enquanto a skill responde
    const t = campo.value;
    campo.value = '';
    campo.style.height = 'auto';
    enviar(t);
  };
  campo.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  };
  campo.oninput = () => { campo.style.height = 'auto'; campo.style.height = campo.scrollHeight + 'px'; };

  if (reelId) {
    bolha('sistema', 'A skill já recebeu a peça atual. O que mudar?');
    atalhos(['Deixa o gancho mais forte', 'Encurta a legenda', 'Troca a CTA pra salvar o post']);
  } else if (ide) {
    bolha('sistema', `A skill já recebeu a ideia "${esc(ide.titulo)}".`);
    atalhos(['Pode seguir com essa ideia', 'Quero outras opções de gancho']);
  } else {
    bolha('sistema', 'Mande o tema e o gancho, ou peça sugestões.');
    atalhos(f
      ? ['Me dá 3 ideias nesse formato', 'Quero sugestões de gancho do banco', 'Já tenho o gancho']
      : ['Quero sugestões de gancho do banco', 'Já tenho o gancho']);
  }
  campo.focus();
  return { enviar, ocupado: () => ocupado, salvou: () => salvou };
}
