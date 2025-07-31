#!/usr/bin/env node

/**
 * Version alternative du script HVCI qui ne fait que le check sans commit
 * Utilisé pour tester ou quand les permissions Git ne sont pas disponibles
 */

import { main } from './check-vulnerable-drivers.js';

console.log('🧪 Mode test - Vérification HVCI sans commit automatique\n');

try {
    // Sauvegarder la fonction de sauvegarde originale
    const originalWriteFileSync = (await import('fs')).default.writeFileSync;
    const fs = await import('fs');
    
    let hasChanges = false;
    let changesSummary = '';
    
    // Intercepter les écritures pour détecter les changements
    fs.default.writeFileSync = function(filePath, data, options) {
        if (filePath.includes('drv.json')) {
            // Au lieu d'écrire directement, on sauvegarde dans un fichier temporaire
            const tempPath = filePath + '.temp';
            originalWriteFileSync.call(this, tempPath, data, options);
            
            // Comparer avec l'original
            if (fs.default.existsSync(filePath)) {
                const original = fs.default.readFileSync(filePath, 'utf8');
                if (original !== data) {
                    hasChanges = true;
                    changesSummary = `Fichier ${filePath} modifié (${data.length} vs ${original.length} caractères)`;
                    console.log(`📝 Changements détectés: ${changesSummary}`);
                }
            }
            
            // En mode test, on peut choisir d'écrire ou non
            if (process.env.DRY_RUN !== 'true') {
                originalWriteFileSync.call(this, filePath, data, options);
            } else {
                console.log(`🔒 Mode DRY_RUN: fichier ${filePath} non modifié`);
            }
        } else {
            // Pour les autres fichiers (comme check-summary.md), écrire normalement
            originalWriteFileSync.call(this, filePath, data, options);
        }
    };
    
    // Exécuter le script principal
    await main();
    
    if (hasChanges) {
        console.log('\n✅ Script exécuté avec des changements détectés');
        console.log(`📊 Résumé: ${changesSummary}`);
        
        if (process.env.DRY_RUN === 'true') {
            console.log('ℹ️  Mode DRY_RUN activé - aucun fichier modifié');
        } else {
            console.log('💾 Fichiers mis à jour');
        }
    } else {
        console.log('\n✅ Script exécuté sans changements');
    }
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
}
