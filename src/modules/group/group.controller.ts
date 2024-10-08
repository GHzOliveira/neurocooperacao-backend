import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { Prisma, Rodada } from '@prisma/client';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Post()
  create(@Body() CreateGrupoDto: CreateGroupDto) {
    const group = this.groupService.createGroup(CreateGrupoDto);
    return group;
  }

  @Get()
  getAll() {
    return this.groupService.getAllGroups();
  }

  @Get(':id/rounds')
  getGroupWithRounds(@Param('id') id: string) {
    return this.groupService.getGroupWithRounds(id);
  }

  @Get(':id/gameRule')
  async getGameRule(@Param('id') id: string): Promise<string> {
    return this.groupService.getGameRule(id);
  }

  @Get(':groupId/round/:nRodada')
  getRoundDetails(@Param('groupId') groupId: string, @Param('nRodada') nRodada: string): Promise<Rodada> {
    return this.groupService.getRoundDetails(groupId, nRodada);
  }

  @Get(':groupId/value/:field')
  async getValue(@Param('groupId') groupId: string, @Param('field') field: keyof Prisma.ValoresUncheckedCreateInput) {
    return this.groupService.getValue(groupId, field);
  }

  @Get('nEuroStats')
  async getNEuroStats(): Promise<{ average: number; median: number; mode: number }> {
    return this.groupService.getNEuroStats();
  }

  @Get(':userId/transaction')
  async getTransaction(@Param('userId') userId: string){
      return this.groupService.getTransaction(userId);
  }

  @Get(':id/nEuro')
  async getNEuro(@Param('id') id: string): Promise<string | null> {
    return this.groupService.getNEuro(id);
  }

  @Get(':groupId/highest-nrodada')
  async getHighestNRodada(): Promise<String> {
    return this.groupService.getHighestNRodada();
  }

  @Post(':userId/transaction')
  async createTransaction(
    @Param('userId') userId: string,
    @Body('roundId') roundId: string,
    @Body('transactionType') transactionType: string,
    @Body('amount') amount: string,
  ) {
    return this.groupService.createTransaction(userId, roundId, transactionType, amount);
  }

  @Delete(':id')
  deleteGroup(@Param('id') id: string) {
    return this.groupService.deleteGroup(id);
  }

  @Delete(':id/users')
  async deleteUsersByGroupId(@Param('id') id: string) {
    return this.groupService.deleteUsersByGroupId(id);
  }

  @Patch(':id/reset-valores')
  async resetValoresByGroupId(@Param('id') id: string) {
    return this.groupService.resetValoresByGroupId(id);
  }

  @Put(':id')
  updateGroup(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.updateGroup(id, updateGroupDto);
  }

  @Put(':groupId/round/:roundId')
  updateRound(
    @Param('roundId') roundId: string,
    @Body()
    data: { nEuro: string; retribuicao: string; qntRetribuicao: string, nRodada: string },
  ) {
    return this.groupService.updateRound(roundId, data);
  }

  @Patch(':groupId/applyNEuro')
  async applyNEuro(
    @Body('userId') userId: string,
    @Param('groupId') groupId: string,
    @Body('nEuro') nEuro: string,
    @Body('totalUsuarios') totalUsuarios: number
  ) {
    return this.groupService.applyNEuro(userId, groupId, nEuro, totalUsuarios);
  }

  @Put(':groupId/updateTotalNEuro')
  @HttpCode(200)
  async updateTotalNEuro() {
    await this.groupService.updateTotalNEuro();
    return { message: 'totalNEuro atualizado com sucesso' };
  }

  @Post(':id/next-round')
  async nextRound(@Param('id') id: string, @Body('nEuro') nEuro: string) {
    return this.groupService.nextRound(id, nEuro);
  }
}
