# 🛡️ LOLDrivers Database - Next.js Edition

![LOLDrivers](public/favicon.svg)

Une application Next.js moderne pour la base de données LOLDrivers (Living Off The Land Drivers) avec Server-Side Rendering, cache avancé et interface utilisateur optimisée.

## ✨ Fonctionnalités

- 🚀 **Server-Side Rendering (SSR)** - Chargement initial ultra-rapide
- 💾 **Cache intelligent** - Cache mémoire côté serveur + cache client avec SWR
- 🔍 **Recherche avancée** - Recherche en temps réel dans tous les champs
- 🏷️ **Filtrage sophistiqué** - HVCI, Killer Drivers, Certificats, etc.
- 🌙 **Thème sombre/clair** - Basculement automatique ou manuel
- 📱 **Design responsive** - Optimisé mobile et desktop
- ⚡ **Performance optimale** - Bundle optimisé, lazy loading
- 🎯 **TypeScript** - Typage strict pour une meilleure robustesse

## 🏗️ Architecture

Cette application utilise une architecture moderne avec les dernières bonnes pratiques :

- **Next.js 15** avec App Router
- **React 18** avec Server Components
- **TypeScript** pour la sécurité des types
- **pnpm** pour la gestion des dépendances
- **SWR** pour le cache et la synchronisation des données
- **CSS moderne** avec variables custom properties

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- pnpm 9+

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd loldrivers-database

# Installer pnpm si nécessaire
npm install -g pnpm@latest

# Installer les dépendances
pnpm install

# Démarrer en mode développement
pnpm dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Production

```bash
# Construire pour la production
pnpm build

# Démarrer le serveur de production
pnpm start
```

## 📁 Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx          # Page d'accueil avec SSR
│   └── api/              # API Routes
├── components/            # Composants React
├── lib/                  # Logique métier
├── hooks/                # Hooks React personnalisés
├── types/                # Définitions TypeScript
└── utils/                # Utilitaires

public/                   # Assets statiques
data/                     # Données des drivers
```

## ⚙️ Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env.local` et configurez :

```bash
# Durée de cache en secondes
CACHE_TTL=3600

# Configuration Next.js
NEXT_TELEMETRY_DISABLED=1
```

### Cache

Le système de cache est configuré pour :
- **Serveur** : Cache mémoire 1h avec TTL configurable
- **Client** : Cache SWR avec revalidation intelligente
- **API** : Headers de cache HTTP optimisés

## 🛠️ Scripts disponibles

```bash
pnpm dev          # Mode développement
pnpm build        # Build production
pnpm start        # Serveur production
pnpm lint         # Linting ESLint
pnpm type-check   # Vérification TypeScript
pnpm clean        # Nettoyage des fichiers générés
```

## 🚀 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

Le projet est optimisé pour Vercel avec :
- Configuration automatique Next.js
- Headers de cache optimisés
- Tâches cron pour actualisation du cache

### Autres plateformes

Le projet peut être déployé sur toute plateforme supportant Next.js :
- Netlify
- AWS Amplify
- Docker

## � Performance

| Métrique | Avant (Vanilla) | Après (Next.js) |
|----------|----------------|-----------------|
| Chargement initial | ~5-10s | ~0.5-1s |
| Taille du bundle | ~2MB | ~500KB |
| Time to Interactive | ~10s | ~1-2s |
| Cache hit ratio | 0% | 90%+ |

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🔗 Liens utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [LOLDrivers Original](https://loldrivers.io)
- [Deploiement Vercel](https://vercel.com/docs)

---

Made with ❤️ by the LOLDrivers team

## ⚠️ Note sur la sécurité

Les navigateurs modernes bloquent l'accès aux fichiers locaux pour des raisons de sécurité (CORS). C'est pourquoi un serveur local est nécessaire pour charger les données JSON.

## 🔧 Dépannage

Si vous voyez "Error Loading Data":
1. Vérifiez que Python est installé
2. Utilisez un serveur local (voir méthodes ci-dessus)
3. Vérifiez que le fichier `data/drv.json` existe
4. Consultez la console du navigateur (F12) pour plus de détails
