// 22/10 (Pedro): ícones do estúdio que o core.js não tem (alinhar, distribuir, ordem, camadas). Mesmo traço fino do
// core (24x24, stroke 1.8, herdam a cor do texto). Os outros vêm do icone() do core.
import { icone as iconeCore } from '../core.js';

const P = {
  'al-esq': '<path d="M4 3.5v17"/><rect x="7" y="6" width="11" height="4.5" rx="1.4"/><rect x="7" y="13.5" width="7" height="4.5" rx="1.4"/>',
  'al-dir': '<path d="M20 3.5v17"/><rect x="6" y="6" width="11" height="4.5" rx="1.4"/><rect x="10" y="13.5" width="7" height="4.5" rx="1.4"/>',
  'al-ch': '<path d="M12 3v18"/><rect x="5.5" y="6" width="13" height="4.5" rx="1.4"/><rect x="8" y="13.5" width="8" height="4.5" rx="1.4"/>',
  'al-topo': '<path d="M3.5 4h17"/><rect x="6" y="7" width="4.5" height="11" rx="1.4"/><rect x="13.5" y="7" width="4.5" height="7" rx="1.4"/>',
  'al-base': '<path d="M3.5 20h17"/><rect x="6" y="6" width="4.5" height="11" rx="1.4"/><rect x="13.5" y="10" width="4.5" height="7" rx="1.4"/>',
  'al-cv': '<path d="M3 12h18"/><rect x="6" y="5.5" width="4.5" height="13" rx="1.4"/><rect x="13.5" y="8" width="4.5" height="8" rx="1.4"/>',
  'dist-h': '<path d="M3.5 4v16M20.5 4v16"/><rect x="9.5" y="7" width="5" height="10" rx="1.4"/>',
  'dist-v': '<path d="M4 3.5h16M4 20.5h16"/><rect x="7" y="9.5" width="10" height="5" rx="1.4"/>',
  frente: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 5.5v-.5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h.5" stroke-dasharray="2 2.2"/>',
  tras: '<rect x="3.5" y="3.5" width="11" height="11" rx="2" stroke-dasharray="2 2.2"/><path d="M8.5 15.5V19a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 19 8.5h-3.5"/>',
  subir: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  descer: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  desfazer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  refazer: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  'zoom-mais': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M11 8.5v5M8.5 11h5"/>',
  'zoom-menos': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M8.5 11h5"/>',
  ajustar: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/>',
  texto: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
  forma: '<rect x="3.5" y="3.5" width="10" height="10" rx="2"/><circle cx="15.5" cy="15.5" r="5"/>',
  camadas: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  imagem: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-4.5-4.5-8.5 8"/>',
  destravar: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.6"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>',
  duplicar: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.4"/><path d="M15.5 8.5V5.9a2.4 2.4 0 0 0-2.4-2.4H5.9a2.4 2.4 0 0 0-2.4 2.4v7.2a2.4 2.4 0 0 0 2.4 2.4h2.6"/><path d="M14.5 12v5M12 14.5h5"/>',
  espelhar: '<path d="M12 3v18" stroke-dasharray="2 2.2"/><path d="M9 7 4 17h5ZM15 7l5 10h-5Z"/>',
  segura: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><rect x="7" y="7" width="10" height="10" rx="1.2" stroke-dasharray="2 2"/>',
  'pagina-mais': '<path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5Z"/><path d="M11.5 10v6M8.5 13h6"/>',
  voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  pegar: '<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>',
  mais3: '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',
  restaurar: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.7"/><path d="M4 4v4.7h4.7"/>',
  subirArquivo: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 14.5v3.2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.2"/>',
  ia: '<path d="M12 3.5 13.6 8a3 3 0 0 0 1.9 1.9L20 11.5l-4.5 1.6a3 3 0 0 0-1.9 1.9L12 19.5 10.4 15a3 3 0 0 0-1.9-1.9L4 11.5l4.5-1.6A3 3 0 0 0 10.4 8Z"/>',
  // 22/10 (Pedro): modelo (página pronta), destacar trecho e centralizar nos dois eixos
  modelo: '<rect x="3.5" y="3.5" width="7.5" height="17" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/>',
  destaque: '<path d="M6.5 16 11 5h2l4.5 11M8.3 12h7.4"/><path d="M4 20h16"/>',
  'al-centro': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><rect x="8" y="8" width="8" height="8" rx="1.6"/>',
  // 23/10 (Pedro): os painéis do editor (esconder a esquerda, a direita, ou os dois e o menu: tela livre)
  'painel-esq': '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
  'painel-dir': '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M14.5 4.5v15"/>',
  'tela-livre': '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5V9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/><path d="m9 9 2 2M15 9l-2 2M9 15l2-2M15 15l-2-2"/>',
};

export function ic(nome, tam = 18) {
  if (!P[nome]) return iconeCore(nome, tam);
  return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[nome]}</svg>`;
}
