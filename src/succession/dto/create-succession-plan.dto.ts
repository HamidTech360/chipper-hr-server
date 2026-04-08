import { IsString, IsOptional, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SuccessorDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  readiness: 'Ready Now' | '1 Year' | '2+ Years';
}

export class CreateSuccessionPlanDto {
  @IsString()
  roleTitle: string;

  @IsUUID()
  currentHolderId: string;

  @IsArray()
  @IsString({ each: true })
  riskIndicators: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuccessorDto)
  successors: SuccessorDto[];
}

export class UpdateSuccessionPlanDto {
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @IsOptional()
  @IsUUID()
  currentHolderId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskIndicators?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuccessorDto)
  successors?: SuccessorDto[];
}
