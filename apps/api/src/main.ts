import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    instrument:
      process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET
        ? ObserveInstrument
        : undefined,
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
