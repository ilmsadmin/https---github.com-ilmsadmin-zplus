import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'system',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.system.host'),
        port: configService.get<number>('database.system.port'),
        username: configService.get<string>('database.system.username'),
        password: configService.get<string>('database.system.password'),
        database: configService.get<string>('database.system.database'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('nodeEnv') === 'development',
        logging: configService.get<string>('nodeEnv') === 'development',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
