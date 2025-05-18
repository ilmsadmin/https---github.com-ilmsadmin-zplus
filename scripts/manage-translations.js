#!/usr/bin/env node

/**
 * Translation Management Script
 * 
 * This script helps manage translations for the multi-tenant application.
 * It can:
 * - Extract translation keys from code
 * - Add/update translations
 * - Compare translations across languages
 * - Identify missing translations
 * - Export/import translations
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const yargs = require('yargs');

// Supported languages
const SUPPORTED_LOCALES = ['vi', 'en', 'zh', 'ja', 'ar', 'he'];
const DEFAULT_LOCALE = 'vi';

// Path to translations directory
const TRANSLATIONS_DIR = path.join(__dirname, '../frontend/src/lib/i18n');
const MESSAGES_FILE = path.join(TRANSLATIONS_DIR, 'messages.ts');

// Command line arguments
const argv = yargs
  .command('extract', 'Extract translation keys from source code')
  .command('check', 'Check for missing translations')
  .command('add', 'Add a new translation key', {
    key: {
      description: 'Translation key path (e.g., common.welcome)',
      type: 'string',
      demandOption: true
    },
    value: {
      description: 'Value for the default locale',
      type: 'string',
      demandOption: true
    }
  })
  .command('export', 'Export translations to JSON files', {
    locale: {
      description: 'Locale to export (default: all)',
      type: 'string'
    },
    output: {
      description: 'Output directory',
      type: 'string',
      default: './translations-export'
    }
  })
  .command('import', 'Import translations from JSON files', {
    input: {
      description: 'Input directory or file',
      type: 'string',
      demandOption: true
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Main function
 */
async function main() {
  try {
    const command = argv._[0];
    
    switch (command) {
      case 'extract':
        await extractTranslationKeys();
        break;
      case 'check':
        await checkMissingTranslations();
        break;
      case 'add':
        await addTranslationKey(argv.key, argv.value);
        break;
      case 'export':
        await exportTranslations(argv.locale, argv.output);
        break;
      case 'import':
        await importTranslations(argv.input);
        break;
      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

/**
 * Extract translation keys from source code
 */
async function extractTranslationKeys() {
  console.log(chalk.blue('Extracting translation keys...'));
  
  const sourceFiles = glob.sync('./frontend/src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  const translationKeyPattern = /[t|useTranslations]\(['"]([^'"]+)['"]\)|t\(['"]([^'"]+)['"]\)/g;
  const extractedKeys = new Set();
  
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    
    while ((match = translationKeyPattern.exec(content)) !== null) {
      const key = match[1] || match[2];
      if (key) {
        extractedKeys.add(key);
      }
    }
  }
  
  console.log(chalk.green(`Found ${extractedKeys.size} translation keys`));
  console.log(Array.from(extractedKeys).join('\n'));
}

/**
 * Check for missing translations
 */
async function checkMissingTranslations() {
  console.log(chalk.blue('Checking for missing translations...'));
  
  // Load current translations
  const translations = await loadTranslations();
  
  // Get all keys from default locale
  const defaultLocaleKeys = getAllKeys(translations[DEFAULT_LOCALE]);
  
  // Check each locale against default
  let totalMissing = 0;
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) continue;
    
    const localeKeys = getAllKeys(translations[locale]);
    const missingKeys = defaultLocaleKeys.filter(key => !localeKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.log(chalk.yellow(`\n${locale}: ${missingKeys.length} missing translations`));
      missingKeys.forEach(key => console.log(`  - ${key}`));
      totalMissing += missingKeys.length;
    } else {
      console.log(chalk.green(`${locale}: No missing translations`));
    }
  }
  
  if (totalMissing > 0) {
    console.log(chalk.yellow(`\nTotal missing translations: ${totalMissing}`));
  } else {
    console.log(chalk.green('\nAll translations are complete!'));
  }
}

/**
 * Add a new translation key
 */
async function addTranslationKey(key, value) {
  console.log(chalk.blue(`Adding translation key: ${key} = ${value}`));
  
  // Load current translations
  const translations = await loadTranslations();
  
  // Check if key already exists
  const keyPath = key.split('.');
  const keyExists = keyPath.reduce((obj, part) => obj && obj[part] ? obj[part] : undefined, translations[DEFAULT_LOCALE]);
  
  if (keyExists) {
    console.log(chalk.yellow(`Key ${key} already exists with value: ${JSON.stringify(keyExists)}`));
    
    // Ask for confirmation to override
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('Override? (y/N) ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Aborted.'));
      return;
    }
  }
  
  // Add key to all locales
  for (const locale of SUPPORTED_LOCALES) {
    const localeTranslations = translations[locale];
    setNestedValue(localeTranslations, keyPath, locale === DEFAULT_LOCALE ? value : `[${locale}] ${value}`);
  }
  
  // Save updated translations
  await saveTranslations(translations);
  
  console.log(chalk.green('Translation key added successfully!'));
}

/**
 * Export translations to JSON files
 */
async function exportTranslations(locale, outputDir) {
  console.log(chalk.blue('Exporting translations...'));
  
  // Load current translations
  const translations = await loadTranslations();
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Determine which locales to export
  const localesToExport = locale ? [locale] : SUPPORTED_LOCALES;
  
  // Export each locale
  for (const loc of localesToExport) {
    if (!translations[loc]) {
      console.log(chalk.yellow(`Locale ${loc} not found, skipping.`));
      continue;
    }
    
    const outputPath = path.join(outputDir, `${loc}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(translations[loc], null, 2), 'utf-8');
    console.log(chalk.green(`Exported ${loc} translations to ${outputPath}`));
  }
}

/**
 * Import translations from JSON files
 */
async function importTranslations(input) {
  console.log(chalk.blue('Importing translations...'));
  
  // Load current translations
  const translations = await loadTranslations();
  
  if (fs.statSync(input).isDirectory()) {
    // Import all JSON files from directory
    const files = fs.readdirSync(input)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(input, file));
    
    for (const file of files) {
      await importTranslationFile(file, translations);
    }
  } else {
    // Import single file
    await importTranslationFile(input, translations);
  }
  
  // Save updated translations
  await saveTranslations(translations);
  
  console.log(chalk.green('Translations imported successfully!'));
}

/**
 * Import translations from a single file
 */
async function importTranslationFile(filePath, translations) {
  const fileName = path.basename(filePath, '.json');
  
  if (!SUPPORTED_LOCALES.includes(fileName)) {
    console.log(chalk.yellow(`File ${filePath} does not match a supported locale, skipping.`));
    return;
  }
  
  console.log(chalk.blue(`Importing ${fileName} translations from ${filePath}...`));
  
  const importedTranslations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  translations[fileName] = mergeTranslations(translations[fileName] || {}, importedTranslations);
  
  console.log(chalk.green(`Imported ${fileName} translations.`));
}

/**
 * Load translations from messages.ts
 */
async function loadTranslations() {
  // This is a simplified approach. In a real implementation, you'd need a proper TS parser.
  console.log(chalk.blue('Loading translations...'));
  
  const content = fs.readFileSync(MESSAGES_FILE, 'utf-8');
  
  // Extract the messages object from the file
  const messagesMatch = content.match(/export const messages[^{]*{([^]+)};/);
  if (!messagesMatch) {
    throw new Error('Could not extract messages from file');
  }
  
  let messagesContent = messagesMatch[1];
  
  // Replace TypeScript syntax with valid JSON syntax
  messagesContent = messagesContent
    .replace(/\/\*[^*]*\*\/|\/\/[^\n]*/g, '') // Remove comments
    .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
  
  // Wrap in object braces and parse
  try {
    // Evaluate as JavaScript (caution: this is simplified and not secure)
    const mockExports = {};
    const mockModule = { exports: mockExports };
    
    const evalFn = new Function('module', 'exports', `
      exports.messages = {${messagesContent}};
      return module.exports;
    `);
    
    const result = evalFn(mockModule, mockExports);
    return result.messages;
  } catch (error) {
    console.error('Error parsing messages:', error);
    throw new Error('Failed to parse messages file');
  }
}

/**
 * Save translations to messages.ts
 */
async function saveTranslations(translations) {
  console.log(chalk.blue('Saving translations...'));
  
  // Create backup of original file
  const backupPath = `${MESSAGES_FILE}.backup`;
  fs.copyFileSync(MESSAGES_FILE, backupPath);
  
  // Build file content
  let content = `export const locales = ['vi', 'en', 'zh', 'ja', 'ar', 'he'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'vi';

interface Messages {
  [key: string]: string | Messages;
}

export const messages: Record<Locale, Messages> = ${formatObject(translations)};`;
  
  // Write to file
  fs.writeFileSync(MESSAGES_FILE, content, 'utf-8');
  
  console.log(chalk.green('Translations saved successfully!'));
  console.log(chalk.blue(`Backup saved to ${backupPath}`));
}

// Utility Functions

/**
 * Get all keys in an object (flattened)
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys = [...keys, ...getAllKeys(value, newKey)];
    } else {
      keys.push(newKey);
    }
  }
  
  return keys;
}

/**
 * Set a nested value in an object
 */
function setNestedValue(obj, parts, value) {
  const key = parts[0];
  
  if (parts.length === 1) {
    obj[key] = value;
    return;
  }
  
  if (!obj[key] || typeof obj[key] !== 'object') {
    obj[key] = {};
  }
  
  setNestedValue(obj[key], parts.slice(1), value);
}

/**
 * Merge translations objects
 */
function mergeTranslations(target, source) {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = mergeTranslations(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Format object as a nicely indented string for code generation
 */
function formatObject(obj, level = 0) {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  const indent = '  '.repeat(level + 1);
  const closingIndent = '  '.repeat(level);
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => formatObject(item, level + 1));
    return `[${items.join(', ')}]`;
  }
  
  const entries = Object.entries(obj).map(([key, value]) => {
    const formattedKey = /^[a-zA-Z0-9_]+$/.test(key) ? key : JSON.stringify(key);
    return `${indent}${formattedKey}: ${formatObject(value, level + 1)}`;
  });
  
  return `{\n${entries.join(',\n')}\n${closingIndent}}`;
}

// Run the script
main().catch(console.error);
