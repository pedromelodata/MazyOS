// Conta e usuários: menu do rodapé da sidebar ("Minha conta", "Usuários", "Sair").
// Todo mundo tem o mesmo acesso. Gente nova entra só por link único (POST /api/convites) e senha
// esquecida volta por link de redefinição (POST /api/usuarios/:id/redefinir). O link aparece uma
// vez só, fica só na memória deste módulo e nunca vai pro localStorage nem pro console.
import { $, $$, esc, store, api, icone, toast, abrirPainel, BTN_FECHAR, fmtData } from './core.js';

const MIN_SENHA = 10;

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const t = document.createElement('textarea');
    t.value = texto;
    t.setAttribute('readonly', '');
    t.className = 'sr-only';
    document.body.append(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    t.remove();
    return ok;
  }
}

const inicial = (nome) => esc((String(nome ?? '').trim()[0] ?? '?').toUpperCase());
const primeiroNome = (nome) => String(nome ?? '').trim().split(/\s+/)[0] ?? '';
const listaDe = (j, chave) => (Array.isArray(j) ? j : Array.isArray(j?.[chave]) ? j[chave] : []);

function acessoRelativo(iso) {
  if (!iso) return 'Ainda não entrou';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Ainda não entrou';
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 2) return 'Entrou agora há pouco';
  if (min < 60) return `Entrou há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Entrou há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return 'Entrou ontem';
  if (dias < 30) return `Entrou há ${dias} dias`;
  return `Entrou em ${fmtData(d, { ano: true })}`;
}

// "vence em 2 dias" / "vence hoje às 14:30" / "venceu"
function venceEm(iso) {
  const d = new Date(iso);
  const ms = d.getTime() - Date.now();
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'venceu';
  if (ms < 3_600_000) return `vence em ${Math.max(1, Math.round(ms / 60_000))} min`;
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const h = new Date();
  const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86_400_000);
  if (dias <= 0) return `vence hoje às ${hora}`;
  if (dias === 1) return `vence amanhã às ${hora}`;
  return `vence em ${dias} dias`;
}

const quando = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${fmtData(d)} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

// ── Regras da senha, ao vivo (mesmas da tela de entrada) ────────────────
// o estado também vai em texto, pro leitor de tela
const ESTADO = '<span class="sr-only" data-estado>Falta: </span>';
function regrasHtml(comAtual) {
  return `
    <ul class="ct-regras" id="ct-regras-lista">
      <li data-regra="tamanho">${ESTADO}Pelo menos ${MIN_SENHA} caracteres</li>
      <li data-regra="login">${ESTADO}Diferente do usuário</li>
      ${comAtual ? `<li data-regra="atual">${ESTADO}Diferente da senha atual</li>` : ''}
      <li data-regra="iguais">${ESTADO}As duas senhas batem</li>
    </ul>`;
}

function conferirRegras(box, { senha, conf, login, atual }, marcarFalta = false) {
  const r = {
    tamanho: senha.length >= MIN_SENHA,
    login: !!senha && senha.trim().toLowerCase() !== String(login ?? '').toLowerCase(),
    atual: !!senha && !!atual && senha !== atual,
    iguais: !!conf && senha === conf,
  };
  let tudo = true;
  for (const li of $$('.ct-regras li', box)) {
    const ok = r[li.dataset.regra];
    tudo = tudo && ok;
    li.classList.toggle('ok', ok);
    li.classList.toggle('falta', marcarFalta && !ok);
    const e = $('[data-estado]', li);
    if (e) e.textContent = ok ? 'Cumprida: ' : 'Falta: ';
  }
  return tudo;
}

function olhoHtml(alvo) {
  return `<button type="button" class="ct-olho" data-olho="${alvo}" aria-label="Mostrar senha" aria-pressed="false">${icone('olho', 18)}</button>`;
}

function ligarOlhos(box) {
  for (const b of $$('[data-olho]', box)) {
    b.onclick = () => {
      const c = document.getElementById(b.dataset.olho);
      const ver = c.type === 'password';
      for (const alvo of $$(`[data-par="${b.dataset.olho}"]`, box).concat(c)) alvo.type = ver ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(ver));
      b.setAttribute('aria-label', ver ? 'Esconder senha' : 'Mostrar senha');
      b.innerHTML = icone(ver ? 'olho-fechado' : 'olho', 18);
      c.focus();
    };
  }
}

function avisoHtml(texto, tipo = 'erro') {
  const ico = tipo === 'ok' ? 'check' : tipo === 'info' ? 'equipe' : 'alerta';
  return `<div class="ct-aviso ${tipo}" role="${tipo === 'erro' ? 'alert' : 'status'}">${icone(ico, 16)}<span>${esc(texto)}</span></div>`;
}

// ── Sair ────────────────────────────────────────────────────────────────
export async function sair() {
  try { await api('POST', '/api/auth/sair', undefined, { semRedirecionar: true }); } catch {}
  location.href = '/entrar';
}

// ── Minha conta ─────────────────────────────────────────────────────────
export function abrirMinhaConta() {
  const u = store.usuario;
  if (!u) return toast('Não achei a sua conta. Recarregue a página.');
  const p = abrirPainel(`
    <div class="painel-topo">
      <div>
        <h2>Minha conta</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo">
      <div class="ct-perfil card">
        <span class="avatar ct-avatar-g" aria-hidden="true">${inicial(u.nome)}</span>
        <div class="ct-perfil-texto">
          <strong>${esc(u.nome)}</strong>
          <span>@${esc(u.usuario)}</span>
        </div>
        <span class="pill">Acesso completo</span>
      </div>

      <section class="bloco">
        <div class="bloco-titulo">Trocar a senha</div>
        <form class="ct-form card" id="ct-senha" novalidate autocomplete="on">
          <div class="ct-aviso-slot"></div>
          <input class="sr-only" type="text" name="username" autocomplete="username" value="${esc(u.usuario)}" tabindex="-1" aria-hidden="true" readonly />
          <label class="rotulo">Senha atual
            <input class="campo" id="ct-atual" name="current-password" type="password" autocomplete="current-password" maxlength="200" required />
          </label>
          <div class="ct-duas">
            <label class="rotulo"><span id="ct-nova-rot">Nova senha</span>
              <span class="ct-senha">
                <input class="campo" id="ct-nova" name="new-password" type="password" autocomplete="new-password" maxlength="200" required aria-labelledby="ct-nova-rot" aria-describedby="ct-regras-lista" />
                ${olhoHtml('ct-nova')}
              </span>
            </label>
            <label class="rotulo">Confirmar nova senha
              <input class="campo" id="ct-conf" data-par="ct-nova" name="confirm-password" type="password" autocomplete="new-password" maxlength="200" required />
            </label>
          </div>
          ${regrasHtml(true)}
          <p class="ct-nota">Ao salvar, a sua conta sai dos outros aparelhos. Este aqui continua conectado.</p>
          <div class="ct-acoes">
            <button class="btn btn-primario" type="submit">${icone('chave', 16)}Salvar nova senha</button>
          </div>
        </form>
      </section>
    </div>
    <div class="painel-rodape">
      <button class="btn" type="button" data-conta="usuarios">${icone('equipe', 16)}Usuários</button>
      <span class="espaco"></span>
      <button class="btn btn-fantasma" type="button" data-conta="sair">${icone('sair', 16)}Sair da conta</button>
    </div>`);

  const f = $('#ct-senha', p);
  const valores = () => ({ senha: $('#ct-nova', f).value, conf: $('#ct-conf', f).value, login: u.usuario, atual: $('#ct-atual', f).value });
  ligarOlhos(f);
  f.oninput = () => conferirRegras(f, valores(), $$('.ct-regras li.falta', f).length > 0);
  conferirRegras(f, valores());
  $('[data-conta="sair"]', p).onclick = sair;
  $('[data-conta="usuarios"]', p).onclick = () => abrirUsuarios();
  setTimeout(() => $('#ct-atual', f)?.focus({ preventScroll: true }), 60);

  f.onsubmit = async (e) => {
    e.preventDefault();
    const slot = $('.ct-aviso-slot', f);
    const v = valores();
    if (!v.atual) { slot.innerHTML = avisoHtml('Escreva a sua senha atual.'); return $('#ct-atual', f).focus(); }
    if (!conferirRegras(f, v, true)) { slot.innerHTML = avisoHtml('A nova senha ainda não cumpre as regras.'); return $('#ct-nova', f).focus(); }
    const b = $('button[type="submit"]', f);
    b.disabled = true;
    slot.innerHTML = '';
    try {
      await api('POST', '/api/auth/senha', { atual: v.atual, nova: v.senha }, { semRedirecionar: true });
      for (const c of $$('input.campo', f)) c.value = '';
      conferirRegras(f, valores());
      slot.innerHTML = avisoHtml('Senha trocada. Os outros aparelhos vão pedir a senha nova.', 'ok');
      toast('Senha trocada');
    } catch (err) {
      // 401 aqui pode ser a sessão que caiu, não a senha: confere antes de mostrar
      if (err.status === 401) {
        const est = await api('GET', '/api/auth/estado').catch(() => null);
        if (est && !est.logado) { location.href = '/entrar'; return; }
      }
      slot.innerHTML = avisoHtml(err.message);
      $('#ct-atual', f).focus();
    } finally {
      b.disabled = false;
    }
  };
}

// ── Usuários ────────────────────────────────────────────────────────────
// revelado = o link recém-gerado { tipo, nome, link, expiraEm }; some ao esconder ou fechar o painel
const us = { lista: null, convites: null, erroLista: null, erroConvites: null, revelado: null, reveladoNovo: false, removendo: null, gerando: false, anima: true };

export function abrirUsuarios() {
  Object.assign(us, { erroLista: null, erroConvites: null, revelado: null, reveladoNovo: false, removendo: null, gerando: false, anima: true });
  abrirPainel(`
    <div class="painel-topo">
      <div>
        <h2>Usuários</h2>
      </div>
      ${BTN_FECHAR}
    </div>
    <div class="painel-corpo us-corpo" id="us-corpo"></div>`);
  desenharUsuarios();
  carregarUsuarios();
}
// nome antigo do painel (menu da sidebar)
export const abrirEquipe = abrirUsuarios;

async function carregarUsuarios() {
  const [l, c] = await Promise.allSettled([api('GET', '/api/usuarios'), api('GET', '/api/convites')]);
  if (l.status === 'fulfilled') { us.lista = listaDe(l.value, 'usuarios'); us.erroLista = null; }
  else us.erroLista = l.reason?.message || 'Erro ao carregar';
  if (c.status === 'fulfilled') { us.convites = listaDe(c.value, 'convites'); us.erroConvites = null; }
  else us.erroConvites = c.reason?.message || 'Erro ao carregar';
  desenharUsuarios();
}

const corpoUsuarios = () => document.getElementById('us-corpo');

function esqueletoLinhas(n) {
  return `<div class="us-esq" aria-hidden="true">${'<div class="us-esq-linha"><span class="us-esq-av"></span><span class="us-esq-tx"><i></i><i></i></span></div>'.repeat(n)}</div>`;
}

// link recém-gerado: aparece uma vez, com copiar
function reveladoHtml() {
  const r = us.revelado;
  if (!r) return '';
  const nome = primeiroNome(r.nome);
  const titulo = r.tipo === 'redefinir'
    ? `Link de redefinição${nome ? ` pra ${esc(nome)}` : ''} pronto`
    : `Link de acesso${nome ? ` pra ${esc(nome)}` : ''} pronto`;
  const venc = r.expiraEm ? ` Vence ${esc(quando(r.expiraEm))}.` : '';
  let local = false;
  try { local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(r.link).hostname); } catch {}
  return `
    <div class="us-revelado card${us.reveladoNovo ? ' novo' : ''}" role="status">
      <div class="us-revelado-topo">
        <span class="us-revelado-ico">${icone('check', 18)}</span>
        <div>
          <strong>${titulo}</strong>
          <p>Funciona uma vez só e vence em 72 horas.${venc} Mande por uma conversa privada: depois que você esconder este aviso, o link não aparece de novo.</p>
        </div>
      </div>
      <div class="us-link">
        <input class="campo" id="us-link" type="text" value="${esc(r.link)}" readonly spellcheck="false" aria-label="Link único" />
        <button class="btn btn-primario" type="button" data-us="copiar">${icone('copiar', 16)}Copiar link</button>
      </div>
      ${local ? `<p class="us-alerta">${icone('alerta', 15)}<span>Este link usa o endereço deste computador e só abre aqui. Pra mandar pra alguém de fora, o link público precisa estar configurado.</span></p>` : ''}
      <div class="ct-acoes">
        <button class="btn btn-sm" type="button" data-us="copiar-msg">${icone('copiar', 14)}Copiar com mensagem</button>
        <button class="btn btn-sm btn-fantasma" type="button" data-us="esconder">Já mandei, esconder</button>
      </div>
    </div>`;
}

function pessoaHtml(x, i, sou, unico) {
  const removendo = us.removendo === x.id;
  return `
    <li class="us-item card${removendo ? ' confirmando' : ''}" data-id="${esc(x.id)}" style="--i:${i}">
      <div class="us-linha">
        <span class="avatar" aria-hidden="true">${inicial(x.nome)}</span>
        <div class="us-texto">
          <strong>${esc(x.nome)}${sou ? ' <span class="pill pill-marca">você</span>' : ''}</strong>
          <small>@${esc(x.usuario)} · ${esc(acessoRelativo(x.ultimoAcesso))}</small>
        </div>
        <div class="us-acoes">
          ${sou
            ? `<button class="btn btn-sm" type="button" data-us="minha-conta">${icone('chave', 14)}Trocar minha senha</button>`
            : `<button class="btn btn-sm" type="button" data-us="redefinir" aria-label="Gerar link de redefinição pra ${esc(x.nome)}">${icone('chave', 14)}Gerar link de redefinição</button>`}
          <button class="btn btn-sm btn-fantasma btn-perigo" type="button" data-us="remover" aria-expanded="${removendo}" aria-label="${sou ? 'Remover a minha conta' : `Remover ${esc(x.nome)}`}" ${unico ? 'disabled title="Precisa sobrar pelo menos uma conta"' : ''}>${icone('lixo', 14)}Remover</button>
        </div>
      </div>
      ${removendo ? `
        <div class="us-confirma" role="group" aria-label="Confirmar remoção">
          <p>${sou
            ? 'Remover a sua própria conta? Você sai na hora e só volta com um link de acesso novo.'
            : `Remover <strong>${esc(x.nome)}</strong> (@${esc(x.usuario)})? A pessoa perde o acesso na hora e os links dela deixam de valer.`}</p>
          <div class="ct-acoes">
            <button class="btn btn-sm us-perigo" type="button" data-us="remover-sim">${icone('lixo', 14)}Remover</button>
            <button class="btn btn-sm btn-fantasma" type="button" data-us="remover-nao">Cancelar</button>
          </div>
        </div>` : ''}
    </li>`;
}

function conviteHtml(c, i) {
  const redefinir = c.tipo === 'redefinir';
  const dono = redefinir ? us.lista?.find((x) => x.id === c.usuarioId) : null;
  const nome = c.nomeSugerido || dono?.nome || '';
  const venc = venceEm(c.expiraEm);
  return `
    <li class="us-item us-convite card" data-convite="${esc(c.id)}" style="--i:${i}">
      <div class="us-linha">
        <span class="us-convite-ico" aria-hidden="true">${icone(redefinir ? 'chave' : 'link', 17)}</span>
        <div class="us-texto">
          <strong>${nome ? esc(nome) : '<span class="us-sem-nome">Sem nome</span>'}<span class="pill ${redefinir ? 'pill-alerta' : 'pill-marca'}">${redefinir ? 'Nova senha' : 'Primeiro acesso'}</span></strong>
          <small>${c.criadoPor ? `Criado por ${esc(c.criadoPor)}` : 'Criado pelo terminal'}${c.criadoEm ? ` em ${esc(quando(c.criadoEm))}` : ''}${venc ? ` · <span title="${esc(quando(c.expiraEm))}">${esc(venc)}</span>` : ''}</small>
        </div>
        <div class="us-acoes">
          <button class="btn btn-sm btn-fantasma btn-perigo" type="button" data-us="revogar" aria-label="Revogar o link${nome ? ` de ${esc(nome)}` : ''}">${icone('fechar', 14)}Revogar</button>
        </div>
      </div>
    </li>`;
}

function desenharUsuarios() {
  const corpo = corpoUsuarios();
  if (!corpo) return;
  const eu = store.usuario?.id;
  const lista = us.lista;
  const convites = us.convites;

  let pessoas;
  if (us.erroLista && !lista) {
    pessoas = `<div class="card vazio"><strong>Não consegui carregar os usuários</strong><p>${esc(us.erroLista)}</p><button class="btn" type="button" data-us="tentar">Tentar de novo</button></div>`;
  } else if (!lista) {
    pessoas = esqueletoLinhas(2);
  } else {
    const ordenada = [...lista].sort((a, b) => {
      const sa = a.id === eu || a.voce === true;
      const sb = b.id === eu || b.voce === true;
      return sa ? -1 : sb ? 1 : String(a.nome).localeCompare(String(b.nome), 'pt-BR');
    });
    pessoas = `<ul class="us-lista">${ordenada.map((x, i) => pessoaHtml(x, i, x.id === eu || x.voce === true, lista.length <= 1)).join('')}</ul>`;
  }

  const pendentes = (convites ?? []).filter((c) => !c.usadoEm && Date.parse(c.expiraEm) > Date.now());
  let links;
  if (us.erroConvites && !convites) {
    links = `<div class="card vazio us-vazio"><strong>Não consegui carregar os links</strong><p>${esc(us.erroConvites)}</p><button class="btn btn-sm" type="button" data-us="tentar">Tentar de novo</button></div>`;
  } else if (!convites) {
    links = esqueletoLinhas(1);
  } else if (!pendentes.length) {
    links = '<p class="us-nenhum">Nenhum link esperando uso.</p>';
  } else {
    links = `<ul class="us-lista">${pendentes.map((c, i) => conviteHtml(c, i)).join('')}</ul>`;
  }

  const n = lista?.length ?? 0;
  corpo.classList.toggle('us-anima', us.anima && !!lista);
  corpo.innerHTML = `
    ${reveladoHtml()}

    <form class="us-convidar card" data-us-form="convite" novalidate>
      <div class="us-convidar-texto">
        <strong>Convidar alguém</strong>
        <span>Gere um link único. A pessoa escolhe o próprio usuário e a senha no primeiro acesso.</span>
      </div>
      <div class="ct-aviso-slot"></div>
      <div class="us-convidar-linha">
        <label class="rotulo us-convidar-nome"><span>Nome da pessoa <span class="us-opcional">(opcional)</span></span>
          <input class="campo" id="us-nome" name="us-nome" type="text" autocomplete="off" maxlength="60" placeholder="Ex.: Ana Souza" />
        </label>
        <button class="btn btn-primario" type="submit" ${us.gerando ? 'disabled aria-busy="true"' : ''}>${icone('mais', 16)}Gerar link de acesso</button>
      </div>
    </form>

    <section class="us-secao">
      <div class="bloco-titulo">Pessoas${lista ? `<span class="us-contagem">${n}</span>` : ''}</div>
      ${pessoas}
    </section>

    <section class="us-secao">
      <div class="bloco-titulo">Links pendentes${convites ? `<span class="us-contagem">${pendentes.length}</span>` : ''}</div>
      ${links}
    </section>`;

  // a cascata de entrada roda só na primeira vez que a lista aparece
  if (lista && convites) us.anima = false;
  us.reveladoNovo = false;
  ligarUsuarios(corpo);
}

function ligarUsuarios(corpo) {
  for (const b of $$('[data-us]', corpo)) b.onclick = () => acaoUsuarios(b);
  const f = $('[data-us-form="convite"]', corpo);
  if (f) f.onsubmit = (e) => { e.preventDefault(); gerarConvite(f); };
  const campo = $('#us-link', corpo);
  if (campo) campo.onfocus = () => campo.select();
  if (us.removendo) $('[data-us="remover-nao"]', corpo)?.focus({ preventScroll: true });
}

function mostrarLink(r) {
  us.revelado = r;
  us.reveladoNovo = true;
  desenharUsuarios();
  const corpo = corpoUsuarios();
  corpo?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('[data-us="copiar"]', corpo)?.focus({ preventScroll: true });
}

async function gerarConvite(f) {
  if (us.gerando) return;
  const slot = $('.ct-aviso-slot', f);
  const nome = $('#us-nome', f).value.replace(/\s+/g, ' ').trim();
  if (nome.length > 60) { slot.innerHTML = avisoHtml('O nome pode ter no máximo 60 caracteres.'); return; }
  us.gerando = true;
  const b = $('button[type="submit"]', f);
  b.disabled = true;
  b.setAttribute('aria-busy', 'true');
  slot.innerHTML = '';
  try {
    const r = await api('POST', '/api/convites', nome ? { nome } : {});
    if (!r?.link) throw new Error('O servidor não devolveu o link. Tente de novo.');
    us.gerando = false;
    await carregarUsuarios();
    mostrarLink({ tipo: 'novo', nome, link: r.link, expiraEm: r.expiraEm });
  } catch (e) {
    us.gerando = false;
    b.disabled = false;
    b.removeAttribute('aria-busy');
    slot.innerHTML = avisoHtml(e.message);
  }
}

async function acaoUsuarios(b) {
  const acao = b.dataset.us;
  const item = b.closest('.us-item');
  const pessoa = item?.dataset.id ? us.lista?.find((x) => x.id === item.dataset.id) : null;
  const convite = item?.dataset.convite ? us.convites?.find((x) => x.id === item.dataset.convite) : null;

  if (acao === 'tentar') { us.erroLista = null; us.erroConvites = null; desenharUsuarios(); return carregarUsuarios(); }
  if (acao === 'minha-conta') return abrirMinhaConta();
  if (acao === 'esconder') { us.revelado = null; return desenharUsuarios(); }

  if (acao === 'copiar' || acao === 'copiar-msg') {
    const r = us.revelado;
    if (!r) return;
    const texto = acao === 'copiar' ? r.link : [
      r.tipo === 'redefinir'
        ? `Oi${primeiroNome(r.nome) ? `, ${primeiroNome(r.nome)}` : ''}! Este é o seu link pra criar uma senha nova na Gestão de Marketing do Legalizaí:`
        : `Oi${primeiroNome(r.nome) ? `, ${primeiroNome(r.nome)}` : ''}! Este é o seu link de acesso à Gestão de Marketing do Legalizaí:`,
      r.link,
      'Ele funciona uma vez só e vence em 72 horas.',
    ].join('\n');
    const ok = await copiar(texto);
    if (ok) {
      b.classList.add('copiado');
      const antes = b.innerHTML;
      b.innerHTML = `${icone('check', acao === 'copiar' ? 16 : 14)}Copiado`;
      setTimeout(() => { if (b.isConnected) { b.innerHTML = antes; b.classList.remove('copiado'); } }, 1800);
    }
    toast(ok ? 'Link copiado. Cole numa conversa privada com a pessoa.' : 'Não consegui copiar. Selecione o link e copie na mão.');
    if (!ok) $('#us-link')?.select();
    return;
  }

  if (acao === 'redefinir' && pessoa) {
    b.disabled = true;
    try {
      const r = await api('POST', `/api/usuarios/${encodeURIComponent(pessoa.id)}/redefinir`, {});
      if (!r?.link) throw new Error('O servidor não devolveu o link. Tente de novo.');
      await carregarUsuarios();
      mostrarLink({ tipo: 'redefinir', nome: pessoa.nome, link: r.link, expiraEm: r.expiraEm });
    } catch (e) {
      if (b.isConnected) b.disabled = false;
      toast(e.message);
    }
    return;
  }

  if (acao === 'remover' && pessoa) { us.removendo = us.removendo === pessoa.id ? null : pessoa.id; return desenharUsuarios(); }
  if (acao === 'remover-nao') {
    const id = us.removendo;
    us.removendo = null;
    desenharUsuarios();
    $(`.us-item[data-id="${CSS.escape(id ?? '')}"] [data-us="remover"]`, corpoUsuarios())?.focus({ preventScroll: true });
    return;
  }
  if (acao === 'remover-sim' && pessoa) {
    const sou = pessoa.id === store.usuario?.id || pessoa.voce === true;
    b.disabled = true;
    try {
      const r = await api('DELETE', `/api/usuarios/${encodeURIComponent(pessoa.id)}`);
      if (sou || r?.saiu) { location.href = '/entrar'; return; }
      us.removendo = null;
      toast(`${primeiroNome(pessoa.nome)} não tem mais acesso`);
      await carregarUsuarios();
    } catch (e) {
      if (b.isConnected) b.disabled = false;
      toast(e.message);
    }
    return;
  }

  if (acao === 'revogar' && convite) {
    b.disabled = true;
    try {
      await api('DELETE', `/api/convites/${encodeURIComponent(convite.id)}`);
      us.convites = us.convites.filter((x) => x.id !== convite.id);
      desenharUsuarios();
      toast('Link revogado. Ele não abre mais.');
      carregarUsuarios();
    } catch (e) {
      if (b.isConnected) b.disabled = false;
      toast(e.message);
    }
  }
}
