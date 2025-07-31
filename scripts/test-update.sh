#!/bin/bash

# Script de test pour le système de vérification des drivers vulnérables
# Usage: ./scripts/test-update.sh

echo "🧪 Test du système de vérification HVCI..."
echo

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
fi

# Exécuter le script de vérification
echo "🚀 Lancement de la vérification..."
node scripts/check-vulnerable-drivers.js

if [ $? -eq 0 ]; then
    echo "✅ Test réussi !"
    
    # Afficher le résumé s'il existe
    if [ -f "check-summary.md" ]; then
        echo
        echo "📊 Résumé :"
        cat check-summary.md
        rm check-summary.md
    fi
else
    echo "❌ Test échoué"
    exit 1
fi

echo
echo "✨ Terminé !"
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
