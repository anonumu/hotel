param(
    [switch]$Rebuild,
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

foreach ($a in $args) {
    if ($a -eq '--rebuild') { $Rebuild = $true }
    if ($a -eq '--check-only') { $CheckOnly = $true }
}

$RootDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RootDir 'hotel-backend'
$JarPath = Join-Path $BackendDir 'target\hotel-backend-1.0.0.jar'
$MvnCmd = Join-Path $BackendDir 'maven\bin\mvn.cmd'

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  Grand Impérial — Информационная система управления отелем' -ForegroundColor White
Write-Host '  Автоматический запуск Backend (Spring Boot) + Frontend' -ForegroundColor Gray
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''

function Get-JavaMajor([string]$JavaExe) {
    if (-not (Test-Path $JavaExe)) { return 0 }
    try {
        $prevPref = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $out = & $JavaExe -version 2>&1 | Out-String
        $ErrorActionPreference = $prevPref
        if ($out -match 'version "(\d+)(?:\.(\d+))?') {
            $maj = [int]$Matches[1]
            $min = if ($Matches[2]) { [int]$Matches[2] } else { 0 }
            if ($maj -eq 1) { return $min }
            return $maj
        }
    } catch {}
    return 0
}

$Candidates = New-Object System.Collections.Generic.List[string]
if ($env:JAVA_HOME) {
    $Candidates.Add((Join-Path $env:JAVA_HOME 'bin\java.exe'))
}
foreach ($root in @(
    (Join-Path $env:USERPROFILE '.jdks'),
    'C:\Program Files\Java',
    'C:\Program Files\Eclipse Adoptium',
    'C:\Program Files\Microsoft',
    'C:\Program Files\Amazon Corretto',
    'C:\Program Files\Zulu',
    'C:\Program Files\BellSoft'
)) {
    if (Test-Path $root) {
        Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object {
            $Candidates.Add((Join-Path $_.FullName 'bin\java.exe'))
        }
    }
}
$WhereJava = Get-Command java -ErrorAction SilentlyContinue
if ($WhereJava -and $WhereJava.Source) {
    $Candidates.Add($WhereJava.Source)
}

$FoundJava = $null
$FoundHome = $null
$FoundMajor = 0
foreach ($exe in ($Candidates | Select-Object -Unique)) {
    $ver = Get-JavaMajor $exe
    if ($ver -ge 17) {
        $FoundJava = $exe
        $FoundHome = Split-Path -Parent (Split-Path -Parent $exe)
        $FoundMajor = $ver
        break
    }
}

if (-not $FoundJava) {
    Write-Host '[ОШИБКА] На компьютере не найдена Java 17 или выше!' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Как исправить за 1 минуту:'
    Write-Host '  1. Скачайте Java 17 или 21 (LTS) с сайта https://adoptium.net/'
    Write-Host '  2. Установите стандартным установщиком (Next -> Next -> Install -> Finish).'
    Write-Host '  3. Снова запустите start-hotel.bat двойным кликом.'
    Write-Host ''
    if (-not $CheckOnly) { Read-Host 'Нажмите Enter для выхода' }
    exit 1
}

$env:JAVA_HOME = $FoundHome
$env:Path = "$(Join-Path $FoundHome 'bin');$env:Path"
Write-Host "[OK] Найдена Java $FoundMajor ($FoundHome)" -ForegroundColor Green

if ($Rebuild -or -not (Test-Path $JarPath)) {
    Write-Host ''
    Write-Host '[..] Сборка проекта через встроенный Maven (15-40 сек)...' -ForegroundColor Yellow
    if (-not (Test-Path $MvnCmd)) {
        Write-Host "[ОШИБКА] Не найден встроенный Maven: $MvnCmd" -ForegroundColor Red
        if (-not $CheckOnly) { Read-Host 'Нажмите Enter для выхода' }
        exit 1
    }
    Push-Location $BackendDir
    try {
        & $MvnCmd package '-DskipTests'
        $buildExit = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($buildExit -ne 0 -or -not (Test-Path $JarPath)) {
        Write-Host '[ОШИБКА] Ошибка сборки Maven. Проверьте доступ в интернет при первой загрузке зависимостей.' -ForegroundColor Red
        if (-not $CheckOnly) { Read-Host 'Нажмите Enter для выхода' }
        exit 1
    }
    Write-Host '[OK] Сборка успешно завершена.' -ForegroundColor Green
} else {
    Write-Host '[OK] Найден готовый пакет: hotel-backend\target\hotel-backend-1.0.0.jar' -ForegroundColor Green
}

function Test-PortOpen([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(500, $false)
        if ($ok -and $client.Connected) {
            $client.EndConnect($iar)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

$AppPort = 8080
$AlreadyUp = $false
if (Test-PortOpen 8080) {
    try {
        $health = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/system/health' -TimeoutSec 2
        if ($health.status -eq 'UP') { $AlreadyUp = $true }
    } catch {}
    if (-not $AlreadyUp) {
        $AppPort = 8081
        Write-Host '[!] Порт 8080 занят другой программой. Будет использован свободный порт 8081.' -ForegroundColor Yellow
    }
}

if ($CheckOnly) {
    $stateMsg = if ($AlreadyUp) { 'уже запущен на 8080' } else { "готов к запуску на порту $AppPort" }
    Write-Host "[OK] Проверка окружения пройдена: сервер $stateMsg." -ForegroundColor Green
    exit 0
}

if ($AlreadyUp) {
    Write-Host ''
    Write-Host '[OK] Сервер Grand Impérial уже работает на http://localhost:8080/' -ForegroundColor Green
    Start-Process 'http://localhost:8080/'
    Read-Host 'Браузер открыт. Нажмите Enter, чтобы закрыть это окно (сервер продолжит работу)'
    exit 0
}

Write-Host ''
Write-Host "[..] Запуск сервера Grand Impérial на http://localhost:$AppPort/ ..." -ForegroundColor Cyan
Write-Host '     Браузер откроется автоматически сразу после загрузки базы данных.'
Write-Host '     Чтобы остановить сервер, закройте это окно или нажмите Ctrl+C.'
Write-Host ''

$WaitCmd = "for (`$i=0; `$i -lt 45; `$i++) { Start-Sleep -Seconds 1; try { `$h = Invoke-RestMethod -Uri 'http://localhost:$AppPort/api/v1/system/health' -TimeoutSec 2; if (`$h.status -eq 'UP') { Start-Process 'http://localhost:$AppPort/'; break } } catch {} }"
Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @('-NoProfile', '-Command', $WaitCmd)

& $FoundJava '-jar' $JarPath "--server.port=$AppPort"
$ExitCode = $LASTEXITCODE
if ($ExitCode -ne 0) {
    Write-Host "`n[ОШИБКА] Сервер завершился с кодом $ExitCode." -ForegroundColor Red
    Read-Host 'Нажмите Enter для выхода'
}
exit $ExitCode
