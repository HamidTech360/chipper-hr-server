import { IsString, IsUUID, IsArray, IsNotEmpty } from 'class-validator';

export class CreatePipDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];

  @IsUUID()
  organizationId: string;
}
