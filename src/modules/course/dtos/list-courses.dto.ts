import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseListDto } from 'src/modules/shared/dtos';
import {
  CourseStatus,
  Language,
  LearningStyle,
  Pace,
  SkillLevel,
} from '../enums';

export class ListCoursesDto extends BaseListDto {
  @ApiPropertyOptional({
    description: 'Filter by Course Status',
    enum: CourseStatus,
    example: CourseStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    description: 'Filter by Language',
    enum: Language,
    example: Language.EN,
  })
  @IsOptional()
  @IsEnum(Language)
  preferred_language?: Language;

  @ApiPropertyOptional({
    description: 'Filter by Skill Level',
    enum: SkillLevel,
    example: SkillLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skill_level?: SkillLevel;

  @ApiPropertyOptional({
    description: 'Filter by Learning Style',
    enum: LearningStyle,
    example: LearningStyle.CASUAL,
  })
  @IsOptional()
  @IsEnum(LearningStyle)
  learning_style?: LearningStyle;

  @ApiPropertyOptional({
    description: 'Filter by Pace',
    enum: Pace,
    example: Pace.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Pace)
  pace?: Pace;

  @ApiPropertyOptional({
    description: 'Filter by User ID',
    example: '66f59ac2234fa62b109d1b8e',
  })
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Return only favourite courses',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  is_favourite?: boolean;

  @ApiPropertyOptional({
    description: 'Return only bookmarked courses',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  is_bookmarked?: boolean;
}
