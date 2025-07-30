# 🔄 Système de Mise à Jour Automatique LOLDrivers

Ce document explique le système de mise à jour automatique des données LOLDrivers mis en place pour ce projet.

## 📋 Vue d'ensemble

Le système synchronise automatiquement les données de drivers depuis le repository officiel [LOLDrivers](https://github.com/magicsword-io/LOLDrivers) chaque semaine et met à jour le fichier local `data/drv.json`.

## 🏗️ Architecture

### Composants principaux

1. **GitHub Action** (`.github/workflows/update-drivers-data.yml`)
   - Planification automatique hebdomadaire
   - Téléchargement et comparaison des données
   - Commit automatique des changements

2. **Scripts de test** (`scripts/`)
   - `test-update.sh` : Version Linux/macOS
   - `test-update.ps1` : Version Windows PowerShell

3. **Configuration** (`.github/config.env`)
   - Paramètres personnalisables
   - URLs et chemins de fichiers

## ⏰ Planification

- **Fréquence** : Chaque mardi à 6h00 UTC
- **Déclenchement manuel** : Possible via l'interface GitHub Actions
- **Format cron** : `0 6 * * 2`

## 🔧 Fonctionnalités

### Vérifications automatiques
- ✅ Validation JSON des données téléchargées
- ✅ Comparaison MD5 pour éviter les commits inutiles
- ✅ Calcul automatique des statistiques (nombre de drivers)
- ✅ Gestion d'erreurs complète

### Informations de commit
- 📊 Statistiques détaillées dans le message de commit
- 🕒 Horodatage des mises à jour
- 📈 Nombre de drivers ajoutés/supprimés

### Sécurité
- 🔒 Validation de l'intégrité des fichiers
- 🧹 Nettoyage automatique des fichiers temporaires
- ⚠️ Échec sécurisé en cas d'erreur

## 🚀 Utilisation

### Activation automatique
Le système fonctionne automatiquement une fois le workflow en place. Aucune intervention manuelle n'est requise.

### Test manuel
Pour tester localement avant un déploiement :

**Linux/macOS :**
```bash
cd loldrivers-viewer
chmod +x scripts/test-update.sh
./scripts/test-update.sh
```

**Windows :**
```powershell
cd loldrivers-viewer
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\test-update.ps1
```

### Déclenchement manuel
1. Aller sur GitHub → Actions
2. Sélectionner "Update LOLDrivers Data"
3. Cliquer "Run workflow"
4. Choisir la branche et cliquer "Run workflow"

## 📁 Structure des fichiers

```
loldrivers-viewer/
├── .github/
│   ├── workflows/
│   │   └── update-drivers-data.yml    # Action principale
│   ├── config.env                     # Configuration
│   └── README.md                      # Documentation GitHub Actions
├── scripts/
│   ├── test-update.sh                 # Test Linux/macOS
│   └── test-update.ps1                # Test Windows
├── data/
│   └── drv.json                       # Données LOLDrivers (mis à jour automatiquement)
└── AUTOMATION.md                      # Ce fichier
```

## 🔧 Configuration avancée

### Modifier la fréquence
Éditer le champ `cron` dans `.github/workflows/update-drivers-data.yml` :

```yaml
schedule:
  - cron: '0 6 * * 2'  # Chaque mardi à 6h UTC
```

Exemples de fréquences :
- `0 6 * * *` : Tous les jours à 6h
- `0 6 * * 1` : Chaque lundi à 6h
- `0 6 1 * *` : Le 1er de chaque mois à 6h

### Changer la source de données
Modifier la variable `REMOTE_URL` dans le workflow :

```yaml
env:
  REMOTE_URL: https://votre-nouvelle-source.com/drivers.json
```

### Personnaliser les messages de commit
Modifier les templates dans la section `env` du workflow :

```yaml
env:
  COMMIT_MSG_UPDATE: "🔄 Mise à jour personnalisée des drivers"
```

## 📊 Monitoring

### Logs de l'action
- Accès via GitHub → Actions → "Update LOLDrivers Data"
- Logs détaillés de chaque étape
- Historique des exécutions

### Notifications
Les échecs d'exécution génèrent automatiquement :
- ❌ Notification par email (si configurée)
- 🚨 Badge de statut rouge sur le repository
- 📝 Log d'erreur détaillé

### Métriques
Chaque exécution affiche :
- 📈 Nombre total de drivers
- ➕ Drivers ajoutés
- ➖ Drivers supprimés
- 🔄 Drivers modifiés (si détectés)

## 🐛 Dépannage

### L'action ne se déclenche pas
1. Vérifier que le workflow est activé dans GitHub Actions
2. Vérifier la syntaxe cron
3. S'assurer que le repository a des commits récents

### Échecs de téléchargement
1. Vérifier la connectivité à la source
2. Contrôler les changements d'URL du repository source
3. Vérifier les permissions du repository

### Problèmes de commit
1. Vérifier les permissions du token GitHub
2. S'assurer que la branche principale accepte les commits
3. Contrôler les règles de protection de branche

### Test local échoue
1. Vérifier la connectivité Internet
2. S'assurer que curl/PowerShell est installé
3. Contrôler les permissions d'écriture sur le dossier

## 🔐 Sécurité

### Permissions requises
- `contents: write` : Pour modifier les fichiers
- `actions: read` : Pour lire les métadonnées d'action

### Bonnes pratiques
- ✅ Le workflow utilise des permissions minimales
- ✅ Validation des données avant commit
- ✅ Nettoyage des fichiers temporaires
- ✅ Pas de secrets ou tokens exposés

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Repository LOLDrivers](https://github.com/magicsword-io/LOLDrivers)
- [Syntaxe Cron](https://crontab.guru/)
- [Format JSON Schema](https://json-schema.org/)

## 🔄 Changelog

### Version 1.0 (Initial)
- ✅ Action GitHub hebdomadaire
- ✅ Validation JSON automatique
- ✅ Comparaison MD5
- ✅ Scripts de test locaux
- ✅ Documentation complète
- ✅ Gestion d'erreurs robuste
