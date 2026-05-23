# Levanta Next.js en una nueva ventana y espera a que este listo, luego inicia el cron loop.

Write-Host "Iniciando servidor Next.js..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Esperando que el server este listo en :3001" -ForegroundColor Yellow
$listo = $false
while (-not $listo) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3001/api/eapi/cron/inactividad" `
            -Method POST `
            -Headers @{ "Authorization" = "Bearer g5tart_cr0n_9xK2mPqNvLwRjHdYeZbAoFuIcTsX8n4" } `
            -UseBasicParsing -ErrorAction Stop
        $listo = $true
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "Server listo. Cron iniciado (cada 5 min)." -ForegroundColor Green

while ($true) {
    try {
        $resp = Invoke-WebRequest `
            -Uri "http://localhost:3001/api/eapi/cron/inactividad" `
            -Method POST `
            -Headers @{ "Authorization" = "Bearer g5tart_cr0n_9xK2mPqNvLwRjHdYeZbAoFuIcTsX8n4" } `
            -UseBasicParsing
        Write-Host "$(Get-Date -Format 'HH:mm:ss') cron → $($resp.Content)" -ForegroundColor DarkGray
    } catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') cron error → $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds 300
}
