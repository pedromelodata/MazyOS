# Piscadas nos takes v2 (720p): semelhança de cada olho com o olho aberto do 1º quadro do próprio take.
import subprocess, numpy as np, cv2, sys, json
res = {}
for t in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg","-v","error","-i",f"takes/{t}.mp4","-f","rawvideo","-pix_fmt","gray","-"],capture_output=True,check=True).stdout
    F = np.frombuffer(raw,np.uint8).reshape(-1,1280,720)
    EY = {"E": (291, 466), "D": (426, 465)}; r = 20
    ref = F[2]
    S = {k: [] for k in EY}
    for f in F:
        for k,(x,y) in EY.items():
            s = 46; m = cv2.matchTemplate(f[y-r-s:y+r+s, x-r-s:x+r+s], ref[y-r:y+r, x-r:x+r], cv2.TM_CCOEFF_NORMED)
            S[k].append(float(m.max()))
    E, D = np.array(S["E"]), np.array(S["D"])
    both = (E < 0.55) & (D < 0.55)
    ev = []; i = 0
    while i < len(both):
        if both[i]:
            j = i
            while j < len(both) and both[j]: j += 1
            if j - i >= 2: ev.append((round(i/30,2), j-i))
            i = j
        else: i += 1
    res[t] = ev
    print(t, "piscadas:", ev, f"| {len(ev)} em {len(F)/30:.1f}s | semelhança mediana E {np.median(E):.2f} D {np.median(D):.2f}")
json.dump(res, open("takes/olhos-v2.json","w"))
