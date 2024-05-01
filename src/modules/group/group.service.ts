import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { Prisma, Rodada } from '@prisma/client';

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
    const users = await this.prisma.user.findMany({
      where: {
        grupoId: id,
      },
      select: {
        id: true,
      },
    });
    for (const user of users) {
      await this.prisma.transaction.deleteMany({
        where: {
          userId: user.id,
        },
      });
    }
    await this.prisma.user.deleteMany
    ({
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
    await this.prisma.transaction.deleteMany({
      where: {
        user: {
          grupoId: id,
        }
      },
    })
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

  async getValue(groupId: string, field: keyof Prisma.ValoresUncheckedCreateInput): Promise<string | number | null> {
    const value = await this.prisma.valores.findFirst({
      where: { grupoId: groupId },
      select: { [field]: true },
    });
  
    return value ? value[field] : null;
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

  async createTransaction(userId: string, roundId: string, transactionType: string, amount: string) {
    return this.prisma.transaction.create({
      data: {
        userId: userId,
        roundId: roundId,
        transactionType: transactionType,
        amount: amount,
      },
    });
  }

  async getTransaction(id: string) {
    return this.prisma.transaction.findUnique({
      where: {
        id: id,
      },
    });
  }

  async applyNEuro(groupId: string, nEuro: string, totalUsuarios?: number) {
    const user = await this.prisma.user.findFirst({
      where: { grupoId: groupId },
    });

    if (user && user.nEuro) {
      const newNEuro = parseFloat(user.nEuro) - parseFloat(nEuro);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { nEuro: newNEuro.toString() },
      });
    }

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

  async getNEuroStats(): Promise<{ average: number; median: number; mode: number }> {
    const users = await this.prisma.user.findMany();
    const nEuros = users.map(user => parseFloat(user.nEuro));
  
    // Calculate average
    const sum = nEuros.reduce((a, b) => a + b, 0);
    const average = sum / nEuros.length;
  
    // Calculate median
    nEuros.sort((a, b) => a - b);
    const mid = Math.floor(nEuros.length / 2);
    const median = nEuros.length % 2 !== 0 ? nEuros[mid] : (nEuros[mid - 1] + nEuros[mid]) / 2;
  
    // Calculate mode
    const counts = {};
    for (const nEuro of nEuros) {
      if (counts[nEuro]) {
        counts[nEuro]++;
      } else {
        counts[nEuro] = 1;
      }
    }
    let mode = nEuros[0];
    let maxCount = 0;
    for (const nEuro in counts) {
      if (counts[nEuro] > maxCount) {
        maxCount = counts[nEuro];
        mode = parseFloat(nEuro);
      }
    }
  
    return { average, median, mode };
  }

  async updateTotalNEuro() {
    const rounds = await this.prisma.rodada.findMany({
      where: {
        nRodada: {
          gt: '1'
        }
      }
    });
  
    if (rounds.length > 0) {
      const valores = await this.prisma.valores.findFirst({
        where: { grupoId: rounds[0].groupId },
      });
  
      if (valores) {
        const totalNEuro = parseFloat(valores.totalNEuro) + parseFloat(valores.fundoRetido);
  
        await this.prisma.valores.update({
          where: { id: valores.id },
          data: { totalNEuro: totalNEuro.toString() },
        });
      }
    }
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
    const fundoRetido = Math.floor((totalNEuro / totalUsuarios - nEuroPorUsuario) * totalUsuarios);
  
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
        userNEuro += userNEuro * (parseInt(rodada.qntRetribuicao) / 100);
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
