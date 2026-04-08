import { IsString, IsEnum, IsArray, IsOptional, IsBoolean, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewType, ReviewScope } from '@prisma/client';

export class QuestionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  text: string;

  @IsString()
  type: 'RATING_5' | 'RATING_10' | 'OPEN_TEXT' | 'MULTIPLE_CHOICE' | 'COMPETENCY';

  @IsBoolean()
  required: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

export class CreateCycleDto {
  @IsString()
  name: string;

  @IsEnum(ReviewType)
  type: ReviewType;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  selfReviewDeadline: string;

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
  reviewerTypes: string[];

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
  questions: QuestionDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  participantIds: string[];

  @IsUUID()
  organizationId: string;
}
