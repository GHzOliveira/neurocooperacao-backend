import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));
 await app.listen(process.env.PORT || 3333);
}
bootstrap();
