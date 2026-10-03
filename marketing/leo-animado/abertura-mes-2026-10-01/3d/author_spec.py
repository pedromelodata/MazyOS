# Preenche object-sculpt-spec.json (img2threejs) com o calendário clay da marca, a partir da análise em evidence/.
import json, copy

P = "object-sculpt-spec.json"
s = json.load(open(P, encoding="utf-8"))
base = copy.deepcopy(s["componentTree"][0])
s["suitability"] = "pass"
s["scores"] = {"object_isolation": 0.95, "silhouette_readability": 0.9, "depth_inference": 0.7, "primitive_decomposition": 0.85,
               "material_procedurality": 0.85, "occlusion_risk": 0.2, "interaction_fit": 0.8}
s["coordinateFrame"] = {"front": "+Z, the face carrying the stud grid", "up": "+Y", "scaleReference": "body width = 1.0 relative unit"}
s["silhouette"] = {
    "boundingShape": "pillowed rounded cuboid slab with two torus rings rising above the top edge",
    "aspectRatios": ["width:height:depth = 1.00:1.05:0.30", "ring outer diameter = 0.34 of body width"],
    "symmetry": "bilateral for slab and rings (mirror across x=0); stud grid asymmetric (month layout)",
    "dominantCurves": ["large corner radius ~0.12 W on the slab", "ring arcs looping front-to-back over the top edge"],
    "negativeSpaces": ["ring holes above the top edge", "empty top-left zone of the stud grid"],
    "landmarks": ["ring centers at x=+-0.20 W on the top edge", "coral accent stud at row 2 col 3"],
}
s["viewEvidence"][0]["observations"] = ["front three-quarter view from upper right", "matte clay, no specular hotspots",
                                        "rings coral, studs beige, body cream"]
s["viewEvidence"][0]["confidence"] = 0.85


def comp(cid, name, level, role, prim, dims, pos, rot=(0, 0, 0), parent="root", mat="clay-cream", topo="assembled-solid",
         rationale="", subdiv=0, extra_desc=None, attach=None, anim="static-child", pivot=None, axis=(0, 1, 0), conf=0.8,
         feats=None, tier="blockout"):
    c = copy.deepcopy(base)
    c.update({"id": cid, "name": name, "level": level, "role": role, "primitive": prim,
              "importance": 1.0 if level == "macro" else 0.6, "confidence": conf, "topologyClass": topo,
              "topologyRationale": rationale, "parent": parent, "attachment": attach, "material": mat,
              "materialLayers": [mat], "localFeatures": feats or [], "fidelityTier": tier,
              "dimensions": {"width": dims[0], "height": dims[1], "depth": dims[2], "units": "relative", "confidence": conf},
              "transform": {"position": list(pos), "rotation": list(rot), "scale": [1, 1, 1]}})
    gd = c["geometryDescriptor"]
    gd["topologyIntent"] = "soft clay solid rounded by subdivision" if subdiv else "clay solid"
    gd["edgeTreatment"] = {"type": "subdivision-round" if subdiv else "none", "bevelRadius": 0.0, "segments": 1}
    if subdiv:
        gd["subdivide"] = {"iterations": subdiv}
    if extra_desc:
        gd.update(extra_desc)
    ap = c["actionProfile"]
    ap["animationRole"] = anim
    ap["pivot"] = {"mode": "custom" if pivot else "center", "localPosition": list(pivot or (0, 0, 0)), "axis": list(axis),
                   "confidence": conf}
    ap["destruction"]["fractureGroup"] = cid
    ap["collider"]["scale"] = list(dims)
    c["evidenceRefs"] = ["full-object"]
    return c


comps = [comp("root", "Calendar body slab", "macro", "body", "box", (1.0, 1.05, 0.30), (0, 0, 0), parent=None,
              rationale="Hand-pressed clay slab: a box rounded by 2 subdivision iterations gives the pillowed faces and large corner radius.",
              subdiv=2, anim="root",
              feats=[{"id": "soft-bevel", "description": "large corner radius and pillowed faces", "evidenceRef": "full-object"}])]
for side, x in (("l", -0.20), ("r", 0.20)):
    comps.append(comp(
        f"ring-{side}", f"Binder ring {side.upper()}", "macro", "binder-ring", "torus", (0.34, 0.34, 0.34), (x, 0.50, 0.02),
        (0, 90, 0), mat="clay-coral",
        rationale="Ring is a torus; its lower half is embedded in the slab so the visible part reads as the arc in the reference.",
        extra_desc={"torusTubeRatio": 0.2},
        attach={"parentSocket": "top-face", "localStart": [x, 0.525, 0.02], "localEnd": [x, 0.70, 0.02], "contactType": "embed",
                "embedDepth": 0.15, "overlap": 0.0, "gapTolerance": 0.01},
        feats=[{"id": "binder-rings", "description": "coral torus ring looping over the top edge", "evidenceRef": "full-object"}]))
comps.append(comp(
    "page-front", "Front page (flips on ring axis)", "meso", "hinged-page", "box", (0.86, 0.80, 0.035), (0, -0.075, 0.16),
    rationale="Thin clay sheet flush on the front face; carries the stud grid and hinges at the ring axis for the month flip.",
    subdiv=1,
    attach={"parentSocket": "front-face", "localStart": [0, 0.325, 0.16], "localEnd": [0, -0.475, 0.16], "contactType": "overlap",
            "embedDepth": 0.0, "overlap": 0.01, "gapTolerance": 0.01},
    anim="hinge", pivot=(0, 0.40, 0), axis=(1, 0, 0)))
cols = [-0.285, -0.095, 0.095, 0.285]
rows = [0.20, 0.04, -0.12, -0.28, -0.44]
present = {0: [2, 3], 1: [0, 1, 2, 3], 2: [0, 1, 2, 3], 3: [0, 1, 2], 4: [0, 1, 2]}
stud_ids = []
for r, cs in present.items():
    for c_ in cs:
        cid = f"stud-r{r + 1}c{c_ + 1}"
        stud_ids.append(cid)
        accent = (r == 1 and c_ == 2)
        comps.append(comp(
            cid, f"Grid stud row {r + 1} col {c_ + 1}" + (" (accent)" if accent else ""), "micro", "stud", "box",
            (0.135, 0.135, 0.05), (cols[c_], rows[r] + 0.075, 0.03), parent="page-front",
            mat="clay-coral" if accent else "clay-beige",
            rationale="Small rounded clay tile pressed onto the page; box rounded by one subdivision.", subdiv=1, conf=0.75,
            attach={"parentSocket": "page-face", "localStart": [cols[c_], rows[r] + 0.075, 0.0175],
                    "localEnd": [cols[c_], rows[r] + 0.075, 0.0425], "contactType": "embed", "embedDepth": 0.008, "overlap": 0.0,
                    "gapTolerance": 0.005},
            feats=[{"id": "accent-stud" if accent else "stud-grid-gaps",
                    "description": "coral accent stud" if accent else "beige grid stud", "evidenceRef": "full-object"}]))
s["componentTree"] = comps
s["repetitionSystems"] = [{
    "id": "stud-grid", "level": "micro", "parent": "page-front", "count": len(stud_ids), "primitive": "box", "material": "clay-beige",
    "elementComponentIds": stud_ids, "instanceScale": [0.135, 0.135, 0.05],
    "placement": {"mode": "grid", "axis": [0, 0, 1], "radius": 0.0, "startAngleDeg": 0,
                  "notes": "4 cols x 5 rows, month-like gaps; authored individually"},
    "evidenceRefs": ["full-object"]}]


def mat(mid, name, hexc, sec, rough):
    m = copy.deepcopy(s["materials"][0])
    m.update({"id": mid, "name": name, "baseColor": hexc, "color": hexc,
              "albedo": {"dominant": hexc, "secondary": sec, "samplingNotes": "Sampled from the clay reference; lighting-removed estimate."}})
    m["colorVariation"] = {"palette": [hexc] + sec, "pattern": "mottled clay", "amplitude": 0.05, "heightCorrelation": 0.3}
    m["roughness"] = {"base": rough, "variation": 0.06, "map": "independent-procedural-field",
                      "localResponse": "slightly higher roughness in creases"}
    m["normal"] = {"pattern": "derived-from-independent-height-field", "strength": 0.25, "scale": 18.0, "space": "tangent"}
    m["bump"] = {"pattern": "hand-pressed clay undulation", "amplitude": 0.004, "scale": 6.0}
    m["surfaceFrequencyBands"] = [
        {"id": "macro", "frequency": 2.0, "amplitude": 0.15, "role": "broad pressing undulation"},
        {"id": "meso", "frequency": 9.0, "amplitude": 0.08, "role": "finger-press dents"},
        {"id": "micro", "frequency": 48.0, "amplitude": 0.03, "role": "fine clay grain under grazing light"}]
    m["localOverrides"] = [{"id": f"{mid}-crease-ao", "mask": "cavity", "effect": "darken albedo 6% and raise roughness 0.05 in creases",
                            "evidenceRef": "full-object"}]
    m["ambientOcclusion"] = {"cavityStrength": 0.3, "contactShadowBias": 0.4,
                             "notes": "Contact shading where studs and rings meet the slab."}
    return m


s["materials"] = [mat("clay-cream", "Cream clay (body, page)", "#ECE5DC", ["#E2D9CD", "#F3EEE7"], 0.86),
                  mat("clay-beige", "Beige clay (studs)", "#D9C8AF", ["#CDBB9F", "#E3D5C0"], 0.84),
                  mat("clay-coral", "Coral clay (rings, accent)", "#E8603C", ["#D6532F", "#F07450"], 0.82)]
s["featureReviewTargets"] = [
    {"id": "overall-silhouette", "name": "Pillowed slab silhouette and proportions", "tier": "critical",
     "passIds": ["blockout", "structural-pass", "form-refinement"], "minimumScore": 0.75, "mustPass": True,
     "componentRefs": ["root"], "evidenceRefs": ["full-object"]},
    {"id": "binder-rings", "name": "Two coral rings looping over the top edge", "tier": "critical",
     "passIds": ["structural-pass", "form-refinement", "material-pass"], "minimumScore": 0.75, "mustPass": True,
     "componentRefs": ["ring-l", "ring-r"], "evidenceRefs": ["full-object"]},
    {"id": "stud-grid", "name": "Beige stud grid with month-like gaps", "tier": "critical",
     "passIds": ["structural-pass", "form-refinement"], "minimumScore": 0.7, "mustPass": True,
     "componentRefs": stud_ids, "evidenceRefs": ["full-object"]},
    {"id": "accent-stud", "name": "Coral accent stud at row 2 col 3", "tier": "important", "passIds": ["material-pass"],
     "minimumScore": 0.7, "mustPass": False, "componentRefs": ["stud-r2c3"], "evidenceRefs": ["full-object"]},
    {"id": "matte-clay", "name": "Matte clay response, no plastic highlights", "tier": "important",
     "passIds": ["material-pass", "lighting-pass"], "minimumScore": 0.7, "mustPass": False, "componentRefs": ["root"],
     "evidenceRefs": ["full-object"]}]
all_ids = [c["id"] for c in s["componentTree"]]
for bp in s["buildPasses"]:
    bp["componentRefs"] = all_ids
s["lightingFromPhoto"] = [
    {"id": "key", "type": "directional", "direction": "upper-left front", "intensity": 2.2, "color": "#FFF6EC", "notes": "soft key, wide penumbra"},
    {"id": "fill", "type": "hemisphere", "direction": "sky-ground", "intensity": 0.9, "color": "#FFFFFF", "notes": "lifts shadows; cream ground bounce"},
    {"id": "rim", "type": "directional", "direction": "back-right", "intensity": 0.6, "color": "#FFFFFF", "notes": "edge separation"}]
s["animationAnchors"] = ["root pivot: float, bob, squash on landing",
                         "page-front hinge on the ring axis (x axis at y=+0.40): month flip", "ring pivots static"]
s["risks"] = ["box subdivision may round corners more than the reference; tune iterations",
              "torus full ring must stay half-embedded to read as an arc"]
s["assumptions"] = ["flat back and bottom (hidden in the reference)", "month label decal added at runtime (not in the reference)"]
s["performanceBudget"]["targetTriangles"] = 60000
json.dump(s, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("componentes:", len(comps))

# --- correções pedidas pelo validador: notas inteiras 0..3, detalhes com kind + mapsTo.ref
s = json.load(open(P, encoding="utf-8"))
s["scores"] = {"object_isolation": 3, "silhouette_readability": 3, "depth_inference": 2, "primitive_decomposition": 3,
               "material_procedurality": 3, "occlusion_risk": 1, "interaction_fit": 2}
s["preSpecAssessment"]["complexity"]["scores"] = {"silhouetteComplexity": 1, "componentCount": 1, "hierarchyDepth": 1,
    "repetitionDensity": 1, "materialLayerCount": 1, "localDetailDensity": 1, "occlusionRisk": 1, "actionReadinessNeed": 2}
kinds = {"binder-rings": ("contour", "binder-rings"), "accent-stud": ("decal", "accent-stud"),
         "stud-grid-gaps": ("ridge", "stud-grid-gaps"), "soft-bevel": ("bevel", "soft-bevel"),
         "clay-relief": ("groove", "clay-cream-crease-ao")}
for d in s["preSpecAssessment"]["detailInventory"]["details"]:
    k, ref = kinds[d["id"]]
    d["kind"] = k
    d["mapsTo"] = {"ref": ref, "note": d.pop("mapsTo", "") if isinstance(d.get("mapsTo"), str) else ""}
json.dump(s, open(P, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("correções ok")
