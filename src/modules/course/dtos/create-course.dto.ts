import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  CourseStatus,
  Language,
  TeachingStyle,
  Pace,
  ExperienceLevel,
  LearningPreference,
  TimeDedication,
  CourseFormatAddons,
} from '../enums';

export class CreateCourseDto {
  user: string;

  @ApiProperty({
    description: 'Course topic or title',
    example: 'Python Programming',
  })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({
    description: 'Reason for taking the course',
    example: 'To build web apps',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Experience level of the learner',
    enum: ExperienceLevel,
    default: ExperienceLevel.BEGINNER,
    example: 'beginner',
  })
  @IsNotEmpty()
  @IsEnum(ExperienceLevel)
  experience_level: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Preferred course language',
    enum: Language,
    default: Language.EN,
    example: 'en',
  })
  @IsNotEmpty()
  @IsEnum(Language)
  language: Language;

  @ApiPropertyOptional({
    description: 'Teaching style preference',
    enum: TeachingStyle,
    default: TeachingStyle.CASUAL,
    example: 'casual',
  })
  @IsNotEmpty()
  @IsEnum(TeachingStyle)
  teaching_style: TeachingStyle;

  @ApiPropertyOptional({
    description: 'Learning preference (content type mix)',
    enum: LearningPreference,
    default: LearningPreference.MIXED,
    example: 'mixed',
  })
  @IsNotEmpty()
  @IsEnum(LearningPreference)
  learning_preference: LearningPreference;

  @ApiPropertyOptional({
    description: 'Time dedication per study session',
    enum: TimeDedication,
    default: TimeDedication.M30,
    example: '30m',
  })
  @IsNotEmpty()
  @IsEnum(TimeDedication)
  time_dedication: TimeDedication;

  @ApiPropertyOptional({
    description: 'Target completion date',
    example: '2025-12-31',
  })
  @IsNotEmpty()
  @IsDateString()
  target_completion: string;

  @ApiPropertyOptional({
    description: 'Additional course format options',
    enum: CourseFormatAddons,
    isArray: true,
    example: ['videos', 'practice quizzes'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CourseFormatAddons, { each: true })
  course_format_addons?: CourseFormatAddons[];

  @ApiPropertyOptional({
    description: 'Preferred learning pace',
    enum: Pace,
    default: Pace.MEDIUM,
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(Pace)
  pace?: Pace;
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
  @IsBoolean()
  is_favourite?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as bookmarked',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_bookmarked?: boolean;
}
