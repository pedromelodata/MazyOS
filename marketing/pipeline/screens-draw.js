// Desenho das duas telas do aparelho (lock screen e tela do app), em canvas 2D.
// Fonte única pra cena Three.js (s4scene.js) e pras texturas do Blender (screens.mjs)
// — não duplicar esse código, senão o 3D e o render do Blender divergem.
// Tamanho de referência: 780 x 1688. Pra render maior, escalar o contexto antes
// de chamar (ctx.scale(k, k)) — todo o desenho é vetorial.

export function roundClip(ctx, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.closePath();
}

export function drawLogoIcon(ctx, x, y, s, fg, bg) {
  // quadrado arredondado + check — símbolo Legalizai simplificado
  const r = s * .26;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.arcTo(s, 0, s, s, r); ctx.arcTo(s, s, 0, s, r);
  ctx.arcTo(0, s, 0, 0, r); ctx.arcTo(0, 0, s, 0, r); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = fg;
  ctx.lineWidth = s * .16;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(s * .24, s * .52);
  ctx.lineTo(s * .44, s * .72);
  ctx.lineTo(s * .80, s * .30);
  ctx.stroke();
  ctx.restore();
}

export function statusBar(ctx, w, cor) {
  ctx.fillStyle = cor;
  ctx.font = '600 36px Sora';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('Vivo', 84, 78);
  // sinal
  for (let i = 0; i < 4; i++) ctx.fillRect(w - 264 + i * 16, 88 - 10 - i * 7, 10, 10 + i * 7);
  // wifi (arcos)
  ctx.strokeStyle = cor; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(w - 156, 92, 12 + i * 11, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
  }
  // bateria
  ctx.lineWidth = 4;
  ctx.strokeRect(w - 108, 62, 52, 28);
  ctx.fillRect(w - 104, 66, 34, 20);
  ctx.fillRect(w - 52, 70, 6, 12);
}

export function drawEstadoA(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  roundClip(ctx, w, h, 92); ctx.save(); ctx.clip();
  // coral da marca, com leve profundidade
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#F2643C');
  g.addColorStop(1, '#DD4E27');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  statusBar(ctx, w, 'rgba(255,255,255,.95)');

  // dynamic island expandida com a marca — menor, sempre inteira no quadro
  const iw = 508, ih = 136, ix = (w - iw) / 2 - 26, iy = 128;
  ctx.fillStyle = '#101114';
  ctx.beginPath();
  const r = ih / 2;
  ctx.moveTo(ix + r, iy); ctx.arcTo(ix + iw, iy, ix + iw, iy + ih, r);
  ctx.arcTo(ix + iw, iy + ih, ix, iy + ih, r); ctx.arcTo(ix, iy + ih, ix, iy, r);
  ctx.arcTo(ix, iy, ix + iw, iy, r); ctx.closePath(); ctx.fill();
  drawLogoIcon(ctx, ix + 56, iy + 32, 72, '#101114', '#ffffff');
  ctx.fillStyle = '#fff';
  ctx.font = '700 64px Sora';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('Legalizai', ix + 152, iy + ih / 2 + 3);

  // logo Legalizai no centro — símbolo + wordmark, como a splash do app
  const ls = 220;
  drawLogoIcon(ctx, w / 2 - ls / 2, h * .34, ls, '#F2643C', '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 104px Sora';
  ctx.fillText('Legalizai', w / 2, h * .34 + ls + 110);

  // check + legenda
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(w / 2, h * .64, 46, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w / 2 - 20, h * .64 + 2); ctx.lineTo(w / 2 - 4, h * .64 + 18); ctx.lineTo(w / 2 + 24, h * .64 - 16);
  ctx.stroke();
  ctx.font = 'italic 500 46px Sora';
  ctx.fillText('Feito! Guia do mês', w / 2, h * .70);
  ctx.fillText('paga pelo app', w / 2, h * .735);
  ctx.restore();
}

export function drawEstadoB(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  roundClip(ctx, w, h, 92); ctx.save(); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#D65D17');
  g.addColorStop(.62, '#7a3417');
  g.addColorStop(1, '#191A1F');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  statusBar(ctx, w, 'rgba(255,255,255,.94)');

  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '500 44px Sora';
  ctx.fillText('Seg 10 · Belo Horizonte', w / 2, 300);
  ctx.font = '700 250px Sora';
  ctx.fillText('9:41', w / 2, 480);

  // brilho de contraluz
  const rg = ctx.createRadialGradient(w * .68, h * .34, 60, w * .68, h * .34, w * .9);
  rg.addColorStop(0, 'rgba(255,190,140,.35)');
  rg.addColorStop(1, 'rgba(255,190,140,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);

  drawLogoIcon(ctx, w / 2 - 40, h - 300, 80, '#D65D17', '#ffffff');
  ctx.font = '600 40px Sora';
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillText('Legalizai', w / 2, h - 170);
  ctx.restore();
}
