# Copia a fábrica gerada pelo img2threejs (src/createClayCalendarModel.ts) pro projeto Remotion e faz a
# integração de runtime, sem inventar geometria fora da spec:
#  1. mapas PBR carregados por um loader injetado (globalThis.__img2threeTexLoad), que o componente Remotion
#     define com staticFile() + delayRender/continueRender. Sem isso o Remotion captura o quadro antes das
#     texturas chegarem e procura os arquivos fora de /public.
#  2. geometryDescriptor.preSubdivisionSegments da spec: o gerador emite BoxGeometry(1, 1, 1) com 1 segmento
#     no caminho da subdivisão Catmull-Clark, o que vira um seixo; com segmentos só as arestas arredondam.
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src" / "createClayCalendarModel.ts"
SPEC = HERE / "object-sculpt-spec.json"
DST = pathlib.Path(r"C:\MKT-INSTA\Content Legalizai\marketing\leo-animado\precificacao-2026-10-02\remotion\src\abertura\3d\createClayCalendarModel.ts")
code = SRC.read_text(encoding="utf-8")

old = "  const texture = new THREE.TextureLoader().load(url);"
new = ("  const injected = (globalThis as any).__img2threeTexLoad as ((u: string) => THREE.Texture) | undefined;\n"
       "  const texture = injected ? injected(url) : new THREE.TextureLoader().load(url);")
if old not in code:
    sys.exit("ponto de integração do loader não encontrado: a fábrica mudou, revisar o sync")
code = code.replace(old, new, 1)

spec = json.load(open(SPEC, encoding="utf-8"))
patched = 0
for comp in spec["componentTree"]:
    seg = comp.get("geometryDescriptor", {}).get("preSubdivisionSegments")
    if not seg:
        continue
    var = "mesh_" + re.sub(r"[^a-zA-Z0-9]", "_", comp["id"])
    m = re.search(rf"const {var}_\d+Geometry = \(\(\) => \{{", code)
    if not m:
        sys.exit(f"bloco de geometria de {comp['id']} não encontrado")
    i = code.find("new THREE.BoxGeometry(1, 1, 1)", m.end())
    if i < 0 or i - m.end() > 600:
        sys.exit(f"BoxGeometry de {comp['id']} não encontrada no bloco")
    code = code[:i] + f"new THREE.BoxGeometry(1, 1, 1, {seg[0]}, {seg[1]}, {seg[2]})" + code[i + len("new THREE.BoxGeometry(1, 1, 1)"):]
    patched += 1

header = ("// GERADO pelo img2threejs (forge/stage3_build/generate_threejs_factory.py) e integrado por 3d/sync_factory.py.\n"
          "// Não editar aqui: editar a spec, regenerar e sincronizar.\n")
DST.write_text(header + code, encoding="utf-8")
print(f"sync ok: {DST} (segmentos aplicados em {patched} componentes)")
