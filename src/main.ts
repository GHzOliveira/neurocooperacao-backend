import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type, Authorization',
  });
  const port = process.env.APP_PORT || 3333;
  const server = await app.listen(port);

  const ioServer = new Server(server, {
    cors: {
      origin: '*',
    },
  });
}
bootstrap();
