# PowerShell script for checking vulnerable drivers on Windows
param(
    [switch]$Force = $false
)

Write-Host "🔍 Starting vulnerable drivers check..." -ForegroundColor Cyan

try {
    # Check if Node.js is installed
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js is not installed or not in PATH"
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Check if we have the required npm packages
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Run the check script
    Write-Host "🚀 Running vulnerable drivers check..." -ForegroundColor Cyan
    node scripts/check-vulnerable-drivers.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "🎉 Check completed successfully!" -ForegroundColor Green
        
        # Show summary if available
        if (Test-Path "check-summary.md") {
            Write-Host "`n📊 Summary:" -ForegroundColor Cyan
            Get-Content "check-summary.md" | Write-Host
            Remove-Item "check-summary.md" -Force
        }
    } else {
        throw "Check script failed with exit code $LASTEXITCODE"
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Done!" -ForegroundColor Green
