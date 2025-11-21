import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class ChangeCourseAIAvatarDto {
  @ApiProperty({
    description: 'ID of the course to update',
    example: '64f8d3b2a5f4c9b123456789',
  })
  @IsString()
  @IsMongoId()
  course_id: string;

  @ApiProperty({
    description: 'ID of the AI Avatar to assign to the course',
    example: '67473c52d9c3d52f6e7e26ac',
  })
  @IsString()
  @IsMongoId()
  ai_avatar_id: string;
}

export class ChangeCourseAIVoiceDto {
  @ApiProperty({
    description: 'ID of the course to update',
    example: '64f8d3b2a5f4c9b123456789',
  })
  @IsString()
  @IsMongoId()
  course_id: string;

  @ApiProperty({
    description: 'ID of the AI Voice to assign to the course',
    example: '67473c52d9c3d52f6e7e26ad',
  })
  @IsString()
  @IsMongoId()
  ai_voice_id: string;
}
