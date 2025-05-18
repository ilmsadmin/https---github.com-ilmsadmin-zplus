import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
  const host = configService.get<string>('database.host');
  const port = configService.get<number>('database.port');
  const username = configService.get<string>('database.username');
  const password = configService.get<string>('database.password');
  const database = configService.get<string>('database.name');
  const schema = configService.get<string>('database.schema');

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    schema,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsRun: false,
    synchronize: configService.get<string>('app.env') !== 'production',
    logging: configService.get<string>('app.env') !== 'production',
    logger: 'file',
  };
}
