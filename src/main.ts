import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); 
  app.enableCors({
   // origin: process.env.APP_URL,
    origin :'*',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Bank API')
    .setDescription('API Documentation for Bank App')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); 
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
