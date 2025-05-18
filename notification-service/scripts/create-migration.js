#!/usr/bin/env node
const { exec } = require('child_process');
require('dotenv').config();

// Configuration
const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Migration name is required. Example: npm run migration:create -- CreateNotificationsTable');
  process.exit(1);
}

// Format migration name with timestamp
const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const formattedName = `${timestamp}-${migrationName}`;

// Create migration
const command = `npx typeorm migration:create -n ${formattedName}`;

console.log(`Creating migration: ${formattedName}`);
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  console.log(`Migration created successfully:\n${stdout}`);
});
