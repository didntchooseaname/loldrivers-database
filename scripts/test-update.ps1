# Script de test local pour l'action GitHub de mise à jour des drivers (Windows)
# Ce script reproduit le comportement de l'action GitHub localement

param(
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Test local de l'action de mise à jour LOLDrivers" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$REMOTE_URL = "https://raw.githubusercontent.com/magicsword-io/LOLDrivers/refs/heads/main/loldrivers.io/content/api/drivers.json"
$LOCAL_FILE = "data\drv.json"
$TEMP_FILE = "temp_drivers.json"

try {
    Write-Host "📥 Téléchargement des données depuis LOLDrivers..." -ForegroundColor Yellow
    
    # Téléchargement avec PowerShell
    Invoke-WebRequest -Uri $REMOTE_URL -OutFile $TEMP_FILE -UseBasicParsing
    
    if (-not (Test-Path $TEMP_FILE)) {
        throw "Échec du téléchargement"
    }
    
    Write-Host "✅ Téléchargement réussi" -ForegroundColor Green
    
    # Vérification de la validité JSON
    try {
        $jsonContent = Get-Content $TEMP_FILE -Raw | ConvertFrom-Json
        Write-Host "✅ JSON valide" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Le fichier téléchargé n'est pas un JSON valide" -ForegroundColor Red
        Remove-Item $TEMP_FILE -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Comparaison avec le fichier existant
    if (Test-Path $LOCAL_FILE) {
        $localHash = (Get-FileHash $LOCAL_FILE -Algorithm MD5).Hash
        $remoteHash = (Get-FileHash $TEMP_FILE -Algorithm MD5).Hash
        
        Write-Host "🔍 Comparaison des fichiers:" -ForegroundColor Cyan
        Write-Host "   Local:  $localHash" -ForegroundColor White
        Write-Host "   Remote: $remoteHash" -ForegroundColor White
        
        if ($localHash -eq $remoteHash) {
            Write-Host "📋 Aucune modification détectée" -ForegroundColor Yellow
            Remove-Item $TEMP_FILE -ErrorAction SilentlyContinue
            exit 0
        }
        else {
            Write-Host "🔄 Modifications détectées" -ForegroundColor Green
            
            # Statistiques
            try {
                $oldContent = Get-Content $LOCAL_FILE -Raw | ConvertFrom-Json
                $newContent = Get-Content $TEMP_FILE -Raw | ConvertFrom-Json
                
                $oldCount = if ($oldContent -is [array]) { $oldContent.Count } else { 1 }
                $newCount = if ($newContent -is [array]) { $newContent.Count } else { 1 }
                $diff = $newCount - $oldCount
                
                Write-Host "📊 Statistiques:" -ForegroundColor Cyan
                Write-Host "   Ancien nombre de drivers: $oldCount" -ForegroundColor White
                Write-Host "   Nouveau nombre de drivers: $newCount" -ForegroundColor White
                Write-Host "   Différence: $diff" -ForegroundColor White
            }
            catch {
                if ($Verbose) {
                    Write-Host "⚠️ Impossible de calculer les statistiques: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
    }
    else {
        Write-Host "📂 Création du fichier initial" -ForegroundColor Yellow
    }
    
    # Mise à jour du fichier
    Write-Host "💾 Mise à jour du fichier local..." -ForegroundColor Yellow
    
    # Créer le dossier data s'il n'existe pas
    $dataDir = Split-Path $LOCAL_FILE -Parent
    if (-not (Test-Path $dataDir)) {
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    }
    
    Move-Item $TEMP_FILE $LOCAL_FILE -Force
    
    Write-Host "✅ Mise à jour terminée avec succès !" -ForegroundColor Green
    
    # Vérification Git
    try {
        $gitStatus = & git status --porcelain 2>$null
        if ($gitStatus) {
            Write-Host "📝 Modifications Git détectées" -ForegroundColor Yellow
            Write-Host "Pour commiter les changements :" -ForegroundColor Cyan
            Write-Host "   git add $LOCAL_FILE" -ForegroundColor White
            Write-Host "   git commit -m '🔄 Update LOLDrivers data'" -ForegroundColor White
            Write-Host "   git push" -ForegroundColor White
        }
        else {
            Write-Host "✅ Aucune modification Git à commiter" -ForegroundColor Green
        }
    }
    catch {
        if ($Verbose) {
            Write-Host "⚠️ Git non disponible ou pas un repository Git" -ForegroundColor Yellow
        }
    }
    
    Write-Host "🎉 Test terminé !" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    
    # Nettoyage en cas d'erreur
    if (Test-Path $TEMP_FILE) {
        Remove-Item $TEMP_FILE -ErrorAction SilentlyContinue
    }
    
    exit 1
}
