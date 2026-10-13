param([long]$Hwnd, [string]$Saida)
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Foto {
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Rt, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out R r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
}
"@
$h = [IntPtr]$Hwnd
$r = New-Object Foto+R
[void][Foto]::GetWindowRect($h, [ref]$r)
$w = $r.Rt - $r.L; $a = $r.B - $r.T
"retangulo: $($r.L),$($r.T) $w x $a"
if ($w -le 0 -or $a -le 0) { exit }
$bmp = New-Object System.Drawing.Bitmap $w, $a
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
$ok = [Foto]::PrintWindow($h, $hdc, 2)
$g.ReleaseHdc($hdc)
$g.Dispose()
$bmp.Save($Saida, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
"printwindow=$ok -> $Saida"
