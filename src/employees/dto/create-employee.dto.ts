import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { Role, EmploymentType } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  jobTitle: string;

  @IsUUID()
  departmentId: string;

  @IsUUID()
  @IsOptional()
  managerId?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsString()
  @IsOptional()
  workLocation?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  organizationId: string;

  @IsBoolean()
  @IsOptional()
  sendWelcomeEmail?: boolean;
}
