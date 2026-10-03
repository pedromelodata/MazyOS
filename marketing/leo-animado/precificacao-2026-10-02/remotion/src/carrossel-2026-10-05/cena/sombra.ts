import * as THREE from "three";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";

// Sombra de contato pela técnica do exemplo webgl_shadow_contact do three (ESPEC 2.5, camada a):
// câmera ortográfica olhando de baixo pra cima a partir do chão, profundidade pintada em preto com alfa
// (1 - z) * escuridão, blur horizontal e vertical duas vezes (2,0 e 0,8) e um plano no chão com o resultado.
// O que flutua fica mais longe da câmera e sai mais claro sozinho. Fundo, textos e planos ficam fora do passe.

export type OpSombra = { largura: number; profundidade: number; altura: number; res: number; blur: number; escuridao: number; opacidade: number };

const PADRAO: OpSombra = { largura: 0.6, profundidade: 0.4, altura: 0.12, res: 1024, blur: 2.0, escuridao: 1.35, opacidade: 0.6 };

export class SombraContato {
  grupo = new THREE.Group();
  private op: OpSombra;
  private rt: THREE.WebGLRenderTarget;
  private rtBlur: THREE.WebGLRenderTarget;
  private plano: THREE.Mesh;
  private planoBlur: THREE.Mesh;
  private cam: THREE.OrthographicCamera;
  private matProf: THREE.MeshDepthMaterial;
  private matH: THREE.ShaderMaterial;
  private matV: THREE.ShaderMaterial;
  private corAnt = new THREE.Color();

  constructor(op: Partial<OpSombra> = {}, prendeMaterial: (m: THREE.Material) => THREE.Material = (m) => m) {
    this.op = { ...PADRAO, ...op };
    const o = this.op;
    const resY = Math.round((o.res * o.profundidade) / o.largura);
    this.rt = new THREE.WebGLRenderTarget(o.res, resY);
    this.rt.texture.generateMipmaps = false;
    this.rtBlur = new THREE.WebGLRenderTarget(o.res, resY);
    this.rtBlur.texture.generateMipmaps = false;

    const geo = new THREE.PlaneGeometry(o.largura, o.profundidade).rotateX(Math.PI / 2);
    // o plano da sombra passa pela máscara dos painéis da vitrine (nada vaza pro papel nem cruza o vão do meio)
    this.plano = new THREE.Mesh(
      geo,
      prendeMaterial(new THREE.MeshBasicMaterial({ map: this.rt.texture, opacity: o.opacidade, transparent: true, depthWrite: false, toneMapped: false })),
    );
    this.plano.renderOrder = 1;
    this.plano.scale.y = -1; // como no exemplo: a textura vem invertida em y
    this.plano.position.y = 0.0002;
    this.plano.userData.foraDaCaixa = true;
    this.plano.userData.semSombra = true;

    this.planoBlur = new THREE.Mesh(geo);
    this.planoBlur.visible = false;
    this.planoBlur.userData.foraDaCaixa = true;
    this.planoBlur.userData.semSombra = true;

    this.cam = new THREE.OrthographicCamera(-o.largura / 2, o.largura / 2, o.profundidade / 2, -o.profundidade / 2, 0, o.altura);
    this.cam.rotation.x = Math.PI / 2; // olha pra cima

    this.grupo.add(this.plano, this.planoBlur, this.cam);

    const escuridao = { value: o.escuridao };
    const mat = new THREE.MeshDepthMaterial();
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = escuridao;
      shader.fragmentShader =
        "uniform float darkness;\n" +
        shader.fragmentShader.replace(
          "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
          "gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );",
        );
    };
    mat.customProgramCacheKey = () => "carrossel-sombra-contato";
    mat.depthTest = false;
    mat.depthWrite = false;
    this.matProf = mat;

    this.matH = new THREE.ShaderMaterial(HorizontalBlurShader);
    this.matH.depthTest = false;
    this.matV = new THREE.ShaderMaterial(VerticalBlurShader);
    this.matV.depthTest = false;
  }

  private desfoca(gl: THREE.WebGLRenderer, quanto: number) {
    this.planoBlur.visible = true;
    this.planoBlur.material = this.matH;
    this.matH.uniforms.tDiffuse.value = this.rt.texture;
    this.matH.uniforms.h.value = quanto / 256;
    gl.setRenderTarget(this.rtBlur);
    gl.render(this.planoBlur, this.cam);
    this.planoBlur.material = this.matV;
    this.matV.uniforms.tDiffuse.value = this.rtBlur.texture;
    this.matV.uniforms.v.value = quanto / 256;
    gl.setRenderTarget(this.rt);
    gl.render(this.planoBlur, this.cam);
    this.planoBlur.visible = false;
  }

  /** passe da sombra (roda antes do render da cena, num useFrame de prioridade negativa) */
  render(gl: THREE.WebGLRenderer, scene: THREE.Scene, ocultar: THREE.Object3D[]) {
    const vis = ocultar.map((o) => o.visible);
    ocultar.forEach((o) => (o.visible = false));
    this.plano.visible = false;
    const fundoCena = scene.background;
    scene.background = null;
    gl.getClearColor(this.corAnt);
    const alfaAnt = gl.getClearAlpha();
    const alvoAnt = gl.getRenderTarget();
    const autoSombra = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false; // o mapa da luz chave não precisa ser refeito neste passe
    gl.setClearColor(0x000000, 0);

    scene.overrideMaterial = this.matProf;
    gl.setRenderTarget(this.rt);
    gl.clear();
    gl.render(scene, this.cam);
    scene.overrideMaterial = null;

    this.desfoca(gl, this.op.blur);
    this.desfoca(gl, this.op.blur * 0.4); // segunda passada tira os degraus

    gl.setRenderTarget(alvoAnt);
    gl.setClearColor(this.corAnt, alfaAnt);
    gl.shadowMap.autoUpdate = autoSombra;
    scene.background = fundoCena;
    ocultar.forEach((o, i) => (o.visible = vis[i]));
    this.plano.visible = true;
  }
}
