# GitHub Actions - Check Vulnerable Drivers

## Description
Cette action GitHub vérifie automatiquement les drivers de la base de données contre la liste officielle Microsoft HVCI Block List.

## Planification
- **Fréquence** : 2 fois par semaine (lundi et jeudi à 02:00 UTC)
- **Déclenchement manuel** : Possible via l'interface GitHub

## Fonctionnement
1. Télécharge la liste Microsoft depuis `https://aka.ms/VulnerableDriverBlockList`
2. Extrait et parse le fichier `SiPolicy_Enforced.xml`
3. Compare les hashes SHA1 avec notre base de données
4. Ajoute le tag "HVCI Blocked" aux drivers correspondants
5. Commit automatique des modifications

## Résultats
- Mise à jour de `data/drv.json` avec nouveaux tags
- Métadonnées de vérification ajoutées
- Affichage dans l'interface utilisateur
