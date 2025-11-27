import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseListDto } from 'src/modules/shared/dtos';
import { ChatSender } from '../schemas';

export class SendChatMessageDto {
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
    description: 'Message content',
    type: String,
    example: 'What is the topic of this lesson?',
    required: true,
  })
  @IsString()
  message: string;
  user: string;
}
