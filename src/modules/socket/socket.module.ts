import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { GameServer } from './gameserver.service';
import { SocketController } from './socket.controller';

@Module({
  controllers: [SocketController],
  providers: [SocketService, SocketGateway, PrismaService, GameServer]
})
export class SocketModule {}
