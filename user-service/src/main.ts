import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);
  
  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Security
  app.use(helmet());
  
  // CORS
  const corsEnabled = configService.get<boolean>('app.cors.enabled');
  if (corsEnabled) {
    app.enableCors({
      origin: configService.get<string[]>('app.cors.origin'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
  }
  
  // Swagger documentation
  const swaggerEnabled = configService.get<boolean>('app.swagger.enabled');
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('app.swagger.title'))
      .setDescription(configService.get<string>('app.swagger.description'))
      .setVersion(configService.get<string>('app.swagger.version'))
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(
      configService.get<string>('app.swagger.path'),
      app,
      document,
    );
    
    logger.log(`Swagger documentation is available at /${configService.get<string>('app.swagger.path')}`);
  }
  
  // Start server
  const port = configService.get<number>('app.port');
  await app.listen(port);
  
  logger.log(`User Service is running on port ${port}`);
  logger.log(`Environment: ${configService.get<string>('app.environment')}`);
}

bootstrap();
