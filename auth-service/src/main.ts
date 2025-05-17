import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger } from './common/logger/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  const configService = app.get(ConfigService);
  const logger = app.get(AppLogger);
  logger.setContext('Bootstrap');
  
  app.useLogger(logger);
  
  // Global middleware
  app.use(helmet());
  app.enableCors();
  
  // Global pipes
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
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('Multi-tenant Authentication and Authorization Service')
    .setVersion('1.0')
    .addTag('Authentication')
    .addTag('MFA')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Start server
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation available at: http://localhost:${port}/api`);
}
bootstrap();
