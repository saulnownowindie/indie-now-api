@echo off
setlocal
cd /d "%~dp0"

echo Iniciando worker de previews en bucle...
python worker.py

if errorlevel 1 (
  echo.
  echo El worker termino con error. Revisa el mensaje de arriba.
  pause
)

endlocal
