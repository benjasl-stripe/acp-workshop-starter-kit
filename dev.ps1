# Start all 3 services for ACP Workshop
# PowerShell version for Windows users

param(
    [switch]$Setup
)

$ROOT_DIR = $PSScriptRoot

# ============================================
# Environment Setup
# ============================================

function Setup-Env {
    param($ServiceDir, $ServiceName)
    
    $envFile = Join-Path $ServiceDir ".env"
    $envExample = Join-Path $ServiceDir ".env.example"
    
    if ((-not (Test-Path $envFile)) -or $Setup) {
        if (Test-Path $envExample) {
            Write-Host ""
            Write-Host "Setting up $ServiceName environment..."
            
            $content = Get-Content $envExample
            $newContent = @()
            
            foreach ($line in $content) {
                if ($line -match "^#" -or [string]::IsNullOrWhiteSpace($line)) {
                    $newContent += $line
                    continue
                }
                
                if ($line -match "Replace|YOUR_") {
                    $parts = $line -split "=", 2
                    $key = $parts[0]
                    $currentValue = $parts[1]
                    
                    Write-Host ""
                    Write-Host "   $key"
                    Write-Host "   Current: $currentValue"
                    $newValue = Read-Host "   Enter value (or press Enter to skip)"
                    
                    if ($newValue) {
                        $newContent += "$key=$newValue"
                    } else {
                        $newContent += $line
                    }
                } else {
                    $newContent += $line
                }
            }
            
            $newContent | Set-Content $envFile
            Write-Host ""
            Write-Host "   $ServiceName .env configured" -ForegroundColor Green
        }
    } else {
        Write-Host "$ServiceName .env already exists" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "======================================================="
Write-Host "  Environment Setup"
Write-Host "======================================================="

Setup-Env -ServiceDir "$ROOT_DIR\agent-service" -ServiceName "Agent Service"
Setup-Env -ServiceDir "$ROOT_DIR\merchant-service" -ServiceName "Merchant Service"

# ============================================
# Install Dependencies
# ============================================

Write-Host ""
Write-Host "======================================================="
Write-Host "  Installing Dependencies"
Write-Host "======================================================="

function Install-Deps {
    param($ServiceDir, $ServiceName)
    
    $nodeModules = Join-Path $ServiceDir "node_modules"
    
    if (-not (Test-Path $nodeModules)) {
        Write-Host "Installing $ServiceName dependencies..."
        Push-Location $ServiceDir
        npm install --silent
        Pop-Location
        Write-Host "   $ServiceName dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "$ServiceName dependencies already installed" -ForegroundColor Green
    }
}

Install-Deps -ServiceDir "$ROOT_DIR\frontend" -ServiceName "Frontend"
Install-Deps -ServiceDir "$ROOT_DIR\agent-service" -ServiceName "Agent Service"
Install-Deps -ServiceDir "$ROOT_DIR\merchant-service" -ServiceName "Merchant Service"

Write-Host ""
Write-Host "Starting all services..."
Write-Host ""

# Start services in separate windows
$agentJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\agent-service'; npm run dev" -PassThru
$merchantJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\merchant-service'; npm run dev" -PassThru
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\frontend'; npm run dev" -PassThru

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "======================================================="
Write-Host "  ACP Workshop - All Services Running"
Write-Host "======================================================="
Write-Host ""
Write-Host "  Frontend         http://localhost:3000"
Write-Host "  Agent Service    http://localhost:3001"
Write-Host "  Merchant Service http://localhost:4000"
Write-Host ""
Write-Host "======================================================="
Write-Host "  Each service is running in its own window."
Write-Host "  Close the windows to stop the services."
Write-Host "  Run with -Setup to reconfigure .env files"
Write-Host "======================================================="
Write-Host ""
