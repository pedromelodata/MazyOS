// Tela de entrada. Script comum (não módulo) carregado no <head>: tira o token do link de acesso
// da barra de endereço antes de qualquer coisa, aplica o tema antes do primeiro paint e o resto
// espera o DOM. É uma das poucas rotas sem sessão, então nada aqui usa innerHTML com dado que veio
// de fora, e senha e token nunca saem da memória desta página (nem console, nem storage).
(function () {
  const params = new URLSearchParams(location.search);

  // ── Link único (/entrar?convite=<token>): sai da barra na hora ──────────
  // o histórico, a aba recarregada e quem olhar a tela não veem mais o token
  let tokenConvite = params.has('convite') ? params.get('convite') ?? '' : null;
  if (tokenConvite !== null) {
    params.delete('convite');
    const resto = params.toString();
    try { history.replaceState(null, '', location.pathname + (resto ? '?' + resto : '') + location.hash); } catch {}
  }

  // ── Tema: ?tema= força (prints), senão o salvo, senão escuro ────────────
  function temaInicial() {
    const q = params.get('tema');
    if (q === 'claro' || q === 'light') return 'light';
    if (q === 'escuro' || q === 'dark') return 'dark';
    try { return localStorage.getItem('cronograma-tema') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  }
  document.documentElement.dataset.theme = temaInicial();

  const LOGIN_OK = /^[a-z0-9._-]{3,32}$/;
  const TOKEN_OK = /^[A-Za-z0-9_-]{16,256}$/;
  const MIN_SENHA = 10;
  const ICONE_ERRO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.8"/><path d="M12 7.8v5M12 16.2h.01"/></svg>';
  const ICONE_RELOGIO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.8"/><path d="M12 7.5V12l3 2"/></svg>';
  const ICONE_OK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  // só caminho relativo deste site: "/..." com uma barra só, nunca "//outro.site" nem "/\"
  function destino() {
    const v = params.get('volta');
    if (!v || v[0] !== '/' || v[1] === '/' || v[1] === '\\' || /[\u0000-\u001f\u007f\\]/.test(v)) return '/';
    try {
      const u = new URL(v, location.origin);
      if (u.origin !== location.origin) return '/';
      // o parser some com "/./" e "/../" ("/.//outro.site" vira "//outro.site"): vale o valor final
      const d = u.pathname + u.search + u.hash;
      if (d[0] !== '/' || d[1] === '/' || d[1] === '\\') return '/';
      if (new URL(d, location.origin).origin !== location.origin) return '/';
      if (/^\/(entrar|api\/)/.test(u.pathname)) return '/';
      return d;
    } catch { return '/'; }
  }
  const ir = () => location.replace(destino());

  async function pedir(metodo, url, corpo) {
    let r;
    try {
      r = await fetch(url, {
        method: metodo,
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: corpo !== undefined ? { 'content-type': 'application/json' } : {},
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      });
    } catch {
      return { ok: false, status: 0, j: { erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' } };
    }
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j, r };
  }

  function minutosDeEspera(j, r) {
    const n = Number(j?.minutos ?? j?.esperarMinutos ?? j?.minutosEspera);
    if (Number.isFinite(n) && n > 0) return Math.ceil(n);
    const s = Number(r?.headers?.get('retry-after'));
    return Number.isFinite(s) && s > 0 ? Math.ceil(s / 60) : null;
  }

  const primeiroNome = (nome) => String(nome ?? '').trim().split(/\s+/)[0] ?? '';
  const sugestaoLogin = (nome) => primeiroNome(nome)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 32);

  // " e vence amanhã às 14:30" (vazio se a data não serve)
  function venceTexto(iso) {
    const d = new Date(iso);
    const ms = d.getTime() - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return '';
    if (ms < 3_600_000) return ` e vence em ${Math.max(1, Math.round(ms / 60_000))} min`;
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const h = new Date();
    const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 86_400_000);
    if (dias <= 0) return ` e vence hoje às ${hora}`;
    if (dias === 1) return ` e vence amanhã às ${hora}`;
    return ` e vence em ${dias} dias`;
  }

  function pronto() {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    let estado = null;
    let usuarioLogado = null;
    let senhaDaEntrada = null; // a senha com que acabou de entrar: vira a "atual" da troca obrigatória
    let convite = null; // { tipo, nomeSugerido, expiraEm, usuario } do link validado

    // ── Vistas ────────────────────────────────────────────────────────────
    function mostrar(nome) {
      for (const v of $$('[data-vista]')) v.hidden = v.dataset.vista !== nome;
      const vista = $(`[data-vista="${nome}"]`);
      for (const a of $$('.aviso', vista)) limparAviso(a);
      const primeiro = $$('input:not([tabindex="-1"]), button.btn', vista).find((el) => !el.closest('[hidden]') && !el.value);
      (primeiro ?? $('input:not([tabindex="-1"])', vista))?.focus({ preventScroll: true });
    }

    function aviso(form, texto, tipo = 'erro', dasRegras = false) {
      const a = $('.aviso', form);
      a.className = 'aviso' + (tipo === 'erro' ? '' : ' ' + tipo);
      a.dataset.regras = dasRegras ? '1' : '';
      a.innerHTML = tipo === 'espera' ? ICONE_RELOGIO : tipo === 'ok' ? ICONE_OK : ICONE_ERRO;
      const s = document.createElement('span');
      s.textContent = texto;
      a.append(s);
      a.hidden = false;
    }
    function limparAviso(a) { a.hidden = true; a.textContent = ''; }

    function ocupado(form, sim, texto) {
      const b = $('.btn-primario', form);
      const t = $('.btn-texto', b);
      if (sim) { b.dataset.texto = t.textContent; t.textContent = texto; }
      else if (b.dataset.texto) t.textContent = b.dataset.texto;
      b.disabled = sim;
      b.setAttribute('aria-busy', sim ? 'true' : 'false');
      for (const el of $$('input', form)) el.readOnly = sim || el.tabIndex === -1;
    }

    function erroDo(res, padrao) {
      if (res.status === 429) {
        const min = minutosDeEspera(res.j, res.r);
        return { tipo: 'espera', texto: res.j.erro || (min ? `Muitas tentativas seguidas. Espere ${min} min e tente de novo.` : 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.') };
      }
      return { tipo: 'erro', texto: res.j.erro || padrao || `Não deu certo (erro ${res.status}). Tente de novo.` };
    }

    function falhaServidor(res) {
      $('#falha-texto').textContent = res.status
        ? (res.j.erro || `O servidor respondeu com erro ${res.status}.`)
        : 'O sistema pode estar desligado ou sem internet no escritório.';
      mostrar('falha');
    }

    // ── Início ────────────────────────────────────────────────────────────
    async function iniciar() {
      mostrar('carregando');
      if (tokenConvite !== null) return abrirConvite();
      const res = await pedir('GET', '/api/auth/estado');
      if (!res.ok) return falhaServidor(res);
      estado = res.j;
      if (estado.logado && estado.usuario) {
        usuarioLogado = estado.usuario;
        if (estado.usuario.trocarSenha) return abrirTroca({ obrigatoria: true });
        if (params.get('trocar') === '1') return abrirTroca({ obrigatoria: false });
        return ir();
      }
      if (estado.semUsuarios) return mostrar('semcontas');
      mostrar('entrar');
    }

    // ── Entrar ────────────────────────────────────────────────────────────
    const fEntrar = $('#form-entrar');
    fEntrar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cUsuario = $('#entrar-usuario');
      const cSenha = $('#entrar-senha');
      const usuario = cUsuario.value.trim().toLowerCase();
      const senha = cSenha.value;
      if (!usuario || !senha) {
        aviso(fEntrar, 'Preencha o usuário e a senha.');
        (usuario ? cSenha : cUsuario).focus();
        return;
      }
      limparAviso($('.aviso', fEntrar));
      ocupado(fEntrar, true, 'Entrando');
      const res = await pedir('POST', '/api/auth/entrar', { usuario, senha });
      if (!res.ok) {
        ocupado(fEntrar, false);
        const { tipo, texto } = erroDo(res, res.status === 401 ? 'Usuário ou senha incorretos.' : null);
        aviso(fEntrar, texto, tipo);
        cSenha.value = '';
        if (res.status === 429) return travarEntrar(minutosDeEspera(res.j, res.r) ?? 1);
        cSenha.focus();
        return;
      }
      let u = res.j?.usuario;
      if (!u || u.trocarSenha === undefined) u = (await pedir('GET', '/api/auth/estado')).j?.usuario ?? u;
      if (u?.trocarSenha) {
        usuarioLogado = u;
        senhaDaEntrada = senha;
        cSenha.value = '';
        ocupado(fEntrar, false);
        return abrirTroca({ obrigatoria: true });
      }
      $('.btn-texto', fEntrar).textContent = 'Abrindo';
      ir();
    });

    // bloqueio do servidor: o botão espera junto e conta o tempo, em vez de pedir outro 429
    let trava = null;
    function travarEntrar(min) {
      const b = $('.btn-primario', fEntrar);
      const t = $('.btn-texto', b);
      const fim = Date.now() + min * 60_000;
      clearInterval(trava);
      b.disabled = true;
      const tique = () => {
        const falta = Math.ceil((fim - Date.now()) / 60_000);
        if (falta > 0) { t.textContent = `Tente de novo em ${falta} min`; return; }
        clearInterval(trava);
        t.textContent = b.dataset.texto || 'Entrar';
        b.disabled = false;
        limparAviso($('.aviso', fEntrar));
      };
      tique();
      trava = setInterval(tique, 15_000);
    }

    // ── Link único: primeiro acesso ou nova senha ─────────────────────────
    async function abrirConvite() {
      if (!TOKEN_OK.test(tokenConvite)) return linkInvalido();
      const [res, est] = await Promise.all([
        pedir('GET', '/api/auth/convite?token=' + encodeURIComponent(tokenConvite)),
        pedir('GET', '/api/auth/estado'),
      ]);
      if (res.status === 0) return falhaServidor(res);
      if (res.status === 429) return linkEspera(minutosDeEspera(res.j, res.r));
      if (!res.ok || res.j?.valido !== true) return linkInvalido();
      estado = est.ok ? est.j : null;
      convite = {
        tipo: res.j.tipo === 'redefinir' ? 'redefinir' : 'novo',
        nomeSugerido: typeof res.j.nomeSugerido === 'string' ? res.j.nomeSugerido.trim().slice(0, 60) : '',
        expiraEm: res.j.expiraEm ?? null,
        usuario: typeof res.j.usuario === 'string' ? res.j.usuario : '',
      };
      return convite.tipo === 'redefinir' ? abrirRedefinir() : abrirNovo();
    }

    // link já usado, vencido, revogado ou inventado: a resposta é sempre a mesma
    function linkInvalido() {
      tokenConvite = null;
      convite = null;
      $('#link-titulo').textContent = 'Este link não vale mais';
      $('#link-texto').textContent = 'Cada link de acesso funciona uma vez só e vence em 72 horas. Peça um link novo pra quem cuida dos usuários da equipe.';
      $('[data-acao="tentar-link"]').hidden = true;
      mostrar('link');
    }

    function linkEspera(min) {
      $('#link-titulo').textContent = 'Muitas tentativas seguidas';
      $('#link-texto').textContent = `Por segurança, espere ${min ? `${min} min` : 'alguns minutos'} e tente de novo. O seu link continua guardado nesta aba.`;
      $('[data-acao="tentar-link"]').hidden = false;
      mostrar('link');
    }

    // quem já está logado neste navegador fica sabendo que vai trocar de conta
    function notaSessao(vista, texto) {
      const p = $('[data-sessao]', vista);
      // a própria dona do link de redefinição não precisa do aviso: a conta é a mesma
      const u = estado?.logado && estado.usuario?.usuario !== convite.usuario ? estado.usuario : null;
      p.hidden = !u;
      if (!u) return;
      p.textContent = '';
      const forte = document.createElement('strong');
      forte.textContent = '@' + u.usuario;
      p.append('Você está conectado como ', forte, ` neste navegador. ${texto}`);
    }

    // título e subtítulo com o nome de quem recebeu o link (sempre por textContent)
    function cabecalhoConvite(vista, idTitulo, titulo, frase) {
      const nome = primeiroNome(convite.nomeSugerido);
      const h = $(`#${idTitulo}`);
      h.textContent = '';
      if (nome) h.append(`Oi, ${nome}.`, document.createElement('br'));
      h.append(titulo);
      $('.cab-sub', vista).textContent = `${frase} O link vale uma vez só${venceTexto(convite.expiraEm)}.`;
    }

    const fNovo = $('#form-novo');
    let loginEditado = false;
    function abrirNovo() {
      const vista = $('[data-vista="novo"]');
      cabecalhoConvite(vista, 'novo-titulo', 'Crie a sua conta', 'Escolha o seu usuário e uma senha pra entrar na Gestão de Marketing.');
      notaSessao(vista, 'Ao criar a conta, ele passa a usar a conta nova.');
      for (const c of $$('input', fNovo)) { c.value = ''; c.removeAttribute('aria-invalid'); }
      loginEditado = false;
      if (convite.nomeSugerido) {
        $('#novo-nome').value = convite.nomeSugerido;
        $('#novo-usuario').value = sugestaoLogin(convite.nomeSugerido);
      }
      conferirRegras(fNovo);
      mostrar('novo');
    }
    $('#novo-nome').addEventListener('input', (e) => {
      if (!loginEditado) $('#novo-usuario').value = sugestaoLogin(e.target.value);
      conferirRegras(fNovo);
    });
    $('#novo-usuario').addEventListener('input', (e) => {
      loginEditado = true;
      e.target.removeAttribute('aria-invalid');
    });

    fNovo.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!convite || tokenConvite === null) return linkInvalido();
      const cNome = $('#novo-nome');
      const cLogin = $('#novo-usuario');
      const nome = cNome.value.trim();
      const usuario = cLogin.value.trim().toLowerCase();
      cLogin.value = usuario;
      const senha = $('#novo-senha').value;
      if (!nome) { aviso(fNovo, 'Escreva o seu nome.'); return cNome.focus(); }
      if (!LOGIN_OK.test(usuario)) {
        cLogin.setAttribute('aria-invalid', 'true');
        aviso(fNovo, 'O usuário precisa ter de 3 a 32 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.');
        return cLogin.focus();
      }
      cLogin.removeAttribute('aria-invalid');
      if (!conferirRegras(fNovo, true)) { aviso(fNovo, 'A senha ainda não cumpre as regras abaixo.', 'erro', true); return $('#novo-senha').focus(); }
      limparAviso($('.aviso', fNovo));
      ocupado(fNovo, true, 'Criando a conta');
      const res = await pedir('POST', '/api/auth/convite', { token: tokenConvite, nome, usuario, senha });
      if (res.ok) return concluirConvite(fNovo);
      ocupado(fNovo, false);
      if (linkMorto(res)) return linkInvalido();
      const { tipo, texto } = erroDo(res);
      aviso(fNovo, texto, tipo);
      if (res.status === 409) { cLogin.setAttribute('aria-invalid', 'true'); cLogin.focus(); cLogin.select(); }
    });

    const fRedefinir = $('#form-redefinir');
    function abrirRedefinir() {
      const vista = $('[data-vista="redefinir"]');
      cabecalhoConvite(vista, 'redefinir-titulo', 'Crie uma senha nova', 'Ao salvar, a sua conta sai dos outros aparelhos e você entra por aqui.');
      notaSessao(vista, 'Ao salvar, ele passa a usar a conta deste link.');
      for (const c of $$('input', fRedefinir)) c.value = '';
      $('#redefinir-login').value = convite.usuario;
      $('[data-regra="login"]', fRedefinir).hidden = !convite.usuario;
      conferirRegras(fRedefinir);
      mostrar('redefinir');
    }

    fRedefinir.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!convite || tokenConvite === null) return linkInvalido();
      if (!conferirRegras(fRedefinir, true)) { aviso(fRedefinir, 'A senha ainda não cumpre as regras abaixo.', 'erro', true); return $('#redefinir-senha').focus(); }
      limparAviso($('.aviso', fRedefinir));
      ocupado(fRedefinir, true, 'Salvando');
      const res = await pedir('POST', '/api/auth/convite', { token: tokenConvite, senha: $('#redefinir-senha').value });
      if (res.ok) return concluirConvite(fRedefinir);
      ocupado(fRedefinir, false);
      if (linkMorto(res)) return linkInvalido();
      const { tipo, texto } = erroDo(res);
      aviso(fRedefinir, texto, tipo);
    });

    // o servidor responde "não vale" do mesmo jeito pra usado, vencido e revogado
    const linkMorto = (res) => res.status === 404 || res.status === 410 || res.j?.valido === false;

    function concluirConvite(form) {
      tokenConvite = null;
      convite = null;
      for (const c of $$('input[type="password"], input[name$="password"]', form)) c.value = '';
      ocupado(form, true, 'Abrindo');
      aviso(form, form === fNovo ? 'Conta criada. Abrindo a Gestão de Marketing.' : 'Senha salva. Abrindo a Gestão de Marketing.', 'ok');
      setTimeout(() => location.replace('/'), 500);
    }

    // ── Trocar a senha (conta marcada pra trocar, ou ?trocar=1) ───────────
    const fTrocar = $('#form-trocar');
    let trocaObrigatoria = false;
    function abrirTroca({ obrigatoria }) {
      trocaObrigatoria = obrigatoria;
      $('#trocar-login').value = usuarioLogado?.usuario ?? '';
      $('label[for="trocar-atual"]').textContent = 'Senha atual';
      $('#trocar-sub').textContent = obrigatoria
        ? 'A sua conta está marcada pra trocar a senha. Escolha uma só sua pra continuar.'
        : 'Escolha uma senha nova pra sua conta.';
      $('#trocar-chip').textContent = usuarioLogado?.nome ? `Oi, ${primeiroNome(usuarioLogado.nome)}` : 'Senha nova';
      // acabou de entrar com a senha: não pede de novo
      $('#trocar-atual-grupo').hidden = !!senhaDaEntrada;
      $('#trocar-atual').required = !senhaDaEntrada;
      for (const c of $$('input', fTrocar)) if (c.id !== 'trocar-login') c.value = '';
      conferirRegras(fTrocar);
      mostrar('trocar');
    }

    fTrocar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const atual = senhaDaEntrada ?? $('#trocar-atual').value;
      const nova = $('#trocar-nova').value;
      if (!atual) { aviso(fTrocar, 'Escreva a sua senha atual.'); return $('#trocar-atual').focus(); }
      if (!conferirRegras(fTrocar, true)) { aviso(fTrocar, 'A nova senha ainda não cumpre as regras abaixo.', 'erro', true); return $('#trocar-nova').focus(); }
      limparAviso($('.aviso', fTrocar));
      ocupado(fTrocar, true, 'Salvando');
      const res = await pedir('POST', '/api/auth/senha', { atual, nova });
      if (!res.ok) {
        ocupado(fTrocar, false);
        // sessão caiu no meio (expirou ou foi revogada): volta pro login
        if (res.status === 401 && !(await pedir('GET', '/api/auth/estado')).j?.logado) {
          senhaDaEntrada = null;
          usuarioLogado = null;
          mostrar('entrar');
          return aviso(fEntrar, 'Sua sessão acabou. Entre de novo pra trocar a senha.', 'espera');
        }
        if (senhaDaEntrada && [400, 401, 403].includes(res.status)) {
          // a senha guardada não valeu: pede a atual na mão
          senhaDaEntrada = null;
          $('#trocar-atual-grupo').hidden = false;
          $('#trocar-atual').required = true;
        }
        const { tipo, texto } = erroDo(res);
        return aviso(fTrocar, texto, tipo);
      }
      senhaDaEntrada = null;
      aviso(fTrocar, 'Senha salva. Abrindo a Gestão de Marketing.', 'ok');
      $('.btn-texto', fTrocar).textContent = 'Abrindo';
      setTimeout(ir, 450);
    });

    // ── Regras da senha, ao vivo ──────────────────────────────────────────
    const CAMPOS = new Map([
      [fNovo, { senha: '#novo-senha', conf: '#novo-confirmar', login: () => $('#novo-usuario').value, atual: () => null }],
      [fRedefinir, { senha: '#redefinir-senha', conf: '#redefinir-confirmar', login: () => convite?.usuario ?? '', atual: () => null }],
      [fTrocar, { senha: '#trocar-nova', conf: '#trocar-confirmar', login: () => usuarioLogado?.usuario ?? '', atual: () => senhaDaEntrada ?? $('#trocar-atual').value }],
    ]);
    const PARES = { 'novo-senha': 'novo-confirmar', 'redefinir-senha': 'redefinir-confirmar', 'trocar-nova': 'trocar-confirmar' };

    function conferirRegras(form, marcarFalta = false) {
      const c = CAMPOS.get(form);
      const senha = $(c.senha).value;
      const conf = $(c.conf).value;
      const login = String(c.login() ?? '').trim().toLowerCase();
      const atual = c.atual();
      const regras = {
        tamanho: senha.length >= MIN_SENHA,
        login: !!senha && senha.trim().toLowerCase() !== login,
        atual: !!senha && senha !== atual,
        iguais: !!conf && senha === conf,
      };
      let tudo = true;
      for (const li of $$('.regras li', form)) {
        if (li.hidden) continue;
        const ok = regras[li.dataset.regra];
        if (li.dataset.regra === 'atual' && !atual) { marcarRegra(li, !!senha, false); continue; }
        tudo = tudo && ok;
        marcarRegra(li, ok, marcarFalta && !ok);
      }
      return tudo;
    }
    // o estado vai também em texto pro leitor de tela (a cor sozinha não diz nada)
    function marcarRegra(li, ok, falta) {
      li.classList.toggle('ok', ok);
      li.classList.toggle('falta', falta);
      const e = $('[data-estado]', li);
      if (e) e.textContent = ok ? 'Cumprida: ' : 'Falta: ';
    }
    for (const form of CAMPOS.keys()) {
      form.addEventListener('input', (e) => {
        if (!e.target.matches('input[type="password"], input[name="new-password"], input[name="confirm-password"], #novo-usuario, #trocar-atual')) return;
        const a = $('.aviso', form);
        // o aviso "não cumpre as regras" some sozinho quando as regras fecham
        if (conferirRegras(form, $$('.regras li.falta', form).length > 0) && a.dataset.regras === '1') limparAviso(a);
      });
    }

    // ── Mostrar/ocultar senha ─────────────────────────────────────────────
    for (const b of $$('[data-olho]')) {
      b.addEventListener('click', () => {
        const c = document.getElementById(b.dataset.olho);
        const ver = c.type === 'password';
        c.type = ver ? 'text' : 'password';
        b.setAttribute('aria-pressed', String(ver));
        b.setAttribute('aria-label', ver ? 'Esconder senha' : 'Mostrar senha');
        // no campo de confirmar, o mesmo estado (quem vê uma, vê as duas)
        const par = PARES[c.id] ? document.getElementById(PARES[c.id]) : null;
        if (par) par.type = c.type;
        c.focus();
        try { c.setSelectionRange(c.value.length, c.value.length); } catch {}
      });
    }

    // ── Caps Lock ─────────────────────────────────────────────────────────
    const caps = $('#form-entrar .caps');
    for (const tipo of ['keydown', 'keyup']) {
      $('#entrar-senha').addEventListener(tipo, (e) => { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); });
    }
    $('#entrar-senha').addEventListener('blur', () => { caps.hidden = true; });

    // ── Ações soltas ──────────────────────────────────────────────────────
    document.addEventListener('click', async (e) => {
      const alvo = e.target instanceof Element ? e.target.closest('[data-acao]') : null;
      if (!alvo) return;
      const acao = alvo.dataset.acao;
      if (acao === 'recarregar') iniciar();
      else if (acao === 'tentar-link') iniciar();
      else if (acao === 'login') { tokenConvite = null; convite = null; iniciar(); }
      else if (acao === 'sair') {
        await pedir('POST', '/api/auth/sair');
        usuarioLogado = null;
        senhaDaEntrada = null;
        mostrar('entrar');
      }
    });

    $('#tema').addEventListener('click', () => {
      const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem('cronograma-tema', t); } catch {}
      atualizarTema();
    });
    function atualizarTema() {
      const escuro = document.documentElement.dataset.theme !== 'light';
      $('#tema').setAttribute('aria-label', escuro ? 'Mudar pro tema claro' : 'Mudar pro tema escuro');
      $('#tema').title = escuro ? 'Tema claro' : 'Tema escuro';
    }
    atualizarTema();

    efeitos($);
    iniciar();
  }

  // ── Luz do mouse, anel do cursor e paralaxe das cartas ──────────────────
  // o evento só anota o alvo; quem desenha é um único requestAnimationFrame, que dorme quando
  // tudo chega no lugar. Só transform e opacity. Fora em tela de toque e com movimento reduzido.
  function efeitos($) {
    const luz = $('.luz');
    const anel = $('.anel');
    const cartas = $('.cartas');
    if (!luz || !anel) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const INTERATIVO = 'a, button, input, label, select, textarea, [role="button"]';
    let alvo = null; // {x, y}
    const luzP = { x: 0, y: 0 };
    const anelP = { x: 0, y: 0 };
    const par = { x: 0, y: 0, ax: 0, ay: 0 }; // paralaxe atual e alvo (-1 a 1)
    let escala = 1;
    let escalaAlvo = 1;
    let rodando = false;

    const perto = (a, b, eps) => Math.abs(a - b) < eps;
    function quadro() {
      if (alvo) {
        // 24/09: mais pesado (a luz e o anel chegam devagar, sem tranco)
        luzP.x += (alvo.x - luzP.x) * 0.07;
        luzP.y += (alvo.y - luzP.y) * 0.07;
        anelP.x += (alvo.x - anelP.x) * 0.2;
        anelP.y += (alvo.y - anelP.y) * 0.2;
      }
      par.x += (par.ax - par.x) * 0.04;
      par.y += (par.ay - par.y) * 0.04;
      escala += (escalaAlvo - escala) * 0.2;
      luz.style.transform = `translate3d(${luzP.x.toFixed(1)}px, ${luzP.y.toFixed(1)}px, 0)`;
      anel.style.transform = `translate3d(${anelP.x.toFixed(1)}px, ${anelP.y.toFixed(1)}px, 0) scale(${escala.toFixed(3)})`;
      if (cartas) {
        cartas.style.setProperty('--px', par.x.toFixed(4));
        cartas.style.setProperty('--py', par.y.toFixed(4));
      }
      const parado = (!alvo || (perto(alvo.x, luzP.x, 0.4) && perto(alvo.y, luzP.y, 0.4) && perto(alvo.x, anelP.x, 0.4) && perto(alvo.y, anelP.y, 0.4)))
        && perto(par.x, par.ax, 0.001) && perto(par.y, par.ay, 0.001) && perto(escala, escalaAlvo, 0.004);
      if (parado) { rodando = false; return; }
      requestAnimationFrame(quadro);
    }
    const acordar = () => { if (!rodando) { rodando = true; requestAnimationFrame(quadro); } };

    addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!alvo) {
        // primeira vez: nasce onde o mouse está, sem vir voando do canto
        luzP.x = anelP.x = e.clientX;
        luzP.y = anelP.y = e.clientY;
      }
      alvo = { x: e.clientX, y: e.clientY };
      par.ax = Math.max(-1, Math.min(1, (e.clientX / innerWidth) * 2 - 1));
      par.ay = Math.max(-1, Math.min(1, (e.clientY / innerHeight) * 2 - 1));
      const sobre = e.target instanceof Element && !!e.target.closest(INTERATIVO);
      if (escalaAlvo !== 0.8) escalaAlvo = sobre ? 1.55 : 1;
      anel.classList.toggle('sobre', sobre);
      luz.classList.add('ativa');
      anel.classList.add('ativa');
      acordar();
    }, { passive: true });

    addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { escalaAlvo = 0.8; acordar(); } }, { passive: true });
    addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') return;
      escalaAlvo = e.target instanceof Element && e.target.closest(INTERATIVO) ? 1.55 : 1;
      acordar();
    }, { passive: true });

    // saiu da janela: a luz apaga e as cartas voltam pro centro
    const sair = () => {
      luz.classList.remove('ativa');
      anel.classList.remove('ativa');
      par.ax = 0;
      par.ay = 0;
      escalaAlvo = 1;
      acordar();
    };
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) sair(); });
    addEventListener('blur', sair);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pronto, { once: true });
  else pronto();
})();
