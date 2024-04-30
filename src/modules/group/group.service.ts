import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateGroupDto, UpdateGroupDto } from "./dto/create-group.dto";
import { Rodada } from "@prisma/client";

@Injectable()
export class GroupService {
    constructor(private prisma: PrismaService) { }

    async getAllGroups() {
      return this.prisma.grupo.findMany()
    }

    async getGroupWithRounds(id: string) {
      return this.prisma.grupo.findUnique({
        where: {
          id: id,
        },
        include: {
          rodada: true,
        }
      })
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
          data: true
        },
      });
    
      if (!round) {
        throw new Error(`Rodada com nRodada ${nRodada} não encontrada para o grupo ${groupId}`);
      }
    
      return round;
    }

    async createGroup(data: CreateGroupDto) {
      if (!data.name) {
        throw new HttpException('Nome do grupo é obrigatório', HttpStatus.BAD_REQUEST);
      }

      const existingGroup = await this.prisma.grupo.findUnique({
        where: {
          nome: data.name,
        }
      });
      

      if (existingGroup) {
        throw new HttpException('Grupo já existe', HttpStatus.CONFLICT);
      }

        const group = await this.prisma.grupo.create({
          data: {
            nome: data.name,
          }
        })

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
      })
      await this.prisma.rodada.deleteMany({
        where: {
          groupId: id,
        }
      });

      return this.prisma.grupo.delete({
        where: {
          id: id,
        }
      })
    }

    async updateGroup(id: string, data: UpdateGroupDto) {
      return this.prisma.grupo.update({
        where: {
          id: id,
        },
        data: {
          nome: data.name,
        }
      })
    }

    async updateRound(id: string, data: { nEuro: string, retribuicao: string, qntRetribuicao: string, nRodada: string }) {
      return this.prisma.rodada.update({
          where: {
              id: id,
          },
          data: {
              nEuro: data.nEuro,
              retribuicao: data.retribuicao,
              qntRetribuicao: data.qntRetribuicao,
              nRodada: data.nRodada,
          }
      })
  }
}