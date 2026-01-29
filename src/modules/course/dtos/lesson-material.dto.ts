import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckpointQuestionDto {
  @ApiProperty()
  @IsString()
  question: string;

  @ApiProperty()
  @IsString()
  expected_answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;
}

export class MaterialSectionDto {
  @ApiProperty()
  @IsNumber()
  section_number: number;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  key_points?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  examples?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckpointQuestionDto)
  checkpoint_question?: CheckpointQuestionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teaching_notes?: string;
}

export class MaterialQuizQuestionDto {
  @ApiProperty()
  @IsString()
  question_id: string;

  @ApiProperty()
  @IsString()
  question: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['multiple_choice', 'true_false', 'short_answer'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty()
  @IsString()
  correct_answer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  points?: number;
}

export class CreateLessonMaterialDto {
  @ApiProperty({ description: 'Course ID' })
  @IsString()
  course_id: string;

  @ApiProperty()
  @IsNumber()
  module_number: number;

  @ApiProperty()
  @IsString()
  lesson_number: string;

  @ApiProperty()
  @IsString()
  lesson_title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learning_objectives?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialSectionDto)
  sections?: MaterialSectionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  summary_points?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialQuizQuestionDto)
  quiz?: MaterialQuizQuestionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimated_duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;
}

export class GenerateMaterialsDto {
  @ApiProperty({ description: 'Course ID' })
  @IsString()
  course_id: string;

  @ApiPropertyOptional({ description: 'Regenerate even if materials exist' })
  @IsOptional()
  @IsBoolean()
  force_regenerate?: boolean;
}

export class GetMaterialDto {
  @ApiProperty()
  @IsString()
  course_id: string;

  @ApiProperty()
  @IsNumber()
  module_number: number;

  @ApiProperty()
  @IsString()
  lesson_number: string;
}

export class ListMaterialsDto {
  @ApiProperty()
  @IsString()
  course_id: string;
}
