#Requires -Version 5.1
<#
.SYNOPSIS
    MoneyTrack Pro 一键启动脚本
.DESCRIPTION
    自动清理残留进程 → 启动 PostgreSQL → Backend → Metro → 模拟器 → ADB 连接
.NOTES
    用法：powershell -ExecutionPolicy Bypass -File "E:\项目合集\理财app\scripts\start-dev.ps1"
#>

$ErrorActionPreference = "Continue"
$ProjectRoot = "E:\项目合集\理财app"
$BackendDir = "$ProjectRoot\apps\backend"
$MobileDir  = "$ProjectRoot\apps\mobile"
$EmulatorExe = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
$AdbExe      = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$AvdName     = "Pixel_7_API_34"

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "   [X] $msg" -ForegroundColor Red }

# ============================================================
# Step 1: 清理残留的 moneytrack 相关 node 进程
# ============================================================
Write-Step "清理残留进程"

$allProcesses = Get-CimInstance Win32_Process
$moneytrackProcs = $allProcesses | Where-Object {
    $_.CommandLine -like "*理财app*" -or $_.CommandLine -like "*moneytrack*"
}

if ($moneytrackProcs.Count -gt 0) {
    Write-Warn "发现 $($moneytrackProcs.Count) 个残留进程，正在清理..."
    foreach ($proc in $moneytrackProcs) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    Start-Sleep -Seconds 2
    Write-OK "残留进程已清理"
} else {
    Write-OK "没有残留进程"
}

# ============================================================
# Step 2: 检查端口是否被占用
# ============================================================
Write-Step "检查端口"

$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
$port4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue

if ($port8081) {
    Write-Warn "端口 8081 仍被占用，强制释放..."
    $port8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}
Write-OK "端口 8081 可用"

if ($port4000) {
    Write-Warn "端口 4000 仍被占用，强制释放..."
    $port4000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}
Write-OK "端口 4000 可用"

# ============================================================
# Step 3: 确认 PostgreSQL 运行
# ============================================================
Write-Step "检查 PostgreSQL"

$pgService = Get-Service "postgresql-x64-16" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-OK "PostgreSQL 正在运行"
} elseif ($pgService) {
    Write-Warn "PostgreSQL 未运行，正在启动..."
    Start-Service "postgresql-x64-16"
    Start-Sleep -Seconds 3
    Write-OK "PostgreSQL 已启动"
} else {
    Write-Fail "PostgreSQL 服务不存在，请手动安装"
}

# ============================================================
# Step 4: 启动 Backend（新窗口）
# ============================================================
Write-Step "启动 Backend (port 4000)"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$BackendDir'; Write-Host 'Backend starting on port 4000...' -ForegroundColor Cyan; pnpm dev"
) -WindowStyle Normal

Write-OK "Backend 窗口已打开"

# ============================================================
# Step 5: 启动 Metro Bundler（新窗口）
# ============================================================
Write-Step "启动 Metro Bundler (port 8081)"

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$MobileDir'; Write-Host 'Metro starting on port 8081...' -ForegroundColor Cyan; pnpm dev"
) -WindowStyle Normal

Write-OK "Metro 窗口已打开"

# ============================================================
# Step 6: 等待端口就绪
# ============================================================
Write-Step "等待服务启动"

$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    $ready8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
    $ready4000 = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    if ($ready8081 -and $ready4000) { break }
    Start-Sleep -Seconds 2
    $waited += 2
    Write-Host "." -NoNewline
}

Write-Host ""
if (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue) {
    Write-OK "Metro 已就绪 (8081)"
} else {
    Write-Warn "Metro 还未就绪，请检查 Metro 窗口"
}
if (Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue) {
    Write-OK "Backend 已就绪 (4000)"
} else {
    Write-Warn "Backend 还未就绪，请检查 Backend 窗口"
}

# ============================================================
# Step 7: 检查/启动模拟器
# ============================================================
Write-Step "检查模拟器"

$emulatorRunning = & $AdbExe devices 2>&1 | Select-String "emulator-"
if ($emulatorRunning) {
    Write-OK "模拟器已在运行"
} else {
    Write-Warn "模拟器未运行，正在启动（约 30-60 秒）..."
    Start-Process $EmulatorExe -ArgumentList "-avd $AvdName", "-no-snapshot-load"
    Write-Host "   等待模拟器启动" -NoNewline
    & $AdbExe wait-for-device
    $bootCheck = 0
    while ($bootCheck -lt 30) {
        $bootAnim = & $AdbExe shell getprop sys.boot_completed 2>&1
        if ($bootAnim.Trim() -eq "1") { break }
        Start-Sleep -Seconds 2
        $bootCheck += 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    Write-OK "模拟器已启动"
}

# ============================================================
# Step 8: ADB 端口转发
# ============================================================
Write-Step "设置 ADB 端口转发"

& $AdbExe reverse tcp:8081 tcp:8081 2>&1 | Out-Null
& $AdbExe reverse tcp:4000 tcp:4000 2>&1 | Out-Null
Write-OK "tcp:8081 -> localhost:8081"
Write-OK "tcp:4000 -> localhost:4000"

$reverses = & $AdbExe reverse --list 2>&1
if ($reverses -match "8081" -and $reverses -match "4000") {
    Write-OK "端口转发验证通过"
} else {
    Write-Fail "端口转发设置失败，请手动执行: adb reverse tcp:8081 tcp:8081"
}

# ============================================================
# Step 9: 启动 App
# ============================================================
Write-Step "启动 App"

& $AdbExe shell am force-stop com.moneytrack.pro 2>&1 | Out-Null
Start-Sleep -Seconds 1
& $AdbExe shell am start -n com.moneytrack.pro/.MainActivity 2>&1 | Out-Null
Start-Sleep -Seconds 3
Write-OK "App 已启动"

# ============================================================
# Step 10: 等待并验证 JS Bundle 加载
# ============================================================
Write-Step "等待 JS Bundle 加载"

Start-Sleep -Seconds 8

# Dump UI and check
& $AdbExe shell "uiautomator dump /sdcard/_check.xml" 2>&1 | Out-Null
$uiContent = & $AdbExe shell "cat /sdcard/_check.xml" 2>&1
$uiText = [regex]::Matches($uiContent, 'text="([^"]+)"') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -ne "" } | Join-String -Separator " "

if ($uiText -match "首页|记账|统计|预算|设置|登录|本月支出") {
    Write-OK "JS Bundle 加载成功！App 正在运行。"
} elseif ($uiText -match "Development Build|DevLauncher|Enter URL") {
    Write-Warn ""
    Write-Warn "App 停在了 DevLauncher 页面，请在模拟器中操作："
    Write-Host ""
    Write-Host "   方式1: 点击 'Development servers' 下显示的 URL" -ForegroundColor Yellow
    Write-Host "   方式2: 点击 'Enter URL manually'" -ForegroundColor Yellow
    Write-Host "          输入 http://localhost:8081" -ForegroundColor Yellow
    Write-Host "          点击 Connect" -ForegroundColor Yellow
} else {
    Write-Warn "无法确认 App 状态，请查看模拟器屏幕"
}

# ============================================================
# 完成
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " 全部启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Backend : http://localhost:4000" -ForegroundColor White
Write-Host " Metro   : http://localhost:8081" -ForegroundColor White
Write-Host " 数据库  : PostgreSQL (localhost:5432)" -ForegroundColor White
Write-Host ""
Write-Host " 关闭方式：关闭 Backend 和 Metro 两个 PowerShell 窗口即可" -ForegroundColor Gray
Write-Host ""
