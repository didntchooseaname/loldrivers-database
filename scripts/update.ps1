# Script moderne de mise à jour des données LOLDrivers
# Compatible avec l'application Next.js

param(
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$UpdateScript = Join-Path $ScriptDir "update-data.js"

Write-Host "🔧 Mise à jour LOLDrivers - Version Next.js" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

try {
    # Vérifier que Node.js est installé
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        Write-Host "❌ Node.js n'est pas installé" -ForegroundColor Red
        exit 1
    }
    
    if ($Verbose) {
        Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
    }
    
    # Vérifier que le script existe
    if (-not (Test-Path $UpdateScript)) {
        Write-Host "❌ Script de mise à jour introuvable: $UpdateScript" -ForegroundColor Red
        exit 1
    }
    
    # Changer vers le répertoire du projet
    Set-Location $ProjectDir
    
    # Exécuter le script de mise à jour
    Write-Host "🚀 Exécution du script de mise à jour..." -ForegroundColor Yellow
    
    $env:FORCE_UPDATE = if ($Force) { "true" } else { "false" }
    
    node $UpdateScript
    
    Write-Host "✅ Mise à jour terminée avec succès!" -ForegroundColor Green
    
    # Si pnpm est disponible, suggestion de redémarrage
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Write-Host "💡 Pour redémarrer le serveur: pnpm dev" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erreur lors de la mise à jour: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
