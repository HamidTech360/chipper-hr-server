import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  name: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  organizationId: string;
}
