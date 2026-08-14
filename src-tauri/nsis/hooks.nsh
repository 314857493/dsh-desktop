; NSIS hooks for the DSH Desktop installer.
; Creates a desktop shortcut pointing at the installed app, with the icon
; taken from the shipped dsh-desktop.ico (independent of exe icon extraction).
!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\DSH Desktop.lnk" "$INSTDIR\dsh-desktop.exe" "" "$INSTDIR\dsh-desktop.ico"
!macroend
