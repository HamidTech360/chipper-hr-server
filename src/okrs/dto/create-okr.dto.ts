import { IsString, IsEnum, IsArray, IsOptional, IsUUID, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { OkrType } from '@prisma/client';

export class KeyResultDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  targetValue?: number;
}

export class CreateOkrDto {
  @IsString()
  objective: string;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsEnum(OkrType)
  type: OkrType;

  @IsUUID()
  @IsOptional()
  reviewerId?: string;

  @IsUUID()
  @IsOptional()
  alignedToId?: string;

  @IsUUID()
  periodId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyResultDto)
  @IsOptional()
  keyResults?: KeyResultDto[];
}
