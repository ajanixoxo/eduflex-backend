import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class SaveTranscriptDto {
  @ApiProperty({
    description: 'Course ID',
    type: String,
    example: '690b23088c3c3884ccb65f82',
    required: true,
  })
  @IsMongoId()
  course_id: string;

  @ApiProperty({
    description: 'Module number within the course',
    type: Number,
    example: 1,
    required: true,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  module_number: number;

  @ApiProperty({
    description: 'Lesson number within the module',
    type: String,
    example: '1.1',
    required: true,
  })
  @IsString()
  lesson_number: string;

  @ApiProperty({
    description: 'Transcribed user speech',
    type: String,
    example: 'What is photosynthesis?',
    required: true,
  })
  @IsString()
  user_transcript: string;

  @ApiProperty({
    description: 'AI response text',
    type: String,
    example: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
    required: true,
  })
  @IsString()
  ai_response: string;
}

