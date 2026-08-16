@echo off
rem Launcher for the portable DSH Desktop build (dsh-desktop.exe).
rem Optional args: --dsh-root <path> [--node <path>] [--home <path>]
setlocal
cd /d "%~dp0"
if not exist "%~dp0dsh-desktop.exe" (
  echo dsh-desktop.exe not found. Build it first: node scripts/release.mjs
  pause
  exit /b 1
)
start "" "%~dp0dsh-desktop.exe" %*
