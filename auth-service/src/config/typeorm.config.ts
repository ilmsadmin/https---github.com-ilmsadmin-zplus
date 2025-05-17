import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.SYSTEM_DB_HOST,
  port: parseInt(process.env.SYSTEM_DB_PORT || '5432', 10),
  username: process.env.SYSTEM_DB_USERNAME,
  password: process.env.SYSTEM_DB_PASSWORD,
  database: process.env.SYSTEM_DB_NAME,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsTableName: 'migrations',
});
