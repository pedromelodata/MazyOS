// 21/10 (Pedro): "quando for pré-gerada a linha editorial da semana nas segundas-feiras, faça uma pesquisa no Google e
// traga sugestões de temas contábeis juntando com a geração que você trouxer pra semana, que aí eu personalizo e movo
// conforme eu achar melhor. E também ter opção de regerar uma ideia de um dia".
// O painel "Sugestões da semana" do Cronograma (o calendário continua limpo; isto abre pelo botão da barra):
//   a semana escolhida (setas; abre na próxima, que é a que o gerador de segunda prepara);
//   o que o gerador fez e quando roda de novo (GET /api/semana/estado), com "Gerar a semana agora" pra Admin e Gerente
//     de Marketing (POST /api/semana/gerar, com confirmação);
//   os temas da pesquisa no Google (GET /api/semana/sugestoes): cada um com as evidências (a busca, a manchete com o
//     link), o bloco, o pilar, a peça e "Pôr no dia" (POST /api/semana/sugestoes/usar), que cria a peça como Ideia;
//   o resumo do mecanismo da semana (GET /api/mecanismo): volume contra o travado, mix dos blocos, oferta,
//     continuidade e os alertas.
import { esc, store, api, recarregar, toast, icone, abrirPainel, BTN_FECHAR, PECAS, pecaInfo, pillBloco, pilarInfo, BLOCOS_ESTRATEGIA, papelAtual, hojeBrasilia } from './core.js';
import { abrirDetalhe } from './detalhe.js';
import { abrirStories } from './stories.js';
import { segundaDe, somarDias, ddmm, rotuloSemana, diaDaSemana, carregarSemana, invalidarMecanismo } from './mecanismo.js';

const podeGerar = () => ['admin', 'gerente'].includes(papelAtual());
const tem = (v) => Boolean(String(v ?? '').trim());
const fusoBR = { timeZone: 'America/Sao_Paulo' };
// VOLUME travado da estratégia principal (o servidor manda o alvo; isto é só a reserva)
const ALVO = { reels: 3, feeds: 5, storiesTemas: 5 };
const PECAS_FEED = ['reel', 'carrossel', 'estatico'];
const ROTULO_EVID = { 'google-busca': 'Busca no Google', 'google-noticias': 'Google Notícias' };

const linkSeguro = (u) => (/^https?:\/\//i.test(String(u ?? '').trim()) ? String(u).trim() : '');
const ehIso = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? ''));
function quando(iso) {
  if (!iso) return '';
  if (ehIso(iso)) return `${diaDaSemana(iso)}, ${ddmm(iso)}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dia = d.toLocaleDateString('sv-SE', fusoBR);
  const hora = d.toLocaleTimeString('pt-BR', { ...fusoBR, hour: '2-digit', minute: '2-digit' });
  return `${diaDaSemana(dia)}, ${ddmm(dia)} às ${hora}`;
}
function relativo(seg) {
  const esta = segundaDe(hojeBrasilia());
  if (seg === esta) return 'Esta semana';
  if (seg === somarDias(esta, 7)) return 'Próxima semana';
  if (seg === somarDias(esta, -7)) return 'Semana passada';
  return '';
}
// percentual: o servidor pode mandar 0,3 ou 30
const pct = (v, ref = 100) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n > 0 && n <= 1 && ref > 1 ? Math.round(n * 100) : Math.round(n);
};
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// ── Estado do painel ───────────────────────────────────────────────────────
const est = { seg: '', estado: null, erroEstado: null, sugestoes: null, erroSug: null, mec: null, erroMec: null, gerando: false, erroGerar: '', pesquisando: false, abertoEm: 0 };
let relogio = 0;

export function abrirSugestoes(seg = '') {
  est.seg = ehIso(seg) ? segundaDe(seg) : somarDias(segundaDe(hojeBrasilia()), 7);
  est.abertoEm = Date.now();
  est.erroGerar = '';
  desenhar();
  carregarTudo();
}

// redesenhar: a semana mudou (o painel todo); sem isso, só as partes trocam (o foco fica onde estava)
function carregarTudo({ redesenhar = true } = {}) {
  const seg = est.seg;
  Object.assign(est, { sugestoes: null, erroSug: null, mec: null, erroMec: null });
  if (redesenhar || !painelAberto()) desenhar();
  else { pintar('temas'); pintar('mecanismo'); }
  api('GET', '/api/semana/estado')
    .then((d) => { est.estado = d; est.erroEstado = null; })
    .catch((e) => { est.erroEstado = e; })
    .finally(() => { pintar('gerador'); vigiar(); });
  carregarSugestoes(seg);
  carregarMec(seg);
}
// com a pesquisa rodando no servidor, pergunta de novo a cada 8 s (só com o painel aberto na mesma semana)
let relogioSug = 0;
function carregarSugestoes(seg) {
  clearTimeout(relogioSug);
  api('GET', `/api/semana/sugestoes?semana=${encodeURIComponent(seg)}`)
    .then((d) => { if (seg === est.seg) { est.sugestoes = d; est.erroSug = null; } })
    .catch((e) => { if (seg === est.seg) est.erroSug = e; })
    .finally(() => {
      if (seg !== est.seg) return;
      pintar('temas');
      if (est.sugestoes?.rodando) relogioSug = setTimeout(() => { if (painelAberto() && seg === est.seg) carregarSugestoes(seg); }, 8000);
    });
}
function carregarMec(seg, forcar = false) {
  carregarSemana(seg, { forcar }).then((c) => {
    if (seg !== est.seg) return;
    est.mec = c?.dados ?? null;
    est.erroMec = c?.dados ? null : c?.erro ?? null;
    pintar('mecanismo');
  });
}

// enquanto o gerador roda, pergunta de novo a cada 5 s com o painel aberto.
// 21/10 (Pedro): com o painel fechado também (a cada 15 s): o aviso do 202 promete os posts no calendário, então quando
// o gerador termina o estado recarrega e o calendário ganha as peças novas, com o painel aberto ou não
function vigiar() {
  clearTimeout(relogio);
  if (!est.estado?.rodando) return;
  relogio = setTimeout(async () => {
    try {
      const antes = est.estado?.rodando;
      est.estado = await api('GET', '/api/semana/estado');
      pintar('gerador');
      if (antes && !est.estado?.rodando) {
        invalidarMecanismo();
        await recarregar().catch(() => {});
        if (painelAberto()) carregarTudo({ redesenhar: false });
        else {
          const u = est.estado?.ultimaGeracao;
          toast(u && typeof u === 'object' && tem(u.erro) ? `O gerador da semana parou: ${u.erro}` : 'O gerador da semana terminou: os posts novos já estão no calendário');
        }
        return;
      }
    } catch { /* tenta de novo na próxima volta */ }
    vigiar();
  }, painelAberto() ? 5000 : 15000);
}
const painelAberto = () => Boolean(document.querySelector('#painel:not([hidden]) .sg'));

// ── Desenho ────────────────────────────────────────────────────────────────
function desenhar() {
  const seg = est.seg;
  const rel = relativo(seg);
  const p = abrirPainel(`
    <div class="painel-topo">
      <div class="dt-cabeca">
        <div class="dt-pills"><span class="pill pill-marca">${icone('lampada', 13)}Linha editorial</span></div>
        <h2>Sugestões da semana</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo sg">
      <nav class="sg-semana" aria-label="Semana">
        <button type="button" class="btn-icone" data-sg-semana="-7" aria-label="Semana anterior">${icone('chevron-esq', 18)}</button>
        <div class="sg-semana-rot" aria-live="polite">
          <strong>${esc(rotuloSemana(seg))}</strong>
          ${rel ? `<span>${esc(rel)}</span>` : ''}
        </div>
        <button type="button" class="btn-icone" data-sg-semana="7" aria-label="Próxima semana">${icone('chevron-dir', 18)}</button>
        ${rel === 'Próxima semana' ? '' : `<button type="button" class="btn btn-sm btn-fantasma" data-sg-proxima>Ir pra próxima</button>`}
      </nav>
      <section class="sg-sec" data-sg-parte="gerador" aria-labelledby="sg-t-gerador">${geradorHtml()}</section>
      <section class="sg-sec" data-sg-parte="temas" aria-labelledby="sg-t-temas">${temasHtml()}</section>
      <section class="sg-sec" data-sg-parte="mecanismo" aria-labelledby="sg-t-mec">${mecanismoHtml()}</section>
    </div>`, { largo: true });
  if (!p) return;
  p.querySelectorAll('[data-sg-semana]').forEach((b) => (b.onclick = () => {
    est.seg = somarDias(est.seg, Number(b.dataset.sgSemana));
    carregarTudo();
    p.querySelector(`[data-sg-semana="${b.dataset.sgSemana}"]`)?.focus({ preventScroll: true });
  }));
  const prox = p.querySelector('[data-sg-proxima]');
  if (prox) prox.onclick = () => { est.seg = somarDias(segundaDe(hojeBrasilia()), 7); carregarTudo(); p.querySelector('[data-sg-semana="7"]')?.focus({ preventScroll: true }); };
  ligar(p);
}

// redesenha uma parte só (as três chegam em tempos diferentes)
function pintar(parte) {
  const sec = document.querySelector(`#painel .sg [data-sg-parte="${parte}"]`);
  if (!sec) return;
  // não apaga um "Pôr no dia" que a pessoa está preenchendo
  if (parte === 'temas' && sec.querySelector('.sg-por:not([hidden])') && est.sugestoes) return;
  // o foco que estava num botão desta parte volta pro mesmo botão desenhado de novo
  const ativo = sec.contains(document.activeElement) ? document.activeElement : null;
  const attr = ativo ? ['data-sg-gerar', 'data-sg-pesquisar', 'data-sg-por', 'data-sg-abrir', 'data-sg-item'].find((a) => ativo.hasAttribute(a)) : null;
  const sel = attr ? `[${attr}="${CSS.escape(ativo.getAttribute(attr))}"]` : '';
  sec.innerHTML = { gerador: geradorHtml, temas: temasHtml, mecanismo: mecanismoHtml }[parte]();
  ligar(sec);
  if (sel) sec.querySelector(sel)?.focus({ preventScroll: true });
}

const carregandoHtml = (n = 2, alto = 56) => `<div class="sg-esq" aria-hidden="true">${`<span class="fx-esq" style="height:${alto}px"></span>`.repeat(n)}</div><span class="sr-only" role="status">Carregando</span>`;
const erroHtml = (e, oque) => `<p class="sg-erro">${icone('alerta', 15)}<span>Não deu pra ler ${esc(oque)}: ${esc(e?.message ?? 'erro')}</span></p>`;

// ── Gerador ──
// o que a execução anotou (gerador-semana.mjs: criadas, enviadas e comProblema são números; erros, a lista)
function contagem(u) {
  const n = (v) => (Array.isArray(v) ? v.length : Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : null);
  const criadas = n(u.criadas);
  if (criadas == null) return '';
  if (!criadas) return 'A semana já estava completa: nada novo.';
  const enviadas = n(u.enviadas);
  const problema = n(u.comProblema);
  return [
    `Criou ${plural(criadas, 'ideia', 'ideias')} (posts e dias de stories)`,
    enviadas ? `${enviadas} ${enviadas === 1 ? 'foi' : 'foram'} pra aprovação dos gerentes` : '',
    problema ? `${plural(problema, 'ficou', 'ficaram')} com problema pra revisar` : '',
  ].filter(Boolean).join(', ') + '.';
}
function geradorHtml() {
  const e = est.estado;
  const titulo = `<div class="bloco-titulo" id="sg-t-gerador">Gerador da semana</div>`;
  if (!e && !est.erroEstado) return `${titulo}${carregandoHtml(1, 64)}`;
  if (est.erroEstado && !e) return `${titulo}${erroHtml(est.erroEstado, 'o gerador')}`;
  const u = e.ultimaGeracao;
  const ult = u && typeof u === 'object' ? u : u ? { em: u } : null;
  const prox = e.proximaGeracao && typeof e.proximaGeracao === 'object' ? e.proximaGeracao : e.proximaGeracao ? { em: e.proximaGeracao } : null;
  const emUlt = ult ? ult.em ?? ult.quando ?? ult.geradoEm ?? ult.fim ?? ult.inicio : '';
  const emProx = prox ? prox.em ?? prox.quando : '';
  const linhas = [];
  const r = e.rodando && typeof e.rodando === 'object' ? e.rodando : null;
  if (e.rodando) linhas.push(`<p class="sg-ger-linha sg-ger-rodando" role="status"><span class="dt-spinner" aria-hidden="true"></span><span><b>Gerando agora${ehIso(r?.semana) ? ` a semana de ${esc(rotuloSemana(segundaDe(r.semana)))}` : ''}${tem(r?.etapa) ? ` (${esc(r.etapa)})` : ''}.</b> Os posts entram no calendário e vão pra aprovação dos gerentes.</span></p>`);
  if (ult) {
    const semana = ehIso(ult.semana) ? `, semana de ${rotuloSemana(segundaDe(ult.semana))}` : '';
    const resumo = tem(ult.erro) ? '' : tem(ult.resumo) ? ult.resumo : tem(ult.mensagem) ? ult.mensagem : contagem(ult);
    const erros = Array.isArray(ult.erros) ? ult.erros.filter(tem) : [];
    linhas.push(`<p class="sg-ger-linha">${icone(ult.erro ? 'alerta' : 'check', 15)}<span><b>Última:</b> ${esc(quando(emUlt) || 'sem data')}${esc(semana)}${tem(ult.autor) ? `, por ${esc(ult.autor)}` : ''}.${resumo ? ` ${esc(resumo)}` : ''}${tem(ult.erro) ? ` <span class="sg-ger-erro">Não gerou: ${esc(ult.erro)}</span>` : ''}</span></p>`);
    if (erros.length) linhas.push(`<details class="sg-ger-avisos"><summary>${esc(plural(erros.length, 'aviso', 'avisos'))} da geração</summary><ul>${erros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>`);
  } else linhas.push(`<p class="sg-ger-linha">${icone('info', 15)}<span>O gerador ainda não rodou.</span></p>`);
  if (emProx) {
    // a segunda que roda gera a semana seguinte a ela
    const diaProx = ehIso(emProx) ? emProx : new Date(emProx).toLocaleDateString('sv-SE', fusoBR);
    const alvo = ehIso(prox.semana) ? segundaDe(prox.semana) : ehIso(diaProx) ? somarDias(segundaDe(diaProx), 7) : '';
    const semana = alvo ? ` (semana de ${rotuloSemana(alvo)})` : '';
    linhas.push(`<p class="sg-ger-linha">${icone('relogio', 15)}<span><b>Próxima:</b> ${esc(quando(emProx))}${esc(semana)}.</span></p>`);
  }
  return `
    ${titulo}
    <div class="sg-ger">
      <div class="sg-ger-texto">${linhas.join('')}
        ${est.erroGerar ? `<p class="sg-ger-linha sg-ger-erro" role="alert">${icone('alerta', 15)}<span>${esc(est.erroGerar)}</span></p>` : ''}
        <p class="sg-ger-nota">Toda segunda às 06:00 ele prepara a semana seguinte pela estratégia e pelo mecanismo. O que já está na semana fica: ele só completa o volume. Pra trocar a ideia de um dia, use "Regerar ideia" no painel da peça.</p>
      </div>
      ${podeGerar() ? `<button type="button" class="btn btn-sm${e.rodando ? '' : ' btn-primario'}" data-sg-gerar ${e.rodando || est.gerando ? 'aria-disabled="true"' : ''}${est.gerando ? ' aria-busy="true"' : ''}>${est.gerando ? '<span class="dt-spinner" aria-hidden="true"></span> Gerando' : `${icone('gerar', 15)}Gerar a semana agora`}</button>` : ''}
    </div>`;
}

// ── Temas do Google ──
function usoDe(t) {
  const u = t.usadoEm;
  if (!u) return null;
  if (typeof u === 'object') return { data: u.data ?? '', id: u.pecaId ?? u.reelId ?? u.id ?? '', storiesId: u.storiesId ?? '', por: u.por ?? '' };
  return { data: ehIso(u) ? u : '', id: '', em: ehIso(u) ? '' : u };
}
function diasDaSemana(seg) {
  const hoje = hojeBrasilia();
  return Array.from({ length: 7 }, (_, i) => {
    const iso = somarDias(seg, i);
    const n = (store.E?.reels ?? []).filter((r) => r.data === iso).length;
    const sto = (store.E?.stories ?? []).some((x) => x.data === iso);
    return { iso, n, sto, passado: iso < hoje };
  });
}
// " (1 peça, stories, já passou)": o que o dia já tem, pra escolher sem abrir o calendário
const infoDia = (d) => {
  const partes = [d.n ? (d.n === 1 ? '1 peça' : `${d.n} peças`) : '', d.sto ? 'stories' : '', d.passado ? 'já passou' : ''].filter(Boolean);
  return partes.length ? ` (${partes.join(', ')})` : '';
};
function temaHtml(t, i) {
  const uso = usoDe(t);
  const pl = pilarInfo(t.pilar);
  const pc = pecaInfo(t.peca);
  const evid = (t.evidencias ?? []).filter((x) => tem(x?.texto));
  const pecaUsada = uso?.id ? (store.E?.reels ?? []).find((r) => r.id === uso.id) : null;
  const storiesUsados = uso?.storiesId ? (store.E?.stories ?? []).find((x) => x.id === uso.storiesId) : null;
  const dias = diasDaSemana(est.seg);
  // o primeiro dia livre: sem peça (ou, pra tema de stories, sem stories, que é um por dia)
  const ocupado = (d) => (t.peca === 'stories' ? d.sto : d.n > 0);
  const livre = dias.find((d) => !d.passado && !ocupado(d)) ?? dias.find((d) => !d.passado) ?? dias[0];
  const opcoesPeca = PECAS.filter((p) => PECAS_FEED.includes(p.id) || (p.id === 'stories' && t.peca === 'stories'));
  const pecaPadrao = opcoesPeca.some((p) => p.id === t.peca) ? t.peca : 'reel';
  const idT = `sg-tema-${i}`;
  return `
    <li class="sg-tema" data-usado="${Boolean(uso)}">
      <div class="sg-tema-tags">${t.bloco ? pillBloco(t.bloco, { tam: 12 }) : ''}${pl ? `<span class="sg-tag">Pilar ${esc(`${pl.id} · ${pl.nome}`)}</span>` : ''}${pc ? `<span class="sg-tag">${icone(pc.icone, 12)}${esc(pc.nome)}</span>` : ''}</div>
      <h4 class="sg-tema-titulo" id="${idT}">${esc(t.tema ?? '')}</h4>
      ${tem(t.porque) ? `<p class="sg-tema-porque">${esc(t.porque)}</p>` : ''}
      ${evid.length ? `<ul class="sg-evid" aria-label="Evidências">${evid.map((x) => {
        const link = linkSeguro(x.link);
        const rot = ROTULO_EVID[x.tipo] ?? 'Evidência';
        return `<li><span class="sg-evid-tipo">${icone(x.tipo === 'google-noticias' ? 'livro' : 'busca', 12)}${esc(rot)}</span>${link
          ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(x.texto)}<span class="hn-externo" aria-hidden="true">${icone('externo', 12)}</span><span class="sr-only"> (abre em outra aba)</span></a>`
          : `<span>${esc(x.texto)}</span>`}</li>`;
      }).join('')}</ul>` : ''}
      ${tem(t.comoUsar) ? `<p class="sg-tema-como"><b>Como usar:</b> ${esc(t.comoUsar)}</p>` : ''}
      <div class="sg-tema-pe">
        ${uso
          ? `<span class="sg-usado" tabindex="-1">${icone('check', 14)}${uso.data ? `No dia ${esc(`${diaDaSemana(uso.data)}, ${ddmm(uso.data)}`)}` : 'Já foi pro calendário'}</span>${pecaUsada ? `<button type="button" class="btn btn-sm btn-fantasma" data-sg-abrir="${esc(pecaUsada.id)}">Abrir a peça ${icone('seta', 14)}</button>` : storiesUsados ? `<button type="button" class="btn btn-sm btn-fantasma" data-sg-item="${esc(storiesUsados.id)}" data-sg-item-tipo="stories">Abrir os stories ${icone('seta', 14)}</button>` : ''}`
          : `<button type="button" class="btn btn-sm" data-sg-por="${i}" aria-expanded="false" aria-controls="sg-por-${i}">${icone('calendario', 14)}Pôr no dia</button>`}
      </div>
      ${uso ? '' : `
      <form class="sg-por" id="sg-por-${i}" data-sg-form="${i}" hidden aria-label="Pôr no dia: ${esc(t.tema ?? '')}">
        <label class="rotulo">Dia<select class="campo" name="data">${dias.map((d) => `<option value="${d.iso}" ${d.iso === livre.iso ? 'selected' : ''}>${esc(`${diaDaSemana(d.iso)}, ${ddmm(d.iso)}`)}${esc(infoDia(d))}</option>`).join('')}</select></label>
        <label class="rotulo">Peça<select class="campo" name="peca">${opcoesPeca.map((p) => `<option value="${p.id}" ${p.id === pecaPadrao ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>
        <div class="sg-por-acoes"><button type="submit" class="btn btn-sm btn-primario">Pôr como ideia</button><button type="button" class="btn btn-sm btn-fantasma" data-sg-por-cancelar="${i}">Cancelar</button></div>
      </form>`}
    </li>`;
}
// ── A pesquisa crua (sem os temas) ──
// 21/10 (Pedro): sem IA no servidor, a pesquisa grava só o que veio do Google (pesquisa-temas.mjs): as buscas do
// autocompletar { semente, sugestoes } e as manchetes do Google Notícias { titulo, fonte, link, publicadoEm }. O
// painel mostra isso no lugar dos temas, com o aviso de que os temas prontos voltam quando a IA for ligada
// a mensagem que o servidor grava quando falta a chave do Claude (server/noticias.mjs, MSG_SEM_IA)
const MSG_SEM_IA = 'Falta ligar a IA neste servidor: a chave do Claude.';
const MANCHETES_VISIVEIS = 10;
const textoSug = (s) => String((s && typeof s === 'object' ? s.texto ?? s.sugestao ?? '' : s) ?? '').trim();
function buscasDe(d) {
  return (Array.isArray(d?.buscas) ? d.buscas : [])
    .map((b) => ({ busca: String(b?.semente ?? b?.busca ?? '').trim(), sugestoes: (Array.isArray(b?.sugestoes) ? b.sugestoes : []).map(textoSug).filter(Boolean) }))
    .filter((b) => b.sugestoes.length);
}
const manchetesDe = (d) => (Array.isArray(d?.manchetes) ? d.manchetes : []).filter((m) => tem(m?.titulo));
const temCru = (d) => buscasDe(d).length > 0 || manchetesDe(d).length > 0;
// "ter, 20/10" no dia de Brasília
function diaCurto(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  const dia = d.toLocaleDateString('sv-SE', fusoBR);
  return `${diaDaSemana(dia)}, ${ddmm(dia)}`;
}
function mancheteHtml(m) {
  const link = linkSeguro(m.link);
  const titulo = esc(String(m.titulo).trim());
  const meta = [tem(m.fonte) ? String(m.fonte).trim() : '', diaCurto(m.publicadoEm)].filter(Boolean).join(' · ');
  return `
        <li>${link
          ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${titulo}<span class="hn-externo" aria-hidden="true">${icone('externo', 12)}</span><span class="sr-only"> (abre em outra aba)</span></a>`
          : `<span>${titulo}</span>`}${meta ? `<small>${esc(meta)}</small>` : ''}</li>`;
}
function pesquisaCruaHtml(d, pesquisando) {
  const buscas = buscasDe(d);
  const manchetes = manchetesDe(d);
  const erro = String(d?.erro ?? '').trim();
  const semChave = erro.includes(MSG_SEM_IA);
  // sem a chave, o aviso já diz o que o erro do servidor diz: não sai duas vezes
  const aviso = semChave
    ? `<p class="sg-aviso" role="note">${icone('info', 15)}<span>Sem IA neste servidor: aqui está o que a pesquisa trouxe do Google, sem os temas prontos. Os temas prontos voltam quando a IA for ligada.</span></p>`
    : `${erro ? `<p class="sg-erro">${icone('alerta', 15)}<span>${esc(erro)}</span></p>` : ''}<p class="sg-intro">O que a pesquisa trouxe do Google, sem os temas prontos. Eles voltam na próxima pesquisa com a IA.</p>`;
  const rodando = pesquisando ? `<p class="sg-aviso" role="status"><span class="dt-spinner" aria-hidden="true"></span><span>A pesquisa está rodando de novo: a lista troca quando ela terminar.</span></p>` : '';
  const vistas = manchetes.slice(0, MANCHETES_VISIVEIS);
  const resto = manchetes.slice(MANCHETES_VISIVEIS);
  return `
    ${aviso}${rodando}
    <div class="sg-crua">
      ${buscas.length ? `
      <section class="sg-crua-parte" aria-labelledby="sg-t-buscas">
        <h4 class="sg-crua-tit" id="sg-t-buscas">${icone('busca', 14)}O que estão buscando no Google<small>${esc(`autocompletar, ${plural(buscas.length, 'busca', 'buscas')}`)}</small></h4>
        <ul class="sg-buscas">${buscas.map((b) => `
          <li>
            <span class="sg-busca-semente">${esc(b.busca || 'Busca')}</span>
            <ul class="sg-sugs" aria-label="${esc(`O que aparece pra "${b.busca || 'a busca'}"`)}">${b.sugestoes.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          </li>`).join('')}
        </ul>
      </section>` : ''}
      ${manchetes.length ? `
      <section class="sg-crua-parte" aria-labelledby="sg-t-manchetes">
        <h4 class="sg-crua-tit" id="sg-t-manchetes">${icone('livro', 14)}Manchetes do Google Notícias<small>${esc(`últimos 7 dias, ${plural(manchetes.length, 'manchete', 'manchetes')}`)}</small></h4>
        <ol class="sg-manchetes">${vistas.map(mancheteHtml).join('')}</ol>
        ${resto.length ? `<details class="sg-mais"><summary>Ver mais ${esc(plural(resto.length, 'manchete', 'manchetes'))}</summary><ol class="sg-manchetes" start="${MANCHETES_VISIVEIS + 1}">${resto.map(mancheteHtml).join('')}</ol></details>` : ''}
      </section>` : ''}
    </div>`;
}

function temasHtml() {
  const d = est.sugestoes;
  const pesquisando = est.pesquisando || Boolean(d?.rodando);
  const botao = podeGerar() ? `<button type="button" class="btn btn-sm btn-fantasma" data-sg-pesquisar ${pesquisando ? 'aria-disabled="true" aria-busy="true"' : ''}>${pesquisando ? '<span class="dt-spinner" aria-hidden="true"></span> Pesquisando' : `${icone('busca', 14)}Pesquisar agora`}</button>` : '';
  const titulo = `<div class="bloco-titulo" id="sg-t-temas">Temas da pesquisa no Google${d?.geradoEm ? `<span class="dt-contador">${esc(`Pesquisa de ${quando(d.geradoEm)}`)}</span>` : ''}${botao}</div>`;
  if (!d && !est.erroSug) return `${titulo}${carregandoHtml(3, 120)}`;
  if (est.erroSug && !d) return `${titulo}${erroHtml(est.erroSug, 'as sugestões')}`;
  const temas = (d.temas ?? []).filter((t) => tem(t?.tema));
  // 21/10 (Pedro): sem os temas (sem IA), o que a pesquisa trouxe do Google aparece cru: as buscas e as manchetes
  if (!temas.length && temCru(d)) return `${titulo}${pesquisaCruaHtml(d, pesquisando)}`;
  if (!temas.length) {
    return `${titulo}
      <div class="sg-vazio">
        <span class="sg-vazio-ico">${icone('busca', 18)}</span>
        <div><strong>${tem(d.erro) ? 'A pesquisa desta semana não trouxe tema' : 'Ainda sem temas pra esta semana'}</strong><p>${esc(pesquisando ? 'A pesquisa está rodando. Os temas aparecem aqui quando ela terminar.' : tem(d.erro) ? d.erro : 'Os temas chegam toda segunda às 06:00, junto com a geração da semana seguinte.')}</p></div>
      </div>`;
  }
  return `${titulo}
    ${tem(d.erro) ? `<p class="sg-erro">${icone('alerta', 15)}<span>${esc(d.erro)}</span></p>` : ''}
    <p class="sg-intro">${esc(plural(temas.length, 'tema contábil', 'temas contábeis'))} que estão sendo buscados agora. "Pôr no dia" cria a peça como Ideia no calendário, pra você personalizar e mover.</p>
    <ol class="sg-temas">${temas.map(temaHtml).join('')}</ol>`;
}

// ── Mecanismo da semana ──
function mecanismoHtml() {
  const m = est.mec;
  const titulo = `<div class="bloco-titulo" id="sg-t-mec">Mecanismo da semana</div>`;
  if (!m && !est.erroMec) return `${titulo}${carregandoHtml(2, 72)}`;
  if (!m) return `${titulo}${erroHtml(est.erroMec, 'o mecanismo')}`;
  const v = m.volume ?? {};
  const alvo = { ...ALVO, ...(typeof v.alvo === 'object' && v.alvo ? v.alvo : {}) };
  const vol = [['reels', 'Reels'], ['feeds', 'Feeds'], ['storiesTemas', 'Temas de stories']].map(([k, nome]) => {
    const n = Number(v[k]) || 0;
    const a = Number(alvo[k]) || 0;
    const ok = a ? n === a : true;
    const falta = n < a ? `${a - n === 1 ? 'falta' : 'faltam'} ${a - n}` : n > a ? `${n - a} a mais` : '';
    return `<div class="sg-vol" data-ok="${ok}"><b>${n}<small>/${a}</small></b><span>${esc(nome)}</span>${falta ? `<em>${esc(falta)}</em>` : ''}</div>`;
  }).join('');
  const mix = m.mix && typeof m.mix === 'object' ? m.mix : {};
  // a régua vai até 60% (ou mais, quando um bloco passa disso): as barras se comparam entre si
  const escala = Math.max(60, ...Object.values(mix).map((x) => (pct(x?.pct, 100) ?? 0) + 5));
  const linhasMix = BLOCOS_ESTRATEGIA.map((b) => {
    const x = mix[b.id] ?? mix[b.nome] ?? null;
    if (!x) return '';
    const fatia = pct(x.fatia ?? b.fatia);
    const p = pct(x.pct, fatia) ?? 0;
    const larg = (n) => `${Math.max(0, Math.min(100, (n / escala) * 100))}%`;
    const ok = x.ok !== false;
    return `
      <li class="sg-mix-linha" data-ok="${ok}">
        <span class="sg-mix-nome">${esc(b.longo)}</span>
        <span class="sg-mix-barra" aria-hidden="true">
          <i class="sg-mix-faixa" style="left:${larg(Math.max(0, fatia - 10))};width:${larg(20)}"></i>
          <i class="sg-mix-valor" style="width:${larg(p)}"></i>
          <i class="sg-mix-alvo" style="left:${larg(fatia)}"></i>
        </span>
        <span class="sg-mix-num"><b>${p}%</b> <small>${esc(`${x.n ?? 0} ${Number(x.n) === 1 ? 'peça' : 'peças'} · alvo ${fatia}%`)}</small>${ok ? '' : `<span class="sr-only">, fora da faixa</span>`}</span>
      </li>`;
  }).join('');
  const o = m.oferta;
  const ofertaHtml = o ? (() => {
    const teto = pct(o.teto);
    const p = pct(o.pct, teto) ?? 0;
    const ok = o.ok !== false;
    return `<p class="sg-linha-ok" data-ok="${ok}">${icone(ok ? 'check' : 'alerta', 15)}<span><b>Oferta (pilar 10):</b> ${esc(`${plural(Number(o.n) || 0, 'peça', 'peças')}, ${p}% da pauta. Teto de ${teto}%.`)}</span></p>`;
  })() : '';
  const cont = Array.isArray(m.continuidade) ? m.continuidade.filter((c) => tem(c?.texto)) : [];
  // os alertas de cada peça (com o link pra ela). Volume, mix, oferta e continuidade já estão acima: não repetem aqui.
  // Servidor sem a lista de itens: a lista de alertas que ele manda, inteira
  const itens = Array.isArray(m.itens) ? m.itens : null;
  const porPeca = itens ? itens.map((i) => ({ i, al: (m.pecas?.[i.id] ?? []).filter((x) => x?.nivel === 'alerta' && tem(x.texto)) })).filter((x) => x.al.length) : [];
  const alertas = itens ? [] : Array.isArray(m.alertas) ? m.alertas.filter(tem) : [];
  const nomePeca = (i) => (i.tipo === 'stories' ? 'Stories' : pecaInfo(i.peca)?.nome ?? 'Post');
  return `
    ${titulo}
    <div class="sg-mec">
      <div class="sg-vols" role="group" aria-label="Volume da semana contra o travado">${vol}</div>
      ${linhasMix ? `<div class="sg-mec-bloco"><p class="sg-mec-rot">Mix dos blocos <small>(a faixa é o alvo, 10 pontos pra cada lado)</small></p><ul class="sg-mix">${linhasMix}</ul></div>` : ''}
      ${ofertaHtml || cont.length ? `<div class="sg-mec-bloco">${ofertaHtml}${cont.map((c) => `<p class="sg-linha-ok" data-ok="${c.ok !== false}">${icone(c.ok !== false ? 'check' : 'alerta', 15)}<span>${esc(c.texto)}</span></p>`).join('')}</div>` : ''}
      ${porPeca.length ? `<div class="sg-mec-bloco"><p class="sg-mec-rot">Alertas nas peças <small>(${esc(plural(porPeca.length, 'peça', 'peças'))})</small></p><ul class="sg-pecas-al">${porPeca.map(({ i, al }) => `
        <li>
          <button type="button" class="sg-peca-al" data-sg-item="${esc(i.id)}" data-sg-item-tipo="${esc(i.tipo)}"><span class="sg-peca-al-dia">${esc(`${diaDaSemana(i.data)}, ${ddmm(i.data)}`)} · ${esc(nomePeca(i))}</span><b>${esc(i.titulo || 'Sem título')}</b></button>
          <ul>${al.map((x) => `<li>${icone('alerta', 14)}<span>${esc(x.texto)}</span></li>`).join('')}</ul>
        </li>`).join('')}</ul></div>`
        : alertas.length ? `<div class="sg-mec-bloco"><p class="sg-mec-rot">Alertas</p><ul class="sg-alertas">${alertas.map((a) => `<li>${icone('alerta', 15)}<span>${esc(a)}</span></li>`).join('')}</ul></div>`
          : `<p class="sg-linha-ok" data-ok="true">${icone('check', 15)}<span>Nenhuma peça repetida nem com convite fora do lugar.</span></p>`}
    </div>`;
}

// ── Ações ──────────────────────────────────────────────────────────────────
function ligar(raiz) {
  const gerar = raiz.querySelector('[data-sg-gerar]');
  if (gerar) gerar.onclick = async () => {
    if (est.gerando || est.estado?.rodando) return;
    const seg = est.seg;
    if (!confirm(`Gerar a semana de ${rotuloSemana(seg)} agora? O que já está na semana fica: o gerador só completa o volume (3 reels, 5 feeds e 5 temas de stories) e manda os posts pra aprovação dos gerentes.`)) return;
    est.gerando = true;
    const comFoco = document.activeElement === gerar;
    pintar('gerador');
    if (comFoco) document.querySelector('#painel [data-sg-gerar]')?.focus({ preventScroll: true });
    try {
      const r = await api('POST', '/api/semana/gerar', { semana: seg });
      est.erroGerar = r?.erro ?? '';
      // 200: o resumo da geração (mensagem); 202: passou de 25 s e segue no servidor (o painel acompanha)
      if (r?.erro) toast(r.erro);
      else toast(r?.rodando ? 'O gerador segue rodando: os posts entram no calendário quando ele terminar' : r?.mensagem || 'Semana gerada');
      if (r?.estado && typeof r.estado === 'object') est.estado = r.estado;
      // 202 sem o estado: o vigia precisa saber que está rodando
      if (r?.rodando && !est.estado?.rodando) est.estado = { ...(est.estado ?? {}), rodando: true };
    } catch (e) {
      est.erroGerar = e.message;
      toast(e.message);
    } finally {
      est.gerando = false;
      invalidarMecanismo();
      await recarregar().catch(() => {});
      // painel aberto: relê tudo (e o vigia volta a correr); fechado no meio da espera: só o vigia segue
      if (seg === est.seg && painelAberto()) carregarTudo({ redesenhar: false });
      else vigiar();
    }
  };
  const pesquisar = raiz.querySelector('[data-sg-pesquisar]');
  if (pesquisar) pesquisar.onclick = async () => {
    if (est.pesquisando || est.sugestoes?.rodando) return;
    const seg = est.seg;
    est.pesquisando = true;
    pintar('temas');
    try {
      const r = await api('POST', '/api/semana/sugestoes/atualizar', { semana: seg });
      if (seg === est.seg && r && typeof r === 'object' && Array.isArray(r.temas)) est.sugestoes = r;
      toast(r?.rodando ? 'A pesquisa segue no servidor: os temas aparecem quando ela terminar' : r?.erro || 'Pesquisa feita');
    } catch (e) {
      toast(e.message);
    } finally {
      est.pesquisando = false;
      // relê do servidor (a resposta pode ser só o resumo da rodada)
      if (seg === est.seg) { pintar('temas'); carregarSugestoes(seg); }
    }
  };
  raiz.querySelectorAll('[data-sg-abrir]').forEach((b) => (b.onclick = () => abrirDetalhe(b.dataset.sgAbrir)));
  raiz.querySelectorAll('[data-sg-item]').forEach((b) => (b.onclick = () => (b.dataset.sgItemTipo === 'stories' ? abrirStories(b.dataset.sgItem) : abrirDetalhe(b.dataset.sgItem))));
  raiz.querySelectorAll('[data-sg-por]').forEach((b) => (b.onclick = () => {
    const form = raiz.querySelector(`[data-sg-form="${b.dataset.sgPor}"]`);
    if (!form) return;
    const abrir = form.hidden;
    form.hidden = !abrir;
    b.setAttribute('aria-expanded', String(abrir));
    if (abrir) form.data.focus();
  }));
  raiz.querySelectorAll('[data-sg-por-cancelar]').forEach((b) => (b.onclick = () => {
    const i = b.dataset.sgPorCancelar;
    const form = raiz.querySelector(`[data-sg-form="${i}"]`);
    if (form) form.hidden = true;
    const abre = raiz.querySelector(`[data-sg-por="${i}"]`);
    abre?.setAttribute('aria-expanded', 'false');
    abre?.focus();
  }));
  raiz.querySelectorAll('[data-sg-form]').forEach((form) => (form.onsubmit = async (e) => {
    e.preventDefault();
    const temas = (est.sugestoes?.temas ?? []).filter((t) => tem(t?.tema));
    const t = temas[Number(form.dataset.sgForm)];
    if (!t) return;
    const data = form.data.value;
    const peca = form.peca.value;
    const botao = form.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const nova = await api('POST', '/api/semana/sugestoes/usar', { semana: est.seg, temaId: t.id, data, peca });
      // 21/10 (Pedro): o mesmo formato que o servidor anota (marcarUsado): tema de stories vira o dia de stories
      // (storiesId), o resto vira peça (pecaId). Assim o "Abrir os stories" aparece na hora
      t.usadoEm = peca === 'stories' ? { data, peca, storiesId: nova?.id ?? '' } : { data, peca, pecaId: nova?.id ?? '' };
      form.hidden = true;
      invalidarMecanismo();
      await recarregar().catch(() => {});
      pintar('temas');
      carregarMec(est.seg, true);
      toast(`Entrou como Ideia em ${diaDaSemana(data)}, ${ddmm(data)}`);
      // o foco fica no tema que acabou de ir pro calendário
      const li = document.querySelectorAll('#painel .sg-tema')[Number(form.dataset.sgForm)];
      (li?.querySelector('[data-sg-abrir], [data-sg-item]') ?? li?.querySelector('.sg-usado'))?.focus({ preventScroll: true });
    } catch (err) {
      botao.disabled = false;
      toast(err.message);
    }
  }));
}
