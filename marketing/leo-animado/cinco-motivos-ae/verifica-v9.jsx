// Le o erro de cada expressao do projeto aberto, testa o valor em 3 tempos e salva como CINCO-MOTIVOS-v9.aep.
var PECA = "C:/MKT-INSTA/Content Legalizai/marketing/leo-animado/cinco-motivos-ae";
var LOGF = new File(PECA + "/verifica-v9.log");
function log(s) { try { LOGF.open("a"); LOGF.writeln(String(s)); LOGF.close(); } catch (e) {} }
function msg(e) { try { return String(e.message); } catch (x) { try { return String(e); } catch (y) { return "erro sem texto"; } } }
function curto(s) { s = String(s).replace(/[\r\n\t]+/g, " "); return s.length > 260 ? s.substr(0, 260) + "..." : s; }
var nExp = 0, nErr = 0, nNaN = 0;
function ruim(v) { if (typeof v === "number") return isNaN(v) || !isFinite(v); if (v && v.length !== undefined && typeof v !== "string") { for (var i = 0; i < v.length; i++) if (typeof v[i] === "number" && (isNaN(v[i]) || !isFinite(v[i]))) return true; } return false; }
function anda(L, g, cam) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p; try { p = g.property(i); } catch (e) { continue; }
    if (!p) continue;
    var nome = cam + "/" + p.name;
    if (p.propertyType === PropertyType.PROPERTY) {
      var tem = false; try { tem = p.canSetExpression && p.expression !== ""; } catch (e) {}
      if (!tem) continue;
      nExp++;
      var er = ""; try { er = p.expressionError; } catch (e) { er = "ler erro: " + msg(e); }
      if (er) { nErr++; if (nErr <= 40) log("ERRO " + L.containingComp.name + " :: " + L.name + " :: " + nome + " :: " + curto(er)); continue; }
      var ts = [L.inPoint + 0.1, (L.inPoint + L.outPoint) / 2, L.outPoint - 0.1];
      for (var k = 0; k < ts.length; k++) {
        try { var v = p.valueAtTime(ts[k], false); if (ruim(v)) { nNaN++; if (nNaN <= 40) log("NAN " + L.name + " :: " + nome + " t=" + ts[k].toFixed(2)); break; } }
        catch (e) { nErr++; if (nErr <= 40) log("AVAL " + L.name + " :: " + nome + " t=" + ts[k].toFixed(2) + " :: " + curto(msg(e))); break; }
      }
    } else { try { anda(L, p, nome); } catch (e) { log("grupo " + nome + ": " + msg(e)); } }
  }
}
app.beginSuppressDialogs();
try {
  for (var c = 1; c <= app.project.numItems; c++) {
    var it = app.project.item(c);
    if (!(it instanceof CompItem)) continue;
    for (var l = 1; l <= it.numLayers; l++) { var L = it.layer(l); try { anda(L, L, ""); } catch (e) { log("camada " + L.name + ": " + msg(e)); } }
    log("comp " + it.name + ": " + it.numLayers + " camadas");
  }
  log("expressoes: " + nExp + " | com erro: " + nErr + " | NaN: " + nNaN);
  var alvo = new File(PECA + "/CINCO-MOTIVOS-v9.aep");
  app.project.save(alvo);
  log("salvo: " + (app.project.file ? app.project.file.fsName : "nao"));
} catch (e) { log("ERRO GERAL: " + msg(e)); }
app.endSuppressDialogs(false);
log("fim");
