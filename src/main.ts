import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type, Authorization',
  });
  const server = await app.listen(3333);

  const ioServer = new Server(server, {
    cors: {
      origin: '*',
    },
  });
}
bootstrap();
