import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { Env } from './modules/shared/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.enableCors();
  app.setGlobalPrefix('/api-gateway/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .join(', ');
        return new BadRequestException(messages);
      },
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(morgan('dev'));
  const config = new DocumentBuilder()
    .setTitle('Eduflex AI')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addTag('EDX 1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api-gateway/v1/docs', app, document);
  await app.listen(Env.PORT || '5000');
}
void bootstrap();
