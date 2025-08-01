#!/usr/bin/env node

/**
 * LOLDrivers data update script for Next.js
 * Modern replacement for PowerShell/Bash scripts
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const REMOTE_URL = "https://raw.githubusercontent.com/magicsword-io/LOLDrivers/refs/heads/main/loldrivers.io/content/api/drivers.json";
const LOCAL_FILE = path.join(__dirname, '..', 'data', 'drv.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'drv.backup.json');

/**
 * Download data from remote URL
 */
async function downloadData(url) {
  console.log('📥 Downloading data from LOLDrivers...');
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Erreur de parsing JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Erreur de téléchargement: ${error.message}`));
    });
  });
}

/**
 * Validate data structure
 */
function validateData(data) {
  console.log('🔍 Validating data...');
  
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  if (data.length === 0) {
    throw new Error('Data array is empty');
  }
  
  // Basic structure check
  const firstItem = data[0];
  const requiredFields = ['OriginalFilename', 'MD5', 'SHA256'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  console.log(`✅ ${data.length} drivers validated`);
  return true;
}

/**
 * Compare les données pour détecter les changements
 */
async function compareData(newData) {
  try {
    const currentData = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8'));
    
    if (currentData.length !== newData.length) {
      return true; // Size difference
    }
    
    // Comparaison simple par hash
    const currentHashes = new Set(currentData.map(d => d.SHA256));
    const newHashes = new Set(newData.map(d => d.SHA256));
    
    return currentHashes.size !== newHashes.size || 
           [...currentHashes].some(hash => !newHashes.has(hash));
  } catch (error) {
    console.log('⚠️  Cannot read existing file, forcing update');
    return true;
  }
}

/**
 * Save data to file
 */
async function saveData(data) {
  console.log('💾 Saving data...');
  
  // Create backup of existing file
  try {
    await fs.copyFile(LOCAL_FILE, BACKUP_FILE);
    console.log('📦 Backup created');
  } catch (error) {
    console.log('⚠️  Cannot create backup');
  }
  
  // Write new data
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Data saved');
}

/**
 * Main script
 */
async function main() {
  console.log('🔧 LOLDrivers data update');
  console.log('========================');
  
  try {
    // Download new data
    const newData = await downloadData(REMOTE_URL);
    
    // Validate data
    validateData(newData);
    
    // Check for changes
    const hasChanges = await compareData(newData);
    
    if (!hasChanges) {
      console.log('🎯 No changes detected, data already up to date');
      return;
    }
    
    console.log('📝 Changes detected, updating...');
    
    // Save new data
    await saveData(newData);
    
    console.log('🎉 Update completed successfully!');
    console.log(`📊 Total: ${newData.length} drivers`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  main();
}

module.exports = { downloadData, validateData, compareData, saveData };
