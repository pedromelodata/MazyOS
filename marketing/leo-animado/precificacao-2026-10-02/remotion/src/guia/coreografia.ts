import "../abertura/useMasterTimeline"; // registra lgEntra, lgSai e lgPousa (o tipo gsap.core.Timeline é global)
import { CAM0, POSE0, W, type Estado } from "./estado";

// Coreografia do reel "O app fazendo a guia do mês" (14/10). Personalidade: Playful contido
// (skill motion-design): entrada com overshoot ~12% (lgEntra), saída acelerada (lgSai), pouso com mola (lgPousa),
// câmera sempre suave (power2/expo inOut). Três camadas: aparelho (primária), tela/relógio/guia (secundária),
// poeira de luz e respiração (ambiente). Cada batida nasce de uma palavra da narração (W(i) = início da palavra i).
export function coreografia(tl: gsap.core.Timeline, st: Estado) {
  const p = st.phone;
  const c = st.cam;
  const tela = st.tela;
  st.impactos = []; // v2: sem tremida (o carimbo saiu; toque em botão não sacode câmera)

  // ---------- A. gancho: "Veja como vai ser ter a guia do mês sem entrar no site do governo." ----------
  tl.to(p, { ry: -0.06, rx: 0.04, rz: 0, y: -0.006, duration: 1.3, ease: "lgPousa" }, 0.02);
  tl.to(c, { z: 0.6, duration: 3.5, ease: "power1.inOut" }, 0);
  tl.fromTo(st.luz, { varre: 0 }, { varre: 1, duration: 0.75, ease: "power2.inOut", immediateRender: false }, 0.8);
  // "sem entrar no site do governo": o aparelho balança a cabeça, um "não" de personagem
  tl.to(p, { keyframes: [
    { ry: -0.17, duration: 0.13, ease: "power2.out" },
    { ry: 0.07, duration: 0.17, ease: "power2.inOut" },
    { ry: -0.12, duration: 0.15, ease: "power2.inOut" },
    { ry: -0.04, duration: 0.3, ease: "lgPousa" },
  ] }, W(9) - 0.02);

  // ---------- B. "O sistema calcula o imposto e emite a guia." ----------
  // mergulho na tela + o app abre no Início
  tl.to(c, { z: 0.35, y: 0.036, ty: 0.042, duration: 0.62, ease: "expo.inOut" }, 3.6); // topo do aparelho abaixo da legenda
  tl.to(p, { ry: 0.1, rx: 0.05, duration: 0.7, ease: "power2.inOut" }, 3.6);
  tl.set(tela, { a: "splash", b: "inicio", modo: 0, p: 0 }, 3.68);
  tl.to(tela, { p: 1, duration: 0.45, ease: "power2.out" }, 3.68);
  tl.set(tela, { a: "inicio", b: "inicio", p: 0 }, 4.14);
  // "sistema": o card da guia acende; "calcula": o valor conta de R$ 0,00 até R$ 178,31 (fictício, nítido desde
  // 01/10) e assenta no "imposto", com o brilho de carregamento passando no esqueleto do botão
  // (v2: as faíscas saíram, eram o terceiro sinal da mesma palavra)
  tl.to(tela, { brilhoCard: 1, duration: 0.25, ease: "power2.out" }, W(16));
  tl.fromTo(tela, { conta: 0 }, { conta: 1, duration: 0.9, ease: "power3.out", immediateRender: false }, W(17));
  tl.fromTo(tela, { calc: 0 }, { calc: 1, duration: 0.55, ease: "none", immediateRender: false }, 4.45);
  tl.fromTo(tela, { calc: 0 }, { calc: 1, duration: 0.5, ease: "none", immediateRender: false }, 5.02);
  tl.to(tela, { brilhoCard: 0, duration: 0.3, ease: "power2.in" }, 5.5);
  // "emite": navegação pro Imposto do mês (entra pela direita) e a câmera recua um pouco
  tl.set(tela, { a: "inicio", b: "imposto", modo: 1, p: 0, calc: 0 }, 5.7);
  tl.to(tela, { p: 1, duration: 0.38, ease: "power3.inOut" }, 5.7);
  tl.set(tela, { a: "imposto", b: "imposto", p: 0 }, 6.09);
  tl.to(c, { z: 0.56, y: 0.006, ty: 0.004, tx: 0.008, duration: 0.7, ease: "power2.inOut" }, 5.72);
  // a guia sai SOZINHA da tela pro espaço no "emite" (quem emite é o sistema; o único toque do vídeo é o do pagar)
  tl.to(p, { x: -0.03, ry: 0.2, duration: 0.6, ease: "power2.inOut" }, 6.08);
  tl.set(st.folha, { vis: 1, x: -0.03, y: -0.006, z: 0.01, rx: 0, ry: 0.2, rz: 0, s: 0.42 }, 6.16);
  tl.to(st.folha, { x: 0.026, y: 0.012, z: 0.12, rx: -0.1, ry: -0.3, rz: 0.08, s: 0.97, duration: 0.66, ease: "expo.out" }, 6.16); // maior: a guia agora tem campos e números pra ler

  // ---------- C. "Ela aparece pronta, com o dia que vence." ----------
  // "pronta": a guia só assenta de frente no ar, sem símbolo (v2: o único check do vídeo é o do pagar)
  tl.to(st.folha, { rx: -0.04, ry: -0.16, rz: 0.03, duration: 0.5, ease: "lgPousa" }, W(26) - 0.05);
  // a guia sai pela esquerda e o relógio entra pela direita com o aviso
  tl.to(st.folha, { x: -0.26, y: 0.07, rz: 0.7, ry: 0.4, s: 0.75, duration: 0.42, ease: "lgSai" }, 7.78);
  tl.set(st.folha, { vis: 0 }, 8.2);
  tl.to(p, { x: -0.032, z: -0.03, ry: 0.42, duration: 0.6, ease: "power2.inOut" }, 7.72);
  tl.set(st.watch, { vis: 1, x: 0.22, y: -0.07, z: 0.13, rx: -0.15, ry: -0.9, rz: -0.5, s: 1.15 }, 7.8);
  tl.to(st.watch, { x: 0.036, y: -0.032, z: 0.14, ry: -0.3, rz: 0, rx: -0.05, duration: 0.55, ease: "lgPousa" }, 7.8);
  tl.to(c, { tx: 0.006, z: 0.6, duration: 0.6, ease: "power2.inOut" }, 7.8);
  tl.to(st.relogio, { notif: 1, duration: 0.42, ease: "none" }, 8.02);
  tl.to(st.watch, { keyframes: [{ buzz: 1, duration: 0.04 }, { buzz: 0, duration: 0.12 }, { buzz: 1, duration: 0.04 }, { buzz: 0, duration: 0.14 }] }, 8.04);
  // v2: sem anéis de vibração e sem a pílula "dia 20" (o relógio já diz "Vence dia 20.")

  // ---------- D. "A sua parte é só pagar." (v2, pedido do Pedro em 01/10) ----------
  // o celular faz um FLIP no ar e volta de frente no Início; o toque no "Pagar agora" cai no "pagar"
  // e o botão vira o verificado logo depois (nada de cair de tela pra baixo)
  tl.to(st.watch, { x: 0.25, y: -0.11, rz: 0.6, duration: 0.38, ease: "lgSai" }, 8.95);
  tl.set(st.watch, { vis: 0 }, 9.34);
  tl.to(c, { tx: 0, duration: 0.26, ease: "power2.inOut" }, 8.92);
  // flip (refs Dribbble "Phone flip" e Envato "3D phone logo reveal"): antecipação curta, giro de ~390° no eixo
  // vertical com arrancada forte e assentamento longo (power3.out), rolagem em Z de ida e volta pra não parecer
  // prato giratório; o verso fica à vista ~5 quadros (com menos vira um piscar) e a tela troca escondida nele.
  // A câmera mergulha junto e o aparelho pousa já enquadrado no card do pagamento.
  tl.to(p, { ry: 0.57, y: -0.01, z: -0.02, x: 0, duration: 0.2, ease: "power2.in" }, 8.98);
  tl.to(p, { ry: -Math.PI * 2, y: -0.004, z: 0, duration: 0.78, ease: "power3.out" }, 9.18);
  tl.to(p, { keyframes: [{ rz: -0.4, rx: 0.1, duration: 0.32, ease: "sine.out" }, { rz: 0, rx: 0.04, duration: 0.46, ease: "sine.inOut" }] }, 9.18);
  tl.set(tela, { a: "inicioPagar", b: "inicioPagar", p: 0, brilhoCard: 0, calc: 0, toque: 0 }, 9.35); // o "Pagar agora" nítido só aparece aqui
  tl.set(p, { ry: 0 }, 9.98); // -2π é a mesma pose que 0: zera pra próxima cena não dar uma volta inteira ao contrário
  // câmera num movimento só, do giro até o botão (sem segundo mergulho): o "Pagar agora" fica com ~30% da largura
  // do quadro e o topo da tela logo abaixo da legenda de uma linha
  tl.to(c, { z: 0.25, y: 0.034, ty: 0.04, x: 0, tx: 0, duration: 0.92, ease: "power2.inOut" }, 9.18);
  // clique físico: no toque o aparelho afunda 3 mm e volta com mola (ref Dribbble "Move Weight")
  tl.to(p, { keyframes: [{ z: -0.003, rx: 0.055, duration: 0.06, ease: "power2.out" }, { z: 0, rx: 0.04, duration: 0.25, ease: "lgPousa" }] }, W(37) - 0.05);
  // "só": pulso único no próprio botão (o brilho do card saiu: repetia o sinal do "calcula"); "pagar": toque e
  // clique; logo depois o retorno real do app, "Código copiado" no coral do botão (o app não confirma pagamento:
  // nada de verde, "pago" ou confete)
  tl.fromTo(tela, { pulso: 0 }, { pulso: 1, duration: 0.18, ease: "none", immediateRender: false }, 10.02);
  tl.fromTo(tela, { toqueBotao: 0 }, { toqueBotao: 1, duration: 0.55, ease: "none", immediateRender: false }, W(37) - 0.1);
  tl.fromTo(tela, { verif: 0 }, { verif: 1, duration: 0.55, ease: "none", immediateRender: false }, W(37) + 0.08);
  tl.fromTo(tela, { anel: 0 }, { anel: 1, duration: 0.6, ease: "none", immediateRender: false }, W(37) + 0.2);
  // como no app, o rótulo volta sozinho pra "Pagar agora" 1,8 s depois do toque
  tl.to(tela, { verif: 0, duration: 0.3, ease: "power2.inOut" }, 12.1);
  // (sem micro-avanço no retorno: ele subia o topo do aparelho pra baixo da legenda de duas linhas que entra em 11 s)

  // ---------- E. "Isso é uma prévia real do que estamos construindo. Chegando em breve." ----------
  tl.to(p, { rx: 0.05, y: -0.004, x: 0, ry: -0.3, duration: 0.8, ease: "power3.inOut" }, 10.95);
  // recua primeiro e só depois baixa a mira: com a mira descendo junto, o topo do aparelho (que estava em close)
  // subia por cima da 2ª linha da legenda de "Isso é uma prévia real..." em ~11,2 s
  tl.to(c, { x: CAM0.x, tx: CAM0.tx, tz: CAM0.tz, fov: CAM0.fov, z: 0.58, duration: 0.85, ease: "power2.inOut" }, 10.95);
  tl.to(c, { y: CAM0.y, ty: CAM0.ty, duration: 0.75, ease: "power2.inOut" }, 11.25);
  // "prévia real": a câmera abre mostrando a tela real do app
  tl.fromTo(st.luz, { varre: 0 }, { varre: 1, duration: 0.7, ease: "power2.inOut", immediateRender: false }, W(42) - 0.1);
  tl.to(p, { ry: 0.22, duration: 1.6, ease: "sine.inOut" }, 11.8);
  // "Chegando em breve": o app fecha no splash (que já tem o logo) e entra só o link da bio
  tl.set(tela, { a: "inicioPagar", b: "splash", modo: 0, p: 0 }, 13.45);
  tl.to(tela, { p: 1, duration: 0.45, ease: "power2.out" }, 13.45);
  tl.set(tela, { a: "splash", b: "splash", p: 0, verif: 0, toqueBotao: 0, anel: 0 }, 13.92);
  tl.to(p, { y: 0.008, s: 0.78, ry: 0.0, duration: 0.7, ease: "lgPousa" }, 13.45);

  // ---------- F. assinatura (ADR de 13/08, travado pelo Pedro): "Vai, Legalizaí" sozinho, falado como o nome
  // (Legaliz-aí, rápido; pedido do Pedro em 01/10), com o logo entrando e o "aí" acendendo em coral quando sai o
  // "aí" depois do "z"; o nome não é falado antes. O iPhone encolhe até o lugar do logo
  // (o logo do splash vira o logo da assinatura) e some; no fim ele nasce de volta dali pra pose do quadro 0 (loop).
  // a tela coral do iPhone encolhe exatamente até o quadradinho coral do símbolo do logo (corte casado):
  // símbolo em x ~410, y ~818 na tela, com a câmera do fecho (z 0,58) = mundo x -0,021, y 0,019
  const LOGO_X = -0.021;
  const LOGO_Y = 0.019;
  tl.to(p, { x: LOGO_X, y: LOGO_Y, s: 0.12, rx: 0, ry: 0, rz: 0, duration: 0.4, ease: "power3.in" }, 14.6);
  tl.set(p, { vis: 0 }, 15.0);
  tl.to(st.ui, { assina: 1, duration: 0.42, ease: "lgEntra" }, 14.94);
  tl.to(st.ui, { link: 1, duration: 0.45, ease: "lgEntra" }, 15.3);
  tl.to(st.ui, { ai: 1, duration: 0.12, ease: "power2.out" }, 15.94); // o "aí" acende quando é falado (fim do "z" medido em 15,95 s; "í" em 16,08)
  tl.to(st.ui, { assina: 0, link: 0, duration: 0.3, ease: "lgSai" }, 16.95);
  tl.set(p, { vis: 1, ...POSE0, x: LOGO_X, y: LOGO_Y, s: 0.12 }, 17.05);
  tl.to(p, { ...POSE0, s: 1, duration: 0.85, ease: "power2.out" }, 17.07);
  tl.to(c, { ...CAM0, duration: 0.9, ease: "power2.inOut" }, 17.0);
}
