    @echo off
echo Starting Chatbot Application...
echo.

echo Starting Backend Server...
cd /d "d:\E\chatbot\backend"
start "Backend Server" cmd /k "python nhap.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Development Server...
cd /d "d:\E\chatbot\frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (or check the frontend terminal for the actual port)
echo.
echo Press any key to exit...
pause > nul