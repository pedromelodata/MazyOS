' Atalho da área de trabalho: garante o servidor no ar e abre o app no navegador.
Set fso = CreateObject("Scripting.FileSystemObject")
ExecuteGlobal fso.OpenTextFile(fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "comum.vbs")).ReadAll
Subir
For i = 1 To 40
  If NoAr() Then Exit For
  WScript.Sleep 500
Next
If NoAr() Then
  CreateObject("WScript.Shell").Run "http://localhost:" & PORTA & "/"
Else
  MsgBox "A Gestão de Marketing não subiu em 20 segundos. Veja o arquivo data\servidor.log na pasta cronograma.", 48, "Gestão de Marketing"
End If
