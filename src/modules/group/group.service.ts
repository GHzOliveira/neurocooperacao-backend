import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { Rodada } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(private prisma: PrismaService) {}

  async getAllGroups() {
    return this.prisma.grupo.findMany();
  }

  async getGroupWithRounds(id: string) {
    return this.prisma.grupo.findUnique({
      where: {
        id: id,
      },
      include: {
        rodada: true,
      },
    });
  }

  async getGameRule(groupId: string): Promise<string> {
    const group = await this.prisma.grupo.findUnique({
      where: { id: groupId },
      select: { gameRule: true },
    });

    if (!group) {
      throw new Error(`Grupo com ID ${groupId} não encontrado`);
    }

    return group.gameRule;
  }

  async getRoundDetails(groupId: string, nRodada: string): Promise<Rodada> {
    const round = await this.prisma.rodada.findFirst({
      where: { groupId: groupId, nRodada: nRodada },
      select: {
        id: true,
        nEuro: true,
        retribuicao: true,
        qntRetribuicao: true,
        nRodada: true,
        groupId: true,
        data: true,
      },
    });

    if (!round) {
      throw new Error(
        `Rodada com nRodada ${nRodada} não encontrada para o grupo ${groupId}`,
      );
    }

    return round;
  }

  async createGroup(data: CreateGroupDto) {
    if (!data.name) {
      throw new HttpException(
        'Nome do grupo é obrigatório',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingGroup = await this.prisma.grupo.findUnique({
      where: {
        nome: data.name,
      },
    });

    if (existingGroup) {
      throw new HttpException('Grupo já existe', HttpStatus.CONFLICT);
    }

    const group = await this.prisma.grupo.create({
      data: {
        nome: data.name,
      },
    });

    for (const rodadaData of data.rodada) {
      await this.prisma.rodada.create({
        data: {
          groupId: group.id,
          nEuro: rodadaData.nEuro,
          retribuicao: rodadaData.retribuicao,
          qntRetribuicao: rodadaData.qntRetribuicao,
          nRodada: rodadaData.nRodada,
          data: new Date(),
        },
      });
    }

    return group;
  }

  async deleteGroup(id: string) {
    await this.prisma.user.deleteMany({
      where: {
        grupoId: id,
      },
    });
    await this.prisma.rodada.deleteMany({
      where: {
        groupId: id,
      },
    });
    await this.prisma.valores.deleteMany({
      where: {
        grupoId: id,
      },
    });
    return this.prisma.grupo.delete({
      where: {
        id: id,
      },
    });
  }

  async updateGroup(id: string, data: UpdateGroupDto) {
    return this.prisma.grupo.update({
      where: {
        id: id,
      },
      data: {
        nome: data.name,
      },
    });
  }

  async updateRound(
    id: string,
    data: {
      nEuro: string;
      retribuicao: string;
      qntRetribuicao: string;
      nRodada: string;
    },
  ) {
    return this.prisma.rodada.update({
      where: {
        id: id,
      },
      data: {
        nEuro: data.nEuro,
        retribuicao: data.retribuicao,
        qntRetribuicao: data.qntRetribuicao,
        nRodada: data.nRodada,
      },
    });
  }

  async applyNEuro(groupId: string, nEuro: string, totalUsuarios?: number) {
    let valores = await this.prisma.valores.findFirst({
      where: { grupoId: groupId },
    });

    if (!valores) {
      valores = await this.prisma.valores.create({
        data: {
          grupoId: groupId,
          totalNEuro: nEuro,
          totalUsuarios: totalUsuarios,
          fundoRetido: '0',
        },
      });
    } else {
      const totalNEuro = parseFloat(valores.totalNEuro) + parseFloat(nEuro);
      const newTotalUsuarios = (valores.totalUsuarios || 0) + (totalUsuarios || 0);
      valores = await this.prisma.valores.update({
        where: { id: valores.id },
        data: { totalNEuro: totalNEuro.toString(), totalUsuarios: newTotalUsuarios },
      });
    }

    return valores;
  }

  async nextRound(groupId: string) {
    const valores = await this.prisma.valores.findFirst({
      where: { grupoId: groupId },
    });
  
    if (!valores) {
      throw new Error(`Valores para o grupo com ID ${groupId} não encontrados`);
    }
  
    const totalNEuro = parseFloat(valores.totalNEuro);
    const totalUsuarios = valores.totalUsuarios;
    const nEuroPorUsuario = Math.floor(totalNEuro / totalUsuarios);
    const fundoRetido = (totalNEuro / totalUsuarios - nEuroPorUsuario) * totalUsuarios;
  
   
    const rodada = await this.prisma.rodada.findFirst({
      where: { groupId: groupId },
      orderBy: { data: 'desc' },
    });
  
    if (!rodada) {
      throw new Error(`Rodada para o grupo com ID ${groupId} não encontrada`);
    }
  
    const users = await this.prisma.user.findMany({
      where: { grupoId: groupId },
    });
  
    for (const user of users) {
      let userNEuro = nEuroPorUsuario;
  
      if (rodada.retribuicao === 'Valor Inteiro') {
        userNEuro += parseInt(rodada.qntRetribuicao);
      } else if (rodada.retribuicao === 'Porcentagem') {
        userNEuro += nEuroPorUsuario * (parseInt(rodada.qntRetribuicao) / 100);
      }
  
      await this.prisma.user.update({
        where: { id: user.id },
        data: { nEuro: userNEuro.toString() },
      });
    }
  
    await this.prisma.valores.update({
      where: { id: valores.id },
      data: {
        totalNEuro: (totalNEuro - nEuroPorUsuario * totalUsuarios).toString(),
        fundoRetido: fundoRetido.toString(),
      },
    });
  }
}
