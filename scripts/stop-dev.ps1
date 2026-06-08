# 快速停止所有 MoneyTrack 开发服务
Write-Host "正在停止所有 MoneyTrack 服务..." -ForegroundColor Cyan

$procs = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -like "*理财app*" -or $_.CommandLine -like "*moneytrack*"
}

if ($procs.Count -gt 0) {
    foreach ($p in $procs) {
        try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
    }
    Write-Host "已停止 $($procs.Count) 个进程" -ForegroundColor Green
} else {
    Write-Host "没有运行中的 MoneyTrack 进程" -ForegroundColor Gray
}

# 关闭打开的 Backend/Metro 窗口
Get-Process powershell -ErrorAction SilentlyContinue | Where-Object {
    (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine -match "理财app.*pnpm dev"
} | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force } catch {}
}

Write-Host "完成！" -ForegroundColor Green
