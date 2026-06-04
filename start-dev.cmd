@echo off
REM 这个文件是 Windows CMD 一键启动入口。
REM 你双击它，它会调用 start-dev.ps1 完成真正的启动流程。

REM 切换到本文件所在目录，也就是项目根目录。
cd /d "%~dp0"

REM 使用 ExecutionPolicy Bypass，避免 PowerShell 执行策略拦截本地脚本。
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"

REM 记录 PowerShell 脚本返回的退出码。
set EXIT_CODE=%ERRORLEVEL%

REM 如果退出码不是 0，就说明启动失败。
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] start-dev.ps1 failed with code %EXIT_CODE%.
)

REM 双击运行时保留窗口，方便新手复制错误日志。
echo.
echo Press any key to close this window...
pause >nul

REM 把退出码传回给系统。
exit /b %EXIT_CODE%
