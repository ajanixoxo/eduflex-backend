import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GradeLevel, Language } from '../enums';

export class GenerateExamTopicsDto {
  @ApiProperty({
    description: 'Main topic for exam preparation',
    example: 'Laws of Motion',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({
    description: 'Grade level for difficulty adjustment',
    enum: GradeLevel,
    example: 'high_school',
  })
  @IsEnum(GradeLevel)
  @IsNotEmpty()
  grade_level: GradeLevel;

  @ApiPropertyOptional({
    description: 'Language for topic generation',
    enum: Language,
    default: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}

export interface GeneratedSubtopic {
  name: string;
  description?: string;
}

export interface GenerateExamTopicsResponse {
  topic: string;
  grade_level: string;
  subtopics: GeneratedSubtopic[];
}
