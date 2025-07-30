# LOLDrivers Viewer

Une interface web moderne pour visualiser les données des pilotes vulnérables de LOLDrivers.

## 🚀 Comment utiliser

### Méthode 1: Serveur local automatique
1. Double-cliquez sur `start-server.bat`
2. Ouvrez votre navigateur à `http://localhost:8000`

### Méthode 2: Serveur Python manuel
```bash
cd loldrivers-viewer
python -m http.server 8000
```
Puis ouvrez `http://localhost:8000`

### Méthode 3: VS Code Live Server
1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` → "Open with Live Server"

## 🎨 Fonctionnalités

- **Interface moderne** avec thème sombre/clair
- **Recherche avancée** par nom, hash, fonction
- **Filtres intelligents** (HVCI compatible, killer drivers)
- **Statistiques dynamiques** 
- **Animations eye-candy** sur tous les éléments
- **Design responsive** pour mobile et desktop

## 🎭 Animations

Toutes les cartes et éléments incluent des animations sophistiquées:
- **Hover effects** avec transformations 3D
- **Gradients animés** et effets de brillance
- **Micro-interactions** sur tous les éléments
- **Transitions fluides** avec easing personnalisé
- **Apparition progressive** des cartes

## 📁 Structure

```
loldrivers-viewer/
├── index.html          # Interface principale
├── app.js              # Logique de l'application
├── style.css           # Styles et animations
├── data/
│   └── drv.json        # Données des pilotes
└── start-server.bat    # Script de démarrage
```

## ⚠️ Note sur la sécurité

Les navigateurs modernes bloquent l'accès aux fichiers locaux pour des raisons de sécurité (CORS). C'est pourquoi un serveur local est nécessaire pour charger les données JSON.

## 🔧 Dépannage

Si vous voyez "Error Loading Data":
1. Vérifiez que Python est installé
2. Utilisez un serveur local (voir méthodes ci-dessus)
3. Vérifiez que le fichier `data/drv.json` existe
4. Consultez la console du navigateur (F12) pour plus de détails
