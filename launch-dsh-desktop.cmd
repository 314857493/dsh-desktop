@echo off
rem Launch the DSH Desktop app (green exe).
rem Optional: pass --dsh-root / --node / --home args, e.g.:
rem   "%~dp0dsh-desktop.exe" --dsh-root <本地DSH源码路径>
setlocal
cd /d "%~dp0"
start "" "%~dp0dsh-desktop.exe" %*
