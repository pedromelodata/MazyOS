// Cena 3D do fecho — dois iPhones PBR orbitando, estilo case Tally (Humbleteam).
// Renderização determinística: window.__s4render(tMs) posiciona tudo em função de t.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// As duas telas moram em screens-draw.js — o mesmo módulo alimenta as texturas
// do Blender (screens.mjs), pra cena e render não divergirem.
import { drawEstadoA, drawEstadoB } from './screens-draw.js';

const LOOP = 13000; // loop perfeito da órbita
const W = 1080, H = 1920;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x) => { const c = clamp(x); return c * c * (3 - 2 * c); };
const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));

// ---------- construção do aparelho ----------
function buildPhone({ withScreen }) {
  const g = new THREE.Group();

  const corpoMat = new THREE.MeshPhysicalMaterial({
    color: 0x17191d, metalness: .85, roughness: .32,
    clearcoat: .9, clearcoatRoughness: .22,
  });
  const corpo = new THREE.Mesh(new RoundedBoxGeometry(.74, 1.54, .082, 7, .10), corpoMat);
  g.add(corpo);

  // botões laterais
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x2c2f36, metalness: .9, roughness: .3 });
  for (const [y, hgt] of [[.42, .10], [.27, .13], [.12, .13]]) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(.012, hgt, .05, 2, .006), btnMat);
    b.position.set(-.376, y, 0);
    g.add(b);
  }
  const pwr = new THREE.Mesh(new RoundedBoxGeometry(.012, .16, .05, 2, .006), btnMat);
  pwr.position.set(.376, .25, 0);
  g.add(pwr);

  if (withScreen) {
    const cv = document.createElement('canvas');
    cv.width = 780; cv.height = 1688;
    const ctx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(.685, 1.485),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }),
    );
    scr.position.z = .0425;
    g.add(scr);
    g.userData.screen = { cv, ctx, tex };
  } else {
    // módulo de câmera na traseira, canto superior esquerdo
    const ilha = new THREE.Group();
    // módulo bem arredondado, canto quase pílula — nada de quadrado duro
    const base = new THREE.Mesh(
      new RoundedBoxGeometry(.30, .30, .034, 6, .13),
      new THREE.MeshPhysicalMaterial({ color: 0x1d2026, metalness: .8, roughness: .38, clearcoat: .6 }),
    );
    ilha.add(base);
    const lentePos = [[-.068, .068], [-.068, -.068], [.068, 0]];
    for (const [lx, ly] of lentePos) {
      const anel = new THREE.Mesh(
        new THREE.TorusGeometry(.052, .011, 14, 40),
        new THREE.MeshStandardMaterial({ color: 0x3d4148, metalness: .95, roughness: .22 }),
      );
      anel.position.set(lx, ly, .020);
      ilha.add(anel);
      const vidro = new THREE.Mesh(
        new THREE.CylinderGeometry(.044, .044, .016, 36),
        new THREE.MeshPhysicalMaterial({ color: 0x0a1018, metalness: .1, roughness: .05, clearcoat: 1, clearcoatRoughness: .04 }),
      );
      vidro.rotation.x = Math.PI / 2;
      vidro.position.set(lx, ly, .022);
      ilha.add(vidro);
      const olho = new THREE.Mesh(
        new THREE.SphereGeometry(.018, 20, 20),
        new THREE.MeshPhysicalMaterial({ color: 0x14304a, metalness: .2, roughness: .08, clearcoat: 1 }),
      );
      olho.position.set(lx, ly, .028);
      ilha.add(olho);
    }
    const flash = new THREE.Mesh(
      new THREE.CylinderGeometry(.017, .017, .012, 24),
      new THREE.MeshStandardMaterial({ color: 0xf2ecd8, emissive: 0x8a8266, emissiveIntensity: .35, roughness: .5 }),
    );
    flash.rotation.x = Math.PI / 2;
    flash.position.set(.068, .105, .020);
    ilha.add(flash);

    ilha.position.set(-.175, .565, -.058);
    ilha.rotation.y = Math.PI; // vira pra face traseira
    g.add(ilha);
  }
  return g;
}

// ---------- montagem das duas cenas (uma por canvas, pro DOF por CSS) ----------
function makeStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;

  const cam = new THREE.PerspectiveCamera(30, W / H, .1, 12);
  cam.position.set(0, 0, 5.1);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.2, 3.0, 2.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe9d6, 1.1);
  rim.position.set(-3.0, 1.2, -1.6);
  scene.add(rim);

  return { renderer, scene, cam };
}

let st1, st2, ph1, ph2, ctxA, ctxB, lastMix = -1;
const stateA = document.createElement('canvas');
const stateB = document.createElement('canvas');

window.__s4init = async function () {
  await document.fonts.load('800 320px Sora');
  await document.fonts.load('700 72px Sora');
  await document.fonts.load('italic 500 46px Sora');
  await document.fonts.ready;

  st1 = makeStage(document.getElementById('gl1'));
  st2 = makeStage(document.getElementById('gl2'));

  ph1 = buildPhone({ withScreen: false }); // traseira
  st1.scene.add(ph1);
  ph2 = buildPhone({ withScreen: true });  // tela
  st2.scene.add(ph2);

  stateA.width = stateB.width = 780;
  stateA.height = stateB.height = 1688;
  ctxA = stateA.getContext('2d');
  ctxB = stateB.getContext('2d');
  drawEstadoA(ctxA, 780, 1688);
  drawEstadoB(ctxB, 780, 1688);
  window.__s4ready = true;
};

window.__s4render = function (lMs) {
  if (!window.__s4ready) return;
  const ph = (2 * Math.PI * (lMs % LOOP)) / LOOP;

  // entrada (primeiros 1,4s do ato) + órbita contínua em loop
  const e1 = outExpo((lMs - 100) / 1300);
  const e2 = outExpo((lMs - 300) / 1350);

  // módulo de câmera sempre inteiro no quadro; aparelhos terminam acima do bloco de texto
  ph1.position.set(-0.56 - (1 - e1) * 1.7 + .03 * Math.sin(ph + 2), 0.42 + .04 * Math.sin(ph + Math.PI / 2), -0.42);
  ph1.rotation.set(
    .05 + .05 * Math.sin(2 * ph + .5),
    Math.PI - .38 + .20 * Math.sin(ph) + (1 - e1) * .6,
    .38 + .06 * Math.sin(ph + 1.2),
  );

  ph2.position.set(0.26 + (1 - e2) * 1.7 + .03 * Math.sin(ph + 5), 0.46 - .04 * Math.sin(ph + Math.PI / 2), 0.30);
  ph2.rotation.set(
    .03 + .04 * Math.sin(2 * ph + 3),
    -.16 + .12 * Math.sin(ph + Math.PI) - (1 - e2) * .55,
    -.12 + .04 * Math.sin(ph + 4.2),
  );

  ph1.visible = e1 > .02;
  ph2.visible = e2 > .02;

  // crossfade lock screen → tela do app (uma vez, no meio do ato)
  const mix = smooth((lMs - 2350) / 800);
  if (Math.abs(mix - lastMix) > 0.004 || lastMix < 0) {
    const { cv, ctx, tex } = ph2.userData.screen;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(stateB, 0, 0); // primeiro: tela do celular (lock)
    if (mix > 0) {
      ctx.globalAlpha = mix;
      ctx.drawImage(stateA, 0, 0); // depois: tela do app com a logo
      ctx.globalAlpha = 1;
    }
    tex.needsUpdate = true;
    lastMix = mix;
  }

  st1.renderer.render(st1.scene, st1.cam);
  st2.renderer.render(st2.scene, st2.cam);
};
