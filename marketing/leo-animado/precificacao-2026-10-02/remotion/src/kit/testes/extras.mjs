// Conferências a mais do núcleo (dono K02), nos caminhos que a regressão do guia não passa:
// 1) projecao.ts contra a PerspectiveCamera e o Object3D do próprio three (mesmo px, mesma desprojeção);
// 2) fecho-simbolo com alvoMundo null (desprojeção por valor em função, avaliada quando o tween inicia) e a
//    volta-loop nascendo do ponto publicado;
// 3) pílula e comprovante na objeto-sai-da-tela, com a flutuação do tipo;
// 4) poseRender e cameraRender iguais às fórmulas do Cena3D.tsx (linhas 221, 222 e 237 a 241).
// Nada é gravado. Uso: node extras.mjs        (código de saída 0 = passou)

import { empacota, ENTRADA_NUCLEO } from "./esbuild-node.mjs";
import { carregaCatalogo, dormeTicker, lerCena, lerFecho, lerNarracao } from "./comum.mjs";

const { modulo: kit } = await empacota({ conteudo: ENTRADA_NUCLEO + '\nexport * as THREE from "three";\n', nome: "extras-k02.ts" });
dormeTicker(kit.gsap);
const THREE = kit.THREE;
const base = lerCena("cenas.json");
const narr = lerNarracao(base.cena, base.pasta).narracao;
const fecho = lerFecho().fecho;
const { catalogo, origem } = carregaCatalogo();
console.log(`catálogo: ${origem}`);
const copia = (x) => JSON.parse(JSON.stringify(x));
const props = kit.montaProps(base.cena, { narracao: narr, fecho, catalogo });
const res = [];
const confere = (nome, ok, detalhe = "") => {
  res.push(ok);
  console.log(`[${ok ? "ok" : "FALHA"}] ${nome}${detalhe ? ": " + detalhe : ""}`);
};

// 1) projeção contra o three
{
  const st = kit.novoEstado(props);
  const cam = kit.cameraRender(st.cam, 0.5, props);
  const ap = props.objetos[0];
  const pose = kit.poseRender(st.obj.aparelho, ap, 0.5, props);
  const nossa = kit.projetaCaixa(ap, pose, cam);
  const pc = new THREE.PerspectiveCamera(cam.fov, props.largura / props.altura, 0.005, 20);
  pc.position.set(cam.x, cam.y, cam.z);
  pc.lookAt(cam.tx, cam.ty, cam.tz);
  pc.updateProjectionMatrix();
  pc.updateMatrixWorld(true);
  const rig = new THREE.Group();
  kit.aplicaRig(rig, pose);
  rig.updateMatrixWorld(true);
  let maior = 0;
  kit.cantosCaixa(ap.caixa).forEach((c, i) => {
    const v = c.clone().applyMatrix4(rig.matrixWorld).project(pc);
    const px = ((v.x + 1) / 2) * props.largura;
    const py = ((1 - v.y) / 2) * props.altura;
    maior = Math.max(maior, Math.abs(px - nossa.pontos[i][0]), Math.abs(py - nossa.pontos[i][1]));
  });
  confere("projetaCaixa igual à PerspectiveCamera + Group do three", maior < 1e-6, `maior diferença ${maior.toExponential(2)} px`);
  const xs = nossa.pontos.map((p) => p[0]);
  const ys = nossa.pontos.map((p) => p[1]);
  confere("o aparelho no quadro 0 cai no meio do quadro", Math.min(...xs) > 0 && Math.max(...xs) < 1080 && Math.min(...ys) > 400 && Math.max(...ys) < 1920,
    `x ${Math.min(...xs).toFixed(0)} a ${Math.max(...xs).toFixed(0)}, y ${Math.min(...ys).toFixed(0)} a ${Math.max(...ys).toFixed(0)}`);
  // desprojeção: o ponto do símbolo com a câmera do fecho (z 0,58) dá o mundo do guia (-0,021; 0,019)
  const camFecho = { ...props.camera, z: 0.58 };
  const d = kit.desprojeta(410, 818, camFecho, 0);
  confere("desprojeta(410, 818) com a câmera do fecho dá o (-0,021; 0,019) do guia", Math.abs(d.x + 0.021) < 5e-4 && Math.abs(d.y - 0.019) < 5e-4, `(${d.x.toFixed(5)}; ${d.y.toFixed(5)})`);
  const volta = kit.projetaPonto([d.x, d.y, 0], camFecho);
  confere("projeta(desprojeta(p)) volta no mesmo px", Math.abs(volta.px - 410) < 1e-6 && Math.abs(volta.py - 818) < 1e-6, `(${volta.px.toFixed(6)}; ${volta.py.toFixed(6)})`);
}

// 2) fecho-simbolo com alvoMundo null
{
  const cena = copia(base.cena);
  cena.batidas.filter((b) => b.id === "fecho-simbolo")[0].params.encolhe.alvoMundo = null;
  const p = kit.montaProps(cena, { narracao: narr, fecho, catalogo });
  kit.registraEases(kit.gsap, kit.CustomEase);
  const st = kit.novoEstado(p);
  const tl = kit.novaTimeline(kit.gsap);
  const quadro = {};
  kit.montaTimeline(tl, st, p, kit.BATIDAS_NUCLEO, { avisos: [], quadro });
  tl.seek(0, false);
  for (let q = 0; q <= 449; q++) tl.seek(q / 30 + 1e-4, false); // até 14,97 s, quadro a quadro
  tl.seek(15.0001, false); // o encolhe termina em 15,0 (e o set vis 0 entra junto)
  const sim = typeof quadro.simbolo === "function" ? quadro.simbolo() : quadro.simbolo;
  const esperado = kit.desprojeta(410, 818, { ...p.camera, z: 0.58 }, 0);
  confere("alvoMundo null: o aparelho encolhe até o ponto desprojetado", Math.abs(st.obj.aparelho.x - sim.x) < 1e-6 && Math.abs(st.obj.aparelho.y - sim.y) < 1e-6 && Math.abs(sim.x - esperado.x) < 1e-9,
    `fim do encolhe em (${st.obj.aparelho.x.toFixed(5)}; ${st.obj.aparelho.y.toFixed(5)}), símbolo (${sim.x.toFixed(5)}; ${sim.y.toFixed(5)})`);
  tl.seek(17.0501, false);
  confere("a volta-loop nasce do símbolo publicado", Math.abs(st.obj.aparelho.x - sim.x) < 1e-6 && st.obj.aparelho.vis === 1 && Math.abs(st.obj.aparelho.s - 0.12) < 1e-9,
    `x ${st.obj.aparelho.x.toFixed(5)}, s ${st.obj.aparelho.s}`);
  tl.kill();
}

// 3) pílula e comprovante
for (const [id, modelo, tipo] of [["pilula", "proc-pilula-dia20", "pilula"], ["comprovante", "proc-comprovante", "comprovante"]]) {
  const cena = copia(base.cena);
  cena.objetos.push({ id, modelo, pose: { s: 0.5, vis: 0 }, conteudo: id === "pilula" ? { texto: "dia 20" } : { mostraValor: false } });
  cena.batidas.filter((b) => b.id === "objeto-sai-da-tela")[0].params.objeto = id;
  const r = kit.avaliaCena(cena, { narracao: narr, fecho, catalogo });
  const ob = r.props && r.props.objetos.filter((o) => o.id === id)[0];
  const fl = ob ? kit.flutuacaoDe(ob) : null;
  const esperada = kit.FLUTUACAO_POR_TIPO[tipo];
  confere(`objeto-sai-da-tela com ${id}`, r.erros.length === 0 && !!ob && ob.tipo === tipo && !!ob.caixa && !!fl && fl.amp === esperada.amp && fl.freq === esperada.freq,
    r.erros.length ? r.erros.join("; ") : `tipo ${ob.tipo}, flutuação amp ${fl.amp} freq ${fl.freq}, caixa ${JSON.stringify(ob.caixa)}`);
}

// 4) fórmulas do Cena3D.tsx (com periodico false)
{
  const st = kit.novoEstado(props);
  let maior = 0;
  for (let q = 0; q < 540; q += 7) {
    const t = q / 30;
    st.obj.aparelho.rx = q % 2 ? 1.2 : 0.1; // as duas pontas do "só se rx <= 1"
    st.obj.relogio.buzz = (q % 5) / 4;
    const cam = kit.cameraRender(st.cam, t, props);
    const ap = kit.poseRender(st.obj.aparelho, props.objetos[0], t, props);
    const wa = kit.poseRender(st.obj.relogio, props.objetos[1], t, props);
    const fo = kit.poseRender(st.obj.guia, props.objetos[2], t, props);
    const fl = Math.sin(t * 1.7) * 0.0018;
    const ref = [
      [cam.x, st.cam.x + 0 + Math.sin(t * 0.35) * 0.0028],
      [cam.y, st.cam.y + 0 + Math.sin(t * 0.27 + 1) * 0.0018],
      [ap.y, st.obj.aparelho.y + (st.obj.aparelho.rx > 1 ? 0 : fl)],
      [wa.y, st.obj.relogio.y + Math.sin(t * 2.1 + 1) * 0.0015],
      [wa.rz, st.obj.relogio.rz + st.obj.relogio.buzz * 0.05 * Math.sin(t * 140)],
      [fo.y, st.obj.guia.y + Math.sin(t * 2.3 + 2) * 0.002],
      [fo.rz, st.obj.guia.rz + Math.sin(t * 1.9) * 0.02],
    ];
    for (const [a, b] of ref) maior = Math.max(maior, Math.abs(a - b));
  }
  confere("cameraRender e poseRender iguais às fórmulas do Cena3D.tsx (bit a bit)", maior === 0, `maior diferença ${maior}`);
}

const passou = res.every(Boolean);
console.log(`\nresultado: ${passou ? "PASSOU" : "FALHOU"}`);
dormeTicker(kit.gsap);
process.exit(passou ? 0 : 1);
