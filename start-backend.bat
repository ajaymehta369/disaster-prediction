@echo off
echo ============================================
echo   DisasterGuard - Starting Python Backend
echo ============================================

cd /d "%~dp0backend"

:: Check if virtual environment exists
if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo [*] Installing dependencies...
pip install -r requirements.txt --quiet

:: Run the server
echo [*] Starting FastAPI server on http://localhost:8000
echo [*] API Docs at http://localhost:8000/docs
echo ============================================
python main.py
