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
  TeachingStyle,
  Pace,
  ExperienceLevel,
} from '../enums';

export class ListCoursesDto extends BaseListDto {
  @ApiPropertyOptional({
    description: 'Filter by Course Status',
    enum: CourseStatus,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    description: 'Filter by Language',
    enum: Language,
  })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({
    description: 'Filter by Skill Level',
    enum: ExperienceLevel,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Filter by Learning Style',
    enum: TeachingStyle,
  })
  @IsOptional()
  @IsEnum(TeachingStyle)
  teaching_style?: TeachingStyle;

  @ApiPropertyOptional({
    description: 'Filter by Pace',
    enum: Pace,
  })
  @IsOptional()
  @IsEnum(Pace)
  pace?: Pace;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @ApiPropertyOptional({
    description: 'Return only favourite courses',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  is_favourite?: boolean;

  @ApiPropertyOptional({
    description: 'Return only bookmarked courses',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  is_bookmarked?: boolean;
}
