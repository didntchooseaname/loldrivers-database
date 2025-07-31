#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MICROSOFT_BLOCKLIST_URL = 'https://aka.ms/VulnerableDriverBlockList';
const TEMP_DIR = './temp-blocklist';
const DRV_JSON_PATH = './data/drv.json';

/**
 * Download file from URL
 */
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(outputPath, () => {}); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Extract ZIP file and find SiPolicy_Enforced.xml
 */
function extractAndFindPolicyFile(zipPath) {
    try {
        // Create extraction directory
        const extractDir = path.join(TEMP_DIR, 'extracted');
        fs.mkdirSync(extractDir, { recursive: true });
        
        // Extract ZIP file using different commands depending on the platform
        try {
            // Try unzip first (Linux/macOS)
            execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, { stdio: 'pipe' });
        } catch (error) {
            try {
                // Try PowerShell on Windows
                execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'pipe' });
            } catch (error2) {
                throw new Error('No suitable unzip tool found. Please install unzip or use Windows with PowerShell.');
            }
        }
        
        // Find SiPolicy_Enforced.xml in VulnerableDriverBlockList directory
        const policyPath = path.join(extractDir, 'VulnerableDriverBlockList', 'SiPolicy_Enforced.xml');
        
        if (fs.existsSync(policyPath)) {
            return policyPath;
        }
        
        // If not found in expected location, search recursively
        function findFileRecursively(dir, filename) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    const found = findFileRecursively(fullPath, filename);
                    if (found) return found;
                } else if (file === filename) {
                    return fullPath;
                }
            }
            return null;
        }
        
        const foundFile = findFileRecursively(extractDir, 'SiPolicy_Enforced.xml');
        if (foundFile) {
            return foundFile;
        }
        
        throw new Error('SiPolicy_Enforced.xml not found in the ZIP file');
    } catch (error) {
        throw new Error(`Failed to extract ZIP file: ${error.message}`);
    }
}

/**
 * Parse XML policy file and extract SHA1 hashes
 */
async function extractSHA1Hashes(xmlPath) {
    try {
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);
        
        const hashes = new Set();
        
        // Navigate the XML structure to find SHA1 hashes
        function findHashes(obj) {
            if (typeof obj === 'object' && obj !== null) {
                if (Array.isArray(obj)) {
                    obj.forEach(findHashes);
                } else {
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        
                        // Check for SHA1 in attributes
                        if (key === '$' && typeof value === 'object') {
                            Object.values(value).forEach(attrValue => {
                                if (typeof attrValue === 'string' && attrValue.length === 40 && /^[a-fA-F0-9]+$/.test(attrValue)) {
                                    hashes.add(attrValue.toLowerCase());
                                }
                            });
                        }
                        
                        // Check for SHA1 in text content
                        if (typeof value === 'string' && value.length === 40 && /^[a-fA-F0-9]+$/.test(value)) {
                            hashes.add(value.toLowerCase());
                        }
                        
                        findHashes(value);
                    });
                }
            }
        }
        
        findHashes(result);
        
        // Alternative approach: look for SHA1 patterns in the raw XML content
        const sha1Pattern = /\b[a-fA-F0-9]{40}\b/g;
        const matches = xmlContent.match(sha1Pattern);
        if (matches) {
            matches.forEach(hash => hashes.add(hash.toLowerCase()));
        }
        
        return Array.from(hashes);
    } catch (error) {
        throw new Error(`Failed to parse XML file: ${error.message}`);
    }
}

/**
 * Get file modification date from HTTP headers
 */
function getFileLastModified(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { method: 'HEAD' }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                return getFileLastModified(response.headers.location)
                    .then(resolve)
                    .catch(reject);
            }
            
            const lastModified = response.headers['last-modified'];
            if (lastModified) {
                resolve(new Date(lastModified));
            } else {
                resolve(new Date()); // Fallback to current date
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Main function
 */
async function main() {
    console.log('Starting vulnerable drivers check...');
    
    try {
        // Create temp directory
        fs.mkdirSync(TEMP_DIR, { recursive: true });
        
        // Get last modified date
        console.log('Getting file modification date...');
        const lastModified = await getFileLastModified(MICROSOFT_BLOCKLIST_URL);
        console.log(`Last modified by Microsoft: ${lastModified.toISOString()}`);
        
        // Download the ZIP file
        console.log('Downloading Microsoft vulnerable drivers block list...');
        const zipPath = path.join(TEMP_DIR, 'blocklist.zip');
        await downloadFile(MICROSOFT_BLOCKLIST_URL, zipPath);
        
        // Extract and find policy file
        console.log('Extracting ZIP file...');
        const policyPath = extractAndFindPolicyFile(zipPath);
        console.log(`Found policy file: ${policyPath}`);
        
        // Extract SHA1 hashes
        console.log('Extracting SHA1 hashes from policy file...');
        const blockedHashes = await extractSHA1Hashes(policyPath);
        console.log(`Found ${blockedHashes.length} SHA1 hashes in Microsoft block list`);
        
        // Load our drivers data
        console.log('Loading drivers database...');
        const driversData = JSON.parse(fs.readFileSync(DRV_JSON_PATH, 'utf8'));
        
        // Check for matches and update tags
        console.log('Checking for matches...');
        let matchCount = 0;
        let updatedCount = 0;
        
        const matchedDrivers = [];
        
        driversData.forEach(driver => {
            if (driver.KnownVulnerableSamples) {
                driver.KnownVulnerableSamples.forEach(sample => {
                    if (sample.SHA1 && blockedHashes.includes(sample.SHA1.toLowerCase())) {
                        matchCount++;
                        
                        // Check if HVCI Blocked tag already exists
                        if (!driver.Tags || !driver.Tags.includes('HVCI Blocked')) {
                            if (!driver.Tags) {
                                driver.Tags = [];
                            }
                            driver.Tags.push('HVCI Blocked');
                            updatedCount++;
                            
                            // Build descriptive driver name
                            let driverName = 'Unknown Driver';
                            if (sample.Filename) {
                                driverName = sample.Filename;
                            } else if (sample.OriginalFilename) {
                                driverName = sample.OriginalFilename;
                            } else if (driver.Tags && driver.Tags.length > 0) {
                                driverName = driver.Tags[0]; // Use first tag as fallback
                            }
                            
                            // Add company info if available
                            let company = '';
                            if (sample.Company && sample.Company.trim()) {
                                company = ` (${sample.Company.trim()})`;
                            }
                            
                            matchedDrivers.push({
                                id: driver.Id,
                                name: `${driverName}${company}`,
                                sha1: sample.SHA1,
                                filename: sample.Filename || sample.OriginalFilename || 'N/A',
                                company: sample.Company || 'N/A'
                            });
                        }
                    }
                });
            }
        });
        
        // Add metadata about the check
        if (!driversData._metadata) {
            driversData._metadata = {};
        }
        driversData._metadata.hvciBlocklistCheck = {
            lastCheck: new Date().toISOString(),
            microsoftLastModified: lastModified.toISOString(),
            totalBlockedHashes: blockedHashes.length,
            matchedDrivers: matchCount,
            source: 'https://aka.ms/VulnerableDriverBlockList'
        };
        
        // Save updated data
        if (updatedCount > 0) {
            console.log(`Updated ${updatedCount} drivers with HVCI Blocked tag`);
            fs.writeFileSync(DRV_JSON_PATH, JSON.stringify(driversData, null, 2));
        } else {
            console.log('No new HVCI Blocked tags to add');
            // Still update metadata
            fs.writeFileSync(DRV_JSON_PATH, JSON.stringify(driversData, null, 2));
        }
        
        // Create summary report
        const summary = [
            `### HVCI Vulnerable Drivers Check Results`,
            `- **Microsoft Block List Last Modified**: ${lastModified.toLocaleString()}`,
            `- **Total Blocked Hashes in Microsoft List**: ${blockedHashes.length}`,
            `- **Matched Drivers in Database**: ${matchCount}`,
            `- **Newly Tagged Drivers**: ${updatedCount}`,
            ``,
            matchedDrivers.length > 0 ? `### Newly Tagged Drivers:` : '',
            ...matchedDrivers.map(d => 
                `- **${d.name}**\n  - ID: \`${d.id}\`\n  - SHA1: \`${d.sha1}\`\n  - File: \`${d.filename}\`\n  - Company: \`${d.company}\``
            )
        ].filter(line => line !== '').join('\n');
        
        fs.writeFileSync('check-summary.md', summary);
        
        console.log('\n' + summary);
        console.log('\nVulnerable drivers check completed successfully!');
        
    } catch (error) {
        console.error('Error during vulnerable drivers check:', error.message);
        process.exit(1);
    } finally {
        // Cleanup temp directory
        if (fs.existsSync(TEMP_DIR)) {
            try {
                fs.rmSync(TEMP_DIR, { recursive: true, force: true });
            } catch (error) {
                console.warn(`Warning: Could not clean up temp directory: ${error.message}`);
            }
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
