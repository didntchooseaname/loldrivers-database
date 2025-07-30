# 🤖 GitHub Actions pour LOLDrivers Viewer

Ce répertoire contient les workflows GitHub Actions pour automatiser la maintenance du projet LOLDrivers Viewer.

## 📄 Workflows disponibles

### `update-drivers-data.yml` - Mise à jour automatique des données

**Objectif :** Maintenir les données LOLDrivers à jour automatiquement.

**Fonctionnement :**
- ⏰ **Planification :** Exécution automatique chaque mardi à 6h UTC
- 🔍 **Vérification :** Compare le fichier local `data/drv.json` avec la source distante
- 📥 **Téléchargement :** Récupère la dernière version si des changements sont détectés
- 🔄 **Mise à jour :** Remplace automatiquement le fichier local
- 📝 **Commit :** Crée un commit avec un résumé des changements
- 🚀 **Déploiement :** Pousse les modifications vers le repository

**Déclencheurs :**
- 📅 **Automatique :** Chaque mardi à 6h UTC
- 🔘 **Manuel :** Via l'interface GitHub Actions (`workflow_dispatch`)

**Source des données :**
```
https://raw.githubusercontent.com/magicsword-io/LOLDrivers/refs/heads/main/loldrivers.io/content/api/drivers.json
```

## 🛠️ Configuration

### Permissions requises
Le workflow utilise le token GitHub par défaut (`GITHUB_TOKEN`) qui a automatiquement les permissions nécessaires pour :
- Lire le contenu du repository
- Créer des commits
- Pousser vers la branche principale

### Variables d'environnement
- `REMOTE_URL` : URL du fichier distant LOLDrivers
- `LOCAL_FILE` : Chemin du fichier local à mettre à jour

## 📊 Monitoring

### Logs détaillés
Chaque exécution produit des logs détaillés incluant :
- 📡 Statut du téléchargement
- 🔍 Résultats de la comparaison (MD5)
- 📊 Statistiques (nombre d'entrées)
- 🔄 Actions effectuées

### Résumé d'exécution
Un résumé est automatiquement généré dans l'interface GitHub Actions avec :
- ✅ Statut de l'exécution
- 📈 Statistiques des changements
- 🔗 Liens vers les ressources

### Messages de commit
Les commits automatiques incluent :
- 📝 Description claire des changements
- 📊 Nombre d'entrées ajoutées/supprimées
- 🕒 Timestamp de la mise à jour
- 🔗 Source des données

## 🚀 Utilisation

### Exécution manuelle
1. Aller dans l'onglet "Actions" du repository GitHub
2. Sélectionner "Update LOLDrivers Data"
3. Cliquer sur "Run workflow"
4. Confirmer l'exécution

### Surveillance des exécutions
- ✅ **Succès :** Données mises à jour ou aucun changement détecté
- ❌ **Échec :** Problème de téléchargement ou de permission
- ⚠️ **Attention :** Vérifier les logs en cas d'anomalie

## 🔧 Personnalisation

### Modifier la fréquence
Pour changer la fréquence d'exécution, modifier la ligne cron :
```yaml
schedule:
  - cron: '0 6 * * 2'  # Actuellement : chaque mardi à 6h UTC
```

### Changer l'URL source
Modifier la variable `REMOTE_URL` si la source change :
```yaml
env:
  REMOTE_URL: https://nouvelle-url.com/drivers.json
```

## 🛡️ Sécurité

- ✅ Utilise uniquement des tokens GitHub officiels
- ✅ Vérifie l'intégrité des fichiers (MD5)
- ✅ Logs détaillés pour traçabilité
- ✅ Nettoyage automatique des fichiers temporaires

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [LOLDrivers Project](https://github.com/magicsword-io/LOLDrivers)
- [LOLDrivers Website](https://loldrivers.io/)
- [Cron Expression Generator](https://crontab.guru/)
