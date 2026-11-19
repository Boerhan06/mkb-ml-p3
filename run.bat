@echo off
title VibraCheck Fullstack Launcher
echo ============================================================
echo   Menjalankan VibraCheck Fullstack (FastAPI + Next.js)
echo ============================================================
echo.

:: 1. Cek Python Virtual Environment
if not exist ".\.venv\Scripts\uvicorn.exe" (
    echo [ERROR] Virtual environment .venv tidak ditemukan!
    echo Harap buat virtual environment terlebih dahulu:
    echo   python -m venv .venv
    echo   .\.venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

:: 2. Cek direktori web
if not exist "web\package.json" (
    echo [ERROR] Folder web tidak ditemukan!
    pause
    exit /b 1
)

echo [1/2] Menyalakan Backend FastAPI di port 8000...
start "VibraCheck Backend (FastAPI)" cmd /k "title VibraCheck Backend && .\.venv\Scripts\uvicorn.exe app.api.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Menyalakan Frontend Next.js di port 3000...
start "VibraCheck Frontend (Next.js)" cmd /k "title VibraCheck Frontend && cd web && npm run dev"

echo.
echo ============================================================
echo   Kedua server berhasil dijalankan!
echo   - Backend API  : http://127.0.0.1:8000/docs
echo   - Frontend Web : http://localhost:3000
echo ============================================================
echo.
echo Tekan tombol apa saja untuk menutup jendela peluncur ini
echo (Server backend dan frontend akan tetap berjalan di jendela masing-masing).
pause >nul
