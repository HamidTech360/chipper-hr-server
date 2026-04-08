import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistItemTemplateDto } from './create-template.dto';

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemTemplateDto)
  @IsOptional()
  items?: ChecklistItemTemplateDto[];
}
