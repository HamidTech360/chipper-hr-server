import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } catch (err) {
    console.error('--- !!! SERVER FAILED TO START !!! ---');
    console.error(err);
    process.exit(1);
  }
}
bootstrap();
