#!/usr/bin/env node

/**
 * Script pour vérifier les résultats du système HVCI
 */

import fs from 'fs';
import path from 'path';

const DRV_JSON_PATH = './data/drv.json';

function checkHVCIResults() {
    console.log('🔍 Vérification des résultats HVCI...\n');
    
    try {
        // Vérifier si le fichier existe
        if (!fs.existsSync(DRV_JSON_PATH)) {
            console.error(`❌ Fichier non trouvé: ${DRV_JSON_PATH}`);
            return;
        }
        
        console.log(`📂 Lecture du fichier: ${DRV_JSON_PATH}`);
        
        // Lire le fichier de données
        const fileContent = fs.readFileSync(DRV_JSON_PATH, 'utf8');
        console.log(`📏 Taille du fichier: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
        
        const data = JSON.parse(fileContent);
        console.log(`📊 Type de données: ${Array.isArray(data) ? 'Array' : typeof data}`);
        
        if (Array.isArray(data)) {
            console.log(`📊 Nombre d'éléments: ${data.length}`);
        }
        
        // 1. Vérifier les métadonnées
        console.log('\n📊 MÉTADONNÉES HVCI:');
        console.log('==================');
        
        const hvciMeta = data._metadata?.hvciBlocklistCheck;
        if (hvciMeta) {
            console.log(`✅ Dernière vérification: ${new Date(hvciMeta.lastCheck).toLocaleString()}`);
            console.log(`📅 Microsoft dernière MAJ: ${new Date(hvciMeta.microsoftLastModified).toLocaleString()}`);
            console.log(`🔢 Total hashes bloqués: ${hvciMeta.totalBlockedHashes.toLocaleString()}`);
            console.log(`🎯 Drivers correspondants: ${hvciMeta.matchedDrivers}`);
            console.log(`🔗 Source: ${hvciMeta.source}`);
        } else {
            console.log('❌ Aucune métadonnée HVCI trouvée');
            console.log('ℹ️  Le script n\'a probablement pas encore été exécuté avec succès');
            
            // Vérifier s'il y a des métadonnées du tout
            if (data._metadata) {
                console.log('📋 Autres métadonnées présentes:', Object.keys(data._metadata));
            } else {
                console.log('📋 Aucune métadonnée présente');
            }
        }
        
        // 2. Compter les drivers avec le tag "HVCI Blocked"
        console.log('\n🏷️  TAGS "HVCI Blocked":');
        console.log('========================');
        
        let hvciBlockedCount = 0;
        const hvciBlockedDrivers = [];
        
        if (Array.isArray(data)) {
            data.forEach(driver => {
                if (driver.Tags && driver.Tags.includes('HVCI Blocked')) {
                    hvciBlockedCount++;
                    hvciBlockedDrivers.push({
                        id: driver.Id,
                        category: driver.Category || 'Unknown',
                        filename: driver.KnownVulnerableSamples?.[0]?.Filename || 'Unknown'
                    });
                }
            });
        }
        
        console.log(`📊 Nombre de drivers avec "HVCI Blocked": ${hvciBlockedCount}`);
        
        if (hvciBlockedCount > 0) {
            console.log('\n📋 Liste des drivers HVCI bloqués:');
            hvciBlockedDrivers.slice(0, 10).forEach((driver, index) => {
                console.log(`   ${index + 1}. ${driver.category} (${driver.id}) - ${driver.filename}`);
            });
            
            if (hvciBlockedCount > 10) {
                console.log(`   ... et ${hvciBlockedCount - 10} autres`);
            }
        }
        
        // 3. Vérifier les statistiques générales
        console.log('\n📈 STATISTIQUES GÉNÉRALES:');
        console.log('==========================');
        
        const totalDrivers = Array.isArray(data) ? data.length : 0;
        const hvciCompatible = Array.isArray(data) ? data.filter(d => d.LoadsDespiteHVCI?.toString().toUpperCase() === 'TRUE').length : 0;
        
        console.log(`📊 Total drivers: ${totalDrivers.toLocaleString()}`);
        console.log(`✅ HVCI compatibles: ${hvciCompatible.toLocaleString()}`);
        console.log(`🚫 HVCI bloqués: ${hvciBlockedCount.toLocaleString()}`);
        
        // 4. Résumé
        console.log('\n📝 RÉSUMÉ:');
        console.log('==========');
        
        if (hvciMeta) {
            console.log('✅ Système HVCI fonctionnel');
            console.log(`✅ Dernière vérification: ${new Date(hvciMeta.lastCheck).toLocaleString()}`);
            console.log(`📊 ${hvciBlockedCount} drivers identifiés comme bloqués par Microsoft`);
        } else {
            console.log('⚠️  Système HVCI non encore exécuté');
            console.log('💡 Exécutez: npm run check-vulnerable-drivers');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        process.exit(1);
    }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    checkHVCIResults();
}

export { checkHVCIResults };
