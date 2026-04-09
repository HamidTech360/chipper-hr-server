import { IsString, IsEnum, IsArray, IsOptional, ValidateNested, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewType, ReviewScope } from '@prisma/client';

export class ReviewQuestionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  required?: boolean;

  @IsOptional()
  options?: string[];
}

export class CreateReviewDto {
  @IsString()
  name: string;

  @IsEnum(ReviewType)
  type: ReviewType;

  @IsEnum(ReviewScope)
  @IsOptional()
  scope?: ReviewScope;

  @IsArray()
  @IsOptional()
  scopeDetails?: string[];

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewQuestionDto)
  @IsOptional()
  questions?: ReviewQuestionDto[];
}
