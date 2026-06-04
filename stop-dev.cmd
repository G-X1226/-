@echo off
REM 这个文件用于停止本地 Docker 开发环境。
REM 你可以把它理解成“关店按钮”：停止 PostgreSQL、Redis 等 compose 服务。

REM 切换到本文件所在目录，也就是项目根目录。
cd /d "%~dp0"

REM 打印提示，告诉你正在停止 Docker Compose 服务。
echo [INFO] Stopping Docker services...

REM 按需求执行 docker compose down。
docker compose down

REM 如果 docker compose down 失败，给出清楚错误。
if errorlevel 1 (
  echo.
  echo [ERROR] docker compose down failed. Please make sure Docker Desktop is running.
  echo.
  pause
  exit /b 1
)

REM 成功停止后打印 OK。
echo [OK] Docker services stopped

echo.
echo Press any key to close this window...
pause >nul

REM 正常退出。
exit /b 0
