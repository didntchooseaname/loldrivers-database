#!/usr/bin/env node

/**
 * Alternative version of HVCI script that only checks without committing
 * Used for testing or when Git permissions are not available
 */

import { main } from './check-vulnerable-drivers.js';

console.log('Test mode - HVCI check without automatic commit\n');

try {
    // Save original save function
    const originalWriteFileSync = (await import('fs')).default.writeFileSync;
    const fs = await import('fs');
    
    let hasChanges = false;
    let changesSummary = '';
    
    // Intercept writes to detect changes
    fs.default.writeFileSync = function(filePath, data, options) {
        if (filePath.includes('drv.json')) {
            // Instead of writing directly, save to a temporary file
            const tempPath = filePath + '.temp';
            originalWriteFileSync.call(this, tempPath, data, options);
            
            // Compare with original
            if (fs.default.existsSync(filePath)) {
                const original = fs.default.readFileSync(filePath, 'utf8');
                if (original !== data) {
                    hasChanges = true;
                    changesSummary = `File ${filePath} modified (${data.length} vs ${original.length} characters)`;
                    console.log(`Changes detected: ${changesSummary}`);
                }
            }
            
            // In test mode, we can choose whether to write or not
            if (process.env.DRY_RUN !== 'true') {
                originalWriteFileSync.call(this, filePath, data, options);
            } else {
                console.log(`DRY_RUN mode: file ${filePath} not modified`);
            }
        } else {
            // For other files (like check-summary.md), write normally
            originalWriteFileSync.call(this, filePath, data, options);
        }
    };
    
    // Execute main script
    await main();
    
    if (hasChanges) {
        console.log('\nScript executed with changes detected');
        console.log(`Summary: ${changesSummary}`);
        
        if (process.env.DRY_RUN === 'true') {
            console.log('DRY_RUN mode enabled - no files modified');
        } else {
            console.log('Files updated');
        }
    } else {
        console.log('\nScript executed without changes');
    }
    
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
