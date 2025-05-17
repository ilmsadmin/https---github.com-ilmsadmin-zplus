import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Get configuration values
  const port = configService.get<number>('app.port');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const corsEnabled = configService.get<boolean>('app.cors.enabled');
  const corsOrigin = configService.get<string[]>('app.cors.origin');
  const swaggerEnabled = configService.get<boolean>('app.swagger.enabled');
  const serviceName = configService.get<string>('app.serviceName');
  
  // Set global prefix
  app.setGlobalPrefix(apiPrefix);
  
  // Enable CORS if configured
  if (corsEnabled) {
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
  }
  
  // Set up global validation pipe
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
  
  // Set up Helmet for security headers
  app.use(helmet());
  
  // Set up Swagger documentation
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
  }
  
  // Start server
  await app.listen(port);
  console.log(`${serviceName} running on port ${port}`);
}
