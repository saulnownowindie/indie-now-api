@echo off
setlocal
cd /d "%~dp0"

echo Procesando previews pendientes (una sola vez)...
python worker.py --once

echo.
pause
endlocal
