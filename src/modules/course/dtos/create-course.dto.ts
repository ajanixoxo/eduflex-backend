import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
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
  CourseMode,
  GradeLevel,
  ExamType,
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

  @ApiProperty({
    description: 'AI Voice ID for the course',
    example: '67473c52d9c3d52f6e7e26ac',
  })
  @IsString()
  @IsMongoId()
  ai_voice: string;

  @ApiProperty({
    description: 'AI Avatar ID for the course',
    example: '67473c52d9c3d52f6e7e26ad',
  })
  @IsString()
  @IsMongoId()
  ai_avatar: string;

  // Quiz Mode fields
  @ApiPropertyOptional({
    description: 'Course mode (learning or exam prep)',
    enum: CourseMode,
    default: CourseMode.LEARNING,
    example: 'learning',
  })
  @IsOptional()
  @IsEnum(CourseMode)
  course_mode?: CourseMode;

  @ApiPropertyOptional({
    description: 'Grade level for exam prep mode',
    enum: GradeLevel,
    example: 'high_school',
  })
  @IsOptional()
  @IsEnum(GradeLevel)
  grade_level?: GradeLevel;

  @ApiPropertyOptional({
    description: 'Exam type for quiz generation (JAMB, WAEC, NECO, etc.)',
    enum: ExamType,
    example: 'JAMB',
  })
  @IsOptional()
  @IsEnum(ExamType)
  exam_type?: ExamType;

  @ApiPropertyOptional({
    description: 'Selected exam topics',
    isArray: true,
    example: ['algebra', 'geometry'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exam_topics?: string[];
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
