import { IsString, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @IsString()
  name: string;
}

export class BulkCreateDepartmentDto {
  @IsArray()
  @IsString({ each: true })
  names: string[];

  @IsUUID()
  organizationId: string;
}
