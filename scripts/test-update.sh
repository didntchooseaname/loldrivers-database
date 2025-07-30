#!/bin/bash

# Script de test local pour l'action GitHub de mise à jour des drivers
# Ce script reproduit le comportement de l'action GitHub localement

set -e

echo "🔧 Test local de l'action de mise à jour LOLDrivers"
echo "================================================"

# Configuration
REMOTE_URL="https://raw.githubusercontent.com/magicsword-io/LOLDrivers/refs/heads/main/loldrivers.io/content/api/drivers.json"
LOCAL_FILE="data/drv.json"
TEMP_FILE="temp_drivers.json"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📥 Téléchargement des données depuis LOLDrivers...${NC}"
curl -s -L -o "$TEMP_FILE" "$REMOTE_URL"

if [ ! -f "$TEMP_FILE" ]; then
    echo -e "${RED}❌ Échec du téléchargement${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Téléchargement réussi${NC}"

# Vérification de la validité JSON
if ! python -m json.tool "$TEMP_FILE" > /dev/null 2>&1; then
    echo -e "${RED}❌ Le fichier téléchargé n'est pas un JSON valide${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

echo -e "${GREEN}✅ JSON valide${NC}"

# Comparaison avec le fichier existant
if [ -f "$LOCAL_FILE" ]; then
    LOCAL_MD5=$(md5sum "$LOCAL_FILE" 2>/dev/null | cut -d' ' -f1 || echo "")
    REMOTE_MD5=$(md5sum "$TEMP_FILE" 2>/dev/null | cut -d' ' -f1 || echo "")
    
    echo "🔍 Comparaison des fichiers:"
    echo "   Local:  $LOCAL_MD5"
    echo "   Remote: $REMOTE_MD5"
    
    if [ "$LOCAL_MD5" = "$REMOTE_MD5" ]; then
        echo -e "${YELLOW}📋 Aucune modification détectée${NC}"
        rm -f "$TEMP_FILE"
        exit 0
    else
        echo -e "${GREEN}🔄 Modifications détectées${NC}"
        
        # Statistiques
        if command -v jq &> /dev/null; then
            OLD_COUNT=$(jq '. | length' "$LOCAL_FILE" 2>/dev/null || echo "0")
            NEW_COUNT=$(jq '. | length' "$TEMP_FILE" 2>/dev/null || echo "0")
            DIFF=$((NEW_COUNT - OLD_COUNT))
            
            echo "📊 Statistiques:"
            echo "   Ancien nombre de drivers: $OLD_COUNT"
            echo "   Nouveau nombre de drivers: $NEW_COUNT"
            echo "   Différence: $DIFF"
        fi
    fi
else
    echo -e "${YELLOW}📂 Création du fichier initial${NC}"
fi

# Mise à jour du fichier
echo -e "${YELLOW}💾 Mise à jour du fichier local...${NC}"
mv "$TEMP_FILE" "$LOCAL_FILE"

echo -e "${GREEN}✅ Mise à jour terminée avec succès !${NC}"

# Vérification Git
if git rev-parse --git-dir > /dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}📝 Modifications Git détectées${NC}"
        echo "Pour commiter les changements :"
        echo "   git add $LOCAL_FILE"
        echo "   git commit -m '🔄 Update LOLDrivers data'"
        echo "   git push"
    else
        echo -e "${GREEN}✅ Aucune modification Git à commiter${NC}"
    fi
fi

echo -e "${GREEN}🎉 Test terminé !${NC}"
