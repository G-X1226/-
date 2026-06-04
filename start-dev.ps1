# 这个脚本是 Windows PowerShell 一键启动脚本。
# 你可以把它理解成“开店流程表”：先开数据库和 Redis，再准备 Prisma，最后打开 NestJS 后端。

# 发现错误后立刻停止，避免后面继续连环报错。
$ErrorActionPreference = "Stop"

# 取得当前脚本所在目录，也就是项目根目录。
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# 切换到项目根目录，保证 docker compose、pnpm 都在正确位置执行。
Set-Location -LiteralPath $RepoRoot

# 失败时统一打印清楚的错误信息，然后退出。
function Stop-WithError {
    param(
        # 给新手看的大白话错误原因。
        [string]$Message
    )

    # 打印空行，让错误信息更醒目。
    Write-Host ""

    # 用 [ERROR] 标记明确告诉你：这里失败了。
    Write-Host "[ERROR] $Message" -ForegroundColor Red

    # 返回失败状态码，start-dev.cmd 会据此暂停窗口。
    exit 1
}

# 检查某个命令是否存在，比如 docker 或 pnpm。
function Assert-CommandExists {
    param(
        # 需要检查的命令名称。
        [string]$CommandName
    )

    # 如果 Windows 找不到这个命令，就直接报错。
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        Stop-WithError "没有找到命令：$CommandName。请先安装它，或确认它已经加入 Windows PATH。"
    }
}

# 执行一条命令，并在失败时给出明确错误。
function Invoke-CheckedCommand {
    param(
        # 要执行的程序，比如 pnpm 或 docker。
        [string]$FilePath,

        # 程序后面的参数列表。
        [string[]]$ArgumentList,

        # 成功后要打印的状态信息。
        [string]$SuccessMessage,

        # 失败后要打印的错误信息。
        [string]$FailureMessage
    )

    # 运行命令；@ArgumentList 会把参数逐个传给程序。
    & $FilePath @ArgumentList

    # PowerShell 会把上一条外部命令的退出码放在 $LASTEXITCODE。
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError $FailureMessage
    }

    # 如果传入了成功信息，就打印出来。
    if ($SuccessMessage) {
        Write-Host $SuccessMessage -ForegroundColor Green
    }
}

# 等待 PostgreSQL 准备好，就像等仓库管理员开门。
function Wait-PostgreSqlReady {
    param(
        # 最多等待多少秒。
        [int]$TimeoutSeconds = 90
    )

    # 打印提示，让你知道脚本正在等待数据库。
    Write-Host "[INFO] 正在等待 PostgreSQL 准备就绪..."

    # 每 2 秒检查一次，直到超时。
    for ($elapsed = 0; $elapsed -lt $TimeoutSeconds; $elapsed += 2) {
        # 在 postgres 容器内部执行 pg_isready，避免你本机必须安装 psql。
        & docker compose exec -T postgres pg_isready -U postgres -d ai_gateway *> $null

        # 退出码为 0，表示 PostgreSQL 已经能接客。
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] PostgreSQL started" -ForegroundColor Green
            return
        }

        # 还没好就等 2 秒再试。
        Start-Sleep -Seconds 2
    }

    # 超过时间还没好，给出清楚错误。
    Stop-WithError "PostgreSQL 不可用。请确认 Docker Desktop 正在运行，并检查 postgres 容器日志。"
}

# 等待 Redis 准备好，就像等临时记事本服务上线。
function Wait-RedisReady {
    param(
        # 最多等待多少秒。
        [int]$TimeoutSeconds = 90
    )

    # 打印提示，让你知道脚本正在等待 Redis。
    Write-Host "[INFO] 正在等待 Redis 准备就绪..."

    # 每 2 秒检查一次，直到超时。
    for ($elapsed = 0; $elapsed -lt $TimeoutSeconds; $elapsed += 2) {
        # 在 redis 容器内部执行 redis-cli ping，正常会返回 PONG。
        $redisPing = docker compose exec -T redis redis-cli ping 2>$null

        # 如果返回 PONG，说明 Redis 已经准备好了。
        if ($LASTEXITCODE -eq 0 -and ($redisPing -join "").Trim() -eq "PONG") {
            Write-Host "[OK] Redis started" -ForegroundColor Green
            return
        }

        # 还没好就等 2 秒再试。
        Start-Sleep -Seconds 2
    }

    # 超过时间还没好，给出清楚错误。
    Stop-WithError "Redis 不可用。请确认 Docker Desktop 正在运行，并检查 redis 容器日志。"
}

# 在 postgres 容器里执行一条 SQL，并返回第一列结果。
function Invoke-PostgresScalar {
    param(
        # 要执行的 SQL 语句。
        [string]$Sql
    )

    # 使用容器里的 psql 查询数据库；-tA 会让输出更干净，方便脚本判断。
    $result = docker compose exec -T postgres psql -U postgres -d ai_gateway -tA -c $Sql 2>$null

    # 如果查询失败，返回空字符串，让上层按“可能为空库”处理。
    if ($LASTEXITCODE -ne 0) {
        return ""
    }

    # 去掉空格和换行，只保留真正的结果。
    return ($result -join "").Trim()
}

# 判断数据库是否像“空仓库”一样还没有基础数据。
function Test-DatabaseLooksEmpty {
    # 统计 public schema 里有多少张基础表。
    $tableCount = Invoke-PostgresScalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';"

    # 如果连表数量都查不到，保守认为数据库还没有准备好种子判断。
    if ($tableCount -eq "") {
        Write-Host "[WARN] 暂时无法判断数据库是否为空，将跳过自动询问种子数据。" -ForegroundColor Yellow
        return $false
    }

    # 没有任何表，说明这是一个全新的空数据库。
    if ([int]$tableCount -eq 0) {
        return $true
    }

    # 检查 providers 表是否存在；种子数据主要会写入 providers/models 等基础表。
    $providersTableExists = Invoke-PostgresScalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='providers';"

    # 如果 providers 表不存在，通常说明还没迁移完整，也当作空环境提醒你。
    if ($providersTableExists -eq "" -or [int]$providersTableExists -eq 0) {
        return $true
    }

    # 检查 providers 表里有没有数据。
    $providerCount = Invoke-PostgresScalar "SELECT COUNT(*) FROM providers;"

    # 如果 providers 没有数据，说明基础供应商数据还没种进去。
    return ($providerCount -ne "" -and [int]$providerCount -eq 0)
}

# 如果数据库为空，询问你是否运行 seed。
function Invoke-OptionalSeedIfEmpty {
    # 判断数据库是否为空。
    if (-not (Test-DatabaseLooksEmpty)) {
        Write-Host "[INFO] 数据库看起来已有数据，跳过 seed 询问。"
        return
    }

    # 告诉你为什么要问 seed。
    Write-Host "[INFO] 数据库看起来是空的，可以选择导入本地调试用的种子数据。"

    # 提醒没有迁移时 seed 可能失败，方便小白排错。
    Write-Host "[INFO] 如果你还没有创建/执行数据库迁移，seed 可能会失败。"

    # 让你自己决定是否导入，默认不强制。
    $answer = Read-Host "是否现在运行 pnpm prisma:seed？输入 Y 确认，其他任意键跳过"

    # 只有输入 Y 或 YES 才运行 seed。
    if ($answer -match '^(Y|y|YES|yes)$') {
        Invoke-CheckedCommand -FilePath "pnpm" -ArgumentList @("prisma:seed") -SuccessMessage "[OK] Database seeded" -FailureMessage "pnpm prisma:seed 执行失败。请检查 .env 和数据库迁移状态。"
        return
    }

    # 用户选择跳过时打印提示。
    Write-Host "[INFO] 已跳过 seed。以后你可以手动运行：pnpm prisma:seed"
}

# 等待 NestJS 健康检查通过。
function Wait-NestJsReady {
    param(
        # NestJS 健康检查地址。
        [string]$HealthUrl = "http://127.0.0.1:3000/health/live",

        # 最多等待多少秒。
        [int]$TimeoutSeconds = 90
    )

    # 打印提示，让你知道脚本正在等后端启动。
    Write-Host "[INFO] 正在等待 NestJS 后端启动..."

    # 每 2 秒访问一次健康检查接口。
    for ($elapsed = 0; $elapsed -lt $TimeoutSeconds; $elapsed += 2) {
        try {
            # 请求健康检查接口；成功说明后端已经开始工作。
            $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2

            # 2xx 状态码表示健康检查通过。
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
                Write-Host "[OK] NestJS started" -ForegroundColor Green
                return
            }
        }
        catch {
            # 后端还没启动时会进入这里，不需要吓人，继续等待即可。
        }

        # 还没好就等 2 秒再试。
        Start-Sleep -Seconds 2
    }

    # 超过时间还没好，给出清楚错误。
    Stop-WithError "NestJS 后端没有在预期时间内启动。请查看新打开的后端 PowerShell 窗口日志。"
}

# 打印脚本标题。
Write-Host "========================================"
Write-Host "AI API Gateway - Windows 一键开发启动"
Write-Host "========================================"

# 检查 .env 是否存在；它就像项目的“钥匙串”，缺了就不能启动。
if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot ".env"))) {
    Stop-WithError "缺少 .env 文件。请在项目根目录复制 .env.example 为 .env，然后填入 DEEPSEEK_API_KEY 等配置。"
}

# 检查 docker 命令是否存在。
Assert-CommandExists "docker"

# 检查 pnpm 命令是否存在。
Assert-CommandExists "pnpm"

# 检查 Docker Desktop 是否真的在运行。
& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "Docker 没有运行。请先打开 Docker Desktop，等左下角显示 Running 后再双击 start-dev.cmd。"
}

# 启动 PostgreSQL 和 Redis 容器。
Invoke-CheckedCommand -FilePath "docker" -ArgumentList @("compose", "up", "-d", "postgres", "redis") -SuccessMessage "[INFO] Docker Compose 已发出启动 PostgreSQL/Redis 的命令。" -FailureMessage "docker compose up -d postgres redis 执行失败。请检查 Docker Desktop 是否运行、端口 5432/6379 是否被占用。"

# 等待 PostgreSQL 真正可用。
Wait-PostgreSqlReady

# 等待 Redis 真正可用。
Wait-RedisReady

# 生成 Prisma Client；它就像给 TypeScript 准备数据库说明书。
Invoke-CheckedCommand -FilePath "pnpm" -ArgumentList @("prisma", "generate", "--schema", "prisma/schema.prisma") -SuccessMessage "[OK] Prisma generated" -FailureMessage "Prisma generate 失败。请先运行 pnpm install，并确认 prisma/schema.prisma 存在。"

# 检查 prisma/migrations 是否存在并且里面有迁移目录。
$migrationsPath = Join-Path $RepoRoot "prisma\migrations"

# 先把迁移目录数量设置为 0，避免目录不存在时报错。
$migrationDirectoryCount = 0

# 只有 migrations 目录存在时，才去统计里面的迁移子目录。
if (Test-Path -LiteralPath $migrationsPath) {
    $migrationDirectoryCount = (Get-ChildItem -LiteralPath $migrationsPath -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
}

# 只要迁移子目录数量大于 0，就说明可以执行 migrate deploy。
$hasMigrations = $migrationDirectoryCount -gt 0

# 如果有迁移，就执行 deploy；如果没有，就跳过。
if ($hasMigrations) {
    Invoke-CheckedCommand -FilePath "pnpm" -ArgumentList @("prisma", "migrate", "deploy") -SuccessMessage "[OK] Prisma migrations deployed" -FailureMessage "Prisma migrate deploy 失败。请检查 DATABASE_URL 和迁移文件。"
}
else {
    Write-Host "[INFO] 没有发现 prisma\migrations 迁移目录，跳过 pnpm prisma migrate deploy。"
}

# 如果数据库像空仓库一样没有基础数据，就询问是否导入 seed。
Invoke-OptionalSeedIfEmpty

# 准备在一个新的 PowerShell 窗口里启动后端，这样当前窗口还能显示最终状态。
$escapedRepoRoot = $RepoRoot.Replace("'", "''")
$backendCommand = "Set-Location -LiteralPath '$escapedRepoRoot'; pnpm dev"

# 把命令编码成 Windows PowerShell 需要的 UTF-16LE Base64，避免路径有空格时启动失败。
$encodedBackendCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($backendCommand))

# 打开新的 PowerShell 窗口并运行 pnpm dev。
Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile", "-NoExit", "-EncodedCommand", $encodedBackendCommand) | Out-Null

# 等待 NestJS 健康检查通过。
Wait-NestJsReady

# 告诉你启动完成，下一步可以打开 GUI 或调用接口。
Write-Host "[OK] 本地开发环境已启动完成。后端日志请看新打开的 PowerShell 窗口。" -ForegroundColor Green
