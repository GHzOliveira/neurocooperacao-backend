import { IsArray, IsInt, IsObject, IsString, Min, isInt, isString } from "class-validator";

class RodadaDto {
    @IsString()
    readonly nEuro: string;

    @IsString()
    readonly retribuicao: string;

    @IsString()
    readonly qntRetribuicao: string;

    @IsString()
    readonly nRodada: string;
}

export class UpdateGroupDto {
    name: string;
}

export class CreateGroupDto {
    @IsString()
    readonly name: string;

    @IsArray()
    @IsObject({ each: true })
    readonly rodada: RodadaDto[];
  }