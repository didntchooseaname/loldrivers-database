#!/usr/bin/env node

/**
 * Script de test pour le système de vérification des drivers vulnérables
 * Usage: node scripts/test-update.js
 */

import { main } from './check-vulnerable-drivers.js';

console.log('🧪 Test du système de vérification HVCI...\n');

try {
  await main();
  console.log('✅ Test réussi !');
} catch (error) {
  console.error('❌ Test échoué:', error.message);
  process.exit(1);
}
