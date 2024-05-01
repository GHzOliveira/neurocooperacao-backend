import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        nome: data.nome,
        whatsapp: data.whatsapp,
        grupoId: data.grupo,
        nEuro: data.nEuro,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: CreateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        nome: data.nome,
        whatsapp: data.whatsapp,
        grupoId: data.grupo,
        nEuro: data.nEuro,
      },
    });
  }

  async updateNEuro(id: string, data: CreateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        nEuro: data.nEuro,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
  
}
