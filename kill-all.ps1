# KAVACH Port Nuke Script
# How to run: Open PowerShell and type: .\kill-all.ps1

Write-Host "--- KAVACH PORT KILLER ---" -ForegroundColor Red
$Ports = @(4000, 8000, 5287)

foreach ($Port in $Ports) {
    Write-Host "Checking port $Port..." -NoNewline
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique
        foreach ($ProcId in $pids) {
            if ($ProcId -gt 0) {
                Write-Host " [Killing PID $ProcId]" -ForegroundColor Yellow
                Stop-Process -Id $ProcId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host " [Clear]" -ForegroundColor Green
    }
}

Write-Host "Cleanup complete. All project ports are now free." -ForegroundColor Cyan
