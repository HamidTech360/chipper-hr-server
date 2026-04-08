import { IsString, IsOptional, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class HrAdminDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  employmentType?: string;
}

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @ValidateNested()
  @Type(() => HrAdminDto)
  @IsOptional()
  hrAdmin?: HrAdminDto;
}
