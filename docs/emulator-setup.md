# 模拟器启动指南

> 每次开发前运行一键脚本，3 分钟内完成全部启动。

---

## 一键启动（推荐）

```powershell
powershell -ExecutionPolicy Bypass -File "E:\项目合集\理财app\scripts\start-dev.ps1"
```

脚本自动执行以下步骤：
1. **清理残留进程** — 自动检测并杀掉所有旧的 moneytrack 相关 node 进程（这是启动失败的最常见原因）
2. **释放被占用的端口** — 强制释放 8081 和 4000 端口
3. **检查 PostgreSQL** — 确认数据库服务运行中，未运行则自动启动
4. **启动 Backend** — 新窗口运行 `pnpm dev` (port 4000)
5. **启动 Metro** — 新窗口运行 `pnpm dev` (port 8081)
6. **等待服务就绪** — 自动轮询端口，最多等 30 秒
7. **启动/检查模拟器** — 已运行则跳过，未运行则自动启动并等待开机完成
8. **设置 ADB 端口转发** — `adb reverse tcp:8081` 和 `tcp:4000`
9. **启动 App** — 强制重启 app 并等待 JS Bundle 加载
10. **验证结果** — 自动检查 UI 是否正常渲染，给出下一步提示

## 一键停止

```powershell
powershell -ExecutionPolicy Bypass -File "E:\项目合集\理财app\scripts\stop-dev.ps1"
```

---

## 手动启动（备用）

如果脚本不工作，手动执行以下步骤：

### 1. 清理残留进程（关键！）

```powershell
# 查看残留进程
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*理财app*" } | Select-Object ProcessId, CommandLine

# 杀掉所有残留
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*理财app*" } | Stop-Process -Force
```

> **启动失败 90% 的原因就是残留进程占用端口。** 每次启动前先清理。

### 2. 启动 PostgreSQL

```powershell
Get-Service postgresql-x64-16    # 检查状态
Start-Service postgresql-x64-16  # 启动
```

### 3. 启动 Backend

```powershell
cd "E:\项目合集\理财app\apps\backend"
pnpm dev
```

### 4. 启动 Metro

```powershell
cd "E:\项目合集\理财app\apps\mobile"
pnpm dev
```

### 5. 启动模拟器（如果未运行）

```powershell
Start-Process "C:\Users\z2213\AppData\Local\Android\Sdk\emulator\emulator.exe" -ArgumentList "-avd Pixel_7_API_34", "-no-snapshot-load"
adb wait-for-device
```

### 6. ADB 端口转发

```powershell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:4000 tcp:4000
```

### 7. 启动 App

```powershell
adb shell am force-stop com.moneytrack.pro
adb shell am start -n com.moneytrack.pro/.MainActivity
```

---

## 在模拟器中连接 Metro

模拟器打开后会显示 **DevLauncher** 界面：

1. 如果页面上有 **"Development servers"** 列出了 `http://10.0.2.2:8081`，**直接点击它**
2. 如果没有自动发现，点击 **"Enter URL manually"**
3. 清空输入框，输入 `http://localhost:8081`
4. 点击 **"Connect"**

---

## 服务端口

| 服务 | 端口 | 用途 |
|------|------|------|
| Metro Bundler | `8081` | 前端 JS 热更新 |
| Backend API | `4000` | 后端接口 |
| PostgreSQL | `5432` | 数据库（开机自启） |

---

## 环境信息

| 项目 | 值 |
|------|-----|
| 模拟器名 | `Pixel_7_API_34` |
| 模拟器路径 | `C:\Users\z2213\AppData\Local\Android\Sdk\emulator\emulator.exe` |
| ADB 路径 | `C:\Users\z2213\AppData\Local\Android\Sdk\platform-tools\adb.exe` |
| 项目路径 | `E:\项目合集\理财app` |
| 启动脚本 | `E:\项目合集\理财app\scripts\start-dev.ps1` |
| 停止脚本 | `E:\项目合集\理财app\scripts\stop-dev.ps1` |

---

## 常见问题排查

### 启动失败 / 端口被占用

**最常见原因：** 之前的 node 进程没杀干净。

```powershell
# 强制清理所有 moneytrack 相关进程
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*理财app*" } | Stop-Process -Force
Start-Sleep -Seconds 2
# 然后重新启动
```

### 底部导航栏图标消失

**原因：** App 停在 DevLauncher，没有加载到 JS bundle。
**解决：** 在 DevLauncher 中连接到 Metro（参考"在模拟器中连接 Metro"部分）。

### Metro 连接成功但 App 白屏/报错

```powershell
# 检查后端是否正常
Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" -UseBasicParsing
```

### WebSocket 报错 `Failed to connect to /10.0.2.2:8081`

**不影响使用。** 这是 DevClient 的 HMR 热更新 WebSocket，app 正常运行不受影响。

### VPN 干扰

Clash 等 VPN 可能影响网络连接，**关闭 VPN** 后重试。

### 路径含中文

Android 构建工具不支持中文路径。如果需要 `prebuild`，在英文路径下操作。
