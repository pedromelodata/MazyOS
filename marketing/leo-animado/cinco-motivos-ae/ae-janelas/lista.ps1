param([switch]$Clicar)
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class Jan {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  public static string Texto(IntPtr h) { var s = new StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
  public static string Classe(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  public static List<IntPtr> Topo(uint pid) {
    var r = new List<IntPtr>();
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) r.Add(h); return true; }, IntPtr.Zero);
    return r;
  }
  public static List<IntPtr> Filhas(IntPtr pai) {
    var r = new List<IntPtr>();
    EnumChildWindows(pai, (h, l) => { r.Add(h); return true; }, IntPtr.Zero);
    return r;
  }
}
"@
$procs = Get-Process -Name AfterFX -ErrorAction SilentlyContinue
if (-not $procs) { "AfterFX nao esta rodando"; exit }
foreach ($p in $procs) {
  "processo $($p.Id) responde=$($p.Responding)"
  foreach ($h in [Jan]::Topo([uint32]$p.Id)) {
    "  janela $h classe=[$([Jan]::Classe($h))] titulo=[$([Jan]::Texto($h))]"
    if ([Jan]::Classe($h) -eq "#32770") {
      foreach ($f in [Jan]::Filhas($h)) {
        $c = [Jan]::Classe($f); $t = [Jan]::Texto($f)
        "    filha $f classe=[$c] texto=[$t]"
        if ($Clicar -and $c -eq "Button" -and ($t -eq "OK" -or $t -eq "&OK")) {
          [void][Jan]::PostMessage($f, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero)
          "    >>> clique enviado no OK"
        }
      }
    }
  }
}
