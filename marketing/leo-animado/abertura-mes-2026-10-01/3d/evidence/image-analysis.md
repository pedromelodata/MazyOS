# Image analysis: ref-calendario.png (brand clay calendar icon, 512x512, cream bg)

L1 Identification: stylized desk/wall calendar block icon (clay illustration). primaryDomain=object, confidence 0.95.
L2 Form & silhouette: thick rounded cuboid slab (W:H:D ~ 1.00 : 1.05 : 0.30), large corner radius (~0.12 W),
soft bevels on every edge; two binder rings = torus segments (~250 deg arc) rising from the top face and
looping forward over the top-front; front face carries a raised grid of rounded-square studs.
Shape language organic/soft (hand-pressed clay), no hard edges. Asymmetric only in stud layout.
L3 Decomposition: macro = body slab, binder ring L, binder ring R. meso = stud grid (4 columns x 5 rows,
16 studs present: row1 cols 3-4, rows 2-3 all 4, rows 4-5 cols 1-3), accent stud (row 2 col 3, coral).
micro = clay surface undulation (low-amplitude relief), soft contact shading at stud bases.
L4 Spatial: <ring, embedded-in, body top face> (rings enter the top face ~1/3 depth from front, exit
~20% down the front face: overlap/embed contact); <stud, attached-to, body front face> (raised ~0.04 W, embed);
<accent stud, replaces, stud r2c3>.
L5 Materials (PBR): all dielectric (metalness 0). Body clay: matte, roughness ~0.85, opaque, faint
subsurface softness (inference). Studs: same clay, roughness ~0.8. Rings and accent: coral clay, roughness ~0.8.
L6 Color & finish: body off-white cream (high value, low saturation, ~#EAE3DA), studs warm beige
(~#D8C8B0), rings/accent coral (~#E8613E vivid, mid value). Finish matte, no specular hotspots.
L7 Identity features: two coral binder rings over the top edge; coral accent stud in the grid; beige stud
grid with month-like missing cells (empty top-left corner); thick soft slab silhouette.
L8 Uncertainty: back face hidden (assumed flat, same clay); bottom face hidden; ring cross-section assumed
circular; exact slab depth inferred from the 3/4 view (perspective). No text in the reference.

Intended use: animated hero prop in a Remotion/@remotion/three video. Adaptation for the piece (outside the
reference, flagged as stylization): the front face becomes a stack of flippable pages hinged at the ring axis,
each page carrying a month label (canvas texture, Sora 800) on a header strip.
