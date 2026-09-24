// Início: saudação, próximo passo, 3 atalhos grandes e as
// listas curtas de próximos reels e ideias favoritas. Sem estado próprio.
import { esc, store, icone, fmtData, formato, navegar, DIAS, TIPOS, tipoReel, nomeTema } from '../core.js';
import * as chat from '../chat.js';
import { objeto3d } from '../efeitos.js';

const hojeISO = () => new Date().toLocaleDateString('sv-SE');
const plural = (n, um, varios) => (n === 1 ? um : varios);

function criar(opts) {
  if (typeof chat.abrirCriar === 'function') chat.abrirCriar(opts);
  else navegar('#/criar');
}

function proximosReels(E) {
  const hoje = hojeISO();
  return (E.reels ?? [])
    .filter((r) => r.data && r.data >= hoje && r.status !== 'publicado')
    .sort((a, b) => a.data.localeCompare(b.data));
}

// passo do card de plano: atrasado mais antigo > próximo com data > sem data > nada aberto
function passoPlano(E) {
  const hoje = hojeISO();
  const abertos = (E.reels ?? []).filter((r) => r.status !== 'publicado');
  const datados = abertos.filter((r) => r.data).sort((a, b) => a.data.localeCompare(b.data));
  const atrasado = datados.find((r) => r.data < hoje);
  if (atrasado) return { tipo: 'atrasado', r: atrasado };
  const prox = datados.find((r) => r.data >= hoje);
  if (prox) return { tipo: 'proximo', r: prox };
  const semData = abertos.filter((r) => !r.data).length;
  if (semData) return { tipo: 'semData', n: semData };
  return null;
}

function dataHoje() {
  const s = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s[0].toUpperCase() + s.slice(1);
}

function descFormato(r) {
  const f = formato(r.formatoId);
  const tipo = tipoReel(r.tipo)?.nome;
  const fmt = f ? `Adaptado de ${f.codigo} · ${f.categoria}` : (r.formatoTexto ?? '').split(',')[0].trim() || 'Formato livre';
  return tipo ? `${tipo} · ${fmt}` : fmt;
}

function planoHtml(passo, noMes, meta) {
  const metaHtml = `<span class="home-plano-meta"><b>${noMes}</b>/${meta} no mês</span>`;
  const card = (texto, botao) => `
    <section class="card home-plano" aria-label="Próximo passo">
      <span class="home-plano-ico">${icone('calendario', 20)}</span>
      <div class="home-plano-texto">
        <small>Próximo passo</small>
        <strong>${texto}</strong>
      </div>
      ${metaHtml}
      ${botao}
    </section>`;
  // botão (não link) pro #/criar: abre o painel sem empilhar entrada no histórico
  const criarBtn = (rot) => `<button type="button" class="btn btn-primario" data-home="criar">${rot} ${icone('seta', 16)}</button>`;
  if (!passo) {
    return noMes
      ? card('Tudo publicado por aqui', criarBtn('Criar o próximo'))
      : card('Seu mês está vazio', criarBtn('Planejar agora'));
  }
  if (passo.tipo === 'semData') {
    return card(esc(`${passo.n} ${plural(passo.n, 'reel sem data', 'reels sem data')}`),
      `<a class="btn" href="#/cronograma">Dar uma data ${icone('seta', 16)}</a>`);
  }
  const r = passo.r;
  const rot = passo.tipo === 'atrasado'
    ? '<span class="pill pill-alerta home-plano-atraso">Atrasado</span>'
    : '<span class="home-plano-rot">Próximo:</span>';
  return card(`${rot} ${esc(r.ideia)} <span class="home-plano-data">· ${esc(fmtData(r.data, { diaSemana: true }))}${tipoReel(r.tipo) ? ` · ${esc(tipoReel(r.tipo).nome)}` : ''}</span>`,
    `<a class="btn" href="#/reel/${encodeURIComponent(r.id)}">Abrir ${icone('seta', 16)}</a>`);
}

function cardsHtml(E) {
  const ideias = E.ideias ?? [];
  const estilos = TIPOS.filter((t) => !t.secundario);
  const nTemas = new Set(ideias.map((i) => i.tema).filter(Boolean)).size;
  const validados = (E.formatos ?? []).filter((f) => f.status === 'validado').length;
  return `
    <div class="home-cards">
      <button type="button" class="hc hc-criar" data-home="criar">
        <span class="hc-anel" aria-hidden="true"></span>
        <span class="hc-topo"><span class="hc-ico">${icone('raio', 22)}</span></span>
        <span class="hc-corpo">
          <span class="hc-titulo">Criar do zero</span>
          <span class="hc-sub">Gerar reel com a skill</span>
        </span>
        <span class="hc-rodape">
          <span class="hc-chip">Reel em poucos cliques</span>
          <span class="hc-seta">${icone('seta', 18)}</span>
        </span>
      </button>

      <a class="hc hc-ideias card-link" href="#/ideias">
        <span class="hc-topo">
          <span class="hc-rotulo">Banco de ideias</span>
          <span class="hc-ico">${icone('lampada', 20)}</span>
        </span>
        <span class="hc-numero"><b>${ideias.length}</b><span>${plural(ideias.length, 'ideia', 'ideias')}</span></span>
        <span class="hc-rodape">
          <span class="hc-desc">${nTemas > 1 ? `${nTemas} temas do nicho em 3 estilos` : 'Temas do nicho em 3 estilos'}</span>
          <span class="hc-tags">${estilos.map((t) => `<span class="pill hc-tag" data-tipo="${t.id}">${icone(t.icone, 12)}${esc(t.nome)} · ${ideias.filter((i) => i.tipo === t.id).length}</span>`).join('')}</span>
        </span>
      </a>

      <a class="hc hc-biblioteca card-link" href="#/biblioteca">
        <span class="hc-topo">
          <span class="hc-rotulo">Reels</span>
          <span class="hc-barras" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        </span>
        <span class="hc-numero"><b>${validados}</b><span>${plural(validados, 'validado', 'validados')}</span></span>
        <span class="hc-rodape">
          <span class="hc-desc">formatos prontos pra adaptar</span>
          <span class="hc-seta">${icone('seta', 18)}</span>
        </span>
      </a>
    </div>`;
}

function linhaReel(r) {
  const d = new Date(r.data + 'T12:00');
  return `
    <a class="card card-link home-linha" href="#/reel/${encodeURIComponent(r.id)}">
      <span class="home-dia"><b>${d.getDate()}</b><small>${DIAS[d.getDay()]}</small></span>
      <span class="home-linha-texto">
        <strong>${esc(r.ideia)}</strong>
        <small>${esc(descFormato(r))}</small>
      </span>
      <span class="pill st-${esc(r.status)}">${esc(r.status)}</span>
      <span class="home-linha-seta">${icone('chevron-dir', 18)}</span>
    </a>`;
}

function linhaIdeia(i) {
  const f = formato(i.formatoId);
  const meta = [tipoReel(i.tipo)?.nome ?? 'Reel', i.tema ? nomeTema(i.tema, { curto: true }) : '', f ? `${f.codigo} · ${f.categoria}` : ''].filter(Boolean).join(' · ');
  const acao = i.reelId
    ? `<a class="btn btn-sm" href="#/reel/${encodeURIComponent(i.reelId)}">Ver reel</a>`
    : `<button type="button" class="btn btn-sm" data-criar-ideia="${esc(i.id)}">Criar reel</button>`;
  return `
    <div class="card card-link home-linha">
      <span class="home-ideia-ico">${icone('lampada', 18)}</span>
      <span class="home-linha-texto">
        <a class="home-linha-link" href="#/ideias?abrir=${encodeURIComponent(i.id)}"><strong>${esc(i.titulo)}</strong></a>
        <small>${esc(meta)}</small>
      </span>
      <span class="home-fav" title="Favorita">${icone('estrela-cheia', 16)}</span>
      ${acao}
    </div>`;
}

function vazioHtml(ico, titulo, texto, botao) {
  return `
    <div class="home-vazio">
      <span class="home-vazio-ico">${icone(ico, 18)}</span>
      <span class="home-linha-texto"><strong>${titulo}</strong><small>${texto}</small></span>
      ${botao}
    </div>`;
}

export function render(root) {
  const E = store.E;
  // quem está logado é quem a home cumprimenta; sem login (servidor antigo), o nome da config
  const nome = (store.usuario?.nome?.trim().split(/\s+/)[0] || E.config?.nomeUsuario || 'Pedro').trim();
  const proximos = proximosReels(E);
  const favoritas = (E.ideias ?? []).filter((i) => i.favorita).slice(0, 3);
  const km = hojeISO().slice(0, 7);
  const noMes = (E.reels ?? []).filter((r) => r.data?.startsWith(km)).length;
  const meta = Number(E.config?.metaMensal) || 12;

  root.innerHTML = `
    <div class="home">
      <header class="home-topo">
        <div class="home-topo-texto">
          <p class="home-data">${esc(dataHoje())}</p>
          <h1 class="home-saudacao">Bora criar,<br><span>${esc(nome)}.</span></h1>
          <p class="home-sub">Por onde você quer começar hoje?</p>
        </div>
        ${objeto3d('growth', { classe: 'home-objeto', tam: 236 })}
      </header>

      ${planoHtml(passoPlano(E), noMes, meta)}
      ${cardsHtml(E)}

      <div class="home-listas">
        <section class="home-secao" aria-labelledby="home-prox">
          <div class="home-secao-topo">
            <h2 id="home-prox">Próximos no cronograma</h2>
            <a class="btn btn-fantasma btn-sm" href="#/cronograma">Ver cronograma ${icone('seta', 14)}</a>
          </div>
          <div class="home-linhas">
            ${proximos.length
              ? proximos.slice(0, 3).map(linhaReel).join('')
              : vazioHtml('calendario', 'Nada agendado daqui pra frente', 'Crie um reel e dê uma data pra ele aparecer aqui.', '<button type="button" class="btn btn-sm" data-home="criar">Criar reel</button>')}
          </div>
        </section>

        <section class="home-secao" aria-labelledby="home-fav">
          <div class="home-secao-topo">
            <h2 id="home-fav">Ideias favoritas</h2>
            <a class="btn btn-fantasma btn-sm" href="#/ideias">Banco de ideias ${icone('seta', 14)}</a>
          </div>
          <div class="home-linhas">
            ${favoritas.length
              ? favoritas.map(linhaIdeia).join('')
              : vazioHtml('estrela', 'Nenhuma ideia favorita ainda', 'Toque na estrela de uma ideia no banco pra guardar aqui.', '<a class="btn btn-sm" href="#/ideias">Ver ideias</a>')}
          </div>
        </section>
      </div>
    </div>`;

  root.querySelectorAll('[data-home="criar"]').forEach((b) => (b.onclick = () => criar()));
  root.querySelectorAll('[data-criar-ideia]').forEach((b) => {
    b.onclick = () => {
      const i = (E.ideias ?? []).find((x) => x.id === b.dataset.criarIdeia);
      criar({ ideiaId: i?.id ?? '', formatoId: i?.formatoId ?? '' });
    };
  });
}
