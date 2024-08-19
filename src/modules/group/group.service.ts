import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { Prisma, PrismaPromise, Rodada } from '@prisma/client';

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

    // Obtenha a última rodada
  const lastRodada = data.rodada[data.rodada.length - 1];
  const newNRodada = parseInt(lastRodada.nRodada, 10) + 1;

  // Crie uma nova rodada com os mesmos dados da última, mas com o número da rodada incrementado
  await this.prisma.rodada.create({
    data: {
      groupId: group.id,
      nEuro: lastRodada.nEuro,
      retribuicao: lastRodada.retribuicao,
      qntRetribuicao: lastRodada.qntRetribuicao,
      nRodada: newNRodada.toString(), // incrementa o número da rodada
      data: new Date(),
    },
  });

    return group;
  }

  async getHighestNRodada(): Promise<String> {
    const allRounds = await this.prisma.rodada.findMany({
      select: {
        nRodada: true,
      },
    });

    const maxNRodada = Math.max(...allRounds.map(round => Number(round.nRodada)));
    return maxNRodada.toString();
  }


  async deleteGroup(id: string) {
    const group = await this.prisma.grupo.findUnique({
        where: { id: id },
    });

    if (!group) {
        throw new Error(`Group with id ${id} not found`);
    }

    const users = await this.prisma.user.findMany({
        where: {
            grupoId: id,
        },
        select: {
            id: true,
        },
    });

    let userDeletions: PrismaPromise<any>[] = [];

    if (users.length > 0) {
        userDeletions = users.map(user => this.prisma.transaction.deleteMany({
            where: {
                userId: user.id,
            },
        }));
    }

    return this.prisma.$transaction([
        ...userDeletions,
        this.prisma.user.deleteMany({
            where: {
                grupoId: id,
            },
        }),
        this.prisma.rodada.deleteMany({
            where: {
                groupId: id,
            },
        }),
        this.prisma.valores.deleteMany({
            where: {
                grupoId: id,
            },
        }),
        this.prisma.transaction.deleteMany({
            where: {
                user: {
                    grupoId: id,
                }
            },
        }),
        this.prisma.grupo.delete({
            where: {
                id: id,
            },
        }),
    ]);
}

async deleteUsersByGroupId(groupId: string) {
  const users = await this.prisma.user.findMany({
    where: {
      grupoId: groupId,
    },
    select: {
      id: true,
    },
  });

  if (users.length === 0) {
    throw new Error(`Nenhum usuário encontrado para o grupo com ID ${groupId}`);
  }

  const userDeletions = users.map(user => 
    this.prisma.user.delete({
      where: {
        id: user.id,
      },
    })
  );

  await this.prisma.$transaction(userDeletions);

  await this.prisma.valores.updateMany({
    where: { grupoId: groupId },
    data: { totalUsuarios: 0 },
  });

  return { message: `Todos os usuários do grupo com ID ${groupId} foram deletados` };
}

async resetValoresByGroupId(groupId: string) {
  const valores = await this.prisma.valores.findFirst({
    where: { grupoId: groupId },
  });

  if (!valores) {
    throw new Error(`Valores para o grupo com ID ${groupId} não encontrados`);
  }

  await this.prisma.valores.update({
    where: { id: valores.id },
    data: {
      totalNEuro: '0',
      totalUsuarios: 0,
      fundoRetido: '0',
    },
  });

  return { message: `Campos totalNEuro, totalUsuarios e fundoRetido foram zerados para o grupo com ID ${groupId}.` };
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

  async getNEuro(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { nEuro: true },
    });
    return user?.nEuro;
  }

  async getTransaction(userId: string) {
    const transactions =  this.prisma.transaction.findMany({
        where: {
            userId: userId,
        },
        orderBy: {
            roundId: 'asc',
        },
    });
    
    return transactions;
}

  async applyNEuro(userId: string, groupId: string, nEuro: string, totalUsuarios?: number) {
    return this.prisma.$transaction(async (prisma) => {
      let userNEuro;
      const user = await prisma.user.findFirst({
        where: { id: userId, grupoId: groupId },
      });
  
      if (user && user.nEuro) {
        const currentNEuro = user.nEuro ? parseFloat(user.nEuro) : 0;
        const newNEuro = currentNEuro - parseFloat(nEuro);
  
        await prisma.user.update({
          where: { id: user.id },
          data: { nEuro: newNEuro.toString() },
        });
        userNEuro = newNEuro.toString()
      }
  
      let valores = await prisma.valores.findFirst({
        where: { grupoId: groupId },
      });
  
      if (!valores) {
        valores = await prisma.valores.create({
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
        valores = await prisma.valores.update({
          where: { id: valores.id },
          data: { totalNEuro: totalNEuro.toString(), totalUsuarios: newTotalUsuarios },
        });
      }
  
      return { ...valores, userNEuro };
    });
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

  
  async nextRound(groupId: string, nEuro: string) {
    const valores = await this.prisma.valores.findFirst({
      where: { grupoId: groupId },
    });
  
    if (!valores) {
      throw new Error(`Valores para o grupo com ID ${groupId} não encontrados`);
    }
  
    const totalNEuro = parseFloat(valores.totalNEuro);
    console.log('totalNEuro', totalNEuro)
    const totalUsuarios = valores.totalUsuarios;
    console.log('totalUsuarios', totalUsuarios)
    const nEuroPorUsuario = Math.floor(totalNEuro / totalUsuarios);
    console.log('nEuroPorUsuario', nEuroPorUsuario)
    const fundoRetido = Math.floor((totalNEuro / totalUsuarios - nEuroPorUsuario) * totalUsuarios);
    console.log(totalNEuro / totalUsuarios - nEuroPorUsuario)
    console.log('fundoRetido', fundoRetido)
  
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
      console.log('userNEuro', userNEuro)
      
      if (rodada.retribuicao === 'Valor Inteiro') {
        userNEuro += parseInt(rodada.qntRetribuicao);
      } else if (rodada.retribuicao === 'Porcentagem') {
        userNEuro += userNEuro * (parseInt(rodada.qntRetribuicao) / 100);
      }
      console.log('userNEuro depois da retribuição', userNEuro)
      
      const currentUser = await this.prisma.user.findUnique({
        where: { id: user.id, nEuro: user.nEuro},
      });
      console.log('currentUser', currentUser.nEuro)
      
      userNEuro += parseInt(currentUser.nEuro);
      console.log('userNEuro depois de somar com o nEuro atual', userNEuro)
  
      const debug = await this.prisma.user.update({
        where: { id: user.id },
        data: { nEuro: userNEuro.toString() },
      });
      console.log('debug', debug)
    }
    
    await this.prisma.valores.update({
      where: { id: valores.id },
      data: {
        totalNEuro: '0',
        fundoRetido: fundoRetido.toString(),
      },
    });
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
        console.log(parseFloat(valores.totalNEuro))
        console.log(parseFloat(valores.fundoRetido))
        console.log('Soma rodada 2:', parseFloat(valores.totalNEuro) + parseFloat(valores.fundoRetido))
        console.log('totalNEuro', totalNEuro)
  
        await this.prisma.valores.update({
          where: { id: valores.id },
          data: { totalNEuro: totalNEuro.toString() },
        });
      }
    }
  }
}
