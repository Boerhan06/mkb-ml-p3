# VibraCheck Fullstack Launcher (PowerShell)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Menjalankan VibraCheck Fullstack (FastAPI + Next.js)" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Bebaskan port 8000 & 3000 jika ada proses lama yang masih mengunci port
Get-NetTCPConnection -LocalPort 8000, 3000 -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 0 } |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

if (-not (Test-Path ".\.venv\Scripts\uvicorn.exe")) {
    Write-Host "[ERROR] Virtual environment .venv tidak ditemukan!" -ForegroundColor Red
    Write-Host "Jalankan instalasi dependensi terlebih dahulu." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/2] Menyalakan Backend FastAPI di port 8000..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k "title VibraCheck Backend && .\.venv\Scripts\uvicorn.exe app.api.main:app --reload --host 127.0.0.1 --port 8000"'

Write-Host "[2/2] Menyalakan Frontend Next.js di port 3000..." -ForegroundColor Green
Start-Process cmd -ArgumentList '/k "title VibraCheck Frontend && cd web && npm run dev"'

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  Kedua server berhasil dijalankan!" -ForegroundColor Green
Write-Host "  - Backend API  : http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "  - Frontend Web : http://localhost:3000" -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor Cyan
