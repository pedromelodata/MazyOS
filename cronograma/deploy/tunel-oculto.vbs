' Sobe o tunel publico permanente da Gestao de Marketing (cloudflared) sem janela. Usado pelo atalho da pasta
' Inicializar criado por deploy\tunel-permanente.ps1. Se o tunel ja estiver rodando, nao faz nada.
Const TUNEL = "cronograma-legalizai"
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
For Each p In GetObject("winmgmts:\\.\root\cimv2").ExecQuery("select CommandLine from Win32_Process where Name='cloudflared.exe'")
  If InStr(1, p.CommandLine & "", TUNEL, 1) > 0 Then WScript.Quit
Next
cf = sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\cloudflared\cloudflared.exe"
If Not fso.FileExists(cf) Then cf = "cloudflared"
config = sh.ExpandEnvironmentStrings("%USERPROFILE%") & "\.cloudflared\config.yml"
app = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
logArq = fso.BuildPath(app, "data\tunel-permanente.log")
sh.Run """" & cf & """ tunnel --no-autoupdate --config """ & config & """ --logfile """ & logArq & """ run " & TUNEL, 0, False
