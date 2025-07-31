# HVCI Vulnerable Drivers Check System

## Vue d'ensemble

Ce système vérifie automatiquement les drivers de la base de données contre la liste officielle des drivers bloqués par Microsoft HVCI (Hypervisor-protected Code Integrity). Il s'exécute automatiquement deux fois par semaine via GitHub Actions.

## Fonctionnalités

- ✅ **Vérification automatique** : Exécution bi-hebdomadaire (lundi et jeudi à 02:00 UTC)
- 📥 **Téléchargement automatique** : Récupère la liste officielle Microsoft depuis `https://aka.ms/VulnerableDriverBlockList`
- 🔍 **Comparaison SHA1** : Compare les hashes SHA1 entre notre base et la liste Microsoft
- 🏷️ **Tagging automatique** : Ajoute le tag "HVCI Blocked" aux drivers concernés
- 📊 **Métadonnées** : Affiche la date de dernière modification de la liste Microsoft
- 🔄 **Commit automatique** : Met à jour automatiquement `data/drv.json` si des changements sont détectés

## Structure des fichiers

```
.github/workflows/check-vulnerable-drivers.yml  # GitHub Action
scripts/check-vulnerable-drivers.js            # Script principal (Node.js)
scripts/check-vulnerable-drivers.ps1           # Script PowerShell (Windows)
scripts/test-update.js                         # Script de test
scripts/test-update.sh                         # Script de test (Linux/macOS)
src/components/HVCIBlocklistInfo.tsx          # Composant React pour l'UI
```

## Utilisation

### Exécution automatique
La GitHub Action s'exécute automatiquement selon le planning défini. Aucune intervention manuelle n'est requise.

### Exécution manuelle

#### Windows (PowerShell)
```powershell
.\scripts\check-vulnerable-drivers.ps1
```

#### Linux/macOS
```bash
npm run check-vulnerable-drivers
# ou
node scripts/check-vulnerable-drivers.js
```

#### Test du système
```bash
# Linux/macOS
./scripts/test-update.sh

# Windows
node scripts/test-update.js
```

## Affichage dans l'interface

Les informations de vérification HVCI sont affichées dans l'interface utilisateur avec :

- **Dernière vérification** : Date/heure de la dernière exécution
- **Dernière mise à jour Microsoft** : Date de modification de la liste officielle
- **Hashes bloqués** : Nombre total de hashes dans la liste Microsoft
- **Drivers correspondants** : Nombre de drivers de notre base présents dans la liste
- **Lien source** : Lien vers la liste officielle Microsoft

## Configuration GitHub Actions

### Variables d'environnement
- `GITHUB_TOKEN` : Token automatique pour les commits (fourni par GitHub)

### Déclencheurs
- **Programmé** : Lundi et jeudi à 02:00 UTC (`cron: '0 2 * * 1,4'`)
- **Manuel** : Via `workflow_dispatch` dans l'interface GitHub

## Métadonnées ajoutées

Le système ajoute une section `_metadata.hvciBlocklistCheck` au fichier `data/drv.json` :

```json
{
  "_metadata": {
    "hvciBlocklistCheck": {
      "lastCheck": "2025-07-31T10:30:00.000Z",
      "microsoftLastModified": "2025-07-30T15:45:00.000Z",
      "totalBlockedHashes": 1542,
      "matchedDrivers": 23,
      "source": "https://aka.ms/VulnerableDriverBlockList"
    }
  }
}
```

## Dépendances

- **Node.js** ≥ 18.0.0
- **xml2js** : Parse des fichiers XML de politique Microsoft
- **unzip** ou **PowerShell** : Extraction des archives ZIP

## Processus technique

1. **Téléchargement** : Récupère le ZIP depuis l'URL Microsoft
2. **Extraction** : Décompresse et trouve `SiPolicy_Enforced.xml`
3. **Parsing XML** : Extrait les hashes SHA1 du fichier de politique
4. **Comparaison** : Compare avec les SHA1 de notre base de données
5. **Tagging** : Ajoute "HVCI Blocked" aux drivers correspondants
6. **Commit** : Sauvegarde les modifications dans Git
7. **Nettoyage** : Supprime les fichiers temporaires

## Gestion des erreurs

- **Erreurs réseau** : Retry automatique par GitHub Actions
- **Fichiers corrompus** : Validation JSON et XML
- **Permissions Git** : Utilise le token GitHub automatique
- **Extraction ZIP** : Support multi-plateforme (unzip/PowerShell)

## Logs et monitoring

- **GitHub Actions** : Logs détaillés dans l'interface GitHub
- **Résumés** : Génération automatique de rapports en Markdown
- **Console** : Affichage coloré avec émojis pour la lisibilité

## Sécurité

- ✅ **Source officielle** : Utilise uniquement la liste Microsoft officielle
- ✅ **Validation** : Vérification de l'intégrité des fichiers téléchargés
- ✅ **Sandboxing** : Exécution dans un environnement GitHub Actions isolé
- ✅ **Permissions minimales** : Accès en lecture/écriture limité au repository
