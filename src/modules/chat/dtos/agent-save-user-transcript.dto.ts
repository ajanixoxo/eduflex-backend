import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class AgentSaveUserTranscriptDto {
  @ApiProperty({
    description: 'User ID (MongoDB ObjectId) - extract from LiveKit participant identity (e.g., "user-{userId}")',
    type: String,
    example: '507f1f77bcf86cd799439011',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Course ID',
    type: String,
    example: '690b23088c3c3884ccb65f82',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({
    description: 'Module number within the course',
    type: Number,
    example: 1,
    required: true,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  module_number: number;

  @ApiProperty({
    description: 'Lesson number within the module',
    type: String,
    example: '1.1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lesson_number: string;

  @ApiProperty({
    description: 'Transcribed user speech text',
    type: String,
    example: 'What is photosynthesis?',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  user_transcript: string;

  @ApiProperty({
    description: 'LiveKit room name (format: course-{courseId}-module-{moduleNumber}-lesson-{lessonNumber})',
    type: String,
    example: 'course-690b23088c3c3884ccb65f82-module-1-lesson-1.1',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  room_name: string;
}

