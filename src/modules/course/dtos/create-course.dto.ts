import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import {
  CourseStatus,
  Language,
  LearningStyle,
  Pace,
  SkillLevel,
} from '../enums';

export class CreateCourseDto {
  user_id: string;

  @ApiProperty({
    description: 'Course topic or title',
    example: 'Introduction to Machine Learning',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({
    description: 'Preferred course language',
    enum: Language,
    default: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  preferred_language?: Language;

  @ApiPropertyOptional({
    description: 'Learning pace',
    enum: Pace,
    default: Pace.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Pace)
  pace?: Pace;

  @ApiPropertyOptional({
    description: 'Skill level of the learner',
    enum: SkillLevel,
    default: SkillLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skill_level?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Preferred learning style',
    enum: LearningStyle,
    default: LearningStyle.CASUAL,
  })
  @IsOptional()
  @IsEnum(LearningStyle)
  learning_style?: LearningStyle;
}
export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional({
    description: 'Course status',
    enum: CourseStatus,
    example: CourseStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    description: 'Mark as favourite',
    example: true,
  })
  @IsOptional()
  is_favourite?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as bookmarked',
    example: false,
  })
  @IsOptional()
  is_bookmarked?: boolean;
}
