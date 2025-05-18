import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    synchronize: configService.get<boolean>('database.synchronize'),
    logging: configService.get<boolean>('database.logging'),
    ssl: configService.get<boolean>('database.ssl')
      ? {
          rejectUnauthorized: false,
        }
      : false,
    migrations: [join(__dirname, './migrations/*{.ts,.js}')],
    migrationsRun: configService.get<boolean>('database.migrationsRun'),
  };
};
