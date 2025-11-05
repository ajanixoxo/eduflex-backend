import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MarkLessonCompleteDto {
  @ApiProperty({
    description: 'Unique identifier of the course',
    example: '671a9d6e8d4f5c001f1e9a3c',
  })
  @IsMongoId()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({
    description: 'The module number containing the lesson to mark complete',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  module_number: number;

  @ApiProperty({
    description: 'Lesson number to mark as completed',
    example: '3',
  })
  @IsString()
  @IsNotEmpty()
  lesson_number: string;
}
