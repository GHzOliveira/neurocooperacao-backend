import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/create-group.dto';
import { Rodada } from '@prisma/client';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

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

  @Delete(':id')
  deleteGroup(@Param('id') id: string) {
    return this.groupService.deleteGroup(id);
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
}
