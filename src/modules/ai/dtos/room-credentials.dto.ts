import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class RoomCredentialsDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  courseId: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @Type(() => Number)
  @IsNumber()
  moduleNumber: number;

  @ApiProperty({ example: '1.1' })
  @IsString()
  lessonNumber: string;
}
