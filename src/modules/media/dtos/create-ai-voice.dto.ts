import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { AIAccent } from '../enums';

export class CreateAiVoiceDto {
  @ApiProperty({
    description: 'The uploaded media ID that will be used for AI Voice',
    example: '67473c52d9c3d52f6e7e26ac',
  })
  @IsString()
  @IsMongoId()
  media_id: string;

  @ApiProperty({
    description: 'Optional name for the AI Voice',
    example: 'My Custom Voice',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Optional description for the AI Voice',
    example: 'A friendly US English voice',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Optional accent for the AI Voice',
    enum: AIAccent,
    required: false,
  })
  @IsOptional()
  @IsEnum(AIAccent)
  accent?: AIAccent;
}

export class UpdateAiVoiceDto extends PartialType(CreateAiVoiceDto) {}
