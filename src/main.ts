import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const server = await app.listen(3000);

  const ioServer = new Server(server, {
    cors: {
      origin: '*',
    },
  });
}
bootstrap();
