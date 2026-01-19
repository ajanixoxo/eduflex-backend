import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiPropertyOptional({ description: 'Lesson ID for context' })
  @IsString()
  @IsOptional()
  lesson_id?: string;

  @ApiPropertyOptional({ description: 'Source message ID for context' })
  @IsString()
  @IsOptional()
  source_message_id?: string;

  @ApiProperty({ description: 'Target concept/topic for the video' })
  @IsString()
  @IsNotEmpty()
  target_concept: string;

  @ApiProperty({ description: 'Preferred language for narration', default: 'en' })
  @IsString()
  @IsNotEmpty()
  preferred_language: string;

  @ApiProperty({ description: 'Voice profile ID for TTS narration' })
  @IsString()
  @IsNotEmpty()
  voice_profile_id: string;

  @ApiProperty({ description: 'Avatar ID (for future use)' })
  @IsString()
  @IsNotEmpty()
  avatar_id: string;
}
