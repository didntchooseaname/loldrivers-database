import fs from 'fs';

console.log('🔍 Vérification des résultats HVCI...\n');

try {
    const DRV_JSON_PATH = './data/drv.json';
    
    if (!fs.existsSync(DRV_JSON_PATH)) {
        console.error(`❌ Fichier non trouvé: ${DRV_JSON_PATH}`);
        process.exit(1);
    }
    
    console.log(`📂 Lecture du fichier: ${DRV_JSON_PATH}`);
    const fileContent = fs.readFileSync(DRV_JSON_PATH, 'utf8');
    console.log(`📏 Taille du fichier: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
    
    const data = JSON.parse(fileContent);
    
    if (Array.isArray(data)) {
        console.log(`📊 Nombre de drivers: ${data.length}`);
        
        // Rechercher les tags HVCI Blocked
        let hvciCount = 0;
        for (const driver of data) {
            if (driver.Tags && driver.Tags.includes('HVCI Blocked')) {
                hvciCount++;
            }
        }
        
        console.log(`🚫 Drivers avec tag "HVCI Blocked": ${hvciCount}`);
        
        // Check metadata
        if (data._metadata?.hvciBlocklistCheck) {
            const meta = data._metadata.hvciBlocklistCheck;
            console.log('\n📊 Métadonnées HVCI trouvées:');
            console.log(`   Dernière vérification: ${new Date(meta.lastCheck).toLocaleString()}`);
            console.log(`   Microsoft MAJ: ${new Date(meta.microsoftLastModified).toLocaleString()}`);
            console.log(`   Hashes bloqués: ${meta.totalBlockedHashes}`);
            console.log(`   Drivers correspondants: ${meta.matchedDrivers}`);
        } else {
            console.log('\n❌ Aucune métadonnée HVCI trouvée');
            console.log('💡 Exécutez: node scripts/check-vulnerable-drivers.js');
        }
    } else {
        console.log('❌ Le fichier ne contient pas un tableau de drivers');
    }
    
} catch (error) {
    console.error('❌ Erreur:', error.message);
}
