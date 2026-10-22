// Rotas do motor de conteúdo (21/10/2026, Pedro: P4 mecanismo, P5 gerador da semana e sugestões do Google, P6 notícias
// do dia no Início). Despachadas pelo server.mjs (api) pros recursos 'mecanismo', 'semana' e 'noticias':
//   GET  /api/mecanismo?semana=AAAA-MM-DD          análise da semana (mecanismo.mjs), com as 12 peças da 1ª campanha
//   GET  /api/noticias                             as notícias do dia (data/noticias.json) e se está rodando
//   POST /api/noticias/atualizar                   busca agora (Admin e Gerente)
//   GET  /api/semana/sugestoes?semana=AAAA-MM-DD   as sugestões do Google da semana: { temas, buscas [{ busca,
//                                                  sugestoes }], manchetes [{ titulo, link, fonte, data, publicadoEm }],
//                                                  erro, geradoEm, rodando } (21/10: buscas e manchetes também sem IA)
//   POST /api/semana/sugestoes/usar                { semana, temaId, data, peca }: a sugestão vira peça ('ideia') no dia
//   POST /api/semana/sugestoes/atualizar           { semana }: pesquisa agora (Admin e Gerente)
//   POST /api/semana/gerar                         { semana }: o gerador da semana (Admin e Gerente)
//   GET  /api/semana/estado                        { ultimaGeracao, proximaGeracao, rodando }
//   POST /api/semana/regerar                       { id } ou { storiesId }, com { instrucao? } ou { voltar: true }
// Decisões:
//  - o perfil é conferido aqui também (não só no auth.podeApi): o Diretor contábil não chega em nada disto; gerar,
//    atualizar as notícias e a pesquisa são do Admin e do Gerente; o resto, do time (Admin, Gerente, Operador)
//  - o que leva minutos (notícias, pesquisa, gerador) espera até 25 s; depois responde 202 { rodando: true } e segue
//    rodando (o GET acompanha). O regerar espera até o fim (uma ou duas respostas da IA)
//  - os módulos pesados (gerador, notícias, pesquisa, agenda) entram por import() na hora: defeito num deles derruba
//    só a rota dele
//  - a sugestão usada vira peça com status 'ideia' (ou o tema de stories do dia, se o dia não tem), com a evidência
//    do Google nas notas, e a sugestão anota onde foi parar (usadoEm)
import { carregar, salvar, falha, agora, novoId, blocoDoPilar, tipoDoPilar, dataValida, PECAS } from './db.mjs';
import { conferirReel, conferirStoriesDia, roteiroLimpo, pecaVazia } from './validar.mjs';
import { analisarSemana, semanaDe, pecasDaCampanha } from './mecanismo.mjs';
import { CAMPANHA_PADRAO } from './migrar.mjs';
import * as auth from './auth.mjs';

const ESPERA_MS = 25_000;
const GESTAO = ['admin', 'gerente'];
const dm = (iso) => `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}`;
const curto = (s, n) => (String(s ?? '').length > n ? `${String(s).slice(0, n - 3).trimEnd()}...` : String(s ?? ''));

function semanaDoPedido(v, obrigatoria = true) {
  if (v == null || v === '') {
    if (obrigatoria) throw falha(400, 'Diga a semana (AAAA-MM-DD, qualquer dia dela).');
    return null;
  }
  const s = typeof v === 'string' && dataValida(v) ? semanaDe(v) : null;
  if (!s) throw falha(400, 'A semana precisa ser uma data AAAA-MM-DD que existe.');
  return s;
}

// espera a promessa até 25 s; depois disso devolve null (segue rodando)
async function esperar(promessa, ms = ESPERA_MS) {
  let relogio;
  const limite = new Promise((ok) => {
    relogio = setTimeout(() => ok(null), ms);
    relogio.unref?.();
  });
  promessa.catch(() => {}); // a falha depois do 202 não vira rejeição solta
  try {
    return await Promise.race([promessa.then((r) => ({ r })), limite]);
  } finally {
    clearTimeout(relogio);
  }
}

// a sugestão do Google vira peça (ou o tema de stories do dia)
async function usarSugestao(b, autor) {
  const sem = semanaDoPedido(b.semana);
  if (typeof b.temaId !== 'string' || !b.temaId) throw falha(400, 'Escolha uma das sugestões (temaId).');
  if (!dataValida(b.data)) throw falha(400, 'data precisa ser um dia que existe, no formato AAAA-MM-DD.');
  if (!PECAS.includes(b.peca)) throw falha(400, `peca precisa ser ${PECAS.join(', ')}.`);
  const pesquisa = await import('./pesquisa-temas.mjs');
  const t = await pesquisa.acharTema(sem.inicio, b.temaId);
  if (t.usadoEm) throw falha(409, `Essa sugestão já virou peça em ${dm(t.usadoEm.data)}.`);
  const db = await carregar();
  const evidencias = (t.evidencias ?? []).map((e) => `- ${e.tipo === 'google-busca' ? 'busca no Google' : 'Google Notícias'}: ${e.texto}${e.link ? ` (${e.link})` : ''}`).join('\n');
  const notas = curto([`Sugestão da pesquisa no Google da semana de ${dm(sem.inicio)} (usada por ${autor ?? 'alguém do time'}).`, `Como usar: ${t.comoUsar}`, evidencias ? `Evidências:\n${evidencias}` : ''].filter(Boolean).join('\n\n'), 2000);
  if (b.peca === 'stories') {
    db.stories ??= [];
    if (db.stories.some((s) => s.data === b.data)) throw falha(409, `Já existem stories em ${dm(b.data)}. Um dia tem um só.`);
    const dia = conferirStoriesDia(db, {
      data: b.data, objetivo: t.bloco === 'Conversão' ? 'vendas' : 'engajamento', pilar: t.pilar, bloco: t.bloco, tema: curto(t.tema, 300), pecaDoDia: null,
      quadros: [], cta: '', fontes: [], notas, pilarTexto: '', motivo: curto(t.porque, 1000),
    });
    const novo = { id: novoId('sto'), ...dia, status: 'ideia', origem: 'sugestao-google', criadoEm: agora(), criadoPor: autor };
    db.stories.push(novo);
    await salvar();
    await pesquisa.marcarUsado(sem.inicio, t.id, { data: b.data, peca: 'stories', storiesId: novo.id, por: autor });
    return novo;
  }
  const campos = conferirReel({
    data: b.data, peca: b.peca, peca2: null, pilar: t.pilar, bloco: blocoDoPilar(t.pilar), tipo: tipoDoPilar(t.pilar), ideia: curto(t.tema, 300),
    tema: '', motivo: curto(t.porque, 1000), notas, rede: 'Instagram', formatoId: null,
    campanhaId: (db.campanhas ?? []).some((c) => c.id === 'cmp_prelancamento') && b.data <= '2026-12-31' ? 'cmp_prelancamento' : CAMPANHA_PADRAO,
  });
  const peca = {
    id: novoId('reel'), criadoEm: agora(), criadoPor: autor, origem: 'sugestao-google', roteiro: roteiroLimpo(null), ...pecaVazia(), legenda: '',
    gravacao: null, fontes: [], permalink: '', metricas: null, ideiaId: null, favorito: false, ...campos, status: 'ideia',
  };
  db.reels.push(peca);
  await salvar();
  await pesquisa.marcarUsado(sem.inicio, t.id, { data: b.data, peca: b.peca, pecaId: peca.id, por: autor });
  return peca;
}

async function estadoSemana() {
  const ger = await import('./gerador-semana.mjs');
  const [hist, ag] = await Promise.all([ger.historico(), import('./agenda.mjs').then((a) => a.estadoConteudo()).catch(() => null)]);
  const ultima = hist.at(-1) ?? null;
  return {
    ultimaGeracao: ultima,
    proximaGeracao: ag?.proximas?.semana ?? null,
    rodando: ger.estadoGerador(),
    agenda: ag ? { ligada: ag.ligada, ultimas: ag.ultimas, erros: ag.erros } : null,
  };
}

export async function rota(req, res, partes, sess, { json, corpoJson, url }) {
  const [recurso, acao, extra] = partes;
  const m = req.method;
  const papel = auth.papelDe(sess?.usuario);
  const autor = sess?.usuario?.nome ?? null;
  if (!sess?.usuario) return json(res, 401, { erro: 'Entre com seu usuário e senha pra continuar.' });
  if (papel === 'diretor') return json(res, 403, { erro: 'O seu perfil vê só as Aprovações técnicas.', perfil: papel });
  const soGestao = () => {
    if (!GESTAO.includes(papel)) throw falha(403, 'Só o Admin e o Gerente de Marketing rodam isso.');
  };
  const metodo = (esperado) => {
    if (m !== esperado) throw falha(405, 'Método não permitido.');
  };

  // ---------- mecanismo ----------
  if (recurso === 'mecanismo') {
    if (partes.length !== 1) return json(res, 404, { erro: 'Rota não existe.' });
    metodo('GET');
    const sem = semanaDoPedido(url?.searchParams.get('semana'), false) ?? semanaDe(new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
    return json(res, 200, analisarSemana(await carregar(), sem.inicio, { campanha: await pecasDaCampanha() }));
  }

  // ---------- notícias ----------
  if (recurso === 'noticias') {
    const noticias = await import('./noticias.mjs');
    if (partes.length === 1) {
      metodo('GET');
      return json(res, 200, await noticias.ler());
    }
    if (acao === 'atualizar' && partes.length === 2) {
      metodo('POST');
      soGestao();
      const agenda = await import('./agenda.mjs');
      const rodada = noticias.atualizar().then(
        async (r) => { await agenda.anotarConteudo('noticias', { ok: true }).catch(() => {}); return r; },
        async (e) => { await agenda.anotarConteudo('noticias', { ok: false, erro: e?.message }).catch(() => {}); throw e; },
      );
      const fim = await esperar(rodada).catch(() => ({ falhou: true }));
      // a falha já ficou gravada no arquivo (com as notícias sem IA): a tela lê o arquivo
      if (fim) return json(res, 200, await noticias.ler());
      return json(res, 202, { ...(await noticias.ler()), rodando: true });
    }
    return json(res, 404, { erro: 'Rota não existe.' });
  }

  // ---------- semana ----------
  if (recurso === 'semana') {
    if (acao === 'sugestoes' && !extra && partes.length === 2) {
      metodo('GET');
      const sem = semanaDoPedido(url?.searchParams.get('semana'));
      return json(res, 200, await (await import('./pesquisa-temas.mjs')).ler(sem.inicio));
    }
    if (acao === 'sugestoes' && extra === 'usar' && partes.length === 3) {
      metodo('POST');
      return json(res, 201, await usarSugestao(await corpoJson(req, 20_000), autor));
    }
    if (acao === 'sugestoes' && extra === 'atualizar' && partes.length === 3) {
      metodo('POST');
      soGestao();
      const sem = semanaDoPedido((await corpoJson(req, 10_000)).semana);
      const pesquisa = await import('./pesquisa-temas.mjs');
      const db = await carregar();
      const ger = await import('./gerador-semana.mjs');
      const contexto = ger.faltasDaSemana(db, sem.inicio).analise.itens.map((i) => `- ${i.data} · ${i.peca} · ${i.bloco ?? ''} · ${i.titulo}`).join('\n');
      const rodada = pesquisa.pesquisar(sem.inicio, { contexto });
      const fim = await esperar(rodada);
      // 21/10 (Pedro): a resposta tem a mesma forma do GET (buscas e manchetes com os nomes da tela)
      if (fim) return json(res, 200, await pesquisa.ler(sem.inicio));
      return json(res, 202, { ...(await pesquisa.ler(sem.inicio)), rodando: true });
    }
    if (acao === 'gerar' && partes.length === 2) {
      metodo('POST');
      soGestao();
      const b = await corpoJson(req, 10_000);
      const sem = semanaDoPedido(b.semana);
      const ger = await import('./gerador-semana.mjs');
      const rodada = ger.gerarSemana({ inicio: sem.inicio, autor });
      const fim = await esperar(rodada);
      if (fim) return json(res, 200, fim.r);
      return json(res, 202, { rodando: true, estado: await estadoSemana() });
    }
    if (acao === 'estado' && partes.length === 2) {
      metodo('GET');
      return json(res, 200, await estadoSemana());
    }
    if (acao === 'regerar' && partes.length === 2) {
      metodo('POST');
      const b = await corpoJson(req, 20_000);
      const id = typeof b.id === 'string' && b.id ? b.id : null;
      const storiesId = typeof b.storiesId === 'string' && b.storiesId ? b.storiesId : null;
      if (Boolean(id) === Boolean(storiesId)) throw falha(400, 'Mande o id da peça (id) ou dos stories do dia (storiesId), um dos dois.');
      if (b.voltar != null && typeof b.voltar !== 'boolean') throw falha(400, 'voltar precisa ser verdadeiro ou falso.');
      const ger = await import('./gerador-semana.mjs');
      return json(res, 200, await ger.regerar({ id, storiesId, instrucao: b.instrucao ?? '', voltar: b.voltar === true, autor: autor ?? 'alguém do time' }));
    }
    return json(res, 404, { erro: 'Rota não existe.' });
  }

  return json(res, 404, { erro: 'Rota não existe.' });
}
