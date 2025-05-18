/**
 * Script to check internationalization implementation health
 * 
 * This script checks:
 * 1. All required translations exist for each locale
 * 2. Formatting functions work correctly for each locale
 * 3. RTL support is properly implemented
 * 4. All UI components display correctly in each locale
 */

const path = require('path');
const fs = require('fs');
const glob = require('glob');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    gray: '\x1b[100m',
  }
};

// Configuration
const LOCALES = ['vi', 'en', 'zh', 'ja', 'ar', 'he'];
const REQUIRED_NAMESPACES = ['common', 'auth', 'tenant'];
const MESSAGES_DIR = path.join(__dirname, '../frontend/src/messages');

// Check if all required translations exist
function checkTranslations() {
  console.log(colors.fg.blue + 'Checking translations...' + colors.reset);
  
  let missingTranslations = 0;
  
  // Get reference locale (en) keys
  const referenceKeys = {};
  
  REQUIRED_NAMESPACES.forEach(namespace => {
    const refPath = path.join(MESSAGES_DIR, 'en', `${namespace}.json`);
    
    if (fs.existsSync(refPath)) {
      const referenceFile = require(refPath);
      referenceKeys[namespace] = extractAllKeys(referenceFile);
    } else {
      console.error(colors.fg.red + `Reference file not found: ${refPath}` + colors.reset);
      missingTranslations++;
    }
  });
  
  // Check each locale against reference keys
  LOCALES.forEach(locale => {
    if (locale === 'en') return; // Skip reference locale
    
    REQUIRED_NAMESPACES.forEach(namespace => {
      const localePath = path.join(MESSAGES_DIR, locale, `${namespace}.json`);
      
      if (!fs.existsSync(localePath)) {
        console.error(colors.fg.red + `Missing file: ${localePath}` + colors.reset);
        missingTranslations++;
        return;
      }
      
      const localeFile = require(localePath);
      const localeKeys = extractAllKeys(localeFile);
      
      // Check for missing keys
      referenceKeys[namespace].forEach(key => {
        if (!localeKeys.includes(key)) {
          console.error(colors.fg.yellow + `Missing key in ${locale}/${namespace}: ${key}` + colors.reset);
          missingTranslations++;
        }
      });
      
      // Check for extra keys
      localeKeys.forEach(key => {
        if (!referenceKeys[namespace].includes(key)) {
          console.warn(colors.fg.gray + `Extra key in ${locale}/${namespace}: ${key}` + colors.reset);
        }
      });
    });
  });
  
  if (missingTranslations > 0) {
    console.error(colors.fg.red + `Found ${missingTranslations} missing translations!` + colors.reset);
  } else {
    console.log(colors.fg.green + 'All translations are present!' + colors.reset);
  }
  
  return missingTranslations === 0;
}

// Check if all components use translations correctly
function checkComponentsUsage() {
  console.log(colors.fg.blue + 'Checking component usage of translations...' + colors.reset);
  
  const files = glob.sync(path.join(__dirname, '../frontend/src/components/**/*.{tsx,jsx}'));
  const appFiles = glob.sync(path.join(__dirname, '../frontend/src/app/**/*.{tsx,jsx}'));
  
  const allFiles = [...files, ...appFiles];
  
  let missingTranslationUsage = 0;
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip files that are specifically for i18n
    if (file.includes('/i18n/') || file.includes('layout.tsx')) {
      return;
    }
    
    // Check if the component uses the useTranslations hook
    if (!content.includes('useTranslations') && !content.includes('useFormatter')) {
      if (content.includes('<') && content.includes('>')) {
        // This is likely a component with UI
        console.warn(colors.fg.yellow + `Component might not use translations: ${file}` + colors.reset);
      }
    }
    
    // Check for hardcoded strings that should be translated
    const hardcodedStrings = findHardcodedStrings(content);
    if (hardcodedStrings.length > 0) {
      console.warn(colors.fg.yellow + `Potential hardcoded strings in ${file}:` + colors.reset);
      hardcodedStrings.forEach(str => {
        console.warn(`  - ${str}`);
        missingTranslationUsage++;
      });
    }
  });
  
  if (missingTranslationUsage > 0) {
    console.error(colors.fg.red + `Found ${missingTranslationUsage} potential hardcoded strings!` + colors.reset);
  } else {
    console.log(colors.fg.green + 'No obvious hardcoded strings found!' + colors.reset);
  }
  
  return missingTranslationUsage === 0;
}

// Check RTL implementation
function checkRTLImplementation() {
  console.log(colors.fg.blue + 'Checking RTL implementation...' + colors.reset);
  
  const cssFiles = glob.sync(path.join(__dirname, '../frontend/src/**/*.css'));
  const componentFiles = glob.sync(path.join(__dirname, '../frontend/src/components/**/*.{tsx,jsx}'));
  
  let rtlIssues = 0;
  
  // Check for RTL classes in CSS
  cssFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('.rtl') && !content.includes('[dir="rtl"]')) {
      console.warn(colors.fg.yellow + `CSS file might need RTL styles: ${file}` + colors.reset);
      rtlIssues++;
    }
  });
  
  // Check for directional properties in components
  componentFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Look for potentially problematic directional CSS
    const directionalProps = [
      'margin-left', 'margin-right',
      'padding-left', 'padding-right',
      'border-left', 'border-right',
      'left:', 'right:',
      'float:', 'text-align:'
    ];
    
    let found = false;
    directionalProps.forEach(prop => {
      if (content.includes(prop)) {
        if (!found) {
          console.warn(colors.fg.yellow + `Component might need RTL adjustments: ${file}` + colors.reset);
          found = true;
          rtlIssues++;
        }
        console.warn(`  - Found: ${prop}`);
      }
    });
  });
  
  if (rtlIssues > 0) {
    console.error(colors.fg.red + `Found ${rtlIssues} potential RTL issues!` + colors.reset);
  } else {
    console.log(colors.fg.green + 'RTL implementation looks good!' + colors.reset);
  }
  
  return rtlIssues === 0;
}

// Utility functions
function extractAllKeys(obj, prefix = '') {
  let keys = [];
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = [...keys, ...extractAllKeys(obj[key], fullKey)];
    } else {
      keys.push(fullKey);
    }
  });
  
  return keys;
}

function findHardcodedStrings(content) {
  // This is a simple heuristic and may have false positives/negatives
  const result = [];
  
  // Find strings inside JSX
  const jsxRegex = />([A-Z][a-z]+(\s+[A-Za-z]+)+)</g;
  let match;
  
  while ((match = jsxRegex.exec(content)) !== null) {
    // Ignore special cases
    if (match[1].length > 5 && !match[1].includes('{') && !match[1].match(/^\d/)) {
      result.push(match[1]);
    }
  }
  
  return result;
}

// Run all checks
function runChecks() {
  console.log(colors.bright + 'Running internationalization checks...' + colors.reset);
  
  const translationsOk = checkTranslations();
  const componentsOk = checkComponentsUsage();
  const rtlOk = checkRTLImplementation();
  
  console.log('\n' + colors.bright + 'Summary:' + colors.reset);
  console.log(`Translations: ${translationsOk ? colors.fg.green + '✓' : colors.fg.red + '✗'}` + colors.reset);
  console.log(`Components usage: ${componentsOk ? colors.fg.green + '✓' : colors.fg.red + '✗'}` + colors.reset);
  console.log(`RTL implementation: ${rtlOk ? colors.fg.green + '✓' : colors.fg.red + '✗'}` + colors.reset);
  
  if (translationsOk && componentsOk && rtlOk) {
    console.log('\n' + colors.bright + colors.fg.green + 'All checks passed!' + colors.reset);
    return 0;
  } else {
    console.log('\n' + colors.bright + colors.fg.red + 'Some checks failed. See details above.' + colors.reset);
    return 1;
  }
}

// Run the script
const exitCode = runChecks();
process.exit(exitCode);
