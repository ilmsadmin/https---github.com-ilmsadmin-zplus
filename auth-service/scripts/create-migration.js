#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Configure migration parameters
const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
const migrationName = process.argv[2] || 'migration';
const fullName = `${timestamp}_${migrationName}`;
const migrationsDir = path.join(__dirname, '../src/migrations');

// Create migrations directory if it doesn't exist
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate TypeORM migration file
const migrationContent = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${fullName.charAt(0).toUpperCase() + fullName.slice(1)} implements MigrationInterface {
  name = '${fullName}';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration SQL here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your rollback SQL here
  }
}
`;

const migrationFile = path.join(migrationsDir, `${fullName}.ts`);
fs.writeFileSync(migrationFile, migrationContent);

console.log(`Migration file created: ${migrationFile}`);
