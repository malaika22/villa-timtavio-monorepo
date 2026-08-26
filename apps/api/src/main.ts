import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // Required for Stripe webhook signature validation
  });

  /**
   * Read the caller's real address from X-Forwarded-For.
   *
   * Render terminates TLS at its own proxy, so without this every request
   * arrives wearing the proxy's address rather than the guest's. Express then
   * reports that as `req.ip` — which is what the rate limit on the magic-link
   * verify route counts by, and it made twelve rapid attempts from one machine
   * look like twelve separate callers.
   *
   * One hop, not `true`. Trusting the whole chain lets a caller prepend
   * whatever address they like to the header and be counted as a different
   * person on every attempt — which is the exact thing the limit exists to
   * stop.
   */
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow the three frontends (Guest PWA, Owner + Estate Manager dashboards).
  // DASHBOARD_URL is kept as a backward-compatible alias for a single dashboard
  // origin. Undefined entries are filtered so unset vars don't allow "undefined".
  const allowedOrigins = [
    process.env.PWA_URL,
    process.env.OWNER_DASHBOARD_URL,
    process.env.EM_DASHBOARD_URL,
    process.env.DASHBOARD_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ].filter((o): o is string => !!o);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Villa TimTavio API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4000, '0.0.0.0');
  console.log(await app.getUrl());
}
bootstrap();
