import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseSectionStatus } from '../enums';

export class UpdateCourseSectionDto {
  @ApiPropertyOptional({
    description: 'Status of the section',
    enum: CourseSectionStatus,
    example: CourseSectionStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(CourseSectionStatus)
  status?: CourseSectionStatus;
}
