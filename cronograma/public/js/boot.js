// Roda no <head>, antes do CSS. Sem script inline (a CSP só aceita arquivo do próprio site):
// tema antes do primeiro paint, aviso quando um módulo não carrega e imagem de fora que falha some.
(function () {
  var t = null;
  try {
    var q = new URLSearchParams(location.search).get('tema');
    if (q === 'claro' || q === 'light') t = 'light';
    else if (q === 'escuro' || q === 'dark') t = 'dark';
  } catch (e) {}
  if (!t) { try { t = localStorage.getItem('cronograma-tema'); } catch (e) {} }
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';

  function falhou(msg) {
    if (window.__cronogramaPronto) return;
    var v = document.getElementById('vista');
    if (!v) return;
    v.innerHTML = '<div class="card vazio"><strong>O app não carregou</strong><p>' +
      String(msg || 'Erro ao carregar os módulos').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) +
      '</p><p>Abra o console do navegador pra ver o detalhe.</p></div>';
  }
  window.__falhaBoot = falhou;
  window.addEventListener('error', function (e) { falhou(e && e.message); });

  // erro de carga não sobe até a janela: escuta na captura
  document.addEventListener('error', function (e) {
    var el = e.target;
    if (!el || !el.tagName) return;
    if (el.tagName === 'IMG' && el.hasAttribute('data-some-se-falhar')) el.remove();
    else if (el.tagName === 'SCRIPT' && el.type === 'module') falhou('Um dos módulos em /js não foi encontrado');
  }, true);
})();
