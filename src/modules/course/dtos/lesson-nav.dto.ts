import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class LessonNavDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  module_number: number;

  @ApiProperty({ example: '1.2' })
  @IsString()
  lesson_number: string;
}
