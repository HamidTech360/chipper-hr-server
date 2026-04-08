import { IsString, IsEnum, IsArray, IsOptional, IsUUID, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { OkrType } from '@prisma/client';

export class KeyResultUpdateDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  targetValue?: number;
}

export class UpdateOkrDto {
  @IsString()
  @IsOptional()
  objective?: string;

  @IsEnum(OkrType)
  @IsOptional()
  type?: OkrType;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsUUID()
  @IsOptional()
  reviewerId?: string | null;

  @IsString()
  @IsOptional()
  alignedToId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyResultUpdateDto)
  @IsOptional()
  keyResults?: KeyResultUpdateDto[];
}
