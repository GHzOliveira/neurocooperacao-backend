import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './env';
import { AdminModule } from './modules/admin/admin.module';
import { GroupModule } from './modules/group/group.module';
import { SocketModule } from './modules/socket/socket.module';
import { UserModule } from './modules/user/user.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envSchema,
      isGlobal: true,
    }),
    AdminModule,
    GroupModule,
    UserModule,
    SocketModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
