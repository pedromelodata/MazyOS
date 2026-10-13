# Fecha o alerta de erro de script do AE (dialogo #32770 sem titulo com o botao OK desenhado pelo Drover).
# So age se a janela tiver o tamanho do alerta e nao for a de progresso do script.
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class Ok {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Rt, B; }
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  public static string Texto(IntPtr h) { var s = new StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
  public static string Classe(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  public static List<IntPtr> Alertas(uint pid) {
    var r = new List<IntPtr>();
    EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p);
      if (p == pid && IsWindowVisible(h) && Classe(h) == "#32770" && Texto(h) == "") r.Add(h); return true; }, IntPtr.Zero);
    return r;
  }
}
"@
$p = Get-Process -Name AfterFX -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $p) { "AfterFX nao esta rodando"; exit }
$al = [Ok]::Alertas([uint32]$p.Id)
if ($al.Count -eq 0) { "nenhum alerta aberto"; exit }
foreach ($h in $al) {
  $r = New-Object Ok+R; [void][Ok]::GetWindowRect($h, [ref]$r)
  "alerta $h tamanho $($r.Rt - $r.L) x $($r.B - $r.T)"
  [void][Ok]::SetForegroundWindow($h)
  [void][Ok]::PostMessage($h, 0x0100, [IntPtr]0x0D, [IntPtr]0x001C0001)
  [void][Ok]::PostMessage($h, 0x0101, [IntPtr]0x0D, [IntPtr]0xC01C0001)
  "  Enter enviado"
}
Start-Sleep -Milliseconds 800
$resta = [Ok]::Alertas([uint32]$p.Id)
"alertas restantes: $($resta.Count)"
