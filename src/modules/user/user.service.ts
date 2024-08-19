import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const grupo = await this.prisma.grupo.findUnique({ where: { id: data.grupo } });
    if (!grupo) {
      throw new NotFoundException(`Grupo com ID ${data.grupo} não encontrado`);
    }

    return await this.prisma.user.create({
      data: {
        nome: data.nome,
        whatsapp: data.whatsapp,
        grupoId: data.grupo,
        nEuro: data.nEuro,
      },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: CreateUserDto) {
    return await this.prisma.user.update({
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
    return await this.prisma.user.update({
      where: { id },
      data: {
        nEuro: data.nEuro,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.prisma.valores.updateMany({
      where: { grupoId: user.grupoId },
      data: {
        totalUsuarios: {
          decrement: 1,
        },
      },
    });
    return await this.prisma.user.delete({ where: { id } });
  }
  
}
