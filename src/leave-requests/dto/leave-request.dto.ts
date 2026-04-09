import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsString()
  leaveType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateLeaveRequestDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveLeaveRequestDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectLeaveRequestDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
