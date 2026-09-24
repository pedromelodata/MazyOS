' Sobe o servidor sem janela. Usado pelo atalho da pasta Inicializar do Windows.
Set fso = CreateObject("Scripting.FileSystemObject")
ExecuteGlobal fso.OpenTextFile(fso.BuildPath(fso.GetParentFolderName(WScript.ScriptFullName), "comum.vbs")).ReadAll
Subir
