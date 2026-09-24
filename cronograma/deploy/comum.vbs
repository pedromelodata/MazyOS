' Funções compartilhadas pelos atalhos da Gestão de Marketing.
Const PORTA = 4317

Function NoAr()
  On Error Resume Next
  Dim http
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 1000, 1000, 1500, 1500
  http.Open "GET", "http://127.0.0.1:" & PORTA & "/api/auth/estado", False
  http.Send
  NoAr = (Err.Number = 0 And http.Status = 200)
End Function

Sub Subir()
  If NoAr() Then Exit Sub
  Dim fso, sh, app
  Set fso = CreateObject("Scripting.FileSystemObject")
  app = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
  Set sh = CreateObject("WScript.Shell")
  sh.CurrentDirectory = app
  ' janela oculta (0); a saída vai pro log pra diagnóstico
  sh.Run "cmd /c node server\server.mjs >> data\servidor.log 2>&1", 0, False
End Sub
