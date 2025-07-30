@echo off
echo ==========================================
echo   LOLDrivers Viewer - Local Server
echo ==========================================
echo.
echo Starting Python HTTP server on port 8000...
echo Open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause
