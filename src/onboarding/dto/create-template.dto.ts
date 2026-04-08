import { IsString, IsArray, IsUUID, ValidateNested, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class ChecklistItemTemplateDto {
  @IsString()
  title: string;

  @IsEnum(Role)
  assignee: Role;

  @IsInt()
  @Min(0)
  @Max(365)
  dueInDays: number;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemTemplateDto)
  items: ChecklistItemTemplateDto[];

  @IsUUID()
  organizationId: string;
}
