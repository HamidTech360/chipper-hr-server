import { IsString, IsEnum, IsArray, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewType, ReviewScope, ReviewCycleStatus } from '@prisma/client';
import { QuestionDto } from './create-cycle.dto';

export class UpdateCycleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ReviewType)
  @IsOptional()
  type?: ReviewType;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  selfReviewDeadline?: string;

  @IsString()
  @IsOptional()
  peerReviewDeadline?: string;

  @IsString()
  @IsOptional()
  managerReviewDeadline?: string;

  @IsString()
  @IsOptional()
  shareBackDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  reviewerTypes?: string[];

  @IsBoolean()
  @IsOptional()
  anonymousPeer?: boolean;

  @IsEnum(ReviewScope)
  @IsOptional()
  scope?: ReviewScope;

  @IsString()
  @IsOptional()
  scopeDetails?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @IsOptional()
  questions?: QuestionDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participants?: string[];

  @IsEnum(ReviewCycleStatus)
  @IsOptional()
  status?: ReviewCycleStatus;
}
