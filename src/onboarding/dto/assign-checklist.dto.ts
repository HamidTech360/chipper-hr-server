import { IsString, IsArray, IsUUID, IsEnum } from 'class-validator';
import { ChecklistType } from '@prisma/client';

export class AssignChecklistDto {
  @IsUUID()
  templateId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @IsEnum(ChecklistType)
  type: ChecklistType;
}
