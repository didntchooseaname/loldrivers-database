#!/bin/bash

# Script moderne de mise à jour des données LOLDrivers
# Compatible avec l'application Next.js

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
UPDATE_SCRIPT="$SCRIPT_DIR/update-data.js"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Mise à jour LOLDrivers - Version Next.js${NC}"
echo -e "${BLUE}===========================================${NC}"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier que le script existe
if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo -e "${RED}❌ Script de mise à jour introuvable: $UPDATE_SCRIPT${NC}"
    exit 1
fi

# Exécuter le script de mise à jour
echo -e "${YELLOW}🚀 Exécution du script de mise à jour...${NC}"
cd "$PROJECT_DIR"

if node "$UPDATE_SCRIPT"; then
    echo -e "${GREEN}✅ Mise à jour terminée avec succès!${NC}"
    
    # Si pnpm est disponible, on peut redémarrer le serveur de dev
    if command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}💡 Pour redémarrer le serveur: pnpm dev${NC}"
    fi
else
    echo -e "${RED}❌ Erreur lors de la mise à jour${NC}"
    exit 1
fi
