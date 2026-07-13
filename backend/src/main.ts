import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
// import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
// import { AllExceptionsFilter } from '@common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  // app.enableVersioning({ type: VersioningType.URI });

  // Cookie parser
  app.use(cookieParser()); // must be before global filters/interceptors/pipes

  // ExceptionFilter global
  // app.useGlobalFilters(new AllExceptionsFilter()); // catch error from pipe, guard, interceptor

  // Interceptor global
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector), // strip @Exclude()
    // new TransformInterceptor(reflector), // wrap ApiResponse shape
  );

  // ValidationPipe global - validate request body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Simple Banking App API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(Number(process.env.PORT) || 5500, '127.0.0.1');
}
bootstrap();
