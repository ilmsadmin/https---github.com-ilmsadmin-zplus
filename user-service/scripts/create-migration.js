const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the migration name from command line args
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, '../src/database/migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Create a timestamp for the migration file
const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
const migrationFileName = `${timestamp}-${migrationName}`;

// Run TypeORM migration:create command
try {
  const command = `npx typeorm migration:create src/database/migrations/${migrationFileName}`;
  console.log(`Executing: ${command}`);
  execSync(command, { stdio: 'inherit' });
  console.log(`Migration file created: ${migrationFileName}`);
} catch (error) {
  console.error('Failed to create migration', error);
  process.exit(1);
}
