; NeuralShell NSIS Installer Customization
; Included by electron-builder

!macro customInit
  ; Check if previous version exists and warn about upgrade
  IfFileExists "$INSTDIR\NeuralShell.exe" 0 +3
    DetailPrint "Previous installation detected. Upgrading..."
    Sleep 500
!macroend

!macro customInstall
  ; Create uninstaller registry entries
  WriteRegStr HKCU "Software\NeuralShell" "Version" "2.1.29"
  WriteRegStr HKCU "Software\NeuralShell" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\NeuralShell" "InstallDate" "${__DATE__}"
!macroend

!macro customUnInstall
  ; Clean up registry on uninstall
  DeleteRegKey HKCU "Software\NeuralShell"
!macroend
