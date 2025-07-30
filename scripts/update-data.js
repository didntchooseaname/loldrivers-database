#!/usr/bin/env node

/**
 * Script de mise à jour des données LOLDrivers pour Next.js
 * Version moderne remplaçant les anciens scripts PowerShell/Bash
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const REMOTE_URL = "https://raw.githubusercontent.com/magicsword-io/LOLDrivers/refs/heads/main/loldrivers.io/content/api/drivers.json";
const LOCAL_FILE = path.join(__dirname, '..', 'data', 'drv.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'drv.backup.json');

/**
 * Télécharge les données depuis l'URL distante
 */
async function downloadData(url) {
  console.log('📥 Téléchargement des données depuis LOLDrivers...');
  
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
 * Valide la structure des données
 */
function validateData(data) {
  console.log('🔍 Validation des données...');
  
  if (!Array.isArray(data)) {
    throw new Error('Les données doivent être un tableau');
  }
  
  if (data.length === 0) {
    throw new Error('Le tableau de données est vide');
  }
  
  // Vérification basique de la structure
  const firstItem = data[0];
  const requiredFields = ['OriginalFilename', 'MD5', 'SHA256'];
  
  for (const field of requiredFields) {
    if (!(field in firstItem)) {
      throw new Error(`Champ requis manquant: ${field}`);
    }
  }
  
  console.log(`✅ ${data.length} drivers validés`);
  return true;
}

/**
 * Compare les données pour détecter les changements
 */
async function compareData(newData) {
  try {
    const currentData = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8'));
    
    if (currentData.length !== newData.length) {
      return true; // Différence de taille
    }
    
    // Comparaison simple par hash
    const currentHashes = new Set(currentData.map(d => d.SHA256));
    const newHashes = new Set(newData.map(d => d.SHA256));
    
    return currentHashes.size !== newHashes.size || 
           [...currentHashes].some(hash => !newHashes.has(hash));
  } catch (error) {
    console.log('⚠️  Impossible de lire le fichier existant, mise à jour forcée');
    return true;
  }
}

/**
 * Sauvegarde les données
 */
async function saveData(data) {
  console.log('💾 Sauvegarde des données...');
  
  // Créer une sauvegarde du fichier existant
  try {
    await fs.copyFile(LOCAL_FILE, BACKUP_FILE);
    console.log('📦 Sauvegarde créée');
  } catch (error) {
    console.log('⚠️  Impossible de créer la sauvegarde');
  }
  
  // Écrire les nouvelles données
  await fs.writeFile(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Données sauvegardées');
}

/**
 * Script principal
 */
async function main() {
  console.log('🔧 Mise à jour des données LOLDrivers');
  console.log('=====================================');
  
  try {
    // Télécharger les nouvelles données
    const newData = await downloadData(REMOTE_URL);
    
    // Valider les données
    validateData(newData);
    
    // Vérifier s'il y a des changements
    const hasChanges = await compareData(newData);
    
    if (!hasChanges) {
      console.log('🎯 Aucun changement détecté, données déjà à jour');
      return;
    }
    
    console.log('📝 Changements détectés, mise à jour...');
    
    // Sauvegarder les nouvelles données
    await saveData(newData);
    
    console.log('🎉 Mise à jour terminée avec succès!');
    console.log(`📊 Total: ${newData.length} drivers`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { downloadData, validateData, compareData, saveData };
