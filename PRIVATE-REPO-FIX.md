# 🔒 Configuration pour Repository Privé

## ⚠️ Problème détecté

L'action GitHub a échoué avec l'erreur :
```
remote: Write access to repository not granted.
fatal: unable to access 'https://github.com/didntchooseaname/loldrivers-database/': The requested URL returned error: 403
```

Cela indique que votre repository est **privé** et nécessite une configuration spéciale.

## 🛠️ Solutions

### Option 1 : Configurer les permissions GitHub Actions (Recommandé)

1. **Aller dans les paramètres du repository :**
   - `Settings` → `Actions` → `General`

2. **Activer les permissions d'écriture :**
   - Sous "Workflow permissions"
   - Sélectionner "**Read and write permissions**"
   - Cocher "Allow GitHub Actions to create and approve pull requests"

3. **Sauvegarder les changements**

### Option 2 : Utiliser un Token Personnel (Si Option 1 ne fonctionne pas)

1. **Créer un Personal Access Token :**
   - GitHub → `Settings` → `Developer settings` → `Personal access tokens` → `Tokens (classic)`
   - `Generate new token (classic)`
   - Nom : `LOLDrivers Auto Update`
   - Expiration : `1 year`
   - Scopes : ✅ `repo` (tous les sous-scopes)

2. **Ajouter le token aux secrets du repository :**
   - Repository → `Settings` → `Secrets and variables` → `Actions`
   - `New repository secret`
   - Nom : `PERSONAL_ACCESS_TOKEN`
   - Valeur : Le token créé à l'étape 1

3. **Modifier le workflow :**
   Changer dans `.github/workflows/update-drivers-data.yml` :
   ```yaml
   - name: 📥 Checkout repository
     uses: actions/checkout@v4
     with:
       token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
       fetch-depth: 0
       persist-credentials: true
   ```

### Option 3 : Rendre le repository public (Si possible)

Si les données ne sont pas sensibles :
- Repository → `Settings` → `Danger Zone` → `Change repository visibility`
- Changer vers `Public`

## 🔧 Changements déjà appliqués

J'ai mis à jour le workflow avec :
- ✅ **Permissions étendues** pour repositories privés
- ✅ **Push explicite** vers la branche courante
- ✅ **Fetch depth 0** pour l'historique complet
- ✅ **Persist credentials** activé

## 🧪 Test après configuration

Après avoir appliqué **Option 1** ou **Option 2** :

1. **Test manuel :**
   - GitHub → `Actions` → `Update LOLDrivers Data`
   - `Run workflow` → `Run workflow`

2. **Vérifier les logs** pour confirmer que le push fonctionne

## 📋 Vérification des permissions actuelles

Pour vérifier l'état actuel :

1. **Repository Settings :**
   ```
   Settings → Actions → General → Workflow permissions
   ```
   ✅ Doit être : "Read and write permissions"

2. **Branch Protection :**
   ```
   Settings → Branches
   ```
   ✅ S'assurer qu'il n'y a pas de restrictions qui bloquent les commits automatiques

## 🚨 Si les problèmes persistent

1. **Vérifiez les logs détaillés** dans GitHub Actions
2. **Contactez l'administrateur** du repository si vous n'avez pas accès aux Settings
3. **Utilisez le test local** en attendant : `.\scripts\test-update.ps1`

---

**🎯 Action recommandée :** Commencer par **Option 1** (le plus simple), puis **Option 2** si nécessaire.
