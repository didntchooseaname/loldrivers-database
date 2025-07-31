#!/usr/bin/env node

/**
 * Script to check HVCI system results
 */

import fs from 'fs';
import path from 'path';

const DRV_JSON_PATH = './data/drv.json';

function checkHVCIResults() {
    console.log('Checking HVCI results...\n');
    
    try {
        // Check if file exists
        if (!fs.existsSync(DRV_JSON_PATH)) {
            console.error(`File not found: ${DRV_JSON_PATH}`);
            return;
        }
        
        console.log(`Reading file: ${DRV_JSON_PATH}`);
        
        // Read data file
        const fileContent = fs.readFileSync(DRV_JSON_PATH, 'utf8');
        console.log(`File size: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);
        
        const data = JSON.parse(fileContent);
        console.log(`Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
        
        if (Array.isArray(data)) {
            console.log(`Number of elements: ${data.length}`);
        }
        
        // 1. Check metadata
        console.log('\nHVCI METADATA:');
        console.log('==================');
        
        const hvciMeta = data._metadata?.hvciBlocklistCheck;
        if (hvciMeta) {
            console.log(`Last check: ${new Date(hvciMeta.lastCheck).toLocaleString()}`);
            console.log(`Microsoft last update: ${new Date(hvciMeta.microsoftLastModified).toLocaleString()}`);
            console.log(`Total blocked hashes: ${hvciMeta.totalBlockedHashes.toLocaleString()}`);
            console.log(`Matched drivers: ${hvciMeta.matchedDrivers}`);
            console.log(`Source: ${hvciMeta.source}`);
        } else {
            console.log('No HVCI metadata found');
            console.log('The script has probably not been run successfully yet');
            
            // Check if there are any metadata at all
            if (data._metadata) {
                console.log('Other metadata present:', Object.keys(data._metadata));
            } else {
                console.log('No metadata present');
            }
        }
        
        // 2. Count drivers with "HVCI Blocked" tag
        console.log('\n"HVCI Blocked" TAGS:');
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
        
        console.log(`Number of drivers with "HVCI Blocked": ${hvciBlockedCount}`);
        
        if (hvciBlockedCount > 0) {
            console.log('\nList of HVCI blocked drivers:');
            hvciBlockedDrivers.slice(0, 10).forEach((driver, index) => {
                console.log(`   ${index + 1}. ${driver.category} (${driver.id}) - ${driver.filename}`);
            });
            
            if (hvciBlockedCount > 10) {
                console.log(`   ... and ${hvciBlockedCount - 10} others`);
            }
        }
        
        // 3. Check general statistics
        console.log('\nGENERAL STATISTICS:');
        console.log('==========================');
        
        const totalDrivers = Array.isArray(data) ? data.length : 0;
        const hvciCompatible = Array.isArray(data) ? data.filter(d => d.LoadsDespiteHVCI?.toString().toUpperCase() === 'TRUE').length : 0;
        
        console.log(`Total drivers: ${totalDrivers.toLocaleString()}`);
        console.log(`HVCI compatible: ${hvciCompatible.toLocaleString()}`);
        console.log(`HVCI blocked: ${hvciBlockedCount.toLocaleString()}`);
        
        // 4. Summary
        console.log('\nSUMMARY:');
        console.log('==========');
        
        if (hvciMeta) {
            console.log('HVCI system functional');
            console.log(`Last check: ${new Date(hvciMeta.lastCheck).toLocaleString()}`);
            console.log(`${hvciBlockedCount} drivers identified as blocked by Microsoft`);
        } else {
            console.log('HVCI system not yet executed');
            console.log('Run: npm run check-vulnerable-drivers');
        }
        
    } catch (error) {
        console.error('Error during verification:', error.message);
        process.exit(1);
    }
}

// Execute function directly
checkHVCIResults();
