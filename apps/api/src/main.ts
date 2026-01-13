import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let app: any;

async function bootstrap() {
  if (!app) {
    const adapter = new ExpressAdapter(server);
    app = await NestFactory.create(AppModule, adapter);
    app.enableCors();
    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
