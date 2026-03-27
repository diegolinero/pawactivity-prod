import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MetricsService } from './modules/metrics/metrics.service';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  const prisma = app.get(PrismaService);
  const metrics = app.get(MetricsService);
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.use((request: { method?: string; url?: string }, response: { statusCode: number; on: (event: string, callback: () => void) => void }, next: () => void) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      metrics.trackApiRequest(response.statusCode, Date.now() - startedAt);
    });
    next();
  });

  app.setGlobalPrefix('v1');

  app.enableCors({
    origin: ['https://app.pawactivity.com'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
});

  app.useGlobalPipes(
   new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
     transform: true,
  }),
);

 
  app.useGlobalFilters(new HttpExceptionFilter());
  await prisma.enableShutdownHooks(app);

  const host = process.env.API_HOST ?? '0.0.0.0';
  const port = Number(process.env.API_PORT ?? 4000);
  const publicUrl = process.env.API_PUBLIC_URL ?? `http://localhost:${port}/v1`;
  await app.listen(port, host);
  console.log(`API listening on ${publicUrl}`);
}

bootstrap();
