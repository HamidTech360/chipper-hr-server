import { IsString, IsOptional } from 'class-validator';

export class UpdatePeriodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
