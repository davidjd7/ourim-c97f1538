#!/usr/bin/env node

/**
 * Script pour lancer les tests unitaires
 * Alternative à l'ajout de scripts dans package.json
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.bold}Exécution: ${command} ${args.join(' ')}${colors.reset}`, 'blue');
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        log(`✓ Commande terminée avec succès`, 'green');
        resolve(code);
      } else {
        log(`✗ Erreur lors de l'exécution (code: ${code})`, 'red');
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    process.on('error', (error) => {
      log(`✗ Erreur: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function runTests() {
  const command = process.argv[2] || 'run';
  
  log('🧪 Lanceur de tests unitaires', 'bold');
  log('================================\n', 'yellow');

  try {
    switch (command) {
      case 'run':
        log('Lancement des tests...', 'blue');
        await runCommand('npx', ['vitest', 'run']);
        break;
        
      case 'watch':
        log('Lancement des tests en mode watch...', 'blue');
        await runCommand('npx', ['vitest', 'watch']);
        break;
        
      case 'ui':
        log('Ouverture de l\'interface UI des tests...', 'blue');
        await runCommand('npx', ['vitest', '--ui']);
        break;
        
      case 'coverage':
        log('Lancement des tests avec couverture...', 'blue');
        await runCommand('npx', ['vitest', 'run', '--coverage']);
        break;
        
      default:
        log('Usage:', 'yellow');
        log('  node run-tests.js [command]', 'white');
        log('\nCommandes disponibles:', 'yellow');
        log('  run      - Lance tous les tests une fois', 'white');
        log('  watch    - Lance les tests en mode watch', 'white');
        log('  ui       - Ouvre l\'interface UI des tests', 'white');
        log('  coverage - Lance les tests avec rapport de couverture', 'white');
        break;
    }
    
    log('\n✓ Tous les tests sont terminés', 'green');
  } catch (error) {
    log('\n✗ Erreur lors de l\'exécution des tests:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Lancement du script
runTests();