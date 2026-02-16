import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    enum: ['beginner', 'intermediate', 'advanced'],
    description: 'User experience level',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  experience_level?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Preferred teaching style',
  })
  @IsOptional()
  @IsString()
  teaching_style?: string;
}
